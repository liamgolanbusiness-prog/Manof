"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { uploadVoiceNote } from "./upload-client";
import { setVoiceNote } from "./actions";
import { useToast } from "@/components/ui/use-toast";

export function VoiceCard({
  projectId,
  reportId,
  voiceNoteUrl,
  locked,
}: {
  projectId: string;
  reportId: string;
  voiceNoteUrl: string | null;
  locked: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const mr = mediaRef.current;
      if (mr && mr.state !== "inactive") mr.stop();
    };
  }, []);

  async function start() {
    if (locked) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast({ title: "המכשיר לא תומך בהקלטה", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleBlob(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
      };
      mr.start();
      mediaRef.current = mr;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch (e) {
      toast({
        title: `לא ניתן להפעיל מיקרופון: ${(e as Error).message}`,
        variant: "destructive",
      });
    }
  }

  function stop() {
    const mr = mediaRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }

  function handleBlob(blob: Blob) {
    if (blob.size < 500) {
      toast({ title: "ההקלטה קצרה מדי", variant: "destructive" });
      return;
    }
    startSaving(async () => {
      try {
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        const url = await uploadVoiceNote(projectId, reportId, blob, ext);
        await setVoiceNote(projectId, reportId, url);
        router.refresh();
        toast({ title: "הקלטה נשמרה", variant: "success" });
      } catch (e) {
        toast({
          title: `שגיאה: ${(e as Error).message}`,
          variant: "destructive",
        });
      }
    });
  }

  function removeNote() {
    if (!confirm("למחוק את ההקלטה?")) return;
    startDeleting(async () => {
      try {
        await setVoiceNote(projectId, reportId, null);
        router.refresh();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mic className="h-4 w-4 text-muted-foreground" />
          הודעה קולית
        </div>

        {voiceNoteUrl && !recording ? (
          <div className="space-y-2">
            <audio
              controls
              src={voiceNoteUrl}
              className="w-full"
              preload="metadata"
            />
            {!locked ? (
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={removeNote}
                  disabled={deleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  מחק
                </Button>
                <Button size="sm" variant="outline" onClick={start} disabled={saving} className="tap">
                  <Mic className="h-4 w-4" />
                  הקלט מחדש
                </Button>
              </div>
            ) : null}
          </div>
        ) : recording ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-destructive font-mono text-lg">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              {formatMMSS(elapsed)}
            </div>
            <Button onClick={stop} variant="destructive" className="tap">
              <Square className="h-4 w-4" />
              עצור
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              לחץ והקלט — לפעמים יותר מהיר מלהקליד.
            </p>
            <Button onClick={start} disabled={locked || saving} className="tap shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              הקלט
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const prefs = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of prefs) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return undefined;
}

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
