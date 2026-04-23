import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { hashIpForPortal, verifyPortalPin } from "@/lib/portal-pin";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { PortalPinGate } from "./pin-gate";
import {
  HardHat,
  ImageIcon,
  TrendingUp,
  Calendar,
  Wallet,
  Banknote,
  Lock,
  Timer,
  FileText,
  CheckCircle2,
  Download,
} from "lucide-react";
import { INVOICE_TYPE_LABELS, type InvoiceType } from "@/lib/supabase/database.types";
import { acceptQuoteAction } from "./accept-quote/actions";
import { approveChangeAction } from "./approve-change/actions";
import { SignaturePad } from "./signature-pad";

export const dynamic = "force-dynamic";

// Public page — no auth. Uses service role to bypass RLS, since the
// portal_token itself is the access credential (and optional PIN cookie).
export default async function PortalPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { pin_error?: string; accepted?: string; change_approved?: string };
}) {
  if (!params.token || params.token.length < 8) notFound();

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, user_id, name, address, client_name, contract_value, progress_pct, start_date, target_end_date, cover_photo_url, created_at, portal_expires_at, portal_pin_hash, portal_revoked_at"
    )
    .eq("portal_token", params.token)
    .maybeSingle();

  if (!project) notFound();

  // Revoked ─ show a neutral "not available" page, not a 404 (client shouldn't
  // learn whether the link is wrong or revoked).
  if (project.portal_revoked_at) {
    return <PortalUnavailable reason="revoked" />;
  }

  if (project.portal_expires_at && new Date(project.portal_expires_at).getTime() < Date.now()) {
    return <PortalUnavailable reason="expired" />;
  }

  // PIN gate — check cookie if PIN is set.
  if (project.portal_pin_hash) {
    const cookieStore = cookies();
    const cookieName = `portal_pin_${project.id}`;
    const cookieVal = cookieStore.get(cookieName)?.value;
    const hasValidCookie = !!cookieVal && cookieVal === project.portal_pin_hash;

    if (!hasValidCookie) {
      return (
        <PortalPinGate
          token={params.token}
          projectId={project.id}
          initialError={searchParams.pin_error === "1" ? "קוד שגוי" : undefined}
        />
      );
    }
  }

  // Record a view + bump counter (best-effort).
  const h = headers();
  const ip = clientIpFromHeaders(h);
  const ua = h.get("user-agent")?.slice(0, 200) ?? null;
  let firstViewToday = false;
  try {
    // Detect if this is the first view of the day — drives the owner push.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("portal_views")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .gte("viewed_at", startOfDay.toISOString());
    firstViewToday = (count ?? 0) === 0;

    await supabase.from("portal_views").insert({
      project_id: project.id,
      ip_hash: hashIpForPortal(ip, params.token),
      user_agent: ua,
    });
    const incremented = await fetchIncrementedCount(supabase, project.id);
    await supabase
      .from("projects")
      .update({
        portal_last_viewed_at: new Date().toISOString(),
        portal_view_count: incremented,
      })
      .eq("id", project.id);

    if (firstViewToday) {
      // fire-and-forget — don't block render
      const { notifyUser } = await import("@/lib/push-send");
      notifyUser(project.user_id, {
        title: "הלקוח צפה בפורטל",
        body: `${project.client_name ?? "הלקוח"} נכנס לצפייה בפרויקט "${project.name}"`,
        tag: `portal-view-${project.id}`,
        url: `/app/projects/${project.id}/client`,
      }).catch(() => {});
      const { fireWebhook } = await import("@/lib/webhooks");
      fireWebhook(project.user_id, "portal.viewed", {
        project_id: project.id,
        project_name: project.name,
        client_name: project.client_name ?? null,
      }).catch(() => {});
    }
  } catch {
    // Don't block page render on telemetry failures.
  }

  // Get last 20 photos (across reports) + payments summary + recent report notes + issued docs
  const [photosRes, payInRes, reportsRes, profileRes, invoicesRes] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("id, report_date")
      .eq("project_id", project.id)
      .order("report_date", { ascending: false })
      .limit(30)
      .then(async (reportsRes) => {
        const ids = (reportsRes.data ?? []).map((r) => r.id);
        if (ids.length === 0) return { data: [] };
        return supabase
          .from("report_photos")
          .select("id, url, caption, taken_at")
          .in("daily_report_id", ids)
          .order("taken_at", { ascending: false })
          .limit(20);
      }),
    supabase
      .from("payments")
      .select("amount")
      .eq("project_id", project.id)
      .eq("direction", "in"),
    supabase
      .from("daily_reports")
      .select("report_date, notes")
      .eq("project_id", project.id)
      .not("notes", "is", null)
      .order("report_date", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("business_name, full_name, logo_url, phone, email")
      .eq("id", project.user_id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, type, doc_number, status, issue_date, total, accepted_at, accepted_by_name, valid_until, due_date")
      .eq("project_id", project.id)
      .in("status", ["issued", "accepted", "paid"])
      .order("issue_date", { ascending: false }),
  ]);

  const { data: changesData } = await supabase
    .from("change_orders")
    .select("id, title, description, amount_change, status, signed_by_name, signed_at, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const photos = photosRes.data ?? [];
  const totalIn = (payInRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const contract = Number(project.contract_value ?? 0);
  const profile = profileRes?.data;
  const docs = invoicesRes.data ?? [];
  const pendingQuotes = docs.filter((d) => d.type === "quote" && d.status === "issued");
  const otherDocs = docs.filter((d) => !(d.type === "quote" && d.status === "issued"));
  const acceptedParam =
    typeof searchParams?.accepted === "string" ? searchParams.accepted : undefined;
  const changeApprovedParam =
    typeof searchParams?.change_approved === "string" ? searchParams.change_approved : undefined;
  const pendingChanges = (changesData ?? []).filter((c) => c.status === "pending");
  const resolvedChanges = (changesData ?? []).filter((c) => c.status !== "pending" && c.status !== "cancelled");

  return (
    <div lang="he" dir="rtl" className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center gap-2 font-bold">
          {profile?.logo_url ? (
            <div className="relative h-8 w-8 rounded-lg overflow-hidden">
              <Image
                src={profile.logo_url}
                alt=""
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
          ) : (
            <HardHat className="h-5 w-5 text-primary" />
          )}
          {profile?.business_name || "אתר"} · מעקב פרויקט
        </div>
      </header>

      <main className="container py-6 space-y-6 max-w-3xl">
        <section className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.client_name ? (
            <p className="text-sm text-muted-foreground">
              עבור {project.client_name}
              {project.address ? ` · ${project.address}` : ""}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            התקדמות
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{project.progress_pct ?? 0}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, project.progress_pct ?? 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            {project.start_date ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                התחלה {formatDateShort(project.start_date)}
              </span>
            ) : <span />}
            {project.target_end_date ? (
              <span className="inline-flex items-center gap-1">
                יעד סיום {formatDateShort(project.target_end_date)}
                <Calendar className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        </section>

        {photos.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              תמונות מהאתר ({photos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <Image
                    src={p.url}
                    alt={p.caption ?? ""}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {contract > 0 || totalIn > 0 ? (
          <section className="rounded-2xl border bg-card p-5 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              מצב כספי
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {contract > 0 ? (
                <div>
                  <div className="text-xs text-muted-foreground">ערך חוזה</div>
                  <div className="font-semibold">{formatCurrency(contract)}</div>
                </div>
              ) : null}
              <div>
                <div className="text-xs text-muted-foreground">שולם עד כה</div>
                <div className="font-semibold">{formatCurrency(totalIn)}</div>
              </div>
              {contract > 0 ? (
                <div>
                  <div className="text-xs text-muted-foreground">יתרה לתשלום</div>
                  <div className="font-semibold">
                    {formatCurrency(Math.max(0, contract - totalIn))}
                  </div>
                </div>
              ) : null}
            </div>
            {contract > 0 ? (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success"
                  style={{ width: `${Math.min(100, (totalIn / contract) * 100)}%` }}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {acceptedParam ? (
          <section className="rounded-2xl border border-success/30 bg-success/10 p-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <span>הצעת המחיר התקבלה. תודה!</span>
          </section>
        ) : null}
        {changeApprovedParam ? (
          <section className="rounded-2xl border border-success/30 bg-success/10 p-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <span>השינוי אושר. תודה!</span>
          </section>
        ) : null}

        {pendingChanges.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              שינויים לאישור ({pendingChanges.length})
            </h2>
            <ul className="space-y-3">
              {pendingChanges.map((c) => (
                <li key={c.id} className="rounded-2xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{c.title}</div>
                      {c.description ? (
                        <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                          {c.description}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={
                        "text-lg font-bold " + (Number(c.amount_change) < 0 ? "text-destructive" : "")
                      }
                      dir="ltr"
                    >
                      {Number(c.amount_change) > 0 ? "+" : ""}
                      {new Intl.NumberFormat("he-IL", {
                        style: "currency",
                        currency: "ILS",
                        maximumFractionDigits: 0,
                      }).format(Number(c.amount_change))}
                    </div>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-primary text-sm">
                      לחץ לאישור השינוי
                    </summary>
                    <form action={approveChangeAction} className="mt-3 space-y-3 rounded-xl bg-muted/50 p-3">
                      <input type="hidden" name="token" value={params.token} />
                      <input type="hidden" name="change_id" value={c.id} />
                      <SignaturePad name="typed_name" signatureFieldName="signature_data_url" />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-primary text-primary-foreground font-semibold h-11"
                      >
                        אני מאשר את השינוי
                      </button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {resolvedChanges.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              שינויים שאושרו/נדחו
            </h2>
            <ul className="space-y-1.5 text-sm">
              {resolvedChanges.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border bg-card/60 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-medium">{c.title}</span>
                    {c.status === "approved" && c.signed_by_name ? (
                      <span className="text-xs text-muted-foreground">
                        {" "}· אושר ע״י {c.signed_by_name}
                      </span>
                    ) : null}
                    {c.status === "rejected" ? (
                      <span className="text-xs text-destructive"> · נדחה</span>
                    ) : null}
                  </div>
                  <span
                    className={
                      "font-semibold " + (Number(c.amount_change) < 0 ? "text-destructive" : "")
                    }
                    dir="ltr"
                  >
                    {Number(c.amount_change) > 0 ? "+" : ""}
                    {new Intl.NumberFormat("he-IL", {
                      style: "currency",
                      currency: "ILS",
                      maximumFractionDigits: 0,
                    }).format(Number(c.amount_change))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {pendingQuotes.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              הצעות מחיר לאישור
            </h2>
            <ul className="space-y-3">
              {pendingQuotes.map((q) => (
                <li key={q.id} className="rounded-2xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">הצעת מחיר</div>
                      <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {q.doc_number}
                      </div>
                      {q.valid_until ? (
                        <div className="text-xs text-muted-foreground">
                          בתוקף עד {new Date(q.valid_until).toLocaleDateString("he-IL")}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-end">
                      <div className="text-2xl font-bold" dir="ltr">
                        {new Intl.NumberFormat("he-IL", {
                          style: "currency",
                          currency: "ILS",
                          maximumFractionDigits: 0,
                        }).format(Number(q.total))}
                      </div>
                    </div>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary">
                      לחץ לאישור ההצעה
                    </summary>
                    <form
                      action={acceptQuoteAction}
                      className="mt-3 space-y-3 rounded-xl bg-muted/50 p-3"
                    >
                      <input type="hidden" name="token" value={params.token} />
                      <input type="hidden" name="quote_id" value={q.id} />
                      <SignaturePad name="typed_name" signatureFieldName="signature_data_url" />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-primary text-primary-foreground font-semibold h-11"
                      >
                        אני מאשר את ההצעה
                      </button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {otherDocs.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              מסמכים
            </h2>
            <ul className="space-y-2">
              {otherDocs.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border bg-card p-3 flex items-center gap-3"
                >
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {INVOICE_TYPE_LABELS[d.type as InvoiceType]}
                      {d.status === "accepted" ? " · התקבל" : ""}
                      {d.status === "paid" ? " · שולם" : ""}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                      {d.doc_number}
                    </div>
                  </div>
                  <div className="text-end text-sm font-bold" dir="ltr">
                    {new Intl.NumberFormat("he-IL", {
                      style: "currency",
                      currency: "ILS",
                      maximumFractionDigits: 0,
                    }).format(Number(d.total))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {reportsRes.data && reportsRes.data.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              עדכונים אחרונים
            </h2>
            <ul className="space-y-2">
              {reportsRes.data.map((r, idx) => (
                <li key={idx} className="rounded-xl border bg-card p-3">
                  <div className="text-xs text-muted-foreground">
                    {formatDateShort(r.report_date)}
                  </div>
                  <div className="text-sm whitespace-pre-line">{r.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-10 space-y-1">
          <div>
            מופק ע״י <a href="/" className="font-semibold text-primary hover:underline">אתר</a>
            {" · "}
            הכלי של קבלנים בישראל
          </div>
          {profile?.phone || profile?.email ? (
            <div>
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
              ) : null}
              {profile?.phone && profile?.email ? " · " : ""}
              {profile?.email ? (
                <a href={`mailto:${profile.email}`} className="hover:underline">
                  {profile.email}
                </a>
              ) : null}
            </div>
          ) : null}
        </footer>
      </main>
    </div>
  );
}

// Atomic-ish increment: fetch + return new count. Safe enough for view counter.
async function fetchIncrementedCount(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string
) {
  const { data } = await supabase
    .from("projects")
    .select("portal_view_count")
    .eq("id", projectId)
    .maybeSingle();
  return (data?.portal_view_count ?? 0) + 1;
}

function PortalUnavailable({ reason }: { reason: "revoked" | "expired" }) {
  return (
    <div lang="he" dir="rtl" className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md text-center space-y-4 rounded-2xl bg-card border p-8">
        {reason === "expired" ? (
          <Timer className="h-10 w-10 text-warning mx-auto" />
        ) : (
          <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
        )}
        <h1 className="text-xl font-bold">
          {reason === "expired" ? "הקישור פג תוקף" : "הגישה לקישור סגורה"}
        </h1>
        <p className="text-sm text-muted-foreground">
          פנה לקבלן כדי לקבל קישור חדש.
        </p>
      </div>
    </div>
  );
}
