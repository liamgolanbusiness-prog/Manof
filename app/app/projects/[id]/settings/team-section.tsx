"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { COLLAB_ROLE_LABELS, type CollabRole } from "@/lib/supabase/database.types";
import { Clock, Loader2, Trash2, UserPlus, Users } from "lucide-react";
import {
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
} from "./team-actions";

type Collaborator = {
  id: string;
  email: string;
  role: string;
  accepted_at: string | null;
  invited_at: string | null;
};

export function TeamSection({
  projectId,
  collaborators,
}: {
  projectId: string;
  collaborators: Collaborator[];
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [pending, startPending] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function withToast(fn: () => Promise<unknown>, ok: string) {
    startPending(async () => {
      try {
        await fn();
        toast({ title: ok });
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  function invite() {
    startPending(async () => {
      try {
        const res = await inviteCollaborator({ project_id: projectId, email, role });
        toast({
          title: res.isPending ? "נשלחה הזמנה במייל" : "נוסף לצוות",
          variant: "success",
        });
        setEmail("");
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-primary" />
        צוות הפרויקט
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <div className="space-y-1">
          <Label className="text-xs">אימייל להזמנה</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            placeholder="name@example.com"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">תפקיד</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{COLLAB_ROLE_LABELS.admin}</SelectItem>
              <SelectItem value="editor">{COLLAB_ROLE_LABELS.editor}</SelectItem>
              <SelectItem value="viewer">{COLLAB_ROLE_LABELS.viewer}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex flex-col">
          <Label className="text-xs opacity-0 select-none hidden sm:block">{" "}</Label>
          <Button onClick={invite} disabled={pending || !email}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            הזמן
          </Button>
        </div>
      </div>

      {collaborators.length === 0 ? (
        <p className="text-xs text-muted-foreground">אין עדיין חברי צוות.</p>
      ) : (
        <ul className="space-y-1.5">
          {collaborators.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border bg-card px-3 py-2 flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" dir="ltr">
                  {c.email}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {c.accepted_at ? (
                    <span>פעיל</span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning">
                      <Clock className="h-3 w-3" />
                      ממתין לאישור
                    </span>
                  )}
                </div>
              </div>
              <Select
                value={c.role}
                onValueChange={(v) =>
                  withToast(
                    () =>
                      updateCollaboratorRole(
                        projectId,
                        c.id,
                        v as "admin" | "editor" | "viewer"
                      ),
                    "התפקיד עודכן"
                  )
                }
                disabled={pending || c.role === "owner"}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{COLLAB_ROLE_LABELS.admin}</SelectItem>
                  <SelectItem value="editor">{COLLAB_ROLE_LABELS.editor}</SelectItem>
                  <SelectItem value="viewer">{COLLAB_ROLE_LABELS.viewer}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (!confirm("להסיר מהצוות?")) return;
                  withToast(
                    () => removeCollaborator(projectId, c.id),
                    "הוסר"
                  );
                }}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
