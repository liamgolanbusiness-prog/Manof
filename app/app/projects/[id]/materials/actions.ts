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

export async function createMaterial(input: {
  project_id: string;
  name: string;
  quantity: number;
  unit?: string;
  cost_per_unit?: number;
  supplier_contact_id?: string;
  status?: "ordered" | "delivered" | "installed" | "returned";
  delivery_date?: string;
  notes?: string;
}) {
  const { user, supabase } = await guard(input.project_id);
  if (!input.name.trim()) throw new Error("שם החומר חובה");
  const qty = Number(input.quantity) || 0;
  const cpu = Number(input.cost_per_unit) || 0;
  const total = cpu > 0 ? Math.round(qty * cpu * 100) / 100 : null;
  const { error } = await supabase.from("materials").insert({
    project_id: input.project_id,
    user_id: user.id,
    name: input.name.trim(),
    quantity: qty,
    unit: input.unit?.trim() || null,
    cost_per_unit: cpu > 0 ? cpu : null,
    total_cost: total,
    supplier_contact_id: input.supplier_contact_id || null,
    status: input.status ?? "ordered",
    delivery_date: input.delivery_date || null,
    notes: input.notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${input.project_id}/materials`);
}

export async function setMaterialStatus(
  projectId: string,
  id: string,
  status: "ordered" | "delivered" | "installed" | "returned"
) {
  const { user, supabase } = await guard(projectId);
  const { error } = await supabase
    .from("materials")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/materials`);
}

export async function deleteMaterial(projectId: string, id: string) {
  const { user, supabase } = await guard(projectId);
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/materials`);
}
