import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Cookie-only check — getSession reads from cookies without hitting the
  // Supabase auth server (getUser does a full network round-trip on every
  // nav, which adds 200-500ms even Frankfurt→Frankfurt). For middleware
  // routing this is safe: RLS validates the real JWT on every data query,
  // so a forged cookie still can't read other users' data — it would just
  // pass the redirect gate and then get empty results.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  // Behind Railway's proxy, request.url comes in as http://...:8080. If we
  // redirect to that, the browser receives Location: http:// and either
  // (a) follows to plain http and loses Secure cookies, or (b) the host
  // doesn't match the public domain at all → cookies are scoped wrong and
  // the next request looks unauthenticated → /login ↔ /app loop.
  //
  // Trust X-Forwarded-Proto/Host (set by Railway) and fall back to the
  // configured public URL.
  const fwdProto = request.headers.get("x-forwarded-proto");
  const fwdHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const publicOrigin = (() => {
    if (fwdProto && fwdHost) return `${fwdProto}://${fwdHost}`;
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    return request.nextUrl.origin;
  })();

  // For redirects, reuse `supabaseResponse` so every header/cookie that
  // @supabase/ssr wrote during getSession() survives the hop.
  function redirectVia(target: { pathname: string; search: string }) {
    const absolute = new URL(target.pathname + target.search, publicOrigin);
    return NextResponse.redirect(absolute, {
      status: 307,
      headers: supabaseResponse.headers,
    });
  }

  // Guard /app/* — must be signed in
  if (pathname.startsWith("/app") && !user) {
    return redirectVia({ pathname: "/login", search: `?next=${encodeURIComponent(pathname)}` });
  }

  // Bounce authed users away from /login, /signup
  if ((pathname === "/login" || pathname === "/signup") && user) {
    return redirectVia({ pathname: "/app", search: "" });
  }

  return supabaseResponse;
}
