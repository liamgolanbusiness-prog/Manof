"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

async function guard(projectId: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("פרויקט לא נמצא");
  return { user, supabase };
}

export async function createChangeOrder(input: {
  project_id: string;
  title: string;
  description?: string;
  amount_change: number;
}) {
  const { user, supabase } = await guard(input.project_id);
  if (!input.title.trim()) throw new Error("כותרת חובה");
  const { error } = await supabase.from("change_orders").insert({
    project_id: input.project_id,
    user_id: user.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    amount_change: Number(input.amount_change) || 0,
    status: "pending",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${input.project_id}/changes`);
  revalidatePath(`/app/projects/${input.project_id}/money`);
}

export async function deleteChangeOrder(projectId: string, id: string) {
  const { user, supabase } = await guard(projectId);
  const { error } = await supabase
    .from("change_orders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/changes`);
  revalidatePath(`/app/projects/${projectId}/money`);
}

export async function cancelChangeOrder(projectId: string, id: string) {
  const { user, supabase } = await guard(projectId);
  const { error } = await supabase
    .from("change_orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/changes`);
}
