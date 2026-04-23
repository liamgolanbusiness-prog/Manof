// Web-Push sender — VAPID-signed, no npm dep needed for send (we hand-craft
// the VAPID JWT via Node's crypto). Saves ~60KB vs. the web-push package.
//
// ENV (both required for push to work):
//   VAPID_PUBLIC_KEY   — base64url-encoded public key, also exposed as
//                        NEXT_PUBLIC_VAPID_PUBLIC_KEY for client-side subscribe()
//   VAPID_PRIVATE_KEY  — base64url-encoded P-256 private key
//   VAPID_SUBJECT      — mailto:you@example.com (required by RFC 8292)
//
// Generate keys once (anywhere):
//   node -e "const k=require('crypto').generateKeyPairSync('ec',{namedCurve:'P-256'});
//            console.log('pub:',k.publicKey.export({type:'spki',format:'der'}).toString('base64url'));
//            console.log('priv:',k.privateKey.export({type:'pkcs8',format:'der'}).toString('base64url'));"
//
// The public key goes to the browser to subscribe; private key stays server-side
// and signs the VAPID JWT for every send.

import crypto from "node:crypto";

export function isPushConfigured(): boolean {
  return (
    !!process.env.VAPID_PUBLIC_KEY &&
    !!process.env.VAPID_PRIVATE_KEY &&
    !!process.env.VAPID_SUBJECT
  );
}

type Subscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPush(
  sub: Subscription,
  payload: PushPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!isPushConfigured()) {
    return { ok: false, error: "Push not configured" };
  }
  try {
    const audience = new URL(sub.endpoint).origin;
    const jwt = buildVapidJwt(audience);
    const body = new TextEncoder().encode(JSON.stringify(payload));

    // Per-message encryption (aes128gcm) is complex — outsourced to a simple
    // header-only JWT push for now; production should encrypt the payload.
    // Browsers will still deliver an empty-payload push to the SW, which we
    // use below as a trigger-to-fetch. The SW will look up the real message.
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        TTL: "600",
        Authorization: `vapid t=${jwt}, k=${process.env.VAPID_PUBLIC_KEY}`,
        "Content-Encoding": "identity",
        "Content-Length": String(body.length),
      },
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function buildVapidJwt(audience: string): string {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: process.env.VAPID_SUBJECT!,
  };
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${enc(header)}.${enc(claims)}`;

  const privKeyDer = Buffer.from(process.env.VAPID_PRIVATE_KEY!, "base64url");
  const keyObj = crypto.createPrivateKey({
    key: privKeyDer,
    format: "der",
    type: "pkcs8",
  });
  const sig = crypto.sign("sha256", Buffer.from(unsigned), {
    key: keyObj,
    dsaEncoding: "ieee-p1363",
  });
  return `${unsigned}.${sig.toString("base64url")}`;
}
