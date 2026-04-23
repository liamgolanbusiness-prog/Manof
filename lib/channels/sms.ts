// Provider-agnostic SMS sender. Today supports Twilio; the interface is kept
// narrow (sendSms) so swapping to an Israeli provider (019, SMS4Free, Unicell)
// is a one-file change.
//
// ENV:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER  (E.164, e.g. +15551234567)

export function isSmsConfigured(): boolean {
  return (
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_FROM_NUMBER
  );
}

export async function sendSms(
  toPhoneE164: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmsConfigured()) {
    return { ok: false, error: "SMS לא מוגדר" };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;
  const to = normalizeE164(toPhoneE164);
  if (!to) return { ok: false, error: "מספר לא תקין" };

  const basic = Buffer.from(`${sid}:${token}`).toString("base64");
  const body_ = new URLSearchParams({ To: to, From: from, Body: body });
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body_,
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `SMS ${res.status}: ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Israeli mobile (05X) → +9725X format. Accepts 05..., 972..., or already E.164.
function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("972")) return `+${digits}`;
  if (digits.startsWith("0")) return `+972${digits.slice(1)}`;
  if (digits.length < 7) return null;
  return `+${digits}`;
}
