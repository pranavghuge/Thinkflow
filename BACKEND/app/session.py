import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from .services.approach_evaluator import evaluate_approach,compute_verdict
from .auth import get_current_user
from .database import get_db
from .models import (
    User,
    Session as SessionModel,
    Problem,
    Approach,
    Evaluation,
    ProblemHint,
    SessionEvent,
)
from .schemas import (
    CreateSessionRequest,
    RecognitionRequest,
    ApproachRequest,
    ApproachSubmissionResponse,
    SessionDetailResponse,
    HintResponse,
    SessionSummaryResponse,
    ApproachEvaluationResponse,
    ApproachFeedback,
)

router = APIRouter(prefix="/sessions", tags=["Sessions"])

MAX_APPROACH_ATTEMPTS = 2 
MAX_HINT_LEVEL = 5      


def get_owned_session(
    session_id: str,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionModel:
    """
    Shared ownership check, reused across every session endpoint.
    Returns the session only if it exists AND belongs to the caller.
    """
    session = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == session_id,
            SessionModel.user_id == current_user.id,
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return session

def log_event(
    db: DBSession,
    session: SessionModel,
    event_type: str,
    event_data: dict | None = None,
):
    event = SessionEvent(
        session_id=session.id,
        user_id=session.user_id,
        event_type=event_type,
        event_data=event_data,
    )

    db.add(event)

def build_session_detail(session: SessionModel, db: DBSession) -> SessionDetailResponse:
    latest_approach = (
        db.query(Approach)
        .filter(Approach.session_id == session.id)
        .order_by(Approach.attempt_number.desc())
        .first()
    )

    overall_verdict = None
    if latest_approach is not None:
        evaluation = (
            db.query(Evaluation)
            .filter(Evaluation.approach_id == latest_approach.id)
            .first()
        )
        if evaluation is not None:
            overall_verdict = evaluation.overall_verdict

    return SessionDetailResponse(
        id=session.id,
        problem_id=session.problem_id,
        status=session.status,
        recognition_time=session.recognition_time,
        claimed_pattern=session.claimed_pattern,
        detected_pattern=session.detected_pattern,
        pattern_match=session.pattern_match,
        current_hint_level=session.current_hint_level,
        started_at=session.started_at,
        ended_at=session.ended_at,
        overall_verdict=overall_verdict,
    )

@router.post("", response_model=SessionDetailResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    data: CreateSessionRequest,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = db.query(Problem).filter(Problem.id == data.problem_id).first()

    if problem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found",
        )

    session = SessionModel(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        problem_id=problem.id,
        status="recognition_in_progress",
    )

    db.add(session)

    log_event(
        db,
        session,
        "session_created",
        {
            "problem_id": problem.id,
        },
    )

    db.commit()
    db.refresh(session)

    return build_session_detail(session, db)

@router.get("", response_model=list[SessionDetailResponse])
def list_sessions(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions= (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.started_at.desc())
        .all()
    )

    return [build_session_detail(s, db) for s in sessions] 


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session: SessionModel = Depends(get_owned_session),
    db: DBSession = Depends(get_db),
):
    return build_session_detail(session, db)


@router.patch("/{session_id}/recognition", response_model=SessionDetailResponse)
def update_recognition(
    data: RecognitionRequest,
    session: SessionModel = Depends(get_owned_session),
    db: DBSession = Depends(get_db),
):
    if session.status != "recognition_in_progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recognition phase already completed for this session",
        )

    problem = db.query(Problem).filter(Problem.id == session.problem_id).first()

    # Server-side elapsed time — never trust a client-supplied duration.
    elapsed_seconds = int(
        (datetime.now(timezone.utc) - session.started_at).total_seconds()
    )
    session.recognition_time = elapsed_seconds

    if data.outcome == "stuck":
        session.claimed_pattern = None
        session.detected_pattern = problem.pattern
        session.pattern_match = False
    else:  # "recognized"
        session.claimed_pattern = data.claimed_pattern
        session.detected_pattern = problem.pattern
        # Ground-truth comparison for curated problems. Real Pattern
        # Detector AI service replaces this equality check later —
        # see mvp-scope.md, Deliberate Cuts (AI quality risk).
        session.pattern_match = (
        data.claimed_pattern.strip().casefold()
        == problem.pattern.strip().casefold()
        )

    session.status = "recognition_complete"

    log_event(
        db,
        session,
        "recognition_submitted",
        {
            "outcome": data.outcome,
            "claimed_pattern": data.claimed_pattern,
            "detected_pattern": problem.pattern,
            "pattern_match": session.pattern_match,
            "recognition_time": elapsed_seconds,
        },
    )

    db.commit()
    db.refresh(session)

    return build_session_detail(session, db)

