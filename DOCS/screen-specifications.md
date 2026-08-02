# ThinkFlow Screen Specifications v1.0

---

# Purpose

This document defines every screen in ThinkFlow.

For every screen, this document specifies:

- Purpose
- User goal
- Layout
- Components
- Interactions
- Validation
- Navigation
- API dependency
- Loading state
- Empty state
- Error state
- Success state
- Accessibility
- Responsive behavior

The approved wireframes are the visual source of truth.

This document is the implementation source of truth.

Never invent UI beyond what is defined here.

---

# Global Rules

Every screen must

✓ Follow frontend-spec.md

✓ Follow design-system.md

✓ Follow frontend-architecture.md

✓ Match approved wireframes

✓ Support accessibility

✓ Support responsive layouts

✓ Support loading

✓ Support empty state

✓ Support errors

✓ Support success state

✓ Never introduce new design patterns

---

# Standard Screen Template

Every screen should follow exactly this structure.

--------------------------------------------

Screen Name

Purpose

Primary User Goal

Route

Authentication

Layout Used

Components

Page Structure

Primary CTA

Secondary Actions

Navigation

Business Rules

Validation Rules

API Endpoints

Loading State

Empty State

Error State

Success State

Accessibility Requirements

Responsive Behavior

Future Notes

--------------------------------------------

All screens below use this template.

---

# 1. Landing Page

Purpose

Introduce ThinkFlow and explain the value proposition.

Primary User Goal

Understand the product and sign up.

Route

/

Authentication

Public

Layout

Marketing Layout

Components

Navbar

Hero

Value Proposition

How It Works

Core Features

Testimonials (optional)

CTA Section

Footer

Primary CTA

Get Started

Secondary CTA

GitHub

Navigation

Login

Signup

Business Rules

Never overwhelm users.

Keep copy concise.

API

None

Loading

None

Empty

N/A

Errors

N/A

Accessibility

Keyboard accessible

Responsive

Desktop → Tablet → Mobile

---

# 2. Login

Purpose

Authenticate existing users.

Route

/login

Layout

Auth Layout

Components

Login Form

Remember Me

Forgot Password

Validation

Email

Password

API

POST /auth/login

Loading

Button spinner

Error

Inline validation

Success

Redirect Dashboard

---

# 3. Signup

Purpose

Create account.

Route

/signup

Components

Signup Form

Validation

Email

Password

Confirm Password

API

POST /auth/signup

Success

Redirect onboarding

---

# 4. Onboarding

Purpose

Collect skill level and learning goals.

Components

Skill Assessment

Pattern Selection

Focus Areas

Progress Indicator

API

POST /onboarding

Success

Dashboard

---

# 5. Dashboard

Purpose

Learning home.

Components

Today's Focus

Recognition Trend

Weak Patterns

Suggested Problem

Recent Sessions

Quick Actions

Primary CTA

Continue Practice

API

GET /dashboard

Loading

Skeleton cards

Empty

First-time user dashboard

Error

Retry state

---

# 6. Problem Selection

Purpose

Select a practice problem.

Components

Filters

Search

Problem Cards

Difficulty

Estimated Recognition Time

Continue Previous

API

GET /problems

POST /problems/external

---

# 7. Recognition Screen

Purpose

Measure pattern recognition.

Components

Problem Statement

Recognition Timer

Recognize Pattern Button

I'm Stuck Button

Business Rules

Timer starts immediately.

Timer stops only after user decision.

API

POST /sessions

PATCH /recognition

---

# 8. Pattern Confirmation

Purpose

Compare user guess with AI.

Components

Detected Pattern

Confidence

Explanation

Why Your Guess

Continue Button

API

Pattern Detector

---

# 9. Approach Input

Purpose

Collect reasoning.

Components

Editor

Character Counter

Submit

Attempts Remaining

API

POST /approaches

Validation

Minimum length

---

# 10. Rubric Feedback

Purpose

Evaluate reasoning.

Components

Dimension Scores

Strengths

Weaknesses

Recommendations

Continue

Retry

API

Approach Checker

---

# 11. Progressive Hints

Purpose

Reveal hints gradually.

Components

Hint Cards

Current Level

Reveal Next

History

Business Rules

Sequential only.

No skipping.

API

POST /hints

---

# 12. Code Editor

Purpose

Solve the problem.

Components

Editor

Language Selector

Run

Submit

API

POST /solution

---

# 13. Reflection

Purpose

Capture learning.

Components

Worked Well

Didn't Work

Self Rating

Lesson Learned

API

POST /reflection

---

# 14. Session Summary

Purpose

Summarize learning.

Components

Recognition Time

Pattern Accuracy

Rubric Summary

Biggest Lesson

Suggested Next Problem

API

GET /session-summary

---

# 15. Mistake Memory

Purpose

Display recurring mistakes.

Components

Pattern

Mistake

Occurrences

Severity

Resolved Status

API

GET /mistake-memory

---

# 16. Pattern Transfer Challenge

Purpose

Test knowledge transfer.

Components

Challenge Card

Recognition

Approach

Result

API

POST /transfer-challenges

---

# 17. Learning Profile

Purpose

Display long-term learning metrics.

Components

Recognition Speed

Pattern Accuracy

Transfer Rate

Strongest Patterns

Weakest Patterns

History

API

GET /learning-profile

---

# 18. Settings

Purpose

Manage account and BYOK.

Components

Profile

API Key

Account

Danger Zone

API

PUT /settings/api-key

DELETE /settings/api-key

---

# Universal Screen Rules

Every screen must implement

Loading

Empty

Error

Success

Keyboard Navigation

Focus Management

Responsive Layout

Accessible Labels

No console errors

No duplicated UI

---

# Screen Acceptance Checklist

A screen is complete only if

✓ Matches approved wireframe

✓ Matches design system

✓ Matches frontend architecture

✓ Uses reusable components

✓ Fully typed

✓ Responsive

✓ Accessible

✓ Uses proper loading state

✓ Uses proper error state

✓ Uses proper empty state

✓ Uses proper success state

✓ API ready

✓ Production ready

---

# Final Instruction to Codex

Treat this document as the implementation contract.

Do not invent layouts, interactions, components, or business logic.

If something is ambiguous, choose the simplest implementation that aligns with:

1. frontend-spec.md
2. design-system.md
3. frontend-architecture.md
4. approved wireframes

The goal is not to generate attractive mockups.

The goal is to implement a production-quality frontend that is maintainable, accessible, consistent, and faithful to the ThinkFlow product vision.
