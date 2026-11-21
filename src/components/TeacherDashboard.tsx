import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  Plus, Video, FileText, Cloud, AlertCircle, ChevronRight, Palette, Award, Trophy,
  Users, Shield, ShieldCheck, ShieldAlert, GraduationCap, LayoutDashboard, Menu, X, ExternalLink, Ticket, Bell, RefreshCw, MailCheck, SlidersHorizontal
} from 'lucide-react';
import { Lecture, AttachmentFile, CloudinaryConfig, Quiz, UserProfile, RedeemCode, PointReward, PlatformNotification, ExamSecurityAlert } from '../types';
import { SiteConfig, getResolvedGrades, DEFAULT_TEACHER_PORTRAIT } from '../types/siteConfig';
import { auth, hasPasswordLinked, resendVerificationEmail } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { TeacherTabSkeleton } from './teacher/DashboardSkeleton';

const loadTeacherQuizManager = () =>
  import('./TeacherQuizManager').then((m) => ({ default: m.TeacherQuizManager }));
const loadTeacherReportsManager = () =>
  import('./TeacherReportsManager').then((m) => ({ default: m.TeacherReportsManager }));
const loadOverviewTab = () =>
  import('./teacher/OverviewTab').then((m) => ({ default: m.OverviewTab }));
const loadLecturesTab = () =>
  import('./teacher/LecturesTab').then((m) => ({ default: m.LecturesTab }));
const loadFilesTab = () =>
  import('./teacher/FilesTab').then((m) => ({ default: m.FilesTab }));
const loadAcademicYearsTab = () =>
  import('./teacher/AcademicYearsTab').then((m) => ({ default: m.AcademicYearsTab }));
const loadCoAdminsTab = () =>
  import('./teacher/CoAdminsTab').then((m) => ({ default: m.CoAdminsTab }));
const loadCloudinaryTab = () =>
  import('./teacher/CloudinaryTab').then((m) => ({ default: m.CloudinaryTab }));
const loadSiteCustomizerTab = () =>
  import('./teacher/SiteCustomizerTab').then((m) => ({ default: m.SiteCustomizerTab }));
const loadPointsCodesTab = () =>
  import('./teacher/PointsCodesTab').then((m) => ({ default: m.PointsCodesTab }));
const loadNotificationsTab = () =>
  import('./teacher/NotificationsTab').then((m) => ({ default: m.NotificationsTab }));
const loadExamAlertsTab = () =>
  import('./teacher/ExamAlertsTab').then((m) => ({ default: m.ExamAlertsTab }));
const loadFeatureControlsTab = () =>
  import('./teacher/FeatureControlsTab').then((m) => ({ default: m.FeatureControlsTab }));
const loadLinkPasswordSetup = () =>
  import('./LinkPasswordSetup').then((m) => ({ default: m.LinkPasswordSetup }));

const TeacherQuizManager = lazy(loadTeacherQuizManager);
const TeacherReportsManager = lazy(loadTeacherReportsManager);
const OverviewTab = lazy(loadOverviewTab);
const LecturesTab = lazy(loadLecturesTab);
const FilesTab = lazy(loadFilesTab);
const AcademicYearsTab = lazy(loadAcademicYearsTab);
const CoAdminsTab = lazy(loadCoAdminsTab);
const CloudinaryTab = lazy(loadCloudinaryTab);
const SiteCustomizerTab = lazy(loadSiteCustomizerTab);
const PointsCodesTab = lazy(loadPointsCodesTab);
const NotificationsTab = lazy(loadNotificationsTab);
const ExamAlertsTab = lazy(loadExamAlertsTab);
const FeatureControlsTab = lazy(loadFeatureControlsTab);
const LinkPasswordSetup = lazy(loadLinkPasswordSetup);

