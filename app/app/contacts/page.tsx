import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Users, Plus, Phone, Pencil } from "lucide-react";
import { ContactDialog } from "./contact-dialog";
import { formatIsraeliPhone } from "@/lib/phone";

const ROLE_LABELS: Record<string, string> = {
  worker: "עובד",
  subcontractor: "קבלן משנה",
  supplier: "ספק",
  client: "לקוח",
  other: "אחר",
};

export default async function ContactsPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, phone, role, trade, pay_rate, pay_type, notes")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const list = contacts ?? [];

  // Group by role
  const groups: Record<string, typeof list> = {};
  for (const c of list) {
    const k = c.role || "other";
    (groups[k] ??= []).push(c);
  }
  const orderedKeys = ["worker", "subcontractor", "supplier", "client", "other"].filter(
    (k) => groups[k]
  );

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">אנשי קשר</h1>
        <ContactDialog trigger={<Button size="sm" className="tap gap-1"><Plus className="h-4 w-4" />איש קשר</Button>} />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="עדיין אין אנשי קשר"
          action={<ContactDialog trigger={<Button size="lg" className="tap">הוסף איש קשר ראשון</Button>} />}
        >
          עובדים, קבלני משנה, ספקים ולקוחות — כולם כאן במקום אחד. אפשר להוסיף אותם אחר כך
          לפרויקטים ספציפיים.
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {orderedKeys.map((role) => (
            <section key={role} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground px-1">
                {ROLE_LABELS[role] ?? role} · {groups[role].length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groups[role].map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border bg-card p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[c.trade, c.phone ? formatIsraeliPhone(c.phone) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {c.phone ? (
                        <Link
                          href={`tel:${c.phone}`}
                          className="tap grid place-items-center h-10 w-10 rounded-lg text-primary hover:bg-primary/10"
                          aria-label={`התקשר ל-${c.name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </Link>
                      ) : null}
                      <ContactDialog
                        existing={c}
                        trigger={
                          <button
                            className="tap grid place-items-center h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted"
                            aria-label="ערוך"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
