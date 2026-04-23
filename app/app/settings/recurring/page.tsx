import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat } from "lucide-react";
import { RecurringManager } from "./recurring-manager";

export const metadata = { title: "חשבוניות חוזרות · אתר" };

export default async function RecurringPage() {
  const user = await requireUser();
  const supabase = createClient();

  const [templatesRes, projectsRes] = await Promise.all([
    supabase
      .from("recurring_invoice_templates")
      .select(
        "id, type, frequency, next_issue_date, active, client_name, items, last_issued_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Repeat className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">חשבוניות חוזרות</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">תבניות</CardTitle>
          <CardDescription>
            ריטיינר חודשי, דמי ניהול, שירות שנתי — הגדר פעם אחת והחשבוניות יונפקו אוטומטית
            בתאריך שתקבע.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecurringManager
            templates={templatesRes.data ?? []}
            projects={projectsRes.data ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
