import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function DiaryStub() {
  return (
    <div className="container py-6">
      <EmptyState icon={BookOpen} title="יומן דיווחים">
        רשימת הדיווחים היומיים תופיע כאן ברגע שתסגור יום ראשון ב״היום״.
      </EmptyState>
    </div>
  );
}
