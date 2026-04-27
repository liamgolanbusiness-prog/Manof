"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertTriangle,
  CalendarRange,
  Camera,
  CheckCircle2,
  Cloud,
  HardHat,
  Loader2,
  Lock,
  LockOpen,
  Play,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import {
  ensureTodayReport,
  saveReportBasics,
  saveReportForeman,
  setReportLocked,
  saveAttendance,
  addReportPhoto,
  removeReportPhoto,
  createIssue,
  resolveIssue,
  sendDailySummaryToClient,
} from "./actions";
import { updateMilestone } from "../schedule/actions";
import { milestoneStatus } from "@/lib/milestones";
import { formatDateShort } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import { uploadReportPhoto } from "./upload-client";
import { AddMemberButton } from "../people/add-member-button";
import { VoiceCard } from "./voice-card";

type Report = {
  id: string;
  weather: string | null;
  notes: string | null;
  locked: boolean | null;
  report_date: string;
  updated_at: string | null;
  voice_note_url: string | null;
  foreman_contact_id: string | null;
  foreman_on_site: boolean | null;
} | null;

type ForemanOption = { id: string; name: string };
type Milestone = {
  id: string;
  name: string;
  planned_date: string | null;
  actual_date: string | null;
  done: boolean | null;
  position: number | null;
};

type RosterRow = {
  memberId: string;
  contactId: string;
  name: string;
  trade: string;
  hours: number | null;
};

type Photo = { id: string; url: string; caption: string | null };
type Issue = { id: string; title: string; severity: string | null; status: string | null };
type AvailableContact = { id: string; name: string; trade: string | null; role: string };

export function TodayView({
  projectId,
  report,
  roster,
  photos,
  issues,
  availableContacts,
  foremen,
  milestones,
}: {
  projectId: string;
  report: Report;
  roster: RosterRow[];
  photos: Photo[];
  issues: Issue[];
  availableContacts: AvailableContact[];
  foremen: ForemanOption[];
  milestones: Milestone[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!report) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <Play className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">התחלת יום חדש</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            לחיצה אחת כדי להתחיל — תוכל להוסיף תמונות, נוכחות ובעיות במהלך היום.
          </p>
          <Button
            size="lg"
            className="tap w-full sm:w-auto"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await ensureTodayReport(projectId);
                router.refresh();
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            התחל יום
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <BasicsCard projectId={projectId} report={report} />
      <ForemanCard
        projectId={projectId}
        report={report}
        foremen={foremen}
        locked={!!report.locked}
      />
      <ScheduleStatusCard
        projectId={projectId}
        milestones={milestones}
        locked={!!report.locked}
      />
      <VoiceCard
        projectId={projectId}
        reportId={report.id}
        voiceNoteUrl={report.voice_note_url}
        locked={!!report.locked}
      />
      <AttendanceCard
        projectId={projectId}
        reportId={report.id}
        roster={roster}
        locked={!!report.locked}
        availableContacts={availableContacts}
      />
      <PhotosCard projectId={projectId} reportId={report.id} photos={photos} locked={!!report.locked} />
      <IssuesCard projectId={projectId} reportId={report.id} issues={issues} locked={!!report.locked} />
      <CloseDayCard projectId={projectId} reportId={report.id} locked={!!report.locked} />
    </div>
  );
}

