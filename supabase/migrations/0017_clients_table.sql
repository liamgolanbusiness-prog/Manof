-- Separate "client" from "contact". Clients are the customer side (they
-- pay us) and share nothing operational with workers/suppliers/subcontractors.
-- This migration:
--   1. creates a dedicated `clients` table
--   2. adds `projects.client_id` FK (keeps client_name/client_phone as a
--      denormalized mirror so legacy readers — invoices, portal, WhatsApp —
--      keep working without a cross-cutting refactor)
--   3. migrates contacts.role='client' rows into clients, backfills
--      projects.client_id where the denormalized name matches, then
--      deletes the client contacts
--   4. adds a CHECK on contacts.role to prevent new 'client' entries

--------------------------------------------------------------------------------
-- clients
--------------------------------------------------------------------------------
create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  phone            text,
  email            text,
  tax_id           text,
  billing_address  text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_user_name_idx on public.clients (user_id, lower(name));

alter table public.clients enable row level security;
drop policy if exists clients_self_all on public.clients;
create policy clients_self_all on public.clients
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- touch_updated_at trigger (function defined in 0001_baseline)
drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute function public.touch_updated_at();

--------------------------------------------------------------------------------
-- projects.client_id
--------------------------------------------------------------------------------
alter table public.projects
  add column if not exists client_id uuid
  references public.clients(id) on delete set null;

create index if not exists projects_client_id_idx on public.projects (client_id);

--------------------------------------------------------------------------------
-- Data migration: contacts with role='client' → clients
--------------------------------------------------------------------------------
-- Insert a client for every existing role='client' contact. Skip if the same
-- (user_id, lower(name)) already exists (idempotent re-run).
insert into public.clients (user_id, name, phone, notes, created_at)
select c.user_id, c.name, c.phone, c.notes, c.created_at
from public.contacts c
where c.role = 'client'
  and not exists (
    select 1 from public.clients cl
    where cl.user_id = c.user_id
      and lower(cl.name) = lower(c.name)
  );

-- Backfill projects.client_id where the denormalized client_name matches a
-- client for the same user (case-insensitive). Only update rows that still
-- have a null client_id (safe to re-run).
update public.projects p
set client_id = cl.id
from public.clients cl
where p.client_id is null
  and p.client_name is not null
  and cl.user_id = p.user_id
  and lower(cl.name) = lower(p.client_name);

-- Delete the role='client' contacts. FK-referencing rows:
--   expenses.supplier_contact_id       → on delete set null
--   payments.counterparty_contact_id   → on delete set null
--   tasks.assignee_contact_id          → on delete set null
--   attendance.contact_id              → on delete cascade (unlikely, would be bad data anyway)
--   project_members.contact_id         → on delete cascade (same)
-- All references become null/drop cleanly.
delete from public.contacts where role = 'client';

--------------------------------------------------------------------------------
-- Guard: prevent new contacts.role = 'client'
--------------------------------------------------------------------------------
alter table public.contacts
  drop constraint if exists contacts_role_check;
alter table public.contacts
  add constraint contacts_role_check
  check (role in ('worker', 'subcontractor', 'supplier', 'other'));
