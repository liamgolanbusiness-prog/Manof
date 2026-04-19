# Questions for the founder

Open questions from the overnight build. Each question has the default I chose so work can keep moving.

## Setup

1. **Dev port**: `.env.local` sets `NEXT_PUBLIC_APP_URL=http://localhost:4000` but the brief's "Definition of done" says `localhost:3000`. Using **3000** (Next default); update the env if you actually serve on 4000.
2. **Supabase schema**: brief says "schema already applied" but I don't have SQL migrations in the repo. I introspected via a server query. Please drop `supabase/migrations/*` into the repo so future changes are tracked.
3. **Storage bucket `project-media`**: assumed to exist and be public-read for authenticated users. Confirm RLS + public URL policy.
4. **Supabase Auth email confirmation**: assumed DISABLED for MVP (instant login after signup). If enabled in your project, the signup flow will break on the redirect — toggle off in Supabase dashboard → Auth → Providers → Email → "Confirm email".

## Product decisions

5. **Phone input format for contacts / clients**: defaulting to plain `tel` input, no country code enforcement. Israeli numbers vary in format — ok to leave permissive?
6. **Currency**: defaulting to ILS (₪) everywhere, no multi-currency.
7. **Date display**: Hebrew locale, Gregorian (not Hebrew calendar). Confirm.
8. **"Progress %" on client portal**: the DB already has `projects.progress_pct` (integer, default 0). Using it. ✅ Resolved.
9. **Portal token**: `projects.portal_token` has DB default `gen_random_uuid()`. Using it. ✅ Resolved.
10. **Daily report uniqueness**: one report per `(project_id, date)`? Brief implies yes. I don't see a unique constraint in the OpenAPI output — but Postgres constraints aren't always reflected there. I'll upsert on `(project_id, report_date)` and rely on a constraint to prevent dupes. **Please add a `UNIQUE (project_id, report_date)` constraint on `daily_reports` if not already there.**
11. **`daily_reports.locked` vs brief's `is_closed`**: the DB column is `locked`. I'm using it with the semantic "closed day" in the UI. The value stays a simple boolean.

## Things I deliberately skipped (to revisit)

- Voice notes (Phase 10)
- Offline-first sync (just a fallback page — no conflict resolution)
- Google Places / address autocomplete
- SMS auth (email only for MVP)
- Payment SDKs (Cardcom, Tranzila)
- Push notifications
- i18n framework — app is Hebrew-only for now