function BasicsCard({ projectId, report }: { projectId: string; report: NonNullable<Report> }) {
  const { toast } = useToast();
  const [saving, startSaving] = useTransition();
  const [weather, setWeather] = useState(report.weather ?? "");
  const [notes, setNotes] = useState(report.notes ?? "");
  const locked = !!report.locked;

  function save() {
    startSaving(async () => {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("report_id", report.id);
      fd.set("weather", weather);
      fd.set("notes", notes);
      const result = await saveReportBasics(null, fd);
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "נשמר", variant: "success" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          מזג אוויר והערות יום
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weather">מזג אוויר</Label>
          <Input
            id="weather"
            placeholder="למשל: 28 מעלות, בהיר"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            disabled={locked}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">מה קרה היום באתר?</Label>
          <Textarea
            id="notes"
            rows={5}
            placeholder="לדוגמה: גמרנו חיפוי במטבח, מחר מתחילים ריצוף בסלון. הגיעה משלוחה של 4 ארגזי חיפוי."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={locked}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {report.updated_at
              ? `עודכן: ${new Date(report.updated_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </span>
          <Button onClick={save} disabled={saving || locked} className="tap">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            שמור
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceCard({
  projectId,
  reportId,
  roster,
  locked,
  availableContacts,
}: {
  projectId: string;
  reportId: string;
  roster: RosterRow[];
  locked: boolean;
  availableContacts: AvailableContact[];
}) {
  const { toast } = useToast();
  const [saving, startSaving] = useTransition();
  const [hoursById, setHoursById] = useState<Record<string, string>>(
    Object.fromEntries(
      roster.map((r) => [r.contactId, r.hours != null ? String(r.hours) : ""])
    )
  );
  const present = roster.filter((r) => parseFloat(hoursById[r.contactId] || "0") > 0).length;

  function save() {
    startSaving(async () => {
      const entries = roster.map((r) => ({
        contact_id: r.contactId,
        hours_worked: parseFloat(hoursById[r.contactId] || "0") || null,
      }));
      try {
        await saveAttendance(projectId, reportId, entries);
        toast({ title: "נוכחות נשמרה", variant: "success" });
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  if (roster.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            נוכחות
          </div>
          <p className="text-sm text-muted-foreground">
            עדיין אין עובדים בפרויקט. הוסף מישהו עכשיו כדי לסמן נוכחות.
          </p>
          <div className="flex items-center gap-2">
            <AddMemberButton projectId={projectId} available={availableContacts} />
            <Link
              href={`/app/projects/${projectId}/people`}
              className="text-sm text-muted-foreground hover:underline"
            >
              נהל את הצוות
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            נוכחות ({present}/{roster.length})
          </div>
        </div>
        <ul className="space-y-2">
          {roster.map((r) => {
            const val = hoursById[r.contactId] || "";
            const checked = parseFloat(val || "0") > 0;
            return (
              <li
                key={r.contactId}
                className={`rounded-xl border p-2.5 flex items-center gap-3 ${
                  checked ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (locked) return;
                    setHoursById((s) => ({
                      ...s,
                      [r.contactId]: checked ? "" : "8",
                    }));
                  }}
                  disabled={locked}
                  className="min-w-0 flex-1 text-start"
                  aria-label={`סמן נוכחות ${r.name}`}
                >
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  {r.trade ? (
                    <div className="text-xs text-muted-foreground truncate">{r.trade}</div>
                  ) : null}
                </button>
                <div className="flex items-center gap-1 text-xs shrink-0">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    className="h-9 w-16 text-sm text-center"
                    value={val}
                    onChange={(e) =>
                      setHoursById((s) => ({ ...s, [r.contactId]: e.target.value }))
                    }
                    disabled={locked}
                    aria-label={`שעות ${r.name}`}
                  />
                  <span className="text-muted-foreground">שע׳</span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || locked} size="sm" className="tap">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            שמור נוכחות
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotosCard({
  projectId,
  reportId,
  photos,
  locked,
}: {
  projectId: string;
  reportId: string;
  photos: Photo[];
  locked: boolean;
}) {
  const { toast } = useToast();
  const [uploading, startUploading] = useTransition();
  const router = useRouter();

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 10) {
      toast({ title: "עד 10 תמונות לכל יום", variant: "destructive" });
      return;
    }
    startUploading(async () => {
      try {
        for (const f of Array.from(files)) {
          const url = await uploadReportPhoto(projectId, reportId, f);
          await addReportPhoto(projectId, reportId, url, null);
        }
        router.refresh();
        toast({ title: "הועלה", variant: "success" });
      } catch (e) {
        toast({
          title: `שגיאת העלאה: ${(e as Error).message}`,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="h-4 w-4 text-muted-foreground" />
            תמונות ({photos.length}/10)
          </div>
          {!locked ? (
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                הוסף תמונה
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
                disabled={uploading || photos.length >= 10}
              />
            </label>
          ) : null}
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין עדיין תמונות להיום.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={p.url}
                  alt={p.caption ?? ""}
                  fill
                  sizes="(max-width: 640px) 33vw, 200px"
                  className="object-cover"
                />
                {!locked ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("למחוק את התמונה?")) return;
                      try {
                        await removeReportPhoto(projectId, p.id);
                        router.refresh();
                      } catch (e) {
                        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
                      }
                    }}
                    className="absolute top-1 start-1 grid place-items-center h-7 w-7 rounded-md bg-black/60 text-white hover:bg-black/80"
                    aria-label="מחק תמונה"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IssuesCard({
  projectId,
  reportId,
  issues,
  locked,
}: {
  projectId: string;
  reportId: string;
  issues: Issue[];
  locked: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [saving, startSaving] = useTransition();

  function create() {
    startSaving(async () => {
      try {
        await createIssue(projectId, reportId, title, severity);
        setTitle("");
        setSeverity("medium");
        setOpen(false);
        router.refresh();
        toast({ title: "בעיה נרשמה", variant: "success" });
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            בעיות ({issues.length})
          </div>
          {!locked ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="tap">
                  <Plus className="h-4 w-4" />
                  בעיה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>בעיה חדשה</DialogTitle>
                  <DialogDescription>תיעוד של דבר שצריך טיפול.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="issue-title">כותרת</Label>
                    <Input
                      id="issue-title"
                      placeholder="למשל: דליפת מים בסלון"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>חומרה</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">נמוכה</SelectItem>
                        <SelectItem value="medium">בינונית</SelectItem>
                        <SelectItem value="high">גבוהה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={create} disabled={saving || !title.trim()} className="tap">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    שמור
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין בעיות פתוחות להיום.</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${sevColor(i.severity)}`} />
                    <span className="font-medium truncate">{i.title}</span>
                    {i.status === "resolved" ? (
                      <span className="text-xs text-success">טופל</span>
                    ) : null}
                  </div>
                </div>
                {i.status !== "resolved" && !locked ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="tap text-muted-foreground hover:text-success"
                    onClick={async () => {
                      try {
                        await resolveIssue(projectId, i.id);
                        router.refresh();
                      } catch (e) {
                        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
                      }
                    }}
                    aria-label="סמן כטופל"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function sevColor(s: string | null) {
  if (s === "high") return "bg-destructive";
  if (s === "low") return "bg-muted-foreground/50";
  return "bg-warning";
}

function ForemanCard({
  projectId,
  report,
  foremen,
  locked,
}: {
  projectId: string;
  report: NonNullable<Report>;
  foremen: ForemanOption[];
  locked: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [foremanId, setForemanId] = useState(report.foreman_contact_id ?? "");
  const [onSite, setOnSite] = useState<boolean | null>(report.foreman_on_site);

  function save(nextForeman: string, nextOnSite: boolean | null) {
    startSaving(async () => {
      try {
        await saveReportForeman(projectId, report.id, nextForeman || null, nextOnSite);
        router.refresh();
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HardHat className="h-4 w-4 text-muted-foreground" />
          מנהל עבודה
        </div>
        <div className="space-y-1.5">
          <Label>שם מנהל העבודה היום</Label>
          <Select
            value={foremanId}
            onValueChange={(v) => {
              setForemanId(v);
              save(v, onSite);
            }}
            disabled={locked || saving}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר מנהל עבודה" />
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
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant={onSite === true ? "default" : "outline"}
            disabled={locked || saving}
            className="tap"
            onClick={() => {
              setOnSite(true);
              save(foremanId, true);
            }}
          >
            היה באתר
          </Button>
          <Button
            type="button"
            size="sm"
            variant={onSite === false ? "default" : "outline"}
            disabled={locked || saving}
            className="tap"
            onClick={() => {
              setOnSite(false);
              save(foremanId, false);
            }}
          >
            לא הגיע
          </Button>
          {saving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleStatusCard({
  projectId,
  milestones,
  locked,
}: {
  projectId: string;
  milestones: Milestone[];
  locked: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startPending] = useTransition();

  // Show: any late, plus next 3 upcoming non-done.
  const today = new Date();
  const late = milestones.filter(
    (m) => !m.done && m.planned_date && milestoneStatus(m, today) === "late"
  );
  const upcoming = milestones
    .filter((m) => !m.done && m.planned_date && milestoneStatus(m, today) !== "late")
    .slice(0, 3);
  const visible = [...late, ...upcoming];

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            לוח זמנים
          </div>
          <p className="text-sm text-muted-foreground">
            עדיין לא הוגדרו אבני דרך לפרויקט.
          </p>
          <a
            href={`/app/projects/${projectId}/schedule`}
            className="text-sm text-primary hover:underline"
          >
            הוסף אבני דרך ←
          </a>
        </CardContent>
      </Card>
    );
  }

  function markDone(id: string) {
    startPending(async () => {
      try {
        await updateMilestone(projectId, id, { done: true });
        router.refresh();
        toast({ title: "סומן כהושלם", variant: "success" });
      } catch (e) {
        toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            לוח זמנים
            {late.length > 0 ? (
              <span className="rounded-full bg-destructive/10 text-destructive text-xs font-medium px-2 py-0.5">
                {late.length} באיחור
              </span>
            ) : (
              <span className="rounded-full bg-success/10 text-success text-xs font-medium px-2 py-0.5">
                בזמן
              </span>
            )}
          </div>
          <a
            href={`/app/projects/${projectId}/schedule`}
            className="text-xs text-primary hover:underline"
          >
            לעמוד המלא
          </a>
        </div>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            כל אבני הדרך הוגדרו ללא תאריך או הושלמו.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {visible.map((m) => {
              const status = milestoneStatus(m, today);
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.planned_date ? formatDateShort(m.planned_date) : "—"}
                      {status === "late" ? " · באיחור" : ""}
                      {status === "due_soon" ? " · קרוב" : ""}
                    </div>
                  </div>
                  {!locked ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markDone(m.id)}
                      disabled={pending}
                      className="tap text-success"
                      aria-label={`סמן ${m.name} כהושלם`}
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      בוצע
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CloseDayCard({
  projectId,
  reportId,
  locked,
}: {
  projectId: string;
  reportId: string;
  locked: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startPending] = useTransition();
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{locked ? "היום סגור" : "סיימת היום?"}</div>
          <p className="text-sm text-muted-foreground">
            {locked
              ? "הדיווח ננעל. תוכל לפתוח מחדש אם צריך תיקונים."
              : "סגירת היום נועלת את הדיווח לעריכה. אפשר לפתוח שוב אם צריך."}
          </p>
        </div>
        <Button
          onClick={() =>
            startPending(async () => {
              try {
                await setReportLocked(projectId, reportId, !locked);
                router.refresh();
                if (!locked) {
                  // Just closed the day — offer to send summary to client.
                  const willSend = window.confirm("לשלוח סיכום יום ללקוח ב-WhatsApp?");
                  if (willSend) {
                    const res = await sendDailySummaryToClient(projectId, reportId);
                    if (res.sent) {
                      toast({ title: "סיכום נשלח ללקוח", variant: "success" });
                    } else if (res.fallback_url) {
                      window.open(res.fallback_url, "_blank", "noopener,noreferrer");
                    } else if (res.error) {
                      toast({ title: res.error, variant: "destructive" });
                    }
                  }
                }
                toast({
                  title: locked ? "נפתח לעריכה" : "היום נסגר",
                  variant: "success",
                });
              } catch (e) {
                toast({ title: `שגיאה: ${(e as Error).message}`, variant: "destructive" });
              }
            })
          }
          variant={locked ? "outline" : "default"}
          disabled={pending}
          className="tap shrink-0"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : locked ? (
            <LockOpen className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {locked ? "פתח מחדש" : "סגור יום"}
        </Button>
      </CardContent>
    </Card>
  );
}
