# ThinkFlow Frontend Architecture v1.0

---

# 1. Purpose

This document defines how the ThinkFlow frontend is structured.

The goal is to build a frontend that is:

- Maintainable
- Scalable
- Consistent
- Testable
- Easy to understand
- Easy to extend

This architecture is designed for an MVP supporting approximately 100–500 monthly active users.

Do not introduce unnecessary architectural complexity.

---

# 2. Guiding Principles

Every architectural decision should prioritize:

- Simplicity
- Readability
- Reusability
- Predictability
- Separation of concerns

Business logic should never be tightly coupled with presentation.

Components should remain focused on rendering UI.

---

# 3. Technology Stack

Framework

Next.js (App Router)

Language

TypeScript (strict mode)

Styling

Tailwind CSS

UI Components

shadcn/ui

Icons

Lucide React

Charts

Recharts

Animations

Framer Motion (minimal only)

Forms

React Hook Form

Validation

Zod

Client State

Zustand

Server State

TanStack Query

---

# 4. Folder Structure

/app
    /(marketing)
    /(auth)
    /(dashboard)
    layout.tsx
    page.tsx

/components
    /ui
    /shared
    /charts
    /layout

/features
    /dashboard
    /problems
    /recognition
    /pattern-detector
    /approach-checker
    /hints
    /reflection
    /mistake-memory
    /transfer
    /profile
    /settings

/services

/store

/hooks

/lib

/utils

/types

/constants

/styles

/public

/docs

Each folder has one responsibility.

Avoid dumping unrelated code into shared folders.

---

# 5. Feature-Based Architecture

Every major feature owns its own files.

Example

/features/recognition

    components/

    hooks/

    services/

    types/

    utils/

Avoid giant shared folders containing everything.

Features should remain isolated.

---

# 6. Routing Strategy

Routes

/

Landing

/login

/signup

/onboarding

/dashboard

/problems

/session/[id]

/reflection

/profile

/settings

Protected routes

Dashboard onward requires authentication.

Landing and authentication remain public.

---

# 7. Layout Architecture

Three layouts only.

Marketing Layout

Landing pages

Auth Layout

Login

Signup

Onboarding

App Layout

Dashboard

Problems

Recognition

Profile

Settings

Navigation remains consistent within the App Layout.

---

# 8. Component Architecture

Three component levels.

UI Components

Pure reusable primitives.

Examples

Button

Card

Input

Badge

Dialog

Feature Components

Recognition Timer

Pattern Card

Reflection Form

Mistake List

Dashboard Widgets

Layout Components

Navbar

Sidebar

Topbar

Footer

Each component should solve one problem.

---

# 9. State Management

Use the smallest possible state scope.

Local State

Temporary UI state

Global State (Zustand)

Authentication

Theme (future)

Current session metadata

Server State (TanStack Query)

API responses

Caching

Refetching

Forms

React Hook Form

Avoid placing server data inside Zustand.

---

# 10. API Layer

UI components must never call fetch() directly.

All API communication goes through the service layer.

Example

/services/problem-service.ts

/services/session-service.ts

/services/dashboard-service.ts

Services return typed data.

---

# 11. Data Flow

User Action

↓

Feature Component

↓

Hook

↓

Service

↓

API

↓

Service

↓

Hook

↓

Component

↓

UI Update

Data should flow in one direction.

---

# 12. Custom Hooks

Use hooks for reusable logic.

Examples

useRecognitionTimer()

useDashboard()

useHints()

useSession()

Avoid placing rendering logic inside hooks.

---

# 13. Forms

Every form follows the same flow.

Input

↓

Validation (Zod)

↓

Submission

↓

Loading

↓

Success/Error

↓

UI Update

No manual validation duplication.

---

# 14. Error Handling

Errors should be predictable.

Inline errors

Validation

Toast

Short-lived notifications

Error page

Unexpected application failures

Never silently fail.

Every API failure should provide useful feedback.

---

# 15. Loading Strategy

Prefer skeletons over spinners.

Button loading

Small spinner

Page loading

Skeleton layout

Chart loading

Chart skeleton

Avoid blank screens.

---

# 16. Authentication Architecture

Authentication state is global.

Protected routes redirect unauthenticated users.

User session should remain available across refreshes.

Do not expose sensitive information in the frontend.

---

# 17. File Naming

Use lowercase kebab-case.

Examples

dashboard-card.tsx

recognition-timer.tsx

pattern-detector.tsx

Avoid abbreviations.

Use descriptive names.

---

# 18. Import Rules

Use path aliases.

Example

@/components

@/features

@/hooks

@/services

Avoid long relative paths.

---

# 19. TypeScript Rules

Strict mode.

No any.

Shared interfaces belong inside /types.

Feature-specific types stay inside the feature.

Prefer explicit types over inference when it improves readability.

---

# 20. Styling Rules

Tailwind only.

No inline styles.

No duplicated utility combinations.

Create reusable component variants where appropriate.

---

# 21. Performance Strategy

Optimize only where needed.

Use

Lazy loading

Dynamic imports

Memoization (only when beneficial)

Optimized images

Avoid premature optimization.

---

# 22. Accessibility Strategy

Keyboard navigation

Semantic HTML

Focus indicators

Screen reader labels

Accessible forms

Every interactive element should be usable without a mouse.

---

# 23. Responsive Strategy

Desktop first.

Tablet fully supported.

Mobile functional.

Do not create separate codebases.

Use responsive layouts.

---

# 24. Reusability Rules

A component becomes reusable only if:

It is used by multiple features

OR

It represents a reusable UI primitive.

Do not over-abstract.

Duplication is acceptable until a genuine reuse pattern appears.

---

# 25. Code Quality Rules

Every file should have one responsibility.

Keep components small.

Avoid deeply nested JSX.

Avoid unnecessary props.

Prefer composition over inheritance.

---

# 26. Logging & Debugging

Development builds should provide meaningful console output only when useful.

Do not leave debug logs in production.

Errors should be easy to trace.

---

# 27. Testing Readiness

Architecture should make future testing straightforward.

Components should remain deterministic.

Business logic should be isolated.

Avoid hidden side effects.

---

# 28. Definition of Done

A frontend feature is complete only when:

✓ Matches the approved wireframe

✓ Follows frontend-spec.md

✓ Follows design-system.md

✓ Uses feature-based architecture

✓ Fully typed

✓ Responsive

✓ Accessible

✓ Loading state implemented

✓ Error state implemented

✓ Empty state implemented

✓ Success state implemented

✓ No duplicated business logic

✓ No console errors

✓ Ready for backend integration

---

# 29. Architectural Non-Goals

Do not introduce:

Redux

Micro-frontends

Complex plugin systems

Event buses

CQRS

Dependency injection frameworks

State machines

Heavy design-token infrastructure

These are unnecessary for the MVP.

---

# 30. Final Instruction to Codex

Implement ThinkFlow as a clean, production-quality frontend.

Whenever multiple architectural choices are valid:

Choose the solution that is simpler, easier to maintain, and aligns with the frontend specification and design system.

Do not optimize for hypothetical future scale.

Optimize for clarity, correctness, and maintainability for an MVP supporting approximately 100–500 monthly active users.
