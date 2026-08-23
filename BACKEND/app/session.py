import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from .auth import get_current_user
from .database import get_db
from .models import User, Session as SessionModel, Problem, Approach, ProblemHint
from .schemas import (
    CreateSessionRequest,
    RecognitionRequest,
    ApproachRequest,
    SessionDetailResponse,
    SessionSummaryResponse,
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
    db.commit()
    db.refresh(session)

    return session


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session: SessionModel = Depends(get_owned_session),
):
    return session


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
        session.pattern_match = (data.claimed_pattern == problem.pattern)

    session.status = "recognition_complete"

    db.commit()
    db.refresh(session)

    return session


@router.post("/{session_id}/approach", response_model=SessionDetailResponse)
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

    approach = Approach(
        session_id=session.id,
        approach_text=data.content,
        attempt_number=existing_attempts + 1,
    )
    db.add(approach)

    session.status = "approach_submitted"
    # Actual rubric evaluation (Approach Evaluation Service) is wired
    # in a later step — this only persists the attempt for now.

    db.commit()
    db.refresh(session)

    return session


@router.post("/{session_id}/hints", response_model=SessionDetailResponse)
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
    db.commit()
    db.refresh(session)

    return session


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

    return SessionSummaryResponse(
        recognition_time=session.recognition_time,
        pattern_match=session.pattern_match,
        claimed_pattern=session.claimed_pattern,
        detected_pattern=session.detected_pattern,
        attempt_count=attempt_count,
        status=session.status,
    )