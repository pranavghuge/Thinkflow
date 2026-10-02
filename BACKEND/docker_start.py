"""Start-up script used only inside Docker.

1. Fresh database  -> create tables from the models and mark Alembic as up to date.
2. Existing database -> run normal Alembic migrations.
3. Load the problems and hints (safe to run repeatedly).
4. Start the API.
"""
import os
import subprocess
import sys

from sqlalchemy import inspect

from app.database import Base, engine
import app.models  # noqa: F401  (registers all tables on Base)


def run(*cmd: str) -> None:
    subprocess.run(cmd, check=True)


if inspect(engine).has_table("alembic_version"):
    run("alembic", "upgrade", "head")
else:
    Base.metadata.create_all(bind=engine)
    run("alembic", "stamp", "head")

run(sys.executable, "-m", "app.seed")
run(sys.executable, "-m", "scripts.seed_hints")

os.execvp(
    "uvicorn",
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
)
