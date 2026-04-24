"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

async function assertProjectAccess(projectId: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("not-found");
  return { user, supabase };
}

function parseAmount(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[,\s₪]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createExpense(input: {
  projectId: string;
  amount: string | number;
  category: string;
  supplier_contact_id: string | null;
  receipt_photo_url: string | null;
  paid_by: string | null;
  payment_method: string | null;
  expense_date: string;
  notes: string | null;
}) {
  const { user, supabase } = await assertProjectAccess(input.projectId);
  const amount = parseAmount(input.amount);
  if (amount == null || amount <= 0) throw new Error("סכום לא תקין");
  if (!input.category) throw new Error("קטגוריה חובה");

  const { error } = await supabase.from("expenses").insert({
    project_id: input.projectId,
    user_id: user.id,
    amount,
    category: input.category,
    supplier_contact_id: input.supplier_contact_id,
    receipt_photo_url: input.receipt_photo_url,
    paid_by: input.paid_by,
    payment_method: input.payment_method,
    expense_date: input.expense_date,
    notes: input.notes,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${input.projectId}/money`);
}

export async function deleteExpense(projectId: string, id: string) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/money`);
}

export async function createPayment(input: {
  projectId: string;
  direction: "in" | "out";
  amount: string | number;
  counterparty_contact_id: string | null;
  method: string | null;
  payment_date: string;
  invoice_number: string | null;
  notes: string | null;
}) {
  const { user, supabase } = await assertProjectAccess(input.projectId);
  const amount = parseAmount(input.amount);
  if (amount == null || amount <= 0) throw new Error("סכום לא תקין");

  const { error } = await supabase.from("payments").insert({
    project_id: input.projectId,
    user_id: user.id,
    direction: input.direction,
    amount,
    counterparty_contact_id: input.counterparty_contact_id,
    method: input.method,
    payment_date: input.payment_date,
    invoice_number: input.invoice_number,
    notes: input.notes,
  });
  if (error) throw new Error(error.message);

  if (input.direction === "in") {
    const { fireWebhook } = await import("@/lib/webhooks");
    fireWebhook(user.id, "payment.received", {
      project_id: input.projectId,
      amount,
      method: input.method,
      payment_date: input.payment_date,
      invoice_number: input.invoice_number,
    }).catch(() => {});
  }
  revalidatePath(`/app/projects/${input.projectId}/money`);
}

export async function deletePayment(projectId: string, id: string) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/money`);
}

export async function markExpensePaid(
  projectId: string,
  expenseId: string,
  paid: boolean
) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("expenses")
    .update({ paid_at: paid ? new Date().toISOString() : null })
    .eq("id", expenseId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/money`);
}

export async function settleWorker(input: {
  projectId: string;
  contactId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  notes?: string | null;
}) {
  const { user, supabase } = await assertProjectAccess(input.projectId);
  if (!(input.amount > 0)) throw new Error("סכום לא תקין");
  const { error } = await supabase.from("worker_payments").insert({
    project_id: input.projectId,
    user_id: user.id,
    contact_id: input.contactId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    amount: input.amount,
    notes: input.notes ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${input.projectId}/money`);
}

export async function deleteWorkerPayment(projectId: string, id: string) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("worker_payments")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/money`);
}
