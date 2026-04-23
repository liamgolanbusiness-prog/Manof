import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BusinessForm } from "./business-form";
import { DangerZone } from "./danger-zone";
import { PushToggle } from "@/components/push-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Crown, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "הגדרות עסק · אתר" };

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">הגדרות עסק</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי עסק לחשבוניות</CardTitle>
          <CardDescription>
            הפרטים האלה יופיעו על חשבוניות, קבלות, הצעות מחיר, ובפורטל הלקוח.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm profile={profile ?? { id: user.id }} email={user.email ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            חשבון ומנוי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/app/billing">
            <Button variant="outline" size="sm">
              נהל מנוי
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            אבטחה
          </CardTitle>
          <CardDescription>
            אימות דו-שלבי, ניהול התחברויות פעילות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/settings/security">
            <Button variant="outline" size="sm">
              הגדרות אבטחה
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">התראות</CardTitle>
          <CardDescription>
            קבל התראה בדפדפן על אירועים חשובים — משימה להיום, לקוח שצפה בפורטל, חשבונית שלא שולמה.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">יומן שינויים</CardTitle>
          <CardDescription>
            כל פעולה על חשבוניות, תשלומים, הוצאות ושינויי חוזה נשמרת אוטומטית.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/app/settings/audit"
            className="text-primary font-medium hover:underline text-sm"
          >
            הצג יומן →
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            הנתונים שלי
          </CardTitle>
          <CardDescription>
            ייצוא מלא של כל המידע שלך או מחיקה לצמיתות של החשבון.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
