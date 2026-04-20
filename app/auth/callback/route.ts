import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app/projects/new";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failed = new URL("/login", url.origin);
      failed.searchParams.set("error", error.message);
      return NextResponse.redirect(failed);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
