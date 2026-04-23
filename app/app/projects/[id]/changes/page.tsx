import { notFound } from "next/navigation";
import { FileEdit, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { NewChangeButton } from "./new-change-button";
import { ChangeList } from "./change-list";

export default async function ChangesTab({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: project }, { data: changes }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, contract_value")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("change_orders")
      .select("id, title, description, amount_change, status, signed_by_name, signed_at, created_at")
      .eq("project_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!project) notFound();

  return (
    <div className="container py-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileEdit className="h-5 w-5 text-primary" />
          שינויי חוזה
        </h1>
        <NewChangeButton projectId={project.id} />
      </div>

      <p className="text-xs text-muted-foreground">
        הלקוח יראה שינויים ממתינים בפורטל שלו ויוכל לאשרם בלחיצה + הקלדת שמו.
      </p>

      {(changes ?? []).length === 0 ? (
        <EmptyState icon={FileEdit} title="אין שינויים">
          כל שינוי בהיקף העבודה או במחיר ירוכז כאן ויאושר ע״י הלקוח בפורטל.
        </EmptyState>
      ) : (
        <ChangeList projectId={project.id} changes={changes ?? []} />
      )}
    </div>
  );
}
