import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BusinessForm } from "./business-form";
import { DangerZone } from "./danger-zone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShieldAlert } from "lucide-react";

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
