// Unified XHR media uploader with real-time progress tracking for videos, images, and files.
// Uploads directly to the user's configured Cloudinary account (persistent across all browsers & devices).

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

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('تعذر قراءة الملف من الجهاز'));
    reader.readAsDataURL(file);
  });
}

function uploadViaXhr(
  url: string,
  body: FormData | string,
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

    xhr.upload.onprogress = (evt) => {
      const total = evt.lengthComputable && evt.total > 0 ? evt.total : totalFileSize;
      if (total > 0 && onProgress) {
        const percent = Math.min(99, Math.max(1, Math.round((evt.loaded / total) * 100)));
        onProgress(percent, {
          percent,
          loadedMB: formatMB(evt.loaded),
          totalMB: formatMB(total),
        });
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

  // 1. Upload directly to Cloudinary whenever configured
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
        `https://api.cloudinary.com/v1_1/${cleanCloud}/${endpoint}/upload`,
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

  // 2. Fallback to Server Storage if user hasn't entered their Cloudinary credentials yet
  try {
    const dataUrl = await fileToDataUrl(file);
    const payload = JSON.stringify({
      filename: file.name,
      dataUrl,
    });
    const data = await uploadViaXhr(
      '/api/upload',
      payload,
      { 'Content-Type': 'application/json' },
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
  } catch (err) {
    console.warn('Server upload fallback error:', err);
  }

  throw new Error(
    'يرجى إدخال Cloud Name و Upload Preset لحساب Cloudinary الخاص بك في تبويب إعدادات كلاودنري.'
  );
}
