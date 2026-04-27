import Link from "next/link";
import { BookOpen, Camera, Users, AlertTriangle, Lock, HardHat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatWeekday, isoDate } from "@/lib/format";
import { notFound } from "next/navigation";

export default async function DiaryPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id, report_date, notes, locked, updated_at, foreman_contact_id, foreman_on_site")
    .eq("project_id", params.id)
    .order("report_date", { ascending: false })
    .limit(200);

  const list = reports ?? [];
  if (list.length === 0) {
    return (
      <div className="container py-6">
        <EmptyState icon={BookOpen} title="יומן דיווחים">
          עדיין אין דיווחים. פתח <Link className="text-primary underline" href={`/app/projects/${params.id}/today`}>את היום</Link> ותתחיל לתעד.
        </EmptyState>
      </div>
    );
  }

  const ids = list.map((r) => r.id);
  const foremanIds = Array.from(
    new Set(list.map((r) => r.foreman_contact_id).filter((x): x is string => !!x))
  );
  const [atRes, phRes, isRes, fmRes] = await Promise.all([
    supabase.from("attendance").select("daily_report_id, hours_worked").in("daily_report_id", ids),
    supabase.from("report_photos").select("daily_report_id").in("daily_report_id", ids),
    supabase.from("issues").select("source_report_id, status").in("source_report_id", ids),
    foremanIds.length
      ? supabase.from("contacts").select("id, name").in("id", foremanIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const foremanById = new Map((fmRes.data ?? []).map((c) => [c.id, c.name]));

  const attCount = new Map<string, number>();
  for (const a of atRes.data ?? []) {
    if ((a.hours_worked ?? 0) > 0) {
      attCount.set(a.daily_report_id, (attCount.get(a.daily_report_id) ?? 0) + 1);
    }
  }
  const phCount = new Map<string, number>();
  for (const p of phRes.data ?? []) {
    phCount.set(p.daily_report_id, (phCount.get(p.daily_report_id) ?? 0) + 1);
  }
  const isCount = new Map<string, { open: number; total: number }>();
  for (const i of isRes.data ?? []) {
    if (!i.source_report_id) continue;
    const cur = isCount.get(i.source_report_id) ?? { open: 0, total: 0 };
    cur.total++;
    if (i.status !== "resolved") cur.open++;
    isCount.set(i.source_report_id, cur);
  }

  const today = isoDate();

  return (
    <div className="container py-5 space-y-3">
      <h1 className="text-xl font-bold">יומן ({list.length})</h1>
      <ul className="space-y-2">
        {list.map((r) => {
          const isToday = r.report_date === today;
          const att = attCount.get(r.id) ?? 0;
          const ph = phCount.get(r.id) ?? 0;
          const is = isCount.get(r.id);
          return (
            <li key={r.id}>
              <Link
                href={`/app/projects/${params.id}/diary/${r.id}`}
                className="block rounded-2xl border bg-card hover:border-primary/50 transition-colors p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {formatWeekday(r.report_date)}
                      </div>
                      {isToday ? (
                        <span className="rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                          היום
                        </span>
                      ) : null}
                      {r.locked ? <Lock className="h-3 w-3 text-muted-foreground" /> : null}
                    </div>
                    <div className="font-semibold">{formatDate(r.report_date)}</div>
                    {r.notes ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {r.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">ללא הערות</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {att}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" /> {ph}
                  </span>
                  {is && is.total > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {is.open}/{is.total}
                    </span>
                  ) : null}
                  {r.foreman_contact_id && foremanById.has(r.foreman_contact_id) ? (
                    <span className="inline-flex items-center gap-1">
                      <HardHat className="h-3.5 w-3.5" />
                      {foremanById.get(r.foreman_contact_id)}
                      {r.foreman_on_site === false ? " · לא הגיע" : ""}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
