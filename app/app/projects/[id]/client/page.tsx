import { Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { ClientShareCard } from "./client-share-card";

export default async function ClientTab({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, client_name, client_phone, portal_token, progress_pct, portal_expires_at, portal_pin_hash, portal_revoked_at, portal_view_count, portal_last_viewed_at"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) return null;

  if (!project.portal_token) {
    return (
      <div className="container py-6">
        <EmptyState icon={Share2} title="עדיין אין קישור ללקוח">
          קישור הלקוח אמור להיווצר אוטומטית. פתח את הפרויקט מחדש או לחץ &quot;צור
          קישור חדש&quot; למטה.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <ClientShareCard
        project={{
          id: project.id,
          name: project.name,
          client_name: project.client_name,
          client_phone: project.client_phone,
          portal_token: project.portal_token,
          progress_pct: project.progress_pct,
          portal_expires_at: project.portal_expires_at,
          has_pin: !!project.portal_pin_hash,
          revoked: !!project.portal_revoked_at,
          view_count: project.portal_view_count ?? 0,
          last_viewed_at: project.portal_last_viewed_at,
        }}
      />
    </div>
  );
}
