-- Baseline schema for Atar (עתר)
-- Generated 2026-04-20 from the live Supabase project via OpenAPI introspection.
--
-- NOTE: This is a best-effort re-creation intended as a repo snapshot. It
-- captures table shapes, primary keys, foreign keys I could infer from column
-- names, defaults, and the RLS patterns the app expects. It does NOT guarantee
-- byte-for-byte parity with your live DB.
--
-- For the authoritative SQL (including any RLS/policy/trigger variations), run:
--     supabase link --project-ref jvuywrjzxkrihojsualc
--     supabase db pull
-- and overwrite this file with the result.

--------------------------------------------------------------------------------
-- Extensions
--------------------------------------------------------------------------------
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
--------------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text,
  full_name       text,
  business_name   text,
  logo_url        text,
  created_at      timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

--------------------------------------------------------------------------------
-- projects
--------------------------------------------------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  address          text,
  client_name      text,
  client_phone     text,
  contract_value   numeric,
  start_date       date,
  target_end_date  date,
  status           text default 'active',
  cover_photo_url  text,
  portal_token     text default gen_random_uuid()::text,
  progress_pct     integer default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists projects_user_id_idx on public.projects (user_id);
create unique index if not exists projects_portal_token_uq on public.projects (portal_token);

--------------------------------------------------------------------------------
-- contacts (global per user)
--------------------------------------------------------------------------------
create table if not exists public.contacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  phone        text,
  role         text not null,
  trade        text,
  pay_rate     numeric,
  pay_type     text,
  notes        text,
  created_at   timestamptz default now()
);
create index if not exists contacts_user_id_idx on public.contacts (user_id);

--------------------------------------------------------------------------------
-- project_members (contacts assigned to a project)
--------------------------------------------------------------------------------
create table if not exists public.project_members (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  contact_id        uuid not null references public.contacts(id) on delete cascade,
  role_in_project   text,
  agreed_amount     numeric,
  created_at        timestamptz default now(),
  unique (project_id, contact_id)
);

