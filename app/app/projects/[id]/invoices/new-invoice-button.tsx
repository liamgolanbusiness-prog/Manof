"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { INVOICE_TYPE_LABELS, type InvoiceType } from "@/lib/supabase/database.types";
import { computeTotals } from "@/lib/invoice";
import { formatCurrency } from "@/lib/format";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createInvoiceAction } from "./actions";

type ClientContact = {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  tax_id?: string | null;
  billing_address?: string | null;
};

type Line = {
  key: string;
  description: string;
  quantity: string;
  unit_price: string;
  unit: string;
};

function mkLine(partial: Partial<Line> = {}): Line {
  return {
    key: Math.random().toString(36).slice(2),
    description: "",
    quantity: "1",
    unit_price: "",
    unit: "",
    ...partial,
  };
}

export function NewInvoiceButton({
  projectId,
  projectClientName,
  projectClientPhone,
  projectContractValue,
  defaultVatRate,
  defaultVatIncluded,
  defaultFooter,
  clients,
}: {
  projectId: string;
  projectClientName: string;
  projectClientPhone: string;
  projectContractValue: number | null;
  defaultVatRate: number;
  defaultVatIncluded: boolean;
  defaultFooter: string;
  clients: ClientContact[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InvoiceType>("tax_invoice");
  const [clientName, setClientName] = useState(projectClientName);
  const [clientPhone, setClientPhone] = useState(projectClientPhone);
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [issueDate, setIssueDate] = useState(() => {
    // Local date — toISOString() is UTC and rolls over to "tomorrow" after
    // ~21:00 Israel time, which shows the wrong default in the date picker.
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [dueDate, setDueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [vatRate, setVatRate] = useState(String(defaultVatRate));
  const [vatIncluded, setVatIncluded] = useState(defaultVatIncluded);
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [footer, setFooter] = useState(defaultFooter);
  const [status, setStatus] = useState<"draft" | "issued">("draft");
  const [lines, setLines] = useState<Line[]>([
    mkLine({
      description: projectContractValue
        ? "עבודה לפי חוזה"
        : "",
      unit_price: projectContractValue ? String(projectContractValue) : "",
    }),
  ]);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const totals = useMemo(
    () =>
      computeTotals(
        lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unit_price: Number(l.unit_price) || 0,
        })),
        Number(vatRate) || 0,
        vatIncluded,
        Number(discount) || 0
      ),
    [lines, vatRate, vatIncluded, discount]
  );

  function addLine() {
    setLines((prev) => [...prev, mkLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function patchLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function onClientPick(val: string) {
    if (val === "__none__") return;
    const c = clients.find((x) => x.id === val);
    if (c) {
      setClientName(c.name);
      if (c.phone) setClientPhone(c.phone);
      if (c.email) setClientEmail(c.email);
      if (c.tax_id) setClientTaxId(c.tax_id);
      if (c.billing_address) setClientAddress(c.billing_address);
    }
  }

  function submit(statusOverride?: "draft" | "issued") {
    const finalStatus = statusOverride ?? status;
    startTransition(async () => {
      try {
        const res = await createInvoiceAction({
          project_id: projectId,
          type,
          client_name: clientName,
          client_tax_id: clientTaxId || undefined,
          client_address: clientAddress || undefined,
          client_email: clientEmail || undefined,
          client_phone: clientPhone || undefined,
          issue_date: issueDate,
          due_date: dueDate || undefined,
          valid_until: validUntil || undefined,
          vat_rate: Number(vatRate) || 0,
          vat_included: vatIncluded,
          discount_amount: Number(discount) || 0,
          notes,
          footer,
          status: finalStatus,
          items: lines.map((l) => ({
            description: l.description,
            quantity: Number(l.quantity) || 0,
            unit_price: Number(l.unit_price) || 0,
            unit: l.unit,
          })),
        });
        toast({ title: `נוצר ${res.doc_number}` });
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  const typeNeedsDueDate = type === "tax_invoice" || type === "tax_receipt";
  const typeIsQuote = type === "quote";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="tap gap-1">
          <Plus className="h-4 w-4" />
          מסמך חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>מסמך חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>סוג מסמך</Label>
            <Select value={type} onValueChange={(v) => setType(v as InvoiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tax_invoice">{INVOICE_TYPE_LABELS.tax_invoice}</SelectItem>
                <SelectItem value="tax_receipt">{INVOICE_TYPE_LABELS.tax_receipt}</SelectItem>
                <SelectItem value="receipt">{INVOICE_TYPE_LABELS.receipt}</SelectItem>
                <SelectItem value="quote">{INVOICE_TYPE_LABELS.quote}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-3 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground">פרטי לקוח</div>
            {clients.length > 0 ? (
              <div className="space-y-1.5">
                <Label>בחירה מרשימת הלקוחות</Label>
                <Select onValueChange={onClientPick}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- בחר --" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldSlot label="שם *">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </FieldSlot>
              <FieldSlot label="ח.פ./ע.מ./ת.ז.">
                <Input
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                  dir="ltr"
                  inputMode="numeric"
                />
              </FieldSlot>
              <FieldSlot label="טלפון">
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  dir="ltr"
                  inputMode="tel"
                />
              </FieldSlot>
              <FieldSlot label="אימייל">
                <Input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  dir="ltr"
                  inputMode="email"
                  type="email"
                />
              </FieldSlot>
              <FieldSlot label="כתובת" className="sm:col-span-2">
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                />
              </FieldSlot>
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground">תאריכים</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldSlot label="תאריך הוצאה">
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </FieldSlot>
              {typeIsQuote ? (
                <FieldSlot label="בתוקף עד">
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </FieldSlot>
              ) : null}
              {typeNeedsDueDate ? (
                <FieldSlot label="תאריך פירעון">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </FieldSlot>
              ) : null}
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-muted-foreground">פריטים</div>
              <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4" />
                פריט
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.key} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-6">
                    <Input
                      placeholder="תיאור"
                      value={l.description}
                      onChange={(e) => patchLine(l.key, { description: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Input
                      placeholder="כמות"
                      value={l.quantity}
                      inputMode="decimal"
                      onChange={(e) => patchLine(l.key, { quantity: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Input
                      placeholder="יח׳"
                      value={l.unit}
                      onChange={(e) => patchLine(l.key, { unit: e.target.value })}
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <Input
                      placeholder="מחיר"
                      value={l.unit_price}
                      inputMode="decimal"
                      onChange={(e) => patchLine(l.key, { unit_price: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeLine(l.key)}
                      disabled={lines.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldSlot label="מע״מ %">
                <Input
                  value={vatRate}
                  inputMode="decimal"
                  onChange={(e) => setVatRate(e.target.value)}
                  dir="ltr"
                />
              </FieldSlot>
              <FieldSlot label="הנחה (₪)">
                <Input
                  value={discount}
                  inputMode="decimal"
                  onChange={(e) => setDiscount(e.target.value)}
                  dir="ltr"
                />
              </FieldSlot>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="vat_incl"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={vatIncluded}
                  onChange={(e) => setVatIncluded(e.target.checked)}
                />
                <Label htmlFor="vat_incl" className="cursor-pointer font-normal">
                  מחירים כוללים מע״מ
                </Label>
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">סה״כ לפני מע״מ</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">מע״מ ({vatRate}%)</span>
                <span>{formatCurrency(totals.vat_amount)}</span>
              </div>
              {Number(discount) > 0 ? (
                <div className="flex justify-between text-destructive">
                  <span>הנחה</span>
                  <span>-{formatCurrency(Number(discount))}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>סה״כ לתשלום</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>הערת תחתית (אופציונלי)</Label>
            <Textarea rows={2} value={footer} onChange={(e) => setFooter(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => submit("draft")}
            disabled={pending}
            className="tap"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            שמור כטיוטה
          </Button>
          <Button
            onClick={() => submit("issued")}
            disabled={pending}
            className="tap"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            הנפק {INVOICE_TYPE_LABELS[type]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldSlot({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
