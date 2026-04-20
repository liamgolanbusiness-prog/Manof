"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { normalizeIsraeliPhone } from "@/lib/phone";

export type ProjectFormState = { error?: string } | null;

function parseAmount(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[,\s₪]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return s || null;
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await requireUser();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "שם הפרויקט חובה" };

  const phoneInput = String(formData.get("client_phone") ?? "").trim();
  let client_phone: string | null = null;
  if (phoneInput) {
    client_phone = normalizeIsraeliPhone(phoneInput);
    if (!client_phone) return { error: "טלפון הלקוח לא תקין (נדרש מספר ישראלי)" };
  }

  const insert = {
    user_id: user.id,
    name,
    address: String(formData.get("address") ?? "").trim() || null,
    client_name: String(formData.get("client_name") ?? "").trim() || null,
    client_phone,
    contract_value: parseAmount(formData.get("contract_value")),
    start_date: parseDate(formData.get("start_date")),
    target_end_date: parseDate(formData.get("target_end_date")),
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    return { error: `לא הצלחנו לשמור: ${error.message}` };
  }

  revalidatePath("/app/projects");
  redirect(`/app/projects/${data.id}/today`);
}

export async function updateProjectStatus(projectId: string, status: string) {
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
}
