// High-speed XHR & chunked media uploader with automatic client-side image optimization,
// real-time byte-accurate progress tracking, and live weak-internet speed detection.

import { optimizeImageFile, OptimizeImageOptions } from './imageOptimizer';

export interface UploadProgressInfo {
  percent: number;
  loadedMB: string;
  totalMB: string;
  speedMbps?: number;
}

export interface UploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  skipOptimize?: boolean;
  imageOptions?: OptimizeImageOptions;
  onProgress?: (percent: number, info: UploadProgressInfo) => void;
}

export interface UploadResult {
  url: string;
  source: 'cloudinary' | 'server';
  durationSeconds?: number;
  bytes?: number;
  fallbackReason?: 'cloudinary_limit' | 'cloudinary_error';
}

const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB chunks for server uploads
const CLOUDINARY_CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB chunks for Cloudinary (>= 5 MB minimum)
const CLOUDINARY_FREE_RAW_LIMIT_BYTES = 10 * 1024 * 1024; // 10 MB free plan cap for PDFs/docs/images
const MAX_PARALLEL_CHUNKS = 3;

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function isCloudinaryConfigured(cloudName?: string, uploadPreset?: string): boolean {
  const cleanCloud = (cloudName || '').trim();
  const cleanPreset = (uploadPreset || '').trim();
  if (!cleanCloud || !cleanPreset) return false;

  const isPlaceholder =
    cleanCloud === 'chemistry-egypt' &&
    (cleanPreset === 'mohamed_mostafa_preset' || cleanPreset === 'chemistry_uploads');

  return !isPlaceholder;
}

async function isServerUploadAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const res = await fetch('/api/health', { method: 'GET', signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    return Boolean(json?.ok);
  } catch {
    return false;
  }
}

function createSpeedTracker(totalBytes: number, onProgress?: (percent: number, info: UploadProgressInfo) => void) {
  const startedAt = Date.now();
  let lastPercent = 1;

  const computeMeta = (loadedBytes: number, pct: number): UploadProgressInfo => {
    const elapsedSec = Math.max(0.2, (Date.now() - startedAt) / 1000);
    const speedMbps =
      loadedBytes > 0 ? Number(((loadedBytes * 8) / (elapsedSec * 1_000_000)).toFixed(2)) : 0;

    return {
      percent: pct,
      loadedMB: formatMB(Math.min(loadedBytes, totalBytes)),
      totalMB: formatMB(totalBytes),
      speedMbps,
    };
  };

  return {
    update(loadedBytes: number, pct: number, forceEmit = false) {
      if (forceEmit || pct !== lastPercent) {
        lastPercent = pct;
        onProgress?.(pct, computeMeta(loadedBytes, pct));
      }
    },
    stop() {},
  };
}

function uploadBlobViaXhr(
  url: string,
  body: FormData | Blob,
  headers: Record<string, string>,
  onByteProgress?: (loaded: number, total: number) => void,
  timeoutMs = 120000
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      reject(new Error('تعذر الرفع حالياً، تأكد من اتصال الإنترنت ثم أعد المحاولة.'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.timeout = timeoutMs;

    Object.entries(headers).forEach(([key, val]) => {
      xhr.setRequestHeader(key, val);
    });

    xhr.upload.onprogress = (evt) => {
      if (onByteProgress && evt.total > 0) {
        onByteProgress(evt.loaded, evt.total);
      }
    };

    xhr.onload = () => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(xhr.responseText || '{}');
      } catch {
        parsed = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed);
      } else {
        const msg =
          parsed?.error?.message ||
          parsed?.error ||
          `فشل الرفع (رمز ${xhr.status})`;
        reject(new Error(msg));
      }
    };

    xhr.ontimeout = () => {
      reject(new Error('انتهت مهلة الرفع، يرجى المحاولة مرة أخرى.'));
    };

    xhr.onerror = () => {
      reject(new Error('تعذر إتمام الرفع، يرجى المحاولة مرة أخرى.'));
    };

    xhr.onabort = () => {
      reject(new Error('تم إلغاء عملية الرفع.'));
    };

    xhr.send(body);
  });
}

