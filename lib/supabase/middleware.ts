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

  // Helper: when we redirect we MUST carry over any cookies the supabase
  // client wrote during getSession (token refresh). Otherwise the browser
  // never gets the new tokens, the next request comes in with the same
  // expired ones, middleware refreshes again → infinite loop.
  function redirectWithCookies(url: URL) {
    const res = NextResponse.redirect(url);
    for (const c of supabaseResponse.cookies.getAll()) {
      res.cookies.set(c.name, c.value, c);
    }
    return res;
  }

  // Guard /app/* — must be signed in
  if (pathname.startsWith("/app") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectWithCookies(url);
  }

  // Bounce authed users away from /login, /signup
  if ((pathname === "/login" || pathname === "/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.searchParams.delete("next");
    return redirectWithCookies(url);
  }

  return supabaseResponse;
}
