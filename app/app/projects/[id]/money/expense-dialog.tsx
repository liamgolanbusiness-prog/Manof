"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { AlertCircle, Camera, Loader2, Plus, Sparkles } from "lucide-react";
import { createExpense } from "./actions";
import { uploadReceipt } from "../today/upload-client";
import { useToast } from "@/components/ui/use-toast";
import { isoDate } from "@/lib/format";
import { ContactDialog } from "@/app/app/contacts/contact-dialog";

const EXPENSE_CATEGORIES = [
  { value: "materials", label: "חומרים" },
  { value: "labor", label: "עבודה" },
  { value: "subcontractor", label: "קבלן משנה" },
  { value: "tools", label: "כלים" },
  { value: "transport", label: "הובלה" },
  { value: "permits", label: "רישוי / אישורים" },
  { value: "rent", label: "שכ״ד ציוד" },
  { value: "other", label: "אחר" },
];

// Map the Hebrew category_hint returned by the OCR model to our internal keys.
const CATEGORY_HINTS: Record<string, string> = {
  "חומרי בניין": "materials",
  "חומרים": "materials",
  "עבודה": "labor",
  "כלים": "tools",
  "דלק": "transport",
  "הובלה": "transport",
  "רישוי": "permits",
  "משרד": "other",
  "אוכל": "other",
  "אחר": "other",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "מזומן" },
  { value: "bit", label: "BIT" },
  { value: "bank", label: "העברה בנקאית" },
  { value: "card", label: "כרטיס" },
  { value: "check", label: "צ׳ק" },
  { value: "credit", label: "אשראי / חובה" },
];

type Contact = { id: string; name: string; role: string; trade: string | null };

export function ExpenseDialog({
  projectId,
  contacts,
  trigger,
}: {
  projectId: string;
  contacts: Contact[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUploading] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("materials");
  const [supplierId, setSupplierId] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [expenseDate, setExpenseDate] = useState(isoDate());
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const supplierOptions = contacts.filter((c) =>
    ["supplier", "subcontractor", "worker", "other"].includes(c.role)
  );

  function reset() {
    setAmount("");
    setCategory("materials");
    setSupplierId("");
    setMethod("cash");
    setExpenseDate(isoDate());
    setNotes("");
    setReceiptUrl(null);
    setError(null);
  }

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        await createExpense({
          projectId,
          amount,
          category,
          supplier_contact_id: supplierId || null,
          receipt_photo_url: receiptUrl,
          paid_by: null,
          payment_method: method || null,
          expense_date: expenseDate,
          notes: notes.trim() || null,
        });
        toast({ title: "נשמר", variant: "success" });
        reset();
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleFile(file: File) {
    startUploading(async () => {
      try {
        // Upload and run OCR in parallel — OCR uses the raw file (OCR server
        // compresses internally if needed), upload uses the compressed copy.
        const [url, ocrRes] = await Promise.all([
          uploadReceipt(projectId, file),
          runOcr(file),
        ]);
        setReceiptUrl(url);
        if (ocrRes) applyOcrFields(ocrRes);
      } catch (e) {
        toast({ title: `העלאה נכשלה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  async function runOcr(file: File): Promise<Record<string, unknown> | null> {
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/ai/ocr-receipt", { method: "POST", body: fd });
      if (res.status === 503) return null; // OCR not configured — silent
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, unknown>;
      return data;
    } catch {
      return null;
    }
  }

  function applyOcrFields(fields: Record<string, unknown>) {
    let filled = 0;
    if (typeof fields.amount === "number" && fields.amount > 0) {
      setAmount(String(fields.amount));
      filled++;
    }
    if (typeof fields.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
      setExpenseDate(fields.date);
      filled++;
    }
    if (typeof fields.category_hint === "string") {
      const mapped = CATEGORY_HINTS[fields.category_hint];
      if (mapped) {
        setCategory(mapped);
        filled++;
      }
    }
    if (typeof fields.supplier_name === "string" && fields.supplier_name) {
      // Try to match an existing contact by name (case-insensitive partial).
      const hit = contacts.find(
        (c) =>
          c.name.toLowerCase().includes((fields.supplier_name as string).toLowerCase()) ||
          (fields.supplier_name as string).toLowerCase().includes(c.name.toLowerCase())
      );
      if (hit) {
        setSupplierId(hit.id);
        filled++;
      }
    }
    const extraNotes: string[] = [];
    if (typeof fields.supplier_name === "string" && !contacts.find((c) => c.name === fields.supplier_name)) {
      extraNotes.push(`ספק: ${fields.supplier_name}`);
    }
    if (typeof fields.invoice_number === "string" && fields.invoice_number) {
      extraNotes.push(`חשבונית ${fields.invoice_number}`);
    }
    if (extraNotes.length > 0) {
      setNotes((prev) => [prev, ...extraNotes].filter(Boolean).join("\n"));
    }
    if (filled > 0) {
      toast({
        title: `סרוק — מולאו ${filled} שדות${fields.confidence ? ` (${fields.confidence})` : ""}`,
        variant: "success",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוצאה חדשה</DialogTitle>
          <DialogDescription>חומר, עבודה, כלים — כל כסף שיצא.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-amount">סכום (₪) *</Label>
              <Input
                id="e-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="למשל: 850"
              />
            </div>
            <div className="space-y-1.5">
              <Label>קטגוריה *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>ספק / קבלן משנה</Label>
              <ContactDialog
                defaultRole="supplier"
                trigger={
                  <button className="text-xs text-primary hover:underline">+ ספק חדש</button>
                }
                onCreated={(id) => {
                  setSupplierId(id);
                  router.refresh();
                }}
              />
            </div>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="ללא / לא מאנשי הקשר" />
              </SelectTrigger>
              <SelectContent>
                {supplierOptions.length === 0 ? (
                  <SelectItem value="none" disabled>
                    אין ספקים שמורים
                  </SelectItem>
                ) : (
                  supplierOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.trade ? ` · ${c.trade}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>שיטת תשלום</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-date">תאריך</Label>
              <Input
                id="e-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              קבלה / חשבונית
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-label="סריקה אוטומטית" />
            </Label>
            <div className="flex items-center gap-2">
              <label className="tap inline-flex items-center gap-2 rounded-lg border bg-background px-3 h-11 text-sm cursor-pointer hover:bg-muted">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {receiptUrl ? "החלף" : "צלם/סרוק קבלה"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
              {receiptUrl ? (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  תצוגה מקדימה
                </a>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              נסה לצלם קבלה — נמלא אוטומטית את הסכום, הספק והתאריך.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-notes">הערות</Label>
            <Textarea
              id="e-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error ? (
            <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !amount} className="tap">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            שמור הוצאה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
