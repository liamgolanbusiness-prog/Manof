import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, string | number | null | undefined>;

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Row[], headers: { key: string; label: string }[]) {
  const lines: string[] = [];
  lines.push(headers.map((h) => csvEscape(h.label)).join(","));
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h.key])).join(","));
  }
  // UTF-8 BOM so Excel recognizes Hebrew correctly
  return "\ufeff" + lines.join("\r\n");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") ?? "expenses"; // expenses | payments

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return new NextResponse("not found", { status: 404 });

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name")
    .eq("user_id", user.id);
  const names: Record<string, string> = Object.fromEntries(
    (contacts ?? []).map((c) => [c.id, c.name])
  );

  let csv: string;
  let filename: string;

  if (kind === "payments") {
    const { data: payments } = await supabase
      .from("payments")
      .select(
        "direction, amount, counterparty_contact_id, payment_date, method, invoice_number, notes"
      )
      .eq("project_id", params.id)
      .order("payment_date", { ascending: false });

    const rows: Row[] = (payments ?? []).map((p) => ({
      direction: p.direction === "in" ? "התקבל" : "שולם",
      amount: Number(p.amount),
      counterparty: p.counterparty_contact_id
        ? names[p.counterparty_contact_id] ?? ""
        : "",
      payment_date: p.payment_date,
      method: p.method ?? "",
      invoice_number: p.invoice_number ?? "",
      notes: p.notes ?? "",
    }));

    csv = toCsv(rows, [
      { key: "payment_date", label: "תאריך" },
      { key: "direction", label: "כיוון" },
      { key: "amount", label: "סכום" },
      { key: "counterparty", label: "צד שני" },
      { key: "method", label: "שיטה" },
      { key: "invoice_number", label: "חשבונית" },
      { key: "notes", label: "הערות" },
    ]);
    filename = `payments-${slugify(project.name)}-${isoStamp()}.csv`;
  } else {
    const { data: expenses } = await supabase
      .from("expenses")
      .select(
        "amount, category, supplier_contact_id, expense_date, payment_method, notes, receipt_photo_url"
      )
      .eq("project_id", params.id)
      .order("expense_date", { ascending: false });

    const rows: Row[] = (expenses ?? []).map((e) => ({
      expense_date: e.expense_date,
      amount: Number(e.amount),
      category: e.category,
      supplier: e.supplier_contact_id ? names[e.supplier_contact_id] ?? "" : "",
      payment_method: e.payment_method ?? "",
      notes: e.notes ?? "",
      receipt: e.receipt_photo_url ?? "",
    }));

    csv = toCsv(rows, [
      { key: "expense_date", label: "תאריך" },
      { key: "amount", label: "סכום" },
      { key: "category", label: "קטגוריה" },
      { key: "supplier", label: "ספק" },
      { key: "payment_method", label: "שיטת תשלום" },
      { key: "notes", label: "הערות" },
      { key: "receipt", label: "קבלה" },
    ]);
    filename = `expenses-${slugify(project.name)}-${isoStamp()}.csv`;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function slugify(s: string) {
  return s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "export";
}

function isoStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
