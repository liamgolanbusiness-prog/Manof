-- Outbound webhooks. One row per URL; events is a text[] filter.
-- Used with Zapier, Make, n8n, or any custom endpoint.

create table if not exists public.webhooks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  url           text not null,
  events        text[] not null default '{}',
  secret        text,                    -- HMAC signing key (random, owner-visible)
  active        boolean not null default true,
  last_status   integer,
  last_fired_at timestamptz,
  last_error    text,
  created_at    timestamptz default now()
);
create index if not exists webhooks_user_id_idx on public.webhooks (user_id);

alter table public.webhooks enable row level security;
drop policy if exists webhooks_self_all on public.webhooks;
create policy webhooks_self_all on public.webhooks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
