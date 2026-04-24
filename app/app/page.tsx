import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, isoDate } from "@/lib/format";
import { getUserLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  AlertTriangle,
  Wallet,
  FolderOpen,
  ChevronLeft,
  Plus,
  ListTodo,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const locale = await getUserLocale();

  // First-run gate: never-onboarded users land on the welcome page so they
  // see the setup checklist + demo-project button instead of an empty shell.
  const { data: prof } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!prof?.onboarding_completed_at) redirect("/app/welcome");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_name, status, progress_pct, contract_value")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const active = (projects ?? []).filter((p) => (p.status ?? "active") === "active");
  const projectIds = (projects ?? []).map((p) => p.id);

  const today = isoDate();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartIso = isoDate(weekStart);

  // Month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartIso = isoDate(monthStart);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStartIso = isoDate(prevMonthStart);
  const prevMonthEndIso = isoDate(new Date(now.getFullYear(), now.getMonth(), 0));

  // 12-week cashflow series
  const WEEKS = 12;
  const weekBuckets = Array.from({ length: WEEKS }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { startIso: isoDate(start), endIso: isoDate(end), inflow: 0, outflow: 0 };
  }).reverse();
  const seriesStartIso = weekBuckets[0].startIso;

  let photosToday = 0;
  let expensesThisWeek = 0;
  let openIssues = 0;
  let openTasksToday = 0;
  let revenueThisMonth = 0;
  let revenuePrevMonth = 0;
  let expensesThisMonth = 0;
  const expenseByCat = new Map<string, number>();
  let invoicesThisMonth = 0;
  let overdueInvoicesTotal = 0;

  if (projectIds.length > 0) {
    // Today's reports → photos
    const { data: todayReports } = await supabase
      .from("daily_reports")
      .select("id")
      .in("project_id", projectIds)
      .eq("report_date", today);
    const todayReportIds = (todayReports ?? []).map((r) => r.id);
    if (todayReportIds.length > 0) {
      const { count } = await supabase
        .from("report_photos")
        .select("id", { count: "exact", head: true })
        .in("daily_report_id", todayReportIds);
      photosToday = count ?? 0;
    }

    const { data: weekExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .in("project_id", projectIds)
      .gte("expense_date", weekStartIso);
    expensesThisWeek = (weekExpenses ?? []).reduce(
      (s, e) => s + Number(e.amount),
      0
    );

    const { count: issuesCount } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds)
      .neq("status", "resolved");
    openIssues = issuesCount ?? 0;

    const { count: tasksCount } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds)
      .neq("status", "done")
      .lte("due_date", today);
    openTasksToday = tasksCount ?? 0;

    // Payments in (revenue) this month vs last
    const { data: payIn } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .in("project_id", projectIds)
      .eq("direction", "in")
      .gte("payment_date", prevMonthStartIso);
    for (const p of payIn ?? []) {
      const amt = Number(p.amount);
      if (p.payment_date >= monthStartIso) revenueThisMonth += amt;
      else if (p.payment_date >= prevMonthStartIso) revenuePrevMonth += amt;
    }

    // Month expenses + category breakdown
    const { data: monthExpenses } = await supabase
      .from("expenses")
      .select("amount, category")
      .in("project_id", projectIds)
      .gte("expense_date", monthStartIso);
    for (const e of monthExpenses ?? []) {
      const amt = Number(e.amount);
      expensesThisMonth += amt;
      expenseByCat.set(e.category, (expenseByCat.get(e.category) ?? 0) + amt);
    }

    // Invoices this month + overdue outstanding
    const { data: invoicesMonth } = await supabase
      .from("invoices")
      .select("total, status, issue_date, due_date, amount_paid")
      .eq("user_id", user.id)
      .in("status", ["issued", "paid"])
      .gte("issue_date", monthStartIso);
    for (const inv of invoicesMonth ?? []) {
      if (inv.status === "issued") invoicesThisMonth += Number(inv.total);
    }

    const { data: overdue } = await supabase
      .from("invoices")
      .select("total, amount_paid")
      .eq("user_id", user.id)
      .eq("status", "issued")
      .lt("due_date", today);
    for (const inv of overdue ?? []) {
      overdueInvoicesTotal += Number(inv.total) - Number(inv.amount_paid ?? 0);
    }

    // 12-week series — bucket payments in + expenses
    const { data: periodPay } = await supabase
      .from("payments")
      .select("amount, direction, payment_date")
      .in("project_id", projectIds)
      .gte("payment_date", seriesStartIso);
    for (const p of periodPay ?? []) {
      const b = weekBuckets.find((w) => p.payment_date >= w.startIso && p.payment_date <= w.endIso);
      if (!b) continue;
      if (p.direction === "in") b.inflow += Number(p.amount);
      else b.outflow += Number(p.amount);
    }
    const { data: periodExp } = await supabase
      .from("expenses")
      .select("amount, expense_date")
      .in("project_id", projectIds)
      .gte("expense_date", seriesStartIso);
    for (const e of periodExp ?? []) {
      const b = weekBuckets.find((w) => e.expense_date >= w.startIso && e.expense_date <= w.endIso);
      if (b) b.outflow += Number(e.amount);
    }
  }

  const revenueDelta = revenueThisMonth - revenuePrevMonth;
  const revenuePctDelta =
    revenuePrevMonth > 0 ? Math.round((revenueDelta / revenuePrevMonth) * 100) : null;
  const EXPENSE_CAT_LABELS: Record<string, string> = {
    materials: "חומרים",
    labor: "עבודה",
    subcontractor: "קבלן משנה",
    tools: "כלים",
    transport: "הובלה",
    permits: "רישוי",
    rent: "שכ״ד ציוד",
    other: "אחר",
  };
  const topCats = Array.from(expenseByCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => [EXPENSE_CAT_LABELS[cat] ?? cat, amt] as const);
  const maxCat = topCats[0]?.[1] ?? 1;
  const maxWeek = Math.max(...weekBuckets.map((w) => Math.max(w.inflow, w.outflow)), 1);

  return (
    <div className="container py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t(locale, "dashboard_good_morning")}</h1>
        <Link href="/app/projects/new">
          <Button size="sm" className="tap gap-1">
            <Plus className="h-4 w-4" />
            פרויקט
          </Button>
        </Link>
      </div>

      {/* Month revenue spotlight */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                הכנסות החודש
              </div>
              <div className="text-3xl font-bold">{formatCurrency(revenueThisMonth)}</div>
              {revenuePctDelta !== null ? (
                <div
                  className={`text-xs flex items-center gap-1 ${
                    revenueDelta >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {revenueDelta >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {revenueDelta >= 0 ? "+" : ""}
                  {revenuePctDelta}% מהחודש שעבר ({formatCurrency(revenuePrevMonth)})
                </div>
              ) : revenueThisMonth > 0 ? (
                <div className="text-xs text-muted-foreground">חודש שעבר: ללא הכנסות</div>
              ) : null}
            </div>
            <div className="text-end">
              <div className="text-xs text-muted-foreground">חשבוניות החודש</div>
              <div className="text-lg font-bold">{formatCurrency(invoicesThisMonth)}</div>
              {overdueInvoicesTotal > 0 ? (
                <div className="text-xs text-destructive mt-1">
                  באיחור: {formatCurrency(overdueInvoicesTotal)}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={FolderOpen}
          label="פעילים"
          value={String(active.length)}
          sub={`מתוך ${projects?.length ?? 0}`}
        />
        <StatCard
          icon={Camera}
          label="תמונות היום"
          value={String(photosToday)}
        />
        <StatCard
          icon={Wallet}
          label="הוצאות השבוע"
          value={formatCurrency(expensesThisWeek)}
          tone="warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="בעיות פתוחות"
          value={String(openIssues)}
          tone={openIssues > 0 ? "destructive" : "muted"}
        />
        <StatCard
          icon={ListTodo}
          label="משימות להיום"
          value={String(openTasksToday)}
          tone={openTasksToday > 0 ? "warning" : "muted"}
        />
        <StatCard
          icon={Receipt}
          label="הוצאות החודש"
          value={formatCurrency(expensesThisMonth)}
          tone="muted"
        />
      </div>

      {/* 12-week cashflow */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-1.5 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              תזרים 12 שבועות
            </h2>
            <div className="text-xs text-muted-foreground flex gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-success inline-block" /> כניסה
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-destructive inline-block" /> יציאה
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-0.5 h-24">
            {weekBuckets.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-0.5" title={w.startIso}>
                <div
                  className="bg-success/80 rounded-t-sm transition-all"
                  style={{ height: `${(w.inflow / maxWeek) * 100}%`, minHeight: w.inflow > 0 ? 2 : 0 }}
                />
                <div
                  className="bg-destructive/80 rounded-t-sm transition-all"
                  style={{ height: `${(w.outflow / maxWeek) * 100}%`, minHeight: w.outflow > 0 ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top expense categories this month */}
      {topCats.length > 0 ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-sm">הוצאות לפי קטגוריה · החודש</h2>
            <ul className="space-y-2">
              {topCats.map(([cat, amt]) => (
                <li key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{cat}</span>
                    <span className="font-medium" dir="ltr">
                      {formatCurrency(amt)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${(amt / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {active.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">פרויקטים פעילים</h2>
              <Link
                href="/app/projects"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                הצג הכל
              </Link>
            </div>
            <ul className="divide-y">
              {active.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/projects/${p.id}/today`}
                    className="flex items-center gap-3 p-3 hover:bg-muted/40"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.client_name || "—"} · {p.progress_pct ?? 0}%
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">עדיין אין פרויקטים פעילים.</p>
            <Link href="/app/projects/new">
              <Button size="lg" className="tap">פתח פרויקט ראשון</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning" | "destructive" | "muted";
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}
