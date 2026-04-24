"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

export type AuthState = { error?: string; notice?: string } | null;

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) {
    return { error: "אימייל וסיסמה נדרשים" };
  }

  const ip = clientIpFromHeaders(headers());
  // Per-IP: 10 attempts / 10 min. Per-email: 5 attempts / 10 min.
  const byIp = checkRateLimit(`login:ip:${ip}`, 10, 10 * 60_000);
  const byEmail = checkRateLimit(`login:email:${email}`, 5, 10 * 60_000);
  if (!byIp.ok || !byEmail.ok) {
    const seconds = Math.max(byIp.retryAfterSec, byEmail.retryAfterSec);
    return {
      error: `יותר מדי ניסיונות. נסה שוב בעוד ${Math.ceil(seconds / 60)} דקות.`,
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) {
    return { error: "שם מלא, אימייל וסיסמה נדרשים" };
  }
  if (password.length < 8) {
    return { error: "הסיסמה חייבת להיות לפחות 8 תווים" };
  }

  const ip = clientIpFromHeaders(headers());
  const byIp = checkRateLimit(`signup:ip:${ip}`, 5, 60 * 60_000); // 5/hour per IP
  if (!byIp.ok) {
    return {
      error: `יותר מדי הרשמות מכתובת זו. נסה שוב בעוד ${Math.ceil(byIp.retryAfterSec / 60)} דקות.`,
    };
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: appUrl ? `${appUrl}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // If email confirmation is enabled Supabase returns a session=null response.
  if (!data.session) {
    return {
      notice:
        "נשלח אליך אימייל לאישור החשבון. פתח את הקישור במייל כדי להשלים את ההרשמה.",
    };
  }

  // Best-effort: fill profile.full_name if the trigger-created row is empty
  // and grant a 30-day pro trial so new users can actually try invoicing /
  // multiple projects before hitting the free-tier gate.
  if (data.user) {
    const trialEndsAt = new Date(Date.now() + 30 * 86400_000).toISOString();
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", data.user.id)
      .is("full_name", null);
    await supabase
      .from("profiles")
      .update({
        subscription_status: "trialing",
        trial_ends_at: trialEndsAt,
      })
      .eq("id", data.user.id)
      .is("trial_ends_at", null);
  }

  // Fire-and-forget welcome email (no-op when RESEND_API_KEY missing).
  try {
    const { sendEmail, welcomeEmail, isEmailConfigured } = await import("@/lib/email");
    if (isEmailConfigured() && data.user?.email) {
      sendEmail({
        to: data.user.email,
        subject: "ברוך הבא לאתר",
        html: welcomeEmail(fullName),
      }).catch(() => {});
    }
  } catch {
    // swallow
  }

  revalidatePath("/", "layout");
  redirect("/app/welcome");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "אימייל נדרש" };

  const ip = clientIpFromHeaders(headers());
  // Rate limit reset requests: 3 per email + 10 per IP per hour.
  const byIp = checkRateLimit(`pwreset:ip:${ip}`, 10, 60 * 60_000);
  const byEmail = checkRateLimit(`pwreset:email:${email}`, 3, 60 * 60_000);
  if (!byIp.ok || !byEmail.ok) {
    return { error: "יותר מדי בקשות. נסה שוב בעוד שעה." };
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl ? `${appUrl}/auth/callback?next=/update-password` : undefined,
  });
  // Always return a generic notice — don't leak account existence.
  if (error && !error.message.toLowerCase().includes("not found")) {
    return { error: translateAuthError(error.message) };
  }
  return {
    notice:
      "אם קיים חשבון עם האימייל הזה, נשלח קישור לאיפוס סיסמה. בדוק את תיבת הדואר.",
  };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "הסיסמה חייבת להיות לפחות 8 תווים" };
  if (password !== confirm) return { error: "הסיסמאות לא זהות" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "הקישור פג תוקף. בקש קישור חדש." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translateAuthError(error.message) };

  revalidatePath("/", "layout");
  redirect("/app");
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "אימייל או סיסמה שגויים";
  if (m.includes("user already registered")) return "החשבון כבר קיים — התחבר במקום להירשם";
  if (m.includes("password should be")) return "הסיסמה חלשה מדי";
  if (m.includes("email not confirmed")) return "האימייל לא אושר עדיין — בדוק את תיבת הדואר";
  if (m.includes("email logins are disabled") || m.includes("email signups are disabled"))
    return "הרשמה באימייל מושבתת בצד השרת — פנה למנהל המערכת";
  if (m.includes("signups not allowed")) return "הרשמות חדשות מושבתות כרגע";
  if (m.includes("same password")) return "בחר סיסמה שונה מהקודמת";
  if (m.includes("rate limit")) return "יותר מדי ניסיונות. נסה שוב מאוחר יותר.";
  return msg;
}
