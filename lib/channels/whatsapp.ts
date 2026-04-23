// WhatsApp Business Cloud API (Meta) wrapper. Needs:
//   WHATSAPP_PHONE_NUMBER_ID  — e.g. "1234567890"
//   WHATSAPP_ACCESS_TOKEN     — permanent system-user token
// Without them, sendWhatsAppText() NOOPs. Users still get wa.me deep links
// as the fallback UX (already shipped throughout the app).
//
// Free-form text is only allowed inside an active 24-hour session. For
// proactive/first-message scenarios you need an approved template.

export function isWhatsAppConfigured(): boolean {
  return !!process.env.WHATSAPP_PHONE_NUMBER_ID && !!process.env.WHATSAPP_ACCESS_TOKEN;
}

export async function sendWhatsAppText(
  toPhoneE164: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { ok: false, error: "WhatsApp לא מוגדר" };
  }
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const to = toPhoneE164.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (to.length < 10) return { ok: false, error: "מספר לא תקין" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `WhatsApp ${res.status}: ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
