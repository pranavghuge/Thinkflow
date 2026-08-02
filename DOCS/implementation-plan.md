# implementation-plan.md

## Summary

Build a dark, desktop-first V1 focused solely on the recognition-and-reasoning loop. `mvp-scope.md` governs scope conflicts; the reviewed source set is :codex-file-citation{path="C:\Users\Dell\Downloads\mvp-scope.pdf" purpose="source"}, :codex-file-citation{path="C:\Users\Dell\Downloads\frontend-spec.pdf" purpose="source"}, :codex-file-citation{path="C:\Users\Dell\Downloads\design-system.pdf" purpose="source"}, :codex-file-citation{path="C:\Users\Dell\Downloads\frontend-architecture.pdf" purpose="source"}, and :codex-file-citation{path="C:\Users\Dell\Downloads\screen-specifications.pdf" purpose="source"}.

Resolved V1 decisions:

- Use one persisted session route: `/session/[id]`.
- Collect the claimed pattern with a compact, controlled single-choice selector.
- An “I’m stuck” outcome is logged, then continues through Pattern Confirmation; after hints, the session proceeds to Session Summary. No code execution or extra approach attempt is allowed.

## 1. Project Structure

```text
app/
  layout.tsx
  (marketing)/
    page.tsx
  (auth)/
    login/page.tsx
    signup/page.tsx
    onboarding/page.tsx
  (app)/
    layout.tsx
    dashboard/page.tsx
    problems/page.tsx
    session/[id]/page.tsx
    settings/page.tsx

components/
  ui/                 # Generic primitives and shadcn-based variants
  layout/             # Marketing, auth, app shells and navigation
  shared/             # Cross-feature empty, error, loading, status UI

features/
  auth/
  onboarding/
  dashboard/
  problems/
  session/
    components/       # Recognition, confirmation, approach, rubric, hints, summary
    hooks/
    services/
    types/
    utils/
  settings/

lib/
  api/                # Typed transport, error normalization, query client
  validation/         # Shared Zod helpers
  utils.ts

mocks/
  data/               # Curated problems, dashboard, session, provider fixtures
  repositories/       # Mock persistence and deterministic service behavior

store/
  auth-store.ts

types/
  common.ts

constants/
  routes.ts
  patterns.ts
  providers.ts

styles/
  globals.css
```

Use lowercase kebab-case for custom files; retain Next.js conventions such as `page.tsx` and `layout.tsx`. Feature-local types, hooks, services, and utilities remain inside their feature. Only genuinely cross-feature code moves to shared folders.

## 2. Route Plan

| Route | Access | Layout | Purpose |
|---|---|---|---|
| `/` | Public | Marketing | Landing |
| `/login` | Public | Auth | Email/password login |
| `/signup` | Public | Auth | Email/password signup |
| `/onboarding` | Authenticated, incomplete onboarding | Auth | Skill level and focus areas |
| `/dashboard` | Protected | App | Continue/start practice, latest metric, recent sessions |
| `/problems` | Protected | App | Curated pattern list and difficulty filter |
| `/session/[id]` | Protected | App | Recognition through Summary, rendered from persisted session phase |
| `/settings` | Protected | App | BYOK input, connection test, supported providers, trust statement |

Unauthenticated users attempting protected routes redirect to `/login`; authenticated users who have not completed onboarding redirect to `/onboarding`. No other application routes are created.

## 3. Layout Plan

- **Marketing Layout:** minimal wordmark, concise navigation to Login/Signup, centered content, simple footer.
- **Auth Layout:** distraction-free centered form container; no app navigation.
- **App Layout:** persistent desktop sidebar/top bar with only Dashboard, Practice, Settings, and Logout. Mobile collapses navigation without removing destinations.
- **Session presentation:** stays inside App Layout and shows the active phase, current problem context, and a clear back/exit behavior without exposing deferred areas.

## 4. Reusable Component Inventory