--------------------------------------------------------------------------------
-- daily_reports
--------------------------------------------------------------------------------
create table if not exists public.daily_reports (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  report_date     date not null default current_date,
  weather         text,
  notes           text,
  voice_note_url  text,
  locked          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists daily_reports_project_date_idx
  on public.daily_reports (project_id, report_date desc);

--------------------------------------------------------------------------------
-- attendance (daily_report × contact)
--------------------------------------------------------------------------------
create table if not exists public.attendance (
  id                uuid primary key default gen_random_uuid(),
  daily_report_id   uuid not null references public.daily_reports(id) on delete cascade,
  contact_id        uuid not null references public.contacts(id) on delete cascade,
  hours_worked      numeric,
  notes             text,
  created_at        timestamptz default now(),
  unique (daily_report_id, contact_id)
);

--------------------------------------------------------------------------------
-- report_photos
--------------------------------------------------------------------------------
create table if not exists public.report_photos (
  id                uuid primary key default gen_random_uuid(),
  daily_report_id   uuid not null references public.daily_reports(id) on delete cascade,
  url               text not null,
  caption           text,
  geo_lat           numeric,
  geo_lng           numeric,
  taken_at          timestamptz default now()
);
create index if not exists report_photos_daily_report_id_idx
  on public.report_photos (daily_report_id);

--------------------------------------------------------------------------------
-- issues
--------------------------------------------------------------------------------
create table if not exists public.issues (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  description       text,
  photo_url         text,
  severity          text default 'medium',
  status            text default 'open',
  source_report_id  uuid references public.daily_reports(id) on delete set null,
  created_at        timestamptz default now(),
  resolved_at       timestamptz
);
create index if not exists issues_project_id_idx on public.issues (project_id);
create index if not exists issues_source_report_id_idx on public.issues (source_report_id);

--------------------------------------------------------------------------------
-- expenses
--------------------------------------------------------------------------------
create table if not exists public.expenses (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  amount               numeric not null,
  category             text not null,
  supplier_contact_id  uuid references public.contacts(id) on delete set null,
  receipt_photo_url    text,
  paid_by              text,
  payment_method       text,
  expense_date         date not null default current_date,
  notes                text,
  created_at           timestamptz default now()
);
create index if not exists expenses_project_date_idx
  on public.expenses (project_id, expense_date desc);

--------------------------------------------------------------------------------
-- payments
--------------------------------------------------------------------------------
create table if not exists public.payments (
  id                       uuid primary key default gen_random_uuid(),
  project_id               uuid not null references public.projects(id) on delete cascade,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  direction                text not null check (direction in ('in','out')),
  amount                   numeric not null,
  counterparty_contact_id  uuid references public.contacts(id) on delete set null,
  payment_date             date not null default current_date,
  method                   text,
  invoice_number           text,
  notes                    text,
  created_at               timestamptz default now()
);
create index if not exists payments_project_date_idx
  on public.payments (project_id, payment_date desc);

--------------------------------------------------------------------------------
-- tasks
--------------------------------------------------------------------------------
create table if not exists public.tasks (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  title                 text not null,
  description           text,
  assignee_contact_id   uuid references public.contacts(id) on delete set null,
  due_date              date,
  status                text default 'open',
  created_at            timestamptz default now(),
  completed_at          timestamptz
);
create index if not exists tasks_project_due_idx on public.tasks (project_id, due_date);

--------------------------------------------------------------------------------
-- keep updated_at fresh on row writes
--------------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists daily_reports_touch_updated_at on public.daily_reports;
create trigger daily_reports_touch_updated_at
  before update on public.daily_reports
  for each row execute function public.touch_updated_at();

--------------------------------------------------------------------------------
-- Row Level Security
--------------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.contacts         enable row level security;
alter table public.project_members  enable row level security;
alter table public.daily_reports    enable row level security;
alter table public.attendance       enable row level security;
alter table public.report_photos    enable row level security;
alter table public.issues           enable row level security;
alter table public.expenses         enable row level security;
alter table public.payments         enable row level security;
alter table public.tasks            enable row level security;

-- profiles: each user can read + update their own row
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- "own row" tables: user_id = auth.uid()
do $$
declare tbl text;
begin
  foreach tbl in array array['projects','contacts','daily_reports','issues','expenses','payments','tasks']
  loop
    execute format('drop policy if exists %1$s_self_all on public.%1$s', tbl);
    execute format(
      'create policy %1$s_self_all on public.%1$s for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      tbl
    );
  end loop;
end;
$$;

-- child tables scoped by project ownership
drop policy if exists project_members_project_all on public.project_members;
create policy project_members_project_all on public.project_members
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_members.project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p
            where p.id = project_members.project_id and p.user_id = auth.uid())
  );

-- attendance + report_photos scoped via daily_reports ownership
drop policy if exists attendance_report_all on public.attendance;
create policy attendance_report_all on public.attendance
  for all using (
    exists (select 1 from public.daily_reports dr
            where dr.id = attendance.daily_report_id and dr.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.daily_reports dr
            where dr.id = attendance.daily_report_id and dr.user_id = auth.uid())
  );

drop policy if exists report_photos_report_all on public.report_photos;
create policy report_photos_report_all on public.report_photos
  for all using (
    exists (select 1 from public.daily_reports dr
            where dr.id = report_photos.daily_report_id and dr.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.daily_reports dr
            where dr.id = report_photos.daily_report_id and dr.user_id = auth.uid())
  );

--------------------------------------------------------------------------------
-- Storage bucket: project-media
-- Run from the Supabase SQL editor if the bucket doesn't exist yet.
--------------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public)
-- values ('project-media', 'project-media', true)
-- on conflict (id) do nothing;
--
-- -- Allow authenticated users to upload under their own paths
-- create policy "authenticated_upload" on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'project-media');
--
-- -- Public read for the portal
-- create policy "public_read" on storage.objects
--   for select using (bucket_id = 'project-media');
