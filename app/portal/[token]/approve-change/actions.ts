"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

async function assertPortalAccess(token: string) {
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, portal_revoked_at, portal_expires_at")
    .eq("portal_token", token)
    .maybeSingle();
  if (!project) return null;
  if (project.portal_revoked_at) return null;
  if (
    project.portal_expires_at &&
    new Date(project.portal_expires_at).getTime() < Date.now()
  ) {
    return null;
  }
  return { supabase, project };
}

export async function approveChangeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const changeId = String(formData.get("change_id") ?? "");
  const typedName = String(formData.get("typed_name") ?? "").trim();
  if (!token || !changeId || !typedName) redirect(`/portal/${token}`);

  const ip = clientIpFromHeaders(headers());
  const rl = checkRateLimit(`change_approve:${ip}`, 10, 60_000);
  if (!rl.ok) redirect(`/portal/${token}`);

  const ctx = await assertPortalAccess(token);
  if (!ctx) redirect(`/portal/${token}`);

  const { data: ch } = await ctx.supabase
    .from("change_orders")
    .select("id, status, project_id")
    .eq("id", changeId)
    .maybeSingle();
  if (!ch || ch.project_id !== ctx.project.id || ch.status !== "pending") {
    redirect(`/portal/${token}`);
  }

  await ctx.supabase
    .from("change_orders")
    .update({
      status: "approved",
      signed_by_name: typedName.slice(0, 120),
      signed_at: new Date().toISOString(),
    })
    .eq("id", changeId);

  redirect(`/portal/${token}?change_approved=${changeId}`);
}

export async function rejectChangeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const changeId = String(formData.get("change_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const ctx = await assertPortalAccess(token);
  if (!ctx) redirect(`/portal/${token}`);

  await ctx.supabase
    .from("change_orders")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_reason: reason.slice(0, 500) || null,
    })
    .eq("id", changeId)
    .eq("project_id", ctx.project.id)
    .eq("status", "pending");

  redirect(`/portal/${token}`);
}
