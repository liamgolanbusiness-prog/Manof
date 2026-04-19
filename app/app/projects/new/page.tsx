import Link from "next/link";
import { ProjectForm } from "./project-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default function NewProjectPage() {
  return (
    <div className="container py-6 max-w-xl">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
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
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
