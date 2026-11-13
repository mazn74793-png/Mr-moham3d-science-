// Unified XHR media uploader with real-time progress tracking for videos, images, and files.
// Streams File directly via XHR (without Base64 memory buffering) for smooth 1% -> 100% progress.

export interface UploadProgressInfo {
  percent: number;
  loadedMB: string;
  totalMB: string;
}

export interface UploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  onProgress?: (percent: number, info: UploadProgressInfo) => void;
}

export interface UploadResult {
  url: string;
  source: 'cloudinary' | 'server';
  durationSeconds?: number;
  bytes?: number;
}

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

function uploadViaXhr(
  url: string,
  body: FormData | File | string,
  headers: Record<string, string>,
  totalFileSize: number,
  onProgress?: (percent: number, info: UploadProgressInfo) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    Object.entries(headers).forEach(([key, val]) => {
      xhr.setRequestHeader(key, val);
    });

    let lastReportedPercent = 0;

    xhr.upload.onprogress = (evt) => {
      const total = evt.lengthComputable && evt.total > 0 ? evt.total : totalFileSize;
      if (total > 0 && onProgress) {
        const rawPercent = Math.round((evt.loaded / total) * 100);
        const percent = Math.min(99, Math.max(1, rawPercent));
        if (percent !== lastReportedPercent || evt.loaded === total) {
          lastReportedPercent = percent;
          onProgress(percent, {
            percent,
            loadedMB: formatMB(Math.min(evt.loaded, total)),
            totalMB: formatMB(total),
          });
        }
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
        if (onProgress) {
          onProgress(100, {
            percent: 100,
            loadedMB: formatMB(totalFileSize),
            totalMB: formatMB(totalFileSize),
          });
        }
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

export async function uploadMediaFile(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const { cloudName, uploadPreset, resourceType = 'auto', onProgress } = options || {};
  const cleanCloud = (cloudName || '').trim();
  const cleanPreset = (uploadPreset || '').trim();

  if (onProgress) {
    onProgress(1, {
      percent: 1,
      loadedMB: '0.0',
      totalMB: formatMB(file.size),
    });
  }

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
      const data = await uploadViaXhr(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cleanCloud)}/${endpoint}/upload`,
        fd,
        {},
        file.size,
        onProgress
      );
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

  // 2. Direct binary stream upload to /api/upload-raw (smooth real-time XHR progress without Base64 stall)
  try {
    const data = await uploadViaXhr(
      `/api/upload-raw?filename=${encodeURIComponent(file.name)}`,
      file,
      { 'Content-Type': 'application/octet-stream' },
      file.size,
      onProgress
    );
    if (data?.success && data?.url) {
      return {
        url: data.url,
        source: 'server',
        bytes: file.size,
      };
    }
  } catch (err: any) {
    console.warn('Server raw upload error:', err?.message || err);
  }

  throw new Error(
    'تعذر رفع الملف: يرجى إدخال Cloud Name و Upload Preset لحساب Cloudinary الخاص بك في تبويب إعدادات كلاودنري لرفع الملفات والصور سحابياً.'
  );
}
