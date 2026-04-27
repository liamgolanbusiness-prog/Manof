"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  type InvoiceType,
  type InvoiceStatus,
} from "@/lib/supabase/database.types";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Mail,
  MoreVertical,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { deleteInvoice, emailInvoiceToClient, setInvoiceStatus } from "./actions";

type Row = {
  id: string;
  type: string;
  doc_number: string;
  status: string;
  client_name: string | null;
  issue_date: string;
  due_date: string | null;
  total: number;
  amount_paid: number;
  accepted_at: string | null;
  cancelled_at: string | null;
};

export function InvoiceList({
  projectId,
  invoices,
}: {
  projectId: string;
  invoices: Row[];
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
      {invoices.map((inv) => {
        const type = inv.type as InvoiceType;
        const status = inv.status as InvoiceStatus;
        const unpaid = Number(inv.total) - Number(inv.amount_paid || 0);
        const statusTone =
          status === "paid"
            ? "text-success"
            : status === "cancelled"
              ? "text-destructive line-through"
              : status === "draft"
                ? "text-muted-foreground"
                : "text-primary";
        return (
          <li
            key={inv.id}
            className="rounded-xl border bg-card p-3 space-y-2"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-semibold">{INVOICE_TYPE_LABELS[type]}</span>
                  <span className="text-muted-foreground font-mono text-xs" dir="ltr">
                    {inv.doc_number}
                  </span>
                  <span className={`text-xs ${statusTone}`}>
                    · {INVOICE_STATUS_LABELS[status] ?? status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {inv.client_name} · {formatDateShort(inv.issue_date)}
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="font-bold whitespace-nowrap">{formatCurrency(Number(inv.total))}</div>
                {status === "issued" && unpaid > 0 ? (
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    יתרה {formatCurrency(unpaid)}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-1 justify-end flex-wrap">
              <a
                href={`/api/invoices/${inv.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="הורדה"
              >
                <Button size="sm" variant="ghost" className="tap">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              {status === "draft" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="tap"
                  onClick={() =>
                    withToast(
                      () => setInvoiceStatus(projectId, inv.id, "issued"),
                      "המסמך הונפק"
                    )
                  }
                  disabled={pending}
                >
                  <Send className="h-4 w-4" />
                  הנפק
                </Button>
              ) : null}
              {status === "issued" || status === "accepted" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="tap"
                  onClick={() => {
                    withToast(async () => {
                      const res = await emailInvoiceToClient(projectId, inv.id);
                      if (!res.ok) throw new Error(res.error ?? "שגיאה");
                    }, "נשלח במייל");
                  }}
                  disabled={pending}
                  aria-label="שלח במייל"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              ) : null}
              {status === "issued" && type !== "quote" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="tap"
                  onClick={() =>
                    withToast(
                      () => setInvoiceStatus(projectId, inv.id, "paid"),
                      "סומן כשולם"
                    )
                  }
                  disabled={pending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  שולם
                </Button>
              ) : null}
              {status !== "cancelled" && status !== "draft" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="tap text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!confirm("לבטל את המסמך?")) return;
                    withToast(
                      () => setInvoiceStatus(projectId, inv.id, "cancelled"),
                      "המסמך בוטל"
                    );
                  }}
                  disabled={pending}
                  aria-label="בטל"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
              {status === "draft" || type === "quote" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="tap text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!confirm("למחוק?")) return;
                    withToast(() => deleteInvoice(projectId, inv.id), "נמחק");
                  }}
                  disabled={pending}
                  aria-label="מחק"
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
