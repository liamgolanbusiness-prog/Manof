"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDateShort } from "@/lib/format";
import { createMilestone, deleteMilestone, updateMilestone } from "./actions";
import { milestoneStatus, type MilestoneStatus } from "@/lib/milestones";

type Milestone = {
  id: string;
  name: string;
  planned_date: string | null;
  actual_date: string | null;
  done: boolean | null;
  position: number | null;
};

export function ScheduleView({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Milestone[];
}) {
  return (
    <div className="space-y-4">
      <AddMilestoneCard projectId={projectId} />
      <MilestonesList projectId={projectId} milestones={milestones} />
    </div>
  );
}

function AddMilestoneCard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [saving, startSaving] = useTransition();

  function add() {
    if (!name.trim()) return;
    startSaving(async () => {
      try {
        await createMilestone(projectId, name, date || null);
        setName("");
        setDate("");
        router.refresh();
        toast({ title: "אבן דרך נוספה", variant: "success" });
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-sm font-medium">הוסף אבן דרך</div>
        <div className="space-y-1.5">
          <Label htmlFor="m-name">שם השלב</Label>
          <Input
            id="m-name"
            placeholder="למשל: סיום שלד, חיפוי מטבח, מסירה"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-date">תאריך מתוכנן</Label>
          <Input
            id="m-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={add} disabled={saving || !name.trim()} className="tap">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            הוסף
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MilestonesList({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Milestone[];
}) {
  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          עדיין אין אבני דרך. הוסף את הראשון למעלה.
        </CardContent>
      </Card>
    );
  }
  return (
    <ul className="space-y-2">
      {milestones.map((m) => (
        <MilestoneRow key={m.id} projectId={projectId} milestone={m} />
      ))}
    </ul>
  );
}

function MilestoneRow({
  projectId,
  milestone,
}: {
  projectId: string;
  milestone: Milestone;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startPending] = useTransition();
  const status = milestoneStatus(milestone);

  function toggleDone() {
    startPending(async () => {
      try {
        await updateMilestone(projectId, milestone.id, { done: !milestone.done });
        router.refresh();
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  function remove() {
    if (!confirm(`למחוק את "${milestone.name}"?`)) return;
    startPending(async () => {
      try {
        await deleteMilestone(projectId, milestone.id);
        router.refresh();
        toast({ title: "נמחק", variant: "success" });
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  return (
    <li className="rounded-xl border bg-card p-3 flex items-center gap-3">
      <button
        type="button"
        onClick={toggleDone}
        disabled={pending}
        className="tap shrink-0 text-muted-foreground hover:text-success"
        aria-label={`סמן ${milestone.name} כבוצע`}
      >
        {milestone.done ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`font-medium truncate ${milestone.done ? "line-through text-muted-foreground" : ""}`}>
          {milestone.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {milestone.planned_date ? (
            <span>מתוכנן: {formatDateShort(milestone.planned_date)}</span>
          ) : (
            <span>ללא תאריך</span>
          )}
          {milestone.actual_date ? (
            <span>· בוצע: {formatDateShort(milestone.actual_date)}</span>
          ) : null}
          <StatusBadge status={status} />
        </div>
      </div>
      <button
        onClick={remove}
        disabled={pending}
        className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="מחק"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </li>
  );
}

function StatusBadge({ status }: { status: MilestoneStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 text-success px-1.5 py-0.5">
        <CheckCircle2 className="h-3 w-3" /> הושלם
      </span>
    );
  }
  if (status === "late") {
    return <span className="rounded-full bg-destructive/10 text-destructive px-1.5 py-0.5">באיחור</span>;
  }
  if (status === "due_soon") {
    return <span className="rounded-full bg-warning/15 text-warning px-1.5 py-0.5">קרוב</span>;
  }
  if (status === "on_track") {
    return <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5">בזמן</span>;
  }
  return null;
}
