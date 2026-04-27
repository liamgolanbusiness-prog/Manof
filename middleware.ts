import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, icons
     * - portal/* (public client portal)
     * - api/* (route handlers manage their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|portal|api).*)",
  ],
};
