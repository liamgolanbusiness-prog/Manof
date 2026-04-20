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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { upsertContact, deleteContact, type ContactFormState } from "./actions";
import { useToast } from "@/components/ui/use-toast";

type Existing = {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  trade: string | null;
  pay_rate: number | null;
  pay_type: string | null;
  notes: string | null;
};

export function ContactDialog({
  trigger,
  existing,
  onCreated,
  defaultRole,
}: {
  trigger: React.ReactNode;
  existing?: Existing;
  onCreated?: (id: string, name: string) => void;
  defaultRole?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [role, setRole] = useState(existing?.role ?? defaultRole ?? "worker");
  const [trade, setTrade] = useState(existing?.trade ?? "");
  const [payRate, setPayRate] = useState(
    existing?.pay_rate != null ? String(existing.pay_rate) : ""
  );
  const [payType, setPayType] = useState(existing?.pay_type ?? "hourly");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function save() {
    setError(null);
    startSaving(async () => {
      const fd = new FormData();
      if (existing?.id) fd.set("id", existing.id);
      fd.set("name", name);
      fd.set("phone", phone);
      fd.set("role", role);
      fd.set("trade", trade);
      fd.set("pay_rate", payRate);
      fd.set("pay_type", payType);
      fd.set("notes", notes);
      const state: ContactFormState = await upsertContact(null, fd);
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
      await deleteContact(existing.id);
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
          <DialogTitle>{existing ? "עריכת איש קשר" : "איש קשר חדש"}</DialogTitle>
          <DialogDescription>
            {role === "supplier"
              ? "ספק — חשבוניות ותשלומים ייקושרו אליו בהוצאות."
              : "פרטי קשר לעובד, קבלן משנה, ספק או לקוח."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">שם *</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>תפקיד *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">עובד</SelectItem>
                  <SelectItem value="subcontractor">קבלן משנה</SelectItem>
                  <SelectItem value="supplier">ספק</SelectItem>
                  <SelectItem value="client">לקוח</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">טלפון</Label>
              <Input
                id="c-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="054-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-trade">מקצוע / תחום</Label>
            <Input
              id="c-trade"
              placeholder="חשמל, אינסטלציה, ריצוף..."
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
            />
          </div>
          {(role === "worker" || role === "subcontractor") ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-rate">תעריף (₪)</Label>
                <Input
                  id="c-rate"
                  type="text"
                  inputMode="numeric"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>סוג תשלום</Label>
                <Select value={payType} onValueChange={setPayType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">שעתי</SelectItem>
                    <SelectItem value="daily">יומי</SelectItem>
                    <SelectItem value="fixed">קבוע לפרויקט</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="c-notes">הערות</Label>
            <Textarea
              id="c-notes"
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
