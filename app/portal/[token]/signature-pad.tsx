"use client";

import { useEffect, useRef, useState } from "react";

// Touch + mouse signature pad. Exports a data-URL PNG through a hidden input
// so the existing <form action=...> server-action flow picks it up without
// any client-side fetch plumbing.
//
// Keeping it small on purpose: no library, no undo stack, no pressure
// sensitivity. A client drawing their name once is enough.

export function SignaturePad({
  name,
  signatureFieldName,
}: {
  name: string; // visible label / also used for the typed-name hidden field
  signatureFieldName: string; // hidden input carrying the data-URL PNG
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [typedName, setTypedName] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to its CSS size with device pixel ratio for crispness.
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let drawing = false;
    let last: { x: number; y: number } | null = null;

    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      last = point(e);
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drawing || !last) return;
      const p = point(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    };
    const up = () => {
      if (drawing && canvas) {
        const url = canvas.toDataURL("image/png");
        setDataUrl(url);
        setHasSignature(true);
      }
      drawing = false;
      last = null;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", up);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setDataUrl("");
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">הקלד את שמך:</label>
      <input
        name={name}
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        required
        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
        placeholder="שם מלא"
      />
      <label className="text-xs text-muted-foreground mt-2 block">
        חתימה (אופציונלי):
      </label>
      <div className="rounded-xl border bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-32 touch-none cursor-crosshair rounded-xl"
          aria-label="שטח חתימה"
        />
      </div>
      <input type="hidden" name={signatureFieldName} value={dataUrl} />
      <div className="flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground hover:text-primary"
        >
          נקה חתימה
        </button>
        {hasSignature ? (
          <span className="text-success">✓ נחתם</span>
        ) : (
          <span className="text-muted-foreground">ציור באצבע</span>
        )}
      </div>
    </div>
  );
}
