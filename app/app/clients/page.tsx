import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UsersRound, Plus, Phone, Pencil, Briefcase } from "lucide-react";
import { ClientDialog } from "./client-dialog";
import { formatCurrency } from "@/lib/format";
import { formatIsraeliPhone } from "@/lib/phone";

export default async function ClientsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const [{ data: clients }, { data: projects }, { data: invoices }, { data: payments }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, phone, email, tax_id, billing_address, notes")
        .eq("user_id", user.id)
        .order("name", { ascending: true }),
      supabase
        .from("projects")
        .select("id, client_id, status")
        .eq("user_id", user.id),
      supabase
        .from("invoices")
        .select("project_id, total, status, type")
        .eq("user_id", user.id)
        .in("type", ["tax_invoice", "tax_receipt"])
        .neq("status", "cancelled")
        .neq("status", "draft"),
      supabase
        .from("payments")
        .select("project_id, direction, amount")
        .eq("user_id", user.id)
        .eq("direction", "in"),
    ]);

  const list = clients ?? [];
  const projs = projects ?? [];

  const projectsByClient = new Map<string, { total: number; active: number }>();
  const projectIdToClient = new Map<string, string>();
  for (const p of projs) {
    if (p.client_id) projectIdToClient.set(p.id, p.client_id);
    if (!p.client_id) continue;
    const b = projectsByClient.get(p.client_id) ?? { total: 0, active: 0 };
    b.total += 1;
    if (p.status === "active") b.active += 1;
    projectsByClient.set(p.client_id, b);
  }

  const billedByClient = new Map<string, number>();
  for (const inv of invoices ?? []) {
    if (!inv.project_id) continue;
    const cid = projectIdToClient.get(inv.project_id);
    if (!cid) continue;
    billedByClient.set(cid, (billedByClient.get(cid) ?? 0) + Number(inv.total ?? 0));
  }
  const receivedByClient = new Map<string, number>();
  for (const p of payments ?? []) {
    if (!p.project_id) continue;
    const cid = projectIdToClient.get(p.project_id);
    if (!cid) continue;
    receivedByClient.set(cid, (receivedByClient.get(cid) ?? 0) + Number(p.amount));
  }

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <ClientDialog
          trigger={
            <Button size="sm" className="tap gap-1">
              <Plus className="h-4 w-4" />
              לקוח
            </Button>
          }
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="עדיין אין לקוחות"
          action={
            <ClientDialog
              trigger={<Button size="lg" className="tap">הוסף לקוח ראשון</Button>}
            />
          }
        >
          לקוחות הם מי שמשלמים לך. חשבוניות, פורטל הלקוח ותקבולים נקשרים כאן.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((c) => {
            const stats = projectsByClient.get(c.id) ?? { total: 0, active: 0 };
            const billed = billedByClient.get(c.id) ?? 0;
            const received = receivedByClient.get(c.id) ?? 0;
            const open = Math.max(0, billed - received);
            return (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[
                          c.phone ? formatIsraeliPhone(c.phone) : null,
                          c.email,
                          c.tax_id ? `ח.פ ${c.tax_id}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {c.phone ? (
                        <Link
                          href={`tel:${c.phone}`}
                          className="tap grid place-items-center h-9 w-9 rounded-lg text-primary hover:bg-primary/10"
                          aria-label={`התקשר ל-${c.name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </Link>
                      ) : null}
                      <ClientDialog
                        existing={c}
                        trigger={
                          <button
                            className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted"
                            aria-label="ערוך"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat
                      icon={<Briefcase className="h-3 w-3" />}
                      label="פרויקטים"
                      value={`${stats.total}${stats.active ? ` (${stats.active} פעילים)` : ""}`}
                    />
                    <Stat label="חויב" value={billed ? formatCurrency(billed) : "—"} />
                    <Stat
                      label="פתוח"
                      value={open ? formatCurrency(open) : "—"}
                      tone={open > 0 ? "warning" : "muted"}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "muted" | "warning";
}) {
  const toneClass = tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
