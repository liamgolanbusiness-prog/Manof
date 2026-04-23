-- Ensure touch_updated_at() exists (idempotent; defined originally in 0001).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Reusable materials catalog per user. Contractors buy the same items
-- repeatedly (cement, tiles, brand-name paint). Saves typing + price
-- memory + lets us surface "typical" costs when a new project starts.

create table if not exists public.materials_catalog (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  default_unit          text,
  typical_cost_per_unit numeric(14,2),
  default_supplier_id   uuid references public.contacts(id) on delete set null,
  use_count             integer not null default 0,
  last_used_at          timestamptz,
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
create unique index if not exists materials_catalog_user_name_uq
  on public.materials_catalog (user_id, lower(name));
create index if not exists materials_catalog_user_id_idx
  on public.materials_catalog (user_id, use_count desc);

drop trigger if exists materials_catalog_touch_updated_at on public.materials_catalog;
create trigger materials_catalog_touch_updated_at
  before update on public.materials_catalog
  for each row execute function public.touch_updated_at();

alter table public.materials_catalog enable row level security;

drop policy if exists materials_catalog_self_all on public.materials_catalog;
create policy materials_catalog_self_all on public.materials_catalog
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
