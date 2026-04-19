// Placeholder — replaced in Cycle 4 with the real projects list.
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectsStub() {
  return (
    <div className="container py-8 space-y-4">
      <h1 className="text-2xl font-bold">הפרויקטים שלי</h1>
      <p className="text-muted-foreground">עוד רגע כאן תהיה הרשימה. כרגע זה דף זמני.</p>
      <Link href="/app/projects/new">
        <Button size="lg">פתיחת פרויקט חדש</Button>
      </Link>
    </div>
  );
}
