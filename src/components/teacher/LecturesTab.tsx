import React, { useState, useEffect } from 'react';
import {
  Upload, Plus, Film, RefreshCw, CheckCircle, AlertCircle, Edit3, Trash2, X, Eye, Image as ImageIcon
} from 'lucide-react';
import { Lecture, GradeLevel, Quiz, CloudinaryConfig } from '../../types';
import { GradeItem, SiteConfig, getGradeDisplayName } from '../../types/siteConfig';
import { uploadMediaFile, UploadProgressInfo } from '../../utils/uploader';
import { UploadProgressBar } from '../UploadProgressBar';
import { InlineMediaPreview, MediaPreviewModal } from '../MediaPreview';

interface LecturesTabProps {
  mode: 'upload' | 'list';
  lectures: Lecture[];
  quizzes: Quiz[];
  resolvedGrades: GradeItem[];
  siteForm: SiteConfig;
  cloudinaryConfig: CloudinaryConfig;
  onAddLecture: (lec: Lecture) => Promise<boolean> | boolean | void;
  onUpdateLecture?: (lec: Lecture) => Promise<boolean> | boolean | void;
  onDeleteLecture: (id: string) => Promise<boolean> | boolean | void;
  onSwitchMode: (mode: 'upload' | 'list') => void;
}

