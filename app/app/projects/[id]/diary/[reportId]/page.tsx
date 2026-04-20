import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatDate, formatWeekday } from "@/lib/format";
import { notFound } from "next/navigation";
import { ChevronRight, Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShareReportButton } from "./share-report-button";

export default async function ReportDetail({
  params,
}: {
  params: { id: string; reportId: string };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: report } = await supabase
    .from("daily_reports")
    .select("id, report_date, weather, notes, locked, updated_at, voice_note_url")
    .eq("id", params.reportId)
    .eq("project_id", params.id)
    .maybeSingle();
  if (!report) notFound();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("name")
    .eq("id", params.id)
    .maybeSingle();
  const projectName = projectRow?.name ?? "פרויקט";

  const [atRes, phRes, isRes] = await Promise.all([
    supabase
      .from("attendance")
      .select("contact_id, hours_worked, notes")
      .eq("daily_report_id", report.id),
    supabase
      .from("report_photos")
      .select("id, url, caption")
      .eq("daily_report_id", report.id)
      .order("taken_at", { ascending: false }),
    supabase
      .from("issues")
      .select("id, title, severity, status")
      .eq("source_report_id", report.id),
  ]);

  const contactIds = (atRes.data ?? []).map((a) => a.contact_id);
  let contactNames: Record<string, string> = {};
  if (contactIds.length > 0) {
    const { data: cs } = await supabase
      .from("contacts")
      .select("id, name")
      .in("id", contactIds);
    for (const c of cs ?? []) contactNames[c.id] = c.name;
  }

  const totalHours = (atRes.data ?? []).reduce(
    (sum, a) => sum + (a.hours_worked ?? 0),
    0
  );

  return (
    <div className="container py-5 space-y-4">
      <div>
        <Link
          href={`/app/projects/${params.id}/diary`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה ליומן
        </Link>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">{formatWeekday(report.report_date)}</div>
          <h1 className="text-xl font-bold">{formatDate(report.report_date)}</h1>
          {report.locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-xs font-medium px-2 py-0.5 mt-1">
              <Lock className="h-3 w-3" />
              נסגר
            </span>
          ) : null}
        </div>
        <ShareReportButton
          projectName={projectName}
          reportDate={report.report_date}
          weather={report.weather}
          notes={report.notes}
          attendance={(atRes.data ?? []).map((a) => ({
            name: contactNames[a.contact_id] ?? "—",
            hours: a.hours_worked ?? 0,
          }))}
          photoCount={(phRes.data ?? []).length}
          issues={(isRes.data ?? []).map((i) => ({
            title: i.title,
            resolved: i.status === "resolved",
          }))}
          totalHours={totalHours}
        />
      </div>

      {report.weather ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="text-muted-foreground text-xs mb-1">מזג אוויר</div>
            <div>{report.weather}</div>
          </CardContent>
        </Card>
      ) : null}

      {report.notes ? (
        <Card>
          <CardContent className="p-4 text-sm whitespace-pre-line">
            <div className="text-muted-foreground text-xs mb-1">הערות</div>
            {report.notes}
          </CardContent>
        </Card>
      ) : null}

      {report.voice_note_url ? (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="text-muted-foreground text-xs">הודעה קולית</div>
            <audio controls src={report.voice_note_url} className="w-full" preload="metadata" />
          </CardContent>
        </Card>
      ) : null}

      {(atRes.data ?? []).length > 0 ? (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>נוכחות</span>
              <span>סה״כ {totalHours} שעות</span>
            </div>
            <ul className="divide-y">
              {(atRes.data ?? []).map((a, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between text-sm">
                  <span>{contactNames[a.contact_id] ?? "—"}</span>
                  <span className="text-muted-foreground">
                    {a.hours_worked ?? 0} שע׳
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {(phRes.data ?? []).length > 0 ? (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="text-xs text-muted-foreground">תמונות ({phRes.data!.length})</div>
            <div className="grid grid-cols-3 gap-2">
              {phRes.data!.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={p.url}
                    alt={p.caption ?? ""}
                    fill
                    sizes="(max-width: 640px) 33vw, 200px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {(isRes.data ?? []).length > 0 ? (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="text-xs text-muted-foreground">בעיות</div>
            <ul className="space-y-1">
              {isRes.data!.map((i) => (
                <li key={i.id} className="flex items-center gap-2 text-sm">
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      i.severity === "high"
                        ? "text-destructive"
                        : i.severity === "low"
                          ? "text-muted-foreground"
                          : "text-warning"
                    }`}
                  />
                  <span className="flex-1">{i.title}</span>
                  {i.status === "resolved" ? (
                    <span className="text-xs text-success">טופל</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">פתוח</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
