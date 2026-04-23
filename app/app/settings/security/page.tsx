import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { MfaManager } from "./mfa-manager";
import { SignOutAllButton } from "./sign-out-all-button";

export const metadata = { title: "אבטחה · אתר" };

export default async function SecurityPage() {
  await requireUser();
  const supabase = createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp ?? [];
  const verified = totp.find((f) => f.status === "verified");

  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">אבטחה</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">אימות דו-שלבי (2FA)</CardTitle>
          <CardDescription>
            הוסף שכבת אבטחה נוספת מעל הסיסמה — אפליקציית Authenticator
            (Google Authenticator, Authy, 1Password) תייצר קוד כל 30 שניות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaManager
            enrolledFactorId={verified?.id ?? null}
            hasVerifiedFactor={!!verified}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ניהול התחברויות</CardTitle>
          <CardDescription>
            אם אבד לך מכשיר או אתה חושד שמישהו נכנס לחשבון — התנתק מכל המכשירים כעת.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutAllButton />
        </CardContent>
      </Card>
    </div>
  );
}
