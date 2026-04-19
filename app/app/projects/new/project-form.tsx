"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { createProjectAction, type ProjectFormState } from "../actions";

export function ProjectForm() {
  const [state, action] = useFormState<ProjectFormState, FormData>(
    createProjectAction,
    null
  );

  return (
    <form action={action} className="space-y-4">
      <Field label="שם הפרויקט" name="name" required placeholder='דוגמה: דירה חדשה ברחוב רמב"ם 7' />
      <Field
        label="כתובת"
        name="address"
        placeholder="רחוב ועיר (אפשר לפרט בהמשך)"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="שם הלקוח" name="client_name" />
        <Field
          label="טלפון הלקוח"
          name="client_phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
        />
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
