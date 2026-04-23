import { submitPinAction } from "./actions";
import { Lock, AlertCircle } from "lucide-react";

export function PortalPinGate({
  token,
  projectId,
  initialError,
}: {
  token: string;
  projectId: string;
  initialError?: string;
}) {
  return (
    <div lang="he" dir="rtl" className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <form
        action={submitPinAction}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-card border p-6 text-center"
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="project_id" value={projectId} />
        <Lock className="h-10 w-10 text-primary mx-auto" />
        <h1 className="text-xl font-bold">קוד כניסה נדרש</h1>
        <p className="text-sm text-muted-foreground">
          הכנס את הקוד שקיבלת מהקבלן כדי לצפות בפרויקט.
        </p>
        <input
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          required
          dir="ltr"
          className="w-full text-center tracking-[0.6em] text-2xl font-bold h-14 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="****"
        />
        {initialError ? (
          <div className="flex gap-2 items-center justify-center text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{initialError}</span>
          </div>
        ) : null}
        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          כניסה
        </button>
      </form>
    </div>
  );
}
