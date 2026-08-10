# Secret Whiz Web

Next.js 16 (App Router) frontend for Secret Whiz, using React 19, Tailwind CSS 4, and TanStack Query.

## Prerequisites

- Node.js 20+ and npm
- The [API](../api/README.md) running locally (this app talks to it over HTTP)

## Setup

1. **Configure environment variables**

   Create/check `.env.local` in this directory:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

   Point this at wherever the API is running.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3333](http://localhost:3333) — the dev server runs on port `3333` (see the `dev` script in `package.json`), not the Next.js default `3000`, since the API's `CORS_ORIGINS` is configured to allow that origin.

## Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build (also on port 3333)
npm run lint    # run ESLint
```

## Project layout

```
web/
├── app/
│   ├── (user)/     # Public/user-facing routes
│   ├── admin/      # Admin routes
│   ├── layout.tsx  # Root layout
│   └── globals.css
├── components/     # Shared UI components
├── lib/            # API client, utilities, hooks
└── types/          # Shared TypeScript types
```

## Notes

- This project pins specific versions of Next.js/React that may include breaking changes relative to older docs/training data — see `AGENTS.md` for details before making framework-level changes.
- Make sure PostgreSQL, Redis, and the API are all running first (see the [API README](../api/README.md)); otherwise requests from this app will fail.
