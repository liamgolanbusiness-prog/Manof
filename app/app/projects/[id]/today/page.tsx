import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isoDate, formatDate, formatWeekday } from "@/lib/format";
import { TodayView } from "./today-view";
import { notFound } from "next/navigation";

export default async function TodayPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const today = isoDate();

  const [reportRes, membersRes] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("id, weather, notes, locked, report_date, updated_at")
      .eq("project_id", params.id)
      .eq("report_date", today)
      .maybeSingle(),
    supabase
      .from("project_members")
      .select("id, contact_id, role_in_project")
      .eq("project_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  const report = reportRes.data;

  // If we have a report, fetch attendance, photos, and today's issues
  let attendance: { contact_id: string; hours_worked: number | null }[] = [];
  let photos: { id: string; url: string; caption: string | null }[] = [];
  let issues: { id: string; title: string; severity: string | null; status: string | null }[] = [];

  if (report) {
    const [atRes, phRes, isRes] = await Promise.all([
      supabase
        .from("attendance")
        .select("contact_id, hours_worked")
        .eq("daily_report_id", report.id),
      supabase
        .from("report_photos")
        .select("id, url, caption, taken_at")
        .eq("daily_report_id", report.id)
        .order("taken_at", { ascending: false }),
      supabase
        .from("issues")
        .select("id, title, severity, status")
        .eq("source_report_id", report.id)
        .order("created_at", { ascending: false }),
    ]);
    attendance = atRes.data ?? [];
    photos = phRes.data ?? [];
    issues = isRes.data ?? [];
  }

  // Resolve contact names for members + roster
  const contactIds = Array.from(
    new Set((membersRes.data ?? []).map((m) => m.contact_id))
  );
  let contactsById: Record<string, { id: string; name: string; trade: string | null; role: string }> = {};
  if (contactIds.length > 0) {
    const { data: contactRows } = await supabase
      .from("contacts")
      .select("id, name, trade, role")
      .in("id", contactIds);
    for (const c of contactRows ?? []) contactsById[c.id] = c;
  }

  const roster = (membersRes.data ?? []).map((m) => ({
    memberId: m.id,
    contactId: m.contact_id,
    name: contactsById[m.contact_id]?.name ?? "—",
    trade: contactsById[m.contact_id]?.trade ?? contactsById[m.contact_id]?.role ?? "",
    hours:
      attendance.find((a) => a.contact_id === m.contact_id)?.hours_worked ??
      null,
  }));

  // Contacts not yet in this project — for inline "add member" when roster is empty
  const memberContactIds = new Set(roster.map((r) => r.contactId));
  const { data: allContacts } = await supabase
    .from("contacts")
    .select("id, name, trade, role")
    .eq("user_id", user.id)
    .order("name", { ascending: true });
  const availableContacts = (allContacts ?? []).filter(
    (c) => !memberContactIds.has(c.id)
  );

  return (
    <div className="container py-5 pb-safe space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">{formatWeekday(today)}</div>
          <h2 className="text-lg font-semibold">{formatDate(today)}</h2>
        </div>
        {report?.locked ? (
          <span className="rounded-full bg-success/10 text-success text-xs font-medium px-2 py-0.5">
            היום נסגר
          </span>
        ) : null}
      </div>

      <TodayView
        projectId={params.id}
        report={report}
        roster={roster}
        photos={photos}
        issues={issues}
        availableContacts={availableContacts}
      />
    </div>
  );
}
