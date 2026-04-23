import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "./i18n";

// Fetch user's locale server-side (default 'he' when profile missing).
export async function getUserLocale(): Promise<Locale> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "he";
  const { data } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", user.id)
    .maybeSingle();
  const loc = data?.locale as Locale | undefined;
  return loc && (loc === "he" || loc === "ar" || loc === "en") ? loc : "he";
}
