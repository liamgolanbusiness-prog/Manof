"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type SettingsFormState = { error?: string; ok?: boolean } | null;

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

function parseInt32(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

export async function updateProject(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireUser();
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "חסר מזהה" };

  const client_id = String(formData.get("client_id") ?? "").trim() || null;
  let client_name: string | null = null;
  let client_phone: string | null = null;
  if (client_id) {
    const { data: cli } = await supabase
      .from("clients")
      .select("name, phone")
      .eq("id", client_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!cli) return { error: "הלקוח הנבחר לא נמצא" };
    client_name = cli.name;
    client_phone = cli.phone;
  }

  const update = {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || null,
    client_id,
    client_name,
    client_phone,
    contract_value: parseAmount(formData.get("contract_value")),
    start_date: parseDate(formData.get("start_date")),
    target_end_date: parseDate(formData.get("target_end_date")),
    status: String(formData.get("status") ?? "active").trim(),
    progress_pct: parseInt32(formData.get("progress_pct")),
    updated_at: new Date().toISOString(),
  };
  if (!update.name) return { error: "שם חובה" };

  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${id}`);
  revalidatePath(`/app/projects/${id}/settings`);
  return { ok: true };
}

export async function deleteProject(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/projects");
  redirect("/app/projects");
}
