"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string } | null;

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) {
    return { error: "אימייל וסיסמה נדרשים" };
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
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) {
    return { error: "שם מלא, אימייל וסיסמה נדרשים" };
  }
  if (password.length < 6) {
    return { error: "הסיסמה חייבת להיות לפחות 6 תווים" };
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

  // Best-effort: fill profile.full_name if the trigger-created row is empty.
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", data.user.id)
      .is("full_name", null);
  }

  revalidatePath("/", "layout");
  redirect("/app/projects/new");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
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
  return msg;
}
