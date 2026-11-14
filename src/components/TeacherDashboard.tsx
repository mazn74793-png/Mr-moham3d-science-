import React, { useState, useEffect } from 'react';
import {
  Plus, Video, FileText, Cloud, AlertCircle, ChevronRight, Palette, Award, Trophy,
  Users, Shield, ShieldCheck, GraduationCap, LayoutDashboard, Menu, X, ExternalLink
} from 'lucide-react';
import { Lecture, AttachmentFile, CloudinaryConfig, Quiz, UserProfile } from '../types';
import { SiteConfig, getResolvedGrades } from '../types/siteConfig';
import { TeacherQuizManager } from './TeacherQuizManager';
import { TeacherReportsManager } from './TeacherReportsManager';
import { OverviewTab } from './teacher/OverviewTab';
import { LecturesTab } from './teacher/LecturesTab';
import { FilesTab } from './teacher/FilesTab';
import { AcademicYearsTab } from './teacher/AcademicYearsTab';
import { CoAdminsTab } from './teacher/CoAdminsTab';
import { CloudinaryTab } from './teacher/CloudinaryTab';
import { SiteCustomizerTab } from './teacher/SiteCustomizerTab';

interface TeacherDashboardProps {
  lectures: Lecture[];
  onAddLecture: (newLecture: Lecture) => Promise<boolean> | boolean | void;
  onDeleteLecture: (id: string) => Promise<boolean> | boolean | void;
  onUpdateLecture?: (updated: Lecture) => Promise<boolean> | boolean | void;
  attachments: AttachmentFile[];
  onAddAttachment: (newFile: AttachmentFile) => Promise<boolean> | boolean | void;
  onDeleteAttachment: (id: string) => Promise<boolean> | boolean | void;
  quizzes: Quiz[];
  onAddQuiz: (newQuiz: Quiz) => Promise<boolean> | boolean | void;
  onDeleteQuiz: (quizId: string) => Promise<boolean> | boolean | void;
  students: UserProfile[];
  onUpdateStudent?: (student: UserProfile) => Promise<boolean> | boolean | void;
  onDeleteStudent?: (studentId: string) => Promise<boolean> | boolean | void;
  onAddStudent?: (student: UserProfile) => Promise<boolean> | boolean | void;
  cloudinaryConfig: CloudinaryConfig;
  onSaveCloudinaryConfig: (config: CloudinaryConfig) => Promise<boolean> | boolean | void;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (newConfig: SiteConfig) => Promise<boolean> | boolean | void;
  onBackToHome: () => void;
  onOpenStudentPortal: () => void;
  onResetAllData?: () => Promise<boolean> | boolean | void;
}

export type TeacherDashboardTab =
  | 'overview'
  | 'all-students'
  | 'upload-lecture'
  | 'lectures-list'
  | 'quizzes-bank'
  | 'files'
  | 'academic-years'
  | 'co-admins'
  | 'site-customizer'
  | 'cloudinary';

