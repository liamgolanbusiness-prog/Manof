import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2 } from "lucide-react";
import { WebhookManager } from "./webhook-manager";

export const metadata = { title: "מפתחים · אתר" };

export default async function DeveloperPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: hooks } = await supabase
    .from("webhooks")
    .select("id, url, events, active, last_status, last_error, last_fired_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">הגדרות מפתחים</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhooks</CardTitle>
          <CardDescription>
            חבר את אתר ל-Zapier / Make / n8n — קבל עדכון בכל אירוע חשוב
            (חשבונית הונפקה, לקוח אישר הצעה, תשלום התקבל).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhookManager hooks={hooks ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
