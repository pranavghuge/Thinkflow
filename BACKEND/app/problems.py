from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession

from .auth import get_current_user
from .database import get_db
from .models import Problem, User
from .schemas import ProblemSummary

router = APIRouter(prefix="/problems", tags=["Problems"])


@router.get("", response_model=list[ProblemSummary])
def get_problems(
    difficulty: Literal["Easy", "Medium", "Hard"] | None = Query(default=None),
    category: str | None = Query(default=None),
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    query = db.query(Problem)

    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)

    if category:
        query = query.filter(Problem.category == category)

    return query.order_by(Problem.id).all()