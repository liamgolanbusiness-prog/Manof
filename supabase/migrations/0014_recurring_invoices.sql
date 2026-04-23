-- Recurring invoice templates — for retainers and monthly services.
-- Cron picks up due templates and calls a server action to issue the next
-- real invoice copy.

-- Ensure touch_updated_at() exists (idempotent; defined originally in 0001).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.recurring_invoice_templates (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  project_id         uuid references public.projects(id) on delete set null,
  type               text not null default 'tax_invoice',
  frequency          text not null default 'monthly'
    check (frequency in ('weekly','biweekly','monthly','quarterly','yearly')),
  next_issue_date    date not null,
  active             boolean not null default true,
  client_name        text,
  client_tax_id      text,
  client_email       text,
  client_phone       text,
  client_address     text,
  items              jsonb not null default '[]'::jsonb,
  vat_rate           numeric(5,2) not null default 18.00,
  vat_included       boolean not null default false,
  notes              text,
  footer             text,
  last_issued_at     timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index if not exists recurring_invoice_user_idx
  on public.recurring_invoice_templates (user_id);
create index if not exists recurring_invoice_due_idx
  on public.recurring_invoice_templates (active, next_issue_date)
  where active = true;

drop trigger if exists recurring_invoice_touch_updated_at
  on public.recurring_invoice_templates;
create trigger recurring_invoice_touch_updated_at
  before update on public.recurring_invoice_templates
  for each row execute function public.touch_updated_at();

alter table public.recurring_invoice_templates enable row level security;

drop policy if exists recurring_invoice_self_all
  on public.recurring_invoice_templates;
create policy recurring_invoice_self_all on public.recurring_invoice_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
