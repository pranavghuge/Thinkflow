# ThinkFlow MVP Scope (V1)

## Precedence

This document overrides `screen-specifications.md`, `frontend-architecture.md`,
and the wireframes for the current build. Those documents describe the full
product vision. This document defines what actually gets built in V1.

If anything here conflicts with another doc, **this file wins for V1.**

---

## Goal
The purpose of this MVP is to validate one hypothesis:

> Developers want to train pattern recognition and reasoning quality
> before writing code — not just solve more problems.

This is NOT a complete learning platform.
This is NOT a LeetCode clone.
This is NOT an AI tutor.

It is a focused pattern-recognition and reasoning trainer.

Every feature must directly support this learning loop. Nothing else
belongs in V1, no matter how cheap it looks to add.

---

## Core User Loop

1. User logs in
2. User selects a curated problem
3. Recognition timer starts
4. User identifies the pattern ("I recognize it" / "I'm stuck")
5. Pattern Confirmation shows claimed vs. detected pattern
6. User writes their approach (plain language, not code)
7. Rubric Feedback evaluates the approach across four dimensions
8. If weak, user revises (max 2 attempts) — then auto-escalates to hints
9. Progressive Hints available on request, 5-level ladder
10. Session Summary closes the loop
11. User starts another problem

Nothing should interrupt this loop. Every screen in scope exists to
serve one of these eleven steps — nothing more.

**Note on scope:** V1 ends at reasoning evaluation, not code execution.
There is no "write code and run it" step in V1. This is a deliberate
cut, not an omission — see *Deliberate Cuts* below.

---

## MVP Screens (12, exact)

1. Landing
2. Login / Signup
3. Onboarding (skill self-assessment, focus areas)
4. Dashboard
5. Problem Selection
6. Recognition Screen
7. Pattern Confirmation
8. Approach Input
9. Rubric Feedback
10. Progressive Hints
11. Session Summary
12. Settings (BYOK)

No other screens exist in V1. Do not build routes, components, or API
calls for anything not on this list.

---

## Screen Details — V1 Behavior

### 1. Authentication (Login / Signup)
Login, Signup, Logout, session persistence. No profile settings beyond
what Onboarding collects.

### 2. Dashboard

Contains:

- Continue last session
- Start new session
- Recognition time (latest value)
- Recognition trend (only shown if sufficient session history exists)
- Recent sessions (last 5)

If the user has fewer than two completed sessions, display only the latest
recognition time instead of a trend chart.

Explicitly excluded:

- Weak Patterns widget
- Today's Focus
- Recommendations
- Personalization
- Streaks
- Goals

These all depend on systems intentionally deferred until after V1.
Do not display placeholders for them.

**Explicitly excluded:** Weak Patterns widget. This depends on Mistake
Memory, which is out of scope for V1 (see below). Do not stub it, fake
it, or show an empty placeholder claiming future data — omit it
entirely from the V1 layout.

### 3. Problem Selection
Curated set only. Pattern list, difficulty filter. No search, no
bookmarks, no recommendations engine.

**Explicitly excluded:** "Paste your own / external problem" path.
Deferred until a dedicated Pattern Detector eval set exists for
unlabeled input — see *Deliberate Cuts*.

### 4. Recognition Screen
Problem statement, recognition timer, "I recognize the pattern," "I'm
stuck" (with a short confirm step before it ends the session, to
prevent accidental clicks). No code editor. No hints shown
automatically.

**Data logging requirement:** log every "I'm stuck" outcome and its
timestamp even though no V1 screen displays it. This is the exact data
Mistake Memory will need in V1.1 — do not lose it now to save effort.

### 5. Pattern Confirmation
User's guess vs. detected pattern, confidence score in plain-language
bands (high / likely / uncertain), short one-line justification. No
long educational content.

### 6. Approach Input
Large textarea, placeholder "Describe your algorithm, not code." No
syntax highlighting, no code editor. Attempt counter shown explicitly
("Attempt 1 / 2"). Hard cap at 2 attempts, enforced server-side — after
2, auto-escalate to Progressive Hints rather than allowing further
retries.

### 7. Rubric Feedback

Four dimensions are scored independently.

- Pattern Fit
- Complexity
- Correctness
- Edge Cases

Each dimension receives a score from 1–5.

Backend computes the overall verdict using these scores.

Possible verdicts:

- Solid
- Needs Work

The language model never states the final verdict directly.

Frontend only renders the computed backend verdict.

Feedback contains:

- Strengths
- Improve

Maximum five concise feedback lines.

