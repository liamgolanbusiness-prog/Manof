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
    // Sum payments out to each contact (supplier + subcontractor payouts)
    const { data: pays } = await supabase
      .from("payments")
      .select("counterparty_contact_id, amount, direction")
      .eq("project_id", params.id)
      .eq("direction", "out")
      .in("counterparty_contact_id", memberIds);
    for (const p of pays ?? []) {
      if (!p.counterparty_contact_id) continue;
      paidByContact.set(
        p.counterparty_contact_id,
        (paidByContact.get(p.counterparty_contact_id) ?? 0) + Number(p.amount)
      );
    }
  }

  const rows = (members ?? []).map((m) => ({
    member: m,
    contact: contactsById[m.contact_id],
    hours: hoursByContact.get(m.contact_id) ?? 0,
    paid: paidByContact.get(m.contact_id) ?? 0,
  }));

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
              {rows.map(({ member, contact, hours, paid }) => (
                <li key={member.id} className="p-4 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{contact?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[contact?.trade, member.role_in_project].filter(Boolean).join(" · ") ||
                        "—"}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{hours.toFixed(1)} שעות</span>
                      <span>שולם {formatCurrency(paid)}</span>
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