async function uploadChunkedToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string,
  endpoint: string,
  onProgress?: (percent: number, info: UploadProgressInfo) => void
): Promise<UploadResult> {
  const uniqueUploadId = `cld_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const totalBytes = file.size;
  const totalChunks = Math.ceil(totalBytes / CLOUDINARY_CHUNK_SIZE);
  const tracker = createSpeedTracker(totalBytes, onProgress);

  try {
    let lastData: any = null;
    for (let idx = 0; idx < totalChunks; idx++) {
      const start = idx * CLOUDINARY_CHUNK_SIZE;
      const end = Math.min(totalBytes, start + CLOUDINARY_CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const fd = new FormData();
      fd.append('file', chunk, file.name);
      fd.append('upload_preset', uploadPreset);

      lastData = await uploadBlobViaXhr(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${endpoint}/upload`,
        fd,
        {
          'X-Unique-Upload-Id': uniqueUploadId,
          'Content-Range': `bytes ${start}-${end - 1}/${totalBytes}`,
        },
        (loaded) => {
          const aggregate = Math.min(totalBytes, start + loaded);
          const pct = Math.min(99, Math.max(1, Math.round((aggregate / totalBytes) * 100)));
          tracker.update(aggregate, pct);
        },
        240000
      );
    }

    tracker.update(totalBytes, 100, true);
    const finalUrl = lastData?.secure_url || lastData?.url;
    if (!finalUrl || typeof finalUrl !== 'string') {
      throw new Error('لم يتم استلام رابط الملف من Cloudinary');
    }

    return {
      url: finalUrl,
      source: 'cloudinary',
      durationSeconds: typeof lastData?.duration === 'number' ? lastData.duration : undefined,
      bytes: typeof lastData?.bytes === 'number' ? lastData.bytes : totalBytes,
    };
  } finally {
    tracker.stop();
  }
}

async function uploadChunkedToServer(
  file: File,
  onProgress?: (percent: number, info: UploadProgressInfo) => void,
  fallbackReason?: UploadResult['fallbackReason']
): Promise<UploadResult> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const chunkLoaded = new Array<number>(totalChunks).fill(0);
  const tracker = createSpeedTracker(file.size, onProgress);

  const emitAggregate = () => {
    const sumLoaded = chunkLoaded.reduce((a, b) => a + b, 0);
    const pct = Math.min(97, Math.max(2, Math.round((sumLoaded / Math.max(1, file.size)) * 100)));
    tracker.update(sumLoaded, pct);
  };

  try {
    let nextIdx = 0;
    const worker = async () => {
      while (nextIdx < totalChunks) {
        const idx = nextIdx++;
        const start = idx * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const slice = file.slice(start, end);

        let attempt = 0;
        while (attempt < 3) {
          try {
            await uploadBlobViaXhr(
              `/api/upload-chunk?uploadId=${encodeURIComponent(uploadId)}&index=${idx}`,
              slice,
              { 'Content-Type': 'application/octet-stream' },
              (loaded) => {
                chunkLoaded[idx] = Math.min(slice.size, loaded);
                emitAggregate();
              },
              45000
            );
            chunkLoaded[idx] = slice.size;
            emitAggregate();
            break;
          } catch (err) {
            attempt++;
            chunkLoaded[idx] = 0;
            if (attempt >= 3) throw err;
            await new Promise((r) => setTimeout(r, 900 * attempt));
          }
        }
      }
    };

    const workers = Array.from({ length: Math.min(MAX_PARALLEL_CHUNKS, totalChunks) }, () => worker());
    await Promise.all(workers);

    const completeRes = await fetch('/api/upload-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        filename: file.name,
        totalChunks,
      }),
    });

    const data = await completeRes.json().catch(() => ({}));
    if (!completeRes.ok || !data?.success || !data?.url) {
      throw new Error(data?.error || 'تعذر دمج أجزاء الملف على السيرفر.');
    }

    tracker.update(file.size, 100, true);
    return {
      url: data.url,
      source: 'server',
      bytes: file.size,
      fallbackReason,
    };
  } finally {
    tracker.stop();
  }
}

