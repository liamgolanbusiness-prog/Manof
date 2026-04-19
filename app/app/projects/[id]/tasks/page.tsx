import { ListTodo } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function TasksStub() {
  return (
    <div className="container py-6">
      <EmptyState icon={ListTodo} title="משימות">
        רשימת משימות עם אחראי ותאריך יעד. יתווסף בהמשך.
      </EmptyState>
    </div>
  );
}