export const LecturesTab: React.FC<LecturesTabProps> = ({
  mode,
  lectures,
  quizzes,
  resolvedGrades,
  siteForm,
  cloudinaryConfig,
  onAddLecture,
  onUpdateLecture,
  onDeleteLecture,
  onSwitchMode,
}) => {
  const cloudName = cloudinaryConfig.cloudName || 'chemistry-egypt';
  const uploadPreset = cloudinaryConfig.uploadPreset || 'chemistry_uploads';

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [localVideoPreview, setLocalVideoPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadMeta, setVideoUploadMeta] = useState<UploadProgressInfo | null>(null);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [videoUploadNotice, setVideoUploadNotice] = useState<string | null>(null);

  // Thumbnail upload state
  const [localThumbPreview, setLocalThumbPreview] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [thumbMeta, setThumbMeta] = useState<UploadProgressInfo | null>(null);

  const [lectureFormError, setLectureFormError] = useState<string | null>(null);
  const [lectureFormSuccess, setLectureFormSuccess] = useState<string | null>(null);
  const [savingLecture, setSavingLecture] = useState(false);

  const [lecTitle, setLecTitle] = useState('');
  const [lecGrade, setLecGrade] = useState<GradeLevel>(
    resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third'
  );
  const [lecChapter, setLecChapter] = useState('الباب الأول: العناصر الانتقالية');
  const [lecDuration, setLecDuration] = useState('45 دقيقة');
  const [lecVideoUrl, setLecVideoUrl] = useState('');
  const [lecThumbnail, setLecThumbnail] = useState('/images/chemistry_lab_visual_1794141316456.jpg');
  const [lecPdfTitle, setLecPdfTitle] = useState('');
  const [lecDescription, setLecDescription] = useState('');
  const [lecIsFree, setLecIsFree] = useState(false);
  const [lecSessionOrder, setLecSessionOrder] = useState<number>(
    () => lectures.filter((l) => l.grade === lecGrade).length + 1
  );
  const [lecQuizId, setLecQuizId] = useState<string>('');

  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [uploadingEditThumb, setUploadingEditThumb] = useState(false);
  const [editThumbProgress, setEditThumbProgress] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmLecId, setDeleteConfirmLecId] = useState<string | null>(null);

  // Quick modal preview for existing lectures
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    title: string;
    kind: 'video' | 'image';
  } | null>(null);

  useEffect(() => {
    return () => {
      if (localVideoPreview) URL.revokeObjectURL(localVideoPreview);
      if (localThumbPreview) URL.revokeObjectURL(localThumbPreview);
    };
  }, [localVideoPreview, localThumbPreview]);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (localVideoPreview) URL.revokeObjectURL(localVideoPreview);
    const previewUrl = URL.createObjectURL(file);
    setLocalVideoPreview(previewUrl);
    setVideoFile(file);
    setUploadingVideo(true);
    setVideoUploadProgress(0);
    setVideoUploadMeta(null);
    setVideoUploadSuccess(false);
    setVideoUploadNotice(null);
    setLectureFormError(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: 'video',
        onProgress: (percent, info) => {
          setVideoUploadProgress(percent);
          setVideoUploadMeta(info);
        },
      });
      setLecVideoUrl(result.url);
      if (result.durationSeconds) {
        const mins = Math.max(1, Math.round(result.durationSeconds / 60));
        setLecDuration(`${mins} دقيقة`);
      }
      setVideoUploadSuccess(true);
      setVideoUploadNotice(
        result.source === 'cloudinary'
          ? 'تم رفع الفيديو على كلاودنري وأصبح جاهزاً للبث السحابي المباشر ⚡'
          : 'تم رفع الفيديو وحفظه بنجاح للبث المباشر ⚡'
      );
    } catch (err: any) {
      setLectureFormError(
        err?.message || 'تعذر رفع الفيديو، يرجى التحقق من إعدادات Cloudinary واتصال الشبكة.'
      );
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (localThumbPreview) URL.revokeObjectURL(localThumbPreview);
    const previewUrl = URL.createObjectURL(file);
    setLocalThumbPreview(previewUrl);
    setUploadingThumb(true);
    setThumbProgress(0);
    setThumbMeta(null);
    setLectureFormError(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: 'image',
        onProgress: (percent, info) => {
          setThumbProgress(percent);
          setThumbMeta(info);
        },
      });
      setLecThumbnail(result.url);
    } catch (err: any) {
      setLectureFormError(err?.message || 'فشل رفع صورة غلاف المحاضرة.');
    } finally {
      setUploadingThumb(false);
      setThumbProgress(0);
      setThumbMeta(null);
    }
  };

  const handleEditThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingLecture) return;

    setUploadingEditThumb(true);
    setEditThumbProgress(0);
    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: 'image',
        onProgress: (percent) => setEditThumbProgress(percent),
      });
      setEditingLecture((prev) => (prev ? { ...prev, thumbnailUrl: result.url } : null));
    } catch (err: any) {
      setLectureFormError(err?.message || 'تعذر رفع صورة الغلاف.');
    } finally {
      setUploadingEditThumb(false);
      setEditThumbProgress(0);
    }
  };

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLectureFormError(null);
    setLectureFormSuccess(null);

    if (uploadingVideo || uploadingThumb) {
      setLectureFormError('يرجى الانتظار حتى يكتمل رفع الملفات بنسبة 100%.');
      return;
    }

    if (!lecTitle.trim()) {
      setLectureFormError('يرجى إدخال عنوان المحاضرة');
      return;
    }

    if (!lecVideoUrl.trim()) {
      setLectureFormError('يرجى رفع فيديو المحاضرة من جهازك أو إدخال رابط الفيديو أولاً.');
      return;
    }

    const newLec: Lecture = {
      id: `lec-${Date.now()}`,
      sessionOrder:
        Number(lecSessionOrder) || lectures.filter((l) => l.grade === lecGrade).length + 1,
      quizId: lecQuizId || undefined,
      title: lecTitle.trim(),
      grade: lecGrade,
      gradeLabel: getGradeDisplayName(lecGrade, siteForm, 'ar'),
      chapter: lecChapter,
      duration: lecDuration || '50 دقيقة',
      videoUrl: lecVideoUrl.trim(),
      thumbnailUrl: lecThumbnail || '/images/chemistry_lab_visual_1794141316456.jpg',
      pdfTitle: lecPdfTitle ? `${lecPdfTitle}.pdf` : undefined,
      description: lecDescription || 'شرح تفاعلي لموضوع الدرس مع أمثلة وتدريبات تطبيقية.',
      isFreePreview: lecIsFree,
      viewsCount: 0,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    setSavingLecture(true);
    try {
      const saved = await onAddLecture(newLec);
      if (saved === false) {
        setLectureFormError('تعذر نشر المحاضرة في السحابة، يرجى المحاولة مرة أخرى.');
        return;
      }
      setLectureFormSuccess('تم نشر المحاضرة بنجاح وأصبحت متاحة للطلاب في المنصة! 🚀');
      setTimeout(() => setLectureFormSuccess(null), 4000);
      setLecTitle('');
      setLecVideoUrl('');
      setLecPdfTitle('');
      setLecDescription('');
      setLecQuizId('');
      setVideoFile(null);
      if (localVideoPreview) {
        URL.revokeObjectURL(localVideoPreview);
        setLocalVideoPreview(null);
      }
      if (localThumbPreview) {
        URL.revokeObjectURL(localThumbPreview);
        setLocalThumbPreview(null);
      }
      setVideoUploadSuccess(false);
      setVideoUploadProgress(0);
      setVideoUploadMeta(null);
    } finally {
      setSavingLecture(false);
    }
  };

  const handleSaveEditedLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecture || !onUpdateLecture) return;
    setSavingEdit(true);
    try {
      const saved = await onUpdateLecture(editingLecture);
      if (saved === false) {
        setLectureFormError('تعذر حفظ تعديلات المحاضرة في السحابة.');
        return;
      }
      setLectureFormSuccess('تم تحديث وتعديل المحاضرة بنجاح! ⚡');
      setTimeout(() => setLectureFormSuccess(null), 3500);
      setEditingLecture(null);
    } finally {
      setSavingEdit(false);
    }
  };

  if (mode === 'upload') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
            رفع ونشر محاضرة تعليمية جديدة
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ارفع الفيديو وشاهد معاينة حية فورية للفيديو وصورة الغلاف قبل وأثناء النشر.
          </p>
        </div>

        {lectureFormSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{lectureFormSuccess}</span>
          </div>
        )}

        {lectureFormError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-sm font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{lectureFormError}</span>
          </div>
        )}

        <form onSubmit={handleCreateLecture} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                عنوان المحاضرة الكيميائية *
              </label>
              <input
                type="text"
                required
                value={lecTitle}
                onChange={(e) => setLecTitle(e.target.value)}
                placeholder="مثال: الباب الأول - الخواص المغناطيسية والنشاط الحفزي لعناصر 3d"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                السنة الدراسية *
              </label>
              <select
                value={lecGrade}
                onChange={(e) => setLecGrade(e.target.value as GradeLevel)}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {resolvedGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.badgeAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                اسم الباب أو الفصل *
              </label>
              <input
                type="text"
                value={lecChapter}
                onChange={(e) => setLecChapter(e.target.value)}
                placeholder="مثال: الباب الأول: العناصر الانتقالية"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Video Uploader */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-teal-100/30 dark:from-slate-800/80 dark:to-teal-950/30 border-2 border-teal-200 dark:border-teal-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-950 dark:text-teal-200 font-kufi">
                      رفع فيديو المحاضرة بسرعة عالية (رفع متوازي مقسم ⚡)
                    </h4>
                    <p className="text-xs text-teal-700/80 dark:text-teal-400">
                      يتم تقسيم الفيديوهات الكبيرة تلقائياً ورفعها بالتوازي لضمان أقصى سرعة وثبات.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 self-start sm:self-auto">
                  Cloud: {cloudName}
                </span>
              </div>

              <div className="border-2 border-dashed border-teal-400/80 dark:border-teal-600 rounded-2xl p-6 text-center bg-white/70 dark:bg-slate-900/60 hover:bg-white transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  onChange={handleVideoFileUpload}
                  disabled={uploadingVideo}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {uploadingVideo ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-kufi">
                    {uploadingVideo
                      ? 'جاري رفع ومعالجة الفيديو...'
                      : 'اضغط لاختيار فيديو المحاضرة من جهازك أو اسحبه هنا'}
                  </div>
                  <p className="text-xs text-slate-500">
                    يدعم جميع الصيغ (MP4, MKV, MOV, WEBM) · مع معاينة فورية للفيديو
                  </p>
                </div>
              </div>

              {uploadingVideo && (
                <UploadProgressBar
                  label="جاري رفع الفيديو..."
                  progress={videoUploadProgress}
                  meta={videoUploadMeta}
                  fileName={videoFile?.name}
                />
              )}

              {videoUploadSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5 font-kufi">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      {videoUploadNotice}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      {lecDuration}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Video Preview (Instant local or uploaded/pasted URL) */}
              {(localVideoPreview || lecVideoUrl.trim()) && (
                <InlineMediaPreview
                  url={lecVideoUrl.trim() || localVideoPreview || ''}
                  title={lecTitle || videoFile?.name || 'معاينة فيديو المحاضرة'}
                  kind="video"
                />
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                رابط بث الفيديو (يُعبأ تلقائياً بعد الرفع أو الصق رابط YouTube) *
              </label>
              <input
                type="text"
                value={lecVideoUrl}
                onChange={(e) => setLecVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono dir-ltr"
              />
            </div>

            {/* Thumbnail Upload + Preview */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>صورة غلاف المحاضرة (Thumbnail)</span>
                </label>
                <label className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingThumb ? 'جاري الرفع...' : 'رفع صورة غلاف من الجهاز'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingThumb}
                    onChange={handleThumbUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadingThumb && (
                <UploadProgressBar
                  label="جاري ضغط ورفع صورة الغلاف..."
                  progress={thumbProgress}
                  meta={thumbMeta}
                />
              )}
              <InlineMediaPreview
                url={localThumbPreview || lecThumbnail}
                title="غلاف المحاضرة"
                kind="image"
                compact
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                مدة المحاضرة
              </label>
              <input
                type="text"
                value={lecDuration}
                onChange={(e) => setLecDuration(e.target.value)}
                placeholder="مثال: 55 دقيقة"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                اسم المذكرة المرفقة مع الدرس (اختياري)
              </label>
              <input
                type="text"
                value={lecPdfTitle}
                onChange={(e) => setLecPdfTitle(e.target.value)}
                placeholder="مثال: شيت تدريبات الباب الأول وحالات التأكسد"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                ترتيب الحصة في التسلسل (رقم الحصة) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={lecSessionOrder}
                onChange={(e) => setLecSessionOrder(Number(e.target.value))}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
              />
              <p className="text-[10px] text-slate-500">
                يستخدم لتطبيق نظام القفل المتسلسل للحصص (1 ثم 2 ثم 3...)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الكويز الإجباري المرتبط (مطلوب اجتيازه لفتح الحصة التالية)
              </label>
              <select
                value={lecQuizId}
                onChange={(e) => setLecQuizId(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">بدون كويز إجباري</option>
                {quizzes
                  .filter((q) => q.grade === lecGrade)
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.questions.length} أسئلة - {q.durationMinutes} دقيقة)
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5 flex items-center gap-3 pt-2 md:col-span-2">
              <input
                type="checkbox"
                id="isFree"
                checked={lecIsFree}
                onChange={(e) => setLecIsFree(e.target.checked)}
                className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
              />
              <label
                htmlFor="isFree"
                className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                محاضرة تجريبية مجانية (مفتوحة لجميع زوار الموقع)
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
              وصف المحاضرة وأهم النقاط المشروحة
            </label>
            <textarea
              rows={3}
              value={lecDescription}
              onChange={(e) => setLecDescription(e.target.value)}
              placeholder="اكتب نبذة عن القوانين والمعادلات التي تم تغطيتها في الحصة..."
              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={uploadingVideo || uploadingThumb || savingLecture}
              className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>
                {uploadingVideo || uploadingThumb
                  ? 'جاري انتظار اكتمال الرفع...'
                  : savingLecture
                  ? 'جاري النشر والحفظ...'
                  : 'نشر المحاضرة الآن على المنصة'}
              </span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
            المحاضرات المنشورة على المنصة ({lectures.length})
          </h2>
          <p className="text-sm text-slate-500">
            يمكنك معاينة الفيديو والغلاف أو تعديل وتحديث أي محاضرة فوراً.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSwitchMode('upload')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة درس جديد</span>
        </button>
      </div>

      {lectureFormSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-xs font-bold text-emerald-800 dark:text-emerald-200">
          {lectureFormSuccess}
        </div>
      )}
      {lectureFormError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-xs font-bold text-rose-800 dark:text-rose-200">
          {lectureFormError}
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {lectures.map((lec) => (
          <div
            key={lec.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() =>
                  setPreviewModal({
                    url: lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg',
                    title: lec.title,
                    kind: 'image',
                  })
                }
                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-zoom-in"
                title="معاينة صورة الغلاف"
              >
                <img
                  src={lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg'}
                  alt={lec.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    {getGradeDisplayName(lec.grade, siteForm, 'ar') || lec.gradeLabel}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    حصة رقم {lec.sessionOrder || 1}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{lec.duration}</span>
                  {lec.isFreePreview && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      مجانية
                    </span>
                  )}
                  {lec.quizId && (
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                      مرتبطة بكويز إجباري
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-kufi truncate">
                  {lec.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{lec.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {lec.videoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      url: lec.videoUrl,
                      title: lec.title,
                      kind: 'video',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="معاينة الفيديو"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setEditingLecture(lec)}
                className="px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تعديل المحاضرة"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>

              {deleteConfirmLecId === lec.id ? (
                <div className="flex items-center gap-1.5 p-1 bg-rose-50 dark:bg-rose-950/80 rounded-xl border border-rose-300 dark:border-rose-800">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1">
                    حذف نهائي؟
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteLecture(lec.id);
                      setDeleteConfirmLecId(null);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تأكيد
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmLecId(null)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmLecId(lec.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="حذف المحاضرة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {lectures.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            لا توجد محاضرات منشورة حالياً. ابدأ برفع أول محاضرة الآن!
          </div>
        )}
      </div>

      {/* Edit Lecture Modal */}
      {editingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold font-kufi text-slate-900 dark:text-white">
                  تعديل تفاصيل المحاضرة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLecture(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedLecture} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  عنوان المحاضرة *
                </label>
                <input
                  type="text"
                  required
                  value={editingLecture.title}
                  onChange={(e) => setEditingLecture({ ...editingLecture, title: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    السنة الدراسية
                  </label>
                  <select
                    value={editingLecture.grade}
                    onChange={(e) => {
                      const g = e.target.value as GradeLevel;
                      setEditingLecture({
                        ...editingLecture,
                        grade: g,
                        gradeLabel: getGradeDisplayName(g, siteForm, 'ar'),
                      });
                    }}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
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
                    اسم الباب أو الفصل
                  </label>
                  <input
                    type="text"
                    value={editingLecture.chapter}
                    onChange={(e) =>
                      setEditingLecture({ ...editingLecture, chapter: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    مدة المحاضرة
                  </label>
                  <input
                    type="text"
                    value={editingLecture.duration}
                    onChange={(e) =>
                      setEditingLecture({ ...editingLecture, duration: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    ترتيب الحصة في المنصة
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingLecture.sessionOrder || 1}
                    onChange={(e) =>
                      setEditingLecture({
                        ...editingLecture,
                        sessionOrder: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  رابط الفيديو *
                </label>
                <input
                  type="text"
                  required
                  value={editingLecture.videoUrl}
                  onChange={(e) =>
                    setEditingLecture({ ...editingLecture, videoUrl: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr"
                />
              </div>

              {editingLecture.videoUrl && (
                <InlineMediaPreview
                  url={editingLecture.videoUrl}
                  title={editingLecture.title}
                  kind="video"
                  compact
                />
              )}

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    صورة غلاف المحاضرة
                  </span>
                  <label className="px-3 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-bold cursor-pointer">
                    {uploadingEditThumb ? `جاري الرفع ${editThumbProgress}%` : 'تغيير الغلاف'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingEditThumb}
                      onChange={handleEditThumbUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <InlineMediaPreview
                  url={editingLecture.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg'}
                  title="صورة الغلاف"
                  kind="image"
                  compact
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  الكويز الإجباري المرتبط
                </label>
                <select
                  value={editingLecture.quizId || ''}
                  onChange={(e) =>
                    setEditingLecture({
                      ...editingLecture,
                      quizId: e.target.value || undefined,
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                >
                  <option value="">بدون كويز إجباري</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsFree"
                  checked={editingLecture.isFreePreview || false}
                  onChange={(e) =>
                    setEditingLecture({ ...editingLecture, isFreePreview: e.target.checked })
                  }
                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="editIsFree"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  محاضرة تجريبية مجانية لجميع الزوار
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  وصف المحاضرة
                </label>
                <textarea
                  rows={3}
                  value={editingLecture.description}
                  onChange={(e) =>
                    setEditingLecture({ ...editingLecture, description: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLecture(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || uploadingEditThumb}
                  className="px-6 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPreviewModal
        isOpen={Boolean(previewModal)}
        onClose={() => setPreviewModal(null)}
        url={previewModal?.url || ''}
        title={previewModal?.title}
        kind={previewModal?.kind}
      />
    </div>
  );
};
