import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { TasksView } from "./tasks-view";

export default async function TasksPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const [tasksRes, contactsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, assignee_contact_id, due_date, status, created_at, completed_at")
      .eq("project_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("id, name, trade")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="container py-5 space-y-4">
      <TasksView
        projectId={params.id}
        tasks={tasksRes.data ?? []}
        contacts={contactsRes.data ?? []}
      />
    </div>
  );
}
