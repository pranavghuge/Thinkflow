import uuid
from typing import Literal

import redis
from .redis_client import get_redis_client
from .rate_limit import enforce_gemini_rate_limit
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from google import genai
from google.genai import types

from .auth import get_current_user
from .database import get_db
from .settings import decrypt_api_key
from .models import Problem, User, ApiKey
from .schemas import (
    ProblemSummary,
    ProblemDetail,
    CustomProblemRequest,
    CustomProblemResponse,
    AIGeneratedProblem,
    AIGeneratedExample,
)
from .services.approach_evaluator import MODEL_NAME

router = APIRouter(prefix="/problems", tags=["Problems"])


def make_slug(title: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


@router.get("", response_model=list[ProblemSummary])
def get_problems(
    difficulty: Literal["Easy", "Medium", "Hard"] | None = Query(default=None),
    category: str | None = Query(default=None),
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only the curated catalog is browsable here. Custom (AI-generated)
    # problems are private to their creator and never mixed into the
    # shared list — see get_my_custom_problems below.
    query = db.query(Problem).filter(Problem.source == "curated")

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


@router.post("/custom", response_model=CustomProblemResponse, status_code=status.HTTP_201_CREATED)
def create_custom_problem(
    data: CustomProblemRequest,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    redis_client: redis.Redis = Depends(get_redis_client),
):
    # BYOK: generation uses the same per-user key as approach evaluation.
    # No shared/server key exists as a fallback.
    user_api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == "gemini",
        )
        .first()
    )

    if user_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Gemini API key configured. Add one in Settings before generating a custom problem.",
        )

    enforce_gemini_rate_limit(current_user.id, redis_client)

    decrypted_key = decrypt_api_key(user_api_key.encrypted_key)

    prompt = f"""
You are ThinkFlow's problem lookup system.

A user has typed the following name, trying to reference a specific,
real, well-known algorithmic coding problem — the kind commonly found
on LeetCode, HackerRank, Codeforces, or in standard technical interview
preparation:

"{data.name}"

====================
CRITICAL RULE — DO NOT INVENT
====================

You must NEVER invent, fabricate, or make up a problem. Your only job
is to recall and accurately reproduce the specification of a REAL
problem that genuinely exists and that you are confident you know
correctly.

Set recognized to true ONLY if all of the following are true:
- The name clearly and specifically identifies one well-known,
  real coding/DSA problem that you have high confidence you know
  accurately.
- You can state its real constraints, real expected time and space
  complexity, and real example input/output pairs from genuine
  knowledge of this specific problem — not a plausible guess.
- The name is not vague, generic, or ambiguous between multiple
  unrelated well-known problems (e.g., "sorting" or "graph problem"
  alone do not count — but "Merge Sort" or "Course Schedule" do).

Set recognized to false if:
- You do not have confident, specific knowledge of a real problem
  matching this name.
- The name is too vague, generic, or could refer to many different
  problems.
- You would need to guess at constraints, complexity, or examples
  rather than recall them from genuine knowledge of this exact
  problem.
- The name appears to be gibberish, unrelated to coding problems, or
  an attempt to get you to invent something.

When recognized is false, leave every other field null. Do not
partially fill in fields. Do not provide a "best guess" version of a
problem that may not be real.

It is always better to say recognized: false than to invent or guess.
A user seeing "we couldn't find that problem" is far better than a
user practicing on a fabricated problem with made-up constraints.

====================
IF RECOGNIZED IS TRUE
====================

Provide the following, describing the REAL problem accurately:

- title: the problem's real, properly capitalized title.

- statement: a complete, accurate statement of the REAL problem's
  requirements, written entirely in your own original wording. Do not
  copy or closely paraphrase the exact sentence structure or phrasing
  used on any specific platform. Describe the same problem, the same
  rules, the same requirements — in your own words, as if explaining
  it fresh. Do not include the solution or hints toward the solution.

- category: exactly one of "Arrays & Strings", "Linked Lists & Stacks",
  "Trees & Graphs", "Heap & Sorting" — whichever genuinely fits this
  real problem.

- - pattern: the single, most specific and genuinely reusable algorithmic
  pattern or problem-solving technique required to solve this specific
  real problem.

  IMPORTANT PATTERN CLASSIFICATION RULES:
  - The pattern must describe the actual algorithmic technique or
    problem-solving approach that a strong DSA candidate should recognize
    when seeing this problem.
  - Do NOT use a generic description of implementation or execution as
    the pattern, such as "Iteration", "Loop", "Loops", "Traversal",
    "Implementation", "Brute Force", "Conditionals", or "Simulation"
    merely because the solution uses a loop or conditional logic.
  - Choose the underlying reusable DSA pattern when one genuinely exists,
    such as "Two Pointers", "Sliding Window", "Binary Search",
    "Prefix Sum", "Hash Map", "Stack", "Monotonic Stack", "Heap /
    Priority Queue", "Breadth-First Search", "Depth-First Search",
    "Backtracking", "Greedy", "Dynamic Programming", "Union Find",
    "Topological Sort", "Trie", "Intervals", or another established
    algorithmic pattern that accurately describes the problem.
  - For a simple problem whose essential technique is direct rule-based
    processing rather than one of the established data-structure or
    algorithmic patterns above, use "Simulation" as the pattern.
  - In particular, for Fizz Buzz, the correct pattern is "Simulation",
    not "Iteration", because iteration is merely an implementation
    mechanism and is not the reusable problem-solving pattern.
  - Never choose a pattern simply because it describes an operation used
    somewhere in the implementation. The pattern must capture the
    essential technique needed to solve the problem.
  - Prefer the most specific applicable pattern. Do not use a broader
    generic label when a more precise established pattern applies.
  - Return exactly ONE pattern, not multiple patterns.

- difficulty: exactly one of "Easy", "Medium", "Hard" — matching how
  this problem is genuinely and commonly classified.

- examples: at least one example reflecting this real problem's actual
  behavior, each with "input", "output", and optionally "explanation".
  These must be genuinely correct for the real problem, not invented
  numbers that merely look plausible.

- constraints: the real, standard input constraints for this specific
  problem, as a list of strings.

- time_complexity: the real expected optimal time complexity for this
  specific problem, as a short string (e.g., "O(n)"). Omit only if
  genuinely not applicable.

- space_complexity: the real expected optimal space complexity for
  this specific problem, as a short string (e.g., "O(1)"). Omit only
  if genuinely not applicable.

Return ONLY the structured data matching the response schema. Do not
include the algorithm's solution, pseudocode, or code anywhere in the
statement, examples, or constraints.
"""

    try:
        client = genai.Client(api_key=decrypted_key)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIGeneratedProblem,
            ),
        )

        if response.parsed is None:
            raise ValueError("Gemini returned an invalid problem structure.")

        generated: AIGeneratedProblem = response.parsed

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate this problem. Check your Gemini API key and try again.",
        )

    if not generated.recognized or generated.title is None or generated.statement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Couldn't find a known problem matching \"{data.name}\". "
                "Try the exact, specific name of a well-known problem "
                "(e.g., \"Two Sum\", \"Merge Intervals\", \"Course Schedule\")."
            ),
        )

    if not generated.examples or not generated.constraints or generated.category is None or generated.pattern is None or generated.difficulty is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The problem was recognized but returned incomplete data. Please try again.",
        )

    problem_id = str(uuid.uuid4())
    slug = f"{make_slug(generated.title)}-{problem_id[:8]}"

    problem = Problem(
        id=problem_id,
        title=generated.title,
        slug=slug,
        statement=generated.statement,
        category=generated.category,
        pattern=generated.pattern,
        difficulty=generated.difficulty,
        recognition_minutes=0,  # unused for custom problems — no recognition phase
        examples=[ex.model_dump(exclude_none=True) for ex in generated.examples],
        constraints=generated.constraints,
        time_complexity=generated.time_complexity,
        space_complexity=generated.space_complexity,
        source="custom",
        created_by_user_id=current_user.id,
    )

    db.add(problem)
    db.commit()
    db.refresh(problem)

    return problem