-- Foreman (מנהל עבודה) + project schedule milestones.
--
--   1. Allow contacts.role = 'foreman' (alongside worker/subcontractor/supplier/other).
--   2. projects.foreman_contact_id — default foreman for the project, used to
--      prefill the daily report. Nullable.
--   3. daily_reports.foreman_contact_id + daily_reports.foreman_on_site —
--      who was the foreman on this specific day, and whether they were on site.
--      Defaults to the project's foreman when the report is created (set in
--      app code, not via DB default, since it's a cross-table lookup).
--   4. project_milestones table — planned schedule with planned_date,
--      actual_date, done flag, manual ordering. Visible in app + portal.

--------------------------------------------------------------------------------
-- 1. contacts.role: allow 'foreman'
--------------------------------------------------------------------------------
alter table public.contacts
  drop constraint if exists contacts_role_check;
alter table public.contacts
  add constraint contacts_role_check
  check (role in ('worker', 'subcontractor', 'supplier', 'foreman', 'other'));

--------------------------------------------------------------------------------
-- 2. projects.foreman_contact_id
--------------------------------------------------------------------------------
alter table public.projects
  add column if not exists foreman_contact_id uuid
  references public.contacts(id) on delete set null;
create index if not exists projects_foreman_contact_id_idx
  on public.projects (foreman_contact_id);

--------------------------------------------------------------------------------
-- 3. daily_reports: per-day foreman + on-site flag
--------------------------------------------------------------------------------
alter table public.daily_reports
  add column if not exists foreman_contact_id uuid
  references public.contacts(id) on delete set null;
alter table public.daily_reports
  add column if not exists foreman_on_site boolean;

--------------------------------------------------------------------------------
-- 4. project_milestones
--------------------------------------------------------------------------------
create table if not exists public.project_milestones (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  name          text not null,
  planned_date  date,
  actual_date   date,
  done          boolean default false,
  position      integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists project_milestones_project_id_idx
  on public.project_milestones (project_id, position, planned_date);

drop trigger if exists project_milestones_touch_updated_at on public.project_milestones;
create trigger project_milestones_touch_updated_at
  before update on public.project_milestones
  for each row execute function public.touch_updated_at();

alter table public.project_milestones enable row level security;
drop policy if exists project_milestones_project_all on public.project_milestones;
create policy project_milestones_project_all on public.project_milestones
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_milestones.project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p
            where p.id = project_milestones.project_id and p.user_id = auth.uid())
  );
