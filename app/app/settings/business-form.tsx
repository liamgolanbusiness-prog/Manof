"use client";

import Image from "next/image";
import { useFormState, useFormStatus } from "react-dom";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Upload, Trash2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { TAX_ID_TYPES, TAX_ID_TYPE_LABELS } from "@/lib/supabase/database.types";
import {
  updateBusinessProfile,
  uploadLogoAction,
  removeLogoAction,
  type BusinessFormState,
} from "./actions";

type ProfileLite = {
  id: string;
  full_name?: string | null;
  business_name?: string | null;
  logo_url?: string | null;
  tax_id?: string | null;
  tax_id_type?: string | null;
  vat_rate?: number | null;
  vat_included?: boolean | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  invoice_prefix?: string | null;
  next_invoice_number?: number | null;
  next_quote_number?: number | null;
  next_receipt_number?: number | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  bank_account?: string | null;
  bit_phone?: string | null;
  invoice_footer?: string | null;
};

export function BusinessForm({ profile, email }: { profile: ProfileLite; email: string }) {
  const [state, action] = useFormState<BusinessFormState, FormData>(updateBusinessProfile, null);
  const [taxType, setTaxType] = useState<string>(profile.tax_id_type ?? "osek_patur");
  const [vatIncluded, setVatIncluded] = useState<boolean>(profile.vat_included ?? false);
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logo_url ?? null);
  const [uploading, startUpload] = useTransition();
  const [removing, startRemove] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  function onLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadLogoAction(fd);
      if (res.error) {
        toast({ title: res.error, variant: "destructive" });
      } else if (res.url) {
        setLogoUrl(res.url);
        toast({ title: "הלוגו נשמר" });
        router.refresh();
      }
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function onRemoveLogo() {
    startRemove(async () => {
      await removeLogoAction();
      setLogoUrl(null);
      toast({ title: "הלוגו הוסר" });
      router.refresh();
    });
  }

  return (
    <form action={action} className="space-y-5">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 rounded-xl border bg-muted overflow-hidden flex items-center justify-center">
          {logoUrl ? (
            <Image src={logoUrl} alt="לוגו" fill className="object-contain" sizes="64px" />
          ) : (
            <span className="text-xs text-muted-foreground">לוגו</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onLogoFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            העלאת לוגו
          </Button>
          {logoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={onRemoveLogo}
              disabled={removing}
            >
              <Trash2 className="h-4 w-4" />
              הסרה
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="שם מלא"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          autoComplete="name"
        />
        <Field
          label="שם העסק"
          name="business_name"
          defaultValue={profile.business_name ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>סוג עוסק</Label>
          <input type="hidden" name="tax_id_type" value={taxType} />
          <Select value={taxType} onValueChange={setTaxType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_ID_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TAX_ID_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field
          label="ח.פ. / ע.מ. / ת.ז."
          name="tax_id"
          defaultValue={profile.tax_id ?? ""}
          inputMode="numeric"
          dir="ltr"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="טלפון"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          dir="ltr"
          inputMode="tel"
        />
        <Field
          label="אימייל ליצירת קשר"
          name="email"
          type="email"
          defaultValue={profile.email ?? email}
          dir="ltr"
          inputMode="email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="כתובת" name="address" defaultValue={profile.address ?? ""} />
        <Field label="עיר" name="city" defaultValue={profile.city ?? ""} />
      </div>

      <Field
        label="אתר אינטרנט"
        name="website"
        defaultValue={profile.website ?? ""}
        dir="ltr"
      />

      <div className="border-t pt-5 space-y-3">
        <h3 className="font-semibold">חשבוניות ומע״מ</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="אחוז מע״מ"
            name="vat_rate"
            defaultValue={String(profile.vat_rate ?? 18)}
            inputMode="decimal"
            dir="ltr"
          />
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="vat_included"
              name="vat_included"
              className="h-4 w-4"
              checked={vatIncluded}
              onChange={(e) => setVatIncluded(e.target.checked)}
            />
            <Label htmlFor="vat_included" className="cursor-pointer font-normal">
              מחירים כוללים מע״מ
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field
            label="תחילית מס׳"
            name="invoice_prefix"
            defaultValue={profile.invoice_prefix ?? ""}
            dir="ltr"
          />
          <Field
            label="חשבונית הבאה"
            name="next_invoice_number"
            defaultValue={String(profile.next_invoice_number ?? 1)}
            inputMode="numeric"
            dir="ltr"
          />
          <Field
            label="קבלה הבאה"
            name="next_receipt_number"
            defaultValue={String(profile.next_receipt_number ?? 1)}
            inputMode="numeric"
            dir="ltr"
          />
          <Field
            label="הצעה הבאה"
            name="next_quote_number"
            defaultValue={String(profile.next_quote_number ?? 1)}
            inputMode="numeric"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoice_footer">הערת תחתית לחשבונית</Label>
          <Textarea
            id="invoice_footer"
            name="invoice_footer"
            rows={2}
            defaultValue={profile.invoice_footer ?? ""}
            placeholder="למשל: תודה על שיתוף הפעולה. ניתן לשלם בהעברה לחשבון הבנק למטה."
          />
        </div>
      </div>

      <div className="border-t pt-5 space-y-3">
        <h3 className="font-semibold">פרטי תשלום (מופיעים על חשבוניות)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="שם בנק" name="bank_name" defaultValue={profile.bank_name ?? ""} />
          <Field
            label="סניף"
            name="bank_branch"
            defaultValue={profile.bank_branch ?? ""}
            inputMode="numeric"
            dir="ltr"
          />
          <Field
            label="מס׳ חשבון"
            name="bank_account"
            defaultValue={profile.bank_account ?? ""}
            inputMode="numeric"
            dir="ltr"
          />
        </div>
        <Field
          label="טלפון Bit (אופציונלי)"
          name="bit_phone"
          type="tel"
          defaultValue={profile.bit_phone ?? ""}
          dir="ltr"
          inputMode="tel"
        />
      </div>

      {state?.error ? (
        <div className="flex gap-2 items-start text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state?.ok && !state.error ? (
        <div className="flex gap-2 items-start text-sm text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>ההגדרות נשמרו</span>
        </div>
      ) : null}

      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  defaultValue?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const { label, name, ...rest } = props;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...rest} />
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="tap">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      שמור הגדרות
    </Button>
  );
}
