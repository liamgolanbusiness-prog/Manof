"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type ItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string;
};

const ALLOWED_FREQ = ["weekly", "biweekly", "monthly", "quarterly", "yearly"];
const ALLOWED_TYPES = ["tax_invoice", "tax_receipt"];

export async function createRecurringTemplateAction(input: {
  project_id: string | null;
  type: string;
  frequency: string;
  next_issue_date: string;
  client_name: string;
  client_tax_id?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  vat_rate: number;
  vat_included: boolean;
  notes?: string | null;
  footer?: string | null;
  items: ItemInput[];
}) {
  const user = await requireUser();
  const supabase = createClient();

  if (!ALLOWED_FREQ.includes(input.frequency)) throw new Error("תדירות לא תקינה");
  if (!ALLOWED_TYPES.includes(input.type)) throw new Error("סוג מסמך לא תקין");
  if (!input.client_name.trim()) throw new Error("שם לקוח חובה");
  if (!input.next_issue_date) throw new Error("תאריך הנפקה חובה");

  const items = (input.items ?? [])
    .map((it) => ({
      description: String(it.description ?? "").trim(),
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      unit: it.unit?.trim() || undefined,
    }))
    .filter((it) => it.description && it.quantity > 0);
  if (items.length === 0) throw new Error("נדרש לפחות פריט אחד");

  const { error } = await supabase.from("recurring_invoice_templates").insert({
    user_id: user.id,
    project_id: input.project_id,
    type: input.type,
    frequency: input.frequency,
    next_issue_date: input.next_issue_date,
    client_name: input.client_name.trim(),
    client_tax_id: input.client_tax_id?.trim() || null,
    client_email: input.client_email?.trim() || null,
    client_phone: input.client_phone?.trim() || null,
    client_address: input.client_address?.trim() || null,
    vat_rate: input.vat_rate,
    vat_included: input.vat_included,
    notes: input.notes?.trim() || null,
    footer: input.footer?.trim() || null,
    items,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings/recurring");
}

export async function toggleRecurringTemplateAction(id: string, active: boolean) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_invoice_templates")
    .update({ active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings/recurring");
}

export async function deleteRecurringTemplateAction(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_invoice_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings/recurring");
}
