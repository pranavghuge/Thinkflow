from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime,JSON, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(100), nullable=False)
    encrypted_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (UniqueConstraint('user_id', name='unique_user_api_key'),)

class Problem(Base):
    __tablename__ = "problems"

    id = Column(String(100), primary_key=True)

    title = Column(String(255), nullable=False)

    slug = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    statement = Column(Text, nullable=False)

    category = Column(
        String(100),
        index=True,
        nullable=False,
    )

    pattern = Column(
        String(100),
        index=True,
        nullable=False,
    )

    difficulty = Column(
        String(50),
        index=True,
        nullable=False,
    )

    recognition_minutes = Column(
        Integer,
        nullable=False,
    )

    examples = Column(
        JSON,
        nullable=False,
    )

    constraints = Column(
        JSON,
        nullable=False,
    )

    time_complexity = Column(String(100))

    space_complexity = Column(String(100))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

class ProblemHint(Base):
    __tablename__ = "problem_hints"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    problem_id = Column(String(100), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    level = Column(Integer, nullable=False)
    hint_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (CheckConstraint('level BETWEEN 1 AND 5', name='check_hint_level_range'),)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(100), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(String(100), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default='in_progress', index=True)
    recognition_time = Column(Integer)
    claimed_pattern = Column(String(100))
    detected_pattern = Column(String(100))
    pattern_match = Column(Boolean)
    current_hint_level = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True))
    
    __table_args__ = (CheckConstraint('current_hint_level BETWEEN 0 AND 5', name='check_session_hint_level'),)

class Approach(Base):
    __tablename__ = "approaches"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    approach_text = Column(Text, nullable=False)
    attempt_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (CheckConstraint('attempt_number > 0', name='check_attempt_number_positive'),)

class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    approach_id = Column(Integer, ForeignKey("approaches.id", ondelete="CASCADE"), nullable=False, index=True)
    pattern_score = Column(Integer)
    complexity_score = Column(Integer)
    correctness_score = Column(Integer)
    edge_case_score = Column(Integer)
    overall_verdict = Column(String(100), nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint('pattern_score BETWEEN 0 AND 100', name='check_pattern_score_range'),
        CheckConstraint('complexity_score BETWEEN 0 AND 100', name='check_complexity_score_range'),
        CheckConstraint('correctness_score BETWEEN 0 AND 100', name='check_correctness_score_range'),
        CheckConstraint('edge_case_score BETWEEN 0 AND 100', name='check_edge_case_score_range'),
    )

class SessionEvent(Base):
    __tablename__ = "session_events"

    id = Column(Integer, primary_key=True, autoincrement=True)

    session_id = Column(
        String(100),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    event_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    event_data = Column(JSON)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )    