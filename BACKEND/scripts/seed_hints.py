import json
from pathlib import Path

from app.database import SessionLocal
from app.models import ProblemHint

JSON_PATH = Path(__file__).resolve().parent.parent / "scripts" / "hints-generated.json"


def seed_hints():
    db = SessionLocal()
    try:
        existing_count = db.query(ProblemHint).count()
        if existing_count > 0:
            print(f"problem_hints already has {existing_count} rows — skipping.")
            return

        with open(JSON_PATH) as f:
            hints_by_problem = json.load(f)

        for problem_id, hints in hints_by_problem.items():
            for hint in hints:
                db.add(
                    ProblemHint(
                        problem_id=problem_id,
                        level=hint["level"],
                        hint_text=hint["hint_text"],
                    )
                )

        db.commit()
        print(f"Seeded hints for {len(hints_by_problem)} problems.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_hints()