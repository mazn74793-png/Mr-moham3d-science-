import React, { useState } from 'react';
import {
  Sparkles, Video, FileText, Users, ShieldCheck, Plus, GraduationCap,
  Palette, Trash2, RefreshCcw, Eye, Ticket, X, Bell, ShieldAlert, Clock3, SlidersHorizontal
} from 'lucide-react';
import { Lecture, AttachmentFile, UserProfile } from '../../types';
import { SiteConfig } from '../../types/siteConfig';
import { useLanguage } from '../../context/LanguageContext';
import { optimizeImageUrl, optimizeVideoStreamUrl, getVideoPosterUrl } from '../../utils/mediaOptimizer';

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
  unresolvedAlertsCount?: number;
  pendingApprovalsCount?: number;
  onNavigateTab: (
    tab:
      | 'overview'
      | 'all-students'
      | 'exam-alerts'
      | 'upload-lecture'
      | 'lectures-list'
      | 'quizzes-bank'
      | 'files'
      | 'academic-years'
      | 'co-admins'
      | 'feature-controls'
      | 'points-codes'
      | 'notifications'
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
  unresolvedAlertsCount = 0,
  pendingApprovalsCount = 0,
  onNavigateTab,
  onOpenResetModal,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
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
            <span>
              {isEn ? 'Cloud Workspace · Class of 2026' : 'المنظومة السحابية المحدثة · دفعة 2026'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-kufi">
            {isEn
              ? `Welcome back, Mr. Mohamed Mostafa`
              : `أهلاً بك يا أستاذ ${siteConfig.teacherName}`}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-sans">
            {isEn
              ? 'Central dashboard to manage lectures, question banks, students, points & codes, Cloudinary uploads, academic grades, and co-admins.'
              : 'لوحة التحكم المركزية تتيح لك إدارة المحاضرات، بنك الأسئلة، الطلاب، المذكرات السحابية عبر Cloudinary، وتخصيص أسماء السنوات الدراسية وإضافة مشرفين بكل سلاسة.'}
          </p>
        </div>
      </div>

      {/* Pending Student Approvals Urgent Alert */}
      {pendingApprovalsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400/70 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Clock3 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold font-kufi text-slate-900 dark:text-white">
                {isEn
                  ? `${pendingApprovalsCount} New Student Registration(s) Awaiting Your Approval`
                  : `يوجد ${pendingApprovalsCount} طلب تسجيل طلاب جديد بانتظار موافقتك`}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                {isEn
                  ? 'Approve or reject new Google & manual accounts from the Students Directory before they can access lectures or exams.'
                  : 'قم بمراجعة بيانات الطلاب الجدد والموافقة عليهم من سجل الطلاب ليتمكنوا من الدخول.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('all-students')}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
          >
            {isEn ? 'Review Approvals Now' : 'مراجعة الطلبات والموافقة الآن'}
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <div
          onClick={() => onNavigateTab('lectures-list')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-teal-500 hover-card-lift cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>{isEn ? 'Lectures' : 'المحاضرات'}</span>
            <Video className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-teal-600 font-mono tabular-nums">
            {lectures.length}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400">
            {isEn ? 'Published sessions' : 'محاضرة منشورة ومفعلة'}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('files')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-amber-500 hover-card-lift cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>{isEn ? 'Handouts & Files' : 'المذكرات والملفات'}</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-mono tabular-nums">
            {attachments.length}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400">
            {isEn ? 'Cloud PDF files' : 'ملفات سحابية متاحة'}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('all-students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-emerald-500 hover-card-lift cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>{isEn ? 'Students' : 'الطلاب المشتركون'}</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {students.filter((s) => s.role !== 'teacher').length}
          </div>
          <div className="text-[11px] font-semibold">
            {pendingApprovalsCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                {isEn ? `${pendingApprovalsCount} awaiting approval` : `${pendingApprovalsCount} بانتظار الموافقة`}
              </span>
            ) : (
              <span className="text-emerald-600">
                {isEn ? 'Registered accounts' : 'حسابات حقيقية مسجلة'}
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('co-admins')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-sky-500 hover-card-lift cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>{isEn ? 'Admin Team' : 'فريق الإدارة (Admins)'}</span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-sky-600 font-mono tabular-nums">
            {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length}
          </div>
          <div className="text-[11px] text-sky-600 font-semibold">
            {isEn ? 'Full access' : 'بكامل الصلاحيات الإدارية'}
          </div>
        </div>
      </div>

      {/* Cloudinary Live Storage Monitor Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white border border-teal-800/50 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-teal-300 font-mono">
              {isEn ? 'Cloudinary Cloud Storage' : 'سعة تخزين كلاودنري السحابية (Cloudinary Storage)'}
            </div>
            <h3 className="text-xl font-bold font-kufi tabular-nums">
              {isEn ? 'Remaining Space: ' : 'المساحة المتبقية: '}
              <span className="text-amber-300 font-mono">{remainingGB} GB</span>{' '}
              {isEn ? `of ${totalQuotaGB} GB` : `من إجمالي ${totalQuotaGB} GB`}
            </h3>
          </div>

          <div className="text-start sm:text-end font-mono tabular-nums">
            <div className="text-xs text-slate-400">{isEn ? 'Active Usage:' : 'المستهلك الفعلي:'}</div>
            <div className="text-lg font-bold text-teal-300">
              {totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`}
              <span className="text-xs text-slate-400 font-normal ms-1.5">({usedPercentage}%)</span>
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
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <span>0 GB</span>
            <span>
              {isEn
                ? `Used: ${totalUsedGB} GB (${lectures.length} videos + ${attachments.length} PDFs)`
                : `المستخدم: ${totalUsedGB} GB (${lectures.length} فيديو + ${attachments.length} ملزمة)`}
            </span>
            <span>{isEn ? `Limit: ${totalQuotaGB} GB` : `الحد الأقصى المجاني: ${totalQuotaGB} GB`}</span>
          </div>
        </div>
      </div>

      {/* Fast Action Launchpads */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
          {isEn ? 'Quick Launchpads:' : 'روابط التشغيل السريعة:'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('upload-lecture')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover-card-lift text-start group cursor-pointer"
          >
            <Plus className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Upload Lecture' : 'رفع محاضرة'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Video & linked quiz' : 'فيديو وكويز مباشر'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('points-codes')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover-card-lift text-start group cursor-pointer"
          >
            <Ticket className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Points & Codes' : 'أكواد النقاط والمكافآت'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Generate student redeem codes' : 'إنشاء أكواد شحن للطلاب'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('all-students')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover-card-lift text-start group cursor-pointer"
          >
            <Users className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Students Directory' : 'سجل الطلاب'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'All grades' : 'جميع السنوات'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('files')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover-card-lift text-start group cursor-pointer"
          >
            <FileText className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Upload PDF Handout' : 'رفع مذكرة PDF'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Study sheets & notes' : 'تحديث سعة التخزين'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('academic-years')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover-card-lift text-start group cursor-pointer"
          >
            <GraduationCap className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Academic Grades' : 'أسماء السنوات'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Edit curriculum cards' : 'تعديل كروت الرئيسية'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('co-admins')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover-card-lift text-start group cursor-pointer"
          >
            <ShieldCheck className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Add Co-Admin' : 'إضافة مدير مساعد'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Instant admin privileges' : 'صلاحيات كاملة فورية'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('notifications')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover-card-lift text-start group cursor-pointer"
          >
            <Bell className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Notifications' : 'الإشعارات والتنبيهات'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Post updates to students' : 'رسائل وتنبيهات للطلاب'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('exam-alerts')}
            className={`p-4 rounded-2xl border hover-card-lift text-start group cursor-pointer ${
              unresolvedAlertsCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <ShieldAlert className="w-6 h-6 text-rose-600 group-hover:scale-110 transition-transform" />
              {unresolvedAlertsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold tabular-nums">
                  {unresolvedAlertsCount}
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Exam Anti-Cheat Alerts' : 'تنبيهات الغش واللجان'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {isEn ? 'Violations, retakes & blocks' : 'متابعة الغش والحظر والإعادة'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('feature-controls')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover-card-lift text-start group cursor-pointer"
          >
            <SlidersHorizontal className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Feature Toggles' : 'تفعيل وإغلاق الوظائف'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Approvals, quizzes & modules' : 'الموافقات والامتحانات والأقسام'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('site-customizer')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover-card-lift text-start group cursor-pointer"
          >
            <Palette className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {isEn ? 'Branding & Footer' : 'هوية الموقع والفوتر'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isEn ? 'Links & educator bio' : 'الروابط ونبذة المعلم'}
            </div>
          </button>
        </div>
      </div>

      {/* Recent Lectures Strip with Inline Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi tabular-nums">
            {isEn
              ? `Recent Lectures (${lectures.length}):`
              : `آخر المحاضرات المنشورة (${lectures.length}):`}
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('lectures-list')}
            className="text-xs text-teal-600 hover:underline font-bold cursor-pointer"
          >
            {isEn ? 'Manage all lectures →' : 'عرض وإدارة جميع المحاضرات ←'}
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
                    setPreviewItem((prev) =>
                      prev?.url === (lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg') && prev?.kind === 'image'
                        ? null
                        : {
                            url: lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg',
                            title: lec.title,
                            kind: 'image',
                          }
                    )
                  }
                  className="shrink-0 cursor-pointer rounded-xl overflow-hidden"
                  title={isEn ? 'Preview image' : 'معاينة الصورة'}
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
                  <div className="text-[11px] text-teal-600 font-mono mt-0.5 tabular-nums">
                    {lec.duration} · {isEn ? `Session ${lec.sessionOrder || 1}` : `حصة ${lec.sessionOrder || 1}`}
                  </div>
                </div>
              </div>

              {lec.videoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewItem((prev) =>
                      prev?.url === lec.videoUrl && prev?.kind === 'video'
                        ? null
                        : {
                            url: lec.videoUrl,
                            title: lec.title,
                            kind: 'video',
                          }
                    )
                  }
                  className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 hover:bg-teal-100 shrink-0 cursor-pointer"
                  title={isEn ? 'Preview video' : 'معاينة الفيديو'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Inline Media Preview Container (Zero Popup) */}
        {previewItem && (
          <div className="rounded-2xl border border-teal-500/40 bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {previewItem.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isEn ? 'Close Preview' : 'إغلاق المعاينة'}</span>
              </button>
            </div>
            <div className="p-4 flex justify-center">
              {previewItem.kind === 'image' ? (
                <img
                  src={optimizeImageUrl(previewItem.url, 1200)}
                  alt={previewItem.title}
                  className="max-h-[420px] rounded-xl object-contain"
                />
              ) : (
                <video
                  src={optimizeVideoStreamUrl(previewItem.url, 'fast')}
                  poster={getVideoPosterUrl(previewItem.url)}
                  controls
                  playsInline
                  className="w-full max-h-[420px] rounded-xl bg-black"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zero-Out / Reset Data Control */}
      <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <Trash2 className="w-4 h-4" />
            <span>{isEn ? 'Clear All Platform Data:' : 'إدارة وتصفير بيانات المنصة (Clear All Data):'}</span>
          </div>
          <p className="text-xs text-rose-600/90 dark:text-rose-400/80 max-w-xl leading-relaxed">
            {isEn
              ? 'Reset all lectures, quizzes, handouts, and student profiles to start cleanly from zero.'
              : 'تصفير جميع المحاضرات والاختبارات والمذكرات والطلاب والبدء من 0 بقيم حسابية حقيقية تماماً.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenResetModal}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-700/20 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>{isEn ? 'Clear All Data' : 'تصفير وإفراغ كل البيانات'}</span>
        </button>
      </div>
    </div>
  );
};
