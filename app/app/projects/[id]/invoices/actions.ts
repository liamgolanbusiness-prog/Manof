"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatInvoiceNumber, computeTotals, lineTotal } from "@/lib/invoice";
import type { InvoiceType } from "@/lib/supabase/database.types";

async function assertProjectAccess(projectId: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) throw new Error("פרויקט לא נמצא");
  return { user, supabase };
}

type ItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string;
};

export async function createInvoiceAction(input: {
  project_id: string;
  type: InvoiceType;
  client_name: string;
  client_tax_id?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  issue_date: string;
  due_date?: string;
  valid_until?: string;
  vat_rate: number;
  vat_included: boolean;
  discount_amount?: number;
  notes?: string;
  footer?: string;
  payment_method?: string;
  payment_reference?: string;
  items: ItemInput[];
  status?: "draft" | "issued";
}) {
  const { user, supabase } = await assertProjectAccess(input.project_id);

  // Plan gate — free tier limited to 3 invoices per month.
  const { checkInvoiceLimit } = await import("@/lib/plan-gate");
  const gate = await checkInvoiceLimit(user.id);
  if (!gate.allowed) {
    throw new Error(
      `הגעת לתקרת חשבוניות (${gate.limit} בחודש). שדרג למקצועי לחשבוניות ללא הגבלה.`
    );
  }

  const cleanItems = (input.items || [])
    .map((it) => ({
      description: (it.description || "").trim(),
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      unit: it.unit?.trim() || undefined,
    }))
    .filter((it) => it.description && it.quantity > 0);

  if (cleanItems.length === 0) throw new Error("נדרשת לפחות שורת פריט אחת");
  if (!input.client_name.trim()) throw new Error("שם לקוח חובה");

  const totals = computeTotals(
    cleanItems,
    input.vat_rate,
    input.vat_included,
    input.discount_amount
  );

  // Allocate running number via SQL function (atomic across concurrent calls).
  const rpcName: Record<InvoiceType, string> = {
    quote: "allocate_quote_number",
    tax_invoice: "allocate_invoice_number",
    receipt: "allocate_receipt_number",
    tax_receipt: "allocate_invoice_number",
  };
  // Our database.types don't declare these RPCs yet; cast via unknown to
  // keep eslint + typescript both happy.
  const rpcSupabase = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: number | null; error: { message: string } | null }>;
  };
  const { data: numInt, error: rpcErr } = await rpcSupabase.rpc(rpcName[input.type], {
    p_user_id: user.id,
  });
  if (rpcErr) throw new Error(`שגיאת מספור: ${rpcErr.message}`);
  const numberInt = Number(numInt);

  // Look up the profile prefix for display formatting.
  const { data: profile } = await supabase
    .from("profiles")
    .select("invoice_prefix, business_name, tax_id, city, address, email, phone, invoice_footer")
    .eq("id", user.id)
    .maybeSingle();
  const year = new Date(input.issue_date).getFullYear();
  const doc_number = formatInvoiceNumber(
    input.type,
    numberInt,
    profile?.invoice_prefix,
    year
  );

  const { data: invoice, error: insErr } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      project_id: input.project_id,
      type: input.type,
      doc_number,
      number_int: numberInt,
      status: input.status ?? "draft",
      client_name: input.client_name.trim(),
      client_tax_id: input.client_tax_id?.trim() || null,
      client_address: input.client_address?.trim() || null,
      client_email: input.client_email?.trim() || null,
      client_phone: input.client_phone?.trim() || null,
      issue_date: input.issue_date,
      due_date: input.due_date || null,
      valid_until: input.valid_until || null,
      subtotal: totals.subtotal,
      vat_rate: input.vat_rate,
      vat_amount: totals.vat_amount,
      discount_amount: input.discount_amount ?? 0,
      total: totals.total,
      payment_method: input.payment_method || null,
      payment_reference: input.payment_reference || null,
      notes: input.notes?.trim() || null,
      footer: input.footer?.trim() || profile?.invoice_footer || null,
    })
    .select("id")
    .single();
  if (insErr || !invoice) throw new Error(insErr?.message ?? "שגיאה ביצירת חשבונית");

  const itemsToInsert = cleanItems.map((it, idx) => ({
    invoice_id: invoice.id,
    sort_order: idx,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    unit: it.unit ?? null,
    line_total: lineTotal(it.quantity, it.unit_price),
  }));
  const { error: itemsErr } = await supabase.from("invoice_items").insert(itemsToInsert);
  if (itemsErr) {
    // Roll back the invoice to avoid a headerless doc.
    await supabase.from("invoices").delete().eq("id", invoice.id);
    throw new Error(`שגיאה בפריטים: ${itemsErr.message}`);
  }

  revalidatePath(`/app/projects/${input.project_id}/invoices`);
  return { id: invoice.id, doc_number };
}

export async function setInvoiceStatus(
  projectId: string,
  invoiceId: string,
  status: "draft" | "issued" | "paid" | "cancelled" | "accepted"
) {
  const { user, supabase } = await assertProjectAccess(projectId);
  const patch: {
    status: typeof status;
    cancelled_at?: string;
  } = { status };
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
  const { error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", invoiceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  // Fire webhooks (non-blocking).
  try {
    const { fireWebhook } = await import("@/lib/webhooks");
    const event =
      status === "issued"
        ? "invoice.issued"
        : status === "paid"
          ? "invoice.paid"
          : status === "cancelled"
            ? "invoice.cancelled"
            : null;
    if (event) {
      fireWebhook(user.id, event, { invoice_id: invoiceId, project_id: projectId }).catch(() => {});
    }
  } catch {
    /* swallow */
  }

  revalidatePath(`/app/projects/${projectId}/invoices`);
}

export async function emailInvoiceToClient(
  projectId: string,
  invoiceId: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertProjectAccess(projectId);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, type, doc_number, client_email, total, project_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return { ok: false, error: "חשבונית לא נמצאה" };
  if (!invoice.client_email) return { ok: false, error: "אין אימייל ללקוח בחשבונית הזו" };

  // Look up portal link for the project.
  const { data: project } = await supabase
    .from("projects")
    .select("portal_token, name")
    .eq("id", projectId)
    .maybeSingle();

  const { sendEmail, invoiceReadyEmail, isEmailConfigured } = await import(
    "@/lib/email"
  );
  if (!isEmailConfigured()) {
    return { ok: false, error: "שליחת מייל לא מוגדרת בשרת" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const printUrl = `${appUrl}/invoices/${invoiceId}/print`;
  const portalUrl = project?.portal_token
    ? `${appUrl}/portal/${project.portal_token}`
    : printUrl;
  const amountStr = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  }).format(Number(invoice.total));

  const res = await sendEmail({
    to: invoice.client_email,
    subject: `חשבונית ${invoice.doc_number} מהפרויקט ${project?.name ?? ""}`,
    html: invoiceReadyEmail(invoice.doc_number, portalUrl, amountStr),
  });
  if (!res.ok) return { ok: false, error: res.error ?? "שגיאה בשליחה" };

  revalidatePath(`/app/projects/${projectId}/invoices`);
  return { ok: true };
}

export async function deleteInvoice(projectId: string, invoiceId: string) {
  const { user, supabase } = await assertProjectAccess(projectId);
  // Only drafts can be fully deleted — issued tax_invoices must stay for audit.
  const { data: row } = await supabase
    .from("invoices")
    .select("status, type")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) throw new Error("לא נמצא");
  if (row.status !== "draft" && row.type !== "quote") {
    throw new Error("לא ניתן למחוק חשבונית שהונפקה. בטל אותה במקום.");
  }
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/invoices`);
}
