"use client";

import { useEffect, useState } from "react";

// Lightweight hook — truthful about connectivity based on the browser's own
// navigator.onLine signal + online/offline events. Not a probe (would be
// nicer to ping a /api/ping endpoint, but that costs requests; fine for UI).
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    function up() {
      setOnline(true);
    }
    function down() {
      setOnline(false);
    }
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}
