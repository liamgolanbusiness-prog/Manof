import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ScheduleView } from "./schedule-view";

export default async function SchedulePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, start_date, target_end_date")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("id, name, planned_date, actual_date, done, position")
    .eq("project_id", params.id)
    .order("position", { ascending: true })
    .order("planned_date", { ascending: true, nullsFirst: false });

  return (
    <div className="container py-5 pb-safe space-y-4">
      <div>
        <h2 className="text-lg font-semibold">לוח זמנים</h2>
        <p className="text-sm text-muted-foreground">
          אבני דרך עם תאריך מתוכנן. סמן כשבוצע — נציג סטטוס בדיווח היומי ובפורטל
          הלקוח.
        </p>
      </div>
      <ScheduleView
        projectId={params.id}
        milestones={milestones ?? []}
      />
    </div>
  );
}
