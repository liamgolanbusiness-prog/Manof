import { createAdminClient } from "@/lib/supabase/server";
import { sendPush, isPushConfigured, type PushPayload } from "@/lib/push";

// Send a push to every subscription the user owns. Deletes dead endpoints
// (410 Gone) so we don't keep sending to them. Returns { sent, failed }.
export async function notifyUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!isPushConfigured()) return { sent: 0, failed: 0 };
  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      const res = await sendPush(
        { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
        payload
      );
      if (res.ok) {
        sent++;
        await supabase
          .from("push_subscriptions")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", s.id);
      } else if (res.status === 404 || res.status === 410) {
        // Subscription gone; clean up.
        await supabase.from("push_subscriptions").delete().eq("id", s.id);
        failed++;
      } else {
        failed++;
      }
    })
  );
  return { sent, failed };
}
