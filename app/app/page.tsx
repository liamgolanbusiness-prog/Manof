import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, isoDate } from "@/lib/format";
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
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_name, status, progress_pct")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const active = (projects ?? []).filter((p) => (p.status ?? "active") === "active");
  const projectIds = (projects ?? []).map((p) => p.id);

  const today = isoDate();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartIso = isoDate(weekStart);

  // Photos today (across all projects)
  let photosToday = 0;
  let expensesThisWeek = 0;
  let openIssues = 0;
  let openTasksToday = 0;

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
    expensesThisWeek = (weekExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

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
  }

  return (
    <div className="container py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">בוקר טוב</h1>
        <Link href="/app/projects/new">
          <Button size="sm" className="tap gap-1">
            <Plus className="h-4 w-4" />
            פרויקט
          </Button>
        </Link>
      </div>

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
          sub="בכל הפרויקטים"
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
      </div>

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
