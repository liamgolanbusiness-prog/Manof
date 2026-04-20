"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordResetAction, type AuthState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function ResetForm() {
  const [state, action] = useFormState<AuthState, FormData>(requestPasswordResetAction, null);
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          dir="ltr"
          className="text-start"
        />
      </div>
      {state?.error ? (
        <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state?.notice ? (
        <div className="flex gap-2 items-start text-sm text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.notice}</span>
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full tap" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      שלח קישור איפוס
    </Button>
  );
}
