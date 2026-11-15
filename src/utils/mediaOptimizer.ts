// Fast-start video stream & thumbnail optimizer with smart Cloudinary transforms and lightweight prefetching

export type VideoQualityMode = 'fast' | 'eco' | 'hd';

const CLOUDINARY_VIDEO_UPLOAD_MARKER = '/video/upload/';
const CLOUDINARY_IMAGE_UPLOAD_MARKER = '/image/upload/';

export function isCloudinaryVideoUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('res.cloudinary.com') && url.includes(CLOUDINARY_VIDEO_UPLOAD_MARKER);
}

/**
 * Injects fast-streaming Cloudinary transformations (adaptive codec + auto quality)
 * so heavy raw uploaded videos begin playing immediately with far less buffering.
 * Leaves non-Cloudinary or already-transformed URLs untouched.
 */
export function optimizeVideoStreamUrl(url: string, quality: VideoQualityMode = 'fast'): string {
  if (!url) return '';
  if (!isCloudinaryVideoUrl(url)) return url;

  const idx = url.indexOf(CLOUDINARY_VIDEO_UPLOAD_MARKER);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + CLOUDINARY_VIDEO_UPLOAD_MARKER.length);
  const rest = url.slice(idx + CLOUDINARY_VIDEO_UPLOAD_MARKER.length);

  // If the URL already carries explicit Cloudinary transform directives before version/filename, keep as-is
  const firstSegment = rest.split('/')[0] || '';
  if (firstSegment && !/^v\d+$/.test(firstSegment) && firstSegment.includes('_')) {
    return url;
  }

  const transform =
    quality === 'eco'
      ? 'f_auto,vc_auto,q_auto:low,w_854,c_limit'
      : quality === 'hd'
      ? 'f_auto,vc_auto,q_auto:good'
      : 'f_auto,vc_auto,q_auto:eco,w_1280,c_limit';

  return `${prefix}${transform}/${rest}`;
}

export function optimizeImageUrl(url?: string, maxWidth = 900): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes(CLOUDINARY_IMAGE_UPLOAD_MARKER)) {
    return url;
  }
  const idx = url.indexOf(CLOUDINARY_IMAGE_UPLOAD_MARKER);
  const prefix = url.slice(0, idx + CLOUDINARY_IMAGE_UPLOAD_MARKER.length);
  const rest = url.slice(idx + CLOUDINARY_IMAGE_UPLOAD_MARKER.length);
  const firstSegment = rest.split('/')[0] || '';
  if (firstSegment && !/^v\d+$/.test(firstSegment) && firstSegment.includes('_')) {
    return url;
  }
  return `${prefix}f_auto,q_auto,w_${maxWidth},c_limit/${rest}`;
}

/**
 * Derives a fast poster frame from a Cloudinary video URL when the lecture uses the generic fallback thumbnail.
 */
export function getVideoPosterUrl(videoUrl?: string, thumbnailUrl?: string): string | undefined {
  if (
    thumbnailUrl &&
    !thumbnailUrl.includes('chemistry_lab_visual') &&
    (thumbnailUrl.startsWith('http') || thumbnailUrl.startsWith('/uploads/'))
  ) {
    return optimizeImageUrl(thumbnailUrl, 960);
  }

  if (videoUrl && isCloudinaryVideoUrl(videoUrl)) {
    const idx = videoUrl.indexOf(CLOUDINARY_VIDEO_UPLOAD_MARKER);
    const prefix = videoUrl.slice(0, idx + CLOUDINARY_VIDEO_UPLOAD_MARKER.length);
    const rest = videoUrl.slice(idx + CLOUDINARY_VIDEO_UPLOAD_MARKER.length).replace(/\.\w+(\?.*)?$/, '.jpg');
    return `${prefix}so_1,f_auto,q_auto,w_960,c_limit/${rest}`;
  }

  return thumbnailUrl || undefined;
}

const warmedUrls = new Set<string>();

/**
 * Quietly warms up the first 256KB byte-range of an active or upcoming direct video stream
 * so pressing Play starts instantly. Skips on Data Saver connections and never blocks UI.
 */
export function prefetchVideoStream(rawUrl?: string, quality: VideoQualityMode = 'fast'): void {
  if (typeof window === 'undefined' || !rawUrl) return;

  const nav = navigator as any;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
  if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
    return;
  }

  const isDirect =
    rawUrl.includes('cloudinary.com') ||
    rawUrl.includes('/uploads/') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(rawUrl);
  if (!isDirect) return;

  const optimized = optimizeVideoStreamUrl(rawUrl, quality);
  if (warmedUrls.has(optimized)) return;
  warmedUrls.add(optimized);

  // Keep memory cache bounded
  if (warmedUrls.size > 24) {
    const first = warmedUrls.values().next().value;
    if (first) warmedUrls.delete(first);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6000);

  fetch(optimized, {
    method: 'GET',
    headers: { Range: 'bytes=0-262143' },
    mode: optimized.startsWith('http') ? 'cors' : 'same-origin',
    signal: controller.signal,
  })
    .catch(() => {})
    .finally(() => window.clearTimeout(timer));
}
