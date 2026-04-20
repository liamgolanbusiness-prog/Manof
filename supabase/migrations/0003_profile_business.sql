-- Profile → Business profile: adds legal/tax/branding fields so the contractor
-- can issue invoices, brand the portal, and present full business identity to
-- clients. Also adds invoice/quote running-number counters.

alter table public.profiles
  add column if not exists tax_id            text,            -- ח.פ. / ע.מ. / ת.ז.
  add column if not exists tax_id_type       text default 'osek_patur'
      check (tax_id_type in ('osek_patur','osek_morshe','company','individual')),
  add column if not exists vat_rate          numeric(5,2) default 18.00,
  add column if not exists vat_included      boolean default false,
  add column if not exists address           text,
  add column if not exists city              text,
  add column if not exists email             text,
  add column if not exists website           text,
  add column if not exists invoice_prefix    text default '',
  add column if not exists next_invoice_number integer default 1,
  add column if not exists next_quote_number   integer default 1,
  add column if not exists next_receipt_number integer default 1,
  add column if not exists bank_name         text,
  add column if not exists bank_branch       text,
  add column if not exists bank_account      text,
  add column if not exists bit_phone         text,
  add column if not exists invoice_footer    text,
  add column if not exists onboarding_completed_at timestamptz;

-- Atomic counter helpers, returning the allocated number.
-- Separate rows per counter type so concurrent invoice + quote inserts don't
-- stall on the same row lock.
create or replace function public.allocate_invoice_number(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare v integer;
begin
  update public.profiles
     set next_invoice_number = coalesce(next_invoice_number, 1) + 1
   where id = p_user_id
   returning next_invoice_number - 1 into v;
  if v is null then
    -- profile missing; should never happen after signup trigger but be safe
    insert into public.profiles (id, next_invoice_number) values (p_user_id, 2)
      on conflict (id) do update set next_invoice_number =
        coalesce(public.profiles.next_invoice_number, 1) + 1
      returning next_invoice_number - 1 into v;
  end if;
  return v;
end;
$$;

create or replace function public.allocate_quote_number(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare v integer;
begin
  update public.profiles
     set next_quote_number = coalesce(next_quote_number, 1) + 1
   where id = p_user_id
   returning next_quote_number - 1 into v;
  if v is null then
    insert into public.profiles (id, next_quote_number) values (p_user_id, 2)
      on conflict (id) do update set next_quote_number =
        coalesce(public.profiles.next_quote_number, 1) + 1
      returning next_quote_number - 1 into v;
  end if;
  return v;
end;
$$;

create or replace function public.allocate_receipt_number(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare v integer;
begin
  update public.profiles
     set next_receipt_number = coalesce(next_receipt_number, 1) + 1
   where id = p_user_id
   returning next_receipt_number - 1 into v;
  if v is null then
    insert into public.profiles (id, next_receipt_number) values (p_user_id, 2)
      on conflict (id) do update set next_receipt_number =
        coalesce(public.profiles.next_receipt_number, 1) + 1
      returning next_receipt_number - 1 into v;
  end if;
  return v;
end;
$$;

-- Allow users to call the allocators for themselves
grant execute on function public.allocate_invoice_number(uuid) to authenticated;
grant execute on function public.allocate_quote_number(uuid)   to authenticated;
grant execute on function public.allocate_receipt_number(uuid) to authenticated;
