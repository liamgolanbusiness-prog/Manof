// Telemetry façade. Works whether or not Sentry / PostHog are configured:
// missing env vars → silent NOOP. No runtime dependency on the Sentry or
// PostHog SDKs (we use the browser-side script tag approach via PostHog's
// <Analytics /> component and Sentry's loader script, both opt-in).
//
// Design goals:
//   - Zero impact when disabled.
//   - Safe on the server (these functions are no-ops on the server side;
//     the client component <Analytics /> initializes in the browser only).
//   - Typed event names — change in one place.

export type AtarEvent =
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "project_created"
  | "report_closed"
  | "report_opened"
  | "expense_added"
  | "payment_added"
  | "invoice_issued"
  | "quote_issued"
  | "quote_accepted"
  | "change_order_approved"
  | "portal_shared"
  | "portal_viewed";

export function track(event: AtarEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    // PostHog browser SDK writes to window.posthog when loaded.
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: unknown) => void } })
      .posthog;
    ph?.capture(event, props);
  } catch {
    /* swallow */
  }
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const ph = (window as unknown as { posthog?: { identify: (id: string, t?: unknown) => void } })
      .posthog;
    ph?.identify(userId, traits);
  } catch {
    /* swallow */
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    // Server-side: fall back to console so it still lands in Vercel logs.
    console.error("[telemetry]", err, context);
    return;
  }
  try {
    const sentry = (window as unknown as { Sentry?: { captureException: (e: unknown, c?: unknown) => void } })
      .Sentry;
    sentry?.captureException(err, { extra: context });
  } catch {
    /* swallow */
  }
}
