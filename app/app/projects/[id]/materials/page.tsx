import { notFound } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { NewMaterialButton } from "./new-material-button";
import { MaterialList } from "./material-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MATERIAL_STATUS_LABELS,
  type MaterialStatus,
} from "@/lib/supabase/database.types";
import { formatCurrency } from "@/lib/format";

export default async function MaterialsTab({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: project }, { data: materials }, { data: suppliers }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("materials")
      .select("*")
      .eq("project_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("id, name, role")
      .eq("user_id", user.id)
      .in("role", ["supplier", "subcontractor", "other"])
      .order("name"),
  ]);

  if (!project) notFound();

  const list = materials ?? [];
  const totalValue = list.reduce((s, m) => s + Number(m.total_cost ?? 0), 0);
  const counts = {
    all: list.length,
    ordered: list.filter((m) => m.status === "ordered").length,
    delivered: list.filter((m) => m.status === "delivered").length,
    installed: list.filter((m) => m.status === "installed").length,
  };

  const filter = (s: MaterialStatus | "all") =>
    list.filter((m) => s === "all" || m.status === s);

  return (
    <div className="container py-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          חומרים
          <span className="text-sm font-normal text-muted-foreground">
            · סה״כ שווי {formatCurrency(totalValue)}
          </span>
        </h1>
        <NewMaterialButton projectId={project.id} suppliers={suppliers ?? []} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">הכול ({counts.all})</TabsTrigger>
          <TabsTrigger value="ordered">
            {MATERIAL_STATUS_LABELS.ordered} ({counts.ordered})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            {MATERIAL_STATUS_LABELS.delivered} ({counts.delivered})
          </TabsTrigger>
          <TabsTrigger value="installed">
            {MATERIAL_STATUS_LABELS.installed} ({counts.installed})
          </TabsTrigger>
        </TabsList>

        {(["all", "ordered", "delivered", "installed", "returned"] as const).map(
          (s) => (
            <TabsContent key={s} value={s} className="mt-3">
              {filter(s as MaterialStatus | "all").length === 0 ? (
                <EmptyState icon={Package} title="אין חומרים">
                  כל חומר שמגיע לאתר יתועד כאן עם כמות, ספק וסטטוס.
                </EmptyState>
              ) : (
                <MaterialList
                  projectId={project.id}
                  materials={filter(s as MaterialStatus | "all")}
                  suppliers={suppliers ?? []}
                />
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
