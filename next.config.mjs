/** @type {import('next').NextConfig} */

// Security headers — applied to every response. CSP is intentionally
// permissive for Supabase storage + inline styles (needed by shadcn/Radix)
// and tightens the obvious abuse surfaces (framing, mime sniffing, referrer).
const supabaseHost = (() => {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co");
    return u.hostname;
  } catch {
    return "*.supabase.co";
  }
})();

const connectSrc = [
  "'self'",
  `https://${supabaseHost}`,
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://*.ingest.sentry.io",
  "https://*.i.posthog.com",
  "https://app.posthog.com",
].join(" ");

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  `https://${supabaseHost}`,
  "https://*.supabase.co",
].join(" ");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Next.js dev needs 'unsafe-eval'; we rely on NODE_ENV gate below.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc}`,
  "font-src 'self' data:",
  "media-src 'self' blob: https://*.supabase.co",
  `connect-src ${connectSrc}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Allow camera + microphone + geolocation on self (camera capture for photos,
    // mic for voice notes, geo for site photo geotag future use). Everything else off.
    value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), fullscreen=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
