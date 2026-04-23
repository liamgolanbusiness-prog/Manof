import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// For now the "PDF" endpoint redirects to the print-optimized HTML view.
// The user opens it and hits Ctrl/Cmd+P → "Save as PDF" in the browser.
// When we wire a headless-chrome renderer (or react-pdf) later, this
// endpoint switches to streaming the bytes directly without any route
// changes needed on the calling side.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Ownership enforced by RLS on the print route.
  return NextResponse.redirect(new URL(`/invoices/${params.id}/print`, req.url));
}
