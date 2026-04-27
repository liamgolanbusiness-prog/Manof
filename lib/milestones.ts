// Schedule milestone status helpers — shared by app + portal so the badge logic
// stays consistent.

export type MilestoneStatus = "done" | "late" | "due_soon" | "on_track" | "no_date";

export type MilestoneLike = {
  planned_date: string | null;
  actual_date?: string | null;
  done: boolean | null;
};

/** Days threshold for the "קרוב" (due soon) badge. */
const DUE_SOON_DAYS = 7;

/** Returns the status as of `today` (default = now). */
export function milestoneStatus(
  m: MilestoneLike,
  today: Date = new Date()
): MilestoneStatus {
  if (m.done) return "done";
  if (!m.planned_date) return "no_date";
  const planned = new Date(m.planned_date);
  const t = startOfDay(today).getTime();
  const p = startOfDay(planned).getTime();
  if (p < t) return "late";
  const diffDays = Math.round((p - t) / 86400000);
  if (diffDays <= DUE_SOON_DAYS) return "due_soon";
  return "on_track";
}

/** Project-level summary: are we late on any non-done milestone? */
export type ProjectScheduleStatus = "on_track" | "behind" | "no_milestones";

export function projectScheduleStatus(
  milestones: MilestoneLike[],
  today: Date = new Date()
): ProjectScheduleStatus {
  if (milestones.length === 0) return "no_milestones";
  for (const m of milestones) {
    if (milestoneStatus(m, today) === "late") return "behind";
  }
  return "on_track";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
