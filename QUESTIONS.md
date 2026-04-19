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
8. **"Progress %" on client portal**: brief says "read from project.notes for MVP." I'll add a dedicated `progress_pct` column in the projects table via a migration — simpler and cleaner than parsing notes. (If you want it read from notes, I'll swap.)
9. **Portal token**: assumed `projects.portal_token` is pre-generated on insert by a DB trigger. If not, I'll generate in the server action.
10. **Daily report uniqueness**: one report per `(project_id, date)`? Assuming yes; enforced via unique constraint if not already there.

## Things I deliberately skipped (to revisit)

- Voice notes (Phase 10)
- Offline-first sync (just a fallback page — no conflict resolution)
- Google Places / address autocomplete
- SMS auth (email only for MVP)
- Payment SDKs (Cardcom, Tranzila)
- Push notifications
- i18n framework — app is Hebrew-only for now

