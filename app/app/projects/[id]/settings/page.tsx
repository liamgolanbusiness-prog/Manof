import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
import { TeamSection } from "./team-section";
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

  // Load collaborators with email fallback (invited_email for pending, auth.users.email for accepted).
  const { data: collabRows } = await supabase
    .from("project_collaborators")
    .select("id, user_id, invited_email, role, accepted_at, invited_at")
    .eq("project_id", project.id)
    .order("invited_at", { ascending: true });

  // Resolve accepted user emails via admin client (service role).
  let collaborators: {
    id: string;
    email: string;
    role: string;
    accepted_at: string | null;
    invited_at: string | null;
  }[] = [];
  if (collabRows && collabRows.length > 0) {
    const admin = createAdminClient();
    const userIds = collabRows
      .map((r) => r.user_id)
      .filter((id): id is string => !!id);
    const { data: users } = userIds.length
      ? await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      : { data: null };
    const emailByUserId = new Map(
      (users?.users ?? []).map((u) => [u.id, u.email ?? ""])
    );
    collaborators = collabRows.map((r) => ({
      id: r.id,
      email: r.user_id
        ? emailByUserId.get(r.user_id) ?? "(?)"
        : r.invited_email ?? "(?)",
      role: r.role,
      accepted_at: r.accepted_at,
      invited_at: r.invited_at,
    }));
  }

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

      <Card>
        <CardContent className="p-5">
          <TeamSection projectId={project.id} collaborators={collaborators} />
        </CardContent>
      </Card>
    </div>
  );
}