interface TeacherDashboardProps {
  initialTab?: TeacherDashboardTab;
  lectures: Lecture[];
  onAddLecture: (newLecture: Lecture) => Promise<boolean> | boolean | void;
  onDeleteLecture: (id: string) => Promise<boolean> | boolean | void;
  onUpdateLecture?: (updated: Lecture) => Promise<boolean> | boolean | void;
  attachments: AttachmentFile[];
  onAddAttachment: (newFile: AttachmentFile) => Promise<boolean> | boolean | void;
  onUpdateAttachment?: (updated: AttachmentFile) => Promise<boolean> | boolean | void;
  onDeleteAttachment: (id: string) => Promise<boolean> | boolean | void;
  quizzes: Quiz[];
  onAddQuiz: (newQuiz: Quiz) => Promise<boolean> | boolean | void;
  onUpdateQuiz?: (updatedQuiz: Quiz) => Promise<boolean> | boolean | void;
  onDeleteQuiz: (quizId: string) => Promise<boolean> | boolean | void;
  students: UserProfile[];
  onUpdateStudent?: (student: UserProfile) => Promise<boolean> | boolean | void;
  onDeleteStudent?: (studentId: string) => Promise<boolean> | boolean | void;
  onAddStudent?: (student: UserProfile) => Promise<boolean> | boolean | void;
  cloudinaryConfig: CloudinaryConfig;
  onSaveCloudinaryConfig: (config: CloudinaryConfig) => Promise<boolean> | boolean | void;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (newConfig: SiteConfig) => Promise<boolean> | boolean | void;
  onSaveAdminEmails?: (adminEmails: string[]) => Promise<boolean>;
  onBackToHome: () => void;
  onOpenStudentPortal: () => void;
  onResetAllData?: () => Promise<boolean> | boolean | void;
  redeemCodes?: RedeemCode[];
  rewards?: PointReward[];
  onCreateRedeemCode?: (code: RedeemCode) => Promise<boolean>;
  onCreateRedeemCodesBatch?: (codes: RedeemCode[]) => Promise<boolean>;
  onToggleRedeemCode?: (codeId: string, active: boolean) => Promise<boolean>;
  onDeleteRedeemCode?: (codeId: string) => Promise<boolean>;
  onSaveReward?: (reward: PointReward) => Promise<boolean>;
  onDeleteReward?: (rewardId: string) => Promise<boolean>;
  notifications?: PlatformNotification[];
  onSaveNotification?: (notif: PlatformNotification) => Promise<boolean>;
  onDeleteNotification?: (id: string) => Promise<boolean>;
  studentsSyncError?: string | null;
  studentsLoading?: boolean;
  adminCloudError?: string | null;
  lastCloudError?: string | null;
  onRetryCloudSync?: () => Promise<void> | void;
  examAlerts?: ExamSecurityAlert[];
  onResolveExamAlert?: (alert: ExamSecurityAlert) => Promise<boolean>;
  onDeleteExamAlert?: (alertId: string) => Promise<boolean>;
}

export type TeacherDashboardTab =
  | 'overview'
  | 'all-students'
  | 'exam-alerts'
  | 'points-codes'
  | 'notifications'
  | 'upload-lecture'
  | 'lectures-list'
  | 'quizzes-bank'
  | 'files'
  | 'academic-years'
  | 'co-admins'
  | 'feature-controls'
  | 'site-customizer'
  | 'cloudinary';

