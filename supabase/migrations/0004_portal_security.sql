-- Portal security v2.
--
-- Before this migration: projects.portal_token is permanent, unrestricted, and
-- the portal route uses the service role key to bypass RLS. If a client leaked
-- the link anyone could view everything forever.
--
-- After: the token is still the primary credential (can be regenerated), but
-- the portal now also supports:
--   - expiration (default 90 days, NULL = no expiry)
--   - optional 4-digit PIN the client enters once per browser
--   - revocation (hard-delete access without rotating the token)
--   - view tracking (count + last view + recent view log)

alter table public.projects
  add column if not exists portal_expires_at      timestamptz,
  add column if not exists portal_pin_hash        text,
  add column if not exists portal_revoked_at      timestamptz,
  add column if not exists portal_last_viewed_at  timestamptz,
  add column if not exists portal_view_count      integer default 0;

-- Default-expire existing projects 90 days from now if they were silently
-- opened to the world. Skip projects with an expiry already set.
update public.projects
   set portal_expires_at = now() + interval '90 days'
 where portal_expires_at is null;

create table if not exists public.portal_views (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  viewed_at     timestamptz default now(),
  ip_hash       text,          -- sha256(ip + token) — for dedupe w/o storing PII
  user_agent    text
);
create index if not exists portal_views_project_id_idx
  on public.portal_views (project_id, viewed_at desc);

alter table public.portal_views enable row level security;

-- Owner can read view log; service role writes it from the public portal route.
drop policy if exists portal_views_owner_read on public.portal_views;
create policy portal_views_owner_read on public.portal_views
  for select using (
    exists (select 1 from public.projects p
            where p.id = portal_views.project_id and p.user_id = auth.uid())
  );
