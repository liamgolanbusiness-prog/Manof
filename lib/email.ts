// Transactional email via Resend. NOOPs without RESEND_API_KEY.
// Pick Resend because: cleanest API, generous free tier, verified-domain
// model matches Supabase-like DX. Swapping to Postmark/SendGrid is a
// single-file change — interface stays the same.
//
// ENV:
//   RESEND_API_KEY
//   EMAIL_FROM — e.g. 'Atar <noreply@atar.app>' (must be on a verified domain)

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
};

export async function sendEmail(
  msg: EmailMessage
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "email-not-configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: msg.reply_to,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ----- Templates -----

const SHELL = (inner: string) => `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, Rubik, Arial, sans-serif; background:#f6f7f9; padding:24px; color:#111">
  <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; padding:24px; direction:rtl; text-align:right">
    ${inner}
    <hr style="margin:24px 0; border:none; border-top:1px solid #eee"/>
    <div style="font-size:12px; color:#888">אתר · הכלי של קבלנים בישראל</div>
  </div>
</body></html>`;

export function welcomeEmail(fullName: string): EmailMessage["html"] {
  return SHELL(`
    <h2 style="margin:0 0 12px">ברוך הבא${fullName ? `, ${fullName}` : ""}!</h2>
    <p>חשבון האתר שלך פעיל.</p>
    <p>הצעד הבא: מילוי פרטי עסק כדי להוציא חשבוניות מס. זה לוקח דקה.</p>
    <p style="margin-top:16px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/settings"
         style="display:inline-block; background:#2463eb; color:#fff; padding:10px 16px; border-radius:10px; text-decoration:none">
        מלא פרטי עסק
      </a>
    </p>
  `);
}

export function invoiceReadyEmail(
  docNumber: string,
  portalUrl: string,
  amount: string
): EmailMessage["html"] {
  return SHELL(`
    <h2 style="margin:0 0 12px">חשבונית ${docNumber}</h2>
    <p>הוכנה עבורך חשבונית על סך <strong>${amount}</strong>.</p>
    <p style="margin-top:16px">
      <a href="${portalUrl}"
         style="display:inline-block; background:#2463eb; color:#fff; padding:10px 16px; border-radius:10px; text-decoration:none">
        צפייה ותשלום
      </a>
    </p>
  `);
}

export function portalViewedEmail(projectName: string, appUrl: string): EmailMessage["html"] {
  return SHELL(`
    <h2 style="margin:0 0 12px">הלקוח צפה בפורטל</h2>
    <p>הלקוח פתח את הפורטל של הפרויקט <strong>${projectName}</strong>.</p>
    <p style="margin-top:16px">
      <a href="${appUrl}" style="color:#2463eb">פתח את הפרויקט</a>
    </p>
  `);
}
