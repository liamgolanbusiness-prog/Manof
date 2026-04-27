import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Fetch the authenticated user from the server context.
 *
 * Uses `getSession()` (cookie-only, no network) instead of `getUser()` (which
 * always makes an HTTP request to Supabase Auth). For server components that
 * just need `user.id` to scope queries, this is safe: RLS validates the real
 * JWT inside Postgres on every data query, so a forged cookie can't read
 * anyone else's data — it would just produce empty results.
 *
 * Returns null if not signed in. Prefer this in Server Components / Actions.
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/**
 * Same as getUser but redirects to /login if unauthenticated.
 * Use in protected pages whose unauthenticated state is not a valid UX.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
