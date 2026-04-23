"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCcw,
  Share2,
  Shield,
  Timer,
  Unlock,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import {
  regenerateToken,
  revokePortal,
  reactivatePortal,
  setPortalExpiry,
  setPortalPin,
} from "./actions";

type Project = {
  id: string;
  name: string;
  client_name: string | null;
  client_phone: string | null;
  portal_token: string;
  progress_pct: number | null;
  portal_expires_at: string | null;
  has_pin: boolean;
  revoked: boolean;
  view_count: number;
  last_viewed_at: string | null;
};

const EXPIRY_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: "30", label: "30 ימים", days: 30 },
  { value: "60", label: "60 ימים", days: 60 },
  { value: "90", label: "90 ימים", days: 90 },
  { value: "180", label: "חצי שנה", days: 180 },
  { value: "365", label: "שנה", days: 365 },
  { value: "never", label: "ללא תפוגה", days: null },
];

export function ClientShareCard({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [expirySel, setExpirySel] = useState<string>("90");
  const [pendingAction, startAction] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");
  const portalUrl = `${base.replace(/\/$/, "")}/portal/${project.portal_token}`;
  const expired =
    project.portal_expires_at &&
    new Date(project.portal_expires_at).getTime() < Date.now();

  const message =
    `שלום${project.client_name ? ` ${project.client_name}` : ""}, הנה קישור לעדכון חי על הפרויקט "${project.name}":\n${portalUrl}` +
    (project.has_pin ? `\n\nקוד כניסה: (אשלח בהודעה נפרדת)` : "");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function whatsappHref() {
    const to = (project.client_phone || "").replace(/[^\d+]/g, "");
    const text = encodeURIComponent(message);
    return to
      ? `https://wa.me/${to.replace(/^\+/, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
  }

  function withToast(fn: () => Promise<unknown>, okMsg: string) {
    startAction(async () => {
      try {
        await fn();
        toast({ title: okMsg });
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Share2 className="h-5 w-5 text-primary" />
            קישור ללקוח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            כל לקוח רואה דף מותאם עם תמונות, אחוז התקדמות ומצב תשלומים. אין צורך
            בהתחברות.
          </p>

          {project.revoked ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">הגישה מנוטרלת</div>
                <div className="text-xs">הלקוח לא יוכל לפתוח את הקישור עד שתשחרר.</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => withToast(() => reactivatePortal(project.id), "הגישה הושבה")}
                disabled={pendingAction}
              >
                <Unlock className="h-4 w-4" />
                שחרור
              </Button>
            </div>
          ) : expired ? (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
              <Timer className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">הקישור פג תוקף</div>
                <div className="text-xs">הארך או יצר קישור חדש.</div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl bg-muted p-3 text-sm break-all" dir="ltr">
            {portalUrl}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copyLink} variant="outline" className="tap" disabled={project.revoked}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  הועתק
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  העתק קישור
                </>
              )}
            </Button>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
              <Button
                className="tap bg-[#25D366] hover:bg-[#1fb855] text-white"
                disabled={project.revoked}
              >
                <MessageCircle className="h-4 w-4" />
                שלח בוואטסאפ
              </Button>
            </a>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="tap">
                <ExternalLink className="h-4 w-4" />
                תצוגה מקדימה
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            אבטחה ובקרה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 text-sm rounded-xl bg-muted/50 p-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="h-4 w-4" />
                כניסות של הלקוח
              </div>
              <div className="text-2xl font-bold">{project.view_count}</div>
              {project.last_viewed_at ? (
                <div className="text-xs text-muted-foreground">
                  אחרון: {formatDateShort(project.last_viewed_at)}
                </div>
              ) : null}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Timer className="h-4 w-4" />
                תוקף
              </div>
              <div className="text-sm font-semibold">
                {project.portal_expires_at
                  ? formatDateShort(project.portal_expires_at)
                  : "ללא"}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-4 w-4" />
                קוד כניסה
              </div>
              <div className="text-sm font-semibold">
                {project.has_pin ? "מוגדר ✓" : "ללא"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>תוקף הקישור</Label>
            <div className="flex gap-2">
              <Select value={expirySel} onValueChange={setExpirySel}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  const opt = EXPIRY_OPTIONS.find((o) => o.value === expirySel);
                  if (!opt) return;
                  withToast(() => setPortalExpiry(project.id, opt.days), "התוקף עודכן");
                }}
                disabled={pendingAction}
                className="tap"
              >
                עדכן
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>קוד כניסה 4 ספרות (אופציונלי)</Label>
            <div className="flex gap-2">
              <Input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={project.has_pin ? "****" : "1234"}
                inputMode="numeric"
                dir="ltr"
                className="flex-1 text-center tracking-[0.5em]"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (pinInput.length !== 4) {
                    toast({ title: "הקוד חייב להיות 4 ספרות", variant: "destructive" });
                    return;
                  }
                  withToast(() => setPortalPin(project.id, pinInput), "הקוד הוגדר");
                  setPinInput("");
                }}
                disabled={pendingAction}
                className="tap"
              >
                <KeyRound className="h-4 w-4" />
                הגדר
              </Button>
              {project.has_pin ? (
                <Button
                  variant="ghost"
                  onClick={() => withToast(() => setPortalPin(project.id, null), "הקוד הוסר")}
                  disabled={pendingAction}
                  className="tap text-destructive hover:text-destructive"
                >
                  הסר
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              אם תגדיר, הלקוח יזדקק גם לקוד בנוסף לקישור. שלח את הקוד בהודעה נפרדת.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() =>
                withToast(() => regenerateToken(project.id), "נוצר קישור חדש")
              }
              disabled={pendingAction}
              className="tap"
            >
              {pendingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              יצר קישור חדש
            </Button>
            {project.revoked ? null : (
              <Button
                variant="ghost"
                onClick={() => withToast(() => revokePortal(project.id), "הגישה נוטרלה")}
                disabled={pendingAction}
                className="tap text-destructive hover:text-destructive"
              >
                <Lock className="h-4 w-4" />
                נטרל גישה
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
