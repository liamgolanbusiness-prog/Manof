"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isoDate } from "@/lib/format";

export type ReportFormState = { error?: string; ok?: boolean } | null;

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

/** Idempotent: returns a daily_report row for today, creating if needed. */
export async function ensureTodayReport(projectId: string) {
  const { user, supabase } = await assertProjectAccess(projectId);
  const today = isoDate();

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id, weather, notes, locked, report_date, updated_at")
    .eq("project_id", projectId)
    .eq("report_date", today)
    .maybeSingle();

  if (existing) return existing;

  // Fetch weather for the project's address — no-op if no address set.
  const { data: proj } = await supabase
    .from("projects")
    .select("address")
    .eq("id", projectId)
    .maybeSingle();
  let weather: string | null = null;
  try {
    const { fetchWeatherForAddress } = await import("@/lib/weather");
    weather = await fetchWeatherForAddress(proj?.address ?? null);
  } catch {
    weather = null;
  }

  const { data, error } = await supabase
    .from("daily_reports")
    .insert({
      project_id: projectId,
      user_id: user.id,
      report_date: today,
      weather,
    })
    .select("id, weather, notes, locked, report_date, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveReportBasics(
  _prev: ReportFormState,
  formData: FormData
): Promise<ReportFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const reportId = String(formData.get("report_id") ?? "");
  if (!projectId || !reportId) return { error: "נתונים חסרים" };

  const { supabase } = await assertProjectAccess(projectId);

  const weather = String(formData.get("weather") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase
    .from("daily_reports")
    .update({ weather, notes, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("project_id", projectId);

  if (error) return { error: `לא נשמר: ${error.message}` };

  revalidatePath(`/app/projects/${projectId}/today`);
  revalidatePath(`/app/projects/${projectId}/diary`);
  return { ok: true };
}

export async function appendReportNotes(
  projectId: string,
  reportId: string,
  textToAppend: string
) {
  const { supabase } = await assertProjectAccess(projectId);
  const { data: row } = await supabase
    .from("daily_reports")
    .select("notes")
    .eq("id", reportId)
    .eq("project_id", projectId)
    .maybeSingle();
  const existing = row?.notes?.trim() ?? "";
  const joined = existing ? `${existing}\n\n${textToAppend}` : textToAppend;
  const { error } = await supabase
    .from("daily_reports")
    .update({ notes: joined, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function setReportLocked(
  projectId: string,
  reportId: string,
  locked: boolean
) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("daily_reports")
    .update({ locked, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
  revalidatePath(`/app/projects/${projectId}/diary`);
}

// Send the day's summary to the client via WhatsApp Business API.
// Returns { sent: true } on success, { sent: false, fallback_url } when not
// configured so the client can fall back to wa.me deep link in the browser.
export async function sendDailySummaryToClient(
  projectId: string,
  reportId: string
): Promise<{ sent: boolean; fallback_url?: string; error?: string }> {
  const { supabase } = await assertProjectAccess(projectId);

  const [{ data: project }, { data: report }] = await Promise.all([
    supabase
      .from("projects")
      .select("name, client_name, client_phone, portal_token")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("daily_reports")
      .select("report_date, weather, notes")
      .eq("id", reportId)
      .maybeSingle(),
  ]);
  if (!project || !report) return { sent: false, error: "not-found" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const portalUrl = project.portal_token ? `${appUrl}/portal/${project.portal_token}` : "";

  const lines: string[] = [
    `שלום${project.client_name ? ` ${project.client_name}` : ""},`,
    `סיכום יום עבודה בפרויקט "${project.name}" (${report.report_date})`,
    "",
    report.weather ? `מזג אוויר: ${report.weather}` : "",
    report.notes ? `סיכום:\n${report.notes}` : "",
    "",
    portalUrl ? `למעקב חי: ${portalUrl}` : "",
  ].filter(Boolean);
  const body = lines.join("\n");

  const { sendWhatsAppText, isWhatsAppConfigured } = await import(
    "@/lib/channels/whatsapp"
  );
  if (!isWhatsAppConfigured() || !project.client_phone) {
    const text = encodeURIComponent(body);
    const to = (project.client_phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
    const fallback = to
      ? `https://wa.me/${to}?text=${text}`
      : `https://wa.me/?text=${text}`;
    return { sent: false, fallback_url: fallback };
  }
  const res = await sendWhatsAppText(project.client_phone, body);
  return { sent: res.ok, error: res.error };
}

/** Attendance: save rows as (contact_id, hours_worked). Replaces existing. */
export async function saveAttendance(
  projectId: string,
  reportId: string,
  entries: { contact_id: string; hours_worked: number | null }[]
) {
  const { supabase } = await assertProjectAccess(projectId);
  // Delete existing + insert fresh — simpler than diffing.
  const { error: delErr } = await supabase
    .from("attendance")
    .delete()
    .eq("daily_report_id", reportId);
  if (delErr) throw new Error(delErr.message);

  const rows = entries
    .filter((e) => e.contact_id && (e.hours_worked ?? 0) > 0)
    .map((e) => ({
      daily_report_id: reportId,
      contact_id: e.contact_id,
      hours_worked: e.hours_worked,
    }));

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("attendance").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function addReportPhoto(
  projectId: string,
  reportId: string,
  url: string,
  caption: string | null
) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase.from("report_photos").insert({
    daily_report_id: reportId,
    url,
    caption,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function removeReportPhoto(projectId: string, photoId: string) {
  await assertProjectAccess(projectId);
  const supabase = createClient();
  // Best-effort: delete from DB. Storage object cleanup can happen later.
  const { error } = await supabase.from("report_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function createIssue(
  projectId: string,
  reportId: string,
  title: string,
  severity: string | null
) {
  const { user, supabase } = await assertProjectAccess(projectId);
  if (!title.trim()) throw new Error("title required");
  const { error } = await supabase.from("issues").insert({
    project_id: projectId,
    user_id: user.id,
    title: title.trim(),
    severity: severity ?? "medium",
    source_report_id: reportId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function setVoiceNote(
  projectId: string,
  reportId: string,
  url: string | null
) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("daily_reports")
    .update({ voice_note_url: url, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
}

export async function resolveIssue(projectId: string, issueId: string) {
  const { supabase } = await assertProjectAccess(projectId);
  const { error } = await supabase
    .from("issues")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", issueId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/projects/${projectId}/today`);
}
