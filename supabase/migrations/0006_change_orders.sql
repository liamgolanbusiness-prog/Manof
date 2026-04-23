-- Ensure touch_updated_at() exists (idempotent; defined originally in 0001).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Change orders (שינויים בחוזה). The #1 source of contractor-client conflict:
-- mid-project scope changes that the client later disputes. This table
-- models each change as a signed document — the contractor proposes, the
-- client approves via the portal by typing their name (same soft-signature
-- pattern as quote acceptance). Approved amount auto-flows into the
-- money-tab "effective contract value" calculation.

create table if not exists public.change_orders (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  title              text not null,
  description        text,
  amount_change      numeric(14,2) not null default 0,
  status             text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  signed_by_name     text,
  signed_at          timestamptz,
  rejected_at        timestamptz,
  rejected_reason    text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index if not exists change_orders_project_id_idx
  on public.change_orders (project_id, created_at desc);

drop trigger if exists change_orders_touch_updated_at on public.change_orders;
create trigger change_orders_touch_updated_at
  before update on public.change_orders
  for each row execute function public.touch_updated_at();

alter table public.change_orders enable row level security;

drop policy if exists change_orders_self_all on public.change_orders;
create policy change_orders_self_all on public.change_orders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
