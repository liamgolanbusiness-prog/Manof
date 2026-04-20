import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type OutstandingLabor = {
  contactId: string;
  contactName: string;
  payType: string | null;
  rate: number;
  units: number;
  grossAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  periodStart: string;
  periodEnd: string;
};

export type SettledLabor = {
  id: string;
  contactId: string;
  contactName: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
  notes: string | null;
};

type Client = SupabaseClient<Database>;

// Returns per-worker labor accrual for a project, plus the full list of
// settlement rows already written. Labor amount is computed using the
// worker's current pay_rate. "daily" pay_type counts any attendance row
// with hours > 0 as one day; anything else is treated as hourly.
export async function getProjectLabor(supabase: Client, projectId: string) {
  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id, report_date")
    .eq("project_id", projectId);

  const reportIds = (reports ?? []).map((r) => r.id);
  const reportDateById = new Map<string, string>();
  for (const r of reports ?? []) reportDateById.set(r.id, r.report_date);

  const [paymentsRes, membersRes, laborExpensesRes] = await Promise.all([
    supabase
      .from("worker_payments")
      .select("id, contact_id, period_start, period_end, amount, paid_at, notes")
      .eq("project_id", projectId)
      .order("paid_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("contact_id")
      .eq("project_id", projectId),
    supabase
      .from("expenses")
      .select("id, supplier_contact_id, amount, category")
      .eq("project_id", projectId)
      .eq("category", "labor")
      .not("supplier_contact_id", "is", null),
  ]);

  const members = membersRes.data ?? [];
  const memberContactIds = members.map((m) => m.contact_id);

  let attendance: Array<{
    hours_worked: number | null;
    contact_id: string;
    daily_report_id: string;
  }> = [];
  if (reportIds.length) {
    const { data } = await supabase
      .from("attendance")
      .select("hours_worked, contact_id, daily_report_id")
      .in("daily_report_id", reportIds);
    attendance = data ?? [];
  }

  let workerContacts: Array<{
    id: string;
    name: string;
    pay_rate: number | null;
    pay_type: string | null;
  }> = [];
  if (memberContactIds.length) {
    const { data } = await supabase
      .from("contacts")
      .select("id, name, pay_rate, pay_type")
      .in("id", memberContactIds);
    workerContacts = data ?? [];
  }

  const payments = paymentsRes.data ?? [];
  const memberById = new Map<
    string,
    { id: string; name: string; pay_rate: number | null; pay_type: string | null }
  >();
  for (const c of workerContacts) memberById.set(c.id, c);

  type Bucket = {
    hours: number;
    days: number;
    earliest: string | null;
    latest: string | null;
  };
  const buckets = new Map<string, Bucket>();
  for (const row of attendance) {
    const hours = Number(row.hours_worked ?? 0);
    if (!(hours > 0)) continue;
    const date = reportDateById.get(row.daily_report_id) ?? null;
    const b = buckets.get(row.contact_id) ?? {
      hours: 0,
      days: 0,
      earliest: null,
      latest: null,
    };
    b.hours += hours;
    b.days += 1;
    if (date) {
      if (!b.earliest || date < b.earliest) b.earliest = date;
      if (!b.latest || date > b.latest) b.latest = date;
    }
    buckets.set(row.contact_id, b);
  }

  const paidByContact = new Map<string, number>();
  for (const p of payments) {
    paidByContact.set(
      p.contact_id,
      (paidByContact.get(p.contact_id) ?? 0) + Number(p.amount)
    );
  }
  // Labor-category expenses linked to a worker count as partial payment.
  const laborExpenseIds = new Set<string>();
  let laborExpenseTotal = 0;
  for (const e of laborExpensesRes.data ?? []) {
    if (!e.supplier_contact_id) continue;
    paidByContact.set(
      e.supplier_contact_id,
      (paidByContact.get(e.supplier_contact_id) ?? 0) + Number(e.amount)
    );
    laborExpenseIds.add(e.id);
    laborExpenseTotal += Number(e.amount);
  }

  const outstanding: OutstandingLabor[] = [];
  for (const [contactId, b] of buckets) {
    const worker = memberById.get(contactId);
    if (!worker) continue;
    const rate = Number(worker.pay_rate ?? 0);
    if (!(rate > 0)) continue;
    const payType = worker.pay_type ?? "hourly";
    const units = payType === "daily" ? b.days : b.hours;
    const grossAmount = units * rate;
    const paidAmount = paidByContact.get(contactId) ?? 0;
    const outstandingAmount = Math.max(0, grossAmount - paidAmount);
    if (outstandingAmount <= 0) continue;
    outstanding.push({
      contactId,
      contactName: worker.name,
      payType,
      rate,
      units,
      grossAmount,
      paidAmount,
      outstandingAmount,
      periodStart: b.earliest ?? new Date().toISOString().slice(0, 10),
      periodEnd: b.latest ?? new Date().toISOString().slice(0, 10),
    });
  }
  outstanding.sort((a, b) => b.outstandingAmount - a.outstandingAmount);

  const contactNameById = new Map<string, string>();
  for (const c of workerContacts) contactNameById.set(c.id, c.name);
  const settled: SettledLabor[] = payments.map((p) => ({
    id: p.id,
    contactId: p.contact_id,
    contactName: contactNameById.get(p.contact_id) ?? "עובד",
    amount: Number(p.amount),
    periodStart: p.period_start,
    periodEnd: p.period_end,
    paidAt: p.paid_at,
    notes: p.notes,
  }));

  const totalLaborGross = Array.from(buckets.entries()).reduce(
    (sum, [contactId, b]) => {
      const w = memberById.get(contactId);
      if (!w) return sum;
      const rate = Number(w.pay_rate ?? 0);
      if (!(rate > 0)) return sum;
      const units = (w.pay_type ?? "hourly") === "daily" ? b.days : b.hours;
      return sum + units * rate;
    },
    0
  );

  return {
    outstanding,
    settled,
    totalLaborGross,
    // IDs of expenses that are already counted inside totalLaborGross, so the
    // caller can avoid double-counting when summing expenses + labor.
    laborExpenseIds,
    laborExpenseTotal,
  };
}
