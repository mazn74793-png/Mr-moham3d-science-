// High-speed XHR & chunked media uploader with automatic client-side image optimization
// and real-time byte-accurate progress tracking for videos, images, and PDF handouts.

import { optimizeImageFile } from './imageOptimizer';

export interface UploadProgressInfo {
  percent: number;
  loadedMB: string;
  totalMB: string;
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

function uploadBlobViaXhr(
  url: string,
  body: FormData | Blob,
  headers: Record<string, string>,
  onByteProgress?: (loaded: number, total: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

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

    xhr.onerror = () => {
      reject(new Error('حدث خطأ في الاتصال بالشبكة أثناء الرفع، يرجى المحاولة مرة أخرى.'));
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

  const emitAggregate = () => {
    if (!onProgress) return;
    const sumLoaded = chunkLoaded.reduce((a, b) => a + b, 0);
    const pct = Math.min(97, Math.max(2, Math.round((sumLoaded / Math.max(1, file.size)) * 100)));
    onProgress(pct, {
      percent: pct,
      loadedMB: formatMB(Math.min(sumLoaded, file.size)),
      totalMB: formatMB(file.size),
    });
  };

  let nextIdx = 0;
  const worker = async () => {
    while (nextIdx < totalChunks) {
      const idx = nextIdx++;
      const start = idx * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const slice = file.slice(start, end);

      let attempt = 0;
      while (attempt < 2) {
        try {
          await uploadBlobViaXhr(
            `/api/upload-chunk?uploadId=${encodeURIComponent(uploadId)}&index=${idx}`,
            slice,
            { 'Content-Type': 'application/octet-stream' },
            (loaded) => {
              chunkLoaded[idx] = Math.min(slice.size, loaded);
              emitAggregate();
            }
          );
          chunkLoaded[idx] = slice.size;
          emitAggregate();
          break;
        } catch (err) {
          attempt++;
          chunkLoaded[idx] = 0;
          if (attempt >= 2) throw err;
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

  onProgress?.(100, {
    percent: 100,
    loadedMB: formatMB(file.size),
    totalMB: formatMB(file.size),
  });

  return {
    url: data.url,
    source: 'server',
    bytes: file.size,
  };
}

export async function uploadMediaFile(
  rawFile: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const { cloudName, uploadPreset, resourceType = 'auto', skipOptimize = false, onProgress } = options || {};
  const cleanCloud = (cloudName || '').trim();
  const cleanPreset = (uploadPreset || '').trim();

  // Auto-compress images before uploading for 10x-30x faster upload & student loading
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

    try {
      let lastPct = 0;
      const data = await uploadBlobViaXhr(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cleanCloud)}/${endpoint}/upload`,
        fd,
        {},
        (loaded, total) => {
          const pct = Math.min(99, Math.max(1, Math.round((loaded / total) * 100)));
          if (pct !== lastPct) {
            lastPct = pct;
            onProgress?.(pct, {
              percent: pct,
              loadedMB: formatMB(Math.min(loaded, total)),
              totalMB: formatMB(total),
            });
          }
        }
      );

      onProgress?.(100, {
        percent: 100,
        loadedMB: formatMB(file.size),
        totalMB: formatMB(file.size),
      });

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
        `فشل الرفع إلى Cloudinary: ${err?.message || 'تأكد من تفعيل Unsigned Upload Preset'}`
      );
    }
  }

  // 2. High-speed parallel chunked upload for files > CHUNK_SIZE, or single raw POST for smaller files
  try {
    if (file.size > CHUNK_SIZE) {
      return await uploadChunkedToServer(file, onProgress);
    }

    let lastPct = 0;
    const data = await uploadBlobViaXhr(
      `/api/upload-raw?filename=${encodeURIComponent(file.name)}`,
      file,
      { 'Content-Type': 'application/octet-stream' },
      (loaded, total) => {
        const pct = Math.min(99, Math.max(1, Math.round((loaded / total) * 100)));
        if (pct !== lastPct) {
          lastPct = pct;
          onProgress?.(pct, {
            percent: pct,
            loadedMB: formatMB(Math.min(loaded, total)),
            totalMB: formatMB(total),
          });
        }
      }
    );

    if (data?.success && data?.url) {
      onProgress?.(100, {
        percent: 100,
        loadedMB: formatMB(file.size),
        totalMB: formatMB(file.size),
      });
      return {
        url: data.url,
        source: 'server',
        bytes: file.size,
      };
    }
  } catch (err: any) {
    console.warn('Server upload error:', err?.message || err);
  }

  throw new Error(
    'تعذر رفع الملف: يرجى إدخال Cloud Name و Upload Preset لحساب Cloudinary الخاص بك في تبويب إعدادات كلاودنري.'
  );
}
