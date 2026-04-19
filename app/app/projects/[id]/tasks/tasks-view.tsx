"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { formatDateShort } from "@/lib/format";
import { createTask, toggleTask, deleteTask } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CalendarClock, ListTodo, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  assignee_contact_id: string | null;
  due_date: string | null;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
};
type Contact = { id: string; name: string; trade: string | null };

type Filter = "today" | "week" | "later" | "done";

export function TasksView({
  projectId,
  tasks,
  contacts,
}: {
  projectId: string;
  tasks: Task[];
  contacts: Contact[];
}) {
  const [filter, setFilter] = useState<Filter>("today");
  const contactsById = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.id, c])),
    [contacts]
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inAWeek = new Date(today);
  inAWeek.setDate(today.getDate() + 7);

  function bucket(t: Task): Filter {
    if (t.status === "done") return "done";
    if (!t.due_date) return "later";
    const d = new Date(t.due_date);
    if (d <= today) return "today"; // overdue rolls into "today"
    if (d <= inAWeek) return "week";
    return "later";
  }

  const counts: Record<Filter, number> = { today: 0, week: 0, later: 0, done: 0 };
  for (const t of tasks) counts[bucket(t)]++;
  const filtered = tasks.filter((t) => bucket(t) === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">משימות</h1>
        <NewTaskButton projectId={projectId} contacts={contacts} />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="today">היום ({counts.today})</TabsTrigger>
          <TabsTrigger value="week">השבוע ({counts.week})</TabsTrigger>
          <TabsTrigger value="later">אחר כך ({counts.later})</TabsTrigger>
          <TabsTrigger value="done">בוצע ({counts.done})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={ListTodo} title="אין משימות בקטגוריה זו">
          {filter === "done" ? "כשתסיים משימה, היא תופיע כאן." : "הוסף משימה חדשה — גם רשימת קניות קצרה עוזרת."}
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {filtered.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  assignee={t.assignee_contact_id ? contactsById[t.assignee_contact_id] : undefined}
                  projectId={projectId}
                  overdue={isOverdue(t, today)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function isOverdue(t: Task, today: Date) {
  if (t.status === "done" || !t.due_date) return false;
  return new Date(t.due_date) < today;
}

function TaskRow({
  task,
  assignee,
  projectId,
  overdue,
}: {
  task: Task;
  assignee?: Contact;
  projectId: string;
  overdue: boolean;
}) {
  const [pending, startPending] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const done = task.status === "done";

  return (
    <li className="p-3 flex items-start gap-3">
      <button
        type="button"
        disabled={pending}
        className={cn(
          "mt-0.5 tap grid place-items-center h-6 w-6 rounded-md border shrink-0",
          done
            ? "bg-success border-success text-success-foreground"
            : "border-input bg-background"
        )}
        aria-label={done ? "סמן כלא בוצע" : "סמן כבוצע"}
        onClick={() =>
          startPending(async () => {
            try {
              await toggleTask(projectId, task.id, !done);
              router.refresh();
            } catch (e) {
              toast({ title: (e as Error).message, variant: "destructive" });
            }
          })
        }
      >
        {done ? "✓" : pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", done && "line-through text-muted-foreground")}>
          {task.title}
        </div>
        {task.description ? (
          <div className="text-xs text-muted-foreground whitespace-pre-line">
            {task.description}
          </div>
        ) : null}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {task.due_date ? (
            <span
              className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}
            >
              {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
              {formatDateShort(task.due_date)}
            </span>
          ) : null}
          {assignee ? <span>{assignee.name}</span> : null}
        </div>
      </div>
      <button
        type="button"
        className="tap grid place-items-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
        aria-label="מחק"
        onClick={async () => {
          if (!confirm("למחוק את המשימה?")) return;
          try {
            await deleteTask(projectId, task.id);
            router.refresh();
          } catch (e) {
            toast({ title: (e as Error).message, variant: "destructive" });
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function NewTaskButton({
  projectId,
  contacts,
}: {
  projectId: string;
  contacts: Contact[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");

  function save() {
    startSaving(async () => {
      try {
        await createTask({
          projectId,
          title,
          description: description.trim() || null,
          assignee_contact_id: assignee || null,
          due_date: due || null,
        });
        toast({ title: "נוסף", variant: "success" });
        setTitle("");
        setDescription("");
        setAssignee("");
        setDue("");
        setOpen(false);
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
          משימה
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>משימה חדשה</DialogTitle>
          <DialogDescription>רשימת מטלות פשוטה לפרויקט.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">מה לעשות? *</Label>
            <Input
              id="t-title"
              placeholder="לקנות ברגים שחורים 4.5 מ״מ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>אחראי</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="ללא" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.length === 0 ? (
                    <SelectItem value="none" disabled>
                      אין אנשי קשר
                    </SelectItem>
                  ) : (
                    contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">יעד</Label>
              <Input id="t-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">פרטים</Label>
            <Textarea
              id="t-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !title.trim()} className="tap">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
