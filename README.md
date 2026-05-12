# Forge Online

`forge-online` is a private, single-owner dashboard for monitoring personal GitHub repositories online. It is inspired by a local Forge workflow, but it does not read local folders or depend on filesystem access. GitHub is the source of truth for repositories, while Supabase stores Forge-style metadata such as goals, notes, and next steps.

## What it does

- Protects the entire app with owner-only login based on environment variables.
- Fetches owned repositories from GitHub on the server only.
- Works in public-only mode without a GitHub token.
- Includes private owned repositories when `GITHUB_TOKEN` is configured.
- Caches repository data in Supabase so the dashboard loads quickly.
- Lets you edit Forge metadata per repository:
  - `goal`
  - `status`
  - `notes`
  - `nextStep`
- Supports search, filtering, sorting, summary counts, and manual sync.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Supabase Postgres
- Signed HTTP-only cookie auth with `jose`
- `bcryptjs` for secure password verification
- Zod for validation
- Netlify Next.js Runtime via `@netlify/plugin-nextjs`

## Architecture notes

- All GitHub access happens in server-side route handlers under `app/api`.
- Secrets never ship to the browser.
- Supabase is used from the server with the service role key.
- Repository sync is idempotent and upserts by `github_repo_id`.
- Forge metadata is stored separately from cached GitHub repository data.
- This project uses `proxy.ts` for request protection because Next.js 16 renamed the old `middleware.ts` convention.

## Required environment variables

Copy `.env.example` to `.env.local` for local development and configure the same values in Netlify for production.

```bash
cp .env.example .env.local
```

### Authentication

- `FORGE_OWNER_USERNAME`
- `FORGE_OWNER_PASSWORD_HASH`
- `SESSION_SECRET`

Generate the password hash with:

```bash
npm run hash-password -- "your-password"
```

### GitHub

- `GITHUB_USERNAME`
- `GITHUB_TOKEN` (optional)

Behavior:

- No `GITHUB_TOKEN`: sync public owned repositories only.
- With `GITHUB_TOKEN`: sync owned repositories including private ones.

### Supabase

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase setup

Create a Supabase project, then apply the SQL migration in `supabase/migrations/0001_initial.sql`.

You can do this in either of these ways:

1. Open the Supabase SQL editor and run the file contents manually.
2. Use the Supabase CLI if you already have it wired into your workflow.

The schema creates:

- `repositories` for cached GitHub repository data
- `repo_metadata` for Forge-specific notes and status overrides
- `sync_state` for the latest GitHub sync result

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Apply the Supabase migration.

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Status heuristics

If a repository does not have a manual status override, Forge Online auto-suggests a status from GitHub activity:

- pushed or updated within 30 days -> `active`
- pushed or updated within 90 days -> `wip`
- older than 90 days -> `abandoned`
- archived repositories default to `abandoned`
- any manual override wins, including `done`

## Main routes

### Pages

- `/login`
- `/dashboard`

### Authenticated API routes

- `GET /api/dashboard`
- `POST /api/sync`
- `GET /api/repos/[repoId]/metadata`
- `PUT /api/repos/[repoId]/metadata`

### Public auth routes

- `POST /api/auth/login`
- `POST /api/auth/logout`

## Netlify deployment

This repo includes `netlify.toml` and pins the Netlify Next.js Runtime through `@netlify/plugin-nextjs`.

### Deploy steps

1. Push the repository to GitHub.
2. Create a new Netlify site from the repo.
3. Add all environment variables from `.env.example` in Netlify.
4. Make sure the Supabase migration has already been applied.
5. Trigger a deploy.

### Notes

- Netlify should detect this as a Next.js site automatically, but the repo includes `netlify.toml` to keep the runtime explicit.
- Cookies are marked `Secure` automatically in production.
- The app is designed for a single owner, not multi-tenant usage.

## Verification checklist

- Login works with the owner credentials.
- Unauthenticated requests redirect to `/login` or return `401` for protected APIs.
- Public-only sync works without a GitHub token.
- Private repositories appear after setting `GITHUB_TOKEN`.
- Metadata edits survive repeated syncs.
- The dashboard shows last sync state and GitHub cache results.
