# Atar Roadmap

What's done, what's next, and the prioritized backlog.

Each item is sized as **S** (<1 day), **M** (1–3 days), **L** (1+ weeks).

---

## ✅ Shipped (tonight, cycles 20–34)

- Business profile + tax info + invoice counters + logo (C20)
- Password reset flow + security headers (CSP/HSTS/XFO) + rate limiting (C21)
- Portal security v2 — expiry, PIN, revoke, view tracking (C22)
- Client-side image compression (1600px/82%, 2000px/90% receipts) (C23)
- Invoices CRUD — חשבונית מס / קבלה / הצעת מחיר / חשבונית מס-קבלה (C24)
- Invoice print/PDF view with business branding + VAT breakdown (C25)
- Portal quote acceptance flow with typed-name signature (C26)
- Change orders + portal client approval (C27)
- Materials tracking with order/delivery/install status (C28)
- Offline connectivity banner + useOnlineStatus hook (C29)
- Global cross-entity search (C30)
- Welcome/onboarding wizard + seeded demo project (C31)
- Landing page v2 + pricing + privacy + terms (C32)
- Sentry + PostHog telemetry façade (NOOP when unconfigured) (C33)
- Google SSO on /login + /signup (C34)

---

## 🚨 Apply before users land

1. Migrations 0003-0007 must be applied in order:
   `supabase db push` or paste each `.sql` into Supabase SQL Editor.
2. Supabase Auth → Providers → Google: set up OAuth client + redirect URI.
3. Storage bucket `project-media`: verify public-read policy still stands.
4. (Optional) Set Sentry + PostHog env vars in Vercel.

---

## 🔜 Next priorities (revenue + retention)

### P0 — Multi-user / teams (L)
Biggest blocker to larger contractors. Needs:
- `organizations` table; projects/contacts/invoices moved to `org_id`
- `memberships` (user_id, org_id, role)
- Invite flow (email → Supabase magic link)
- Roles: `owner`, `admin`, `foreman` (today tab only), `accountant` (money+invoices only)
- Data migration: every existing user → new org with themselves as owner

### P0 — Subscription billing (M)
Monetization. Options:
- **Paddle** — cleanest (handles Israeli VAT + global)
- **Stripe** — more flexible but you handle VAT (Israeli 18%)
- **Lemon Squeezy** — simple but less custom

Scope:
- `/app/billing` page with plan + invoice history
- Webhook → `profiles.plan` column
- Feature gates (free: 1 project / 3 invoices per month; pro: unlimited)
- `subscription_status` column + grace period

### P1 — Receipt OCR (M)
Huge perceived value. User photographs receipt → AI extracts amount, supplier, date, category.
- Claude Vision API call from server action
- Cost: ~$0.005/image; can gate behind pro plan
- Fallback: manual entry (current state)

### P1 — Voice → text (M)
Already recording voice notes; transcribe them with Whisper.
- Claude Haiku + audio, or OpenAI Whisper API
- Auto-extract structured info: "דני עבד 8 שעות, קנינו שקעים ל-120" → attendance + expense rows
- Differentiator nobody else has in the Israeli market

### P1 — True offline write queue (M)
Complete the SW story. IndexedDB queue for:
- Daily report basics save
- Attendance save
- Photo upload (held in queue until online)
- Expense create

### P1 — WhatsApp Business API (M)
Currently using `wa.me` deep links. Upgrade to proper WhatsApp Business Platform API:
- Automated end-of-day summary to client
- Invoice delivery via WhatsApp
- 2-way replies from client into portal comments

### P2 — Integrations with Israeli accounting (L)
Pick one first:
- **greenInvoice** (best API)
- **iCount**
- **ezCount** (biggest installed base)

Sync: contacts in/out, export issued invoices at EOM.

### P2 — SMS notifications (M)
- Provider: Twilio, 019, or SMS4Free
- Triggers: overdue invoice, client viewed portal, new change order approved
- Require phone verification on signup

### P2 — Materials catalog + inventory (M)
Contractors reuse the same items project after project. Add a global `materials_catalog` table with typical prices so creating a new material is picker-first, not typing.

### P2 — Cross-project dashboard KPIs (S)
Current `/app` dashboard is basic. Add:
- Month-over-month revenue chart
- Project profitability bar chart
- Cashflow forecast

### P2 — Project templates (S)
Copy from existing project: "שיפוץ מטבח" → auto-creates default tasks, team, budget structure.

### P3 — Infrastructure / observability
- Real error tracking (wire Sentry for real)
- `npm test` — no tests yet; start with RLS smoke tests
- CI pipeline (GitHub Actions → lint + typecheck + build)
- Staging env on Vercel preview
- Automated DB backups + retention policy
- `supabase gen types` in CI to avoid hand-drift

### P3 — Compliance hardening
- GDPR-style data export endpoint (ZIP of all user data)
- Account deletion flow (soft-delete with 30-day grace)
- Invoice archival (7-year retention per Israeli tax law)
- Audit log (who changed what, when)

### P3 — Differentiators to consider
- Weather auto-fetch (open-meteo free)
- Google Places address autocomplete
- Calendar sync (Google/Apple)
- Push notifications (web push)
- Arabic UI (big Arab-contractor segment in Israel)

### P4 — Nice-to-haves
- Electrical subcontractor / plumber specialist modes (strip-down)
- Photo annotation (arrows, text, compare before/after)
- Worker time-clock with geo
- Drawings/permits document storage
- Bid / quote comparison
- Warranty period tracking

---

## 🎯 North-star: what makes Atar win

Against Hishuv/iCount: we're mobile-first, contractor-workflow-first, not accounting-first.
Against monday.com: we know Israeli law (VAT, invoice rules, contractor terms).
Against WhatsApp/Excel: we're structured enough to scale past 5 projects.

The wedge that wins: **voice + photo → structured data** (OCR + Whisper → auto-log). No competitor does this in Hebrew today.
