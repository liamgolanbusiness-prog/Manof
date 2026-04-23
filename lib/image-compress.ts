"use client";

// Browser-side image compression. A typical phone photo is 3-5MB; we can get
// it under 400KB at 1600px-longest-edge / 0.82 JPEG quality with no visible
// loss for a contractor's site-log use case. Receipts are kept at higher
// resolution (2000px / 0.9) to leave headroom for OCR later.
//
// HEIC (iPhone) is NOT decoded by the canvas — we fall back to the original
// file in that case so the upload still works; the browser will handle the
// image server-side. Same for videos/unknown types.

export type CompressMode = "photo" | "receipt";

const TARGETS: Record<CompressMode, { maxEdge: number; quality: number }> = {
  photo: { maxEdge: 1600, quality: 0.82 },
  receipt: { maxEdge: 2000, quality: 0.9 },
};

const SKIP_IF_BELOW_BYTES = 500 * 1024;

export async function compressImage(
  file: File,
  mode: CompressMode = "photo"
): Promise<File> {
  // Skip small files — they're already fine.
  if (file.size <= SKIP_IF_BELOW_BYTES) return file;
  // Skip unsupported types (HEIC, videos, etc.)
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  // HEIC decoding unreliable across browsers.
  if (file.type === "image/heic" || file.type === "image/heif") return file;

  const { maxEdge, quality } = TARGETS[mode];

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
    } else {
      bitmap = await loadViaImg(file);
    }
  } catch {
    return file; // decoding failed — upload original
  }

  const { width: srcW, height: srcH } =
    "width" in bitmap
      ? { width: bitmap.width, height: bitmap.height }
      : { width: 0, height: 0 };
  if (!srcW || !srcH) return file;

  const longest = Math.max(srcW, srcH);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const destW = Math.round(srcW * scale);
  const destH = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, destW, destH);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return file;

  // If compression somehow produced a bigger file, keep the original.
  if (blob.size >= file.size) return file;

  // Release bitmap memory
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function loadViaImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}
