// Fast-start video stream & thumbnail optimizer with reliable MP4 range streaming

export type VideoQualityMode = 'fast' | 'eco' | 'hd';

const CLOUDINARY_VIDEO_UPLOAD_MARKER = '/video/upload/';
const CLOUDINARY_IMAGE_UPLOAD_MARKER = '/image/upload/';

export function isCloudinaryVideoUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('res.cloudinary.com') && url.includes(CLOUDINARY_VIDEO_UPLOAD_MARKER);
}

/**
 * Parses human-readable lecture duration strings (e.g. "45 دقيقة", "1:15:00", "32:10", "90 min")
 * into approximate seconds so the player can detect malformed 1-second container headers.
 */
export function parseDurationStringToSeconds(durationStr?: string): number {
  if (!durationStr) return 0;
  const raw = durationStr.trim();
  if (!raw) return 0;

  // HH:MM:SS or MM:SS
  const colonParts = raw.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (colonParts) {
    if (colonParts[3] !== undefined) {
      return Number(colonParts[1]) * 3600 + Number(colonParts[2]) * 60 + Number(colonParts[3]);
    }
    return Number(colonParts[1]) * 60 + Number(colonParts[2]);
  }

  // Arabic/English minutes e.g. "45 دقيقة" or "45 min"
  const numMatch = raw.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const val = Number(numMatch[1]);
    if (/ساع|hour|hr/i.test(raw)) return Math.round(val * 3600);
    if (/ثان|sec/i.test(raw)) return Math.round(val);
    return Math.round(val * 60);
  }

  return 0;
}

/**
 * Returns a reliable playable stream URL:
 * - 'fast' and 'hd' serve the direct original MP4 CDN stream (supports native HTTP 206 byte-range seeking & exact full duration)
 *   or converts legacy non-web formats (.mov/.mkv/.avi) to standard MP4 without vc_auto duration truncation.
 * - 'eco' serves a compact 854px MP4 stream using explicit `f_mp4` (never `vc_auto`) so duration metadata stays accurate.
 */
export function optimizeVideoStreamUrl(url: string, quality: VideoQualityMode = 'fast'): string {
  if (!url) return '';
  if (!isCloudinaryVideoUrl(url)) return url;

  const idx = url.indexOf(CLOUDINARY_VIDEO_UPLOAD_MARKER);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + CLOUDINARY_VIDEO_UPLOAD_MARKER.length);
  const rest = url.slice(idx + CLOUDINARY_VIDEO_UPLOAD_MARKER.length);

  // Respect URLs that already have explicit transforms
  const firstSegment = rest.split('/')[0] || '';
  if (firstSegment && !/^v\d+$/.test(firstSegment) && firstSegment.includes('_')) {
    return url;
  }

  const isNonStandardContainer = /\.(mov|mkv|avi|wmv|flv)(\?.*)?$/i.test(url);

  if (quality === 'eco') {
    const cleanRest = rest.replace(/\.(mov|mkv|avi|wmv|flv|webm)(\?.*)?$/i, '.mp4$2');
    return `${prefix}f_mp4,q_auto:eco,w_854,c_limit/${cleanRest}`;
  }

  if (isNonStandardContainer) {
    const cleanRest = rest.replace(/\.(mov|mkv|avi|wmv|flv)(\?.*)?$/i, '.mp4$2');
    return `${prefix}f_mp4,q_auto:good/${cleanRest}`;
  }

  // Original CDN file guarantees exact MOOV duration metadata & fast 206 byte-range seeking
  return url;
}

function isCloudinaryTransformSegment(segment: string): boolean {
  if (!segment || /^v\d+$/.test(segment)) return false;
  return /^(?:[a-z]{1,3}_[^,/]+)(?:,[a-z]{1,3}_[^,/]+)*$/i.test(segment);
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
  if (isCloudinaryTransformSegment(firstSegment)) {
    return url;
  }
  return `${prefix}f_auto,q_auto:good,w_${maxWidth},c_limit/${rest}`;
}

export function getImageLqipUrl(url?: string): string | undefined {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes(CLOUDINARY_IMAGE_UPLOAD_MARKER)) {
    return undefined;
  }
  const idx = url.indexOf(CLOUDINARY_IMAGE_UPLOAD_MARKER);
  const prefix = url.slice(0, idx + CLOUDINARY_IMAGE_UPLOAD_MARKER.length);
  const rest = url.slice(idx + CLOUDINARY_IMAGE_UPLOAD_MARKER.length);
  const firstSegment = rest.split('/')[0] || '';
  if (isCloudinaryTransformSegment(firstSegment)) {
    return undefined;
  }
  return `${prefix}f_auto,q_20,w_48,e_blur:600,c_limit/${rest}`;
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
