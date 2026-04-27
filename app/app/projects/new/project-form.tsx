"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
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
import { AlertCircle, Plus } from "lucide-react";
import { createProjectAction, type ProjectFormState } from "../actions";
import { ClientDialog } from "@/app/app/clients/client-dialog";

type ClientOption = { id: string; name: string };
type ForemanOption = { id: string; name: string };

export function ProjectForm({
  clients,
  foremen,
}: {
  clients: ClientOption[];
  foremen: ForemanOption[];
}) {
  const [state, action] = useFormState<ProjectFormState, FormData>(
    createProjectAction,
    null
  );
  const [clientId, setClientId] = useState("");
  const [foremanId, setForemanId] = useState("");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="foreman_contact_id" value={foremanId} />
      <Field label="שם הפרויקט" name="name" required placeholder='דוגמה: דירה חדשה ברחוב רמב"ם 7' />
      <Field
        label="כתובת"
        name="address"
        placeholder="רחוב ועיר (אפשר לפרט בהמשך)"
      />
      <div className="space-y-1.5">
        <Label>לקוח</Label>
        <div className="flex gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="בחר לקוח (אפשר להשאיר ריק)" />
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
              <Button type="button" variant="outline" className="tap gap-1">
                <Plus className="h-4 w-4" />
                חדש
              </Button>
            }
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>מנהל עבודה</Label>
        <Select value={foremanId} onValueChange={setForemanId}>
          <SelectTrigger>
            <SelectValue placeholder="בחר מנהל עבודה (אופציונלי)" />
          </SelectTrigger>
          <SelectContent>
            {foremen.length === 0 ? (
              <SelectItem value="none" disabled>
                אין מנהלי עבודה — הוסף איש קשר עם תפקיד &quot;מנהל עבודה&quot;
              </SelectItem>
            ) : (
              foremen.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="תאריך התחלה" name="start_date" type="date" />
        <Field label="יעד סיום" name="target_end_date" type="date" />
      </div>
      <Field
        label="ערך חוזה (₪)"
        name="contract_value"
        type="text"
        inputMode="numeric"
        placeholder="ללא מספרי סכום — אפשר בהמשך"
      />
      {state?.error && (
        <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
  inputMode,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive ms-1">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        dir={dir}
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full tap" disabled={pending}>
      {pending ? "שומר..." : "שמור פרויקט"}
    </Button>
  );
}
