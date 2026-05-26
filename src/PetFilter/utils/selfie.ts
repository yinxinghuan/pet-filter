// Pre-upload selfie prep: downscale large camera shots so the upload
// + img2img keep working fast. Modeled on Mugshot's prepareSelfie.

const MAX_SIDE = 1024;
const TARGET_QUALITY = 0.86;

export async function prepareSelfie(file: File): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file;
  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = scale(bitmap.width, bitmap.height, MAX_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', TARGET_QUALITY),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

function scale(w: number, h: number, max: number): { width: number; height: number } {
  const m = Math.max(w, h);
  if (m <= max) return { width: w, height: h };
  const k = max / m;
  return { width: Math.round(w * k), height: Math.round(h * k) };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Stable object URL for showing the preview thumbnail. Caller revokes. */
export function previewURL(file: File): string {
  return URL.createObjectURL(file);
}
