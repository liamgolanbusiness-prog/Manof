-- Belt-and-suspenders: 0002_labor_settlement.sql shares the "0002" version
-- prefix with 0002_daily_reports_unique.sql. On remotes where the CLI had
-- already recorded 0002 from the daily-reports file, the labor-settlement
-- DDL never ran and public.worker_payments does not exist — which surfaces
-- as "Could not find the table 'public.worker_payments' in the schema cache"
-- when the money page tries to close a month. This migration re-runs the
-- DDL idempotently so any remote that missed the first pass gets caught up.

alter table public.expenses
  add column if not exists paid_at timestamptz;

create index if not exists expenses_project_paid_at_idx
  on public.expenses (project_id, paid_at);

create table if not exists public.worker_payments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  amount        numeric not null check (amount >= 0),
  paid_at       timestamptz not null default now(),
  notes         text,
  created_at    timestamptz default now(),
  check (period_end >= period_start)
);

create index if not exists worker_payments_project_paid_idx
  on public.worker_payments (project_id, paid_at desc);
create index if not exists worker_payments_project_contact_idx
  on public.worker_payments (project_id, contact_id, period_end desc);

alter table public.worker_payments enable row level security;

drop policy if exists worker_payments_self_all on public.worker_payments;
create policy worker_payments_self_all on public.worker_payments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
