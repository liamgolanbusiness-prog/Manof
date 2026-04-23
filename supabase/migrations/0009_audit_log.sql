-- Audit log for legally-sensitive tables. Triggers capture INSERT / UPDATE /
-- DELETE of invoices, change_orders, payments, expenses with before/after
-- JSON diffs. Owner can read their own audit rows; writes are trigger-only.
--
-- Keep scope tight — we DON'T log daily_reports / attendance / photos / tasks
-- to avoid noise. Those are high-volume and low-dispute.

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  table_name    text not null,
  row_id        uuid,
  action        text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data      jsonb,
  new_data      jsonb,
  actor_id      uuid,           -- auth.uid() at write time (may differ from user_id for future teams)
  created_at    timestamptz default now()
);
create index if not exists audit_log_user_id_idx on public.audit_log (user_id, created_at desc);
create index if not exists audit_log_row_idx on public.audit_log (table_name, row_id);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_self_read on public.audit_log;
create policy audit_log_self_read on public.audit_log
  for select using (user_id = auth.uid());

-- Generic trigger function — assumes the target table has a user_id column.
create or replace function public.audit_writer()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_user uuid;
begin
  if TG_OP = 'DELETE' then
    target_user := OLD.user_id;
  else
    target_user := NEW.user_id;
  end if;
  if target_user is null then
    return coalesce(NEW, OLD);
  end if;

  insert into public.audit_log (user_id, table_name, row_id, action, old_data, new_data, actor_id)
  values (
    target_user,
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP,
    case when TG_OP = 'DELETE' or TG_OP = 'UPDATE' then to_jsonb(OLD) else null end,
    case when TG_OP = 'INSERT' or TG_OP = 'UPDATE' then to_jsonb(NEW) else null end,
    auth.uid()
  );
  return coalesce(NEW, OLD);
end;
$$;

-- Attach to each sensitive table.
do $$
declare tbl text;
begin
  foreach tbl in array array['invoices','change_orders','payments','expenses']
  loop
    execute format('drop trigger if exists %1$s_audit on public.%1$s', tbl);
    execute format(
      'create trigger %1$s_audit after insert or update or delete on public.%1$s for each row execute function public.audit_writer()',
      tbl
    );
  end loop;
end;
$$;
