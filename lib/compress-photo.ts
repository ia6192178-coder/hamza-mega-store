// Client-side photo compression, shared by the product form (v3) and the
// blog form (v5). Phone photos are 2–5MB — far too big to send to the
// server as-is (Vercel rejects requests over 4.5MB, and uploads crawl on
// a slow connection). Every photo is resized in the browser before
// saving: max 1200px on the long edge, JPEG quality 0.82 — usually
// 100–200KB. If the result is still over ~1MB, one smaller/lower-quality
// retry runs before giving up.
//
// Client-only: uses document/canvas — import only from 'use client'
// components, never from server code.

export const MAX_PHOTO_EDGE = 1200;
export const MAX_PHOTO_BYTES = 1_000_000;

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo. Please try another file.'));
    };
    img.src = url;
  });
}

function renderJpeg(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number,
): string {
  const scale = Math.min(
    1,
    maxEdge / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot process photos.');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

// Approximate binary size of a data URL (base64 is ~4/3 of the binary).
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor(base64.length * 0.75);
}

export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG or PNG).');
  }
  const img = await loadImageFile(file);
  const first = renderJpeg(img, MAX_PHOTO_EDGE, 0.82);
  if (dataUrlBytes(first) <= MAX_PHOTO_BYTES) return first;
  const retry = renderJpeg(img, 900, 0.7);
  if (dataUrlBytes(retry) <= MAX_PHOTO_BYTES) return retry;
  throw new Error(
    'This photo is still too large after compression — please choose a smaller photo.',
  );
}
