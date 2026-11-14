import React, { useState } from 'react';
import { Download, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { AttachmentFile } from '../../types';
import { MediaKind, MediaPreviewModal, detectMediaKind } from '../MediaPreview';

interface HandoutsTabProps {
  lang: string;
  gradeTitle: string;
  filteredAttachments: AttachmentFile[];
}

export const HandoutsTab: React.FC<HandoutsTabProps> = ({
  lang,
  gradeTitle,
  filteredAttachments,
}) => {
  const [previewTarget, setPreviewTarget] = useState<{
    url: string;
    title: string;
    kind: MediaKind;
  } | null>(null);

  const getBadgeLabel = (kind: MediaKind): string => {
    if (kind === 'image') return 'صورة';
    if (kind === 'pdf') return 'PDF';
    return 'ملف';
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            مذكرات {gradeTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            معاينة مباشرة أو تحميل سريع للمذكرات وبنوك الأسئلة.
          </p>
        </div>

        {filteredAttachments.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-teal-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              {lang === 'en'
                ? 'No handouts or files added yet'
                : 'لا توجد مذكرات مضافة لهذا الصف بعد'}
            </h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAttachments.map((file) => {
              const kind = detectMediaKind(
                file.downloadUrl,
                file.fileType as MediaKind | undefined
              );
              const isAvailable = Boolean(file.downloadUrl && file.downloadUrl !== '#');

              return (
                <div
                  key={file.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      {kind === 'image' ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug truncate">
                          {file.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono shrink-0">
                          {getBadgeLabel(kind)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span className="truncate">{file.chapter}</span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0">{file.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  {isAvailable ? (
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
                        <span>معاينة</span>
                      </button>

                      <a
                        href={file.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل</span>
                      </a>
                    </div>
                  ) : (
                    <span className="w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 cursor-not-allowed">
                      <Download className="w-4 h-4" />
                      <span>غير متاح للتحميل حالياً</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MediaPreviewModal
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        url={previewTarget?.url || ''}
        title={previewTarget?.title}
        kind={previewTarget?.kind}
      />
    </>
  );
};
