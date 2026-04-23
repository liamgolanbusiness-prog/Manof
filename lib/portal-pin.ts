import crypto from "node:crypto";

// Portal PINs are 4-digit client-facing codes. We salt+hash them per project
// so the DB never stores the plaintext PIN.
export function hashPortalPin(projectId: string, pin: string): string {
  return crypto.createHash("sha256").update(`${projectId}:${pin}`).digest("hex");
}

export function verifyPortalPin(projectId: string, pin: string, hash: string): boolean {
  const computed = hashPortalPin(projectId, pin);
  // constant-time compare
  const a = Buffer.from(computed);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function hashIpForPortal(ip: string, token: string): string {
  return crypto.createHash("sha256").update(`${ip}:${token}`).digest("hex").slice(0, 32);
}
