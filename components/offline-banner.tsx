"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/use-online-status";

// Sticky banner shown on the app shell when the browser is offline. Doesn't
// block interaction — user can still read cached pages (SW) and type draft
// notes that will be restored when they come back online.
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="sticky top-14 z-20 bg-warning/90 text-warning-foreground text-xs px-4 py-1 flex items-center justify-center gap-1.5 border-b border-warning">
      <WifiOff className="h-3.5 w-3.5" />
      אין חיבור לאינטרנט — הערות שתקליד יישמרו זמנית במכשיר
    </div>
  );
}
