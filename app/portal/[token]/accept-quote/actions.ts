"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

export async function acceptQuoteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const quoteId = String(formData.get("quote_id") ?? "");
  const typedName = String(formData.get("typed_name") ?? "").trim();
  if (!token || !quoteId || !typedName) redirect(`/portal/${token}`);

  const ip = clientIpFromHeaders(headers());
  const rl = checkRateLimit(`quote_accept:${ip}`, 10, 60_000);
  if (!rl.ok) redirect(`/portal/${token}`);

  const supabase = createAdminClient();

  // Verify the quote belongs to the project of this portal token.
  const { data: project } = await supabase
    .from("projects")
    .select("id, portal_revoked_at, portal_expires_at")
    .eq("portal_token", token)
    .maybeSingle();
  if (!project) redirect(`/portal/${token}`);
  if (project.portal_revoked_at) redirect(`/portal/${token}`);
  if (
    project.portal_expires_at &&
    new Date(project.portal_expires_at).getTime() < Date.now()
  ) {
    redirect(`/portal/${token}`);
  }

  const { data: quote } = await supabase
    .from("invoices")
    .select("id, type, status, project_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote || quote.type !== "quote" || quote.project_id !== project.id) {
    redirect(`/portal/${token}`);
  }
  if (quote.status !== "issued" && quote.status !== "draft") {
    redirect(`/portal/${token}`);
  }

  const signatureRaw = String(formData.get("signature_data_url") ?? "").trim();
  const signature =
    signatureRaw.startsWith("data:image/") && signatureRaw.length < 200_000
      ? signatureRaw
      : null;

  await supabase
    .from("invoices")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_name: typedName.slice(0, 120),
      accepted_signature_url: signature,
    })
    .eq("id", quoteId);

  // Webhooks: quote.accepted → owner's subscribers. Need the owner's user_id.
  try {
    const { data: inv } = await supabase
      .from("invoices")
      .select("user_id, doc_number, total, project_id")
      .eq("id", quoteId)
      .maybeSingle();
    if (inv?.user_id) {
      const { fireWebhook } = await import("@/lib/webhooks");
      fireWebhook(inv.user_id, "quote.accepted", {
        invoice_id: quoteId,
        doc_number: inv.doc_number,
        total: inv.total,
        project_id: inv.project_id,
        accepted_by: typedName,
      }).catch(() => {});
    }
  } catch {
    /* swallow */
  }

  redirect(`/portal/${token}?accepted=${quoteId}`);
}
