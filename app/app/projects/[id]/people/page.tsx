import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function PeopleStub() {
  return (
    <div className="container py-6">
      <EmptyState icon={Users} title="אנשים בפרויקט">
        כאן יופיעו העובדים וקבלני המשנה שעובדים על הפרויקט, עם סיכום שעות ותשלומים.
      </EmptyState>
    </div>
  );
}
