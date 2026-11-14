// High-speed XHR & chunked media uploader with automatic client-side image optimization,
// real-time byte-accurate progress tracking, and live weak-internet speed detection.

import { optimizeImageFile } from './imageOptimizer';
import { emitNetworkAlert, getQuickNetworkStatus, probeNetworkQuality } from './networkMonitor';

export interface UploadProgressInfo {
  percent: number;
  loadedMB: string;
  totalMB: string;
  speedMbps?: number;
  isSlowNetwork?: boolean;
  networkWarning?: string;
}

export interface UploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  skipOptimize?: boolean;
  onProgress?: (percent: number, info: UploadProgressInfo) => void;
}

export interface UploadResult {
  url: string;
  source: 'cloudinary' | 'server';
  durationSeconds?: number;
  bytes?: number;
}

const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB chunks avoid proxy stalls and give instant streaming progress
const MAX_PARALLEL_CHUNKS = 3;
const SLOW_SPEED_THRESHOLD_MBPS = 0.5;
const STALL_MS_THRESHOLD = 6500;

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

function createSpeedTracker(totalBytes: number, onProgress?: (percent: number, info: UploadProgressInfo) => void) {
  const startedAt = Date.now();
  let lastProgressAt = startedAt;
  let lastLoadedBytes = 0;
  let lastPercent = 1;
  let slowAlertSent = false;

  const computeMeta = (loadedBytes: number, pct: number, stalled = false): UploadProgressInfo => {
    const elapsedSec = Math.max(0.2, (Date.now() - startedAt) / 1000);
    const speedMbps =
      loadedBytes > 0 ? Number(((loadedBytes * 8) / (elapsedSec * 1_000_000)).toFixed(2)) : 0;

    const quick = getQuickNetworkStatus();
    const isSlow =
      stalled ||
      quick.level !== 'good' ||
      (elapsedSec >= 3.5 && loadedBytes < totalBytes && speedMbps > 0 && speedMbps < SLOW_SPEED_THRESHOLD_MBPS);

    let networkWarning: string | undefined;
    if (isSlow) {
      networkWarning =
        quick.level === 'offline'
          ? 'انقطع الاتصال بالإنترنت أثناء الرفع!'
          : stalled
          ? 'تأخر استجابة الشبكة — الإنترنت ضعيف أو غير مستقر، يرجى الانتظار وعدم إغلاق الصفحة.'
          : 'سرعة الرفع ضعيفة حالياً — جاري الاستكمال تلقائياً، لا تغلق الصفحة.';

      if (!slowAlertSent) {
        slowAlertSent = true;
        emitNetworkAlert({
          level: quick.level === 'offline' ? 'offline' : 'slow',
          message: networkWarning,
          speedMbps,
          context: 'upload',
        });
      }
    }

    return {
      percent: pct,
      loadedMB: formatMB(Math.min(loadedBytes, totalBytes)),
      totalMB: formatMB(totalBytes),
      speedMbps,
      isSlowNetwork: isSlow,
      networkWarning,
    };
  };

  const watchdog = setInterval(() => {
    const now = Date.now();
    if (now - lastProgressAt >= STALL_MS_THRESHOLD && lastPercent < 99) {
      const info = computeMeta(lastLoadedBytes, lastPercent, true);
      onProgress?.(lastPercent, info);
    }
  }, 2500);

  return {
    update(loadedBytes: number, pct: number, forceEmit = false) {
      if (loadedBytes > lastLoadedBytes) {
        lastLoadedBytes = loadedBytes;
        lastProgressAt = Date.now();
      }
      if (forceEmit || pct !== lastPercent) {
        lastPercent = pct;
        onProgress?.(pct, computeMeta(loadedBytes, pct, false));
      }
    },
    stop() {
      clearInterval(watchdog);
    },
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
      const msg = 'انقطع الاتصال بالإنترنت — تأكد من الشبكة ثم أعد المحاولة.';
      emitNetworkAlert({ level: 'offline', message: msg, context: 'upload' });
      reject(new Error(msg));
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
      const msg = 'انتهت مهلة الاتصال بسبب بطء الإنترنت أثناء الرفع، يرجى المحاولة مرة أخرى.';
      emitNetworkAlert({ level: 'slow', message: msg, context: 'upload' });
      reject(new Error(msg));
    };

    xhr.onerror = () => {
      const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
      const msg = offlineNow
        ? 'انقطع الاتصال بالإنترنت أثناء الرفع، تحقق من الشبكة ثم أعد المحاولة.'
        : 'حدث خطأ في الاتصال أو الإنترنت ضعيف أثناء الرفع، يرجى المحاولة مرة أخرى.';
      emitNetworkAlert({ level: offlineNow ? 'offline' : 'slow', message: msg, context: 'upload' });
      reject(new Error(msg));
    };

    xhr.onabort = () => {
      reject(new Error('تم إلغاء عملية الرفع.'));
    };

    xhr.send(body);
  });
}

async function uploadChunkedToServer(
  file: File,
  onProgress?: (percent: number, info: UploadProgressInfo) => void
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
    const msg = 'لا يوجد اتصال بالإنترنت حالياً. تأكد من اتصالك ثم أعد رفع الملف.';
    emitNetworkAlert({ level: 'offline', message: msg, context: 'upload' });
    throw new Error(msg);
  }

  // Non-blocking background quality probe when connection hints weakness
  if (getQuickNetworkStatus().level !== 'good') {
    probeNetworkQuality('upload');
  }

  const { cloudName, uploadPreset, resourceType = 'auto', skipOptimize = false, onProgress } = options || {};
  const cleanCloud = (cloudName || '').trim();
  const cleanPreset = (uploadPreset || '').trim();

  const file =
    !skipOptimize && (resourceType === 'image' || rawFile.type.startsWith('image/'))
      ? await optimizeImageFile(rawFile)
      : rawFile;

  onProgress?.(1, {
    percent: 1,
    loadedMB: '0.0',
    totalMB: formatMB(file.size),
  });

  // 1. Direct FormData XHR upload to Cloudinary when configured
  if (isCloudinaryConfigured(cleanCloud, cleanPreset)) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', cleanPreset);
    const endpoint =
      resourceType === 'video'
        ? 'video'
        : resourceType === 'raw'
        ? 'raw'
        : resourceType === 'image'
        ? 'image'
        : 'auto';

    const tracker = createSpeedTracker(file.size, onProgress);
    try {
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
      throw new Error(
        `فشل الرفع إلى Cloudinary: ${err?.message || 'تأكد من الاتصال وإعداد Unsigned Upload Preset'}`
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
