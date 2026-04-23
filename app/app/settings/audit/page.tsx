import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/format";
import { FileClock, Plus, Edit, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "יומן שינויים · אתר" };

const TABLE_LABELS: Record<string, string> = {
  invoices: "חשבוניות",
  change_orders: "שינויי חוזה",
  payments: "תשלומים",
  expenses: "הוצאות",
};

export default async function AuditPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("audit_log")
    .select("id, table_name, row_id, action, old_data, new_data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <FileClock className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">יומן שינויים</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        שינויים בחשבוניות, תשלומים, הוצאות ושינויי חוזה — 200 פעולות אחרונות.
      </p>

      {(rows ?? []).length === 0 ? (
        <EmptyState icon={FileClock} title="אין עדיין שינויים">
          כל פעולה על חשבוניות ותשלומים תירשם כאן אוטומטית.
        </EmptyState>
      ) : (
        <ul className="space-y-1.5">
          {(rows ?? []).map((r) => {
            const Icon =
              r.action === "INSERT" ? Plus : r.action === "UPDATE" ? Edit : Trash2;
            const tone =
              r.action === "INSERT"
                ? "text-success"
                : r.action === "DELETE"
                  ? "text-destructive"
                  : "text-primary";
            const data =
              (r.new_data as Record<string, unknown> | null) ??
              (r.old_data as Record<string, unknown> | null) ??
              {};
            const summary = summarize(r.table_name, data);
            return (
              <li
                key={r.id}
                className="rounded-xl border bg-card px-3 py-2 flex items-start gap-2"
              >
                <Icon className={`h-4 w-4 mt-0.5 ${tone}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">
                      {TABLE_LABELS[r.table_name] ?? r.table_name}
                    </span>
                    {" · "}
                    <span className="text-muted-foreground">{summary}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.created_at ? formatDateShort(r.created_at) : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function summarize(table: string, data: Record<string, unknown>): string {
  if (table === "invoices") {
    return `${data.doc_number ?? ""} · ${data.total ?? ""} ₪ · ${data.status ?? ""}`;
  }
  if (table === "change_orders") {
    return `${data.title ?? ""} · ${data.amount_change ?? ""} ₪ · ${data.status ?? ""}`;
  }
  if (table === "payments") {
    return `${data.direction === "in" ? "נכנס" : "יוצא"} · ${data.amount ?? ""} ₪`;
  }
  if (table === "expenses") {
    return `${data.category ?? ""} · ${data.amount ?? ""} ₪`;
  }
  return "";
}
