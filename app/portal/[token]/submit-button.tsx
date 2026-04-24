"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function PortalSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-primary text-primary-foreground font-semibold h-11 disabled:opacity-60 disabled:cursor-wait inline-flex items-center justify-center gap-2"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
