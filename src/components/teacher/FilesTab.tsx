import React, { useState, useEffect } from 'react';
import {
  Cloud, Sparkles, CheckCircle, AlertCircle, Plus, Upload, FileText, Trash2, Eye, Edit3, X
} from 'lucide-react';
import { AttachmentFile, CloudinaryConfig, GradeLevel, Lecture } from '../../types';
import { GradeItem, SiteConfig, getGradeDisplayName } from '../../types/siteConfig';
import { uploadMediaFile, UploadProgressInfo } from '../../utils/uploader';
import { UploadProgressBar } from '../UploadProgressBar';
import { InlineMediaPreview, MediaPreviewModal, MediaKind } from '../MediaPreview';

interface FilesTabProps {
  attachments: AttachmentFile[];
  lectures: Lecture[];
  resolvedGrades: GradeItem[];
  siteForm: SiteConfig;
  cloudinaryConfig: CloudinaryConfig;
  totalUsedMB: number;
  totalUsedGB: number;
  remainingGB: number;
  usedPercentage: number;
  totalQuotaGB: number;
  onAddAttachment: (file: AttachmentFile) => Promise<boolean> | boolean | void;
  onUpdateAttachment?: (file: AttachmentFile) => Promise<boolean> | boolean | void;
  onDeleteAttachment: (id: string) => Promise<boolean> | boolean | void;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  attachments,
  lectures,
  resolvedGrades,
  siteForm,
  cloudinaryConfig,
  totalUsedMB,
  totalUsedGB,
  remainingGB,
  usedPercentage,
  totalQuotaGB,
  onAddAttachment,
  onUpdateAttachment,
  onDeleteAttachment,
}) => {
  const cloudName = cloudinaryConfig.cloudName || 'chemistry-egypt';
  const uploadPreset = cloudinaryConfig.uploadPreset || 'chemistry_uploads';

  const [handoutFile, setHandoutFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadingHandout, setUploadingHandout] = useState(false);
  const [handoutProgress, setHandoutProgress] = useState(0);
  const [handoutUploadMeta, setHandoutUploadMeta] = useState<UploadProgressInfo | null>(null);
  const [handoutCloudUrl, setHandoutCloudUrl] = useState<string>('');
  const [detectedFileType, setDetectedFileType] = useState<'pdf' | 'doc' | 'image'>('pdf');

  const [fileTitle, setFileTitle] = useState('');
  const [fileGrade, setFileGrade] = useState<GradeLevel>(
    resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third'
  );
  const [fileChapter, setFileChapter] = useState('العناصر الانتقالية');
  const [fileSize, setFileSize] = useState('3.5 MB');
  const [filePageCount, setFilePageCount] = useState<number>(24);
  const [filePointsCost, setFilePointsCost] = useState<number>(0);

  const [fileFormError, setFileFormError] = useState<string | null>(null);
  const [fileFormSuccess, setFileFormSuccess] = useState<string | null>(null);
  const [savingAttachment, setSavingAttachment] = useState(false);
  const [deleteConfirmFileId, setDeleteConfirmFileId] = useState<string | null>(null);

  const [editingAttachment, setEditingAttachment] = useState<AttachmentFile | null>(null);
  const [uploadingEditFile, setUploadingEditFile] = useState(false);
  const [editFileProgress, setEditFileProgress] = useState(0);
  const [savingEditAttachment, setSavingEditAttachment] = useState(false);

  const [previewFile, setPreviewFile] = useState<{
    url: string;
    title: string;
    kind: MediaKind;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const resolveAttachmentType = (file: File): 'pdf' | 'doc' | 'image' => {
    if (file.type.startsWith('image/')) return 'image';
    if (/\.(doc|docx|ppt|pptx)$/i.test(file.name)) return 'doc';
    return 'pdf';
  };

  const handleSelectHandoutFile = async (file: File) => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const localUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localUrl);
    setHandoutFile(file);

    const fileType = resolveAttachmentType(file);
    setDetectedFileType(fileType);

    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!fileTitle) {
      setFileTitle(nameWithoutExt);
    }
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);

    setUploadingHandout(true);
    setHandoutProgress(0);
    setHandoutUploadMeta(null);
    setFileFormError(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: fileType === 'image' ? 'image' : 'auto',
        onProgress: (percent, info) => {
          setHandoutProgress(percent);
          setHandoutUploadMeta(info);
        },
      });
      setHandoutCloudUrl(result.url);
      setFileFormSuccess(`تم رفع الملف بنجاح (${file.name} · ${sizeInMB} MB) ☁️`);
      setTimeout(() => setFileFormSuccess(null), 4000);
    } catch (err: any) {
      setFileFormError(err?.message || 'فشل رفع المذكرة، يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingHandout(false);
    }
  };

  const handleCreateAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileFormError(null);
    setFileFormSuccess(null);

    if (uploadingHandout) {
      setFileFormError('يرجى الانتظار حتى يكتمل رفع المذكرة.');
      return;
    }

    if (!fileTitle.trim()) {
      setFileFormError('يرجى إدخال اسم المذكرة أو الملف');
      return;
    }

    if (!handoutCloudUrl) {
      setFileFormError('يرجى رفع ملف المذكرة أو الصورة من جهازك أولاً قبل النشر.');
      return;
    }

    const newFile: AttachmentFile = {
      id: `att-${Date.now()}`,
      title: fileTitle.trim(),
      grade: fileGrade,
      gradeLabel: getGradeDisplayName(fileGrade, siteForm, 'ar'),
      chapter: fileChapter,
      fileSize: fileSize || '3.0 MB',
      fileType: detectedFileType,
      downloadUrl: handoutCloudUrl,
      pageCount: Math.max(1, Math.round(Number(filePageCount) || 24)),
      dateAdded: new Date().toISOString().split('T')[0],
      pointsCost: Math.max(0, Math.round(Number(filePointsCost) || 0)),
    };

    setSavingAttachment(true);
    try {
      const saved = await onAddAttachment(newFile);
      if (saved === false) {
        setFileFormError('تعذر نشر المذكرة في السحابة. يرجى التحقق من جلسة المشرف وصلاحيات الحساب.');
        return;
      }
      setFileFormSuccess('تمت إضافة المذكرة بنجاح إلى مكتبة ملفات الطلاب وتم تحديث مساحة التخزين فورياً! 📚');
      setTimeout(() => setFileFormSuccess(null), 4000);
      setFileTitle('');
      setFilePointsCost(0);
      setFilePageCount(24);
      setHandoutFile(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      setHandoutCloudUrl('');
      setHandoutProgress(0);
    } finally {
      setSavingAttachment(false);
    }
  };

  const handleReplaceEditFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingAttachment) return;

    const fileType = resolveAttachmentType(file);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadingEditFile(true);
    setEditFileProgress(0);
    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: fileType === 'image' ? 'image' : 'auto',
        onProgress: (percent) => setEditFileProgress(percent),
      });
      setEditingAttachment((prev) =>
        prev
          ? {
              ...prev,
              downloadUrl: result.url,
              fileType,
              fileSize: `${sizeInMB} MB`,
            }
          : null
      );
    } catch (err: any) {
      setFileFormError(err?.message || 'فشل رفع الملف البديل.');
    } finally {
      setUploadingEditFile(false);
      setEditFileProgress(0);
    }
  };

  const handleSaveEditedAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttachment) return;
    if (!editingAttachment.title.trim()) {
      setFileFormError('يرجى إدخال عنوان المذكرة.');
      return;
    }

    const updated: AttachmentFile = {
      ...editingAttachment,
      title: editingAttachment.title.trim(),
      gradeLabel: getGradeDisplayName(editingAttachment.grade, siteForm, 'ar'),
      pointsCost: Math.max(0, Math.round(Number(editingAttachment.pointsCost) || 0)),
      pageCount: Math.max(1, Math.round(Number(editingAttachment.pageCount) || 1)),
    };

    setSavingEditAttachment(true);
    try {
      const updater = onUpdateAttachment || onAddAttachment;
      const saved = await updater(updated);
      if (saved === false) {
        setFileFormError('تعذر حفظ تعديلات المذكرة في السحابة.');
        return;
      }
      setFileFormSuccess(`تم تحديث المذكرة "${updated.title}" بنجاح!`);
      setTimeout(() => setFileFormSuccess(null), 3500);
      setEditingAttachment(null);
    } finally {
      setSavingEditAttachment(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600">
              <Cloud className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
              رفع وإدارة المذكرات والملفات ☁️
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            ارفع ملازم الشرح والصور والشيتات من جهازك مع معاينة فورية قبل وبعد الرفع.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono self-start sm:self-auto">
          {attachments.length} ملفات منشورة
        </span>
      </div>

      {/* Storage Quota Monitor */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white border border-teal-800/50 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-teal-300 font-mono">
                سعة التخزين السحابية المتاحة
              </span>
            </div>
            <h3 className="text-xl font-bold font-kufi">
              المساحة المتبقية: <span className="text-amber-300 font-mono">{remainingGB} GB</span> من إجمالي{' '}
              {totalQuotaGB} GB
            </h3>
          </div>

          <div className="text-left sm:text-right font-mono">
            <div className="text-xs text-slate-400">المستهلك الفعلي:</div>
            <div className="text-lg font-bold text-teal-300">
              {totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`}
              <span className="text-xs text-slate-400 font-normal mr-1.5">({usedPercentage}%)</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedPercentage > 85
                  ? 'bg-rose-500'
                  : usedPercentage > 60
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(3, usedPercentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>0 GB</span>
            <span>
              المستخدم: {totalUsedGB} GB ({lectures.length} فيديو + {attachments.length} ملزمة)
            </span>
            <span>الحد الأقصى المجاني: {totalQuotaGB} GB</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-teal-200 flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>يمكنك معاينة أي ملف أو حذفه لتفريغ المساحة فوراً.</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">حساب: {cloudName}</span>
        </div>
      </div>

      {fileFormSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{fileFormSuccess}</span>
        </div>
      )}

      {fileFormError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-sm font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{fileFormError}</span>
        </div>
      )}

      {/* Handout Uploader */}
      <form
        onSubmit={handleCreateAttachment}
        className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-teal-200/80 dark:border-slate-700 space-y-5"
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" />
          <span>رفع مذكرة أو صورة شرح جديدة من جهازك 📂</span>
        </h3>

        <div className="p-6 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 text-center space-y-3 relative">
          <input
            type="file"
            id="handoutFileInput"
            accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) handleSelectHandoutFile(f);
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <label
              htmlFor="handoutFileInput"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer transition-colors inline-block shadow-sm"
            >
              اختر ملف المذكرة من الجهاز (PDF, Word, صور)
            </label>
            <p className="text-xs text-slate-500 mt-2">
              يتم ضغط الصور تلقائياً وتسريع الرفع للحد الأقصى مع معاينة مباشرة أدناه
            </p>
          </div>

          {uploadingHandout && (
            <div className="max-w-md mx-auto pt-2">
              <UploadProgressBar
                label="جاري رفع المذكرة..."
                progress={handoutProgress}
                meta={handoutUploadMeta}
                fileName={handoutFile?.name}
              />
            </div>
          )}

          {handoutFile && !uploadingHandout && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold font-mono">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>
                تم الرفع: {handoutFile.name} ({fileSize})
              </span>
            </div>
          )}
        </div>

        {/* Instant Live Preview for Handout (image / PDF / doc) */}
        {(localPreviewUrl || handoutCloudUrl) && (
          <InlineMediaPreview
            url={handoutCloudUrl || localPreviewUrl || ''}
            title={fileTitle || handoutFile?.name || 'معاينة المذكرة'}
            kind={detectedFileType}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              عنوان المذكرة *
            </label>
            <input
              type="text"
              required
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              placeholder="مثال: مذكرة الكيمياء العضوية الشاملة"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              الصف الدراسي
            </label>
            <select
              value={fileGrade}
              onChange={(e) => setFileGrade(e.target.value as GradeLevel)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              {resolvedGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.badgeAr}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              الباب أو الوحدة
            </label>
            <input
              type="text"
              value={fileChapter}
              onChange={(e) => setFileChapter(e.target.value)}
              placeholder="مثال: الباب الأول: العناصر الانتقالية"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-amber-700 dark:text-amber-300">
              تكلفة الفتح بالنقاط (0 = مذكرة مجانية للجميع)
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              value={filePointsCost}
              onChange={(e) => setFilePointsCost(Math.max(0, Number(e.target.value)))}
              className="w-full p-2.5 text-xs rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              عدد الصفحات التقديري
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={filePageCount}
              onChange={(e) => setFilePageCount(Math.max(1, Number(e.target.value)))}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 font-mono">
            الحجم المسجل: <span className="font-bold text-teal-600">{fileSize}</span>
          </div>

          <button
            type="submit"
            disabled={uploadingHandout || savingAttachment}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Cloud className="w-4 h-4" />
            <span>
              {savingAttachment ? 'جاري النشر...' : 'تأكيد ونشر المذكرة في مكتبة الطلاب'}
            </span>
          </button>
        </div>
      </form>

      {/* Attachments List with Preview Modal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-kufi">
            المذكرات والملفات المنشورة حالياً ({attachments.length}):
          </h4>
          <span className="text-xs text-slate-500 font-mono">اضغط معاينة لعرض الملف مباشرة</span>
        </div>

        {previewFile && (
          <MediaPreviewModal
            isOpen={Boolean(previewFile)}
            onClose={() => setPreviewFile(null)}
            url={previewFile.url || ''}
            title={previewFile.title}
            kind={previewFile.kind}
          />
        )}

        {/* Inline Edit Handout Panel */}
        {editingAttachment && (
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 sm:p-6 border-2 border-teal-500/40 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-kufi text-slate-900 dark:text-white">
                  تعديل المذكرة أو استبدال الملف
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAttachment(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAttachment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  عنوان المذكرة *
                </label>
                <input
                  type="text"
                  required
                  value={editingAttachment.title}
                  onChange={(e) =>
                    setEditingAttachment({ ...editingAttachment, title: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الصف الدراسي
                  </label>
                  <select
                    value={editingAttachment.grade}
                    onChange={(e) =>
                      setEditingAttachment({
                        ...editingAttachment,
                        grade: e.target.value as GradeLevel,
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                  >
                    {resolvedGrades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.badgeAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الباب أو الوحدة
                  </label>
                  <input
                    type="text"
                    value={editingAttachment.chapter}
                    onChange={(e) =>
                      setEditingAttachment({ ...editingAttachment, chapter: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-700 dark:text-amber-300 font-kufi">
                    تكلفة الفتح بالنقاط (0 = مجانية)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={editingAttachment.pointsCost ?? 0}
                    onChange={(e) =>
                      setEditingAttachment({
                        ...editingAttachment,
                        pointsCost: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    عدد الصفحات
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={editingAttachment.pageCount ?? 24}
                    onChange={(e) =>
                      setEditingAttachment({
                        ...editingAttachment,
                        pageCount: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    نوع الملف
                  </label>
                  <select
                    value={editingAttachment.fileType}
                    onChange={(e) =>
                      setEditingAttachment({
                        ...editingAttachment,
                        fileType: e.target.value as 'pdf' | 'doc' | 'image',
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                  >
                    <option value="pdf">PDF</option>
                    <option value="image">صورة / ملخص</option>
                    <option value="doc">Word / ملف نصي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الحجم المسجل
                  </label>
                  <input
                    type="text"
                    value={editingAttachment.fileSize}
                    onChange={(e) =>
                      setEditingAttachment({ ...editingAttachment, fileSize: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    رابط الملف السحابي أو استبداله من جهازك
                  </span>
                  <label className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold cursor-pointer">
                    {uploadingEditFile
                      ? `جاري الرفع ${editFileProgress}%`
                      : 'رفع ملف بديل من الجهاز'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                      disabled={uploadingEditFile}
                      onChange={handleReplaceEditFile}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={editingAttachment.downloadUrl}
                  onChange={(e) =>
                    setEditingAttachment({ ...editingAttachment, downloadUrl: e.target.value })
                  }
                  dir="ltr"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
                {editingAttachment.downloadUrl && editingAttachment.downloadUrl !== '#' && (
                  <InlineMediaPreview
                    url={editingAttachment.downloadUrl}
                    title={editingAttachment.title}
                    kind={editingAttachment.fileType}
                    compact
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingAttachment(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEditAttachment || uploadingEditFile}
                  className="px-6 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingEditAttachment ? 'جاري الحفظ...' : 'حفظ تعديلات المذكرة'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 transition-all flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {file.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                    <span className="text-teal-600 font-semibold">
                      {getGradeDisplayName(file.grade, siteForm, 'ar') || file.gradeLabel}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                      {file.fileSize}
                    </span>
                    {(file.pointsCost || 0) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold">
                        {file.pointsCost} نقطة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {file.downloadUrl && file.downloadUrl !== '#' && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewFile({
                        url: file.downloadUrl,
                        title: file.title,
                        kind: file.fileType,
                      })
                    }
                    className="px-2.5 py-1 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="معاينة الملف"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setEditingAttachment(file)}
                  className="px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  title="تعديل بيانات أو ملف المذكرة"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                {deleteConfirmFileId === file.id ? (
                  <div className="flex items-center gap-1.5 p-1 bg-rose-50 dark:bg-rose-950/80 rounded-xl border border-rose-300 dark:border-rose-800">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1">
                      تفريغ؟
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAttachment(file.id);
                        setDeleteConfirmFileId(null);
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      تأكيد
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmFileId(null)}
                      className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmFileId(file.id)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
                    title="حذف المذكرة لتفريغ مساحة التخزين"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {attachments.length === 0 && (
            <div className="md:col-span-2 py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              لا توجد مذكرات مرفوعة حالياً. مساحتك السحابية جاهزة بالكامل ({totalQuotaGB} GB متاحة).
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
