"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createWebhookAction,
  deleteWebhookAction,
  toggleWebhookAction,
} from "./actions";

const EVENTS = [
  { id: "invoice.issued", label: "חשבונית הונפקה" },
  { id: "invoice.paid", label: "חשבונית שולמה" },
  { id: "invoice.cancelled", label: "חשבונית בוטלה" },
  { id: "quote.accepted", label: "הצעה אושרה" },
  { id: "change_order.approved", label: "שינוי אושר" },
  { id: "portal.viewed", label: "לקוח צפה בפורטל" },
  { id: "payment.received", label: "תשלום התקבל" },
] as const;

type Hook = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  last_status: number | null;
  last_error: string | null;
  last_fired_at: string | null;
  created_at: string | null;
};

export function WebhookManager({ hooks }: { hooks: Hook[] }) {
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(EVENTS.map((e) => e.id)));
  const [pending, startPending] = useTransition();
  const [lastSecret, setLastSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function create() {
    startPending(async () => {
      try {
        const res = await createWebhookAction({
          url,
          events: Array.from(selected),
        });
        setLastSecret(res.secret);
        setUrl("");
        toast({ title: "Webhook נוצר" });
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
      <div className="space-y-3 rounded-xl bg-muted/30 p-4">
        <div className="space-y-1.5">
          <Label>URL יעד</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            dir="ltr"
            placeholder="https://hooks.zapier.com/..."
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">אירועים</Label>
          <div className="flex flex-wrap gap-2">
            {EVENTS.map((e) => (
              <label
                key={e.id}
                className={`cursor-pointer select-none rounded-full border px-3 py-1 text-xs ${
                  selected.has(e.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.has(e.id)}
                  onChange={() => toggle(e.id)}
                />
                {e.label}
              </label>
            ))}
          </div>
        </div>
        <Button onClick={create} disabled={pending || !url || selected.size === 0}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          הוסף Webhook
        </Button>
      </div>

      {lastSecret ? (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 space-y-1">
          <div className="text-sm font-semibold">שמור את המפתח הזה — לא יוצג שוב</div>
          <div className="text-xs text-muted-foreground">
            צרף כ-<code>x-atar-signature: sha256=HMAC(body, secret)</code> ואמת בצד השני.
          </div>
          <code
            dir="ltr"
            className="block rounded bg-background px-2 py-1 text-xs break-all"
          >
            {lastSecret}
          </code>
        </div>
      ) : null}

      {hooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין עדיין webhooks.</p>
      ) : (
        <ul className="space-y-2">
          {hooks.map((h) => (
            <li key={h.id} className="rounded-xl border bg-card p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm truncate flex-1" dir="ltr">{h.url}</span>
                <label className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={h.active}
                    onChange={(e) =>
                      withToast(
                        () => toggleWebhookAction(h.id, e.target.checked),
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
                    if (!confirm("למחוק?")) return;
                    withToast(() => deleteWebhookAction(h.id), "נמחק");
                  }}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {h.events.map((e) => (
                  <span
                    key={e}
                    className="text-xs rounded-full bg-muted px-2 py-0.5"
                    dir="ltr"
                  >
                    {e}
                  </span>
                ))}
              </div>
              {h.last_fired_at ? (
                <div
                  className={`text-xs flex items-center gap-1 ${
                    h.last_error ? "text-destructive" : "text-success"
                  }`}
                >
                  {h.last_error ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {h.last_error ?? `הצליח (${h.last_status})`}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
