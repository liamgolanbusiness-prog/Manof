import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Building2, HardHat, Sparkles, PlusCircle, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dismissWelcomeAction, seedDemoProjectAction, skipOnboardingAction } from "./actions";
import { WelcomeSubmitButton } from "./submit-button";

export const metadata = { title: "ברוך הבא · אתר" };

export default async function WelcomePage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, tax_id, full_name")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.full_name || user.email || "";
  const businessReady = !!profile?.business_name && !!profile?.tax_id;

  return (
    <div className="container py-8 max-w-xl space-y-6">
      <div className="text-center space-y-2">
        <HardHat className="h-10 w-10 text-primary mx-auto" />
        <h1 className="text-3xl font-bold">ברוך הבא{displayName ? `, ${displayName}` : ""}</h1>
        <p className="text-muted-foreground">
          אתר הוא הכלי של קבלנים בישראל — יומן יומי, כסף, חשבוניות וקישור ללקוח.
          בואו נקים את החשבון שלך ב-3 צעדים.
        </p>
      </div>

      <Card className={businessReady ? "opacity-70" : ""}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">
              1. פרטי עסק {businessReady ? "✓" : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              שם עסק, ח.פ./ע.מ., לוגו — יופיעו על חשבוניות ובפורטל הלקוח.
            </div>
          </div>
          <Link href="/app/settings">
            <Button size="sm" variant={businessReady ? "ghost" : "default"}>
              <SettingsIcon className="h-4 w-4" />
              {businessReady ? "ערוך" : "מלא"}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">2. פרויקט ראשון</div>
            <div className="text-xs text-muted-foreground">
              פתח את הפרויקט הפעיל שלך כדי להתחיל לרשום דו״ח יומי, הוצאות ואנשים.
            </div>
          </div>
          <form action={skipOnboardingAction}>
            <WelcomeSubmitButton>
              <ArrowLeft className="h-4 w-4" />
              צור פרויקט
            </WelcomeSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">3. לא בטוח? נסה דוגמה</div>
            <div className="text-xs text-muted-foreground">
              ניצור עבורך פרויקט דוגמה עם יומנים, הוצאות ואנשים — כדי שתראה את האפליקציה בפעולה לפני שתתחיל לעבוד.
            </div>
          </div>
          <form action={seedDemoProjectAction}>
            <WelcomeSubmitButton variant="outline">
              <Sparkles className="h-4 w-4" />
              פרויקט דוגמה
            </WelcomeSubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <form action={dismissWelcomeAction}>
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            דלג — אני כבר מכיר, קח אותי ללוח הבקרה
          </button>
        </form>
      </div>
    </div>
  );
}