@router.post("/{session_id}/approach", response_model=ApproachSubmissionResponse)
def submit_approach(
    data: ApproachRequest,
    session: SessionModel = Depends(get_owned_session),
    db: DBSession = Depends(get_db),
):
    if session.status not in ("recognition_complete", "approach_submitted"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session is not ready for an approach submission",
        )

    existing_attempts = (
        db.query(Approach)
        .filter(Approach.session_id == session.id)
        .count()
    )

    if existing_attempts >= MAX_APPROACH_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum of {MAX_APPROACH_ATTEMPTS} approach attempts reached",
        )

    attempt_number = existing_attempts + 1

    problem = (
        db.query(Problem)
        .filter(Problem.id == session.problem_id)
        .first()
    )

    if problem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found",
        )

    try:
        ai_result = evaluate_approach(
            problem_statement=problem.statement,
            problem_pattern=problem.pattern,
            expected_time_complexity=problem.time_complexity,
            expected_space_complexity=problem.space_complexity,
            approach=data.content.strip(),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Approach evaluation failed. Please try submitting again.",
        )

    verdict = compute_verdict(ai_result)

    approach = Approach(
        session_id=session.id,
        approach_text=data.content.strip(),
        attempt_number=attempt_number,
    )
    db.add(approach)
    db.flush()

    db.add(
        Evaluation(
            approach_id=approach.id,
            pattern_score=ai_result.pattern_score,
            complexity_score=ai_result.complexity_score,
            correctness_score=ai_result.correctness_score,
            edge_case_score=ai_result.edge_case_score,
            overall_verdict=verdict,
            feedback=ai_result.feedback.model_dump_json(),
        )
    )

    session.status = "approach_submitted"

    log_event(
        db,
        session,
        "approach_submitted",
        {"attempt_number": attempt_number},
    )

    log_event(
        db,
        session,
        "approach_evaluated",
        {
            "attempt_number": attempt_number,
            "pattern_score": ai_result.pattern_score,
            "complexity_score": ai_result.complexity_score,
            "correctness_score": ai_result.correctness_score,
            "edge_case_score": ai_result.edge_case_score,
            "overall_verdict": verdict,
        },
    )

    db.commit()

    return ApproachSubmissionResponse(
        attempt_number=attempt_number,
        approach=approach.approach_text,
        evaluation=ApproachEvaluationResponse(
            pattern_score=ai_result.pattern_score,
            complexity_score=ai_result.complexity_score,
            correctness_score=ai_result.correctness_score,
            edge_case_score=ai_result.edge_case_score,
            overall_verdict=verdict,
            feedback=ai_result.feedback,
        ),
    )

@router.post("/{session_id}/hints", response_model=HintResponse)
def request_hint(
    session: SessionModel = Depends(get_owned_session),
    db: DBSession = Depends(get_db),
):
    if session.current_hint_level >= MAX_HINT_LEVEL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum hint level already reached",
        )

    next_level = session.current_hint_level + 1

    hint = (
        db.query(ProblemHint)
        .filter(
            ProblemHint.problem_id == session.problem_id,
            ProblemHint.level == next_level,
        )
        .first()
    )

    if hint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No hint available at level {next_level} for this problem",
        )

    session.current_hint_level = next_level

    log_event(
        db,
        session,
        "hint_requested",
        {"hint_level": next_level},
    )

    db.commit()
    db.refresh(session)

    return HintResponse(
        id=session.id,
        problem_id=session.problem_id,
        status=session.status,
        recognition_time=session.recognition_time,
        claimed_pattern=session.claimed_pattern,
        detected_pattern=session.detected_pattern,
        pattern_match=session.pattern_match,
        current_hint_level=session.current_hint_level,
        started_at=session.started_at,
        ended_at=session.ended_at,
        hint_text=hint.hint_text,
    )

@router.get("/{session_id}/summary", response_model=SessionSummaryResponse)
def get_summary(
    session: SessionModel = Depends(get_owned_session),
    db: DBSession = Depends(get_db),
):
    attempt_count = (
        db.query(Approach)
        .filter(Approach.session_id == session.id)
        .count()
    )

    latest_approach = (
        db.query(Approach)
        .filter(Approach.session_id == session.id)
        .order_by(Approach.attempt_number.desc())
        .first()
    )

    overall_verdict = None
    feedback = None

    if latest_approach is not None:
        evaluation = (
            db.query(Evaluation)
            .filter(Evaluation.approach_id == latest_approach.id)
            .first()
        )

        if evaluation is not None:
            overall_verdict = evaluation.overall_verdict
            feedback = ApproachFeedback.model_validate_json(evaluation.feedback)

    return SessionSummaryResponse(
        recognition_time=session.recognition_time,
        pattern_match=session.pattern_match,
        claimed_pattern=session.claimed_pattern,
        detected_pattern=session.detected_pattern,
        attempt_count=attempt_count,
        status=session.status,
        overall_verdict=overall_verdict,
        feedback=feedback,
        hints_used=session.current_hint_level,
    )