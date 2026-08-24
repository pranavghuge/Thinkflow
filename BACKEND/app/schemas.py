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


class SessionSummaryResponse(BaseModel):
    recognition_time: int | None
    pattern_match: bool | None
    claimed_pattern: str | None
    detected_pattern: str | None
    attempt_count: int
    status: str

           