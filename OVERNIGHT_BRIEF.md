# Atar — Overnight Build Brief

You are Claude Code, building the MVP of **Atar**, a mobile-first web app for Israeli construction contractors (קבלנים). The founder is asleep. You work autonomously from now until morning.

## The user you're building for
רמי — קבלן שיפוצים managing 4–8 active projects. He has dusty hands, a cheap Samsung, limited patience, and uses WhatsApp + Excel today. He needs to log what happened on a site in under 60 seconds. He speaks Hebrew.

## Top-level product goals (in priority order)
1. Extreme value to the user (saves hours per week)
2. Focus on saving time + money: daily log, expenses, people, finances per project
3. Dead simple — no feature creep, no complex options, works great on a phone

## Stack (already decided — don't change)
- **Next.js 14** with App Router, TypeScript
- **Tailwind CSS + shadcn/ui** for components
- **Supabase** for auth, DB, storage (env vars in `.env.local`, schema already applied)
- **Hebrew RTL throughout** — `<html lang="he" dir="rtl">`
- **PWA-ready** — manifest + service worker so it installs on phones
- Deploy target: Vercel (don't deploy — founder will do it)

## Working rhythm (MANDATORY)
You operate in cycles. Each cycle is:
1. **30 minutes BUILD** — focused work on one feature slice
2. **15 minutes REVIEW** — reflect in `PROGRESS.md`:
   - What I built this cycle
   - What works (tested locally? compiles? lints?)
   - What's broken or unfinished
   - What should be next and why
   - Any questions for the founder (leave in `QUESTIONS.md`)
3. Commit to git with a clear message: `git add -A && git commit -m "Cycle N: <what>"`
4. Start next cycle.

After every 4 cycles (~3 hours), do a **deep review**: open the app mentally as רמי, walk through a full day's workflow, note friction points, fix the worst one next cycle.

## Build order (do NOT deviate without writing it in QUESTIONS.md first)

### Phase 1: Foundation (cycles 1–2)
- `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` (if not already done)
- Install: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`
- Install shadcn: `npx shadcn@latest init` then add: button, input, card, dialog, tabs, textarea, label, select, toast
- Set up `lib/supabase/client.ts`, `lib/supabase/server.ts` per Supabase SSR docs
- Configure Tailwind for RTL (install `tailwindcss-rtl` or use logical properties throughout — prefer logical properties)
- Root layout: `<html lang="he" dir="rtl">`, set font to system Hebrew stack
- Create `app/globals.css` with sensible defaults, RTL-first

### Phase 2: Auth (cycle 3)
- Supabase email+password auth (simpler than SMS for MVP; founder can add SMS later)
- Routes: `/login`, `/signup`
- Middleware protecting all `/app/*` routes
- On signup, profile row is auto-created (trigger is in DB already)
- Post-signup: redirect to `/app/projects/new` to create first project

### Phase 3: Projects (cycles 4–5)
- `/app/projects` — list of user's projects as cards (cover photo, name, client, status chips)
- `/app/projects/new` — form: name, address (plain text for MVP, no Google Places yet), client name, client phone, start_date, target_end_date, contract_value
- `/app/projects/[id]` — project home with tabs: היום | יומן | כסף | אנשים | משימות | לקוח
- Each tab is its own route: `/app/projects/[id]/today`, `/app/projects/[id]/diary`, etc.
- Default tab: היום

### Phase 4: Daily report — THE HEART (cycles 6–9)
This is the single most important feature. Spend real quality on it.
- On `/today`: show today's report if exists, else big "התחל יום" button
- Report form:
  - Weather: optional text field (skip API for now)
  - Attendance: horizontal scrollable list of project_members with checkboxes + hours input per person
  - Notes: big textarea with placeholder "מה קרה היום באתר?"
  - Photos: upload to Supabase storage bucket `project-media`, show thumbnails in grid, up to 10 per report
  - Issues: "+ בעיה" button → inline form → creates issue row
- "סגור יום" button sets `is_closed = true`
- יומן tab: reverse-chrono list of daily reports, click to view/edit
- Target: full daily report entry in under 60 seconds. Test this yourself by simulating.

### Phase 5: Expenses (cycles 10–11)
- `/app/projects/[id]/money` shows three big numbers: תקציב | הוצא | נותר, plus הכנסות (payments in)
- Tabs within: הוצאות | תשלומים
- "+ הוצאה" modal: amount, category, supplier (from contacts, with "+ create new" inline), receipt photo upload, payment_method, date, notes
- "+ תשלום" modal: direction, amount, counterparty, date, method, invoice_number
- List both with filters

### Phase 6: Contacts + People tab (cycle 12)
- Global `/app/contacts` — searchable list, grouped by role
- Add/edit contact
- Import from device (skip for MVP, leave TODO)
- Project `/app/projects/[id]/people` — members of this project, total hours logged, total paid, quick actions

### Phase 7: Tasks (cycle 13)
- Simple to-do list under `/app/projects/[id]/tasks`
- Title, assignee (from contacts), due date, status
- Filter: today / this week / later / done

### Phase 8: Client portal (cycle 14)
- Public unauthenticated route `/portal/[token]` using project.portal_token
- Shows: project name, progress photos (curated — last 20 photos from reports), percentage complete (read from project.notes for MVP — make editable field later), timeline of milestones (skip — too much), payments summary
- "שלח עדכון ללקוח" button on project page generates WhatsApp deep link with portal URL

### Phase 9: Polish + PWA (cycle 15+)
- Add `public/manifest.json` for PWA
- Icons (placeholder — generate simple "A" logo in SVG, or leave TODO)
- Offline fallback page
- Optimize images
- Loading states, skeletons
- Error boundaries
- Empty states with guidance text
- Mobile touch targets ≥ 44px
- Test on narrow viewport (375px)

### Phase 10: If time remains
- Voice notes (skip Whisper for MVP — just record + upload to storage)
- Basic dashboard across all projects
- Landing page at `/` with Hebrew marketing copy

## Hard rules
- **Never fake data** — if something's not built, show an empty state with clear text. No Lorem Ipsum.
- **Never skip RTL** — everything must read right-to-left correctly, including icons, chevrons, progress bars.
- **Never break the build** — run `npm run build` at end of every cycle. If it fails, fix before new features.
- **Commit every cycle** — granular history lets founder roll back.
- **Don't install Cardcom / Tranzila / any payment SDK** — founder's accounts, handle tomorrow.
- **Don't deploy** — founder deploys.
- **If you genuinely don't know what to do** — write the question to `QUESTIONS.md` and choose the most defensible default. Don't stall.
- **Don't spend cycles on pixel-perfect design** — clean and functional > beautiful and half-built.
- **Hebrew throughout UI** — English only in code, comments, and `PROGRESS.md`.

## Files you must maintain
- `PROGRESS.md` — append-only log, one entry per cycle. Format:
```
  ## Cycle N — [timestamp] — <cycle title>
  **Built:** ...
  **Works:** ...
  **Broken/TODO:** ...
  **Next:** ...
```
- `QUESTIONS.md` — ambiguities and decisions the founder should confirm
- `README.md` — how to run locally, env vars, deployment steps for tomorrow morning

## Definition of done (by morning)
A founder can:
1. Run `npm install && npm run dev`, see the app on localhost:3000
2. Sign up, create a project, log a daily report with photos, add an expense, see a financial summary, share a client portal link
3. Read `PROGRESS.md` and understand exactly what's done and what's not
4. Read `QUESTIONS.md` and make decisions for the next session

Don't aim for "100% of MVP." Aim for "40% of MVP, rock solid, with a clear plan for the rest." Quality over coverage.

## Start now
Begin Cycle 1. Before you code, create `PROGRESS.md` with a header "# Atar Overnight Build Log" and write your plan for the first 4 cycles. Then start coding. Keep going until morning.