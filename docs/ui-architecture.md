# UI Architecture — Admin & User

Single Next.js app (App Router) serving both the Admin panel and the public/User
experience, sharing one component library and design system. Not split into
separate apps — Admin and User are route groups within the same codebase.

## 1. Project Structure

```
web/
  app/
    (user)/                       # public/user route group — no URL prefix
      layout.tsx                  # user shell: header, nav, footer
      page.tsx                    # landing page
      events/
        page.tsx                  # browse events
        [eventId]/
          page.tsx                 # event detail (current stage, submissions)
          submit/page.tsx          # upload submission form
      leaderboard/[stageId]/page.tsx
      login/page.tsx
      register/page.tsx
      profile/page.tsx
    admin/                         # admin route group — /admin/*
      layout.tsx                   # admin shell: sidebar nav, auth-guarded
      dashboard/page.tsx
      event-types/
        page.tsx                   # list + create
        [id]/page.tsx               # edit
      events/
        page.tsx
        [id]/
          page.tsx                  # event detail
          stages/page.tsx           # configure stages + time windows
      moderation/page.tsx           # approve/reject submissions queue
      users/page.tsx
    layout.tsx                     # root layout (fonts, providers, Tailwind globals)
                                    # NOTE: no app/api/ route handlers — Next.js is never
                                    # a proxy. All data access, from both Server Components
                                    # and Client Components, targets FastAPI directly.
  components/
    ui/                            # shadcn/ui primitives only — Button, Input, Dialog,
                                    # Table, Card, Badge, Tabs, Toast. No business logic.
    shared/                        # reusable business components used by BOTH admin & user
      SubmissionCard.tsx
      VideoPlayer.tsx
      ImageViewer.tsx
      EventTypeBadge.tsx
      StageTimelineBadge.tsx       # shows "closes in 2d 4h" style countdown
      VoteCount.tsx
      CreditBalanceBadge.tsx       # shown in both the user header and admin user-detail view
    admin/                         # admin-only composite components
      StageConfigForm.tsx
      EventTypeForm.tsx
      ModerationQueueTable.tsx
      UserRoleTable.tsx
      CouponForm.tsx
      CouponListTable.tsx
      GrantCreditForm.tsx          # admin manually credits a user
    user/                          # user-only composite components
      SubmissionUploadForm.tsx     # blocks submit + shows "buy/redeem credits" prompt at 0 balance
      VoteButton.tsx
      LeaderboardList.tsx
      RedeemCouponForm.tsx
      BuyCreditsModal.tsx          # Razorpay checkout trigger
  lib/
    api-client.ts                  # typed fetch wrapper for the FastAPI backend
    auth.ts                        # token storage, refresh handling
    hooks/                         # useEvents, useSubmissions, useVote, useAuth ...
    utils/                         # formatDate, formatCountdown, cn (class merge)
  types/                           # TS types mirroring backend Pydantic schemas
  styles/
    globals.css                    # Tailwind base + design tokens
```

**Rule of thumb for where a component goes:** if it has zero business meaning (a
button, a modal shell) → `components/ui`. If it renders domain data
(a submission, a vote count, a stage countdown) and is used on both the admin and
user side → `components/shared`. If it's tied to one side's workflow only →
`components/admin` or `components/user`.

## 2. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Component files & exports | PascalCase | `SubmissionCard.tsx` exporting `SubmissionCard` |
| Hooks | camelCase, `use` prefix | `useSubmissions.ts` |
| Utils/helpers | camelCase | `formatCountdown.ts` |
| Folders/routes | kebab-case | `event-types/`, `[eventId]/` |
| Component props type | `{ComponentName}Props` | `SubmissionCardProps` |
| Non-page components | one component per file, colocated only if trivially small (e.g. a sub-row) | — |

## 3. Component Pattern

- **Pages are composition, not logic.** A page (`app/.../page.tsx`) fetches data
  via a hook and lays out shared/admin/user components — it should not contain
  form logic, fetch logic, or business rules inline.
- **`components/ui` is presentational only** — no data fetching, no API calls, ever.
- **`components/shared` is presentational + prop-driven** — receives data via props,
  does not fetch its own data, so it stays reusable on both sides.
- **`components/admin` / `components/user`** can own their own data fetching via
  hooks, since they're workflow-specific.

## 4. State Management

- **Server state** (anything from the API): **TanStack Query** (React Query) —
  handles caching, revalidation, and loading/error states consistently. All API
  reads/writes go through `lib/hooks/*`, never a raw `fetch` inside a component.
- **Auth/session state**: a small React Context (`AuthProvider`) holding the
  current user + token refresh logic — the only piece of true global client state.
- **Forms**: `react-hook-form` + `zod` for schema validation, mirroring the
  validation already enforced by Pydantic on the backend (keep the zod schema
  and the Pydantic schema in sync by hand for now; codegen from OpenAPI is a
  later optimization, not MVP).

## 5. Styling

- **Tailwind CSS**, utility classes directly in JSX — no separate CSS files
  except `globals.css` for base tokens (colors, font, spacing scale).
- **shadcn/ui** components live in `components/ui/`; customize via Tailwind
  classes/config, don't fork their internal logic.
- Design tokens (brand colors, spacing) defined once in `tailwind.config.ts` —
  components reference tokens (`bg-primary`), never raw hex values.
- Support `dark:` variants from day one via Tailwind's dark mode class strategy,
  even if a theme toggle isn't in the MVP UI.

## 6. Data Fetching Convention

- **No Next.js API layer.** There are no `app/api/*` route handlers acting as
  a proxy/BFF. `lib/api-client.ts` and every hook built on it call the FastAPI
  backend **directly** — from the browser in Client Components, and
  server-to-server (no CORS involved) from Server Components during SSR.
- All backend calls go through `lib/api-client.ts`, a thin typed wrapper around
  `fetch` that attaches the `Authorization: Bearer <token>` header, the base
  URL (`NEXT_PUBLIC_API_URL`, e.g. `http://localhost:9999` in dev — Next.js
  itself runs on port `3333`), `credentials: 'include'` (for the refresh-token
  cookie), and normalizes the error envelope from the API (see
  `api-architecture.md`).
- Every resource gets one hook file: `useEvents`, `useEvent(id)`,
  `useSubmissions(stageId)`, `useVote()` — components never import
  `api-client.ts` directly.
- Large file uploads (video/image submissions) go straight from the browser to
  FastAPI via `api-client.ts` — this is a direct benefit of not having a Next.js
  proxy layer, since a proxy would otherwise have to buffer the entire upload
  before forwarding it.
- Because the browser calls FastAPI cross-origin, correct CORS + cookie-domain
  configuration on the backend is required for auth to work — see
  "CORS & Cross-Origin" in `api-architecture.md`.