| Component | Responsibility / key props | States | Reuse |
|---|---|---|---|
| `Button` | `variant`, `size`, `loading`, `disabled`, icon slot | default, hover, focus, disabled, loading, destructive | All screens |
| `FormField` | `label`, `description`, `error`, child control | default, invalid, disabled | All forms |
| `TextInput` / `PasswordInput` / `Textarea` | Typed form controls with accessible labels | focus, invalid, disabled, read-only | Auth, approach, settings |
| `Card` | Spaced visual section with optional header/footer | default, loading | Dashboard, problems, session, settings |
| `Badge` / `Chip` | Compact status, pattern, difficulty, confidence display | neutral, success, warning, error, selected | Multiple features |
| `Dialog` | Confirmation for irreversible/interrupting actions | open, closing, loading | “I’m stuck” confirmation |
| `Skeleton` | Preserve layout during data loading | loading | Dashboard and async session phases |
| `EmptyState` | Explain missing data and offer one next action | empty | Dashboard, recent sessions, problems |
| `ErrorState` | Explain failure and expose retry | error, retrying | Query-backed views |
| `StatusMessage` | Accessible success, warning, or error feedback | info, success, warning, error | Forms and settings |
| `AppNavigation` | Current-route navigation and logout | expanded, collapsed | App Layout |
| `RecognitionTimer` | Elapsed recognition time; visual display only | running, stopped | Session phases |
| `PatternSelector` | Controlled claimed-pattern choice | empty, selected, invalid, disabled | Recognition |
| `RubricScoreList` | Four backend-provided scores and verdict | loading, populated | Rubric and summary |
| `HintLadder` | Five sequential server-owned hint levels | current, locked, completed, loading | Hints and summary |

## 5. Feature Modules

- **Auth:** login, signup, logout, persisted session recovery. Owns auth forms, validation, and auth service calls. Auth identity is global; form state remains local.
- **Onboarding:** submits skill self-assessment and focus areas only. Owns the short form and its validation.
- **Dashboard:** fetches current user’s active session, latest recognition time, optional trend, and five recent sessions. No weak patterns, goals, recommendations engine, personalization, or streaks.
- **Problems:** displays only curated problems, filtered by pattern and difficulty. Starting a selection creates a session; resuming uses its existing session ID.
- **Session:** owns all six persisted phases: Recognition, Pattern Confirmation, Approach Input, Rubric Feedback, Progressive Hints, Session Summary. Server data owns phase, attempts, scores, hint level, and completion status.
- **Settings:** owns API-key entry, connection testing, static provider list, and encrypted-key trust message. No profile, notification, theme, billing, or account-preference UI.

## 6. State Management Plan

- **Local React state:** transient UI only—open dialogs, selected pattern before submit, local input affordances, and responsive navigation visibility.
- **Zustand:** authenticated identity and authentication status only. Do not store API responses, raw API keys, rubric data, or session data here.
- **TanStack Query:** dashboard data, curated problems, active session state, hint progression, session summary, and API-key status/test result. Mutations invalidate only affected queries.
- **React Hook Form + Zod:** login, signup, onboarding, approach, and API-key forms. Validation messages remain colocated with fields.

This keeps backend-owned progress authoritative and prevents stale duplicated session state.

## 7. API Integration Plan

Implement typed mock services first; pages and components only call feature hooks.

| Screen | Mock endpoint/service | Request | Response / UI states |
|---|---|---|---|
| Landing | None | — | Static; primary CTA routes to Signup |
| Login | `POST /auth/login` | email, password | Auth session; button loading, inline validation/API error, redirect Dashboard |
| Signup | `POST /auth/signup` | email, password, confirmation | Auth session; loading/error, redirect Onboarding |
| Onboarding | `POST /onboarding` | skill level, focus areas | Completion state; loading/error, redirect Dashboard |
| Dashboard | `GET /dashboard` | — | Active session, latest metric, optional trend, five recent sessions; skeleton, zero-session empty state, retry |
| Problem Selection | `GET /problems` | pattern, difficulty | Curated problem list; skeleton, no-results empty state, retry |
| Start/Resume | `POST /sessions` / `GET /sessions/:id` | selected problem or session ID | Session ID and persisted phase; button loading and recoverable error |
| Recognition | `PATCH /sessions/:id/recognition` | duration, claimed pattern, stuck flag, timestamp | Next phase and logged event; timer stays local, submit state and error retry |
| Pattern Confirmation | session response | session ID | Claimed/detected pattern, confidence band, one-line reason; skeleton and retry |
| Approach Input | `POST /approaches` | session ID, plain-language approach | Rubric result, attempt count, next phase; field validation, submit loading, concise error |
| Rubric Feedback | approach response | — | Four 1–5 scores, computed verdict, max five feedback lines; retry/revise or hints transition |
| Progressive Hints | `POST /hints` | session ID, requested next level | Current level, hint text, next phase; locked controls while loading, retry |
| Session Summary | `GET /session-summary` | session ID | Recognition comparison, match status, verdict, attempt count, next curated problem; skeleton, retry, success CTA |
| Settings | `PUT /settings/api-key`, `POST /settings/api-key/test` | provider, key | Masked saved status or connection result; button loading, field error, accessible success/error message |

