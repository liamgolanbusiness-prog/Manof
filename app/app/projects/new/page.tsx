import Link from "next/link";
import { ProjectForm } from "./project-form";
import { TemplatePicker } from "./template-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function NewProjectPage() {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: sources }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="container py-6 max-w-xl space-y-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/app/projects" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          לפרויקטים
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">פרויקט חדש</CardTitle>
          <CardDescription>
            רק השם חובה. כל השאר אפשר למלא בהמשך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm clients={clients ?? []} />
        </CardContent>
      </Card>
      <TemplatePicker sources={sources ?? []} />
    </div>
  );
}
