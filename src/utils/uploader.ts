// Universal persistent media file uploader
// Uploads directly to the user's configured Cloudinary account (works across ALL browsers, incognito, & Shared App URL).
// Falls back to server /api/upload only if Cloudinary is not yet configured.

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface UploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  onProgress?: (percent: number) => void;
}

export async function uploadMediaFile(
  file: File,
  options?: UploadOptions
): Promise<{ url: string; source: 'cloudinary' | 'server' }> {
  const { cloudName, uploadPreset, resourceType = 'auto' } = options || {};
  const cleanCloud = (cloudName || '').trim();
  const cleanPreset = (uploadPreset || '').trim();

  const isPlaceholder =
    !cleanCloud ||
    !cleanPreset ||
    (cleanCloud === 'chemistry-egypt' && (cleanPreset === 'mohamed_mostafa_preset' || cleanPreset === 'chemistry_uploads'));

  // 1. Upload directly to Cloudinary whenever configured
  if (cleanCloud && cleanPreset && !isPlaceholder) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', cleanPreset);
    const endpoint = resourceType === 'video' ? 'video' : resourceType === 'raw' ? 'raw' : 'image';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cleanCloud}/${endpoint}/upload`, {
      method: 'POST',
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      const finalUrl = data.secure_url || data.url;
      if (finalUrl && typeof finalUrl === 'string') {
        return { url: finalUrl, source: 'cloudinary' };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || 'تأكد من تفعيل Unsigned Upload Preset في حساب Cloudinary الخاص بك';
      throw new Error(`فشل الرفع إلى Cloudinary: ${msg}`);
    }
  }

  // 2. Fallback to Server Storage if user hasn't entered their Cloudinary credentials yet
  try {
    const dataUrl = await fileToDataUrl(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        dataUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return { url: data.url, source: 'server' };
      }
    }
  } catch (err) {
    console.warn('Server upload fallback error:', err);
  }

  throw new Error('يرجى إدخال Cloud Name و Upload Preset لحساب Cloudinary الخاص بك في تبويب إعدادات كلاودنري.');
}
