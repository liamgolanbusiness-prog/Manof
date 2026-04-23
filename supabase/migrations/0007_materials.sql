-- Ensure touch_updated_at() exists (idempotent; defined originally in 0001).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Materials tracking per project. Sits alongside expenses: an expense is a
-- receipt you paid; a material is a line item physically on the site
-- (ordered / delivered / installed / returned). A contractor commonly has
-- the same item as both — we link them via expense_id when paid.

create table if not exists public.materials (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  quantity             numeric(14,3) not null default 1,
  unit                 text,                 -- מ״ר / יח׳ / ק״ג / שק etc.
  cost_per_unit        numeric(14,2),
  total_cost           numeric(14,2),
  supplier_contact_id  uuid references public.contacts(id) on delete set null,
  status               text not null default 'ordered'
    check (status in ('ordered','delivered','installed','returned')),
  delivery_date        date,
  expense_id           uuid references public.expenses(id) on delete set null,
  notes                text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);
create index if not exists materials_project_id_idx
  on public.materials (project_id, created_at desc);

drop trigger if exists materials_touch_updated_at on public.materials;
create trigger materials_touch_updated_at
  before update on public.materials
  for each row execute function public.touch_updated_at();

alter table public.materials enable row level security;

drop policy if exists materials_self_all on public.materials;
create policy materials_self_all on public.materials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
