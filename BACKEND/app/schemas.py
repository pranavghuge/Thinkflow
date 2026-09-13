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
# Custom Problems (Deep Dive mode)
# ---------------------------------------------------------

class CustomProblemRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)


class AIGeneratedExample(BaseModel):
    input: str
    output: str
    explanation: str | None = None


class AIGeneratedProblem(BaseModel):
    """
    recognized=False means the model could not confidently match the
    given name to a real, well-known DSA/coding-interview problem. In
    that case every other field is null and the endpoint must refuse
    to create a problem, rather than falling back to invention.
    """
    recognized: bool
    title: str | None = None
    statement: str | None = None
    category: Literal[
        "Arrays & Strings",
        "Linked Lists & Stacks",
        "Trees & Graphs",
        "Heap & Sorting",
    ] | None = None
    pattern: str | None = None
    difficulty: Literal["Easy", "Medium", "Hard"] | None = None
    examples: list[AIGeneratedExample] | None = None
    constraints: list[str] | None = None
    time_complexity: str | None = None
    space_complexity: str | None = None


class CustomProblemResponse(BaseModel):
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
    source: str

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
    Validates the raw structured output from the LLM, including the
    model's own reasoned verdict. The prompt contains detailed,
    correctness-first verdict logic — that reasoning is only meaningful
    if the verdict is taken directly from the model's output, not
    recomputed by averaging the four scores afterward.
    """
    pattern_score: int = Field(..., ge=0, le=100)
    correctness_score: int = Field(..., ge=0, le=100)
    complexity_score: int = Field(..., ge=0, le=100)
    edge_case_score: int = Field(..., ge=0, le=100)
    overall_verdict: Literal["strong", "needs_improvement", "incorrect"]
    feedback: ApproachFeedback

class AIGeneratedHint(BaseModel):
    hint_text: str = Field(..., min_length=1, max_length=400)
# ---------------------------------------------------------
# Approach Evaluation — API response (after verdict computed)
# ---------------------------------------------------------

class ApproachEvaluationResponse(BaseModel):
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
    overall_verdict: Literal["strong", "needs_improvement", "incorrect"] | None
    source: str

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
    hints_used: int
  