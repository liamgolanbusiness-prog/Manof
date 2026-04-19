import { Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { ClientShareCard } from "./client-share-card";

export default async function ClientTab({ params }: { params: { id: string } }) {
  await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client_name, client_phone, portal_token, progress_pct")
    .eq("id", params.id)
    .maybeSingle();

  if (!project) return null;

  if (!project.portal_token) {
    return (
      <div className="container py-6">
        <EmptyState icon={Share2} title="עדיין אין קישור ללקוח">
          קישור הלקוח אמור להיווצר אוטומטית. אם לא — פתח את הפרויקט מחדש או
          פנה לתמיכה.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <ClientShareCard
        project={{
          name: project.name,
          client_name: project.client_name,
          client_phone: project.client_phone,
          portal_token: project.portal_token,
          progress_pct: project.progress_pct,
        }}
      />
    </div>
  );
}
