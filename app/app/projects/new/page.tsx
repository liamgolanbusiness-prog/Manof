// Placeholder — replaced in Cycle 4 with the real new-project form.
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewProjectStub() {
  return (
    <div className="container py-8 space-y-4">
      <h1 className="text-2xl font-bold">פרויקט חדש</h1>
      <p className="text-muted-foreground">דף זמני — טופס יצירה יגיע במחזור הקרוב.</p>
      <Link href="/app/projects">
        <Button variant="outline">חזרה לרשימה</Button>
      </Link>
    </div>
  );
}
