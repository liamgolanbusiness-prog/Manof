-- Ensure the shared touch_updated_at() helper exists (baseline 0001 defines
-- it; this re-creates it idempotently so this migration is standalone-safe).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Israeli-compliant invoicing.
--
-- One table covers all four document types a contractor issues:
--   - quote           הצעת מחיר      — pre-sale; can be "accepted" by client.
--   - tax_invoice     חשבונית מס     — legal tax doc; creates receivable.
--   - receipt         קבלה           — receipt for cash received.
--   - tax_receipt     חשבונית מס-קבלה — combined invoice+receipt in one doc.
--
-- Each document gets a running number allocated from the profile's counter
-- (allocate_invoice_number / allocate_quote_number / allocate_receipt_number),
-- prefixed by profile.invoice_prefix for display.
--
-- Per Israeli tax law: issued tax_invoice numbers cannot skip or repeat; the
-- allocator function enforces this at the DB level. We retain issued invoices
-- even if they look wrong — instead, issue a negative-amount correction.

create table if not exists public.invoices (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  project_id        uuid references public.projects(id) on delete set null,
  type              text not null
    check (type in ('quote','tax_invoice','receipt','tax_receipt')),
  doc_number        text not null,      -- formatted e.g. "INV-2026-0042"
  number_int        integer not null,   -- raw running number for sorting
  status            text not null default 'draft'
    check (status in ('draft','issued','accepted','paid','cancelled','expired')),
  client_contact_id uuid references public.contacts(id) on delete set null,
  client_name       text,
  client_tax_id     text,
  client_address    text,
  client_email      text,
  client_phone      text,
  issue_date        date not null default current_date,
  due_date          date,
  valid_until       date,                -- for quotes
  subtotal          numeric(14,2) not null default 0,
  vat_rate          numeric(5,2)  not null default 18.00,
  vat_amount        numeric(14,2) not null default 0,
  discount_amount   numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,
  amount_paid       numeric(14,2) not null default 0,
  payment_method    text,
  payment_reference text,
  notes             text,
  footer            text,
  pdf_url           text,
  accepted_at       timestamptz,
  accepted_by_name  text,
  cancelled_at      timestamptz,
  cancelled_reason  text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index if not exists invoices_user_id_idx       on public.invoices (user_id);
create index if not exists invoices_project_id_idx    on public.invoices (project_id);
create index if not exists invoices_type_number_idx   on public.invoices (user_id, type, number_int);
create index if not exists invoices_issue_date_idx    on public.invoices (issue_date desc);
-- Running-number uniqueness per user+type. Critical for legal compliance.
create unique index if not exists invoices_user_type_number_uq
  on public.invoices (user_id, type, number_int);

create table if not exists public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  sort_order   integer not null default 0,
  description  text not null,
  quantity     numeric(14,3) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  unit         text,                    -- שעה / יחידה / מ״ר / מ״ר
  line_total   numeric(14,2) not null default 0,
  created_at   timestamptz default now()
);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at
  before update on public.invoices
  for each row execute function public.touch_updated_at();

alter table public.invoices      enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists invoices_self_all on public.invoices;
create policy invoices_self_all on public.invoices
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists invoice_items_owner_all on public.invoice_items;
create policy invoice_items_owner_all on public.invoice_items
  for all using (
    exists (select 1 from public.invoices i
            where i.id = invoice_items.invoice_id and i.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.invoices i
            where i.id = invoice_items.invoice_id and i.user_id = auth.uid())
  );
