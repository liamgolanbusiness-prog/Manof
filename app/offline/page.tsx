import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Was force-static, but the static prerender in Docker builds (no Supabase
// env vars at build time) was failing because the layout chain pulls in code
// that calls createServerClient at module init.
export const dynamic = "force-dynamic";

export default function OfflinePage() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-8 text-center">
      <div className="max-w-sm space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-muted grid place-items-center">
          <WifiOff className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">אין חיבור לרשת</h1>
        <p className="text-sm text-muted-foreground">
          האפליקציה עובדת באופן מוגבל ללא אינטרנט — עדכונים יגיעו כשהחיבור יחזור.
        </p>
        <Link href="/app">
          <Button size="lg" className="tap">נסה שוב</Button>
        </Link>
      </div>
    </main>
  );
}