export async function uploadMediaFile(
  rawFile: File,
  options?: UploadOptions
): Promise<UploadResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('لا يوجد اتصال بالإنترنت حالياً. تأكد من اتصالك ثم أعد رفع الملف.');
  }

  const {
    cloudName,
    uploadPreset,
    resourceType = 'auto',
    skipOptimize = false,
    imageOptions,
    onProgress,
  } = options || {};
  const cleanCloud = (cloudName || '').trim();
  const cleanPreset = (uploadPreset || '').trim();

  const file =
    !skipOptimize && (resourceType === 'image' || rawFile.type.startsWith('image/'))
      ? await optimizeImageFile(rawFile, imageOptions)
      : rawFile;

  onProgress?.(1, {
    percent: 1,
    loadedMB: '0.0',
    totalMB: formatMB(file.size),
  });

  const isVideo = resourceType === 'video' || file.type.startsWith('video/');

  // 1. Upload via Cloudinary when configured (unless a non-video exceeds the 10 MB free tier limit & server is available)
  if (isCloudinaryConfigured(cleanCloud, cleanPreset)) {
    const endpoint =
      resourceType === 'video'
        ? 'video'
        : resourceType === 'raw'
        ? 'raw'
        : resourceType === 'image'
        ? 'image'
        : 'auto';

    // Free Cloudinary rejects raw/PDF/image files >= 10 MB immediately — route straight to parallel chunked server if available
    if (!isVideo && file.size > CLOUDINARY_FREE_RAW_LIMIT_BYTES) {
      if (await isServerUploadAvailable()) {
        return await uploadChunkedToServer(file, onProgress, 'cloudinary_limit');
      }
    }

    const tracker = createSpeedTracker(file.size, onProgress);
    try {
      // Large videos (> 18 MB) use Cloudinary's official 6 MB chunked upload so requests never stall
      if (isVideo && file.size > 18 * 1024 * 1024) {
        tracker.stop();
        return await uploadChunkedToCloudinary(file, cleanCloud, cleanPreset, endpoint, onProgress);
      }

      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', cleanPreset);

      const data = await uploadBlobViaXhr(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cleanCloud)}/${endpoint}/upload`,
        fd,
        {},
        (loaded, total) => {
          const pct = Math.min(99, Math.max(1, Math.round((loaded / Math.max(1, total)) * 100)));
          tracker.update(loaded, pct);
        },
        240000
      );

      tracker.update(file.size, 100, true);

      const finalUrl = data.secure_url || data.url;
      if (finalUrl && typeof finalUrl === 'string') {
        return {
          url: finalUrl,
          source: 'cloudinary',
          durationSeconds: typeof data.duration === 'number' ? data.duration : undefined,
          bytes: typeof data.bytes === 'number' ? data.bytes : file.size,
        };
      }
      throw new Error('لم يتم استلام رابط الملف من Cloudinary');
    } catch (err: any) {
      tracker.stop();
      const rawMsg = String(err?.message || '');
      const isSizeLimit = /file size too large|maximum is|exceeds|413/i.test(rawMsg);

      // Automatic resilient fallback to built-in parallel chunked server uploader if live
      if (await isServerUploadAvailable()) {
        try {
          if (file.size > CHUNK_SIZE) {
            return await uploadChunkedToServer(
              file,
              onProgress,
              isSizeLimit ? 'cloudinary_limit' : 'cloudinary_error'
            );
          }
          const rawRes = await uploadBlobViaXhr(
            `/api/upload-raw?filename=${encodeURIComponent(file.name)}`,
            file,
            { 'Content-Type': 'application/octet-stream' },
            (loaded, total) => {
              const pct = Math.min(99, Math.max(1, Math.round((loaded / Math.max(1, total)) * 100)));
              tracker.update(loaded, pct);
            },
            90000
          );
          if (rawRes?.success && rawRes?.url) {
            return {
              url: rawRes.url,
              source: 'server',
              bytes: file.size,
              fallbackReason: isSizeLimit ? 'cloudinary_limit' : 'cloudinary_error',
            };
          }
        } catch {}
      }

      if (isSizeLimit) {
        throw new Error(
          `حجم الملف (${formatMB(file.size)} MB) يتجاوز الحد الأقصى لخطة Cloudinary المجانية (10 MB لملفات PDF والصور، و100 MB للفيديو). قم بضغط الملف أقل من 10 MB أو فعّل الرفع عبر السيرفر.`
        );
      }

      throw new Error(
        `فشل الرفع إلى Cloudinary: ${rawMsg || 'تأكد من الاتصال وإعداد Unsigned Upload Preset'}`
      );
    } finally {
      tracker.stop();
    }
  }

  // 2. High-speed parallel chunked upload for files > CHUNK_SIZE, or single raw POST for smaller files
  const tracker = createSpeedTracker(file.size, onProgress);
  try {
    if (file.size > CHUNK_SIZE) {
      tracker.stop();
      return await uploadChunkedToServer(file, onProgress);
    }

    const data = await uploadBlobViaXhr(
      `/api/upload-raw?filename=${encodeURIComponent(file.name)}`,
      file,
      { 'Content-Type': 'application/octet-stream' },
      (loaded, total) => {
        const pct = Math.min(99, Math.max(1, Math.round((loaded / Math.max(1, total)) * 100)));
        tracker.update(loaded, pct);
      },
      90000
    );

    if (data?.success && data?.url) {
      tracker.update(file.size, 100, true);
      return {
        url: data.url,
        source: 'server',
        bytes: file.size,
      };
    }
  } catch (err: any) {
    console.warn('Server upload error:', err?.message || err);
  } finally {
    tracker.stop();
  }

  throw new Error(
    'تعذر رفع الملف: يرجى إدخال Cloud Name و Upload Preset لحساب Cloudinary الخاص بك في تبويب إعدادات كلاودنري.'
  );
}
