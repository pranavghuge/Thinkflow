import json
import logging
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.database import SessionLocal
from app.models import Problem


logging.basicConfig(
    filename="scripts/hints-generation.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger(__name__)

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY was not found in the environment."
    )

client = genai.Client(api_key=api_key)

OUTPUT_PATH = Path("scripts/hints-generated.json")

MODEL = "gemini-3.5-flash-lite"

MAX_RETRIES = 1
RETRY_DELAY_SECONDS = 2


CODE_LEAK_PATTERN = re.compile(
    r"(def\s+\w+\(|return\s+\w+|\bfor\s+\w+\s+in\s+|while\s*\(|\+=|==|!=|"
    r"\[\w*\]|\{\}|\bnums\[|\barr\[|\.append\(|\.push\(|;\s*$)"
)


EXAMPLE_LADDER = """1. "Think about what information you'd need to remember as you scan the array once."
2. "For each number, ask: have I already seen the value that would complete the pair?"
3. "A hash map lets you check 'have I seen X' in constant time as you go."
4. "Iterate once, and for each number, check the map for target minus that number before inserting the current number."
5. "Use a single pass: for each num, compute complement = target - num, check if complement is already a key in your map, and if not, add num to the map and continue.\""""


def load_existing_results() -> dict:
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    return {}


def save_results(results: dict) -> None:
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


def extract_json(raw_text: str) -> list[dict]:
    cleaned = raw_text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned)

    return json.loads(cleaned.strip())


def validate_hints(hints: list[dict]) -> list[str]:
    issues = []

    if not isinstance(hints, list) or len(hints) != 5:
        issues.append(
            f"Expected 5 hints, got "
            f"{len(hints) if isinstance(hints, list) else 'non-list'}"
        )
        return issues

    seen_levels = set()

    for hint in hints:
        if not isinstance(hint, dict):
            issues.append(f"Malformed hint entry: {hint}")
            continue

        if "level" not in hint or "hint_text" not in hint:
            issues.append(f"Malformed hint entry: {hint}")
            continue

        level = hint["level"]
        text = hint["hint_text"]

        seen_levels.add(level)

        if level in (1, 2, 3, 4) and CODE_LEAK_PATTERN.search(text):
            issues.append(
                f"Level {level} may leak code: {text[:80]}..."
            )

        if len(text.strip()) < 10:
            issues.append(
                f"Level {level} suspiciously short: {text!r}"
            )

    if seen_levels != {1, 2, 3, 4, 5}:
        issues.append(
            f"Missing levels — got {sorted(seen_levels)}"
        )

    return issues


def build_prompt(problem: Problem) -> str:
    return f"""You are writing a 5-level progressive hint ladder for ThinkFlow,
a coding interview practice platform whose entire thesis is: think before you
code. Hints exist to unstick a user's REASONING, not to hand them a solution.

Problem: {problem.title}
Pattern: {problem.pattern}
Statement: {problem.statement}

EXAMPLE — a well-formed ladder for a different problem (Two Sum, Array & Hashing):
1. "Think about what information you'd need to remember as you scan the array once."
2. "For each number, ask: have I already seen the value that would complete the pair?"
3. "A hash map lets you check 'have I seen X' in constant time as you go."
4. "Iterate once, and for each number, check the map for target minus that number before inserting the current number."
5. "Use a single pass: for each num, compute complement = target - num, check if complement is already a key in your map, and if not, add num to the map and continue."

Write exactly 5 hints for the problem above, matching that same escalation
in specificity level-by-level. Each hint should be 1-2 sentences — clear
enough to be useful, not so long it starts explaining the full solution.

Rules per level:
1. Technique family — name the general category only (e.g., "two pointers,"
   "sliding window"). No mention of data structures or steps.
2. Key observation — the one insight that makes the technique click. Still
   no data structures or algorithm steps.
3. Data structure — name the specific structure/tool needed. No algorithm
   steps yet.
4. Algorithm skeleton — describe the steps in plain English. No code syntax,
   no variable names, no pseudocode.
5. Implementation guidance — concrete enough to code from directly, but
   still prose, not literal code.

AVOID THIS (an example of a level-2 hint that leaks too much):
"Use a hash map to store seen values and check for the complement in O(1)."
— This belongs at level 3-4, not level 2. Level 2 should only be the insight,
not the tool or the mechanism.

Return ONLY valid JSON, no markdown fences, no commentary: a list of 5
objects like {{"level": 1, "hint_text": "..."}}"""


def generate_with_retry(problem: Problem) -> tuple[list[dict] | None, dict]:
    last_error = None

    response_schema = {
        "type": "array",
        "minItems": 5,
        "maxItems": 5,
        "items": {
            "type": "object",
            "properties": {
                "level": {
                    "type": "integer",
                },
                "hint_text": {
                    "type": "string",
                },
            },
            "required": ["level", "hint_text"],
        },
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=build_prompt(problem),
                config=types.GenerateContentConfig(
                    max_output_tokens=1024,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )

            raw_text = response.text

            hints = extract_json(raw_text)
            issues = validate_hints(hints)

            usage = response.usage_metadata

            meta = {
                "input_tokens": (
                    usage.prompt_token_count
                    if usage
                    else 0
                ),
                "output_tokens": (
                    usage.candidates_token_count
                    if usage
                    else 0
                ),
                "attempt": attempt,
            }

            if issues:
                logger.warning(
                    f"{problem.id} attempt {attempt}: {issues}"
                )

                last_error = f"Validation failed: {issues}"
                continue

            return hints, meta

        except Exception as e:
            last_error = str(e)

            logger.warning(
                f"{problem.id} attempt {attempt} failed: {e}"
            )

            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    logger.error(
        f"{problem.id} FAILED after {MAX_RETRIES} attempts: {last_error}"
    )

    return None, {"error": last_error}


def main():
    db = SessionLocal()

    try:
        problems = (
            db.query(Problem)
            .order_by(Problem.id)
            .all()
        )
    finally:
        db.close()

    results = load_existing_results()

    failures = []

    total_input_tokens = 0
    total_output_tokens = 0

    for problem in problems:
        if problem.id in results:
            logger.info(
                f"{problem.id}: already done, skipping"
            )
            continue

        print(f"Generating hints for {problem.id}...")

        hints, meta = generate_with_retry(problem)

        if hints is None:
            failures.append(problem.id)
            continue

        results[problem.id] = hints

        save_results(results)

        total_input_tokens += meta.get(
            "input_tokens",
            0,
        )

        total_output_tokens += meta.get(
            "output_tokens",
            0,
        )

        logger.info(
            f"{problem.id}: succeeded on attempt "
            f"{meta['attempt']}"
        )

    print(
        f"\nDone. {len(results)}/{len(problems)} "
        f"problems have hints."
    )

    print(
        f"Tokens — input: {total_input_tokens}, "
        f"output: {total_output_tokens}"
    )

    if failures:
        print(
            f"FAILED (needs manual attention): {failures}"
        )

    print(
        f"\nReview {OUTPUT_PATH} before running seed_hints.py."
    )


if __name__ == "__main__":
    main()
