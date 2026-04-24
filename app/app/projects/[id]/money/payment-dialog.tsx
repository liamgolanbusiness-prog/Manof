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
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { createPayment } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { isoDate } from "@/lib/format";

const PAYMENT_METHODS = [
  { value: "cash", label: "מזומן" },
  { value: "bit", label: "BIT" },
  { value: "bank", label: "העברה בנקאית" },
  { value: "card", label: "כרטיס" },
  { value: "check", label: "צ׳ק" },
];

type Contact = { id: string; name: string; role: string; trade: string | null };

export function PaymentDialog({
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
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [method, setMethod] = useState<string>("bit");
  const [paymentDate, setPaymentDate] = useState(isoDate());
  const [invoice, setInvoice] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setAmount("");
    setCounterpartyId("");
    setMethod("bit");
    setPaymentDate(isoDate());
    setInvoice("");
    setNotes("");
    setError(null);
  }

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        await createPayment({
          projectId,
          direction: "in",
          amount,
          counterparty_contact_id: counterpartyId || null,
          method: method || null,
          payment_date: paymentDate,
          invoice_number: invoice.trim() || null,
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

  const clientOptions = contacts.filter((c) => c.role === "client");

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
          <DialogTitle>תקבול חדש</DialogTitle>
          <DialogDescription>כסף שהתקבל מהלקוח.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-amount">סכום (₪) *</Label>
            <Input
              id="p-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>לקוח</Label>
            <Select value={counterpartyId} onValueChange={setCounterpartyId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clientOptions.length === 0 ? (
                  <SelectItem value="none" disabled>
                    אין לקוחות — הוסף איש קשר עם תפקיד "לקוח"
                  </SelectItem>
                ) : (
                  clientOptions.map((c) => (
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
              <Label>שיטה</Label>
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
              <Label htmlFor="p-date">תאריך</Label>
              <Input
                id="p-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-invoice">מספר חשבונית / אסמכתא</Label>
            <Input id="p-invoice" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-notes">הערות</Label>
            <Textarea
              id="p-notes"
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
            שמור תקבול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
