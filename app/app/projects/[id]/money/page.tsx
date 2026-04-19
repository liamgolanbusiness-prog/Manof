import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function MoneyStub() {
  return (
    <div className="container py-6">
      <EmptyState icon={Wallet} title="כסף">
        תקציב, הוצאות ותשלומים. יתווסף בהמשך.
      </EmptyState>
    </div>
  );
}
