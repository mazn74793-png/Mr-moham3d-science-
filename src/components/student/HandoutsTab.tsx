import React, { useState, useMemo } from 'react';
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  Search,
  BookOpen,
  FileSpreadsheet,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AttachmentFile, UserProfile } from '../../types';
import { MediaKind, detectMediaKind } from '../MediaPreview';
import { optimizeImageUrl } from '../../utils/mediaOptimizer';

interface HandoutsTabProps {
  lang: string;
  gradeTitle: string;
  filteredAttachments: AttachmentFile[];
  currentUser?: UserProfile | null;
  onUnlockAttachment?: (file: AttachmentFile) => Promise<void>;
}

export const HandoutsTab: React.FC<HandoutsTabProps> = ({
  lang,
  gradeTitle,
  filteredAttachments,
  currentUser,
  onUnlockAttachment,
}) => {
  const isEn = lang === 'en';
  const [previewTarget, setPreviewTarget] = useState<{
    url: string;
    title: string;
    kind: MediaKind;
  } | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image' | 'free' | 'points'>('all');

  const isTeacher = currentUser?.role === 'teacher';
  const pointsBalance = Number(currentUser?.points) || 0;
  const unlockedIds = currentUser?.unlockedAttachmentIds || [];
  const BackIcon = isEn ? ChevronLeft : ChevronRight;

  const getTypeLabel = (kind: MediaKind): string => {
    if (kind === 'image') return isEn ? 'Visual Summary' : 'ملخص / صورة';
    if (kind === 'pdf') return isEn ? 'PDF Handout' : 'ملزمة PDF';
    return isEn ? 'Word Document' : 'مستند Word';
  };

  const handleUnlock = async (file: AttachmentFile) => {
    if (!onUnlockAttachment || unlockingId) return;
    setUnlockError(null);
    setUnlockingId(file.id);
    try {
      await onUnlockAttachment(file);
    } catch (err: any) {
      setUnlockError(
        err?.message ||
          (isEn ? 'Could not unlock this handout right now.' : 'تعذر فتح المذكرة بالنقاط حالياً.')
      );
    } finally {
      setUnlockingId(null);
    }
  };

  const visibleAttachments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return filteredAttachments.filter((file) => {
      const kind = detectMediaKind(file.downloadUrl, file.fileType as MediaKind | undefined);
      const cost = file.pointsCost || 0;

      if (typeFilter === 'pdf' && kind !== 'pdf') return false;
      if (typeFilter === 'image' && kind !== 'image') return false;
      if (typeFilter === 'free' && cost > 0) return false;
      if (typeFilter === 'points' && cost <= 0) return false;

      if (!q) return true;
      return (
        file.title.toLowerCase().includes(q) ||
        (file.chapter || '').toLowerCase().includes(q)
      );
    });
  }, [filteredAttachments, searchTerm, typeFilter]);

  // Inline Full-Page Document Reader View (Zero popup modals)
  if (previewTarget) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setPreviewTarget(null)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
            >
              <BackIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Back to Handouts' : 'العودة للملازم'}</span>
            </button>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {previewTarget.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={previewTarget.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isEn ? 'Open Tab' : 'فتح في تبويب'}</span>
            </a>
            <a
              href={previewTarget.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download' : 'تحميل'}</span>
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-5 border border-slate-200 dark:border-slate-800">
          {previewTarget.kind === 'image' && (
            <img
              src={optimizeImageUrl(previewTarget.url, 1440)}
              alt={previewTarget.title}
              className="w-full max-h-[80vh] object-contain mx-auto rounded-xl"
            />
          )}

          {previewTarget.kind === 'pdf' && (
            <div className="space-y-3">
              <iframe
                src={previewTarget.url}
                title={previewTarget.title}
                className="w-full h-[76vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
              />
              <p className="text-center text-[11px] text-slate-500">
                {isEn
                  ? 'If the PDF does not render inline on your mobile browser, tap "Open Tab" or "Download" above.'
                  : 'في حال لم يظهر ملف الـ PDF داخل متصفح الهاتف، اضغط على «فتح في تبويب» أو «تحميل» بالأعلى.'}
              </p>
            </div>
          )}

          {previewTarget.kind === 'doc' && (
            <div className="p-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {previewTarget.title}
                </h4>
                <p className="text-xs text-slate-500">
                  {isEn
                    ? 'Word and PowerPoint files open directly via download or a dedicated tab.'
                    : 'ملفات Word/PowerPoint تُفتح مباشرة عبر التحميل أو في تبويب جديد.'}
                </p>
              </div>
              <a
                href={previewTarget.url}
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
  }

  return (
    <div className="space-y-5">
      {/* Clean Header + Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
              {isEn ? `Handouts & Notes — ${gradeTitle}` : `مذكرات وملازم ${gradeTitle}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn
                ? 'Organized handouts, question banks, and visual summaries ready to read inline or download.'
                : 'عرض منظم للملازم، بنوك الأسئلة، والملخصات المصورة مع معاينة وقراءة مباشرة أو تحميل.'}
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300 tabular-nums shrink-0">
            {visibleAttachments.length} / {filteredAttachments.length} {isEn ? 'files' : 'ملزمة'}
          </div>
        </div>

        {filteredAttachments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                className={`w-4 h-4 text-slate-400 absolute top-3 pointer-events-none ${
                  isEn ? 'left-3' : 'right-3'
                }`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isEn ? 'Search handouts or chapter...' : 'ابحث باسم الملزمة أو الباب...'}
                className={`w-full min-h-[40px] py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
              {[
                { id: 'all', label: isEn ? 'All' : 'الكل' },
                { id: 'pdf', label: 'PDF' },
                { id: 'image', label: isEn ? 'Images' : 'صور وملخصات' },
                { id: 'free', label: isEn ? 'Free' : 'مجانية' },
                { id: 'points', label: isEn ? 'Points' : 'بالنقاط' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id as any)}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    typeFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {unlockError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{unlockError}</span>
        </div>
      )}

      {filteredAttachments.length === 0 ? (
        <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <FileText className="w-8 h-8 text-teal-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            {isEn ? 'No handouts or files added yet' : 'لا توجد مذكرات مضافة لهذا الصف بعد'}
          </h4>
        </div>
      ) : visibleAttachments.length === 0 ? (
        <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Search className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isEn ? 'No handouts match your filter.' : 'لا توجد ملازم مطابقة لبحثك'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleAttachments.map((file) => {
            const kind = detectMediaKind(
              file.downloadUrl,
              file.fileType as MediaKind | undefined
            );
            const isAvailable = Boolean(file.downloadUrl && file.downloadUrl !== '#');
            const cost = file.pointsCost || 0;
            const isLocked = cost > 0 && !isTeacher && !unlockedIds.includes(file.id);
            const canAfford = pointsBalance >= cost;

            return (
              <article
                key={file.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-colors hover:border-teal-400"
              >
                {/* Visual Handout Cover Header */}
                <div className="relative">
                  {!isLocked && isAvailable && kind === 'image' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewTarget({
                          url: file.downloadUrl,
                          title: file.title,
                          kind,
                        })
                      }
                      className="w-full h-44 bg-slate-100 dark:bg-slate-950 overflow-hidden block cursor-zoom-in group"
                    >
                      <img
                        src={optimizeImageUrl(file.downloadUrl, 700)}
                        alt={file.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ) : (
                    <div
                      className={`h-32 px-5 py-4 flex items-center justify-between gap-3 ${
                        isLocked
                          ? 'bg-gradient-to-bl from-amber-600 via-amber-700 to-slate-900 text-white'
                          : kind === 'pdf'
                          ? 'bg-gradient-to-bl from-teal-700 via-teal-800 to-slate-900 text-white'
                          : 'bg-gradient-to-bl from-indigo-700 via-indigo-800 to-slate-900 text-white'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-[11px] font-bold text-white/80 font-mono">
                          {isLocked
                            ? isEn
                              ? `Locked · ${cost} Pts`
                              : `محمية بـ ${cost} نقطة`
                            : getTypeLabel(kind)}
                        </div>
                        <div className="text-sm sm:text-base font-extrabold leading-snug line-clamp-2">
                          {file.title}
                        </div>
                      </div>

                      <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                        {isLocked ? (
                          <Lock className="w-6 h-6 text-amber-300" />
                        ) : kind === 'pdf' ? (
                          <BookOpen className="w-6 h-6 text-white" />
                        ) : kind === 'image' ? (
                          <ImageIcon className="w-6 h-6 text-white" />
                        ) : (
                          <FileSpreadsheet className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Handout Details & Actions */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {file.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-semibold text-teal-700 dark:text-teal-400">
                        {file.chapter}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{file.fileSize}</span>
                      {file.pageCount ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {file.pageCount} {isEn ? 'pages' : 'صفحة'}
                          </span>
                        </>
                      ) : null}
                      {cost > 0 && !isLocked && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {isEn ? 'Unlocked' : 'تم الفتح'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isLocked ? (
                    <button
                      type="button"
                      disabled={Boolean(unlockingId) || !canAfford}
                      onClick={() => handleUnlock(file)}
                      className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {unlockingId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                      <span>
                        {unlockingId === file.id
                          ? isEn
                            ? 'Unlocking...'
                            : 'جاري الفتح...'
                          : canAfford
                          ? isEn
                            ? `Unlock for ${cost} Pts`
                            : `افتح الملزمة بـ ${cost} نقطة`
                          : isEn
                          ? `Requires ${cost} Pts (Balance: ${pointsBalance})`
                          : `مطلوب ${cost} نقطة (رصيدك ${pointsBalance})`}
                      </span>
                    </button>
                  ) : isAvailable ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewTarget({
                            url: file.downloadUrl,
                            title: file.title,
                            kind,
                          })
                        }
                        className="min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{isEn ? 'Read Inline' : 'قراءة ومعاينة'}</span>
                      </button>

                      <a
                        href={file.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isEn ? 'Download' : 'تحميل'}</span>
                      </a>
                    </div>
                  ) : (
                    <span className="w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 cursor-not-allowed">
                      <Download className="w-4 h-4" />
                      <span>{isEn ? 'Unavailable right now' : 'غير متاح للتحميل حالياً'}</span>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
