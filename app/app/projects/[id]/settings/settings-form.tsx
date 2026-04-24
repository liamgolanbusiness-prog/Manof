"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { updateProject, deleteProject, type SettingsFormState } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { ClientDialog } from "@/app/app/clients/client-dialog";

type Project = {
  id: string;
  name: string;
  address: string | null;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  contract_value: number | null;
  start_date: string | null;
  target_end_date: string | null;
  status: string | null;
  progress_pct: number | null;
};
type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  billing_address: string | null;
  notes: string | null;
};

export function SettingsForm({ project, clients }: { project: Project; clients: Client[] }) {
  const [state, action] = useFormState<SettingsFormState, FormData>(updateProject, null);
  const [status, setStatus] = useState(project.status ?? "active");
  const [clientId, setClientId] = useState(project.client_id ?? "");
  const [deleting, startDeleting] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    const typed = prompt(`פעולה בלתי הפיכה. הקלד את שם הפרויקט למחיקה:\n${project.name}`);
    if (typed !== project.name) return;
    startDeleting(async () => {
      try {
        await deleteProject(project.id);
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={project.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="client_id" value={clientId} />
      <Field label="שם הפרויקט *" name="name" defaultValue={project.name} required />
      <Field label="כתובת" name="address" defaultValue={project.address ?? ""} />
      <div className="space-y-1.5">
        <Label>לקוח</Label>
        <div className="flex gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="בחר לקוח" />
            </SelectTrigger>
            <SelectContent>
              {clients.length === 0 ? (
                <SelectItem value="none" disabled>
                  אין לקוחות — הוסף אחד
                </SelectItem>
              ) : (
                clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <ClientDialog
            onCreated={(id) => setClientId(id)}
            trigger={
              <Button type="button" variant="outline" size="default" className="tap gap-1">
                <Plus className="h-4 w-4" />
                חדש
              </Button>
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="התחלה"
          name="start_date"
          type="date"
          defaultValue={project.start_date ?? ""}
        />
        <Field
          label="יעד סיום"
          name="target_end_date"
          type="date"
          defaultValue={project.target_end_date ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ערך חוזה (₪)"
          name="contract_value"
          inputMode="decimal"
          defaultValue={project.contract_value != null ? String(project.contract_value) : ""}
        />
        <Field
          label="התקדמות %"
          name="progress_pct"
          inputMode="numeric"
          defaultValue={project.progress_pct != null ? String(project.progress_pct) : ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label>סטטוס</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">פעיל</SelectItem>
            <SelectItem value="paused">מוקפא</SelectItem>
            <SelectItem value="done">הושלם</SelectItem>
            <SelectItem value="archived">בארכיון</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state?.error && (
        <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.ok && !state.error && (
        <div className="text-sm text-success">נשמר</div>
      )}
      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          מחק פרויקט
        </Button>
        <SaveButton />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  dir,
  defaultValue,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  defaultValue?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        dir={dir}
        inputMode={inputMode}
      />
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="tap">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      שמור שינויים
    </Button>
  );
}
