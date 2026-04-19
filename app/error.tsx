"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the console; wire to Sentry later.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">משהו השתבש</h1>
        <p className="text-sm text-muted-foreground">
          קרתה תקלה זמנית. נסה שוב, ואם זה חוזר — שלח הודעה.
        </p>
        <pre className="text-xs bg-muted text-muted-foreground rounded-lg p-3 overflow-auto text-start">
          {error.message}
        </pre>
        <Button onClick={reset} size="lg" className="tap">
          נסה שוב
        </Button>
      </div>
    </main>
  );
}
