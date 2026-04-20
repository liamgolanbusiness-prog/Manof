-- Adds payment-status tracking to expenses, and a table for end-of-month
-- worker labor settlements. Labor "owed" is computed on read (attendance ×
-- pay_rate) minus the sum of worker_payments already written for the worker.

--------------------------------------------------------------------------------
-- expenses: paid_at (null = unpaid)
--------------------------------------------------------------------------------
alter table public.expenses
  add column if not exists paid_at timestamptz;

create index if not exists expenses_project_paid_at_idx
  on public.expenses (project_id, paid_at);

--------------------------------------------------------------------------------
-- worker_payments: settlement of a worker's labor for a date range
--------------------------------------------------------------------------------
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