const CLOUDINARY_TOTAL_QUOTA_GB = 25.0;

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  initialTab,
  lectures,
  onAddLecture,
  onDeleteLecture,
  onUpdateLecture,
  attachments,
  onAddAttachment,
  onUpdateAttachment,
  onDeleteAttachment,
  quizzes,
  onAddQuiz,
  onUpdateQuiz,
  onDeleteQuiz,
  students,
  onUpdateStudent,
  onDeleteStudent,
  onAddStudent,
  cloudinaryConfig,
  onSaveCloudinaryConfig,
  siteConfig,
  onSaveSiteConfig,
  onSaveAdminEmails,
  onBackToHome,
  onOpenStudentPortal,
  onResetAllData,
  redeemCodes = [],
  rewards = [],
  onCreateRedeemCode,
  onCreateRedeemCodesBatch,
  onToggleRedeemCode,
  onDeleteRedeemCode,
  onSaveReward,
  onDeleteReward,
  notifications = [],
  onSaveNotification,
  onDeleteNotification,
  studentsSyncError = null,
  studentsLoading = false,
  adminCloudError = null,
  lastCloudError = null,
  onRetryCloudSync,
  examAlerts = [],
  onResolveExamAlert,
  onDeleteExamAlert,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const unresolvedExamAlertsCount = useMemo(
    () => examAlerts.filter((a) => !a.resolved).length,
    [examAlerts]
  );
  const { nonTeacherStudentsCount, pendingApprovalsCount } = useMemo(() => {
    let total = 0;
    let pending = 0;
    for (const s of students) {
      if (s.role !== 'teacher') {
        total++;
        if (s.approvalStatus === 'pending') pending++;
      }
    }
    return { nonTeacherStudentsCount: total, pendingApprovalsCount: pending };
  }, [students]);

  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>(initialTab || 'overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [retryingSync, setRetryingSync] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSentMsg, setVerificationSentMsg] = useState<string | null>(null);

  const prefetchTab = (tab: TeacherDashboardTab) => {
    switch (tab) {
      case 'overview':
        loadOverviewTab().catch(() => {});
        break;
      case 'all-students':
        loadTeacherReportsManager().catch(() => {});
        break;
      case 'exam-alerts':
        loadExamAlertsTab().catch(() => {});
        break;
      case 'points-codes':
        loadPointsCodesTab().catch(() => {});
        break;
      case 'notifications':
        loadNotificationsTab().catch(() => {});
        break;
      case 'upload-lecture':
      case 'lectures-list':
        loadLecturesTab().catch(() => {});
        break;
      case 'quizzes-bank':
        loadTeacherQuizManager().catch(() => {});
        break;
      case 'files':
        loadFilesTab().catch(() => {});
        break;
      case 'academic-years':
        loadAcademicYearsTab().catch(() => {});
        break;
      case 'co-admins':
        loadCoAdminsTab().catch(() => {});
        break;
      case 'feature-controls':
        loadFeatureControlsTab().catch(() => {});
        break;
      case 'site-customizer':
        loadSiteCustomizerTab().catch(() => {});
        break;
      case 'cloudinary':
        loadCloudinaryTab().catch(() => {});
        break;
    }
  };

  const handleTriggerRetrySync = async () => {
    if (!onRetryCloudSync || retryingSync) return;
    setRetryingSync(true);
    try {
      await onRetryCloudSync();
    } finally {
      setRetryingSync(false);
    }
  };

  const handleSendAdminVerification = async () => {
    if (sendingVerification || !auth.currentUser) return;
    setSendingVerification(true);
    setVerificationSentMsg(null);
    try {
      await resendVerificationEmail();
      setVerificationSentMsg(
        isEn
          ? `Verification link sent to ${auth.currentUser.email}. Click it then press Refresh Permissions.`
          : `تم إرسال رابط التفعيل إلى ${auth.currentUser.email}. افتح الرابط ثم اضغط «تحديث وفحص الصلاحيات الآن».`
      );
    } catch {
      setVerificationSentMsg(
        isEn
          ? 'Could not send verification email right now. You can sign in once with Google for instant verification.'
          : 'تعذر إرسال رابط التفعيل الآن (حاول بعد دقيقة أو سجل الدخول بحساب Google للتفعيل الفوري).'
      );
    } finally {
      setSendingVerification(false);
    }
  };

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [siteForm, setSiteForm] = useState<SiteConfig>(siteConfig);
  useEffect(() => {
    setSiteForm(siteConfig);
  }, [siteConfig]);

  const resolvedGrades = useMemo(() => getResolvedGrades(siteForm), [siteForm]);

  // Storage quota calculations (memoized for high-traffic render stability)
  const { totalUsedMB, totalUsedGB, remainingGB, usedPercentage } = useMemo(() => {
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
    const usedGb = Number((total / 1024).toFixed(2));
    const remGb = Number(Math.max(0, CLOUDINARY_TOTAL_QUOTA_GB - usedGb).toFixed(2));
    const pct = Number(Math.min(100, (usedGb / CLOUDINARY_TOTAL_QUOTA_GB) * 100).toFixed(1));
    return {
      totalUsedMB: total,
      totalUsedGB: usedGb,
      remainingGB: remGb,
      usedPercentage: pct,
    };
  }, [attachments, lectures]);

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
                aria-label={isEn ? 'Sidebar Menu' : 'القائمة الجانبية'}
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
                title={isEn ? 'Back to Home' : 'العودة للرئيسية'}
              >
                <ChevronRight className={`w-4 h-4 ${isEn ? 'rotate-180' : ''}`} />
                <span className="hidden sm:inline">{isEn ? 'Home' : 'الرئيسية'}</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold font-kufi">
                    {isEn
                      ? `Educator Admin · Mr. Mohamed Mostafa`
                      : `لوحة تحكم الأستاذ ${siteConfig.teacherName}`}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{isEn ? 'Verified Admin' : 'مسؤول معتمد'}</span>
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
                <span>{isEn ? 'Branding' : 'هوية الموقع'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenStudentPortal}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isEn ? 'Student View' : 'معاينة الطلاب'}</span>
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
                  src={siteForm.profileImageUrl || DEFAULT_TEACHER_PORTRAIT}
                  alt={siteForm.teacherName}
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_TEACHER_PORTRAIT;
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
                {isEn ? 'Overview & Students' : 'الرئيسية والمتابعة'}
              </div>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('overview')}
                onFocus={() => prefetchTab('overview')}
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
                  <span>{isEn ? 'Dashboard Overview' : 'نظرة عامة وسريعة'}</span>
                </div>
                <span className="text-[10px] opacity-75">{isEn ? 'Home' : 'لوحة التحكم'}</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('all-students')}
                onFocus={() => prefetchTab('all-students')}
                onClick={() => {
                  setActiveTab('all-students');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'all-students'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : pendingApprovalsCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>{isEn ? 'Students Directory' : 'سجل وقائمة الطلاب'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pendingApprovalsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold font-mono tabular-nums">
                      {pendingApprovalsCount} {isEn ? 'pending' : 'طلب'}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-slate-900 dark:text-amber-200 text-[10px] font-bold font-mono tabular-nums">
                    {nonTeacherStudentsCount}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('points-codes')}
                onFocus={() => prefetchTab('points-codes')}
                onClick={() => {
                  setActiveTab('points-codes');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'points-codes'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-amber-500" />
                  <span>{isEn ? 'Points & Redeem Codes' : 'أكواد النقاط والمكافآت'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono tabular-nums">
                  {redeemCodes.length}
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('notifications')}
                onFocus={() => prefetchTab('notifications')}
                onClick={() => {
                  setActiveTab('notifications');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-teal-500" />
                  <span>{isEn ? 'Notifications & Alerts' : 'الإشعارات والتنبيهات'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono tabular-nums">
                  {notifications.length}
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('exam-alerts')}
                onFocus={() => prefetchTab('exam-alerts')}
                onClick={() => {
                  setActiveTab('exam-alerts');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'exam-alerts'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : unresolvedExamAlertsCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className={`w-4 h-4 ${activeTab === 'exam-alerts' ? 'text-white' : 'text-rose-500'}`} />
                  <span>{isEn ? 'Exam Anti-Cheat' : 'مراقبة الغش والامتحانات'}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                    unresolvedExamAlertsCount > 0
                      ? activeTab === 'exam-alerts'
                        ? 'bg-white text-rose-600 font-extrabold'
                        : 'bg-rose-600 text-white font-extrabold'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  {unresolvedExamAlertsCount > 0 ? unresolvedExamAlertsCount : examAlerts.length}
                </span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isEn ? 'Academic Content' : 'المحتوى التعليمي'}
              </div>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('upload-lecture')}
                onFocus={() => prefetchTab('upload-lecture')}
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
                  <span>{isEn ? 'Upload New Lecture' : 'رفع محاضرة جديدة'}</span>
                </div>
                <span className="text-[10px] text-teal-400">{isEn ? 'Video' : 'فيديو + كويز'}</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('lectures-list')}
                onFocus={() => prefetchTab('lectures-list')}
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
                  <span>{isEn ? 'Published Lectures' : 'المحاضرات المنشورة'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono tabular-nums">
                  {lectures.length}
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('quizzes-bank')}
                onFocus={() => prefetchTab('quizzes-bank')}
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
                  <span>{isEn ? 'Quizzes & Question Bank' : 'بنك الأسئلة والاختبارات'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono tabular-nums">
                  {quizzes.length}
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('files')}
                onFocus={() => prefetchTab('files')}
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
                  <span>{isEn ? 'Handouts & PDFs' : 'الملازم ومساحة التخزين'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono tabular-nums">
                  {attachments.length}
                </span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isEn ? 'Platform & Brand' : 'إدارة المنصة وهوية الموقع'}
              </div>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('feature-controls')}
                onFocus={() => prefetchTab('feature-controls')}
                onClick={() => {
                  setActiveTab('feature-controls');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'feature-controls'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : siteForm.featureFlags?.maintenanceMode
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal
                    className={`w-4 h-4 ${
                      activeTab === 'feature-controls'
                        ? 'text-white'
                        : siteForm.featureFlags?.maintenanceMode
                        ? 'text-rose-500'
                        : 'text-teal-500'
                    }`}
                  />
                  <span>{isEn ? 'Feature Toggles' : 'تفعيل وإغلاق الوظائف'}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'feature-controls'
                      ? 'bg-white/20 text-white'
                      : siteForm.featureFlags?.maintenanceMode
                      ? 'bg-rose-600 text-white'
                      : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {siteForm.featureFlags?.maintenanceMode
                    ? isEn
                      ? 'Maint.'
                      : 'صيانة'
                    : isEn
                    ? 'Live'
                    : 'تحكم'}
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('academic-years')}
                onFocus={() => prefetchTab('academic-years')}
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
                  <span>{isEn ? 'Academic Grades' : 'تخصيص أسماء السنوات'}</span>
                </div>
                <span className="text-[10px] text-teal-400">{isEn ? 'Grades' : 'الرئيسية'}</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('co-admins')}
                onFocus={() => prefetchTab('co-admins')}
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
                  <span>{isEn ? 'Co-Admins & Staff' : 'المشرفين والمدراء المساعدين'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-mono font-bold tabular-nums">
                  {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length}
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('site-customizer')}
                onFocus={() => prefetchTab('site-customizer')}
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
                  <span>{isEn ? 'Branding & Footer' : 'هوية الموقع والفوتر'}</span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold">{isEn ? 'Edit' : 'تعديل'}</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => prefetchTab('cloudinary')}
                onFocus={() => prefetchTab('cloudinary')}
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
                  <span>{isEn ? 'Cloudinary Settings' : 'إعدادات Cloudinary'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">25 GB</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-teal-600" />
                <span>{isEn ? 'Cloud Media Quota' : 'سعة كلاودنري السحابية'}</span>
              </span>
              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold text-[11px] tabular-nums">
                {remainingGB} GB {isEn ? 'left' : 'متبقية'}
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

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
              <span>
                {totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`}{' '}
                {isEn ? 'used' : 'مستخدمة'}
              </span>
              <span>
                {isEn ? `of ${CLOUDINARY_TOTAL_QUOTA_GB} GB` : `من ${CLOUDINARY_TOTAL_QUOTA_GB} GB`}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {(adminCloudError || studentsSyncError || lastCloudError || (auth.currentUser && !auth.currentUser.emailVerified)) && (
            <div className="w-full rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/50 p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-extrabold font-kufi text-rose-900 dark:text-rose-200">
                      {isEn
                        ? 'Cloud Permissions / Session Sync Alert'
                        : 'تنبيه مزامنة الصلاحيات والحفظ مع السحابة'}
                    </h3>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-sans">
                      {lastCloudError ||
                        adminCloudError ||
                        studentsSyncError ||
                        (isEn
                          ? `Your email (${auth.currentUser?.email}) is not verified yet. Cloud security rules require a verified email before loading students or editing admins.`
                          : `حسابك الحالي (${auth.currentUser?.email}) لم يتم تأكيد بريده الإلكتروني بعد، ولذلك تمنع قواعد الأمان عرض الطلاب أو إضافة مشرفين.`)}
                    </p>
                    {verificationSentMsg && (
                      <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300 pt-0.5">
                        {verificationSentMsg}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onRetryCloudSync && (
                    <button
                      type="button"
                      disabled={retryingSync}
                      onClick={handleTriggerRetrySync}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retryingSync ? 'animate-spin' : ''}`} />
                      <span>
                        {retryingSync
                          ? isEn
                            ? 'Checking...'
                            : 'جاري الفحص...'
                          : isEn
                          ? 'Refresh & Check Permissions'
                          : 'تحديث وفحص الصلاحيات الآن'}
                      </span>
                    </button>
                  )}

                  {auth.currentUser && !auth.currentUser.emailVerified && (
                    <button
                      type="button"
                      disabled={sendingVerification}
                      onClick={handleSendAdminVerification}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <MailCheck className="w-3.5 h-3.5" />
                      <span>
                        {sendingVerification
                          ? isEn
                            ? 'Sending...'
                            : 'جاري الإرسال...'
                          : isEn
                          ? 'Send Verification Email'
                          : 'إرسال رابط تأكيد البريد'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {unresolvedExamAlertsCount > 0 && activeTab !== 'exam-alerts' && (() => {
            const latestAlert = examAlerts.find((a) => !a.resolved) || examAlerts[0];
            if (!latestAlert) return null;
            const latestReason =
              latestAlert.reasons?.[latestAlert.reasons.length - 1] ||
              'محاولة غش أو مغادرة صفحة الاختبار';
            return (
              <div className="w-full rounded-2xl border-2 border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold font-kufi text-rose-900 dark:text-rose-100">
                        {isEn
                          ? `Live Exam Security Alert (${unresolvedExamAlertsCount} unresolved)`
                          : `تنبيه غش / مغادرة فوري (${unresolvedExamAlertsCount} تنبيه غير مراجع)`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold tabular-nums">
                        {latestAlert.violationCount}/{latestAlert.maxViolations}
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                      <strong>{latestAlert.studentName}</strong> — {latestAlert.quizTitle}:{' '}
                      <span>{latestReason}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('exam-alerts')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shrink-0 cursor-pointer shadow-xs"
                >
                  {isEn ? 'Open Anti-Cheat Center' : 'فتح مركز المراقبة فوراً'}
                </button>
              </div>
            );
          })()}

          {/* Inline Reset Confirmation Bar (Zero Popup) */}
          {resetConfirmOpen && (
            <div className="w-full bg-rose-50 dark:bg-rose-950/40 rounded-3xl p-5 sm:p-6 border border-rose-200 dark:border-rose-900 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-kufi text-base text-slate-900 dark:text-white">
                    {isEn ? 'Confirm Clearing All Platform Data' : 'تأكيد تصفير وإفراغ جميع البيانات'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isEn
                      ? 'This will remove all lectures, quizzes, handouts, and students to start clean.'
                      : 'سيتم حذف وتصفير قوائم المحاضرات والامتحانات والملفات لتبدأ المنصة نظيفة تماماً.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 font-mono tabular-nums">
                <div>{isEn ? `Lectures: ${lectures.length}` : `• المحاضرات: ${lectures.length}`}</div>
                <div>{isEn ? `Quizzes: ${quizzes.length}` : `• الامتحانات: ${quizzes.length}`}</div>
                <div>{isEn ? `Handouts: ${attachments.length}` : `• المذكرات: ${attachments.length}`}</div>
                <div>{isEn ? `Students: ${students.length}` : `• الطلاب: ${students.length}`}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
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
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resetting
                    ? isEn
                      ? 'Clearing...'
                      : 'جاري التصفير...'
                    : isEn
                    ? 'Confirm Clear All Data'
                    : 'نعم، صفر كل البيانات الآن'}
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
              </div>
            </div>
          )}

          <Suspense fallback={<TeacherTabSkeleton tab={activeTab} />}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {auth.currentUser && !hasPasswordLinked(auth.currentUser) && (
                <LinkPasswordSetup firebaseUser={auth.currentUser} variant="inline" />
              )}
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
                unresolvedAlertsCount={unresolvedExamAlertsCount}
                pendingApprovalsCount={pendingApprovalsCount}
                onNavigateTab={setActiveTab}
                onOpenResetModal={() => {
                  setResetConfirmOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
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
              onSaveAdminEmails={onSaveAdminEmails}
              adminCloudError={adminCloudError}
              lastCloudError={lastCloudError}
              onRetryCloudSync={onRetryCloudSync}
            />
          )}

          {activeTab === 'all-students' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 font-kufi">
                    {isEn
                      ? 'Student Directory across all active academic grades'
                      : 'سجل وقائمة الطلاب الشاملة لجميع السنوات الدراسية المفعلة'}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                  {nonTeacherStudentsCount}{' '}
                  {isEn ? 'students' : 'طالب مسجل'}
                </span>
              </div>

              <TeacherReportsManager
                students={students}
                lectures={lectures}
                quizzes={quizzes}
                attachments={attachments}
                grades={resolvedGrades}
                onUpdateStudent={onUpdateStudent}
                onDeleteStudent={onDeleteStudent}
                onAddStudent={onAddStudent}
                studentsSyncError={studentsSyncError}
                studentsLoading={studentsLoading}
                onRetryCloudSync={onRetryCloudSync}
              />
            </div>
          )}

          {activeTab === 'exam-alerts' && (
            <ExamAlertsTab
              alerts={examAlerts}
              students={students}
              grades={resolvedGrades}
              onResolveAlert={onResolveExamAlert}
              onDeleteAlert={onDeleteExamAlert}
              onBlockToggleStudent={async (student, blocked, reason) => {
                if (!onUpdateStudent) return false;
                const ok = await onUpdateStudent({
                  ...student,
                  isBlocked: blocked,
                  blockReason: blocked ? reason || 'تم إيقاف الحساب بواسطة الإدارة' : '',
                });
                return ok !== false;
              }}
              onAllowQuizRetake={async (student, quizId, alert) => {
                if (!onUpdateStudent) return false;
                const nextCancelled = (student.cancelledQuizIds || []).filter((id) => id !== quizId);
                const nextPassed = (student.passedQuizIds || []).filter((id) => id !== quizId);
                const nextScores = { ...(student.quizScores || {}) };
                delete nextScores[quizId];
                const nextViolations = { ...(student.quizViolations || {}) };
                delete nextViolations[quizId];
                const vals = Object.values(nextScores);
                const nextAvg =
                  vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                const ok = await onUpdateStudent({
                  ...student,
                  cancelledQuizIds: nextCancelled,
                  passedQuizIds: nextPassed,
                  quizScores: nextScores,
                  quizViolations: nextViolations,
                  score: nextAvg,
                });
                if (ok !== false && alert && onResolveExamAlert) {
                  await onResolveExamAlert({
                    ...alert,
                    resolved: true,
                    resolvedNote: 'تم السماح للطالب بإعادة الامتحان',
                  });
                }
                return ok !== false;
              }}
            />
          )}

          {(activeTab === 'upload-lecture' || activeTab === 'lectures-list') && (
            <LecturesTab
              mode={activeTab === 'upload-lecture' ? 'upload' : 'list'}
              lectures={lectures}
              quizzes={quizzes}
              resolvedGrades={resolvedGrades}
              siteForm={siteForm}
              setSiteForm={setSiteForm}
              onSaveSiteConfig={onSaveSiteConfig}
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
              onUpdateQuiz={onUpdateQuiz}
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
              onUpdateAttachment={onUpdateAttachment}
              onDeleteAttachment={onDeleteAttachment}
            />
          )}

          {activeTab === 'cloudinary' && (
            <CloudinaryTab
              cloudinaryConfig={cloudinaryConfig}
              onSaveCloudinaryConfig={onSaveCloudinaryConfig}
            />
          )}

          {activeTab === 'points-codes' && (
            <PointsCodesTab
              redeemCodes={redeemCodes}
              rewards={rewards}
              lectures={lectures}
              attachments={attachments}
              resolvedGrades={resolvedGrades}
              onCreateRedeemCode={async (c) => (onCreateRedeemCode ? await onCreateRedeemCode(c) : false)}
              onCreateRedeemCodesBatch={async (list) =>
                onCreateRedeemCodesBatch ? await onCreateRedeemCodesBatch(list) : false
              }
              onToggleRedeemCode={async (id, active) =>
                onToggleRedeemCode ? await onToggleRedeemCode(id, active) : false
              }
              onDeleteRedeemCode={async (id) =>
                onDeleteRedeemCode ? await onDeleteRedeemCode(id) : false
              }
              onSaveReward={async (r) => (onSaveReward ? await onSaveReward(r) : false)}
              onDeleteReward={async (id) => (onDeleteReward ? await onDeleteReward(id) : false)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications}
              resolvedGrades={resolvedGrades}
              authorName={siteForm.teacherName ? `أ/ ${siteForm.teacherName}` : 'أ/ محمد مصطفى'}
              onSaveNotification={async (n) => (onSaveNotification ? await onSaveNotification(n) : false)}
              onDeleteNotification={async (id) => (onDeleteNotification ? await onDeleteNotification(id) : false)}
            />
          )}

          {activeTab === 'feature-controls' && (
            <FeatureControlsTab
              siteConfig={siteConfig}
              siteForm={siteForm}
              setSiteForm={setSiteForm}
              onSaveSiteConfig={onSaveSiteConfig}
              pendingApprovalsCount={pendingApprovalsCount}
              onNavigateToStudents={() => setActiveTab('all-students')}
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
          </Suspense>
        </main>
      </div>
    </div>
  );
};
