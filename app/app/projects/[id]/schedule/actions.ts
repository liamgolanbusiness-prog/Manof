"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

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

function parseDate(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return s || null;
}

export async function createMilestone(
  projectId: string,
  name: string,
  plannedDate: string | null
) {
  const { supabase } = await assertProjectAccess(projectId);
  if (!name.trim()) throw new Error("name required");
  // Place new milestone at the end.
  const { data: maxRow } = await supabase
    .from("project_milestones")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (maxRow?.position ?? -1) + 1;
  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId,
    name: name.trim(),
    planned_date: plannedDate,
    position: nextPos,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/schedule`);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function updateMilestone(
  projectId: string,
  id: string,
  fields: { name?: string; planned_date?: string | null; actual_date?: string | null; done?: boolean }
) {
  const { supabase } = await assertProjectAccess(projectId);
  const update: Database["public"]["Tables"]["project_milestones"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (fields.name !== undefined) update.name = fields.name.trim();
  if (fields.planned_date !== undefined) update.planned_date = fields.planned_date;
  if (fields.actual_date !== undefined) update.actual_date = fields.actual_date;
  if (fields.done !== undefined) {
    update.done = fields.done;
    // Auto-stamp actual_date when marking done if not already set.
    if (fields.done && fields.actual_date === undefined) {
      update.actual_date = new Date().toISOString().slice(0, 10);
    }
  }
  const { error } = await supabase
    .from("project_milestones")
    .update(update)
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/schedule`);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function deleteMilestone(projectId: string, id: string) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/schedule`);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function createMilestoneFormAction(projectId: string, formData: FormData) {
  await createMilestone(
    projectId,
    String(formData.get("name") ?? ""),
    parseDate(formData.get("planned_date"))
  );
}
