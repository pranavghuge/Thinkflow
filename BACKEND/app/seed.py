import json
import re

from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Problem
from .problems_data import PROBLEMS


def make_slug(title: str) -> str:
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        title.lower(),
    ).strip("-")


def seed_problems(db: Session) -> None:
    for data in PROBLEMS:
        problem_id = data["id"]

        existing_problem = (
            db.query(Problem)
            .filter(Problem.id == problem_id)
            .first()
        )

        problem_data = {
            "id": problem_id,
            "title": data["title"],
            "slug": make_slug(data["title"]),
            "statement": data["statement"],
            "difficulty": data["difficulty"],
            "recognition_minutes": data["recognition_minutes"],
            "pattern": data["pattern"],
            "category": data["category"],
            "constraints": json.dumps(data["constraints"]),
            "examples": json.dumps(data["examples"]),
            "time_complexity": data["time_complexity"],
            "space_complexity": data["space_complexity"],
        }

        if existing_problem:
            for key, value in problem_data.items():
                if key != "id":
                    setattr(existing_problem, key, value)
        else:
            db.add(Problem(**problem_data))

    db.commit()


def main() -> None:
    db = SessionLocal()

    try:
        seed_problems(db)
        print(f"Successfully seeded {len(PROBLEMS)} problems.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()