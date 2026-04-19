"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ContactDialog } from "@/app/app/contacts/contact-dialog";
import { addProjectMember } from "@/app/app/contacts/actions";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Contact = {
  id: string;
  name: string;
  trade: string | null;
  role: string;
};

export function AddMemberButton({
  projectId,
  available,
}: {
  projectId: string;
  available: Contact[];
}) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [roleInProject, setRoleInProject] = useState("");
  const [pending, startPending] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function add() {
    if (!contactId) return;
    startPending(async () => {
      try {
        await addProjectMember(projectId, contactId, roleInProject.trim() || null);
        toast({ title: "נוסף", variant: "success" });
        setContactId("");
        setRoleInProject("");
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="tap gap-1">
          <Plus className="h-4 w-4" />
          הוסף
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת אדם לפרויקט</DialogTitle>
          <DialogDescription>בחר מתוך אנשי הקשר שלך או צור חדש.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {available.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3 space-y-2">
              <p>אין עדיין אנשי קשר פנויים. צור חדש:</p>
              <ContactDialog
                trigger={<Button size="sm">איש קשר חדש</Button>}
                onCreated={(id) => {
                  setContactId(id);
                  router.refresh();
                }}
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>איש קשר</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר..." />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.trade ? ` · ${c.trade}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  <Link href="/app/contacts" className="text-primary hover:underline">
                    נהל אנשי קשר
                  </Link>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rip">תפקיד בפרויקט (לא חובה)</Label>
                <Input
                  id="rip"
                  placeholder="למשל: מסגר ראשי"
                  value={roleInProject}
                  onChange={(e) => setRoleInProject(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={add} disabled={pending || !contactId} className="tap">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            הוסף
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
