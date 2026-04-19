import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, address, client_name, client_phone, contract_value, start_date, target_end_date, status, progress_pct"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  return (
    <div className="container py-5 max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>הגדרות פרויקט</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
