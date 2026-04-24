"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Receipt,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Trash2,
  Download,
  HardHat,
  Check,
  Undo2,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ExpenseDialog } from "./expense-dialog";
import { PaymentDialog } from "./payment-dialog";
import {
  deleteExpense,
  deletePayment,
  deleteWorkerPayment,
  markExpensePaid,
  settleWorker,
} from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { OutstandingLabor, SettledLabor } from "@/lib/labor";

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
  paid_at: string | null;
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
type Contact = {
  id: string;
  name: string;
  role: string;
  trade: string | null;
  phone: string | null;
};

export function MoneyTabs({
  projectId,
  expenses,
  receipts,
  legacyOut,
  contacts,
  outstandingLabor,
  settledLabor,
}: {
  projectId: string;
  expenses: Expense[];
  receipts: Payment[];
  legacyOut: Payment[];
  contacts: Contact[];
  outstandingLabor: OutstandingLabor[];
  settledLabor: SettledLabor[];
}) {
  const [tab, setTab] = useState<"expenses" | "receipts">("expenses");
  const unpaidCount =
    expenses.filter((e) => !e.paid_at).length + outstandingLabor.length;
  const paidCount =
    expenses.filter((e) => e.paid_at).length +
    settledLabor.length +
    legacyOut.length;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "expenses" | "receipts")}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="expenses">
            הוצאות ({unpaidCount + paidCount})
          </TabsTrigger>
          <TabsTrigger value="receipts">תקבולים ({receipts.length})</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-1">
          <a
            href={`/api/projects/${projectId}/export?kind=${
              tab === "receipts" ? "payments" : "expenses"
            }`}
            download
            className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="הורד CSV"
            title="הורד CSV"
          >
            <Download className="h-4 w-4" />
          </a>
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
                  תקבול
                </Button>
              }
            />
          )}
        </div>
      </div>

      <TabsContent value="expenses" className="mt-3">
        <ExpenseList
          projectId={projectId}
          expenses={expenses}
          contacts={contacts}
          outstandingLabor={outstandingLabor}
          settledLabor={settledLabor}
          legacyOut={legacyOut}
          unpaidCount={unpaidCount}
          paidCount={paidCount}
        />
      </TabsContent>
      <TabsContent value="receipts" className="mt-3">
        <ReceiptList projectId={projectId} receipts={receipts} contacts={contacts} />
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
  outstandingLabor,
  settledLabor,
  legacyOut,
  unpaidCount,
  paidCount,
}: {
  projectId: string;
  expenses: Expense[];
  contacts: Contact[];
  outstandingLabor: OutstandingLabor[];
  settledLabor: SettledLabor[];
  legacyOut: Payment[];
  unpaidCount: number;
  paidCount: number;
}) {
  const contactsById = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.id, c])),
    [contacts]
  );
  const [filter, setFilter] = useState<"unpaid" | "paid">("unpaid");
  const { toast } = useToast();
  const router = useRouter();

  const unpaidExpenses = expenses.filter((e) => !e.paid_at);
  const paidExpenses = expenses.filter((e) => e.paid_at);

  async function run<T>(fn: () => Promise<T>) {
    try {
      await fn();
      router.refresh();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  }

  const isEmpty =
    filter === "unpaid"
      ? unpaidExpenses.length + outstandingLabor.length === 0
      : paidExpenses.length + settledLabor.length + legacyOut.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        <FilterPill
          active={filter === "unpaid"}
          onClick={() => setFilter("unpaid")}
          label={`לא שולם (${unpaidCount})`}
        />
        <FilterPill
          active={filter === "paid"}
          onClick={() => setFilter("paid")}
          label={`שולם (${paidCount})`}
        />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title={filter === "unpaid" ? "אין חובות פתוחים" : "עדיין לא סומנו כשולמו"}
        >
          {filter === "unpaid"
            ? "הוצאות שלא סומנו כשולמו ושכר שלא סגרת יופיעו כאן."
            : "סמן הוצאה כשולמה או סגור חודש לעובד כדי שהפריט יופיע כאן."}
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {filter === "unpaid" ? (
                <>
                  {outstandingLabor.map((l) => (
                    <LaborRow
                      key={`labor-${l.contactId}`}
                      labor={l}
                      onSettle={() =>
                        run(() =>
                          settleWorker({
                            projectId,
                            contactId: l.contactId,
                            periodStart: l.periodStart,
                            periodEnd: l.periodEnd,
                            amount: l.outstandingAmount,
                          })
                        )
                      }
                    />
                  ))}
                  {unpaidExpenses.map((e) => (
                    <ExpenseRow
                      key={e.id}
                      expense={e}
                      contactsById={contactsById}
                      onMarkPaid={() =>
                        run(() => markExpensePaid(projectId, e.id, true))
                      }
                      onDelete={() => {
                        if (!confirm("למחוק את ההוצאה?")) return;
                        run(() => deleteExpense(projectId, e.id));
                      }}
                    />
                  ))}
                </>
              ) : (
                <>
                  {settledLabor.map((s) => (
                    <SettledLaborRow
                      key={`wp-${s.id}`}
                      settled={s}
                      onUndo={() => {
                        if (!confirm("לבטל את סגירת החודש?")) return;
                        run(() => deleteWorkerPayment(projectId, s.id));
                      }}
                    />
                  ))}
                  {legacyOut.map((p) => (
                    <LegacyOutRow
                      key={`out-${p.id}`}
                      payment={p}
                      contactsById={contactsById}
                      onDelete={() => {
                        if (!confirm("למחוק את התשלום?")) return;
                        run(() => deletePayment(projectId, p.id));
                      }}
                    />
                  ))}
                  {paidExpenses.map((e) => (
                    <ExpenseRow
                      key={e.id}
                      expense={e}
                      contactsById={contactsById}
                      onMarkUnpaid={() =>
                        run(() => markExpensePaid(projectId, e.id, false))
                      }
                      onDelete={() => {
                        if (!confirm("למחוק את ההוצאה?")) return;
                        run(() => deleteExpense(projectId, e.id));
                      }}
                    />
                  ))}
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap px-3 h-8 text-sm rounded-md transition-colors ${
        active ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ExpenseRow({
  expense: e,
  contactsById,
  onMarkPaid,
  onMarkUnpaid,
  onDelete,
}: {
  expense: Expense;
  contactsById: Record<string, Contact>;
  onMarkPaid?: () => void;
  onMarkUnpaid?: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="p-3 flex items-center gap-3">
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
      {onMarkPaid && (
        <button
          type="button"
          className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-success hover:bg-success/10"
          aria-label="סמן כשולם"
          title="סמן כשולם"
          onClick={onMarkPaid}
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      {onMarkUnpaid && (
        <button
          type="button"
          className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="בטל סימון"
          title="בטל סימון"
          onClick={onMarkUnpaid}
        >
          <Undo2 className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
        aria-label="מחק"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function LaborRow({
  labor: l,
  onSettle,
}: {
  labor: OutstandingLabor;
  onSettle: () => void;
}) {
  const unitLabel =
    l.payType === "daily" ? `${l.units} ימים` : `${l.units} שעות`;
  return (
    <li className="p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning grid place-items-center shrink-0">
        <HardHat className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatCurrency(l.outstandingAmount)}
          </span>
          <span className="text-xs text-muted-foreground">· שכר עובד</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {[
            l.contactName,
            `${unitLabel} × ${formatCurrency(l.rate)}`,
            `${formatDateShort(l.periodStart)}–${formatDateShort(l.periodEnd)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="tap"
        onClick={onSettle}
      >
        סגור חודש
      </Button>
    </li>
  );
}

function SettledLaborRow({
  settled: s,
  onUndo,
}: {
  settled: SettledLabor;
  onUndo: () => void;
}) {
  return (
    <li className="p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-success/10 text-success grid place-items-center shrink-0">
        <HardHat className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatCurrency(s.amount)}</span>
          <span className="text-xs text-muted-foreground">· שכר עובד</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {[
            s.contactName,
            `${formatDateShort(s.periodStart)}–${formatDateShort(s.periodEnd)}`,
            `שולם ${formatDateShort(s.paidAt)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <button
        type="button"
        className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
        aria-label="בטל"
        title="בטל"
        onClick={onUndo}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function LegacyOutRow({
  payment: p,
  contactsById,
  onDelete,
}: {
  payment: Payment;
  contactsById: Record<string, Contact>;
  onDelete: () => void;
}) {
  return (
    <li className="p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning grid place-items-center shrink-0">
        <ArrowUpRight className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
          <span className="text-xs text-muted-foreground">· תשלום יוצא</span>
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
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function ReceiptList({
  projectId,
  receipts,
  contacts,
}: {
  projectId: string;
  receipts: Payment[];
  contacts: Contact[];
}) {
  const contactsById = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const { toast } = useToast();
  const router = useRouter();

  if (receipts.length === 0) {
    return (
      <EmptyState icon={Banknote} title="עדיין אין תקבולים">
        תיעוד של כסף שנכנס מהלקוח — מקדמות, תשלומי ביניים וסגירת חשבון.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {receipts.map((p) => (
            <li key={p.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 text-success grid place-items-center shrink-0">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-success">
                    +{formatCurrency(Number(p.amount))}
                  </span>
                  <span className="text-xs text-muted-foreground">התקבל</span>
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
                  <div className="text-xs text-muted-foreground truncate">
                    {p.notes}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
                aria-label="מחק"
                onClick={async () => {
                  if (!confirm("למחוק את התקבול?")) return;
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
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
