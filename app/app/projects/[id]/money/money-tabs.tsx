"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Receipt, Banknote, ArrowUpRight, ArrowDownLeft, ExternalLink, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ExpenseDialog } from "./expense-dialog";
import { PaymentDialog } from "./payment-dialog";
import { deleteExpense, deletePayment } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

type Expense = {
  id: string;
  amount: number;
  category: string;
  supplier_contact_id: string | null;
  receipt_photo_url: string | null;
  paid_by: string | null;
  payment_method: string | null;
  expense_date: string;
  notes: string | null;
};
type Payment = {
  id: string;
  direction: string;
  amount: number;
  counterparty_contact_id: string | null;
  payment_date: string;
  method: string | null;
  invoice_number: string | null;
  notes: string | null;
};
type Contact = { id: string; name: string; role: string; trade: string | null; phone: string | null };

export function MoneyTabs({
  projectId,
  expenses,
  payments,
  contacts,
}: {
  projectId: string;
  expenses: Expense[];
  payments: Payment[];
  contacts: Contact[];
}) {
  const [tab, setTab] = useState<"expenses" | "payments">("expenses");
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "expenses" | "payments")}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="expenses">הוצאות ({expenses.length})</TabsTrigger>
          <TabsTrigger value="payments">תשלומים ({payments.length})</TabsTrigger>
        </TabsList>
        {tab === "expenses" ? (
          <ExpenseDialog
            projectId={projectId}
            contacts={contacts}
            trigger={
              <Button size="sm" className="tap gap-1">
                <Plus className="h-4 w-4" />
                הוצאה
              </Button>
            }
          />
        ) : (
          <PaymentDialog
            projectId={projectId}
            contacts={contacts}
            trigger={
              <Button size="sm" className="tap gap-1">
                <Plus className="h-4 w-4" />
                תשלום
              </Button>
            }
          />
        )}
      </div>

      <TabsContent value="expenses" className="mt-3">
        <ExpenseList projectId={projectId} expenses={expenses} contacts={contacts} />
      </TabsContent>
      <TabsContent value="payments" className="mt-3">
        <PaymentList projectId={projectId} payments={payments} contacts={contacts} />
      </TabsContent>
    </Tabs>
  );
}

const EXPENSE_CATEGORIES: Record<string, string> = {
  materials: "חומרים",
  labor: "עבודה",
  subcontractor: "קבלן משנה",
  tools: "כלים",
  transport: "הובלה",
  permits: "רישוי / אישורים",
  rent: "שכ״ד ציוד",
  other: "אחר",
};

function ExpenseList({
  projectId,
  expenses,
  contacts,
}: {
  projectId: string;
  expenses: Expense[];
  contacts: Contact[];
}) {
  const contactsById = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const { toast } = useToast();
  const router = useRouter();

  if (expenses.length === 0) {
    return (
      <EmptyState icon={Receipt} title="עדיין אין הוצאות">
        רשום כל חומר, עבודה או כלי — כולל תמונת קבלה.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {expenses.map((e) => (
            <li key={e.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(Number(e.amount))}</span>
                  <span className="text-xs text-muted-foreground">
                    · {EXPENSE_CATEGORIES[e.category] ?? e.category}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {[
                    e.supplier_contact_id
                      ? contactsById[e.supplier_contact_id]?.name
                      : null,
                    e.payment_method,
                    formatDateShort(e.expense_date),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {e.notes ? (
                  <div className="text-xs text-muted-foreground truncate">{e.notes}</div>
                ) : null}
              </div>
              {e.receipt_photo_url ? (
                <a
                  href={e.receipt_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="קבלה"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              <button
                type="button"
                className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
                aria-label="מחק"
                onClick={async () => {
                  if (!confirm("למחוק את ההוצאה?")) return;
                  try {
                    await deleteExpense(projectId, e.id);
                    router.refresh();
                  } catch (err) {
                    toast({ title: (err as Error).message, variant: "destructive" });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PaymentList({
  projectId,
  payments,
  contacts,
}: {
  projectId: string;
  payments: Payment[];
  contacts: Contact[];
}) {
  const contactsById = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const { toast } = useToast();
  const router = useRouter();

  if (payments.length === 0) {
    return (
      <EmptyState icon={Banknote} title="עדיין אין תשלומים">
        תיעוד של כסף שנכנס מהלקוח ושיצא לעובדים ולספקים.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {payments.map((p) => {
            const isIn = p.direction === "in";
            return (
              <li key={p.id} className="p-3 flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${
                    isIn ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}
                >
                  {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isIn ? "text-success" : ""}`}>
                      {isIn ? "+" : "-"}
                      {formatCurrency(Number(p.amount))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isIn ? "התקבל" : "יצא"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[
                      p.counterparty_contact_id
                        ? contactsById[p.counterparty_contact_id]?.name
                        : null,
                      p.method,
                      formatDateShort(p.payment_date),
                      p.invoice_number ? `חשבונית ${p.invoice_number}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {p.notes ? (
                    <div className="text-xs text-muted-foreground truncate">{p.notes}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
                  aria-label="מחק"
                  onClick={async () => {
                    if (!confirm("למחוק את התשלום?")) return;
                    try {
                      await deletePayment(projectId, p.id);
                      router.refresh();
                    } catch (err) {
                      toast({ title: (err as Error).message, variant: "destructive" });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
