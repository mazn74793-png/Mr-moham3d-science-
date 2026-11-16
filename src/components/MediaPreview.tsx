import React, { useState } from 'react';
import {
  Eye,
  X,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Download,
} from 'lucide-react';
import { optimizeVideoStreamUrl, optimizeImageUrl, getVideoPosterUrl } from '../utils/mediaOptimizer';
import { useLanguage } from '../context/LanguageContext';

export type MediaKind = 'image' | 'video' | 'pdf' | 'doc';

export function detectMediaKind(url?: string, hint?: MediaKind): MediaKind {
  if (hint) return hint;
  const clean = (url || '').toLowerCase();
  if (
    clean.includes('/video/upload/') ||
    clean.includes('youtube.com') ||
    clean.includes('youtu.be') ||
    clean.match(/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i)
  ) {
    return 'video';
  }
  if (clean.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i) || clean.includes('/image/upload/')) {
    return 'image';
  }
  if (clean.match(/\.pdf(\?.*)?$/i) || clean.includes('/raw/upload/')) {
    return 'pdf';
  }
  if (clean.match(/\.(doc|docx|ppt|pptx)(\?.*)?$/i)) {
    return 'doc';
  }
  return 'pdf';
}

function getYoutubeEmbed(url: string): string | null {
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  }
  return null;
}

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  kind?: MediaKind;
}

/**
 * Renders as an inline page section (zero full-screen popups).
 */
export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  kind,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  if (!isOpen || !url || url === '#') return null;

  const resolvedKind = detectMediaKind(url, kind);
  const ytEmbed = resolvedKind === 'video' ? getYoutubeEmbed(url) : null;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-500/40 dark:border-teal-700/60 shadow-sm overflow-hidden flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 min-w-0">
          {resolvedKind === 'video' ? (
            <Film className="w-4 h-4 text-teal-600 shrink-0" />
          ) : resolvedKind === 'image' ? (
            <ImageIcon className="w-4 h-4 text-teal-600 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-kufi">
            {title || (isEn ? 'Media Preview' : 'معاينة الملف')}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEn ? 'Open Tab' : 'فتح في تبويب مستقل'}</span>
          </a>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEn ? 'Download' : 'تحميل'}</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close preview' : 'إغلاق المعاينة'}
            className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-5 min-h-[280px]">
        {resolvedKind === 'image' && (
          <img
            src={optimizeImageUrl(url, 1440)}
            alt={title || (isEn ? 'Preview' : 'معاينة')}
            className="max-w-full max-h-[540px] rounded-xl object-contain shadow-md"
          />
        )}

        {resolvedKind === 'video' &&
          (ytEmbed ? (
            <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={ytEmbed}
                title={title || 'Video Preview'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              src={optimizeVideoStreamUrl(url, 'fast')}
              poster={getVideoPosterUrl(url)}
              controls
              playsInline
              preload="auto"
              className="w-full max-w-3xl max-h-[520px] rounded-xl bg-black"
            />
          ))}

        {resolvedKind === 'pdf' && (
          <div className="w-full flex flex-col gap-2">
            <iframe
              src={url}
              title={title || 'PDF Preview'}
              className="w-full h-[540px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
            />
            <div className="text-center text-[11px] text-slate-500">
              {isEn
                ? 'If the PDF fails to render in your mobile browser, use "Open Tab" or "Download" above.'
                : 'في حال لم يظهر ملف الـ PDF داخل متصفح الهاتف، اضغط على «فتح في تبويب مستقل» أو «تحميل» بالأعلى.'}
            </div>
          </div>
        )}

        {resolvedKind === 'doc' && (
          <div className="p-8 text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {title || (isEn ? 'Attached Document' : 'مستند مرفق')}
              </h4>
              <p className="text-xs text-slate-500">
                {isEn
                  ? 'Word/PowerPoint files open directly via download or in a new tab.'
                  : 'ملفات Word/PowerPoint تُفتح مباشرة عبر التحميل أو في تبويب جديد.'}
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isEn ? 'Open or Download File' : 'فتح أو تحميل الملف الآن'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

interface InlineMediaPreviewProps {
  url?: string;
  title?: string;
  kind?: MediaKind;
  compact?: boolean;
}

export const InlineMediaPreview: React.FC<InlineMediaPreviewProps> = ({
  url,
  title,
  kind,
  compact = false,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [isExpanded, setIsExpanded] = useState(false);

  if (!url || url === '#') return null;

  const resolvedKind = detectMediaKind(url, kind);
  const ytEmbed = resolvedKind === 'video' ? getYoutubeEmbed(url) : null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-800/60">
        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 truncate">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isEn ? 'Live Preview:' : 'معاينة حية:'} {title || (isEn ? 'Uploaded File' : 'المحتوى المرفوع')}
          </span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">{isEn ? 'Open' : 'فتح'}</span>
          </a>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>
              {isExpanded ? (isEn ? 'Collapse' : 'تصغير') : isEn ? 'Expand' : 'تكبير'}
            </span>
          </button>
        </div>
      </div>

      <div className={compact && !isExpanded ? 'p-2' : 'p-3'}>
        {resolvedKind === 'image' && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full flex justify-center bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden cursor-pointer"
          >
            <img
              src={optimizeImageUrl(url, isExpanded ? 1440 : 800)}
              alt={title || (isEn ? 'Image preview' : 'معاينة الصورة')}
              loading="lazy"
              decoding="async"
              className={`${
                isExpanded ? 'max-h-[520px]' : compact ? 'max-h-36' : 'max-h-56'
              } w-auto object-contain transition-all`}
            />
          </button>
        )}

        {resolvedKind === 'video' &&
          (ytEmbed ? (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={ytEmbed}
                title={title || (isEn ? 'Video preview' : 'معاينة الفيديو')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              src={optimizeVideoStreamUrl(url, 'fast')}
              poster={getVideoPosterUrl(url)}
              controls
              playsInline
              preload="metadata"
              className={`w-full ${
                isExpanded ? 'max-h-[500px]' : compact ? 'max-h-44' : 'max-h-64'
              } rounded-xl bg-black`}
            />
          ))}

        {resolvedKind === 'pdf' && (
          <div className="space-y-2">
            <iframe
              src={url}
              title={title || (isEn ? 'PDF preview' : 'معاينة PDF')}
              className={`w-full ${
                isExpanded ? 'h-[540px]' : compact ? 'h-48' : 'h-72'
              } rounded-xl border border-slate-200 dark:border-slate-700 bg-white transition-all`}
            />
          </div>
        )}

        {resolvedKind === 'doc' && (
          <div className="p-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {title || (isEn ? 'File ready for download' : 'ملف جاهز للمعاينة والتحميل')}
              </span>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold shrink-0"
            >
              {isEn ? 'Open File' : 'فتح الملف'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
