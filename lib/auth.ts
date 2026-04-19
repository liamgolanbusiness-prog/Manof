import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Fetch the authenticated user from the server context.
 * Returns null if not signed in. Prefer this in Server Components / Actions.
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
