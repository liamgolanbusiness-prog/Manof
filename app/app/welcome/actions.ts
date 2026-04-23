"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

// Seeds a demo project so a new user can explore the app before typing any
// real data. Intentionally simple — just enough to see every tab populated.
export async function seedDemoProjectAction() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: "שיפוץ דירה לדוגמה",
      address: "רח׳ הגליל 12, תל אביב",
      client_name: "לקוח דוגמה",
      start_date: new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10),
      target_end_date: new Date(Date.now() + 45 * 86400_000).toISOString().slice(0, 10),
      contract_value: 180000,
      progress_pct: 35,
      status: "active",
    })
    .select("id")
    .single();
  if (pErr || !project) throw new Error(pErr?.message ?? "demo seed failed");

  // A couple of contacts
  const { data: workers } = await supabase
    .from("contacts")
    .insert([
      { user_id: user.id, name: "דני העובד", role: "worker", trade: "טייח", pay_rate: 350, pay_type: "daily" },
      { user_id: user.id, name: "ספק חומרי בניין", role: "supplier", trade: "חומרי בניין" },
      { user_id: user.id, name: "לקוח דוגמה", role: "client" },
    ])
    .select("id, role");

  const workerId = workers?.find((w) => w.role === "worker")?.id;
  const supplierId = workers?.find((w) => w.role === "supplier")?.id;

  if (workerId) {
    await supabase
      .from("project_members")
      .insert({ project_id: project.id, contact_id: workerId });
  }

  // A couple of daily reports
  const { data: report1 } = await supabase
    .from("daily_reports")
    .insert({
      project_id: project.id,
      user_id: user.id,
      report_date: new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10),
      notes: "פירקנו את הקרמיקה הישנה במטבח. התקדמות טובה.",
      weather: "בהיר, 25°",
    })
    .select("id")
    .single();
  if (report1 && workerId) {
    await supabase
      .from("attendance")
      .insert({ daily_report_id: report1.id, contact_id: workerId, hours_worked: 8 });
  }

  await supabase.from("daily_reports").insert({
    project_id: project.id,
    user_id: user.id,
    report_date: new Date(Date.now() - 86400_000).toISOString().slice(0, 10),
    notes: "הנחת מצע יישור. מחר מתחילים ריצוף.",
    weather: "מעונן, 22°",
  });

  // Expenses + payment
  await supabase.from("expenses").insert([
    {
      user_id: user.id,
      project_id: project.id,
      amount: 4200,
      category: "חומרי בניין",
      supplier_contact_id: supplierId,
      payment_method: "העברה",
      notes: "קרמיקה וצבע",
    },
    {
      user_id: user.id,
      project_id: project.id,
      amount: 1500,
      category: "כלים",
      payment_method: "מזומן",
    },
  ]);
  await supabase.from("payments").insert({
    user_id: user.id,
    project_id: project.id,
    direction: "in",
    amount: 50000,
    method: "העברה",
    notes: "מקדמה מהלקוח",
  });

  await supabase.from("tasks").insert([
    {
      user_id: user.id,
      project_id: project.id,
      title: "להזמין ברז מטבח",
      assignee_contact_id: workerId,
      due_date: new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10),
    },
    {
      user_id: user.id,
      project_id: project.id,
      title: "לסגור צביעת תקרה",
      due_date: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    },
  ]);

  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/app");
  redirect(`/app/projects/${project.id}/today`);
}

export async function skipOnboardingAction() {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  revalidatePath("/app");
  redirect("/app/projects/new");
}
