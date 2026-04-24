"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Submit button with built-in pending state. Use inside <form action={...}>
// so useFormStatus can report whether the action is mid-flight. Prevents the
// "I clicked and nothing happened — click again" double-submit problem.
export function WelcomeSubmitButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending} className="tap">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
