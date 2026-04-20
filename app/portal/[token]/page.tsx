import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  HardHat,
  ImageIcon,
  TrendingUp,
  Calendar,
  Wallet,
  Banknote,
} from "lucide-react";

// Public page — no auth. Uses service role to bypass RLS, since the
// portal_token itself is the access credential.
export default async function PortalPage({
  params,
}: {
  params: { token: string };
}) {
  if (!params.token || params.token.length < 8) notFound();

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, address, client_name, contract_value, progress_pct, start_date, target_end_date, cover_photo_url, created_at"
    )
    .eq("portal_token", params.token)
    .maybeSingle();

  if (!project) notFound();

  // Get last 20 photos (across reports) + payments summary + recent report notes
  const [photosRes, payInRes, payOutRes, reportsRes] = await Promise.all([
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
      .from("payments")
      .select("amount")
      .eq("project_id", project.id)
      .eq("direction", "out"),
    supabase
      .from("daily_reports")
      .select("report_date, notes")
      .eq("project_id", project.id)
      .not("notes", "is", null)
      .order("report_date", { ascending: false })
      .limit(5),
  ]);

  const photos = photosRes.data ?? [];
  const totalIn = (payInRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const totalOut = (payOutRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const contract = Number(project.contract_value ?? 0);

  return (
    <div lang="he" dir="rtl" className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center gap-2 font-bold">
          <HardHat className="h-5 w-5 text-primary" />
          אתר · מעקב פרויקט
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

        {contract > 0 || totalIn > 0 || totalOut > 0 ? (
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

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-10">
          מופק ע״י אתר · כלי הניהול לקבלנים
        </footer>
      </main>
    </div>
  );
}
