Before starting any implementation:

Inspect the repository structure.
Read the relevant files under /docs (especially docs/api-architecture.md).
Understand the existing implementation before changing anything.
Search the existing codebase for similar functionality before creating new code.
Prefer extending existing patterns over introducing new patterns.
Do not rewrite working functionality unnecessarily.
Keep changes focused on the requested task.
Do not introduce dependencies unless they are genuinely required.
Do not change API contracts or database structures without checking the documentation and existing usage.
Preserve backward compatibility whenever possible.

## Router / service split — strict

Routers (`app/routers/*.py`) are HTTP boundary only:

- Parse/validate the request (Pydantic + FastAPI `Depends` do most of this automatically).
- Resolve the URL/path — routing, prefixes, path/query params.
- Call one (or a small, orchestrating handful of) service function(s).
- Map the service's return value onto the response schema.
- Translate domain errors into HTTP (`AppError` may be raised directly in a
  router only for pure request-shape checks that need no DB access, e.g. a
  missing cookie in `auth.py`'s `refresh()`).

A router file must **never** touch `db` directly — no `db.exec`, `db.get`,
`db.add`, `db.commit`, `db.refresh`, `db.delete`. If a router needs data, it
calls a service function for it, even a one-line lookup. `list_users()` in
`user_service.py` and `get_user_or_401()` in `auth_service.py` exist
specifically so routers never run a bare `select(User)` or `db.get(User, id)`
themselves.

Services (`app/services/*.py`) own all data access and business logic:
queries, mutations, existence checks (`get_x_or_404`), ownership/permission
rules, and the transaction boundary. Two tiers, by convention already
established in `submission_service.py` / `report_service.py` /
`auth_service.py`:

- **Top-level service functions** — the ones a router calls directly — own
  the unit of work: they `db.add(...)`, then `await db.commit()` and
  `await db.refresh(...)` before returning. Example:
  `user_service.update_status()`.
- **Composable/leaf service functions** — called by *other* service
  functions, not directly by a router — use `db.flush()` and never commit,
  so they can be combined inside a caller's larger transaction without
  prematurely closing it. Example: `credit_service.grant_credit()` is called
  both from `user_service.grant_credit()` (which commits) and from inside
  `submission_service.upload_submission()` (which commits later, after other
  writes in the same transaction).

When adding an endpoint: write the service function first (it's what's
actually testable without HTTP), then a thin router function that calls it.
