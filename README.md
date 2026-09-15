# ThinkFlow

### Deliberate practice for algorithmic pattern recognition.

**Most coding-practice platforms measure whether you can solve a problem.
ThinkFlow measures something harder to fake: whether you could have recognized it on your own.**

`FastAPI` · `PostgreSQL` · `Next.js` · `TypeScript` · `Redis` · `Google Gemini` · `JWT`

---

## Table of Contents

- [The Problem With Every Other Practice Tool](#the-problem-with-every-other-practice-tool)
- [Core Thesis](#core-thesis)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Feature Deep Dive](#feature-deep-dive)
- [Security Model](#security-model)
- [Engineering Philosophy](#engineering-philosophy)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## The Problem With Every Other Practice Tool

Open any curated problem list — "Sliding Window Problems," "Two Pointer Techniques" — and you've already been told the answer before you've read the first sentence. You practice *execution* under the illusion that you practiced *recognition*.

In a real interview, nobody hands you a folder labeled with the pattern you need. The single hardest, highest-leverage skill in technical interviewing is the five seconds before you write anything — the moment you decide *what kind of problem this is*. Almost nothing measures that moment. ThinkFlow does, deliberately, as its entire reason for existing.

---

## Core Thesis

> **You have not demonstrated you solved a problem if you never demonstrated you could recognize it.**

This sentence is not a tagline — it is a constraint that shaped nearly every technical decision in this repository:

- Problems are served with **zero title, tags, or hints** until a session begins.
- A recognition timer runs, computed **server-side** from the session's start timestamp — never trusted from client input, because a client-side timer can be faked.
- Recognition accuracy and approach quality are tracked as **two permanently separate signals**. They are never averaged, blended, or collapsed into one score, anywhere in the codebase.
- The session summary distinguishes "solved cold," "solved after N hints," and "not solved" as three genuinely different outcomes — not the same green checkmark with a smaller footnote.
- When a planned feature (Deep Dive Mode, below) could not be built without quietly violating this thesis, **the feature was redesigned**, not the thesis.

---

## How It Works

ThinkFlow has two intentionally distinct practice modes. They share almost the entire evaluation engine — they diverge only where the thesis requires it.

### Mode 1 — Blind Diagnostic
The core assessment loop, run against 31 hand-curated, pattern-verified problems.

```
 ┌─────────────┐   ┌──────────────┐   ┌──────────┐   ┌───────────┐   ┌─────────┐   ┌─────────┐
 │ Recognition │──▶│ Confirmation │──▶│ Approach │──▶│ AI Rubric │──▶│  Hints  │──▶│ Summary │
 │ (blind,     │   │  (real vs.   │   │ (written,│   │ (4-axis   │   │(if      │   │(honest, │
 │  timed)     │   │   claimed)   │   │ no code) │   │  scoring) │   │ needed) │   │ labeled)│
 └─────────────┘   └──────────────┘   └──────────┘   └───────────┘   └─────────┘   └─────────┘
```

### Mode 2 — Deep Dive
A coaching mode for a specific problem the user names. No blind guessing — a user cannot be blind to a name they just typed, so ThinkFlow doesn't pretend otherwise.

```
 ┌────────────────────┐   ┌──────────┐   ┌───────────┐   ┌─────────┐   ┌─────────┐
 │  AI-verified real   │──▶│ Approach │──▶│ AI Rubric │──▶│  Hints  │──▶│ Summary │
 │  problem, shown in  │   │          │   │           │   │(lazy,   │   │         │
 │  full immediately   │   │          │   │           │   │ cached) │   │         │
 └────────────────────┘   └──────────┘   └───────────┘   └─────────┘   └─────────┘
```

Deep Dive sessions are excluded from every metric that measures blind recognition — they cannot contaminate the diagnostic they were never trying to be.

---

## Architecture

```
┌──────────────────────┐         ┌───────────────────────┐         ┌──────────────────┐
│   Next.js Frontend    │──HTTP──▶│    FastAPI Backend     │──SQL───▶│    PostgreSQL     │
│  TypeScript / React   │◀────────│        Python           │◀────────│                    │
└──────────────────────┘  JSON   └───────────┬────────────┘         └──────────────────┘
                                              │
                     ┌────────────────────────┼─────────────────────────┐
                     ▼                         ▼                         ▼
           ┌──────────────────┐    ┌────────────────────┐    ┌────────────────────┐
           │       Redis        │    │   Google Gemini     │    │   Fernet-encrypted  │
           │ rate limiting +    │    │   per-user BYOK key,│    │   API key storage    │
           │ refresh-token      │    │   structured output  │    │   in PostgreSQL      │
           │ revocation         │    │   (response_schema)  │    │                      │
           └──────────────────┘    └────────────────────┘    └────────────────────┘
```

**Anatomy of a single AI-evaluated request** (approach submission, hint generation, or custom problem generation):

1. Frontend sends the request with a short-lived JWT access token.
2. Backend authenticates the user and confirms session ownership.
3. Backend checks a Redis-backed per-user rate limit (fails open on Redis outage — see [Security Model](#security-model)).
4. Backend fetches and decrypts *that user's own* Gemini key — never a shared server key.
5. Gemini is called with a strict `response_schema`, forcing structurally valid output.
6. The validated result is persisted; the decrypted key never leaves memory, is never logged, and is never returned to the client.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, React, Tailwind | Type-safe, fast iteration, App Router's layout model fits the auth-gated shell cleanly |
| Backend | FastAPI (Python) | Async-ready, Pydantic-native validation matches the AI structured-output workflow end to end |
| Database | PostgreSQL + SQLAlchemy | Relational integrity for sessions/approaches/evaluations; JSON columns for flexible example/constraint data |
| Migrations | Alembic | Every schema change is a reviewable, reversible file — not a manual `ALTER TABLE` |
| Cache / Coordination | Redis | Rate limiting and refresh-token revocation, two workloads that need atomic counters and TTL expiry, not a relational store |
| AI | Google Gemini, structured output | `response_schema` eliminates prompt-parsing fragility — the model cannot return malformed JSON |
| Auth | JWT (access + refresh) + Argon2id | Short-lived access tokens, revocable refresh tokens, memory-hard password hashing |
| Secrets | Fernet symmetric encryption | Per-user API keys encrypted at rest, never stored or logged in plaintext |

---

## Feature Deep Dive

### Blind Recognition Diagnostic
Problems are fetched as bare summaries (`id`, `difficulty`, `category` — nothing else) until a session exists; full detail is only ever revealed *after* commitment. Recognition time is computed from `session.started_at` on the server — a client cannot report a faster time than actually elapsed. Pattern-match correctness is a deterministic comparison against a human-verified ground-truth pattern, not an AI guess.

### AI Approach Evaluation
A single, extensively engineered prompt scores four independent axes — **pattern recognition, correctness, complexity, edge-case awareness** — each 0–100, with an explicit instruction that the four scores must never be averaged to produce the final verdict. The verdict (`strong` / `needs_improvement` / `incorrect`) is Gemini's own reasoned output, constrained by a `response_schema`, following an explicit correctness-first priority hierarchy encoded directly in the prompt. The prompt contains a dedicated prompt-injection defense: any user-submitted text is explicitly bound as data, never as instructions, regardless of what it appears to say.

### Progressive Hint Ladder
Five levels, escalating from a general technique nudge to near-implementation guidance — never full code, at any level. Curated problems ship with all five hints pre-written and human-verified. Deep Dive problems generate hints **lazily, one level at a time, only on request** — never all five upfront — and cache each generated hint after first use, so a second request for the same level never re-calls Gemini.

### Bring Your Own Key (BYOK) — genuinely, not nominally
Every Gemini call in this codebase — evaluation, hinting, problem generation — resolves to *the calling user's own* encrypted API key, decrypted fresh per request. There is no shared fallback key anywhere in the system; a user with no key configured gets a clear, immediate error, never a silent fallback to someone else's billing. Keys are validated against the live Gemini API **before** being persisted, so a typo or invalid key is rejected at save time — not discovered mid-practice, three steps later, as a confusing 502.

**Every dollar of AI inference cost is billed to the user's own Google account. The platform operator pays nothing for usage.**

### Deep Dive Mode
The user types a problem name. Gemini is prompted under a strict **recognize-or-refuse** contract: it must explicitly return `recognized: false` rather than fabricate a plausible-looking problem it isn't actually confident about. When it does recognize a real problem, the statement is generated as an **original paraphrase** of that problem's actual requirements — never a near-verbatim reproduction of any specific platform's exact wording. These sessions deliberately skip the recognition phase (a user cannot be blind to their own input) and are structurally excluded, at the data level, from every metric that claims to measure blind recognition.

### Dashboard
Real per-difficulty solved counts (Easy / Medium / Hard), computed from the live problem catalog, visualized with a segmented radial gauge. Recognition accuracy and the speed trend graph are computed **exclusively from curated, blind sessions** — Deep Dive activity cannot inflate them, by construction, not by convention. Outcome badges make hint-assisted success visually and textually distinct from a cold solve, everywhere a session is listed.

---

## Security Model

| Concern | Mechanism | Failure posture |
|---|---|---|
| Password storage | Argon2id (memory-hard hashing) | N/A |
| Access tokens | Short-lived JWT (30 min default) | Not individually revocable — standard tradeoff of short-lived JWTs |
| Refresh tokens | JWT with a unique `jti`, rotated on every use | **Fails closed** — if Redis cannot confirm revocation status, the token is treated as invalid |
| Logout | Real server-side revocation via Redis blacklist (TTL-matched to natural expiry) | Local tokens still clear even if Redis is unreachable |
| API keys at rest | Fernet symmetric encryption | Encryption key must never rotate once real keys exist, or all stored keys become permanently undecryptable |
| Gemini rate limiting | Redis fixed-window counter, shared across all AI-calling endpoints per user | **Fails open** — an abuse control, not an auth boundary; a Redis outage should not disable AI features entirely |
| Prompt injection | Explicit "treat as data, not instructions" contract in every prompt that embeds user text | N/A |

The rate-limiting and token-revocation systems deliberately fail in *opposite* directions. That is not an inconsistency — it is two different risk profiles resolved correctly: authentication failures should be conservative, abuse-prevention failures should be forgiving.

---

## Engineering Philosophy

This system was built and hardened through an unusually disciplined verify-then-trust loop: every fix was confirmed against real server tracebacks, real database state, or a real API response — never assumed correct because the code "looked right." Several non-obvious, easy-to-miss bugs were caught this way during development, including:

- A double-JSON-encoding bug in seed data that silently corrupted `examples`/`constraints` for 17 of 31 curated problems, only surfaced by inspecting the raw database value, not the API response.
- A schema/prompt mismatch where the AI evaluator's prompt contained detailed non-averaging verdict logic, while the actual response schema silently stripped the verdict field — meaning that reasoning was dead weight until the schema was corrected to match.
- A Gemini structured-output incompatibility (`additionalProperties` on unconstrained `dict` fields) that only manifested as a runtime `ValueError`, not a schema-validation-time error.
- A stale authentication check (`localStorage.getItem("thinkflow-user")`) that silently survived a full BYOK/auth rewrite, causing a login-redirect loop that was only caught by directly inspecting browser storage rather than trusting the UI's apparent behavior.

The throughline: **trust the traceback, not the assumption.**

---

## Data Model

| Table | Purpose |
|---|---|
| `users` | Accounts, Argon2id password hashes |
| `api_keys` | Per-user encrypted Gemini keys (unique per user) |
| `problems` | Curated (human-verified) and custom (AI-generated); `source` column distinguishes them |
| `problem_hints` | Pre-seeded (curated) or lazily generated + cached (custom) hint text per level |
| `sessions` | One practice run — recognition state, current hint level, status, timestamps |
| `approaches` | Up to 2 submitted approaches per session |
| `evaluations` | AI scores + verdict + structured feedback, one per approach |
| `session_events` | Append-only audit log of every state transition in a session |

Full schema: [`app/models.py`](backend/app/models.py). Every schema change is a versioned Alembic migration under [`alembic/versions/`](backend/alembic/versions/).

---

## API Reference

All endpoints require a Bearer access token except signup, login, and refresh. Full interactive documentation is auto-generated at `/docs` (Swagger UI) whenever the backend is running.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/signup` | Create an account |
| `POST` | `/auth/login` | Issue access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate tokens (old refresh token is revoked) |
| `POST` | `/auth/logout` | Revoke the current refresh token |
| `GET` | `/problems` | List curated problems, filterable by difficulty/category |
| `GET` | `/problems/{id}` | Full problem detail |
| `POST` | `/problems/custom` | Generate a Deep Dive problem from a name |
| `POST` | `/sessions` | Start a session |
| `GET` | `/sessions` | List the current user's sessions |
| `GET` | `/sessions/{id}` | Fetch a single session |
| `PATCH` | `/sessions/{id}/recognition` | Submit a recognition outcome |
| `POST` | `/sessions/{id}/approach` | Submit an approach for AI evaluation |
| `POST` | `/sessions/{id}/hints` | Request the next hint |
| `GET` | `/sessions/{id}/summary` | Final session summary |
| `GET` | `/settings` | Check API key configuration status |
| `PUT` | `/settings/api-key` | Save (and validate) a Gemini key |
| `DELETE` | `/settings/api-key` | Remove the saved key |
| `POST` | `/settings/api-key/test` | Re-test the saved key against the live API |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis
- A Google Gemini API key (for local testing under your own account — ThinkFlow itself is BYOK per end-user)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
alembic upgrade head
python -m app.seed              # seeds the 31 curated problems
python scripts/generate_hints.py
python scripts/seed_hints.py

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`, sign up, add a Gemini key under **Settings**, and start a session.

---

## Environment Variables

**Backend — `.env`**

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/thinkflow_db
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000

JWT_SECRET_KEY=<long, random, unique secret>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30

API_KEY_ENCRYPTION_KEY=<Fernet key — generate once, never rotate>

REDIS_HOST=localhost
REDIS_PORT=6379

GEMINI_RATE_LIMIT_MAX_REQUESTS=20
GEMINI_RATE_LIMIT_WINDOW_SECONDS=600
```

> **There is intentionally no `GEMINI_API_KEY` here.** ThinkFlow is pure BYOK — every AI call resolves to a per-user encrypted key stored in the database. A server-wide fallback key was removed by design; see [Security Model](#security-model).

**Frontend — `.env.local`**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project Structure

```text
Thinkflow/
├── BACKEND/
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   ├── README
│   │   └── script.py.mako
│   ├── app/
│   │   ├── services/
│   │   │   ├── approach_evaluator.py
│   │   │   └── approach_verdict.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── dashboard.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── problems_data.py
│   │   ├── problems.py
│   │   ├── rate_limit.py
│   │   ├── redis_client.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── seed.py
│   │   ├── session.py
│   │   └── settings.py
│   ├── scripts/
│   │   ├── generate_hints.py
│   │   ├── hints-generated.json
│   │   ├── hints-generation.log
│   │   └── seed_hints.py
│   └── alembic.ini
├── DOCS/
├── FRONTEND/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── problems/
│   │   │   │   └── page.tsx
│   │   │   ├── session/
│   │   │   └── settings/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (marketing)/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── app-shell.tsx
│   │   └── ui.tsx
│   ├── features/
│   │   ├── auth.tsx
│   │   ├── dashboard.tsx
│   │   ├── data.ts
│   │   ├── landing.tsx
│   │   ├── onboarding.tsx
│   │   ├── problems.tsx
│   │   ├── session.tsx
│   │   └── settings.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── outputs/
│   ├── types/
│   │   └── styles.d.ts
│   └── work/
│       ├── pdf-review/
│       ├── pdf-review-architecture/
│       ├── pdf-review-design/
│       ├── pdf-review-mvp-scope/
│       └── pdf-review-screens/
├── .gitignore
└── README.md
```

---

## Design Decisions & Tradeoffs

Documented deliberately, not buried in commit history:

- **Recognition and execution are never merged into one score**, anywhere — even where merging them would have simplified the UI. This is the thesis, enforced structurally, not just stylistically.
- **Approach attempts (2 max) and hints (5 max) are capped independently**, not from a shared pool. A user's hint usage never silently consumes their approach budget, or vice versa.
- **N+1 query pattern accepted** in `list_sessions` / `build_session_detail` — each session requires one follow-up query for its latest verdict. Acceptable at current scale; the first candidate for a JOIN-based rewrite if session volume grows.
- **Rate limiting fails open; token revocation fails closed.** Two opposite failure postures, chosen deliberately per actual risk — not an oversight.
- **Deep Dive Mode was redesigned mid-build, not shipped as originally scoped.** The first version (blind recognition on a self-named problem) was scrapped once it became clear it could not preserve the core thesis under any amount of UI massaging. The shipped version is a stronger product decision, not a fallback.

---

## Known Limitations

- Access tokens are not individually revocable — only refresh tokens. A compromised access token remains valid until its short natural expiry.
- Custom (Deep Dive) problems have no human verification step; their pattern classification is Gemini's own determination at generation time.
- No password-reset flow yet.
- Custom problems are not deletable and accumulate indefinitely per user.
- Dashboard queries are not yet optimized for very large session histories (see N+1 note above).

---

## Roadmap

**Near-term**
- [ ] Password reset flow
- [ ] Delete / manage custom Deep Dive problems
- [ ] Hint-dependency trend over time on the dashboard
- [ ] Batch problem-detail endpoint to eliminate per-row dashboard fetches
- [ ] Redis-backed access-token revocation for a true full logout guarantee

**Mid-term**
- [ ] Expand the curated catalog with a formal human pattern-verification pipeline
- [ ] Multi-provider BYOK (OpenAI, Anthropic) with provider-specific prompt tuning
- [ ] Cohort mode — instructors assign problem sets, view aggregate anonymized recognition trends
- [ ] Spaced repetition: resurface problems solved slowly or only after heavy hint use
- [ ] Exportable session/summary reports for coaching use cases

**Long-term**
- [ ] Live mock-interview mode with a follow-up-question AI persona during the approach phase
- [ ] Adaptive difficulty, recommending the next problem based on per-pattern recognition gaps
- [ ] Native mobile app for short, timer-based recognition drills
- [ ] Opt-in public leaderboards ranked by "solved cold" rate — the one metric this product actually believes in

---

## License

Proprietary — all rights reserved. This repository is shared for evaluation and portfolio purposes.

---


**Built around one non-negotiable question, asked of every feature before it shipped:**
*does this tell the user the truth about their own skill, or does it let them lie to themselves?*

