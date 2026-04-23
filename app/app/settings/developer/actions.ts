"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const ALLOWED_EVENTS = [
  "invoice.issued",
  "invoice.paid",
  "invoice.cancelled",
  "quote.accepted",
  "change_order.approved",
  "portal.viewed",
  "payment.received",
];

export async function createWebhookAction(input: {
  url: string;
  events: string[];
}) {
  const user = await requireUser();
  const supabase = createClient();
  const url = input.url.trim();
  if (!/^https?:\/\//.test(url)) throw new Error("URL חייב להתחיל ב-http:// או https://");
  const events = (input.events ?? []).filter((e) => ALLOWED_EVENTS.includes(e));
  if (events.length === 0) throw new Error("בחר לפחות אירוע אחד");

  const secret = crypto.randomBytes(24).toString("base64url");
  const { error } = await supabase.from("webhooks").insert({
    user_id: user.id,
    url,
    events,
    secret,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings/developer");
  return { secret };
}

export async function toggleWebhookAction(id: string, active: boolean) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("webhooks")
    .update({ active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings/developer");
}

export async function deleteWebhookAction(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/settings/developer");
}
