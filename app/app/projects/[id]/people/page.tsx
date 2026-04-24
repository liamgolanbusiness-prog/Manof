import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { AddMemberButton } from "./add-member-button";
import { RemoveMemberButton } from "./remove-member-button";

export default async function PeopleTab({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: members } = await supabase
    .from("project_members")
    .select("id, contact_id, role_in_project, agreed_amount")
    .eq("project_id", params.id);

  const { data: allContacts } = await supabase
    .from("contacts")
    .select("id, name, phone, role, trade, pay_rate, pay_type")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const memberContactIds = new Set((members ?? []).map((m) => m.contact_id));
  const available = (allContacts ?? []).filter((c) => !memberContactIds.has(c.id));
  const contactsById = Object.fromEntries((allContacts ?? []).map((c) => [c.id, c]));

  // Aggregate hours across all reports for this project
  const memberIds = (members ?? []).map((m) => m.contact_id);
  let hoursByContact = new Map<string, number>();
  let paidByContact = new Map<string, number>();
  if (memberIds.length > 0) {
    // Get daily report ids for this project
    const { data: reports } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("project_id", params.id);
    const reportIds = (reports ?? []).map((r) => r.id);
    if (reportIds.length > 0) {
      const { data: atts } = await supabase
        .from("attendance")
        .select("contact_id, hours_worked")
        .in("daily_report_id", reportIds);
      for (const a of atts ?? []) {
        hoursByContact.set(
          a.contact_id,
          (hoursByContact.get(a.contact_id) ?? 0) + (a.hours_worked ?? 0)
        );
      }
    }
    // Sum what we actually paid each member across all three outlets:
    //   - worker_payments (month-close settlements)
    //   - expenses where the member is the supplier_contact_id
    //   - legacy direction='out' payments with them as counterparty
    const [{ data: wp }, { data: exp }, { data: pays }] = await Promise.all([
      supabase
        .from("worker_payments")
        .select("contact_id, amount")
        .eq("project_id", params.id)
        .in("contact_id", memberIds),
      supabase
        .from("expenses")
        .select("supplier_contact_id, amount")
        .eq("project_id", params.id)
        .not("paid_at", "is", null)
        .in("supplier_contact_id", memberIds),
      supabase
        .from("payments")
        .select("counterparty_contact_id, amount")
        .eq("project_id", params.id)
        .eq("direction", "out")
        .in("counterparty_contact_id", memberIds),
    ]);
    for (const w of wp ?? []) {
      paidByContact.set(
        w.contact_id,
        (paidByContact.get(w.contact_id) ?? 0) + Number(w.amount)
      );
    }
    for (const e of exp ?? []) {
      if (!e.supplier_contact_id) continue;
      paidByContact.set(
        e.supplier_contact_id,
        (paidByContact.get(e.supplier_contact_id) ?? 0) + Number(e.amount)
      );
    }
    for (const p of pays ?? []) {
      if (!p.counterparty_contact_id) continue;
      paidByContact.set(
        p.counterparty_contact_id,
        (paidByContact.get(p.counterparty_contact_id) ?? 0) + Number(p.amount)
      );
    }
  }

  const rows = (members ?? []).map((m) => {
    const contact = contactsById[m.contact_id];
    const hours = hoursByContact.get(m.contact_id) ?? 0;
    const paid = paidByContact.get(m.contact_id) ?? 0;
    const rate = Number(contact?.pay_rate ?? 0);
    // Gross = hours × rate (hourly) or days × rate (daily). Attendance logs
    // hours even for daily workers — we count days = distinct non-zero hours.
    // Keep it simple: use hours for hourly, 1 day per non-zero attendance for
    // daily. We only have aggregated hours here, so fall back to hours × rate
    // for both and let the money page do the precise per-day math.
    const gross = rate > 0 ? hours * rate : 0;
    return { member: m, contact, hours, paid, rate, gross };
  });

  return (
    <div className="container py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">אנשים בפרויקט ({rows.length})</h1>
        <AddMemberButton projectId={params.id} available={available} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="עדיין אין אנשים בפרויקט">
          הוסף עובדים או קבלני משנה שעובדים על הפרויקט — הם יופיעו ברשימת הנוכחות
          בדיווח היומי.
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {rows.map(({ member, contact, hours, paid, gross }) => (
                <li key={member.id} className="p-4 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{contact?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[contact?.trade, member.role_in_project].filter(Boolean).join(" · ") ||
                        "—"}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>{hours.toFixed(1)} שעות</span>
                      {gross > 0 ? <span>שכר: {formatCurrency(gross)}</span> : null}
                      <span>שולם: {formatCurrency(paid)}</span>
                      {gross > paid ? (
                        <span className="text-warning">
                          חוב: {formatCurrency(gross - paid)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <RemoveMemberButton projectId={params.id} memberId={member.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
