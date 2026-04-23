"use client";

import { useState, useTransition } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { MATERIAL_STATUSES, MATERIAL_STATUS_LABELS } from "@/lib/supabase/database.types";
import { createMaterial } from "./actions";

type Supplier = { id: string; name: string };
type CatalogItem = {
  id: string;
  name: string;
  default_unit: string | null;
  typical_cost_per_unit: number | null;
  default_supplier_id: string | null;
  use_count: number;
};

export function NewMaterialButton({
  projectId,
  suppliers,
  catalog,
}: {
  projectId: string;
  suppliers: Supplier[];
  catalog: CatalogItem[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [status, setStatus] = useState<"ordered" | "delivered" | "installed" | "returned">(
    "ordered"
  );
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function reset() {
    setName("");
    setQuantity("1");
    setUnit("");
    setCost("");
    setSupplierId("");
    setStatus("ordered");
    setDeliveryDate("");
    setNotes("");
  }

  function submit() {
    startTransition(async () => {
      try {
        await createMaterial({
          project_id: projectId,
          name,
          quantity: Number(quantity) || 0,
          unit,
          cost_per_unit: Number(cost) || 0,
          supplier_contact_id: supplierId || undefined,
          status,
          delivery_date: deliveryDate || undefined,
          notes,
        });
        toast({ title: "חומר נוסף" });
        setOpen(false);
        reset();
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="tap gap-1">
          <Plus className="h-4 w-4" />
          חומר חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>חומר חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {catalog.length > 0 ? (
            <div className="space-y-1.5">
              <Label>מקטלוג</Label>
              <Select
                onValueChange={(v) => {
                  if (v === "__none__") return;
                  const item = catalog.find((c) => c.id === v);
                  if (!item) return;
                  setName(item.name);
                  if (item.default_unit) setUnit(item.default_unit);
                  if (item.typical_cost_per_unit != null)
                    setCost(String(item.typical_cost_per_unit));
                  if (item.default_supplier_id) setSupplierId(item.default_supplier_id);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- בחר פריט נפוץ או הקלד חדש למטה --" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.default_unit ? ` · ${c.default_unit}` : ""}
                      {c.typical_cost_per_unit != null ? ` · ₪${c.typical_cost_per_unit}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label>שם החומר *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לבנים, צבע, קרמיקה..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>כמות</Label>
              <Input
                value={quantity}
                inputMode="decimal"
                onChange={(e) => setQuantity(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label>יח׳</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="מ״ר"
              />
            </div>
            <div className="space-y-1.5">
              <Label>מחיר ליח׳ (₪)</Label>
              <Input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                inputMode="decimal"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ספק</Label>
              <Select value={supplierId || "__none__"} onValueChange={(v) => setSupplierId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="-- בחר --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ללא</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {MATERIAL_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>תאריך אספקה</Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            ביטול
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            שמירה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
