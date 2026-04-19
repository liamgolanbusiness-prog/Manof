# Atar Overnight Build Log

Founder is asleep. Autonomous build starting 2026-04-19.

## Plan for first 4 cycles

- **Cycle 1 — Scaffold**: `create-next-app` in place, install core deps (`@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`), init shadcn/ui and add the component set listed in the brief, set up RTL root layout with `<html lang="he" dir="rtl">`, Hebrew font stack, and `app/globals.css`. Ship a hello-world `/` page that renders RTL correctly.
- **Cycle 2 — Supabase wiring + types**: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`. Generate DB types from the live schema via `supabase gen types` (fallback: hand-written types if CLI not available). Verify a server component can query `projects` without errors. Build helpful util `lib/cn.ts` and `lib/format.ts` (currency ₪, dates Hebrew).
- **Cycle 3 — Auth**: `/login`, `/signup` pages with shadcn forms, email+password. Middleware guarding `/app/*`. Post-signup redirect to `/app/projects/new`. Error toasts. Sign-out action.
- **Cycle 4 — Projects list + create**: `/app/projects` grid of cards, `/app/projects/new` form, writes to DB. Empty state. Deep review at end of cycle 4 — walk רמי's first-login workflow.

## Assumptions baked into the build (to confirm with founder)

- Dev port: brief says both 3000 and 4000; using **3000** (Next.js default) and noting the env var override in QUESTIONS.
- Hebrew font: system stack (`Rubik, Assistant, -apple-system, Segoe UI, ...`) — no Google Fonts fetch to keep offline-friendly.
- RTL strategy: use Tailwind logical properties (`ms-*`, `me-*`, `start-0`, `end-0`) rather than plugin. Simpler and more portable.
- Schema is already applied in Supabase. I will introspect tables on first DB query; if shape differs from what I assume, I'll update and note it.

---

## Cycle 1 — 2026-04-19 — Scaffold + RTL shell
**Built:**
- Git repo initialized.
- `package.json` pinned to Next 14.2.15 + React 18.3 + shadcn deps (Radix primitives, CVA, tailwind-merge, lucide, date-fns, Supabase JS+SSR).
- Next config, Tailwind config with CSS vars + Hebrew font stack + logical properties friendly, PostCSS, tsconfig with `@/*` alias.
- `app/layout.tsx` with `<html lang="he" dir="rtl">`, viewport tuned for mobile PWA.
- `app/page.tsx` — Hebrew landing page with CTA to login/signup.
- `app/globals.css` with shadcn CSS-var palette + `.tap` min touch target helper + `.no-scrollbar` utility + `.safe-bottom` (iOS safe area).
- Shadcn-style primitives written by hand (no CLI): button, input, textarea, label, card, dialog, tabs, select, toast + toaster + useToast hook.
- `lib/utils.ts` (`cn`), `lib/format.ts` (₪, Hebrew dates, `isoDate`).
- README + QUESTIONS + .gitignore updated (next-env.d.ts, tsbuildinfo).
- `npm install` — 456 packages, no errors.
- `npm run build` — ✓ compiled, static pages generated.

**Works:**
- Build passes. Types clean. Landing page renders in RTL with Hebrew copy.
- No network calls yet (no Supabase integration), no failures.

**Broken/TODO:**
- Supabase clients not wired. No middleware. No auth pages.
- No DB types file yet.
- Running on port 3000 vs 4000 (see QUESTIONS).

**Next (Cycle 2):** Wire Supabase SSR (browser, server, middleware), write DB types by introspecting the live schema with the service-role key, add helpful server utilities (`getSession`, `requireUser`). Verify connection by listing projects count from a server component.

---

## Cycle 2 — 2026-04-19 — Supabase wiring + DB types
**Built:**
- Introspected live schema via Supabase OpenAPI spec (11 tables: profiles, projects, project_members, contacts, daily_reports, attendance, report_photos, issues, expenses, payments, tasks). Confirmed `portal_token` default, `progress_pct` default 0, and `locked` (not `is_closed`) on daily_reports.
- `lib/supabase/database.types.ts` — full hand-derived Database type + convenience row aliases + enum-ish constants (CONTACT_ROLES, PROJECT_STATUSES, PAYMENT_DIRECTIONS, ISSUE_*, TASK_*).
- `lib/supabase/client.ts` — browser client (`createClient` using `createBrowserClient`).
- `lib/supabase/server.ts` — server client + `createAdminClient` for service-role operations (will be used by the unauthenticated portal route).
- `lib/supabase/middleware.ts` — `updateSession` that refreshes auth cookies, guards `/app/*`, bounces authed users away from `/login` & `/signup`.
- `middleware.ts` — top-level middleware registered with matcher that excludes `_next`, favicon, manifest, icons, `portal/*`, `api/*`.
- `lib/auth.ts` — `getUser` + `requireUser(redirect to /login)` helpers for server components.
- `.env.local.example` for the founder to reference when deploying.
- Updated QUESTIONS: resolved portal_token + progress_pct questions; flagged `locked` vs `is_closed` rename; asked founder to ensure UNIQUE(project_id, report_date) constraint exists.

**Works:**
- Build: ✓ compiled, middleware 79.7 kB, types valid. No ESLint warnings. Landing page still renders. Middleware active on all non-static routes.

**Broken/TODO:**
- No auth pages yet — redirect targets (`/login`, `/signup`, `/app/projects`) don't exist.
- Haven't actually hit the DB yet. First DB query happens next cycle (signup → profile trigger).

**Next (Cycle 3):** Auth pages. `/login` + `/signup` with email+password, client-side form with server action, post-signup redirect to `/app/projects/new` (or `/app/projects` if user already has a project). Sign-out via server action. Wire toasts for errors. Test the full round trip: signup → session cookie → middleware passes → `/app/projects` (needs at least a stub page) renders.

---

## Cycle 3 — 2026-04-19 — Auth (login, signup, sign-out, protected shell)
**Built:**
- `app/(auth)/layout.tsx` — centered, muted-bg shell with link back to `/`.
- `app/(auth)/login/page.tsx` + `login-form.tsx` + `actions.ts` — email/password login with `useFormState` + server action, `next` param support, Hebrew error translations.
- `app/(auth)/signup/page.tsx` + `signup-form.tsx` — full name + email + password. Post-signup best-effort fills `profiles.full_name` if trigger left it null, then redirects to `/app/projects/new`.
- Shared `logoutAction` reused from login/actions.ts (sign-out + redirect).
- `app/app/layout.tsx` — protected app shell: sticky header with logo, "פרויקט חדש", contacts, logout. Pulls profile display name. Calls `requireUser()`.
- `app/app/projects/page.tsx` + `new/page.tsx` + `contacts/page.tsx` — stubs so middleware redirects land on a real route.
- Upgraded `@supabase/ssr` 0.5.2 → 0.10.2 and `@supabase/supabase-js` to 2.103.3 to fix a **type inference mismatch** (ssr 0.5.2 was built against older supabase-js types; the path `@supabase/supabase-js/dist/module/lib/types` no longer exists in modern builds). This caused `.update/.insert/.upsert` on any Supabase client to resolve to `never`. After upgrade, types flow correctly and build passes.
- Added full explicit `Update` column shapes in `database.types.ts` (replaced `Partial<...["Insert"]>`) and `Relationships: []` on each table — matches the modern `GenericSchema` that postgrest-js expects.

**Works:**
- Build: ✓ 9 routes, middleware 80.3 kB. Type-check clean.
- Routes present: `/`, `/login`, `/signup`, `/app/projects`, `/app/projects/new`, `/app/contacts`.
- Login form uses `useFormState` (React 18) so errors render without JS required for submission.

**Broken/TODO:**
- Haven't booted dev server to test an actual signup round-trip. If email confirmation is on in Supabase, the session will be `null` and the server action returns an error message — founder needs to disable "Confirm email" in Supabase dashboard.
- Toaster is rendered in root layout but not wired to auth flow; errors come from `useFormState` inline — fine for now.

**Next (Cycle 4):** Real `/app/projects` listing (grid of cards with cover photo, client, status chip, empty state) + `/app/projects/new` form with server action (name, address, client name, client phone, start/end date, contract value). Redirect new project → `/app/projects/[id]/today`. Then deep review: walk the full signup → first-project flow as רמי would.



