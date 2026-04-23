"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  createRecurringTemplateAction,
  deleteRecurringTemplateAction,
  toggleRecurringTemplateAction,
} from "./actions";

const FREQ_OPTIONS = [
  { value: "weekly", label: "שבועי" },
  { value: "biweekly", label: "כל שבועיים" },
  { value: "monthly", label: "חודשי" },
  { value: "quarterly", label: "רבעוני" },
  { value: "yearly", label: "שנתי" },
] as const;

const TYPE_OPTIONS = [
  { value: "tax_invoice", label: "חשבונית מס" },
  { value: "tax_receipt", label: "חשבונית מס-קבלה" },
] as const;

type Item = { description: string; quantity: number; unit_price: number; unit?: string };

type Template = {
  id: string;
  type: string;
  frequency: string;
  next_issue_date: string;
  active: boolean;
  client_name: string | null;
  items: unknown;
  last_issued_at: string | null;
};

type Project = { id: string; name: string };

export function RecurringManager({
  templates,
  projects,
}: {
  templates: Template[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("tax_invoice");
  const [frequency, setFrequency] = useState<string>("monthly");
  const [projectId, setProjectId] = useState<string>("");
  const [nextDate, setNextDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [clientName, setClientName] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [vatRate, setVatRate] = useState("18");
  const [vatIncluded, setVatIncluded] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const [pending, startPending] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function resetForm() {
    setType("tax_invoice");
    setFrequency("monthly");
    setProjectId("");
    setNextDate(new Date().toISOString().slice(0, 10));
    setClientName("");
    setClientTaxId("");
    setClientEmail("");
    setClientPhone("");
    setVatRate("18");
    setVatIncluded(false);
    setNotes("");
    setItems([{ description: "", quantity: 1, unit_price: 0 }]);
  }

  function submit() {
    startPending(async () => {
      try {
        await createRecurringTemplateAction({
          project_id: projectId || null,
          type,
          frequency,
          next_issue_date: nextDate,
          client_name: clientName,
          client_tax_id: clientTaxId,
          client_email: clientEmail,
          client_phone: clientPhone,
          vat_rate: Number(vatRate) || 18,
          vat_included: vatIncluded,
          notes,
          items,
        });
        toast({ title: "תבנית נוצרה" });
        setOpen(false);
        resetForm();
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  function withToast(fn: () => Promise<unknown>, ok: string) {
    startPending(async () => {
      try {
        await fn();
        toast({ title: ok });
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          תבנית חדשה
        </Button>
      ) : (
        <div className="space-y-3 rounded-xl bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סוג מסמך</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>תדירות</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                {FREQ_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>תאריך הנפקה הבא</Label>
              <Input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>פרויקט (אופציונלי)</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">— ללא —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>שם לקוח</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ח.פ. / ע.מ.</Label>
              <Input value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>טלפון</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>אימייל</Label>
              <Input
                type="email"
                dir="ltr"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>פריטים</Label>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-6"
                  placeholder="תיאור"
                  value={it.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  step="0.01"
                  placeholder="כמות"
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  className="col-span-3"
                  type="number"
                  step="0.01"
                  placeholder="מחיר יח׳"
                  value={it.unit_price}
                  onChange={(e) =>
                    updateItem(idx, { unit_price: Number(e.target.value) || 0 })
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="col-span-1 text-destructive"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4" />
              הוסף שורה
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>מע״מ %</Label>
              <Input
                type="number"
                step="0.01"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={vatIncluded}
                onChange={(e) => setVatIncluded(e.target.checked)}
              />
              המחיר כולל מע״מ
            </label>
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              שמור תבנית
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={pending}
            >
              ביטול
            </Button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין עדיין תבניות חוזרות.</p>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => {
            const typeLabel = TYPE_OPTIONS.find((x) => x.value === t.type)?.label ?? t.type;
            const freqLabel =
              FREQ_OPTIONS.find((x) => x.value === t.frequency)?.label ?? t.frequency;
            const itemCount = Array.isArray(t.items) ? t.items.length : 0;
            return (
              <li key={t.id} className="rounded-xl border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium flex-1 truncate">
                    {t.client_name ?? "—"}
                  </span>
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={t.active}
                      onChange={(e) =>
                        withToast(
                          () => toggleRecurringTemplateAction(t.id, e.target.checked),
                          e.target.checked ? "הופעל" : "הושבת"
                        )
                      }
                      disabled={pending}
                    />
                    פעיל
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (!confirm("למחוק תבנית?")) return;
                      withToast(() => deleteRecurringTemplateAction(t.id), "נמחק");
                    }}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {typeLabel} · {freqLabel} · {itemCount} פריטים · הנפקה הבאה:{" "}
                  {t.next_issue_date}
                  {t.last_issued_at
                    ? ` · הונפק לאחרונה: ${new Date(t.last_issued_at).toLocaleDateString("he-IL")}`
                    : ""}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
