"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  MATERIAL_STATUS_LABELS,
  MATERIAL_STATUSES,
  type MaterialStatus,
} from "@/lib/supabase/database.types";
import { Package, Trash2, Loader2, ChevronLeft } from "lucide-react";
import { deleteMaterial, setMaterialStatus } from "./actions";

type Row = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  cost_per_unit: number | null;
  total_cost: number | null;
  supplier_contact_id: string | null;
  status: string;
  delivery_date: string | null;
  notes: string | null;
  created_at: string | null;
};

type Supplier = { id: string; name: string };

export function MaterialList({
  projectId,
  materials,
  suppliers,
}: {
  projectId: string;
  materials: Row[];
  suppliers: Supplier[];
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  function withToast(fn: () => Promise<unknown>, ok: string) {
    startTransition(async () => {
      try {
        await fn();
        toast({ title: ok });
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  function nextStatus(s: string): MaterialStatus | null {
    const idx = MATERIAL_STATUSES.indexOf(s as MaterialStatus);
    if (idx < 0) return null;
    if (s === "installed" || s === "returned") return null;
    return MATERIAL_STATUSES[idx + 1] ?? null;
  }

  return (
    <ul className="space-y-2">
      {materials.map((m) => {
        const next = nextStatus(m.status);
        const supplier = m.supplier_contact_id ? supplierMap.get(m.supplier_contact_id) : null;
        return (
          <li
            key={m.id}
            className="rounded-xl border bg-card p-3 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{m.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {Number(m.quantity)} {m.unit ?? ""}
                {supplier ? ` · ${supplier}` : ""}
                {m.delivery_date ? ` · ${formatDateShort(m.delivery_date)}` : ""}
                {" · "}
                <span className="font-medium">
                  {MATERIAL_STATUS_LABELS[m.status as MaterialStatus]}
                </span>
              </div>
            </div>
            <div className="text-end shrink-0">
              {m.total_cost ? (
                <div className="font-bold text-sm">
                  {formatCurrency(Number(m.total_cost))}
                </div>
              ) : null}
              <div className="flex items-center gap-1 mt-1">
                {next ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      withToast(
                        () => setMaterialStatus(projectId, m.id, next),
                        `עודכן ל${MATERIAL_STATUS_LABELS[next]}`
                      )
                    }
                    disabled={pending}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {MATERIAL_STATUS_LABELS[next]}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!confirm("למחוק?")) return;
                    withToast(() => deleteMaterial(projectId, m.id), "נמחק");
                  }}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
