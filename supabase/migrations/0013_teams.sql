-- Team collaboration on projects. Additive — projects.user_id stays the
-- canonical owner; project_collaborators grants additional access.
--
-- Roles:
--   owner   — same as user_id (implicit; not usually inserted)
--   admin   — read + write everything, invite others, delete rows
--   editor  — read + write (reports, expenses, invoices, etc.)
--             cannot invite others, cannot delete the project
--   viewer  — read-only (useful for accountant / client-side auditor)
--
-- Invite flow:
--   invited_email populated + user_id null → pending invite
--   on signup/login, a trigger (or action) matches invited_email to auth.users.email
--     and populates user_id + accepted_at
--
-- RLS extended on projects + every child table. Helper function
-- has_project_access(project_id, writer_required) keeps the policies DRY.

create table if not exists public.project_collaborators (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete cascade,
  invited_email  text,
  role           text not null default 'editor'
    check (role in ('owner','admin','editor','viewer')),
  invited_by     uuid references auth.users(id) on delete set null,
  invited_at     timestamptz default now(),
  accepted_at    timestamptz,
  -- Either user_id (if already on platform) OR invited_email is required.
  constraint collab_requires_identity check (user_id is not null or invited_email is not null)
);
create index if not exists project_collaborators_project_id_idx
  on public.project_collaborators (project_id);
create index if not exists project_collaborators_user_id_idx
  on public.project_collaborators (user_id) where user_id is not null;
create unique index if not exists project_collaborators_project_user_uq
  on public.project_collaborators (project_id, user_id)
  where user_id is not null;
create unique index if not exists project_collaborators_project_email_uq
  on public.project_collaborators (project_id, lower(invited_email))
  where invited_email is not null;

alter table public.project_collaborators enable row level security;

-- Helper: does auth.uid() have read access to this project?
create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql
stable security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.projects p
       where p.id = p_project_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_collaborators c
       where c.project_id = p_project_id
         and c.user_id = auth.uid()
         and c.accepted_at is not null
    );
$$;

-- Helper: does auth.uid() have write access (owner/admin/editor, not viewer)?
create or replace function public.has_project_write(p_project_id uuid)
returns boolean
language sql
stable security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.projects p
       where p.id = p_project_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_collaborators c
       where c.project_id = p_project_id
         and c.user_id = auth.uid()
         and c.accepted_at is not null
         and c.role in ('owner','admin','editor')
    );
$$;

grant execute on function public.has_project_access(uuid) to authenticated;
grant execute on function public.has_project_write(uuid)  to authenticated;

-- Collaborator rows: owner + accepted collabs can read; only owner + admin can write.
drop policy if exists collaborators_read on public.project_collaborators;
create policy collaborators_read on public.project_collaborators
  for select using (
    user_id = auth.uid()                     -- you see your own invitation
    or exists (                              -- or you have access to the project
      select 1 from public.projects p
       where p.id = project_collaborators.project_id
         and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_collaborators me
       where me.project_id = project_collaborators.project_id
         and me.user_id = auth.uid()
         and me.accepted_at is not null
         and me.role in ('admin','editor')
    )
  );

drop policy if exists collaborators_write on public.project_collaborators;
create policy collaborators_write on public.project_collaborators
  for all using (
    exists (
      select 1 from public.projects p
       where p.id = project_collaborators.project_id
         and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_collaborators me
       where me.project_id = project_collaborators.project_id
         and me.user_id = auth.uid()
         and me.accepted_at is not null
         and me.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.projects p
       where p.id = project_collaborators.project_id
         and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_collaborators me
       where me.project_id = project_collaborators.project_id
         and me.user_id = auth.uid()
         and me.accepted_at is not null
         and me.role = 'admin'
    )
  );

-- Extend project read/write policies to include collaborators.
drop policy if exists projects_self_all on public.projects;
create policy projects_select on public.projects
  for select using (user_id = auth.uid() or has_project_access(id));
create policy projects_insert on public.projects
  for insert with check (user_id = auth.uid());
create policy projects_update on public.projects
  for update using (user_id = auth.uid() or has_project_write(id))
         with check (user_id = auth.uid() or has_project_write(id));
create policy projects_delete on public.projects
  for delete using (user_id = auth.uid());   -- only original owner deletes

-- Child tables: replace the plain user_id = auth.uid() with a collab-aware
-- policy keyed on project_id. Each table has `project_id` already.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'daily_reports','issues','expenses','payments','tasks','invoices',
    'change_orders','materials','worker_payments'
  ]
  loop
    execute format('drop policy if exists %1$s_self_all on public.%1$s', tbl);
    execute format(
      'create policy %1$s_read on public.%1$s for select using (has_project_access(project_id))',
      tbl
    );
    execute format(
      'create policy %1$s_write on public.%1$s for all using (has_project_write(project_id)) with check (has_project_write(project_id))',
      tbl
    );
  end loop;
end;
$$;

-- Auto-accept flow: when a new auth user is created, match any pending
-- invitations by email and set user_id + accepted_at. Runs as security
-- definer so it can update rows the user can't yet see.
create or replace function public.accept_pending_invites_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.project_collaborators
     set user_id = new.id, accepted_at = coalesce(accepted_at, now())
   where user_id is null
     and lower(invited_email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_accept_invites on auth.users;
create trigger on_auth_user_created_accept_invites
  after insert on auth.users
  for each row execute function public.accept_pending_invites_for_new_user();

-- Add signature image column to quote / change acceptance rows. Data-URL
-- PNG from the client's signature pad; nullable so typed-name-only flows
-- still work.
alter table public.invoices
  add column if not exists accepted_signature_url text;
alter table public.change_orders
  add column if not exists signed_signature_url text;
