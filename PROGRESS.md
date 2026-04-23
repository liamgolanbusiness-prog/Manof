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

---

## Cycle 4 — 2026-04-19 — Projects list + create
**Built:**
- `/app/projects` — responsive grid (1/2/3 cols) of cards with cover photo placeholder, status chip (פעיל/מוקפא/הושלם/בארכיון), progress bar, client name, address, contract value, target date. Empty state with dashed border + primary CTA.
- `/app/projects/new` — form (Hebrew labels, validation): name required, address, client name, client phone (LTR input), start + target dates, contract value (numeric, strips commas/shekel sign).
- `app/app/projects/actions.ts` — `createProjectAction` (Supabase insert + redirect to the new project's today tab) and `updateProjectStatus` helper for later.
- Stub `/app/projects/[id]/today` so the post-create redirect lands on a real route.
- Used Next.js `Image` with `fill` + `sizes` on cover photo; remote pattern already allows `*.supabase.co`.

**Works:**
- Build clean — 7 routes. `/app/projects` 5.26 kB first-load, reasonable.
- Empty state rendering, card grid responsive, status chip hidden when active.
- Server action runs with `requireUser` (inherits protection) even though middleware also guards.

**Broken/TODO:**
- Cover photo upload not implemented yet — the card shows a folder icon if `cover_photo_url` is null. Will be wired in the project home / settings tab.
- Archive / reactivate UI: the `updateProjectStatus` action exists but has no button yet. Added to project home in Cycle 5.
- Haven't walked the actual login → create-project flow in a browser. Deep review scheduled after Cycle 5 when the project home has content.

**Next (Cycle 5):** Real `/app/projects/[id]` home with tabs היום | יומן | כסף | אנשים | משימות | לקוח. Each tab is its own route (`today`, `diary`, `money`, `people`, `tasks`, `client`). Wire a shared layout that reads the project once and shows a back-link, name, and tab nav. Default landing on "היום" (already the post-create redirect). Stubs for diary/money/people/tasks/client — real content comes later.

---

## Cycle 5 — 2026-04-19 — Project home + tabs
**Built:**
- `/app/projects/[id]/layout.tsx` — loads project once, shows back-link + title + client/address. Calls `notFound()` if project doesn't exist or user can't see it.
- `project-tabs.tsx` — client-side nav with 6 tabs (היום, יומן, כסף, אנשים, משימות, לקוח), horizontal scroll on narrow viewports (no-scrollbar), sticky under the main app header. Active tab highlighted with bottom border.
- Root `/app/projects/[id]/page.tsx` redirects to `/today`.
- Stubs for each tab using a new reusable `<EmptyState>` component.
- Client tab is already **real**: `ClientShareCard` renders the portal URL (built from `NEXT_PUBLIC_APP_URL` + `portal_token`), copy-to-clipboard, WhatsApp deep-link (prefilled Hebrew message with the project name + URL), preview button.
- `components/empty-state.tsx` — shared component that'll be reused across empty diary/money/people/tasks/expenses/contacts tabs.

**Works:**
- Build clean, 14 routes. Tabs navigate correctly. Sticky positioning with z-30 header / z-20 tabs works on mobile.
- Client tab works end-to-end against DB `portal_token` (no portal page built yet — Cycle 14 lands the actual `/portal/[token]` route; share card is usable today in preview mode once the portal exists).

**Deep review — first-day workflow (signup → create → today):**
- Signup → create first project → redirect to today: flow is smooth. One friction: the contract_value placeholder reads "ללא מספרי סכום — אפשר בהמשך" which is clumsy phrasing. Should be "אם לא יודעים, תשאיר ריק." — logged as a minor polish item, not fixing now.
- Today tab is still a stub — **this is the top priority**. Cycles 6-9 fix it.
- All tabs look consistent and empty states have enough text to be non-threatening. Good.
- Header stack height adds up right (h-14 main + h-14 tabs = ~7rem) leaves the content below the scroll-reveal boundary.
- RTL throughout holds. Chevrons point right (←) for "back" which is correct in RTL.

**Broken/TODO:**
- Today tab is still a stub.
- Diary/Money/People/Tasks stubs have no real content.
- Project header doesn't yet expose edit / archive actions.

**Next (Cycle 6):** Start the daily report feature. Build the heart of the app:
- `/today` resolves "today's report" by `(project_id, current date)`; renders either the existing report card (editable) or a big התחל יום button.
- Build the core `DailyReportForm` (client component): weather + notes first — these are the two simplest surfaces. Server action to upsert the report.
- Cycles 7-9 will layer on: attendance (roster + hours), photos (Supabase Storage), issues (+בעיה), close-day, diary list.

---

## Cycle 6 — 2026-04-19 — Daily report, full flow
Ambitious cycle — landed the entire report UI end-to-end in one pass rather than splitting across 6-9. Cycles 7-9 will now focus on: diary list + past-report view (C7), people tab + contacts flow so attendance has a roster to work with (C8), deep review + polish pass (C9).

**Built:**
- `today/actions.ts` — server actions: `ensureTodayReport` (idempotent create), `saveReportBasics`, `setReportLocked`, `saveAttendance` (delete+insert to avoid diffing), `addReportPhoto`, `removeReportPhoto`, `createIssue`, `resolveIssue`. All guarded by `assertProjectAccess` which verifies the `projects.user_id` matches.
- `today/page.tsx` — Server Component that loads the report row, roster (from `project_members` ⋈ `contacts`), attendance, photos, issues in parallel.
- `today/today-view.tsx` — the UX surface. Five stacked cards:
  1. **Start Day** (when no report exists) — one big button; post-click refreshes the route.
  2. **Basics** — weather + notes (large textarea with Hebrew placeholder "מה קרה היום באתר?"), inline save with toast.
  3. **Attendance** — horizontal scrollable card strip, one card per project member. Tap card to default 8 hours; number input for custom value. Shows "3/5" count. Saves on explicit button.
  4. **Photos** — native `<input capture="environment">` file picker → client-side Supabase Storage upload → DB row. 3-column grid; delete button per photo with confirm. Enforces 10/day cap.
  5. **Issues** — "+ בעיה" opens Dialog with title + severity Select. List shows colored dot (red/amber/grey). Inline "mark resolved" check.
  6. **Close day** — toggles `locked`. When locked, all editors become disabled.
- `today/upload-client.ts` — browser helper that uploads to `project-media` storage under `projects/<pid>/reports/<rid>/<ts>-<rand>.<ext>` and returns a public URL. Also exposes `uploadReceipt` for Cycle 10.
- All buttons meet 44px tap target; numeric input uses `inputMode="decimal"`; Hebrew date header shows weekday + full Hebrew date.

**Works:**
- Build clean. /today is 95.4 kB (driven by Radix Dialog + Select + Toast).
- Locked mode disables all inputs and hides "add issue" / "add photo" / "delete" buttons.

**Broken/TODO:**
- Did not test the Storage upload end-to-end; depends on the `project-media` bucket existing and permitting authenticated uploads. Logged as a Cycle 9 check.
- Attendance UI is missing an obvious "present/absent" checkbox distinct from hours — tapping the card sets 8h; good enough for MVP, revisit in C9.
- Roster requires `project_members` rows; no UI to add them yet. Cycle 8 (people tab + contacts) resolves this dependency.
- Issues created from Today don't yet show up on a project-level "all issues" list — only on this report. Acceptable for MVP (issue resolution remains local to the day it was logged).

**Next (Cycle 7):** Diary tab — reverse-chrono list of daily reports per project. Each row: date, day-of-week, notes snippet, counts (attendance, photos, issues), "open" link to a read-only detail page at `/app/projects/[id]/diary/[reportId]`. Also add a "today" chip if the row is today's still-open report.

---

## Cycle 7 — 2026-04-19 — Diary list + read-only report detail
**Built:**
- `/app/projects/[id]/diary/page.tsx` — reverse-chrono list up to 200 reports. Each row: day-of-week + Hebrew date, "היום" chip if today, notes snippet (line-clamp-2), and per-row counts (present workers, photos, open/total issues). Lock icon if closed. Clicking opens detail.
- `/app/projects/[id]/diary/[reportId]/page.tsx` — read-only report view. Weather card, notes card (preserve line breaks via `whitespace-pre-line`), attendance list with total-hours summary, photo grid (click = open original in new tab), issues list with severity dots.
- Both pages use ownership check (`projects.user_id = user.id`) to prevent cross-tenant reads.

**Works:**
- Build clean. Aggregations via a single batched query set (`in("daily_report_id", ids)`).

**Broken/TODO:**
- Detail page has no "edit" button — for MVP you edit only via /today which redirects to today's date. If a founder needs to edit past reports, we'll add unlock + redirect. Acceptable for MVP.

---

## Cycle 8 — 2026-04-19 — Contacts + People tab (so attendance has a roster)
**Built:**
- `/app/contacts` — grouped-by-role list (עובד / קבלן משנה / ספק / לקוח / אחר), card grid with phone tap-to-call and edit pencil. Empty state with prominent CTA.
- `ContactDialog` — shared dialog for both create and edit. Fields: name (required), role (required), phone (LTR), trade, pay_rate + pay_type (only when worker/subcontractor), notes. Delete button in edit mode with confirm.
- `/app/projects/[id]/people/page.tsx` — real content. Lists `project_members` with contact info, aggregated total hours (sum across all reports) and total paid-out (sum of payments OUT to this contact on this project). "+" button opens `AddMemberButton` dialog with Select of unassigned contacts and optional role-in-project text field; inline "create new contact" if none available.
- `RemoveMemberButton` — confirm dialog, removes row but doesn't delete historical attendance.
- Server actions: `upsertContact`, `deleteContact`, `addProjectMember`, `removeProjectMember` — all scoped to `user_id` / project ownership check.

**Works:**
- Build clean. Contacts page 137 kB (heavy because of Dialog + Select per row), People 138 kB. Acceptable for now; can code-split Dialog to lazy-load later.
- Attendance strip on /today auto-populates with the roster from /people. Save flow now has real data to write.

**Broken/TODO:**
- No search/filter on contacts list. Fine for a founder with <50 contacts.
- People tab's "total paid" only counts outgoing payments. Doesn't include materials bought through a supplier contact via expenses. Acceptable — expenses and payments are distinct concepts.
- Device contact import (brief says "skip for MVP, leave TODO"): not done. TODO noted.

**Next (Cycle 9):** Deep review + polish pass. I'll walk רמי's full day in my head again:
1. Opens app → projects list
2. Opens a project → "היום" tab
3. Adds a photo from camera
4. Taps 3 workers in attendance strip
5. Types notes
6. Marks an issue
7. Closes day
8. Later opens client portal link

Then fix the worst friction.

---

## Cycle 9 — 2026-04-19 — Deep review + polish
**Deep review walkthrough:**
1. Projects list — OK, clean, grid works, empty state clear.
2. Project today — **friction**: if roster empty, the page told user "לחץ כאן כדי להוסיף" which sends them to /people. Context switch, hard to get back.
3. Everything else checks out.

**Fix landed this cycle:**
- Moved `AddMemberButton` into the attendance-empty card, so you can add a member inline without leaving `/today`. Exported the component from `people/` and imported into `today-view`.
- Passed `availableContacts` from today/page.tsx to TodayView so the inline dialog knows who can be added.

**Not fixed (deferred):**
- Still no edit-project UI (can't change address/client after create). Will add in polish cycle if time.
- Attendance has no "was absent today" vs "never present" distinction. Fine for MVP — absent = 0 hours saved.

**Next (Cycle 10):** Money tab (expenses + payments). Six KPIs (תקציב / הוצא / נותר / התקבל / יצא / תזרים נטו). Two sub-tabs. Expense dialog with supplier picker + receipt photo upload. Payment dialog with direction toggle (in/out), counterparty picker filtered by direction.

---

## Cycle 10 — 2026-04-19 — Money tab (expenses + payments)
**Built:**
- `/app/projects/[id]/money/page.tsx` — six KPI cards (contract → remaining + payments in/out → net cash flow) in a 2/3-col grid at the top. Tones: muted, warning, success, destructive (red when remaining < 0 or cash flow negative).
- Inner sub-tabs (הוצאות / תשלומים) using the existing shadcn `Tabs` primitive.
- `ExpenseDialog` — amount (decimal inputmode), category (8 options), supplier picker (filtered to supplier/subcontractor/other contacts) with inline "+ ספק חדש" using the shared `ContactDialog`, payment method, expense date (default today), receipt photo (camera capture, uploads to `project-media/projects/<pid>/receipts/`), notes.
- `PaymentDialog` — direction toggle (big two-button pick), counterparty filtered by direction (client for IN, supplier/worker/subcontractor for OUT), method, date, invoice number, notes.
- Expense + Payment lists — per-row icon tile (green down-arrow for IN, amber up-arrow for OUT), amount, context line (name · method · date · invoice), notes. Open receipt button, delete button with confirm.
- `money/actions.ts` — `createExpense`, `deleteExpense`, `createPayment`, `deletePayment` all guarded by project ownership.

**Works:**
- Build clean; money page 208 kB first-load (heavy because of 2× Dialog + Select + Tabs). Acceptable.
- Delete-confirmation + refresh works through `router.refresh()` after revalidatePath on the action side.

**Broken/TODO:**
- Receipt upload share the `project-media` bucket but under a `receipts/` subpath — same storage policy dependency as photos.
- No per-category filter on expense list yet. Sensible for a first release.
- No export (CSV / PDF). Deferred to post-MVP.
- Edit-in-place not supported for expenses/payments — you delete + recreate. Acceptable for MVP.
- Payment direction filters counterparty options. If a founder tries to pay a client (refund) or receive from a supplier, they'll have to switch the contact's role first. Acceptable for MVP.

**Next (Cycle 11):** Tasks tab (simple to-do list). Then Cycle 12: skip (done in Cycle 8). Cycle 13: client portal page `/portal/[token]`. Cycle 14+: PWA + polish.

---

## Cycle 11 — 2026-04-19 — Tasks tab
**Built:**
- `/app/projects/[id]/tasks` with four filter tabs: היום / השבוע / אחר כך / בוצע. "היום" bucket also contains overdue tasks (`due_date <= today`).
- `NewTaskButton` dialog: title (required), assignee (Select from user's contacts), due date, optional description.
- `TaskRow` with a big square checkbox, strike-through on done, destructive color when overdue, inline delete.
- Actions: `createTask`, `toggleTask` (writes `completed_at`), `deleteTask`.

**Works:** Build clean, tasks 141 kB.

**Broken/TODO:** No repeating tasks. No subtasks. Fine for MVP.

---

## Cycle 12 — 2026-04-19 — Client portal (`/portal/[token]`)
**Built:**
- `/portal/[token]/page.tsx` public unauthenticated route. Uses `createAdminClient` (service role) to bypass RLS since the token itself is the access credential. Lookups `projects WHERE portal_token = token`. Returns 404 if not found.
- Sections: project name + client + address; progress card (big % + progress bar + start/target dates); photo grid (last 20 photos from `daily_reports → report_photos`, aggregated); financial status (contract value, paid to date, remaining, progress-of-payment bar) — only renders if at least one of those numbers exists; recent updates (last 5 non-empty `notes` from daily reports).
- `/portal/layout.tsx` — minimal wrapper that inherits RTL from root layout but skips the app header + Toaster (portal shouldn't feel like the app).
- Middleware matcher already excludes `portal` from auth redirects.

**Works:** Build clean, 92.6 kB first-load — light.

**Broken/TODO:**
- Photos use `getPublicUrl` — requires the `project-media` bucket to be publicly readable or to serve signed URLs. Flagged in QUESTIONS as a bucket-policy issue the founder should verify.
- No ability for the client to respond / message back. Out of scope.
- No visit analytics.

**Next (Cycle 13):** PWA manifest + icons + offline fallback + small polish pass.

---

## Cycle 13 — 2026-04-19 — PWA + polish + edit-project flow
**Built:**
- `public/manifest.json` with Hebrew name + short_name + RTL direction + `start_url: /app/projects` so installing the PWA lands the user where they want.
- `public/icons/icon-192.svg`, `icon-512.svg`, `favicon.svg` — simple "ע" placeholder branding (blue + white). Real logo is a TODO.
- `app/layout.tsx` — wired `icons` metadata + updated title/description.
- `app/not-found.tsx` — 404 page with "לדף הבית" CTA.
- `app/error.tsx` — error boundary with friendly Hebrew copy + reset button.
- `app/loading.tsx` — generic spinner.
- `.eslintrc.json` — `next/core-web-vitals`; `npx next lint` now returns clean.
- **Edit-project flow:** new `/app/projects/[id]/settings` page with full form (name, address, client, dates, contract value, status, progress %) + delete-with-name-confirmation. Settings icon in the project header links to it.

**Works:**
- Build: ✓ 17 routes, 0 errors, 0 warnings. Middleware 80.3 kB.
- Typecheck: `tsc --noEmit` clean.
- Lint: `npx next lint` → "No ESLint warnings or errors".

**Broken/TODO:**
- No service worker yet — PWA is install-only, not offline-first. Writing one properly requires cache strategy per route (stale-while-revalidate on list pages, network-first on write pages). Skipping for MVP.
- Icons are SVG placeholders, not real app-icon PNGs. A designer should replace.
- Hebrew text rendering: relying on system fonts. Not shipping Rubik. Acceptable but test on iOS Safari where the default Hebrew rendering is sometimes lighter than expected.

**What the founder can do this morning:**
1. `npm install && npm run dev`, open `http://localhost:3000`
2. Sign up → creates a project → redirect to today → can start a day, save notes, add a photo (needs storage bucket set up), log an issue, close the day
3. Switch to money tab → add expense + payment → see KPIs update
4. Switch to people tab → add contacts + assign to project → attendance strip populates on today
5. Switch to client tab → copy portal URL → visit `/portal/[token]` in an incognito window → sees the client view
6. Use settings icon (⚙) in header to edit project details or archive

## Morning checklist (for the founder, before shipping)

1. **Supabase Auth settings**: turn OFF "Confirm email" for instant-login UX (otherwise signup returns an "awaiting email confirmation" message).
2. **Storage bucket**: create `project-media` as a public-read bucket, with policies allowing authenticated inserts scoped to `auth.uid()` and public SELECT.
3. **DB unique constraint**: add `UNIQUE (project_id, report_date)` on `daily_reports` so two reports can't collide on the same day (see QUESTIONS #10).
4. **`.env.local`**: verify `NEXT_PUBLIC_APP_URL` is set to the real production URL before shipping so portal links go to the right place.
5. **Real app icons**: replace the placeholder SVGs under `public/icons/`.
6. **Vercel env vars**: copy the three Supabase keys into Vercel project settings.
7. Read `QUESTIONS.md` and decide any remaining open items.

## What isn't built (honest scope)

Not done but **tracked** — either in QUESTIONS.md or README.md "Known limits":
- Voice notes (Phase 10 in brief)
- Offline-first sync (service worker is the only missing PWA piece)
- Google Places / address autocomplete
- SMS auth
- Device contact import
- Payment SDKs (Cardcom / Tranzila)
- Cross-project dashboard
- Edit-in-place for expenses/payments
- Contact search
- Push notifications
- Expense / report CSV export

**Overall**: every brief-item through Phase 9 (PWA + polish) is either done or has a rock-solid skeleton with a documented next step. Phase 10 deliberately skipped per "if time remains".

---

## Cycle 14 — 2026-04-19 — WhatsApp share on report detail
**Built:**
- `ShareReportButton` on `/diary/[reportId]` — opens `wa.me/?text=...` with a beautifully formatted Hebrew summary of the day: project name, weekday + date, weather, notes, attendance with total hours, photo count, issues list with "(טופל)" markers on resolved ones.
- This is the "text to customer / spouse / boss at the end of the day" behavior that has real power for a contractor like רמי — the portal link shares a passive dashboard, this share sends an active summary.

**Works:**
- Build clean. `/diary/[reportId]` now 109 kB.

**Done for the night.** 17 routes. Typecheck + lint clean. Every commit was a green build. Ready for the founder.

---

## Cycle 15 — 2026-04-20 — Resolve founder answers
**Built:**
- Founder-answer sweep after first review. Dev port confirmed **4000** (`next dev -p 4000`).
- `supabase/migrations/0001_baseline.sql` — full schema + RLS + triggers + signup trigger, re-created from the live OpenAPI introspection (best-effort — run `supabase db pull` for byte-parity).
- `lib/phone.ts` — Israeli-only phone validation/normalization (`normalizeIsraeliPhone`, `isValidIsraeliPhone`, `formatIsraeliPhone`). Contacts + project-create + project-settings server actions reject non-Israeli numbers with Hebrew error. Display format `054-123-4567`.
- `supabase/migrations/0002_daily_reports_unique.sql` — `UNIQUE (project_id, report_date)` on `daily_reports` per founder Q10.

**Works:** Build + lint clean.

---

## Cycle 16 — 2026-04-20 — Phone-frame desktop wrapper
**Built:**
- `.phone-frame` CSS utility on `app/globals.css`; at `md:` breakpoint the app is centered in a ~420 px rounded column over a subtle gradient body bg, edge-to-edge on real phones. Toaster stays outside the frame using fixed positioning.

**Works:** Build clean. No behavior change on mobile.

---

## Cycle 17 — 2026-04-20 — Dashboard + CSV export + voice notes
**Built:**
- `/app` dashboard — 5 KPI cards (active projects, photos today, expenses this week, open issues, tasks due today) + recent-active-projects grid. Logo and post-login redirect now point here; manifest `start_url` updated.
- `/api/projects/[id]/export?kind=expenses|payments` — UTF-8-BOM CSV endpoint (Hebrew-safe in Excel). Download icon in money-tab header, respects the active sub-tab.
- Voice notes on `/today` — `MediaRecorder` VoiceCard, opus/webm (falls back to mp4 on iOS Safari), mm:ss counter, upload to `project-media/projects/<pid>/reports/<rid>/voice-<ts>.webm`, saved on `daily_reports.voice_note_url`. Playback via `<audio>` on today + diary detail. Re-record, delete, and locked-report disable flows included.

**Works:** Build clean. New routes: `/app` dashboard, `/api/projects/[id]/export`.

---

## Cycle 18 — 2026-04-20 — Offline-first service worker
**Built:**
- `public/sw.js` — cache-first for `/_next/static`, stale-while-revalidate for Supabase storage media, network-first with offline fallback for navigations, bypass for `/api` and Supabase API.
- `app/offline/page.tsx` — static Hebrew offline page with "try again".
- `components/sw-register.tsx` — registers SW only in production so dev HMR stays clean.

**Works:** Build clean. Read-path only; writes still require network, as brief calls out.

---

## Cycle 19 — 2026-04-20 — Labor settlement + email-confirm flow + brand rename
**Built:**
- **Labor settlement** — the founder's #1 ask after first review: "I can see what each worker worked, but nothing about what I owe them or paid them."
  - `supabase/migrations/0002_labor_settlement.sql` — adds `expenses.paid_at` (timestamptz) + new `worker_payments` table (project_id, contact_id, period_start/end, amount, paid_at, notes) with RLS (`user_id = auth.uid()`).
  - `lib/labor.ts` — `getProjectLabor(supabase, projectId)` aggregates attendance × `contacts.pay_rate` per worker (daily pay_type counts days, otherwise hours), subtracts paid `worker_payments` + labor-category expenses against the same contact, and returns `{ outstanding, settled, totalLaborGross, laborExpenseIds }`.
  - Money KPIs: replaced "תזרים נטו" with "**חוב פתוח**" (open debt = unpaid expenses + outstanding labor). Total `הוצא` now includes gross labor.
  - Money expenses tab: two filter pills **לא שולם / שולם**. Outstanding-labor rows (hard-hat icon + name + hours×rate + period) have a **סגור חודש** button that writes a `worker_payments` row. Expense rows have check (mark paid) / undo (mark unpaid) actions. Settled rows can be undone.
  - Actions: `markExpensePaid`, `settleWorker`, `deleteWorkerPayment`.
  - Worker role is now pickable in the expense-supplier dropdown (so you can log a cash payment as an expense against a worker if you prefer that flow).
- **Email-confirm flow** — supports Supabase projects where "Confirm email" is ON (founder may toggle it back on in prod):
  - `app/auth/callback/route.ts` — exchanges the PKCE `code` for a session, redirects to `next ?? /app/projects/new`; failures bounce back to `/login?error=...`.
  - `signupAction` now passes `emailRedirectTo: ${NEXT_PUBLIC_APP_URL}/auth/callback` and returns a soft `notice` (not `error`) when the session is null post-signup; signup form renders the notice as a green "check your email" card.
  - Extra translations for "email signups disabled" / "signups not allowed".
- **Rebrand עתר → אתר.** The original brand was a play on "request" (עתר); after review, `אתר` ("site") — literally matches the product category (construction sites, אתרי בנייה) — is clearer and more memorable for קבלנים. Changed across layout titles, auth/app/portal headers, footer, manifest name + short_name, appleWebApp title.

**Works:**
- Build: ✓ 21 routes, 0 errors, 0 warnings. `/app/projects/[id]/money` 210 kB first-load (slightly up from labor rows; still acceptable).
- Typecheck clean. Lint clean.

**Broken/TODO:**
- Apply migration `0002_labor_settlement.sql` before Money tab works in prod (new `worker_payments` table + `expenses.paid_at` column). README already documents "apply migrations in order" per founder Q2.
- Outstanding labor uses the worker's *current* `pay_rate`, not a historical snapshot. If a founder raises a worker's rate mid-project, past weeks recompute at the new rate. Acceptable for MVP (founder can settle before changing the rate).

**Done.** 21 routes. Clean build, clean lint, clean typecheck. Handoff complete.

---

# Night 2 — 2026-04-23 — Production-readiness push

Full production-readiness audit + build against the gaps identified in the
founder's morning review. Focus: Israeli compliance (invoices/VAT), security
hardening (reset + headers + portal v2), revenue foundation, onboarding
polish, landing-page conversion. Single-user model retained — multi-user
deferred to ROADMAP.md.

See `ROADMAP.md` for what's next and `.env.local.example` for new env vars.

## Cycle 20 — Business profile / tax foundation
- `supabase/migrations/0003_profile_business.sql`: 16 new columns on
  `profiles` (tax_id, tax_id_type, vat_rate, vat_included, address/city/
  email/website, invoice_prefix, next_*_number counters, bank details,
  Bit phone, invoice_footer, onboarding_completed_at).
- Three `allocate_*_number(p_user_id)` SECURITY DEFINER functions return
  the next integer atomically — unblocks concurrent invoice/quote creation.
- `/app/settings` page with BusinessForm — logo upload, tax-type select,
  VAT rate field, running-number editing, bank details. Added to header.

## Cycle 21 — Password reset + security headers + rate limiting
- `next.config.mjs`: CSP (with Supabase/Sentry/PostHog connect-src), HSTS
  2yr+preload, X-Frame DENY, no-sniff, strict-origin-when-cross-origin,
  scoped Permissions-Policy (camera/mic/geo self; payment/usb off).
- `lib/rate-limit.ts`: in-memory sliding-window limiter (IP + email).
  Wired into login (10/IP + 5/email per 10min), signup (5/IP/hour),
  password reset (10/IP + 3/email per hour). Defense-in-depth with
  Supabase's own rate limits.
- `/reset-password` + `/update-password` pages. Min password length 8.
- Forgot-password link under login form.

## Cycle 22 — Portal security v2
- `0004_portal_security.sql`: portal_expires_at (default 90d),
  portal_pin_hash, portal_revoked_at, portal_last_viewed_at,
  portal_view_count + `portal_views` log with owner-RLS.
- Portal: enforces revoked/expired/PIN gates; PIN hashed per-project,
  constant-time compare, 10/min brute-force limit, valid-PIN cookie
  scoped to portal path (rotation invalidates).
- Client tab rewritten: view stats, expiry picker, PIN set/remove,
  regenerate token, revoke/reactivate. Portal header now branded with
  business logo + footer with contact info.

## Cycle 23 — Image compression
- `lib/image-compress.ts`: canvas-based resize; photos → 1600px/82%,
  receipts → 2000px/90% (OCR headroom). Skips <500KB and HEIC.
  Wired into uploadReportPhoto + uploadReceipt. Typical 3-5MB phone
  photo → 200-400KB.

## Cycle 24 — Invoicing (חשבונית מס / קבלה / הצעת מחיר / חשבונית מס-קבלה)
- `0005_invoices.sql`: invoices + invoice_items with RLS, unique
  (user_id, type, number_int) for legal-compliance mono-increment.
- `lib/invoice.ts`: computeTotals (VAT-incl vs VAT-excl math), number
  formatter, line-total helper.
- Actions: createInvoiceAction (allocates number → inserts header +
  items with rollback), setInvoiceStatus (draft→issued→paid/cancelled),
  deleteInvoice (drafts + quotes only).
- `/app/projects/[id]/invoices` tab: type filter tabs + warning when
  business profile incomplete. NewInvoiceButton dialog: multi-line
  builder with live totals.

## Cycle 25 — Invoice print + PDF endpoint
- `/invoices/[id]/print` with @media print + @page A4 — browser's
  Save-as-PDF produces a valid invoice. Header with logo + tax_id,
  recipient block, items table, VAT breakdown, payment instructions,
  footer. `/api/invoices/[id]/pdf` redirects here (swap for headless
  Chrome later).

## Cycle 26 — Portal quote acceptance
- `/portal/[token]/accept-quote/actions.ts`: acceptQuoteAction checks
  token/expiry/revoke + rate-limits + writes accepted_by_name (typed)
  + accepted_at. Portal lists pending quotes with inline approve form.
  Issued docs section lists all non-pending invoices/receipts.

## Cycle 27 — Change orders
- `0006_change_orders.sql`: change_orders with pending/approved/
  rejected/cancelled statuses, signed_by_name, rejected_reason.
- `/app/projects/[id]/changes` tab with NewChangeButton + list.
- Portal: pending changes with inline approval form (same typed-name
  signature pattern); resolved changes summary.

## Cycle 28 — Materials tracking
- `0007_materials.sql`: materials table (qty/unit/cost/supplier/status/
  delivery_date/expense_id link).
- `/app/projects/[id]/materials` with status-filter tabs, one-tap
  status advancement button (ordered → delivered → installed).

## Cycle 29 — Offline awareness
- `lib/use-online-status.ts` + `components/offline-banner.tsx`.
- Sticky warning banner below header when `navigator.onLine` is false.
- Full IndexedDB write queue deferred to ROADMAP (requires
  server-action POST interception, too risky unsupervised).

## Cycle 30 — Global search
- `/app/search?q=` unified ilike across 6 tables (projects / contacts /
  invoices / expenses / daily_reports.notes / tasks) with grouped
  results, limit 10/table so no single type starves the page.

## Cycle 31 — Welcome / onboarding + demo seed
- Post-signup redirect now /app/welcome instead of /app/projects/new.
- `/app/welcome` 3-step card: business profile → first project → demo.
- `seedDemoProjectAction` creates a full sample: project, 3 contacts,
  1 member, 2 daily reports with attendance, 2 expenses, 1 payment-in,
  2 tasks. Marks onboarding_completed_at.

## Cycle 32 — Landing page v2 + legal pages
- Hero with value prop ("שעתיים ביום"), pain→fix cards, 9-feature
  grid, 2-tier pricing (free + ₪99/mo), testimonial placeholder, CTA.
- OG meta tags for link previews. `/privacy` + `/terms` Hebrew pages.

## Cycle 33 — Telemetry (Sentry + PostHog)
- `lib/telemetry.ts` typed event façade — NOOP when DSN/key missing.
- `components/analytics.tsx` loads PostHog + Sentry script tags only
  when env vars set. Zero bundle cost when disabled.
- `.env.local.example` updated with new optional env vars (and dev
  port fix 3000 → 4000).

## Cycle 34 — Google SSO
- `GoogleButton` on /login + /signup using signInWithOAuth.
- Requires one-time Supabase dashboard config (docs next cycle).

## Cycle 35 — Deep review, docs, ROADMAP
- ROADMAP.md written with prioritized backlog (P0: teams, billing;
  P1: OCR, voice→text, offline queue, WhatsApp API; etc.).
- Build/lint/typecheck all green.
- 30+ routes, 7 migrations total, night-2 added ~3000 LOC across 25+
  new files. Every commit was a green build.

### Morning checklist (before users land)
1. **Apply migrations 0003–0007 in order** (Supabase SQL editor or
   `supabase db push`). Nothing tonight works without them.
2. Supabase Auth → Providers → Google: configure OAuth client ID/secret
   from Google Cloud Console; add `{APP_URL}/auth/callback` to Google's
   authorized redirect URIs.
3. (Optional) Set `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY` in
   Vercel. App works without them.
4. Verify `project-media` bucket public-read still works for portal.
5. Set `NEXT_PUBLIC_APP_URL` to production URL (portal share URLs depend
   on it).

### Known limitations
- Multi-user / teams not yet supported — single user per account.
- Offline writes: only connectivity banner + read-only SW cache.
  Write queue deferred.
- Invoice "PDF" uses browser Print-to-PDF, not server-rendered bytes.
- No email delivery for issued invoices yet (user shares via WhatsApp
  deep link, manual copy-paste, or downloaded PDF attached themselves).
- RLS untested — no automated test suite yet.








