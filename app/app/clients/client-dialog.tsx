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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { upsertClient, deleteClient, type ClientFormState } from "./actions";
import { useToast } from "@/components/ui/use-toast";

type Existing = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  billing_address: string | null;
  notes: string | null;
};

export function ClientDialog({
  trigger,
  existing,
  onCreated,
}: {
  trigger: React.ReactNode;
  existing?: Existing;
  onCreated?: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [taxId, setTaxId] = useState(existing?.tax_id ?? "");
  const [billingAddress, setBillingAddress] = useState(existing?.billing_address ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function save() {
    setError(null);
    startSaving(async () => {
      const fd = new FormData();
      if (existing?.id) fd.set("id", existing.id);
      fd.set("name", name);
      fd.set("phone", phone);
      fd.set("email", email);
      fd.set("tax_id", taxId);
      fd.set("billing_address", billingAddress);
      fd.set("notes", notes);
      const state: ClientFormState = await upsertClient(null, fd);
      if (state?.error) {
        setError(state.error);
        return;
      }
      if (state?.id && onCreated) onCreated(state.id, name);
      toast({ title: "נשמר", variant: "success" });
      setOpen(false);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!existing?.id) return;
    if (!confirm(`למחוק את ${existing.name}? פעולה לא ניתנת לשחזור.`)) return;
    try {
      await deleteClient(existing.id);
      toast({ title: "נמחק", variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
          <DialogDescription>
            פרטי לקוח משמשים לחשבוניות, פורטל לקוח וקישור לפרויקטים.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cl-name">שם *</Label>
            <Input id="cl-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cl-phone">טלפון</Label>
              <Input
                id="cl-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="054-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-email">אימייל</Label>
              <Input
                id="cl-email"
                type="email"
                inputMode="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-tax">ח.פ / ע.מ</Label>
            <Input
              id="cl-tax"
              inputMode="numeric"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-address">כתובת לחיוב</Label>
            <Input
              id="cl-address"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-notes">הערות</Label>
            <Textarea
              id="cl-notes"
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
          {existing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 me-auto"
            >
              <Trash2 className="h-4 w-4" />
              מחק
            </Button>
          ) : null}
          <Button onClick={save} disabled={saving || !name.trim()} className="tap">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
