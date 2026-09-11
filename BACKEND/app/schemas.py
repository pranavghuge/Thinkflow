from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------
# Auth
# ---------------------------------------------------------

class SignupRequest(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------
# Problems
# ---------------------------------------------------------

class ProblemSummary(BaseModel):
    id: str
    difficulty: str
    category: str

    class Config:
        from_attributes = True

class ProblemDetail(BaseModel):
    id: str
    title: str
    category: str
    pattern: str
    difficulty: str
    statement: str
    examples: list[dict]
    constraints: list[str]
    time_complexity: str | None
    space_complexity: str | None

    class Config:
        from_attributes = True
# ---------------------------------------------------------
# Sessions
# ---------------------------------------------------------

class CreateSessionRequest(BaseModel):
    problem_id: str


class RecognitionRequest(BaseModel):
    outcome: Literal["recognized", "stuck"]
    claimed_pattern: str | None = None


class ApproachRequest(BaseModel):
    content: str = Field(..., min_length=1)


# ---------------------------------------------------------
# Approach Evaluation — AI output (raw, from the LLM)
# ---------------------------------------------------------

class ApproachFeedback(BaseModel):
    strength: str = Field(..., max_length=200)
    gap: str = Field(..., max_length=200)
    improve: str = Field(..., max_length=200)


class AIApproachEvaluation(BaseModel):
    """
    Validates the raw structured output from the LLM.
    Deliberately has NO verdict field — the model never decides
    verdict, per ThinkFlow's core architecture. The verdict is always
    computed deterministically in Python from these four scores.
    """
    pattern_score: int = Field(..., ge=0, le=100)
    correctness_score: int = Field(..., ge=0, le=100)
    complexity_score: int = Field(..., ge=0, le=100)
    edge_case_score: int = Field(..., ge=0, le=100)
    feedback: ApproachFeedback


# ---------------------------------------------------------
# Approach Evaluation — API response (after verdict computed)
# ---------------------------------------------------------

class ApproachEvaluationResponse(BaseModel):
    """
    What the frontend actually receives. overall_verdict is computed
    in Python from the four scores — never taken from the AI response.
    """
    pattern_score: int
    correctness_score: int
    complexity_score: int
    edge_case_score: int

    overall_verdict: Literal["strong", "needs_improvement", "incorrect"]

    feedback: ApproachFeedback

    class Config:
        from_attributes = True


class ApproachSubmissionResponse(BaseModel):
    attempt_number: int
    approach: str
    evaluation: ApproachEvaluationResponse


# ---------------------------------------------------------
# Session detail / summary
# ---------------------------------------------------------

class SessionDetailResponse(BaseModel):
    id: str
    problem_id: str
    status: str
    recognition_time: int | None
    claimed_pattern: str | None
    detected_pattern: str | None
    pattern_match: bool | None
    current_hint_level: int
    started_at: datetime
    ended_at: datetime | None

    class Config:
        from_attributes = True

class HintResponse(BaseModel):
    id: str
    problem_id: str
    status: str
    recognition_time: int | None
    claimed_pattern: str | None
    detected_pattern: str | None
    pattern_match: bool | None
    current_hint_level: int
    started_at: datetime
    ended_at: datetime | None
    hint_text: str

    class Config:
        from_attributes = True

class SessionSummaryResponse(BaseModel):
    recognition_time: int | None
    pattern_match: bool | None
    claimed_pattern: str | None
    detected_pattern: str | None
    attempt_count: int
    status: str
    overall_verdict: Literal["strong", "needs_improvement", "incorrect"] | None
    feedback: ApproachFeedback | None
    