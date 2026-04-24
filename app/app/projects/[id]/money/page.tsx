import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getProjectLabor } from "@/lib/labor";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyTabs } from "./money-tabs";

export default async function MoneyPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, contract_value")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const [expRes, payRes, contactsRes, labor] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, amount, category, supplier_contact_id, receipt_photo_url, paid_by, payment_method, expense_date, notes, paid_at, created_at"
      )
      .eq("project_id", params.id)
      .order("expense_date", { ascending: false }),
    supabase
      .from("payments")
      .select(
        "id, direction, amount, counterparty_contact_id, payment_date, method, invoice_number, notes, created_at"
      )
      .eq("project_id", params.id)
      .order("payment_date", { ascending: false }),
    supabase
      .from("contacts")
      .select("id, name, role, trade, phone")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    getProjectLabor(supabase, params.id),
  ]);

  const expenses = expRes.data ?? [];
  const payments = payRes.data ?? [];
  const contacts = contactsRes.data ?? [];

  // Incoming client payments live in the "תקבולים" tab. Outgoing payments
  // are legacy: the UI no longer creates them, but we still surface old
  // rows as paid-expense entries so users can see/delete them.
  const receipts = payments.filter((p) => p.direction === "in");
  const legacyOut = payments.filter((p) => p.direction === "out");

  // Exclude labor-category expenses linked to a worker — they're already
  // inside labor.totalLaborGross, and their effect is reflected in the
  // per-worker `outstanding` calculation.
  const nonLaborExpenses = expenses.filter((e) => !labor.laborExpenseIds.has(e.id));
  const legacyOutTotal = legacyOut.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses =
    nonLaborExpenses.reduce((s, e) => s + Number(e.amount), 0) +
    labor.totalLaborGross +
    legacyOutTotal;
  const totalOutstanding =
    nonLaborExpenses
      .filter((e) => !e.paid_at)
      .reduce((s, e) => s + Number(e.amount), 0) +
    labor.outstanding.reduce((s, l) => s + l.outstandingAmount, 0);
  const paymentsIn = receipts.reduce((s, p) => s + Number(p.amount), 0);
  const budget = Number(project.contract_value ?? 0);
  const remaining = budget ? budget - totalExpenses : null;

  return (
    <div className="container py-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KPI label="תקציב" value={budget ? formatCurrency(budget) : "—"} tone="muted" />
        <KPI label="הוצא" value={formatCurrency(totalExpenses)} tone="warning" />
        <KPI
          label="נותר"
          value={remaining != null ? formatCurrency(remaining) : "—"}
          tone={remaining != null && remaining < 0 ? "destructive" : "success"}
        />
        <KPI
          label="חוב פתוח"
          value={formatCurrency(totalOutstanding)}
          tone={totalOutstanding > 0 ? "warning" : "muted"}
        />
        <KPI label="התקבל מלקוח" value={formatCurrency(paymentsIn)} tone="success" />
      </div>

      <MoneyTabs
        projectId={params.id}
        expenses={expenses}
        receipts={receipts}
        legacyOut={legacyOut}
        contacts={contacts}
        outstandingLabor={labor.outstanding}
        settledLabor={labor.settled}
      />
    </div>
  );
}

function KPI({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-semibold ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
