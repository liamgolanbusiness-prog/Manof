"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // In dev, actively unregister any SW from a previous prod run + clear
      // its caches. Otherwise a stale SW intercepts dev requests with cached
      // responses, producing white-screen-then-refresh-works behavior.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) r.unregister();
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const k of keys) caches.delete(k);
        });
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("SW register failed:", err);
        });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
