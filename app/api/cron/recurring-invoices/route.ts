import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeTotals, formatInvoiceNumber, lineTotal } from "@/lib/invoice";
import type { InvoiceType } from "@/lib/supabase/database.types";
import { isoDate } from "@/lib/format";

// Daily cron — scans active recurring_invoice_templates with
// next_issue_date <= today and issues the next real invoice.
// Safe to re-run: advances next_issue_date after each issue so the same
// template doesn't double-issue.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = isoDate();
  const { data: due } = await supabase
    .from("recurring_invoice_templates")
    .select("*")
    .eq("active", true)
    .lte("next_issue_date", today);

  let issued = 0;
  for (const tpl of due ?? []) {
    try {
      await issueFromTemplate(supabase, tpl);
      issued++;
    } catch (e) {
      console.error("recurring-invoice error", tpl.id, e);
    }
  }
  return NextResponse.json({ ok: true, checked: due?.length ?? 0, issued });
}

async function issueFromTemplate(
  supabase: ReturnType<typeof createAdminClient>,
  tpl: {
    id: string;
    user_id: string;
    project_id: string | null;
    type: string;
    frequency: string;
    next_issue_date: string;
    vat_rate: number;
    vat_included: boolean;
    items: unknown;
    client_name: string | null;
    client_tax_id: string | null;
    client_email: string | null;
    client_phone: string | null;
    client_address: string | null;
    notes: string | null;
    footer: string | null;
  }
) {
  const items = Array.isArray(tpl.items) ? tpl.items : [];
  const totals = computeTotals(
    items.map((it: { description: string; quantity: number; unit_price: number }) => ({
      description: it.description,
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
    })),
    Number(tpl.vat_rate) || 18,
    !!tpl.vat_included,
    0
  );

  // Allocate running number via the RPC in migration 0003.
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: number | null; error: { message: string } | null }>;
  };
  const { data: numInt, error: rpcErr } = await rpcClient.rpc("allocate_invoice_number", {
    p_user_id: tpl.user_id,
  });
  if (rpcErr) throw new Error(rpcErr.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("invoice_prefix")
    .eq("id", tpl.user_id)
    .maybeSingle();
  const year = Number(String(tpl.next_issue_date).slice(0, 4));
  const doc_number = formatInvoiceNumber(
    tpl.type as InvoiceType,
    Number(numInt),
    profile?.invoice_prefix,
    year
  );

  const { data: inv, error: insErr } = await supabase
    .from("invoices")
    .insert({
      user_id: tpl.user_id,
      project_id: tpl.project_id,
      type: tpl.type,
      doc_number,
      number_int: Number(numInt),
      status: "issued",
      client_name: tpl.client_name,
      client_tax_id: tpl.client_tax_id,
      client_email: tpl.client_email,
      client_phone: tpl.client_phone,
      client_address: tpl.client_address,
      issue_date: tpl.next_issue_date,
      vat_rate: tpl.vat_rate,
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total: totals.total,
      notes: tpl.notes,
      footer: tpl.footer,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);

  const rows = items.map(
    (it: { description: string; quantity: number; unit_price: number; unit?: string }, idx: number) => ({
      invoice_id: inv.id,
      sort_order: idx,
      description: it.description,
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      unit: it.unit ?? null,
      line_total: lineTotal(Number(it.quantity) || 0, Number(it.unit_price) || 0),
    })
  );
  if (rows.length > 0) await supabase.from("invoice_items").insert(rows);

  // Advance next_issue_date.
  const next = advance(tpl.next_issue_date, tpl.frequency);
  await supabase
    .from("recurring_invoice_templates")
    .update({
      next_issue_date: next,
      last_issued_at: new Date().toISOString(),
    })
    .eq("id", tpl.id);
}

function advance(fromDate: string, freq: string): string {
  const d = new Date(fromDate);
  switch (freq) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      addMonthsClamped(d, 1);
      break;
    case "quarterly":
      addMonthsClamped(d, 3);
      break;
    case "yearly":
      addMonthsClamped(d, 12);
      break;
  }
  return d.toISOString().slice(0, 10);
}

// JS Date's setMonth overflows (Jan 31 + 1 month → Mar 3). Clamp the day to
// the last day of the target month so monthly recurrences land on the 28th
// / 30th / 31st as appropriate instead of skipping into the next month.
function addMonthsClamped(d: Date, months: number): void {
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDayOfTarget = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDayOfTarget));
}
