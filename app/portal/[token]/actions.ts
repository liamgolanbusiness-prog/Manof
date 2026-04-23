"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPortalPin } from "@/lib/portal-pin";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

export async function submitPinAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (!token || !projectId || !pin) redirect(`/portal/${token}?pin_error=1`);

  const ip = clientIpFromHeaders(headers());
  // Rate limit PIN attempts to thwart brute-force: 10/min per IP+project.
  const rl = checkRateLimit(`portal_pin:${projectId}:${ip}`, 10, 60_000);
  if (!rl.ok) redirect(`/portal/${token}?pin_error=1`);

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, portal_pin_hash, portal_revoked_at, portal_expires_at")
    .eq("id", projectId)
    .eq("portal_token", token)
    .maybeSingle();

  if (!project || !project.portal_pin_hash) redirect(`/portal/${token}?pin_error=1`);
  if (project.portal_revoked_at) redirect(`/portal/${token}`);
  if (
    project.portal_expires_at &&
    new Date(project.portal_expires_at).getTime() < Date.now()
  ) {
    redirect(`/portal/${token}`);
  }

  if (!verifyPortalPin(projectId, pin, project.portal_pin_hash)) {
    redirect(`/portal/${token}?pin_error=1`);
  }

  // PIN correct — set a cookie scoped to this project so subsequent visits
  // skip the gate. Cookie stores the hash (not the PIN), so invalidation is
  // just rotating the hash via setPortalPin.
  cookies().set(`portal_pin_${projectId}`, project.portal_pin_hash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: `/portal/${token}`,
  });

  redirect(`/portal/${token}`);
}
