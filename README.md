# Atar — עתר

Mobile-first web app for Israeli construction contractors (קבלנים). Next.js 14 App Router + Supabase + Tailwind + shadcn/ui. Hebrew / RTL throughout.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or whichever port Next assigns — default is 3000).

## Environment

All env vars live in `.env.local` (not committed). Required keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server only
NEXT_PUBLIC_APP_NAME=Atar
NEXT_PUBLIC_APP_URL=http://localhost:3000      # used for OAuth redirects / portal links
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (run this before committing)
- `npm run start` — run the built app
- `npm run lint` — Next.js ESLint
- `npm run typecheck` — TypeScript only, no emit

## Structure

- `app/` — routes (App Router). `app/(public)/*` is unauthenticated, `app/app/*` requires auth.
- `components/` — shared React components. `components/ui/*` are shadcn-style primitives.
- `lib/` — utilities. `lib/supabase/*` are the server + browser Supabase clients.
- `public/` — static assets (PWA manifest, icons).

## Supabase

Schema is assumed already applied in the linked Supabase project. Tables touched:
`profiles`, `projects`, `project_members`, `daily_reports`, `attendance`,
`issues`, `photos`, `expenses`, `payments`, `contacts`, `tasks`.

Storage bucket: `project-media` (photos, receipts).

## Deployment

Target is Vercel. Push to your linked repo, set the env vars in Vercel project settings,
and deploy. Founder will do this — overnight build skips deployment.

## Progress + open questions

- `PROGRESS.md` — append-only build log, one entry per cycle
- `QUESTIONS.md` — decisions for the founder to confirm
