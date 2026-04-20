"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { normalizeIsraeliPhone } from "@/lib/phone";

export type ContactFormState = { error?: string; ok?: boolean; id?: string } | null;

function parseAmount(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[,\s₪]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function upsertContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const user = await requireUser();
  const supabase = createClient();
  const id = (formData.get("id") || "").toString() || null;
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "worker").trim();
  const phoneInput = String(formData.get("phone") ?? "").trim();
  let phone: string | null = null;
  if (phoneInput) {
    phone = normalizeIsraeliPhone(phoneInput);
    if (!phone) return { error: "מספר טלפון לא תקין (נדרש מספר ישראלי)" };
  }
  const trade = String(formData.get("trade") ?? "").trim() || null;
  const pay_rate = parseAmount(formData.get("pay_rate"));
  const pay_type = String(formData.get("pay_type") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "שם חובה" };
  if (!role) return { error: "תפקיד חובה" };

  if (id) {
    const { error } = await supabase
      .from("contacts")
      .update({ name, role, phone, trade, pay_rate, pay_type, notes })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/app/contacts");
    return { ok: true, id };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name,
      role,
      phone,
      trade,
      pay_rate,
      pay_type,
      notes,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/app/contacts");
  return { ok: true, id: data.id };
}

export async function deleteContact(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/contacts");
}

/** Add a contact to a project as a member. */
export async function addProjectMember(
  projectId: string,
  contactId: string,
  roleInProject: string | null
) {
  const user = await requireUser();
  const supabase = createClient();

  // Verify project ownership
  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!proj) throw new Error("not-found");

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    contact_id: contactId,
    role_in_project: roleInProject,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/people`);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const user = await requireUser();
  const supabase = createClient();
  // Verify project ownership
  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!proj) throw new Error("not-found");

  const { error } = await supabase.from("project_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/people`);
  revalidatePath(`/app/projects/${projectId}/today`);
}
