"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Loader2, QrCode, ShieldOff } from "lucide-react";

export function MfaManager({
  enrolledFactorId,
  hasVerifiedFactor,
}: {
  enrolledFactorId: string | null;
  hasVerifiedFactor: boolean;
}) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, startPending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  function beginEnroll() {
    setError(null);
    startPending(async () => {
      try {
        const supabase = createClient();
        const res = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (res.error) {
          setError(res.error.message);
          return;
        }
        setQrCode(res.data.totp.qr_code);
        setSecret(res.data.totp.secret);
        setFactorId(res.data.id);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function verify() {
    setError(null);
    if (!factorId || code.length < 6) {
      setError("נדרש קוד בן 6 ספרות");
      return;
    }
    startPending(async () => {
      try {
        const supabase = createClient();
        const chal = await supabase.auth.mfa.challenge({ factorId });
        if (chal.error) {
          setError(chal.error.message);
          return;
        }
        const res = await supabase.auth.mfa.verify({
          factorId,
          challengeId: chal.data.id,
          code,
        });
        if (res.error) {
          setError(res.error.message);
          return;
        }
        toast({ title: "2FA הופעל בהצלחה", variant: "success" });
        setQrCode(null);
        setSecret(null);
        setCode("");
        setFactorId(null);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function unenroll() {
    if (!enrolledFactorId) return;
    if (!confirm("להסיר את האימות הדו-שלבי?")) return;
    startPending(async () => {
      try {
        const supabase = createClient();
        const res = await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId });
        if (res.error) {
          toast({ title: res.error.message, variant: "destructive" });
          return;
        }
        toast({ title: "2FA הוסר" });
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  if (hasVerifiedFactor && !qrCode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          אימות דו-שלבי פעיל
        </div>
        <Button
          variant="ghost"
          onClick={unenroll}
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
          הסר 2FA
        </Button>
      </div>
    );
  }

  if (qrCode) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          סרוק את הברקוד עם Google Authenticator / Authy / 1Password, ואז הכנס את הקוד:
        </p>
        <div
          className="inline-block rounded-lg border p-2 bg-white"
          dangerouslySetInnerHTML={{ __html: qrCode }}
        />
        {secret ? (
          <p className="text-xs text-muted-foreground font-mono" dir="ltr">
            קוד ידני: {secret}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label>קוד מהאפליקציה</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            dir="ltr"
            className="text-center tracking-[0.3em] text-xl"
            placeholder="123456"
          />
        </div>
        {error ? (
          <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={verify} disabled={pending || code.length < 6}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            אשר והפעל
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setQrCode(null);
              setSecret(null);
              setFactorId(null);
              setCode("");
              setError(null);
            }}
            disabled={pending}
          >
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <Button onClick={beginEnroll} disabled={pending} className="gap-1">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
        הפעל 2FA
      </Button>
    </div>
  );
}
