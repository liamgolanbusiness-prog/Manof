# Questions for the founder

Open questions from the overnight build. Each question has the default I chose so work can keep moving.

## Setup

1. **Dev port**: `.env.local` sets `NEXT_PUBLIC_APP_URL=http://localhost:4000`. Confirmed by founder — dev runs on **4000**. `npm run dev` passes `-p 4000`. ✅ Resolved.
2. **Supabase schema**: founder asked me to generate. Wrote `supabase/migrations/0001_baseline.sql` from the live OpenAPI introspection (tables, FKs, indexes, RLS policies, the `auth.users` signup trigger, `touch_updated_at` trigger). **Caveat**: this is a re-creation, not a `pg_dump` — if you want byte-for-byte parity, run `supabase link && supabase db pull` and overwrite the file. ✅ Resolved (with caveat).
3. **Storage bucket `project-media`**: founder confirmed exists + public-read. ✅ Resolved.
4. **Supabase Auth email confirmation**: founder confirmed OFF. Signup now logs the user in immediately. ✅ Resolved.

## Product decisions

5. **Phone input format**: founder asked to **lock to Israeli format**. Added `lib/phone.ts` with `normalizeIsraeliPhone` / `isValidIsraeliPhone` / `formatIsraeliPhone`. Server actions for contacts, project-create, and project-settings reject invalid numbers with a Hebrew error ("מספר טלפון לא תקין"). Display formatting adds dashes (`0541234567` → `054-123-4567`). Accepted inputs: mobile (05X), landline (02/03/04/08/09), special (07X), with or without +972 / spaces / dashes. ✅ Resolved.
6. **Currency**: ILS only. ✅ Resolved.
7. **Dates**: Hebrew locale, Gregorian calendar. ✅ Resolved.
8. **"Progress %" on client portal**: the DB already has `projects.progress_pct` (integer, default 0). Using it. ✅ Resolved.
9. **Portal token**: `projects.portal_token` has DB default `gen_random_uuid()`. Using it. ✅ Resolved.
10. **Daily report uniqueness**: founder approved. Wrote `supabase/migrations/0002_daily_reports_unique.sql` adding `UNIQUE (project_id, report_date)` on `daily_reports`. **Apply it** (`supabase db push` or run in SQL editor) before users create overlapping same-day reports. ✅ Resolved.
11. **`daily_reports.locked` vs brief's `is_closed`**: the DB column is `locked`. I'm using it with the semantic "closed day" in the UI. ✅ Resolved.

## Things deliberately skipped (to revisit)

- Voice notes (Phase 10)
- Offline-first sync (service worker)
- Google Places / address autocomplete
- SMS auth (email only for MVP)
- Payment SDKs (Cardcom, Tranzila)
- Push notifications
- i18n framework — app is Hebrew-only for now
- Cross-project dashboard
- Contact search
- Expense / payment CSV export
- In-place edit for expenses/payments
