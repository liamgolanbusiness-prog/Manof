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

export async function createTask(input: {
  projectId: string;
  title: string;
  assignee_contact_id: string | null;
  due_date: string | null;
  description: string | null;
}) {
  const { user, supabase } = await assertProjectAccess(input.projectId);
  const title = input.title.trim();
  if (!title) throw new Error("כותרת חובה");
  const { error } = await supabase.from("tasks").insert({
    project_id: input.projectId,
    user_id: user.id,
    title,
    assignee_contact_id: input.assignee_contact_id,
    due_date: input.due_date,
    description: input.description,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${input.projectId}/tasks`);
}

export async function toggleTask(projectId: string, taskId: string, done: boolean) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("tasks")
    .update({
      status: done ? "done" : "open",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/tasks`);
}

export async function deleteTask(projectId: string, taskId: string) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/tasks`);
}
