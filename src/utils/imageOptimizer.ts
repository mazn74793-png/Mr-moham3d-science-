// Fast client-side image compression/resizing before upload.
// Shrinks multi-megabyte phone/desktop photos into crisp <200KB WebP/JPEG in milliseconds.

export interface OptimizeImageOptions {
  maxDimension?: number;
  quality?: number;
  skipBelowBytes?: number;
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxDimension = 1600,
    quality = 0.84,
    skipBelowBytes = 120 * 1024, // 120 KB
  } = options;

  // Only compress raster images; skip SVG, GIF, or already-tiny images
  const mime = (file.type || '').toLowerCase();
  if (
    !mime.startsWith('image/') ||
    mime === 'image/svg+xml' ||
    mime === 'image/gif' ||
    file.size <= skipBelowBytes
  ) {
    return file;
  }

  try {
    let width = 0;
    let height = 0;
    let drawSource: CanvasImageSource;
    let cleanup: (() => void) | null = null;

    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      drawSource = bitmap;
      cleanup = () => bitmap.close();
    } else {
      const objectUrl = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objectUrl;
      });
      width = img.naturalWidth || img.width;
      height = img.naturalHeight || img.height;
      drawSource = img;
      cleanup = () => URL.revokeObjectURL(objectUrl);
    }

    if (!width || !height) {
      cleanup?.();
      return file;
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cleanup?.();
      return file;
    }

    ctx.drawImage(drawSource, 0, 0, targetW, targetH);
    cleanup?.();

    const targetType = mime === 'image/png' ? 'image/webp' : 'image/jpeg';
    const ext = targetType === 'image/webp' ? 'webp' : 'jpg';

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetType, quality);
    });

    if (!blob || blob.size >= file.size * 0.95) {
      return file;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, {
      type: targetType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
