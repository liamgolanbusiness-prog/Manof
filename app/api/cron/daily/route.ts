import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/push-send";
import { isoDate } from "@/lib/format";

// Daily pulse — call from Vercel Cron (vercel.json) or any scheduler.
// Bearer auth via CRON_SECRET.
//
// Fires pushes for:
//   - tasks due today (not done)
//   - invoices overdue by 1+ days and still 'issued'
//
// Cheap: single query per trigger, groups by user_id, one push per user.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = isoDate();
  const counts = { tasks: 0, invoices: 0, sent: 0 };

  // Tasks due today per user
  const { data: tasks } = await supabase
    .from("tasks")
    .select("user_id, project_id, title")
    .eq("due_date", today)
    .neq("status", "done");
  const tasksByUser = new Map<string, { project_id: string; title: string }[]>();
  for (const t of tasks ?? []) {
    const arr = tasksByUser.get(t.user_id) ?? [];
    arr.push({ project_id: t.project_id, title: t.title });
    tasksByUser.set(t.user_id, arr);
  }
  counts.tasks = tasks?.length ?? 0;

  for (const [userId, list] of tasksByUser) {
    const first = list[0];
    const more = list.length - 1;
    const res = await notifyUser(userId, {
      title: `${list.length} משימות להיום`,
      body:
        more > 0
          ? `"${first.title}" +${more} נוספות`
          : `"${first.title}"`,
      tag: `tasks-${today}`,
      url: `/app/projects/${first.project_id}/tasks`,
    });
    counts.sent += res.sent;
  }

  // Invoices overdue
  const { data: overdue } = await supabase
    .from("invoices")
    .select("user_id, id, doc_number, total, due_date, project_id")
    .eq("status", "issued")
    .lt("due_date", today);
  const overdueByUser = new Map<string, typeof overdue>();
  for (const inv of overdue ?? []) {
    const arr = overdueByUser.get(inv.user_id) ?? [];
    arr!.push(inv);
    overdueByUser.set(inv.user_id, arr);
  }
  counts.invoices = overdue?.length ?? 0;

  for (const [userId, list] of overdueByUser) {
    if (!list) continue;
    const total = list.reduce((s, i) => s + Number(i.total), 0);
    const res = await notifyUser(userId, {
      title: `${list.length} חשבוניות באיחור`,
      body: `סה״כ ₪${Math.round(total)} ממתין לגבייה`,
      tag: `overdue-${today}`,
      url: list[0].project_id
        ? `/app/projects/${list[0].project_id}/invoices`
        : "/app",
    });
    counts.sent += res.sent;
  }

  return NextResponse.json({ ok: true, ...counts });
}
