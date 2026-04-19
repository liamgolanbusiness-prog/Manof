import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight } from "lucide-react";
import { ProjectTabs } from "./project-tabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  await requireUser();
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client_name, address, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!project) notFound();

  return (
    <div>
      <div className="container pt-4 pb-2 space-y-1">
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
          לפרויקטים
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight truncate">{project.name}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {[project.client_name, project.address].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b">
        <div className="container">
          <ProjectTabs projectId={project.id} />
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
