import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";

// Typed event set. Adding a new event = one line here + one fireWebhook call.
export type WebhookEvent =
  | "invoice.issued"
  | "invoice.paid"
  | "invoice.cancelled"
  | "quote.accepted"
  | "change_order.approved"
  | "portal.viewed"
  | "payment.received";

export type WebhookPayload = {
  event: WebhookEvent;
  occurred_at: string;
  data: Record<string, unknown>;
};

// Fire webhook to every active subscription the user owns that subscribes
// to this event. HMAC-SHA256 signature of the body in X-Atar-Signature.
// Non-blocking: returns immediately, dispatches in background.
export async function fireWebhook(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();
  const { data: hooks } = await supabase
    .from("webhooks")
    .select("id, url, secret")
    .eq("user_id", userId)
    .eq("active", true)
    .contains("events", [event]);
  if (!hooks || hooks.length === 0) return;

  const body: WebhookPayload = {
    event,
    occurred_at: new Date().toISOString(),
    data,
  };
  const json = JSON.stringify(body);

  await Promise.all(
    hooks.map(async (h) => {
      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "x-atar-event": event,
          "x-atar-delivery": crypto.randomUUID(),
        };
        if (h.secret) {
          const sig = crypto.createHmac("sha256", h.secret).update(json).digest("hex");
          headers["x-atar-signature"] = `sha256=${sig}`;
        }
        const res = await fetch(h.url, {
          method: "POST",
          headers,
          body: json,
          signal: AbortSignal.timeout(10_000),
        });
        await supabase
          .from("webhooks")
          .update({
            last_status: res.status,
            last_fired_at: new Date().toISOString(),
            last_error: res.ok ? null : `HTTP ${res.status}`,
          })
          .eq("id", h.id);
      } catch (e) {
        await supabase
          .from("webhooks")
          .update({
            last_fired_at: new Date().toISOString(),
            last_error: (e as Error).message.slice(0, 300),
          })
          .eq("id", h.id);
      }
    })
  );
}