### 8. Progressive Hints
5-level ladder (technique family → key observation → data structure →
algorithm skeleton → implementation guidance). Server tracks position;
never repeats or skips levels. No full code revealed at any level in
V1.

### 9. Session Summary
Recognition time (+ comparison to last session), pattern
confirmed/mismatched, approach verdict and attempt count, next
recommendation (next curated problem in sequence — no personalization
logic required in V1).

**Explicitly excluded:** "Biggest Lesson" field. This is generated
from Reflection, which is out of scope for V1. Omit the field entirely
rather than leaving it blank or fake.

### 10. Settings (BYOK)

Contains:

- API Key input
- Test Connection button
- Supported providers
- Trust statement

Supported providers:

- OpenAI
- Anthropic
- Google Gemini
- OpenRouter
- Any OpenAI-compatible API

Trust statement:

"Your API keys are encrypted and never displayed again after saving."

Explicitly excluded:

- Themes
- Notifications
- Profile editing
- Account preferences
- Billing

---

## Deliberate Cuts — What's Out of V1, and Why

Each cut below is grouped by *reason*, because they don't all defer
for the same reason, and that matters for when each gets added back.

**Deferred — AI quality risk (needs an eval set first):**
- External / pasted problems (Pattern Detector has no eval set yet for
  unlabeled input; curated problems already have ground-truth
  patterns, making V1's classification job closer to a consistency
  check than real classification)

**Deferred — hypothesis scoping (tests a different, second-order claim):**
- Reflection
- Mistake Memory
- Pattern Transfer Challenge
- Learning Profile

  These test "does ThinkFlow build lasting understanding over time,"
  which only matters once V1 confirms the first-order claim: "do
  people want to do this recognition-and-reasoning exercise at all."

**Deferred — infrastructure risk (removes a whole class of build risk):**
- Code editor / code execution / solution running (removes sandboxed
  code execution — Judge0/Piston-class infra — entirely from V1;
  reasoning quality is evaluated via Rubric Feedback instead of
  correctness-via-execution)

**Deferred — not core to the thesis, ever:**
- Notifications, weekly goals, learning streaks, achievements,
  leaderboards, social features, friends, gamification, personal
  profile beyond Settings, light theme, advanced analytics, AI chat,
  pattern history graphs, email reminders, bookmarks, offline mode,
  multi-language support, export progress

---

## Success Metrics

V1 succeeds if users repeatedly complete the core loop. Track:

-Average recognition time

Median recognition time

(Use median for reporting because averages are distorted by unusually long
or interrupted sessions.)
- Recognition accuracy (claimed vs. detected pattern match rate)
- Approach submission rate (do users engage with Approach Input, or
  skip/abandon it)
- Sessions per user
- Problems completed per session
- Repeat weekly users

These are the only metrics that matter for the V1 decision. Everything
else is secondary until V1's hypothesis is confirmed.

---

## Design Principles

The interface must feel minimal, focused, quiet, professional — zero
distractions. Every screen has exactly one primary action. Every
screen answers one question. No decorative UI, no unnecessary
animations, no unnecessary clicks.

(Consistent with `design-system.md` — this section restates the
subset that applies most directly to V1 scope decisions, not a
replacement for that document.)

The interface must reduce cognitive load.

Users should never wonder what to do next.

Every screen presents exactly one primary action and one clear decision.
---
## V1 Data Collection

Although several learning features are intentionally deferred, V1 must log
the events required to build them later.

Log the following:

- Recognition start
- Recognition end
- Recognition duration
- Claimed pattern
- Detected pattern
- Pattern confidence
- Approach submission
- Rubric scores
- Attempt count
- Hint level requested
- Session completion
- "I'm stuck" events

V1 does not expose these logs to users.

They exist solely to support future learning features without requiring
schema changes.

## Technical Constraints

Desktop-first.

Responsive down to mobile.

Dark theme only for V1.

Keyboard accessible.

WCAG-compliant contrast.

Reusable components.

Fast initial load.

No code execution infrastructure.

No recommendation engine.

No search infrastructure.

No personalization engine.

No notification system.

No analytics dashboards beyond the metrics listed in this document.
---

## Implementation Rule

If a feature does not directly serve one of the 11 steps in the Core
User Loop, it does not belong in V1 — regardless of how small or cheap
it looks to add. Cheap-to-add is not the same as in-scope.

If you are unsure whether something belongs in V1, the default answer
is no. Defer it, log the data it would need (if applicable), and
revisit after V1's success metrics are in.
