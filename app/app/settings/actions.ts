"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { normalizeIsraeliPhone, isValidIsraeliPhone } from "@/lib/phone";

export type BusinessFormState = { error?: string; ok?: boolean } | null;

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function parseDecimal(v: FormDataEntryValue | null, fallback: number): number {
  if (v == null) return fallback;
  const s = String(v).replace(/[,\s%]/g, "").trim();
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function parsePositiveInt(v: FormDataEntryValue | null, fallback: number): number {
  if (v == null) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const VALID_TAX_ID_TYPES = ["osek_patur", "osek_morshe", "company", "individual"];

export async function updateBusinessProfile(
  _prev: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const user = await requireUser();
  const supabase = createClient();

  const phoneRaw = trimOrNull(formData.get("phone"));
  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizeIsraeliPhone(phoneRaw);
    if (!phone) return { error: "טלפון לא תקין (מספר ישראלי)" };
  }
  const bitRaw = trimOrNull(formData.get("bit_phone"));
  let bit_phone: string | null = null;
  if (bitRaw) {
    if (!isValidIsraeliPhone(bitRaw)) return { error: "טלפון Bit לא תקין" };
    bit_phone = normalizeIsraeliPhone(bitRaw);
  }

  const taxIdType = String(formData.get("tax_id_type") ?? "osek_patur").trim();
  if (!VALID_TAX_ID_TYPES.includes(taxIdType)) {
    return { error: "סוג עוסק לא חוקי" };
  }

  const vatRate = parseDecimal(formData.get("vat_rate"), 18);
  if (vatRate < 0 || vatRate > 25) return { error: "מע״מ חייב בין 0% ל־25%" };

  const update = {
    full_name: trimOrNull(formData.get("full_name")),
    business_name: trimOrNull(formData.get("business_name")),
    tax_id: trimOrNull(formData.get("tax_id")),
    tax_id_type: taxIdType,
    vat_rate: vatRate,
    vat_included: formData.get("vat_included") === "on",
    address: trimOrNull(formData.get("address")),
    city: trimOrNull(formData.get("city")),
    phone,
    email: trimOrNull(formData.get("email")),
    website: trimOrNull(formData.get("website")),
    invoice_prefix: trimOrNull(formData.get("invoice_prefix")),
    next_invoice_number: parsePositiveInt(formData.get("next_invoice_number"), 1),
    next_quote_number: parsePositiveInt(formData.get("next_quote_number"), 1),
    next_receipt_number: parsePositiveInt(formData.get("next_receipt_number"), 1),
    bank_name: trimOrNull(formData.get("bank_name")),
    bank_branch: trimOrNull(formData.get("bank_branch")),
    bank_account: trimOrNull(formData.get("bank_account")),
    bit_phone,
    invoice_footer: trimOrNull(formData.get("invoice_footer")),
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/settings");
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function uploadLogoAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  const user = await requireUser();
  const supabase = createClient();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "קובץ חסר" };
  }
  if (file.size > 2 * 1024 * 1024) return { error: "הלוגו גדול מדי (עד 2MB)" };
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `profiles/${user.id}/logo-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("project-media")
    .upload(path, buf, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/png",
    });
  if (upErr) return { error: upErr.message };
  const { data: pub } = supabase.storage.from("project-media").getPublicUrl(path);
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ logo_url: pub.publicUrl })
    .eq("id", user.id);
  if (updErr) return { error: updErr.message };
  revalidatePath("/app/settings");
  revalidatePath("/app/settings");
  return { url: pub.publicUrl };
}

export async function removeLogoAction(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const supabase = createClient();
  await supabase.from("profiles").update({ logo_url: null }).eq("id", user.id);
  revalidatePath("/app/settings");
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function deleteAccountAction() {
  const user = await requireUser();
  const supabase = createClient();

  // Delete via RLS — all user-scoped rows cascade via ON DELETE CASCADE on
  // user_id FKs. project_members / attendance / report_photos / invoice_items
  // cascade through their parent rows.
  //
  // Then we delete the auth user via the admin API. Once that's done, the
  // client's session cookie is invalid and middleware bounces to /login.
  await supabase.from("profiles").delete().eq("id", user.id);
  // projects (and everything under them) cascades on user_id delete, triggered
  // by deleting the auth user. We also explicitly delete projects to force
  // cascade even if the auth-admin step fails.
  await supabase.from("projects").delete().eq("user_id", user.id);
  await supabase.from("contacts").delete().eq("user_id", user.id);
  await supabase.from("invoices").delete().eq("user_id", user.id);
  await supabase.from("change_orders").delete().eq("user_id", user.id);
  await supabase.from("materials").delete().eq("user_id", user.id);
  await supabase.from("materials_catalog").delete().eq("user_id", user.id);

  // Use admin client to delete the auth user.
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);

  // Force a logout cookie clear.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}

export async function markOnboardingComplete() {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  revalidatePath("/app/settings");
}
