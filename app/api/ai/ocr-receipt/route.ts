import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ocrReceipt } from "@/lib/ai/ocr";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

// POST multipart/form-data with field "file" (receipt image).
// Returns ReceiptFields JSON or { error }.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Rate limit OCR calls — 20 per hour per user (cost control).
  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRateLimit(`ocr:${user.id}:${ip}`, 20, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `יותר מדי בקשות. נסה שוב בעוד ${Math.ceil(rl.retryAfterSec / 60)} דקות.` },
      { status: 429 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const result = await ocrReceipt(base64, file.type || "image/jpeg");

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.reason === "disabled" ? 503 : 500 });
  }
  return NextResponse.json(result.fields);
}
