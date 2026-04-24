import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ChevronLeft, Plus, FolderOpen } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  active: "פעיל",
  paused: "מוקפא",
  done: "הושלם",
  archived: "בארכיון",
};
const STATUS_CLASSES: Record<string, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  done: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export default async function ProjectsPage() {
  await requireUser();
  const supabase = createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, client_name, address, contract_value, status, cover_photo_url, target_end_date, progress_pct"
    )
    .order("created_at", { ascending: false });

  const list = projects ?? [];

  return (
    <div className="container py-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">הפרויקטים שלי</h1>
        <Link href="/app/projects/new">
          <Button size="sm" className="gap-1 tap">
            <Plus className="h-4 w-4" />
            פרויקט חדש
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/app/projects/${p.id}/today`}
              className="group rounded-2xl border bg-card hover:border-primary/50 transition-colors overflow-hidden"
            >
              <div className="relative h-32 w-full bg-muted">
                {p.cover_photo_url ? (
                  <Image
                    src={p.cover_photo_url}
                    alt={`תמונת שער — ${p.name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-muted-foreground">
                    <FolderOpen className="h-10 w-10 opacity-30" />
                  </div>
                )}
                {p.status && p.status !== "active" ? (
                  <span
                    className={`absolute top-2 end-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[p.status] ?? STATUS_CLASSES.archived}`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                ) : null}
                {p.progress_pct != null && p.progress_pct > 0 ? (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, p.progress_pct)}%` }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight line-clamp-1">{p.name}</h3>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary transition-colors" />
                </div>
                {p.client_name ? (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {p.client_name}
                  </p>
                ) : null}
                {p.address ? (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {p.address}
                  </p>
                ) : null}
                <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span>
                    {p.contract_value != null
                      ? formatCurrency(p.contract_value)
                      : "—"}
                  </span>
                  <span>
                    {p.target_end_date
                      ? `יעד: ${formatDateShort(p.target_end_date)}`
                      : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card p-10 text-center space-y-3">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <FolderOpen className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">עדיין אין פרויקטים</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        צור פרויקט ראשון עם שם, לקוח וכתובת — ומשם הכל קל: דיווח יומי, הוצאות,
        אנשים ומשימות.
      </p>
      <Link href="/app/projects/new">
        <Button size="lg" className="tap">
          <Plus className="h-4 w-4" />
          פרויקט ראשון
        </Button>
      </Link>
    </div>
  );
}
