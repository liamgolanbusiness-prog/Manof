"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { setLocaleAction } from "./actions";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const [pending, startPending] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  function change(v: string) {
    startPending(async () => {
      try {
        await setLocaleAction(v as Locale);
        toast({ title: "שפה עודכנה" });
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }
  return (
    <Select value={current} onValueChange={change} disabled={pending}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
          <SelectItem key={l} value={l}>
            {LOCALE_LABELS[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
