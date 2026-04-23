// Voice-note transcription scaffold. Claude doesn't natively accept audio
// yet, so in the near-term we'd call an external Whisper endpoint (OpenAI
// Whisper API or a self-hosted whisper.cpp). This file defines the shape
// so the UI can be wired ahead of provider selection.
//
// When a transcription provider is chosen, fill in transcribeAudio() with
// the actual fetch. The UI already checks isTranscribeConfigured() and
// degrades to "download audio" link only.

export type TranscribeResult =
  | { ok: true; text: string; language?: string }
  | { ok: false; reason: "disabled" | "error"; message: string };

export function isTranscribeConfigured(): boolean {
  // Toggle to true once OPENAI_API_KEY (or similar) is wired.
  return !!process.env.OPENAI_API_KEY;
}

export async function transcribeAudio(audio: {
  url?: string;
  blob?: Blob;
}): Promise<TranscribeResult> {
  if (!isTranscribeConfigured()) {
    return { ok: false, reason: "disabled", message: "תמלול לא מוגדר" };
  }

  const key = process.env.OPENAI_API_KEY!;
  try {
    let body: FormData;
    if (audio.blob) {
      body = new FormData();
      body.append("file", audio.blob, "audio.webm");
      body.append("model", "whisper-1");
      body.append("language", "he");
    } else if (audio.url) {
      // Fetch remote URL to bytes then post; Whisper needs multipart upload.
      const r = await fetch(audio.url);
      const b = await r.blob();
      body = new FormData();
      body.append("file", b, "audio.webm");
      body.append("model", "whisper-1");
      body.append("language", "he");
    } else {
      return { ok: false, reason: "error", message: "חסר אודיו" };
    }

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body,
    });
    if (!res.ok) {
      return { ok: false, reason: "error", message: `Whisper ${res.status}` };
    }
    const data = (await res.json()) as { text?: string; language?: string };
    return { ok: true, text: data.text ?? "", language: data.language };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}
