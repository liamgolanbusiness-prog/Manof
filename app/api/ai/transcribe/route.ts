import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

// POST { url: string } (Supabase public URL of an already-uploaded audio).
// Returns { text, language } or { error }.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRateLimit(`transcribe:${user.id}:${ip}`, 30, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const body = (await req.json()) as { url?: string };
  if (!body.url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }
  // Only accept URLs from our own Supabase storage to prevent abuse.
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\//i.test(body.url)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const result = await transcribeAudio({ url: body.url });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.reason === "disabled" ? 503 : 500 }
    );
  }
  return NextResponse.json({ text: result.text, language: result.language });
}
