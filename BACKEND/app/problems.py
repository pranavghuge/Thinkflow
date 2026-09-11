from typing import Literal

from fastapi import APIRouter, Depends, Query,HTTPException, status
from sqlalchemy.orm import Session as DBSession

from .auth import get_current_user
from .database import get_db
from .models import Problem, User
from .schemas import ProblemSummary,ProblemDetail

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


@router.get("/{problem_id}", response_model=ProblemDetail)
def get_problem(
    problem_id: str,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if problem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found",
        )

    return problem