# Forge Online

`forge-online` is a multi-user GitHub repository dashboard. Users sign in with GitHub OAuth, sync their own repositories, and track project progress using Forge-style metadata (`goal`, `status`, `notes`, `nextStep`).

## What it does

- Authenticates users with GitHub OAuth.
- Syncs authenticated users' owned repositories from GitHub (including private repos when permission is granted).
- Stores per-user cache, metadata, and sync state in Netlify Blobs.
- Supports search, filters, sorting, summary cards, and manual sync.
- Computes automatic status heuristics (`active`, `wip`, `abandoned`) with manual override support (`done` included).

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Auth.js (`next-auth`) with GitHub provider
- Netlify Blobs (`@netlify/blobs`)
- Zod validation
- Netlify Next.js Runtime (`@netlify/plugin-nextjs`)

## Architecture notes

- GitHub API calls run only on the server.
- OAuth access tokens stay server-side.
- Netlify Blobs keys are scoped per authenticated GitHub user.
- `proxy.ts` enforces auth redirects for pages and API calls.

## Required environment variables

Copy `.env.example` to `.env.local` for local development and configure the same values in Netlify production:

```bash
cp .env.example .env.local
```

### Authentication

- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `NEXTAUTH_SECRET`

### Optional local/off-platform Blobs credentials

These are usually not needed on Netlify runtime:

- `NETLIFY_BLOBS_SITE_ID`
- `NETLIFY_BLOBS_TOKEN`

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.
3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Status heuristics

When no manual override is set:

- pushed or updated within 30 days -> `active`
- pushed or updated within 90 days -> `wip`
- older than 90 days -> `abandoned`
- archived repositories default to `abandoned`
- manual override always wins

## Main routes

### Pages

- `/login`
- `/dashboard`

### Authenticated API routes

- `GET /api/dashboard`
- `POST /api/sync`
- `GET /api/repos/[repoId]/metadata`
- `PUT /api/repos/[repoId]/metadata`

### Auth routes

- `GET|POST /api/auth/[...nextauth]`

## Netlify deployment

This repo includes `netlify.toml` and pins the Netlify Next.js Runtime via `@netlify/plugin-nextjs`.

### Deploy steps

1. Push the repository to GitHub.
2. Create a Netlify site from the repo.
3. Add all required environment variables from `.env.example`.
4. Trigger a deploy.

### Notes

- Netlify should auto-detect Next.js.
- Cookie security is handled by Auth.js and production HTTPS.
- No Supabase setup is required.

## Verification checklist

- GitHub sign-in succeeds and redirects to `/dashboard`.
- Unauthenticated requests redirect to `/login` or return `401` for protected APIs.
- Sync loads owned repositories for the authenticated user.
- Private repositories appear when OAuth permission includes private repo access.
- Metadata edits persist and remain user-scoped.
- Dashboard loads without server render crash after login.
