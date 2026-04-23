"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { hashPortalPin } from "@/lib/portal-pin";

async function assertOwnership(projectId: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !project) throw new Error("פרויקט לא נמצא");
  return { user, supabase };
}

export async function regenerateToken(projectId: string) {
  const { supabase } = await assertOwnership(projectId);
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("projects")
    .update({
      portal_token: token,
      portal_revoked_at: null,
      portal_view_count: 0,
      portal_last_viewed_at: null,
    })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/client`);
  return { token };
}

export async function revokePortal(projectId: string) {
  const { supabase } = await assertOwnership(projectId);
  const { error } = await supabase
    .from("projects")
    .update({ portal_revoked_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/client`);
}

export async function reactivatePortal(projectId: string) {
  const { supabase } = await assertOwnership(projectId);
  const { error } = await supabase
    .from("projects")
    .update({ portal_revoked_at: null })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/client`);
}

export async function setPortalExpiry(projectId: string, days: number | null) {
  const { supabase } = await assertOwnership(projectId);
  const portal_expires_at =
    days == null ? null : new Date(Date.now() + days * 86400_000).toISOString();
  const { error } = await supabase
    .from("projects")
    .update({ portal_expires_at })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/client`);
}

export async function setPortalPin(projectId: string, pin: string | null) {
  const { supabase } = await assertOwnership(projectId);
  let portal_pin_hash: string | null = null;
  if (pin !== null) {
    if (!/^\d{4}$/.test(pin)) throw new Error("הקוד חייב להיות 4 ספרות");
    portal_pin_hash = hashPortalPin(projectId, pin);
  }
  const { error } = await supabase
    .from("projects")
    .update({ portal_pin_hash })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/client`);
}
