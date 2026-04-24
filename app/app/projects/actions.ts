"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

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

  // Plan gate — free tier limited to 1 active project.
  const { checkProjectLimit } = await import("@/lib/plan-gate");
  const gate = await checkProjectLimit(user.id);
  if (!gate.allowed) {
    return {
      error: `הגעת לתקרה (${gate.limit} פרויקטים פעילים). שדרג למקצועי לפרויקטים ללא הגבלה: /app/billing`,
    };
  }

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

  const insert = {
    user_id: user.id,
    name,
    address: String(formData.get("address") ?? "").trim() || null,
    client_id,
    client_name,
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

  // Creating a project counts as onboarding complete — otherwise a user who
  // lands on /app/projects/new directly (before the welcome step) would keep
  // getting redirected back to the welcome page from the dashboard.
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("onboarding_completed_at", null);

  revalidatePath("/app/projects");
  redirect(`/app/projects/${data.id}/today`);
}

// Clone a template project: copy the row as a draft, copy project_members,
// and copy non-completed tasks. Daily reports + expenses + photos + invoices
// are intentionally NOT copied — those are per-project history.
export async function cloneProjectAction(
  sourceId: string,
  newName: string
): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  const supabase = createClient();
  if (!newName.trim()) return { error: "שם חובה" };

  const { data: source } = await supabase
    .from("projects")
    .select("*")
    .eq("id", sourceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!source) return { error: "תבנית לא נמצאה" };

  const { data: created, error: insErr } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: newName.trim(),
      address: source.address,
      client_name: null, // fresh client on new project
      client_phone: null,
      contract_value: source.contract_value,
      start_date: null,
      target_end_date: null,
      status: "active",
      progress_pct: 0,
      cover_photo_url: source.cover_photo_url,
    })
    .select("id")
    .single();
  if (insErr || !created) return { error: insErr?.message ?? "שגיאה" };

  const { data: members } = await supabase
    .from("project_members")
    .select("contact_id, role_in_project, agreed_amount")
    .eq("project_id", sourceId);
  if (members && members.length > 0) {
    await supabase.from("project_members").insert(
      members.map((m) => ({
        project_id: created.id,
        contact_id: m.contact_id,
        role_in_project: m.role_in_project,
        agreed_amount: m.agreed_amount,
      }))
    );
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, description, assignee_contact_id")
    .eq("project_id", sourceId)
    .neq("status", "done");
  if (tasks && tasks.length > 0) {
    await supabase.from("tasks").insert(
      tasks.map((t) => ({
        user_id: user.id,
        project_id: created.id,
        title: t.title,
        description: t.description,
        assignee_contact_id: t.assignee_contact_id,
      }))
    );
  }

  revalidatePath("/app/projects");
  return { id: created.id };
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
