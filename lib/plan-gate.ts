// Feature gating by plan. Free tier limits designed to be useful enough for
// a solo contractor to demo the app but tight enough to push toward pro
// once they're active (2+ projects, or >3 invoices/month).

import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<Plan, { activeProjects: number | null; invoicesPerMonth: number | null }> = {
  free: { activeProjects: 1, invoicesPerMonth: 3 },
  pro: { activeProjects: null, invoicesPerMonth: null },
  enterprise: { activeProjects: null, invoicesPerMonth: null },
};

export async function getUserPlan(userId: string): Promise<{
  plan: Plan;
  isPro: boolean;
  subscription_status: string;
  trial_ends_at: string | null;
  inTrial: boolean;
}> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("plan, subscription_status, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();
  const plan = (data?.plan ?? "free") as Plan;
  const status = data?.subscription_status ?? "active";
  const trialEnds = data?.trial_ends_at ?? null;
  const inTrial =
    !!trialEnds && new Date(trialEnds).getTime() > Date.now();
  const isPro = plan === "pro" || plan === "enterprise" || inTrial;
  return { plan, isPro, subscription_status: status, trial_ends_at: trialEnds, inTrial };
}

// Check a specific limit. Returns { allowed, limit, used } so the UI can
// surface contextual upgrade CTAs. Over-limit actions should return a
// structured error the caller renders as "upgrade to pro".
export async function checkProjectLimit(userId: string): Promise<{
  allowed: boolean;
  limit: number | null;
  used: number;
}> {
  const supabase = createClient();
  const { plan, isPro } = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].activeProjects;
  if (isPro || limit == null) return { allowed: true, limit: null, used: 0 };
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}

export async function checkInvoiceLimit(userId: string): Promise<{
  allowed: boolean;
  limit: number | null;
  used: number;
}> {
  const supabase = createClient();
  const { plan, isPro } = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].invoicesPerMonth;
  if (isPro || limit == null) return { allowed: true, limit: null, used: 0 };
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("issue_date", start.toISOString().slice(0, 10));
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}
