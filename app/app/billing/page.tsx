import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserPlan, checkProjectLimit, checkInvoiceLimit } from "@/lib/plan-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";

export const metadata = { title: "חשבון ומנוי · אתר" };

export default async function BillingPage() {
  const user = await requireUser();
  const [planInfo, projectsLim, invoicesLim] = await Promise.all([
    getUserPlan(user.id),
    checkProjectLimit(user.id),
    checkInvoiceLimit(user.id),
  ]);

  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">חשבון ומנוי</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {planInfo.isPro ? (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                תוכנית מקצועי
              </>
            ) : (
              "תוכנית חינם"
            )}
            {planInfo.inTrial ? (
              <span className="rounded bg-primary/10 text-primary text-xs px-2 py-0.5">
                ניסיון
              </span>
            ) : null}
          </CardTitle>
          {planInfo.trial_ends_at && planInfo.inTrial ? (
            <CardDescription>
              הניסיון פעיל עד{" "}
              {new Date(planInfo.trial_ends_at).toLocaleDateString("he-IL")}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {!planInfo.isPro ? (
            <>
              <UsageBar
                label="פרויקטים פעילים"
                used={projectsLim.used}
                limit={projectsLim.limit}
              />
              <UsageBar
                label="חשבוניות החודש"
                used={invoicesLim.used}
                limit={invoicesLim.limit}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              פרויקטים וחשבוניות ללא הגבלה. תודה שאתה איתנו.
            </p>
          )}
        </CardContent>
      </Card>

      {!planInfo.isPro ? (
        <Card className="border-primary/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">שדרוג למקצועי · ₪99/חודש</CardTitle>
            <CardDescription>
              פרויקטים וחשבוניות ללא הגבלה, שינויי חוזה, פורטל ממותג, חומרים,
              ייצוא, ותמיכה מלאה.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1.5 text-sm">
              <Feat>פרויקטים פעילים ללא הגבלה</Feat>
              <Feat>חשבוניות מס וקבלות ללא הגבלה</Feat>
              <Feat>שינויי חוזה עם אישור דיגיטלי של הלקוח</Feat>
              <Feat>פורטל לקוח ממותג עם לוגו שלך</Feat>
              <Feat>חומרים ומלאי</Feat>
              <Feat>ייצוא לאקסל/CSV</Feat>
              <Feat>תמיכה מועדפת</Feat>
            </ul>
            <Link
              href={`${process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "#"}?ref=${encodeURIComponent(user.id)}`}
              target={process.env.NEXT_PUBLIC_CHECKOUT_URL ? "_blank" : undefined}
            >
              <Button size="lg" className="tap w-full">
                שדרג עכשיו
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              הניסיון חינם ל-14 יום · בטל מתי שבא לך
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            לניהול חיובים, ביטול מנוי או החלפת אמצעי תשלום:{" "}
            <Link
              href={process.env.NEXT_PUBLIC_BILLING_PORTAL_URL ?? "#"}
              className="text-primary hover:underline"
              target={process.env.NEXT_PUBLIC_BILLING_PORTAL_URL ? "_blank" : undefined}
            >
              פורטל חיובים
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  if (limit == null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">ללא הגבלה</span>
      </div>
    );
  }
  const pct = Math.min(100, (used / limit) * 100);
  const hot = pct >= 100 ? "bg-destructive" : pct >= 75 ? "bg-warning" : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${hot}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
