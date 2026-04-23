"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

// Install banner for PWA. On Android/Chrome we listen for beforeinstallprompt
// and trigger the native flow. On iOS Safari (no prompt event) we show
// instructions to Add-to-Home-Screen manually.
//
// Dismissal is persisted in localStorage so we don't nag.

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "atar_install_dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Dismissed previously?
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIos && isSafari) {
      // No beforeinstallprompt on iOS Safari — show manual instructions.
      setShowIos(true);
      setHidden(false);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") dismiss();
    } finally {
      setDeferred(null);
    }
  }

  if (hidden) return null;

  return (
    <div className="mx-4 my-2 rounded-2xl border bg-primary/5 p-3 flex items-start gap-3">
      <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">התקן את אתר על הטלפון</div>
        {showIos ? (
          <p className="text-xs text-muted-foreground">
            לחץ על <strong>שתף</strong> בסאפארי (⎋) → <strong>הוסף למסך הבית</strong>.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            פתיחה מהירה, עובד גם בלי אינטרנט, התראות.
          </p>
        )}
      </div>
      {!showIos && deferred ? (
        <Button size="sm" onClick={install} className="tap">
          התקן
        </Button>
      ) : null}
      <button
        onClick={dismiss}
        aria-label="סגור"
        className="p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