## 8. Mock Data Strategy

- Define feature-facing TypeScript interfaces first; mocks and future HTTP services implement the same contracts.
- Store curated problems with fixed ground-truth pattern metadata, difficulty, and deterministic next-problem order.
- Use a small mock repository with browser persistence for authentication, onboarding completion, session phase, attempts, hints, and event logs.
- Keep `I'm stuck` events, recognition timestamps/durations, claimed/detected patterns, rubric scores, attempt counts, hint levels, and completion events even though V1 does not expose all of them.
- Provide deterministic loading/error toggles in mock services for state testing. Never store or return a raw saved API key after submission.

## 9. Screen Dependency Graph

```text
Foundation → layouts/primitives → auth/onboarding
  → dashboard/problems → session creation/recognition
  → confirmation → approach/rubric → hints → summary
  → settings → end-to-end state/accessibility hardening
```

This order establishes the design system and protected shell once, then validates the core hypothesis loop before secondary V1 settings work. The single session route minimizes route and state duplication across the six session phases.

## 10. Development Milestones

1. **Foundation:** Next.js configuration, strict TypeScript, Tailwind/shadcn setup, tokens, query client, mock repository, generic states, and layouts.
2. **Access and setup:** Landing, Login, Signup, Onboarding, auth persistence, protected-route handling.
3. **Practice entry:** Dashboard and curated Problem Selection with empty/loading/error behavior and session creation/resume.
4. **Core learning loop:** Recognition, controlled pattern claim, confirmation, approach submission, rubric feedback, two-attempt cap, five-level hints, and summary.
5. **BYOK and hardening:** Settings key save/test flow, responsive polish, keyboard paths, state coverage, performance checks, and end-to-end loop verification.

Each milestone ends with a runnable application using only mock services.

## 11. Quality Checklist

Before a screen is complete:

- Uses strict TypeScript; no `any`, anonymous components, duplicated business logic, inline styles, or unnecessary effects.
- Matches the V1 scope, approved visual language, and single-primary-action rule.
- Uses existing primitives where applicable; feature-specific logic stays inside its feature.
- Works on desktop, tablet, and mobile without hiding V1 functionality.
- Uses semantic HTML, visible focus, keyboard operation, form labels/errors, screen-reader status messages, and WCAG-compliant contrast.
- Implements appropriate loading, empty, error, disabled, and success states.
- Uses typed mock services rather than hardcoded response shapes.
- Has no console warnings/errors and no stale state after refresh.
- Avoids unnecessary dependencies, heavy animation, and premature optimization.

## 12. Risks and Mitigations

- **Scope creep:** maintain the exact V1 route/feature allowlist; reject deferred UI and APIs during review.
- **Session-phase inconsistency:** make phase, attempt count, hint level, and completion backend/mock-repository owned; validate invalid phase transitions.
- **API contract drift:** isolate every call behind typed feature services and use mock contracts as the backend handoff.
- **BYOK exposure:** never persist raw keys in client state or render saved values; show only saved/masked status.
- **Async evaluation failures:** preserve submitted approach text, use recoverable errors, and allow service-level retry without resetting a session.
- **Accessibility regressions:** test keyboard-only navigation and screen-reader labels per milestone; use semantic controls rather than visual click targets.
- **Sparse dashboard data:** explicitly support zero and one completed-session states; render the trend only with sufficient history.
- **Solo-engineer overload:** build shared primitives once, defer all non-loop features, and avoid Redux, code-execution infrastructure, search, and recommendation systems.
