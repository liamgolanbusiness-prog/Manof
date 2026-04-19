"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to the `project-media` Supabase Storage bucket and returns a
 * public URL. Files are scoped under `projects/<projectId>/reports/<reportId>/`.
 *
 * Assumes the bucket exists and is publicly readable (or at least has signed
 * URLs enabled). If RLS blocks anonymous read, the portal page will need a
 * signed URL; the main app reads via the authenticated session so it's fine.
 */
export async function uploadReportPhoto(
  projectId: string,
  reportId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `projects/${projectId}/reports/${reportId}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage.from("project-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);

  const { data: pub } = supabase.storage.from("project-media").getPublicUrl(path);
  return pub.publicUrl;
}

export async function uploadReceipt(
  projectId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `projects/${projectId}/receipts/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage.from("project-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);

  const { data: pub } = supabase.storage.from("project-media").getPublicUrl(path);
  return pub.publicUrl;
}
