# Atar — עתר

Mobile-first web app for Israeli construction contractors (קבלנים) — daily site log, expenses, people, tasks, and a share-link for the client. Hebrew / RTL throughout.

Built overnight against the spec in `OVERNIGHT_BRIEF.md`. Read `PROGRESS.md` cycle-by-cycle to see what was built and why. Read `QUESTIONS.md` for open decisions.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS with CSS-variable tokens (shadcn-style)
- Hand-written shadcn/ui primitives (Button, Input, Textarea, Label, Card, Dialog, Tabs, Select, Toast/Toaster) — no CLI dependency
- Radix primitives for Dialog/Select/Tabs/Toast/Label
- Supabase: Postgres + Auth (email+password) + Storage (`project-media` bucket) via `@supabase/ssr`
- `lucide-react` for icons, `date-fns` (Hebrew locale) for dates, `clsx` + `tailwind-merge` for class composition

## Quick start

```bash
npm install
npm run dev
# http://localhost:4000
```

## Environment (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only; used by the public portal route
NEXT_PUBLIC_APP_NAME=Atar
NEXT_PUBLIC_APP_URL=http://localhost:4000       # base for portal share URLs
```

See `.env.local.example`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (was run at the end of every overnight cycle; passes clean)
- `npm run start` — serve the build
- `npm run lint` — ESLint (`next/core-web-vitals`)
- `npm run typecheck` — `tsc --noEmit` on the full project

## Feature tour

| URL                                    | What it does                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/`                                    | Hebrew landing page with CTAs to login/signup                                               |
| `/login`, `/signup`                    | Email+password auth with Hebrew error translations                                          |
| `/app/projects`                        | Card grid of the user's projects with cover/progress/status; empty state                    |
| `/app/projects/new`                    | Create project form (name required; address, client, dates, contract value all optional)    |
| `/app/projects/[id]/today`             | **THE HEART.** Start-day button, weather+notes, attendance strip, photo upload, issue log, close-day |
| `/app/projects/[id]/diary`             | Reverse-chrono list of daily reports with per-row counts                                    |
| `/app/projects/[id]/diary/[reportId]`  | Read-only view of a past daily report                                                        |
| `/app/projects/[id]/money`             | 6 KPIs; sub-tabs for expenses / payments; receipt photo upload; WhatsApp-friendly amounts   |
| `/app/projects/[id]/people`            | Project members with aggregated hours + total paid; add/remove flow                         |
| `/app/projects/[id]/tasks`             | To-do list with filters today/week/later/done; assignee + due date                          |
| `/app/projects/[id]/client`            | Generate + copy + WhatsApp-share the public portal link                                     |
| `/app/projects/[id]/settings`          | Edit project fields, change status, delete project (with name-confirmation)                 |
| `/app/contacts`                        | Global contact list (grouped by role), create/edit/delete, tap-to-call                      |
| `/portal/[token]`                      | **Public, no auth** — client-facing summary page: progress %, photos, payment status        |

## Project structure

```
app/                          Next.js App Router
  (auth)/                     Login + signup (unauthed)
  app/                        The authenticated app shell
    layout.tsx                Sticky header with nav + sign-out
    contacts/                 Global contacts CRUD
    projects/                 List + create + detail
      [id]/
        layout.tsx            Back-link + title + tab nav
        today/                Daily report (center of gravity)
        diary/                Past reports list + detail
        money/                Expenses + payments + KPIs
        people/               Project members
        tasks/                To-do list
        client/               Portal share UI
        settings/             Edit project
  portal/[token]/             Public client portal (service-role reads)
components/ui/                Hand-written shadcn-style primitives
components/empty-state.tsx    Shared empty state
lib/
  supabase/{client,server,middleware,database.types}.ts
  auth.ts                     getUser + requireUser
  format.ts                   ILS currency, Hebrew dates, isoDate
  utils.ts                    cn()
middleware.ts                 Route guard + session refresh
public/manifest.json          PWA manifest
public/icons/                 SVG app icons (placeholder "ע" logo)
```

## Database

Schema assumed to already exist in Supabase (the founder applied it before the overnight build). 11 tables:
`profiles`, `projects`, `project_members`, `contacts`, `daily_reports`, `attendance`, `report_photos`, `issues`, `expenses`, `payments`, `tasks`.

Hand-derived types live in `lib/supabase/database.types.ts`. Regenerate with `supabase gen types typescript --project-id <id>` if the schema moves.

### Storage

Bucket `project-media` holds:
- `projects/<pid>/reports/<rid>/<ts>-<rand>.<ext>` — daily report photos
- `projects/<pid>/receipts/<ts>-<rand>.<ext>` — expense receipts

Bucket **must be publicly readable** for the portal page and for `<Image src>` on the app side (we use `getPublicUrl`). If you prefer private + signed URLs, swap to `createSignedUrl` in `upload-client.ts` and update the portal query.

### Row-Level Security

The app assumes RLS policies exist on each table that allow authenticated users to read/write their own rows (`auth.uid() = user_id`). The public portal uses the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS — it validates access via the `portal_token` itself.

## Deployment

Target is Vercel. Push to the linked repo, set the three Supabase env vars in Vercel project settings, and deploy. Ensure:
- Supabase **Auth → Providers → Email → Confirm email** is turned **off** (instant login after signup — see `QUESTIONS.md`).
- `project-media` bucket exists and allows authenticated uploads + public reads.
- `NEXT_PUBLIC_APP_URL` is set to the real production URL (so portal share links are correct).

## Known limits / TODO

- No offline sync (online-only for now; the PWA just installs)
- No voice notes (brief marked as Phase 10)
- No Google Places / address autocomplete
- No SMS auth
- No payment SDK (Cardcom / Tranzila) — founder's accounts
- Expenses + payments are delete+recreate (no in-place edit)
- Contacts have no search yet
- No cross-project dashboard yet
- No ability for the client to reply from the portal
