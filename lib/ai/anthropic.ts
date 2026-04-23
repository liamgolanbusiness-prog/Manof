// Thin wrapper around the Anthropic Messages API via fetch. No SDK dep so
// we don't add 40KB to the server bundle. All callers NOOP when
// ANTHROPIC_API_KEY is missing — features just gracefully degrade to
// manual entry.

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export type MessageContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

export async function askClaude(opts: {
  system?: string;
  messages: { role: "user" | "assistant"; content: string | MessageContent[] }[];
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
  };
  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");
}

// Extract the first JSON object from a potentially markdown-wrapped response.
export function extractJson<T = unknown>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const raw = fenced ? fenced[1] : text.match(/\{[\s\S]*\}/)?.[0];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
