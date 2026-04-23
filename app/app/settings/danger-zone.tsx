"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Download, Loader2, Trash2 } from "lucide-react";
import { deleteAccountAction } from "./actions";

export function DangerZone({ email }: { email: string }) {
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function onDelete() {
    if (typed.trim().toLowerCase() !== email.toLowerCase()) {
      toast({ title: "הקלד את האימייל המלא לאישור", variant: "destructive" });
      return;
    }
    if (
      !confirm(
        "פעולה בלתי הפיכה. כל הנתונים — פרויקטים, חשבוניות, תמונות — יימחקו לצמיתות. להמשיך?"
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteAccountAction();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-3">
      <a href="/api/me/export" download>
        <Button variant="outline" className="gap-1">
          <Download className="h-4 w-4" />
          ייצוא כל הנתונים (JSON)
        </Button>
      </a>
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-destructive font-semibold">
          <AlertTriangle className="h-5 w-5" />
          אזור מסוכן — מחיקת חשבון
        </div>
        <p className="text-sm text-muted-foreground">
          מחיקת החשבון תסיר לצמיתות את כל הפרויקטים, החשבוניות, התמונות ואנשי הקשר.
          אי-אפשר לבטל. מומלץ קודם לייצא את הנתונים.
        </p>
        <div className="space-y-1.5">
          <Label>הקלד את האימייל שלך לאישור</Label>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
            dir="ltr"
            className="text-start"
          />
        </div>
        <Button
          variant="destructive"
          className="gap-1"
          onClick={onDelete}
          disabled={pending || typed.trim().toLowerCase() !== email.toLowerCase()}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          מחק חשבון לצמיתות
        </Button>
      </div>
    </div>
  );
}
