import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Data export — streams a single JSON bundle of all user data. Streaming a
// proper ZIP would require another dep; JSON is sufficient for a data-export
// right (GDPR Art. 20 / Israeli Privacy Law equivalent) and human-readable.

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const [
    profile,
    projects,
    contacts,
    projectMembers,
    dailyReports,
    attendance,
    reportPhotos,
    issues,
    expenses,
    payments,
    tasks,
    workerPayments,
    invoices,
    invoiceItems,
    changeOrders,
    materials,
    materialsCatalog,
    portalViews,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("projects").select("*").eq("user_id", user.id),
    supabase.from("contacts").select("*").eq("user_id", user.id),
    supabase
      .from("project_members")
      .select("*, projects!inner(user_id)")
      .eq("projects.user_id", user.id),
    supabase.from("daily_reports").select("*").eq("user_id", user.id),
    supabase
      .from("attendance")
      .select("*, daily_reports!inner(user_id)")
      .eq("daily_reports.user_id", user.id),
    supabase
      .from("report_photos")
      .select("*, daily_reports!inner(user_id)")
      .eq("daily_reports.user_id", user.id),
    supabase.from("issues").select("*").eq("user_id", user.id),
    supabase.from("expenses").select("*").eq("user_id", user.id),
    supabase.from("payments").select("*").eq("user_id", user.id),
    supabase.from("tasks").select("*").eq("user_id", user.id),
    supabase.from("worker_payments").select("*").eq("user_id", user.id),
    supabase.from("invoices").select("*").eq("user_id", user.id),
    supabase
      .from("invoice_items")
      .select("*, invoices!inner(user_id)")
      .eq("invoices.user_id", user.id),
    supabase.from("change_orders").select("*").eq("user_id", user.id),
    supabase.from("materials").select("*").eq("user_id", user.id),
    supabase.from("materials_catalog").select("*").eq("user_id", user.id),
    supabase
      .from("portal_views")
      .select("*, projects!inner(user_id)")
      .eq("projects.user_id", user.id),
  ]);

  const bundle = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data ?? null,
    projects: projects.data ?? [],
    contacts: contacts.data ?? [],
    project_members: projectMembers.data ?? [],
    daily_reports: dailyReports.data ?? [],
    attendance: attendance.data ?? [],
    report_photos: reportPhotos.data ?? [],
    issues: issues.data ?? [],
    expenses: expenses.data ?? [],
    payments: payments.data ?? [],
    tasks: tasks.data ?? [],
    worker_payments: workerPayments.data ?? [],
    invoices: invoices.data ?? [],
    invoice_items: invoiceItems.data ?? [],
    change_orders: changeOrders.data ?? [],
    materials: materials.data ?? [],
    materials_catalog: materialsCatalog.data ?? [],
    portal_views: portalViews.data ?? [],
    _note:
      "Photos, receipts, and voice notes are served via the URLs inside report_photos / expenses / daily_reports. They are hosted on Supabase Storage under the project-media bucket.",
  };

  const body = JSON.stringify(bundle, null, 2);
  const filename = `atar-export-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
