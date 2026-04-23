"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  CHANGE_ORDER_STATUS_LABELS,
  type ChangeOrderStatus,
} from "@/lib/supabase/database.types";
import { Loader2, Trash2, X, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cancelChangeOrder, deleteChangeOrder } from "./actions";

type Row = {
  id: string;
  title: string;
  description: string | null;
  amount_change: number;
  status: string;
  signed_by_name: string | null;
  signed_at: string | null;
  created_at: string | null;
};

export function ChangeList({
  projectId,
  changes,
}: {
  projectId: string;
  changes: Row[];
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

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

  return (
    <ul className="space-y-2">
      {changes.map((c) => {
        const status = c.status as ChangeOrderStatus;
        const Icon =
          status === "approved"
            ? CheckCircle2
            : status === "rejected"
              ? AlertCircle
              : status === "cancelled"
                ? X
                : Clock;
        const tone =
          status === "approved"
            ? "text-success"
            : status === "rejected"
              ? "text-destructive"
              : status === "cancelled"
                ? "text-muted-foreground line-through"
                : "text-warning";
        return (
          <li key={c.id} className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Icon className={`h-5 w-5 mt-0.5 ${tone}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-muted-foreground">
                  {c.created_at ? formatDateShort(c.created_at) : ""} ·{" "}
                  <span className={tone}>{CHANGE_ORDER_STATUS_LABELS[status]}</span>
                  {c.signed_by_name ? ` · אישר: ${c.signed_by_name}` : ""}
                </div>
                {c.description ? (
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {c.description}
                  </div>
                ) : null}
              </div>
              <div className="text-end">
                <div
                  className={
                    "font-bold " +
                    (Number(c.amount_change) < 0 ? "text-destructive" : "")
                  }
                  dir="ltr"
                >
                  {Number(c.amount_change) > 0 ? "+" : ""}
                  {formatCurrency(Number(c.amount_change))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-1">
              {status === "pending" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    withToast(() => cancelChangeOrder(projectId, c.id), "בוטל")
                  }
                  disabled={pending}
                >
                  <X className="h-4 w-4" />
                  בטל
                </Button>
              ) : null}
              {status !== "approved" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!confirm("למחוק לצמיתות?")) return;
                    withToast(
                      () => deleteChangeOrder(projectId, c.id),
                      "נמחק"
                    );
                  }}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
