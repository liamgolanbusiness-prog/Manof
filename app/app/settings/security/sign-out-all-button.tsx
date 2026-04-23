"use client";

import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, LogOut } from "lucide-react";

export function SignOutAllButton() {
  const [pending, startPending] = useTransition();
  const { toast } = useToast();

  function run() {
    if (!confirm("להתנתק מכל המכשירים שלך?")) return;
    startPending(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        return;
      }
      window.location.href = "/login";
    });
  }

  return (
    <Button variant="outline" className="gap-1" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      התנתק מכל המכשירים
    </Button>
  );
}
