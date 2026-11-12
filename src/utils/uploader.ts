// Universal persistent media file uploader
// Tries Cloudinary first; if Cloudinary fails or is unconfigured, uploads to /api/upload
// NEVER returns a local blob: URL so uploads work seamlessly in incognito and across all browsers

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

  // 1. Try Cloudinary if cloudName and uploadPreset look valid
  if (cloudName && uploadPreset && cloudName !== 'chemistry-egypt' && uploadPreset !== 'chemistry_uploads') {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      const endpoint = resourceType === 'video' ? 'video' : 'image';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        const finalUrl = data.secure_url || data.url;
        if (finalUrl && typeof finalUrl === 'string') {
          return { url: finalUrl, source: 'cloudinary' };
        }
      }
    } catch (err) {
      console.warn('Cloudinary upload attempt encountered an issue, switching to direct server upload:', err);
    }
  }

  // 2. Direct Server Persistent Storage (Works across incognito, all browsers & mobile devices)
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
    console.warn('Server upload error:', err);
  }

  // 3. Fallback: Last attempt to Cloudinary with general preset if not attempted
  if (cloudName) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset || 'chemistry_uploads');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        const finalUrl = data.secure_url || data.url;
        if (finalUrl) return { url: finalUrl, source: 'cloudinary' };
      }
    } catch (e) {
      // Ignore
    }
  }

  throw new Error('تعذر رفع الملف، يرجى المحاولة مرة أخرى.');
}
