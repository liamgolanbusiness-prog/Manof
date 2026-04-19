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

