"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

async function assertOwner(projectId: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, user_id, name")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("פרויקט לא נמצא (רק הבעלים יכול לנהל צוות)");
  return { user, supabase, project: data };
}

export async function inviteCollaborator(input: {
  project_id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}) {
  const { user, supabase, project } = await assertOwner(input.project_id);
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("אימייל לא תקין");
  }
  if (email === (user.email ?? "").toLowerCase()) {
    throw new Error("אתה כבר הבעלים של הפרויקט");
  }

  // Does this email already have an account?
  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((u) => (u.email ?? "").toLowerCase() === email);

  const row = {
    project_id: input.project_id,
    user_id: existing?.id ?? null,
    invited_email: existing ? null : email,
    role: input.role,
    invited_by: user.id,
    invited_at: new Date().toISOString(),
    accepted_at: existing ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("project_collaborators").insert(row);
  if (error) {
    if (error.code === "23505") throw new Error("המשתמש כבר בפרויקט");
    throw new Error(error.message);
  }

  // Fire-and-forget email invite (only if Resend configured).
  try {
    const { sendEmail, isEmailConfigured } = await import("@/lib/email");
    if (isEmailConfigured()) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const link = existing
        ? `${appUrl}/app/projects/${input.project_id}/today`
        : `${appUrl}/signup?invite=${encodeURIComponent(email)}&project=${encodeURIComponent(project.name)}`;
      sendEmail({
        to: email,
        subject: `הזמנה להצטרף לפרויקט ${project.name} באתר`,
        html: `<div style="direction:rtl;font-family:system-ui,-apple-system;padding:16px">
          <h2>הוזמנת להצטרף לפרויקט ${project.name}</h2>
          <p>${user.email} הוסיף אותך כ"${{ admin: "מנהל", editor: "עורך", viewer: "צופה" }[input.role]}" בפרויקט.</p>
          <p><a href="${link}" style="display:inline-block;background:#2463eb;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none">כניסה לפרויקט</a></p>
        </div>`,
      }).catch(() => {});
    }
  } catch {
    /* best-effort */
  }

  revalidatePath(`/app/projects/${input.project_id}/settings`);
  return { ok: true, isPending: !existing };
}

export async function updateCollaboratorRole(
  projectId: string,
  collaboratorId: string,
  role: "admin" | "editor" | "viewer"
) {
  const { supabase } = await assertOwner(projectId);
  const { error } = await supabase
    .from("project_collaborators")
    .update({ role })
    .eq("id", collaboratorId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/settings`);
}

export async function removeCollaborator(projectId: string, collaboratorId: string) {
  const { supabase } = await assertOwner(projectId);
  const { error } = await supabase
    .from("project_collaborators")
    .delete()
    .eq("id", collaboratorId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/settings`);
}
