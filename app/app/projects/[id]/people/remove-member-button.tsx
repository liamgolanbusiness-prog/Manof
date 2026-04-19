"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { removeProjectMember } from "@/app/app/contacts/actions";
import { useToast } from "@/components/ui/use-toast";

export function RemoveMemberButton({
  projectId,
  memberId,
}: {
  projectId: string;
  memberId: string;
}) {
  const [pending, startPending] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      size="icon"
      variant="ghost"
      className="tap text-muted-foreground hover:text-destructive"
      aria-label="הסר מהפרויקט"
      disabled={pending}
      onClick={() => {
        if (!confirm("להסיר מהפרויקט? שעות שכבר נרשמו יישמרו ביומן.")) return;
        startPending(async () => {
          try {
            await removeProjectMember(projectId, memberId);
            toast({ title: "הוסר", variant: "success" });
            router.refresh();
          } catch (e) {
            toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
          }
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
    </Button>
  );
}
