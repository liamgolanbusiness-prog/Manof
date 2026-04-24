"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { normalizeIsraeliPhone } from "@/lib/phone";

export type ClientFormState = { error?: string; ok?: boolean; id?: string } | null;

export async function upsertClient(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await requireUser();
  const supabase = createClient();

  const id = (formData.get("id") || "").toString() || null;
  const name = String(formData.get("name") ?? "").trim();
  const phoneInput = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const tax_id = String(formData.get("tax_id") ?? "").trim() || null;
  const billing_address = String(formData.get("billing_address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "שם חובה" };

  let phone: string | null = null;
  if (phoneInput) {
    phone = normalizeIsraeliPhone(phoneInput);
    if (!phone) return { error: "מספר טלפון לא תקין (נדרש מספר ישראלי)" };
  }

  if (id) {
    const { error } = await supabase
      .from("clients")
      .update({ name, phone, email, tax_id, billing_address, notes })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    // Mirror into projects.client_name / client_phone so legacy readers
    // (invoices, portal, WhatsApp) stay in sync.
    await supabase
      .from("projects")
      .update({ client_name: name, client_phone: phone })
      .eq("client_id", id)
      .eq("user_id", user.id);
    revalidatePath("/app/clients");
    revalidatePath(`/app/clients/${id}`);
    return { ok: true, id };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ user_id: user.id, name, phone, email, tax_id, billing_address, notes })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/app/clients");
  return { ok: true, id: data.id };
}

export async function deleteClient(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/clients");
}
