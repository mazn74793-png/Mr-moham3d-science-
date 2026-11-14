import React, { useState } from 'react';
import {
  Sparkles, Video, FileText, Users, ShieldCheck, Plus, GraduationCap,
  Palette, Trash2, RefreshCcw, Eye
} from 'lucide-react';
import { Lecture, AttachmentFile, UserProfile } from '../../types';
import { SiteConfig } from '../../types/siteConfig';
import { MediaPreviewModal } from '../MediaPreview';

interface OverviewTabProps {
  siteConfig: SiteConfig;
  siteForm: SiteConfig;
  lectures: Lecture[];
  attachments: AttachmentFile[];
  students: UserProfile[];
  totalUsedMB: number;
  totalUsedGB: number;
  remainingGB: number;
  usedPercentage: number;
  totalQuotaGB: number;
  onNavigateTab: (
    tab:
      | 'overview'
      | 'all-students'
      | 'upload-lecture'
      | 'lectures-list'
      | 'quizzes-bank'
      | 'files'
      | 'academic-years'
      | 'co-admins'
      | 'site-customizer'
      | 'cloudinary'
  ) => void;
  onOpenResetModal: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  siteConfig,
  siteForm,
  lectures,
  attachments,
  students,
  totalUsedMB,
  totalUsedGB,
  remainingGB,
  usedPercentage,
  totalQuotaGB,
  onNavigateTab,
  onOpenResetModal,
}) => {
  const [previewItem, setPreviewItem] = useState<{
    url: string;
    title: string;
    kind: 'image' | 'video';
  } | null>(null);

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>المنظومة السحابية المحدثة · دفعة 2026</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-kufi">
            أهلاً بك يا أستاذ {siteConfig.teacherName} ⚗️
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-sans">
            لوحة التحكم المركزية تتيح لك إدارة المحاضرات، بنك الأسئلة، الطلاب، المذكرات السحابية عبر Cloudinary، وتخصيص أسماء السنوات الدراسية وإضافة مشرفين بكل سلاسة.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('lectures-list')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-teal-500 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>المحاضرات</span>
            <Video className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-teal-600 font-mono tabular-nums">
            {lectures.length}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400">محاضرة منشورة ومفعلة</div>
        </div>

        <div
          onClick={() => onNavigateTab('files')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-amber-500 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>المذكرات والملفات</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-mono tabular-nums">
            {attachments.length}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400">ملفات سحابية متاحة</div>
        </div>

        <div
          onClick={() => onNavigateTab('all-students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-emerald-500 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>الطلاب المشتركون</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {students.filter((s) => s.role !== 'teacher').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">حسابات حقيقية مسجلة</div>
        </div>

        <div
          onClick={() => onNavigateTab('co-admins')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-sky-500 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>فريق الإدارة (Admins)</span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-sky-600 font-mono tabular-nums">
            {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length}
          </div>
          <div className="text-[11px] text-sky-600 font-semibold">بكامل الصلاحيات الإدارية</div>
        </div>
      </div>

      {/* Cloudinary Live Storage Monitor Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white border border-teal-800/50 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-teal-300 font-mono">
                سعة تخزين كلاودنري السحابية (Cloudinary Live Storage)
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
      </div>

      {/* Fast Action Launchpads */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
          روابط التشغيل السريعة:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('upload-lecture')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-sm text-right transition-all group cursor-pointer"
          >
            <Plus className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">رفع محاضرة</div>
            <div className="text-[10px] text-slate-400 mt-0.5">فيديو وكويز مباشر</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('all-students')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-sm text-right transition-all group cursor-pointer"
          >
            <Users className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">سجل الطلاب</div>
            <div className="text-[10px] text-slate-400 mt-0.5">جميع السنوات</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('files')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-sm text-right transition-all group cursor-pointer"
          >
            <FileText className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">رفع مذكرة PDF</div>
            <div className="text-[10px] text-slate-400 mt-0.5">تحديث سعة التخزين</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('academic-years')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-sm text-right transition-all group cursor-pointer"
          >
            <GraduationCap className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">أسماء السنوات</div>
            <div className="text-[10px] text-slate-400 mt-0.5">تعديل كروت الرئيسية</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('co-admins')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-sm text-right transition-all group cursor-pointer"
          >
            <ShieldCheck className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">إضافة مدير مساعد</div>
            <div className="text-[10px] text-slate-400 mt-0.5">صلاحيات كاملة فورية</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('site-customizer')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-sm text-right transition-all group cursor-pointer"
          >
            <Palette className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">هوية الموقع والفوتر</div>
            <div className="text-[10px] text-slate-400 mt-0.5">الروابط ونبذة المعلم</div>
          </button>
        </div>
      </div>

      {/* Recent Lectures Strip with Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
            آخر المحاضرات المنشورة ({lectures.length}):
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('lectures-list')}
            className="text-xs text-teal-600 hover:underline font-bold cursor-pointer"
          >
            عرض وإدارة جميع المحاضرات ←
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lectures.slice(0, 3).map((lec) => (
            <div
              key={lec.id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewItem({
                      url: lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg',
                      title: lec.title,
                      kind: 'image',
                    })
                  }
                  className="shrink-0 cursor-zoom-in rounded-xl overflow-hidden"
                  title="معاينة الصورة"
                >
                  <img
                    src={lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg'}
                    alt={lec.title}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 object-cover"
                  />
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {lec.title}
                  </div>
                  <div className="text-[11px] text-teal-600 font-mono mt-0.5">
                    {lec.duration} · حصة {lec.sessionOrder || 1}
                  </div>
                </div>
              </div>

              {lec.videoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewItem({
                      url: lec.videoUrl,
                      title: lec.title,
                      kind: 'video',
                    })
                  }
                  className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 hover:bg-teal-100 shrink-0 cursor-pointer"
                  title="معاينة الفيديو"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Zero-Out / Reset Data Control */}
      <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <Trash2 className="w-4 h-4" />
            <span>إدارة وتصفير بيانات المنصة (Clear All Data):</span>
          </div>
          <p className="text-xs text-rose-600/90 dark:text-rose-400/80 max-w-xl leading-relaxed">
            تصفير جميع المحاضرات والاختبارات والمذكرات والطلاب والبدء من 0 بقيم حسابية حقيقية تماماً.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenResetModal}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-700/20 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>تصفير وإفراغ كل البيانات</span>
        </button>
      </div>

      <MediaPreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        url={previewItem?.url || ''}
        title={previewItem?.title}
        kind={previewItem?.kind}
      />
    </div>
  );
};
