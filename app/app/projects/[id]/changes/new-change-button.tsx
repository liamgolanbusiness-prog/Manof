"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus } from "lucide-react";
import { createChangeOrder } from "./actions";

export function NewChangeButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      try {
        await createChangeOrder({
          project_id: projectId,
          title,
          description,
          amount_change: Number(amount) || 0,
        });
        toast({ title: "שינוי נוצר — ממתין לאישור הלקוח" });
        setOpen(false);
        setTitle("");
        setDescription("");
        setAmount("");
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="tap gap-1">
          <Plus className="h-4 w-4" />
          שינוי חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>שינוי בחוזה</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: תוספת שקעים במטבח" />
          </div>
          <div className="space-y-1.5">
            <Label>תיאור מפורט</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מה השינוי כולל, מה ההשלכות על זמן ותקציב"
            />
          </div>
          <div className="space-y-1.5">
            <Label>שינוי בסכום (₪, חיובי או שלילי)</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              dir="ltr"
              placeholder="1500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            ביטול
          </Button>
          <Button onClick={submit} disabled={pending || !title.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            שלח לאישור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