const CLOUDINARY_TOTAL_QUOTA_GB = 25.0;

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  lectures,
  onAddLecture,
  onDeleteLecture,
  onUpdateLecture,
  attachments,
  onAddAttachment,
  onDeleteAttachment,
  quizzes,
  onAddQuiz,
  onDeleteQuiz,
  students,
  onUpdateStudent,
  onDeleteStudent,
  onAddStudent,
  cloudinaryConfig,
  onSaveCloudinaryConfig,
  siteConfig,
  onSaveSiteConfig,
  onBackToHome,
  onOpenStudentPortal,
  onResetAllData,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [siteForm, setSiteForm] = useState<SiteConfig>(siteConfig);
  useEffect(() => {
    setSiteForm(siteConfig);
  }, [siteConfig]);

  const resolvedGrades = getResolvedGrades(siteForm);

  // Storage quota calculations
  const totalUsedMB = (() => {
    let total = 0;
    attachments.forEach((file) => {
      const raw = (file.fileSize || '').trim().toLowerCase();
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        if (raw.includes('gb')) total += num * 1024;
        else if (raw.includes('kb')) total += num / 1024;
        else total += num;
      } else {
        total += 3.5;
      }
    });
    lectures.forEach((lec) => {
      if (lec.videoUrl) total += 125.0;
    });
    return total;
  })();

  const totalUsedGB = Number((totalUsedMB / 1024).toFixed(2));
  const remainingGB = Number(Math.max(0, CLOUDINARY_TOTAL_QUOTA_GB - totalUsedGB).toFixed(2));
  const usedPercentage = Number(
    Math.min(100, (totalUsedGB / CLOUDINARY_TOTAL_QUOTA_GB) * 100).toFixed(1)
  );

  return (
    <div className="min-h-screen bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      {/* Top Admin Header */}
      <header className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white border-b border-teal-800/60 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="القائمة الجانبية"
              >
                {isMobileSidebarOpen ? (
                  <X className="w-5 h-5 text-amber-300" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              <button
                type="button"
                onClick={onBackToHome}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="العودة للرئيسية"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold font-kufi">
                    لوحة تحكم الأستاذ {siteConfig.teacherName} ⚗️
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>مسؤول معتمد</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('site-customizer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'site-customizer'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-amber-300 hidden sm:flex'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>هوية الموقع 🎨</span>
              </button>

              <button
                type="button"
                onClick={onOpenStudentPortal}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>معاينة الطلاب</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] w-full">
        {/* Sidebar */}
        <aside
          className={`w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 lg:p-5 flex flex-col justify-between ${
            isMobileSidebarOpen ? 'block' : 'hidden lg:flex'
          }`}
        >
          <div className="space-y-6">
            <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-teal-600 shrink-0 border border-teal-400/40">
                <img
                  src={siteForm.profileImageUrl || '/images/teacher_placeholder.svg'}
                  alt={siteForm.teacherName}
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/teacher_placeholder.svg';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate font-kufi">
                  {siteForm.teacherName}
                </div>
                <div className="text-[10px] text-teal-700 dark:text-teal-400 truncate font-mono">
                  {siteForm.adminEmails?.[0] || 'mizoo2y2@gmail.com'}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                الرئيسية والمتابعة
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>نظرة عامة وسريعة</span>
                </div>
                <span className="text-[10px] opacity-75">لوحة التحكم</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('all-students');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'all-students'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>سجل وقائمة الطلاب</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-slate-900 dark:text-amber-200 text-[10px] font-bold font-mono">
                  {students.filter((s) => s.role !== 'teacher').length}
                </span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                المحتوى التعليمي
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload-lecture');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'upload-lecture'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>رفع محاضرة جديدة</span>
                </div>
                <span className="text-[10px] text-teal-400">فيديو + كويز</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('lectures-list');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'lectures-list'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-sky-500" />
                  <span>المحاضرات المنشورة</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  {lectures.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('quizzes-bank');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'quizzes-bank'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>بنك الأسئلة والاختبارات</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  {quizzes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('files');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'files'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>الملازم ومساحة التخزين</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  {attachments.length}
                </span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                إدارة المنصة وهوية الموقع
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('academic-years');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'academic-years'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>تخصيص أسماء السنوات</span>
                </div>
                <span className="text-[10px] text-teal-400">الرئيسية</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('co-admins');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'co-admins'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-teal-500" />
                  <span>المشرفين والمدراء المساعدين</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-mono font-bold">
                  {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('site-customizer');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'site-customizer'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-purple-500" />
                  <span>هوية الموقع والفوتر</span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold">تعديل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('cloudinary');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'cloudinary'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>إعدادات Cloudinary</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">25 GB</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-teal-600" />
                <span>سعة كلاودنري السحابية</span>
              </span>
              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold text-[11px]">
                {remainingGB} GB متبقية
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usedPercentage > 85
                    ? 'bg-rose-500'
                    : usedPercentage > 60
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(4, usedPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`} مستخدمة</span>
              <span>من {CLOUDINARY_TOTAL_QUOTA_GB} GB</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              siteConfig={siteConfig}
              siteForm={siteForm}
              lectures={lectures}
              attachments={attachments}
              students={students}
              totalUsedMB={totalUsedMB}
              totalUsedGB={totalUsedGB}
              remainingGB={remainingGB}
              usedPercentage={usedPercentage}
              totalQuotaGB={CLOUDINARY_TOTAL_QUOTA_GB}
              onNavigateTab={setActiveTab}
              onOpenResetModal={() => setResetConfirmOpen(true)}
            />
          )}

          {activeTab === 'academic-years' && (
            <AcademicYearsTab
              resolvedGrades={resolvedGrades}
              siteForm={siteForm}
              setSiteForm={setSiteForm}
              onSaveSiteConfig={onSaveSiteConfig}
            />
          )}

          {activeTab === 'co-admins' && (
            <CoAdminsTab
              siteForm={siteForm}
              setSiteForm={setSiteForm}
              onSaveSiteConfig={onSaveSiteConfig}
            />
          )}

          {activeTab === 'all-students' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 font-kufi">
                    سجل وقائمة الطلاب الشاملة لجميع السنوات الدراسية المفعلة
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono">
                  {students.filter((s) => s.role !== 'teacher').length} طالب مسجل
                </span>
              </div>

              <TeacherReportsManager
                students={students}
                lectures={lectures}
                quizzes={quizzes}
                grades={resolvedGrades}
                onUpdateStudent={onUpdateStudent}
                onDeleteStudent={onDeleteStudent}
                onAddStudent={onAddStudent}
              />
            </div>
          )}

          {(activeTab === 'upload-lecture' || activeTab === 'lectures-list') && (
            <LecturesTab
              mode={activeTab === 'upload-lecture' ? 'upload' : 'list'}
              lectures={lectures}
              quizzes={quizzes}
              resolvedGrades={resolvedGrades}
              siteForm={siteForm}
              cloudinaryConfig={cloudinaryConfig}
              onAddLecture={onAddLecture}
              onUpdateLecture={onUpdateLecture}
              onDeleteLecture={onDeleteLecture}
              onSwitchMode={(m) => setActiveTab(m === 'upload' ? 'upload-lecture' : 'lectures-list')}
            />
          )}

          {activeTab === 'quizzes-bank' && (
            <TeacherQuizManager
              quizzes={quizzes}
              lectures={lectures}
              cloudinaryConfig={cloudinaryConfig}
              grades={resolvedGrades}
              onAddQuiz={onAddQuiz}
              onDeleteQuiz={onDeleteQuiz}
            />
          )}

          {activeTab === 'files' && (
            <FilesTab
              attachments={attachments}
              lectures={lectures}
              resolvedGrades={resolvedGrades}
              siteForm={siteForm}
              cloudinaryConfig={cloudinaryConfig}
              totalUsedMB={totalUsedMB}
              totalUsedGB={totalUsedGB}
              remainingGB={remainingGB}
              usedPercentage={usedPercentage}
              totalQuotaGB={CLOUDINARY_TOTAL_QUOTA_GB}
              onAddAttachment={onAddAttachment}
              onDeleteAttachment={onDeleteAttachment}
            />
          )}

          {activeTab === 'cloudinary' && (
            <CloudinaryTab
              cloudinaryConfig={cloudinaryConfig}
              onSaveCloudinaryConfig={onSaveCloudinaryConfig}
            />
          )}

          {activeTab === 'site-customizer' && (
            <SiteCustomizerTab
              siteConfig={siteConfig}
              siteForm={siteForm}
              setSiteForm={setSiteForm}
              cloudinaryConfig={cloudinaryConfig}
              onSaveSiteConfig={onSaveSiteConfig}
            />
          )}
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-kufi text-base text-slate-900 dark:text-white">
                  تأكيد تصفير وإفراغ جميع البيانات
                </h3>
                <p className="text-xs text-slate-500">
                  سيتم حذف وتصفير قوائم المحاضرات والامتحانات والملفات لتبدأ المنصة نظيفة تماماً.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1 font-mono">
              <div>• عدد المحاضرات: {lectures.length}</div>
              <div>• عدد الامتحانات: {quizzes.length}</div>
              <div>• عدد المذكرات: {attachments.length}</div>
              <div>• عدد الطلاب: {students.length}</div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={async () => {
                  setResetting(true);
                  try {
                    await onResetAllData?.();
                    setResetConfirmOpen(false);
                  } finally {
                    setResetting(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {resetting ? 'جاري التصفير...' : 'نعم، صفر كل البيانات الآن'}
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
