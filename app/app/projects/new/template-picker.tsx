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
import { Copy, Loader2 } from "lucide-react";
import { cloneProjectAction } from "@/app/app/projects/actions";

type SourceProject = { id: string; name: string };

export function TemplatePicker({ sources }: { sources: SourceProject[] }) {
  const [sourceId, setSourceId] = useState<string>("");
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  if (sources.length === 0) return null;

  function submit() {
    if (!sourceId) {
      toast({ title: "בחר פרויקט-תבנית", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "שם לפרויקט החדש", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const res = await cloneProjectAction(sourceId, name.trim());
      if ("error" in res) {
        toast({ title: res.error, variant: "destructive" });
      } else {
        toast({ title: "הפרויקט שוכפל" });
        router.push(`/app/projects/${res.id}/today`);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        <Copy className="h-4 w-4 text-primary" />
        או שכפל מפרויקט קיים
      </div>
      <p className="text-xs text-muted-foreground">
        מעתיק את חברי הצוות + משימות פתוחות. היומנים וההוצאות לא מועתקים.
      </p>
      <div className="space-y-1.5">
        <Label>פרויקט תבנית</Label>
        <Select value={sourceId} onValueChange={setSourceId}>
          <SelectTrigger>
            <SelectValue placeholder="-- בחר --" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>שם לפרויקט החדש</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שיפוץ דירה ..."
        />
      </div>
      <Button onClick={submit} disabled={pending} className="tap w-full" variant="outline">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
        שכפל פרויקט
      </Button>
    </div>
  );
}
