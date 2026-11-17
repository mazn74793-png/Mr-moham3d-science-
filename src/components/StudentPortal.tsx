import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Award,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Video,
  Check,
  Lock,
  AlertTriangle,
  LayoutDashboard,
  Eye,
  Ticket,
  Sparkles,
  Unlock,
  Loader2,
  Bookmark,
  Search,
  Clock3,
  User,
  X,
  ExternalLink,
  PlayCircle,
  Bell,
  Layers,
  ShieldAlert,
  MessageCircle,
} from 'lucide-react';
import {
  Lecture,
  Quiz,
  AttachmentFile,
  GradeLevel,
  UserProfile,
  PointReward,
  CloudinaryConfig,
  PlatformNotification,
  ExamSecurityAlert,
} from '../types';
import { SiteConfig, getResolvedGrades, getGradeDisplayName } from '../types/siteConfig';
import { SecureVideoPlayer } from './SecureVideoPlayer';
import { useLanguage } from '../context/LanguageContext';
import { detectMediaKind } from './MediaPreview';
import { QuizRunner } from './student/QuizRunner';
import { HandoutsTab } from './student/HandoutsTab';
import { PointsWalletTab } from './student/PointsWalletTab';
import { StudentNotificationsTab } from './student/NotificationsTab';
import {
  StudentProfileModal,
  StudentCustomProfile,
  loadStudentCustomProfile,
  renderStudentAvatarIcon,
  STUDENT_CARD_THEMES,
} from './student/StudentProfileModal';
import { prefetchVideoStream } from '../utils/mediaOptimizer';
import {
  resolveUnitsForGrade,
  getLecturesInUnit,
  getUnitForLecture,
  isLectureUnlockedForStudent,
  getLecturePrerequisiteDetails,
} from '../utils/units';
import { buildWhatsAppSupportUrl } from '../utils/whatsapp';

interface StudentPortalProps {
  currentUser: UserProfile | null;
  lectures: Lecture[];
  quizzes: Quiz[];
  attachments: AttachmentFile[];
  rewards?: PointReward[];
  notifications?: PlatformNotification[];
  siteConfig?: SiteConfig;
  cloudinaryConfig?: CloudinaryConfig;
  onBackToHome: () => void;
  onOpenTeacherDashboard: () => void;
  onUpdateStudentProfile?: (updatedUser: UserProfile, successMessage?: string) => void;
  onRedeemCode?: (code: string) => Promise<{ pointsAdded: number; newBalance: number; code: string }>;
  onUnlockLecture?: (lecture: Lecture) => Promise<void>;
  onUnlockAttachment?: (file: AttachmentFile) => Promise<void>;
  onClaimReward?: (reward: PointReward) => Promise<void>;
  onReportExamAlert?: (alert: ExamSecurityAlert) => Promise<void> | void;
  onCheatCancelQuiz?: (quiz: Quiz, violationCount: number, reasons: string[]) => void;
  onExamFocusModeChange?: (inExam: boolean) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  lectures,
  quizzes,
  attachments,
  rewards = [],
  notifications = [],
  siteConfig,
  cloudinaryConfig,
  onBackToHome,
  onOpenTeacherDashboard,
  onUpdateStudentProfile,
  onRedeemCode,
  onUnlockLecture,
  onUnlockAttachment,
  onClaimReward,
  onReportExamAlert,
  onCheatCancelQuiz,
  onExamFocusModeChange,
}) => {
  const { lang, isRtl } = useLanguage();
  const resolvedGrades = getResolvedGrades(siteConfig);
  const adminEmailList = (siteConfig?.adminEmails || ['mizoo2y2@gmail.com']).map((e) =>
    e.toLowerCase().trim()
  );
  const currentUserEmail = currentUser?.email?.toLowerCase().trim() || '';
  const isTeacher =
    currentUser?.role === 'teacher' &&
    (currentUserEmail === 'mizoo2y2@gmail.com' ||
      (currentUserEmail !== '' && adminEmailList.includes(currentUserEmail)));

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentUser?.grade || resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third'
  );

  useEffect(() => {
    if (!isTeacher && currentUser?.grade) {
      setSelectedGrade(currentUser.grade);
    }
  }, [currentUser?.grade, isTeacher]);

  const [activeTab, setActiveTab] = useState<
    'lectures' | 'quizzes' | 'files' | 'points' | 'notifications' | 'profile'
  >('lectures');
  const lastTabBeforeProfileRef = React.useRef<
    'lectures' | 'quizzes' | 'files' | 'points' | 'notifications'
  >('lectures');

  const openProfilePage = () => {
    if (activeTab !== 'profile') {
      lastTabBeforeProfileRef.current = activeTab;
    }
    setActiveQuiz(null);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [inlineCodeInput, setInlineCodeInput] = useState('');
  const [inlineBusy, setInlineBusy] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [lectureSearch, setLectureSearch] = useState('');
  const [lectureFilter, setLectureFilter] = useState<'all' | 'available' | 'completed' | 'bookmarked'>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');

  useEffect(() => {
    setSelectedUnitFilter('all');
  }, [selectedGrade]);

  const studentStorageKey = currentUser?.id || 'guest';
  const [customProfile, setCustomProfile] = useState<StudentCustomProfile>(() =>
    loadStudentCustomProfile(currentUser?.id)
  );

  useEffect(() => {
    setCustomProfile(loadStudentCustomProfile(currentUser?.id));
  }, [currentUser?.id]);
  const [bookmarkedLectureIds, setBookmarkedLectureIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`mm_study_${studentStorageKey}_bookmarks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mm_study_${studentStorageKey}_bookmarks`);
      setBookmarkedLectureIds(saved ? JSON.parse(saved) : []);
    } catch {
      setBookmarkedLectureIds([]);
    }
  }, [studentStorageKey]);

  const toggleLectureBookmark = (lecId: string) => {
    setBookmarkedLectureIds((prev) => {
      const next = prev.includes(lecId) ? prev.filter((id) => id !== lecId) : [...prev, lecId];
      try {
        localStorage.setItem(`mm_study_${studentStorageKey}_bookmarks`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const videoTimeGetterRef = React.useRef<() => number>(() => 0);

  const filteredLectures = React.useMemo(
    () =>
      lectures
        .filter((l) => l.grade === selectedGrade)
        .sort((a, b) => (a.sessionOrder || 1) - (b.sessionOrder || 1)),
    [lectures, selectedGrade]
  );

  const selectedGradeItem = React.useMemo(
    () => resolvedGrades.find((g) => g.id === selectedGrade),
    [resolvedGrades, selectedGrade]
  );

  const gradeUnits = React.useMemo(
    () => resolveUnitsForGrade(selectedGradeItem, filteredLectures),
    [selectedGradeItem, filteredLectures]
  );

  const orderedGradeLectures = React.useMemo(() => {
    if (gradeUnits.length === 0) return filteredLectures;
    const seen = new Set<string>();
    const out: Lecture[] = [];
    for (const u of gradeUnits) {
      for (const l of getLecturesInUnit(filteredLectures, u)) {
        if (!seen.has(l.id)) {
          seen.add(l.id);
          out.push(l);
        }
      }
    }
    for (const l of filteredLectures) {
      if (!seen.has(l.id)) out.push(l);
    }
    return out;
  }, [gradeUnits, filteredLectures]);

  const filteredQuizzes = quizzes.filter((q) => q.grade === selectedGrade);
  const filteredAttachments = attachments.filter((a) => a.grade === selectedGrade);

  const visibleNotifications = notifications
    .filter((n) => n.active && (n.grade === 'all' || n.grade === selectedGrade))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.dateAdded || '').localeCompare(a.dateAdded || '');
    });

  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`mm_read_notifs_${studentStorageKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mm_read_notifs_${studentStorageKey}`);
      setReadNotificationIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadNotificationIds([]);
    }
  }, [studentStorageKey]);

  const markNotificationRead = (notifId: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(notifId)) return prev;
      const next = [...prev, notifId];
      try {
        localStorage.setItem(`mm_read_notifs_${studentStorageKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    const allIds = visibleNotifications.map((n) => n.id);
    const merged = Array.from(new Set([...readNotificationIds, ...allIds]));
    setReadNotificationIds(merged);
    try {
      localStorage.setItem(`mm_read_notifs_${studentStorageKey}`, JSON.stringify(merged));
    } catch {}
  };

  const unreadNotifCount = visibleNotifications.filter(
    (n) => !readNotificationIds.includes(n.id)
  ).length;

  const [activeLecture, setActiveLecture] = useState<Lecture | null>(
    orderedGradeLectures[0] || filteredLectures[0] || lectures[0] || null
  );
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [lecturePdfPreviewOpen, setLecturePdfPreviewOpen] = useState(false);

  useEffect(() => {
    onExamFocusModeChange?.(Boolean(activeQuiz));
    return () => {
      onExamFocusModeChange?.(false);
    };
  }, [activeQuiz, onExamFocusModeChange]);

  useEffect(() => {
    if (orderedGradeLectures.length > 0 && (!activeLecture || activeLecture.grade !== selectedGrade)) {
      setActiveLecture(orderedGradeLectures[0]);
    } else if (orderedGradeLectures.length === 0) {
      setActiveLecture(null);
    }
  }, [selectedGrade, orderedGradeLectures, activeLecture]);

  // Pre-warm active and upcoming unlocked lecture streams for fast instant start
  useEffect(() => {
    if (!activeLecture?.videoUrl) return;
    prefetchVideoStream(activeLecture.videoUrl);
    const curIdx = orderedGradeLectures.findIndex((l) => l.id === activeLecture.id);
    if (curIdx >= 0 && curIdx + 1 < orderedGradeLectures.length) {
      const nextLec = orderedGradeLectures[curIdx + 1];
      if (nextLec?.videoUrl) prefetchVideoStream(nextLec.videoUrl);
    }
  }, [activeLecture?.id, activeLecture?.videoUrl, orderedGradeLectures]);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizCelebration, setShowQuizCelebration] = useState<string | null>(null);

  // Reset inline PDF preview when switching lectures
  useEffect(() => {
    setLecturePdfPreviewOpen(false);
  }, [activeLecture?.id]);

  // Per-lecture persistent quick notes
  const [studentNotes, setStudentNotes] = useState<string>('');
  useEffect(() => {
    if (!activeLecture?.id) return;
    const saved = localStorage.getItem(`mm_note_${studentStorageKey}_${activeLecture.id}`)
      ?? localStorage.getItem(`mm_note_${activeLecture.id}`);
    setStudentNotes(
      saved ??
        (lang === 'en'
          ? 'Note: Remember Chromium & Copper have anomalous electron configurations for 3d orbital stability.'
          : 'ملاحظة: تذكر أن عنصر الكروم والنحاس شواذ في التوزيع الإلكتروني لاستقرار المستوى الفرعي 3d.')
    );
  }, [activeLecture?.id, studentStorageKey, lang]);

  const handleNotesChange = (val: string) => {
    setStudentNotes(val);
    if (activeLecture?.id) {
      localStorage.setItem(`mm_note_${studentStorageKey}_${activeLecture.id}`, val);
    }
  };

  const handleInsertVideoTimestamp = () => {
    const secs = Math.floor(videoTimeGetterRef.current?.() || 0);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    const prefix = studentNotes.trim() ? `${studentNotes.trimEnd()}\n` : '';
    handleNotesChange(`${prefix}[${mm}:${ss}] `);
  };

  // Unit-Aware Sequential & Points-Gated Unlocking Logic
  const isLectureUnlocked = (lec: Lecture): boolean =>
    isLectureUnlockedForStudent(lec, filteredLectures, gradeUnits, currentUser, isTeacher);

  const getPrerequisiteDetails = (lec: Lecture) =>
    getLecturePrerequisiteDetails(lec, filteredLectures, gradeUnits, quizzes, currentUser);

  const activeLectureUnit = React.useMemo(
    () => (activeLecture ? getUnitForLecture(activeLecture, gradeUnits) : undefined),
    [activeLecture, gradeUnits]
  );

  const handleMarkWatched = (lecId: string) => {
    if (!currentUser) return;
    const currentWatched = currentUser.watchedLectureIds || [];
    if (!currentWatched.includes(lecId)) {
      const updatedWatched = [...currentWatched, lecId];
      onUpdateStudentProfile?.({
        ...currentUser,
        watchedLectureIds: updatedWatched,
      });
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setShowQuizCelebration(null);
    setActiveTab('quizzes');
  };

  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let score = 0;
    activeQuiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    setQuizSubmitted(true);

    const score = calculateScore();
    const total = activeQuiz.questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passThreshold = activeQuiz.passingScore ?? 60;

    if (currentUser) {
      const currentScores = { ...(currentUser.quizScores || {}), [activeQuiz.id]: percentage };
      const currentPassed = [...(currentUser.passedQuizIds || [])];

      if (percentage >= passThreshold && !currentPassed.includes(activeQuiz.id)) {
        currentPassed.push(activeQuiz.id);
        setShowQuizCelebration(
          lang === 'en'
            ? `Well done! You scored ${percentage}% and unlocked the next session.`
            : `أحسنت! حققت ${percentage}% وتم فتح الحصة التالية بنجاح.`
        );
      }

      const scoreValues = Object.values(currentScores);
      const avgScore =
        scoreValues.length > 0
          ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
          : percentage;

      onUpdateStudentProfile?.({
        ...currentUser,
        quizScores: currentScores,
        passedQuizIds: currentPassed,
        score: avgScore,
      });
    }
  };

  const handleCheatCancelQuiz = (quiz: Quiz, violationCount: number, reasons: string[]) => {
    if (onCheatCancelQuiz) {
      onCheatCancelQuiz(quiz, violationCount, reasons);
      return;
    }
    if (!currentUser) return;
    const nextCancelled = Array.from(new Set([...(currentUser.cancelledQuizIds || []), quiz.id]));
    const nextPassed = (currentUser.passedQuizIds || []).filter((id) => id !== quiz.id);
    const nextScores = { ...(currentUser.quizScores || {}), [quiz.id]: 0 };
    const scoreValues = Object.values(nextScores);
    const avgScore =
      scoreValues.length > 0
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : 0;
    const nextViolations = {
      ...(currentUser.quizViolations || {}),
      [quiz.id]: {
        count: violationCount,
        reasons,
        lastAt: new Date().toISOString(),
      },
    };
    onUpdateStudentProfile?.({
      ...currentUser,
      cancelledQuizIds: nextCancelled,
      passedQuizIds: nextPassed,
      quizScores: nextScores,
      score: avgScore,
      quizViolations: nextViolations,
    });
  };

  const studentCumulativeScore = currentUser?.score ?? 0;

  const getGradeTitle = (g: GradeLevel) => {
    return getGradeDisplayName(g, siteConfig, lang === 'en' ? 'en' : 'ar');
  };

  const completedLecturesCount = filteredLectures.filter((l) =>
    currentUser?.watchedLectureIds?.includes(l.id)
  ).length;
  const totalLecturesCount = filteredLectures.length;
  const progressPercentage =
    totalLecturesCount > 0 ? Math.round((completedLecturesCount / totalLecturesCount) * 100) : 0;
  const passedQuizzesCount = filteredQuizzes.filter((q) => {
    if (currentUser?.cancelledQuizIds?.includes(q.id)) return false;
    const passThreshold = q.passingScore ?? 60;
    return (
      currentUser?.passedQuizIds?.includes(q.id) ||
      (currentUser?.quizScores?.[q.id] ?? 0) >= passThreshold
    );
  }).length;

  const nextTargetLecture =
    filteredLectures.find((l) => !currentUser?.watchedLectureIds?.includes(l.id)) ||
    filteredLectures[0] ||
    null;

  const nextTargetQuiz =
    (nextTargetLecture?.quizId
      ? quizzes.find((q) => q.id === nextTargetLecture.quizId)
      : null) ||
    filteredQuizzes.find((q) => !currentUser?.passedQuizIds?.includes(q.id)) ||
    filteredQuizzes[0] ||
    null;

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-cairo">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isRtl ? 'تسجيل الدخول مطلوب' : 'Authentication Required'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm leading-relaxed">
          {isRtl
            ? 'من فضلك قم بتسجيل الدخول أولاً بحسابك للوصول إلى منصة الطالب والمحاضرات والاختبارات.'
            : 'Please log in with your student account first to access lectures, quizzes, and files.'}
        </p>
        <button
          type="button"
          onClick={onBackToHome}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
        >
          {isRtl ? 'العودة للصفحة الرئيسية وتسجيل الدخول' : 'Return Home & Log In'}
        </button>
      </div>
    );
  }

  if (currentUser.isBlocked && !isTeacher) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center font-cairo">
        <div className="max-w-lg w-full p-7 sm:p-9 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800 shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRtl ? 'تم تقييد حسابك من قِبل الإدارة' : 'Your Account Has Been Restricted'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {isRtl
              ? 'تم إيقاف وصول هذا الحساب مؤقتاً إلى المحاضرات والامتحانات. يرجى التواصل مع المعلم أو الدعم الفني لمراجعة الحالة.'
              : 'Access to lectures and exams has been temporarily suspended for this account. Please contact your teacher or support.'}
          </p>
          {currentUser.blockReason && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-200">
              {isRtl ? `السبب المسجل: ${currentUser.blockReason}` : `Reason: ${currentUser.blockReason}`}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <a
              href={buildWhatsAppSupportUrl(
                siteConfig,
                isRtl
                  ? `السلام عليكم فريق الدعم، تم تقييد حسابي (${currentUser.name} - ${currentUser.phone || currentUser.email}) وأرجو مراجعة الحالة.`
                  : `Hello Support Team, my account (${currentUser.name} - ${currentUser.phone || currentUser.email}) is restricted. Please review.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{isRtl ? 'التواصل مع فريق الدعم (واتساب)' : 'WhatsApp Support Team'}</span>
            </a>
            <button
              type="button"
              onClick={onBackToHome}
              className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {isRtl ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden font-cairo ${
        activeQuiz ? 'pb-8' : 'pb-24 lg:pb-12'
      }`}
    >
      {/* Compact Non-Sticky Student Sub-Header (hidden in distraction-free exam mode) */}
      {!activeQuiz && (
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={onBackToHome}
                aria-label={lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 text-xs font-bold shrink-0 cursor-pointer"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span className="hidden sm:inline">{lang === 'en' ? 'Home' : 'الرئيسية'}</span>
              </button>

              {/* Clickable Student Identity Avatar & Title */}
              <button
                type="button"
                onClick={openProfilePage}
                title={lang === 'en' ? 'Open Profile' : 'فتح الملف الشخصي'}
                className="flex items-center gap-2.5 min-w-0 text-start group cursor-pointer"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                      (STUDENT_CARD_THEMES[customProfile.cardTheme] || STUDENT_CARD_THEMES.teal).cardBg
                    }`}
                  >
                    {renderStudentAvatarIcon(customProfile.avatarIcon, 'w-5 h-5')}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {lang === 'en'
                        ? `Welcome, ${currentUser.name.split(' ')[0]}`
                        : `مرحباً، ${currentUser.name.split(' ')[0]}`}
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">
                      {getGradeTitle(selectedGrade)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {lang === 'en'
                        ? `Progress ${progressPercentage}%`
                        : `التقدم ${progressPercentage}%`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {lang === 'en'
                        ? `Score ${studentCumulativeScore}%`
                        : `المعدل ${studentCumulativeScore}%`}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('notifications');
                  setActiveQuiz(null);
                }}
                aria-label={lang === 'en' ? 'Notifications' : 'الإشعارات والتنبيهات'}
                className={`relative min-h-[40px] min-w-[40px] px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                {unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold tabular-nums leading-none">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={openProfilePage}
                aria-label={lang === 'en' ? 'My Profile' : 'ملفي الشخصي'}
                className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border-slate-200 dark:border-slate-700 hover:border-teal-300 text-slate-800 dark:text-slate-200'
                }`}
              >
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                <span className="sm:hidden">{lang === 'en' ? 'Profile' : 'ملفي'}</span>
                <span className="hidden sm:inline">
                  {lang === 'en' ? 'Profile' : 'ملفي الشخصي'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('points');
                  setActiveQuiz(null);
                }}
                className="min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums"
              >
                <Ticket className="w-4 h-4 text-amber-500" />
                <span className="font-mono font-extrabold">{currentUser?.points ?? 0}</span>
                <span className="hidden sm:inline">{lang === 'en' ? 'Pts' : 'نقطة'}</span>
              </button>

              <a
                href={buildWhatsAppSupportUrl(
                  siteConfig,
                  lang === 'en'
                    ? `Hello Support Team, I am student ${currentUser.name} (${getGradeTitle(selectedGrade)}) and need support.`
                    : `السلام عليكم فريق الدعم، أنا الطالب ${currentUser.name} (${getGradeTitle(selectedGrade)}) وأحتاج مساعدة.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                title={lang === 'en' ? 'WhatsApp Support Team' : 'تواصل مع فريق الدعم على واتساب'}
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">
                  {lang === 'en' ? 'Support' : 'فريق الدعم'}
                </span>
              </a>

              {isTeacher && (
                <button
                  type="button"
                  onClick={onOpenTeacherDashboard}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {lang === 'en' ? 'Admin' : 'لوحة المعلم'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Slim Curriculum Progress Bar */}
          <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
      )}

      {/* Main Content Container */}
      <div
        className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 ${
          activeQuiz ? 'pt-3 sm:pt-5' : 'pt-4 sm:pt-6'
        }`}
      >

        {/* Desktop Segmented Navigation & Teacher Grade Switcher (hidden in distraction-free exam mode) */}
        {!activeQuiz && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Desktop Module Tabs */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('lectures');
                setActiveQuiz(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'lectures' && !activeQuiz
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? `Lectures (${filteredLectures.length})`
                  : `المحاضرات (${filteredLectures.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'quizzes' || activeQuiz
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? `Quizzes (${filteredQuizzes.length})`
                  : `الامتحانات (${filteredQuizzes.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('files');
                setActiveQuiz(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? `Handouts (${filteredAttachments.length})`
                  : `المذكرات (${filteredAttachments.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('points');
                setActiveQuiz(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'points'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4 text-amber-500" />
              <span>{lang === 'en' ? 'Points & Codes' : 'النقاط والأكواد'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('notifications');
                setActiveQuiz(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{lang === 'en' ? 'Notifications' : 'الإشعارات'}</span>
              {unreadNotifCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono tabular-nums leading-none">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile / Tablet Quick Scrollable Strip */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'lectures' as const, label: lang === 'en' ? 'Lectures' : `المحاضرات (${filteredLectures.length})`, icon: Video },
              { id: 'quizzes' as const, label: lang === 'en' ? 'Quizzes' : `الامتحانات (${filteredQuizzes.length})`, icon: Award },
              { id: 'files' as const, label: lang === 'en' ? 'Handouts' : `الملازم (${filteredAttachments.length})`, icon: FileText },
              { id: 'points' as const, label: lang === 'en' ? 'Points' : 'النقاط والأكواد', icon: Ticket },
              { id: 'notifications' as const, label: lang === 'en' ? `Notices (${visibleNotifications.length})` : `الإشعارات (${visibleNotifications.length})`, icon: Bell },
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected =
                item.id === 'quizzes' ? activeTab === 'quizzes' || Boolean(activeQuiz) : activeTab === item.id && !activeQuiz;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'quizzes') setActiveQuiz(null);
                  }}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Teacher Grade Preview Switcher */}
          {isTeacher && (
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
              {resolvedGrades.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedGrade === g.id
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'en' ? g.badgeEn || g.badgeAr : g.badgeAr}
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Compact 4-Metric Quick Strip (hidden on active quiz or full-page profile view) */}
          {!activeQuiz && activeTab !== 'profile' && (
            <div className="order-2 lg:order-1 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
              <button
                type="button"
                onClick={() => {
                  if (nextTargetLecture) {
                    setActiveLecture(nextTargetLecture);
                    setActiveTab('lectures');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover-card-lift text-start flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{lang === 'en' ? 'Watched' : 'الحصص المشاهدة'}</span>
                  <Video className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {completedLecturesCount} / {totalLecturesCount}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (nextTargetQuiz) {
                    handleStartQuiz(nextTargetQuiz);
                  } else {
                    setActiveTab('quizzes');
                  }
                }}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover-card-lift text-start flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{lang === 'en' ? 'Quizzes Passed' : 'الاختبارات المجتازة'}</span>
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {passedQuizzesCount} / {filteredQuizzes.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover-card-lift text-start flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{lang === 'en' ? 'PDF Handouts' : 'المذكرات المتاحة'}</span>
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {filteredAttachments.length} {lang === 'en' ? 'Files' : 'ملفات'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('points');
                  setActiveQuiz(null);
                }}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover-card-lift text-start flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{lang === 'en' ? 'Points Wallet' : 'رصيد النقاط والأكواد'}</span>
                  <Ticket className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {currentUser?.points ?? 0} {lang === 'en' ? 'Pts' : 'نقطة'}
                </div>
              </button>
            </div>
          )}

          {/* PRIMARY WORKSPACE */}
          <div className="order-1 lg:order-2">
            {/* 1. LECTURES TAB */}
            {activeTab === 'lectures' && !activeQuiz && (
              <div className="space-y-5">
                {/* Interactive Unit & Course Track Explorer */}
                {gradeUnits.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>
                          {lang === 'en' ? 'Units & Course Tracks' : 'الوحدات والمسارات التعليمية'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {gradeUnits.length} {lang === 'en' ? 'units' : 'وحدات'}
                      </span>
                    </div>

                    <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedUnitFilter('all')}
                        className={`min-w-[130px] px-3.5 py-2.5 rounded-xl border text-start transition-colors cursor-pointer shrink-0 flex flex-col justify-between gap-1 ${
                          selectedUnitFilter === 'all'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {lang === 'en' ? 'All Units' : 'كل الوحدات'}
                        </div>
                        <div
                          className={`text-[11px] font-mono tabular-nums ${
                            selectedUnitFilter === 'all' ? 'text-teal-100' : 'text-slate-500'
                          }`}
                        >
                          {completedLecturesCount}/{totalLecturesCount}{' '}
                          {lang === 'en' ? 'done' : 'مكتملة'}
                        </div>
                      </button>

                      {gradeUnits.map((u) => {
                        const unitLecs = getLecturesInUnit(filteredLectures, u);
                        if (unitLecs.length === 0 && !isTeacher) return null;
                        const completedInUnit = unitLecs.filter((l) =>
                          currentUser?.watchedLectureIds?.includes(l.id)
                        ).length;
                        const pct =
                          unitLecs.length > 0
                            ? Math.round((completedInUnit / unitLecs.length) * 100)
                            : 0;
                        const active = selectedUnitFilter === u.id;

                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUnitFilter(u.id);
                              if (
                                unitLecs.length > 0 &&
                                (!activeLecture || getUnitForLecture(activeLecture, gradeUnits)?.id !== u.id)
                              ) {
                                const firstAvailable =
                                  unitLecs.find((l) => isLectureUnlocked(l)) || unitLecs[0];
                                setActiveLecture(firstAvailable);
                              }
                            }}
                            className={`min-w-[185px] max-w-[240px] px-3.5 py-2.5 rounded-xl border text-start transition-colors cursor-pointer shrink-0 flex flex-col justify-between gap-1.5 ${
                              active
                                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-900 dark:text-teal-100'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="text-xs font-bold truncate">{u.titleAr}</div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                <span>
                                  {completedInUnit}/{unitLecs.length}{' '}
                                  {lang === 'en' ? 'sessions' : 'حصص'}
                                </span>
                                {u.isIndependent !== false && (
                                  <span className="text-teal-600 dark:text-teal-400 font-sans font-semibold">
                                    {lang === 'en' ? 'Direct' : 'مستقلة'}
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div id="videoPlayerSection" className="lg:col-span-8 space-y-5">
                    {activeLecture ? (
                      isLectureUnlocked(activeLecture) ? (
                        <div className="space-y-4">
                          <SecureVideoPlayer
                            lecture={activeLecture}
                            currentUser={currentUser}
                            isWatched={Boolean(
                              currentUser?.watchedLectureIds?.includes(activeLecture.id)
                            )}
                            onMarkWatched={handleMarkWatched}
                            onRegisterTimeGetter={(fn) => {
                              videoTimeGetterRef.current = fn;
                            }}
                            onTakeQuiz={(quizId) => {
                              const targetQuiz =
                                quizzes.find((q) => q.id === quizId) || filteredQuizzes[0];
                              if (targetQuiz) handleStartQuiz(targetQuiz);
                            }}
                          />

                          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  <span className="font-semibold text-teal-700 dark:text-teal-400">
                                    {activeLectureUnit?.titleAr || activeLecture.chapter}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono">
                                    {lang === 'en'
                                      ? `Session ${activeLecture.sessionOrder || 1}`
                                      : `حصة ${activeLecture.sessionOrder || 1}`}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {activeLecture.duration}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {activeLecture.viewsCount}{' '}
                                    {lang === 'en' ? 'views' : 'مشاهدة'}
                                  </span>
                                </div>

                              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                                {activeLecture.title}
                              </h2>

                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {activeLecture.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleLectureBookmark(activeLecture.id)}
                              aria-label={lang === 'en' ? 'Bookmark Lecture' : 'حفظ الحصة في المفضلة'}
                              title={
                                bookmarkedLectureIds.includes(activeLecture.id)
                                  ? lang === 'en'
                                    ? 'Remove bookmark'
                                    : 'إزالة من المحفوظات'
                                  : lang === 'en'
                                  ? 'Save for review'
                                  : 'حفظ الحصة للمراجعة'
                              }
                              className={`min-w-[44px] min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                                bookmarkedLectureIds.includes(activeLecture.id)
                                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400'
                              }`}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${
                                  bookmarkedLectureIds.includes(activeLecture.id)
                                    ? 'fill-current'
                                    : ''
                                }`}
                              />
                              <span className="hidden sm:inline">
                                {bookmarkedLectureIds.includes(activeLecture.id)
                                  ? lang === 'en'
                                    ? 'Saved'
                                    : 'محفوظة'
                                  : lang === 'en'
                                  ? 'Save'
                                  : 'حفظ'}
                              </span>
                            </button>
                          </div>

                          {/* Attached PDF Handout Row */}
                          {activeLecture.pdfTitle && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {activeLecture.pdfTitle}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {lang === 'en'
                                        ? 'Session study notes & practice worksheet'
                                        : 'مذكرة الشرح والتدريبات لهذه الحصة'}
                                    </div>
                                  </div>
                                </div>

                                {activeLecture.pdfUrl && activeLecture.pdfUrl !== '#' ? (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setLecturePdfPreviewOpen((p) => !p)}
                                      className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      {lecturePdfPreviewOpen ? (
                                        <X className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                      <span>
                                        {lecturePdfPreviewOpen
                                          ? lang === 'en'
                                            ? 'Close Preview'
                                            : 'إغلاق المعاينة'
                                          : lang === 'en'
                                          ? 'Preview'
                                          : 'معاينة'}
                                      </span>
                                    </button>
                                    <a
                                      href={activeLecture.pdfUrl}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>{lang === 'en' ? 'Download PDF' : 'تحميل المذكرة PDF'}</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 shrink-0 cursor-not-allowed">
                                    <Download className="w-4 h-4" />
                                    <span>{lang === 'en' ? 'Unavailable' : 'غير متاح حالياً'}</span>
                                  </span>
                                )}
                              </div>

                              {/* Inline Collapsible Lecture PDF Reader (Zero Popup Modals) */}
                              {lecturePdfPreviewOpen &&
                                activeLecture.pdfUrl &&
                                activeLecture.pdfUrl !== '#' && (() => {
                                  const inlineKind = detectMediaKind(activeLecture.pdfUrl, 'pdf');
                                  return (
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 space-y-2.5 animate-fade-in">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                          {activeLecture.pdfTitle ||
                                            (lang === 'en' ? 'Lecture Handout' : 'مذكرة الحصة')}
                                        </span>
                                        <a
                                          href={activeLecture.pdfUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          <span>{lang === 'en' ? 'Open Tab' : 'فتح في تبويب'}</span>
                                        </a>
                                      </div>

                                      {inlineKind === 'image' ? (
                                        <img
                                          src={activeLecture.pdfUrl}
                                          alt={activeLecture.pdfTitle || 'Handout'}
                                          className="w-full max-h-[560px] object-contain rounded-xl mx-auto"
                                        />
                                      ) : (
                                        <iframe
                                          src={activeLecture.pdfUrl}
                                          title={activeLecture.pdfTitle || 'Lecture PDF'}
                                          className="w-full h-[520px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                                        />
                                      )}
                                    </div>
                                  );
                                })()}
                            </div>
                          )}

                          {/* Quick Notes Section with Video Timestamp Inserter */}
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                <span>
                                  {lang === 'en'
                                    ? 'Quick Lecture Notes (auto-saved):'
                                    : 'ملاحظاتك السريعة على الحصة (تُحفظ تلقائياً):'}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={handleInsertVideoTimestamp}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/70 text-teal-700 dark:text-teal-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Clock3 className="w-3.5 h-3.5" />
                                <span>
                                  {lang === 'en' ? '+ Add Video Timestamp' : '+ إضافة توقيت الفيديو'}
                                </span>
                              </button>
                            </div>
                            <textarea
                              value={studentNotes}
                              onChange={(e) => handleNotesChange(e.target.value)}
                              rows={2}
                              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder={
                                lang === 'en'
                                  ? 'Write a reaction equation or study note to revisit...'
                                  : 'اكتب معادلة أو ملاحظة هامة تريد الرجوع لها...'
                              }
                            />
                          </div>

                          {/* Previous / Next Lecture Navigation */}
                          {(() => {
                            const activeNavList =
                              selectedUnitFilter !== 'all'
                                ? (() => {
                                    const u = gradeUnits.find((gu) => gu.id === selectedUnitFilter);
                                    return u ? getLecturesInUnit(filteredLectures, u) : orderedGradeLectures;
                                  })()
                                : orderedGradeLectures;
                            if (activeNavList.length <= 1) return null;
                            const curIdx = activeNavList.findIndex((l) => l.id === activeLecture.id);
                            const prevL = curIdx > 0 ? activeNavList[curIdx - 1] : null;
                            const nextL =
                              curIdx >= 0 && curIdx + 1 < activeNavList.length
                                ? activeNavList[curIdx + 1]
                                : null;
                            const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
                            const NextIcon = isRtl ? ChevronLeft : ChevronRight;
                            return (
                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  disabled={!prevL}
                                  onClick={() => prevL && setActiveLecture(prevL)}
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                                >
                                  <PrevIcon className="w-4 h-4" />
                                  <span>{lang === 'en' ? 'Previous' : 'الحصة السابقة'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!nextL}
                                  onClick={() => nextL && setActiveLecture(nextL)}
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>{lang === 'en' ? 'Next Session' : 'الحصة التالية'}</span>
                                  <NextIcon className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (activeLecture.pointsCost || 0) > 0 ? (
                      /* Points-Gated Lecture Unlock Screen */
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-amber-200 dark:border-amber-800/60 space-y-5 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Ticket className="w-8 h-8" />
                        </div>

                        <div className="space-y-1.5 max-w-md mx-auto">
                          <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            {lang === 'en'
                              ? `Points-Gated Lecture · ${activeLecture.pointsCost} Pts`
                              : `محاضرة خاصة تُفتح بالنقاط · ${activeLecture.pointsCost} نقطة`}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {activeLecture.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed tabular-nums">
                            {lang === 'en' ? 'Current balance:' : 'رصيدك الحالي:'}{' '}
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {currentUser?.points ?? 0} {lang === 'en' ? 'Pts' : 'نقطة'}
                            </span>{' '}
                            · {lang === 'en' ? 'Unlock cost:' : 'تكلفة الفتح:'}{' '}
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {activeLecture.pointsCost} {lang === 'en' ? 'Pts' : 'نقطة'}
                            </span>
                          </p>
                        </div>

                        {inlineNotice && (
                          <div
                            className={`max-w-md mx-auto p-3 rounded-xl text-xs font-bold ${
                              inlineNotice.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {inlineNotice.text}
                          </div>
                        )}

                        <div className="max-w-md mx-auto space-y-3">
                          <button
                            type="button"
                            disabled={
                              inlineBusy ||
                              (currentUser?.points ?? 0) < (activeLecture.pointsCost || 0)
                            }
                            onClick={async () => {
                              if (!onUnlockLecture || inlineBusy) return;
                              setInlineNotice(null);
                              setInlineBusy(true);
                              try {
                                await onUnlockLecture(activeLecture);
                                setInlineNotice({
                                  type: 'success',
                                  text:
                                    lang === 'en'
                                      ? 'Lecture unlocked! Enjoy watching.'
                                      : 'تم فتح المحاضرة بنجاح! استمتع بالمشاهدة.',
                                });
                              } catch (err: any) {
                                setInlineNotice({
                                  type: 'error',
                                  text:
                                    err?.message ||
                                    (lang === 'en'
                                      ? 'Could not unlock lecture.'
                                      : 'تعذر فتح المحاضرة بالنقاط.'),
                                });
                              } finally {
                                setInlineBusy(false);
                              }
                            }}
                            className={`w-full min-h-[48px] px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                              (currentUser?.points ?? 0) >= (activeLecture.pointsCost || 0)
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {inlineBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                            <span>
                              {(currentUser?.points ?? 0) >= (activeLecture.pointsCost || 0)
                                ? lang === 'en'
                                  ? `Unlock Now for ${activeLecture.pointsCost} Pts`
                                  : `افتح المحاضرة الآن بـ ${activeLecture.pointsCost} نقطة`
                                : lang === 'en'
                                ? `Need ${
                                    (activeLecture.pointsCost || 0) - (currentUser?.points ?? 0)
                                  } more points`
                                : `رصيدك غير كافٍ — ينقصك ${
                                    (activeLecture.pointsCost || 0) - (currentUser?.points ?? 0)
                                  } نقطة`}
                            </span>
                          </button>

                          {/* Inline Quick Redeem Code Form */}
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!onRedeemCode || !inlineCodeInput.trim() || inlineBusy) return;
                              setInlineNotice(null);
                              setInlineBusy(true);
                              try {
                                const res = await onRedeemCode(inlineCodeInput);
                                setInlineCodeInput('');
                                setInlineNotice({
                                  type: 'success',
                                  text:
                                    lang === 'en'
                                      ? `Added +${res.pointsAdded} Pts! Balance is now ${res.newBalance} Pts.`
                                      : `تم شحن +${res.pointsAdded} نقطة! رصيدك الآن ${res.newBalance} نقطة.`,
                                });
                              } catch (err: any) {
                                setInlineNotice({
                                  type: 'error',
                                  text:
                                    err?.message ||
                                    (lang === 'en'
                                      ? 'Invalid or expired code.'
                                      : 'الكود غير صحيح أو منتهي.'),
                                });
                              } finally {
                                setInlineBusy(false);
                              }
                            }}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2"
                          >
                            <input
                              type="text"
                              value={inlineCodeInput}
                              onChange={(e) => setInlineCodeInput(e.target.value.toUpperCase())}
                              placeholder={lang === 'en' ? 'Have a redeem code?' : 'معاك كود شحن؟ اكتبه هنا'}
                              dir="ltr"
                              className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold uppercase text-center"
                            />
                            <button
                              type="submit"
                              disabled={inlineBusy || !inlineCodeInput.trim()}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>{lang === 'en' ? 'Redeem' : 'شحن الكود'}</span>
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : (
                      /* Locked Prerequisite Screen */
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-5 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Lock className="w-8 h-8" />
                        </div>

                        <div className="space-y-1.5 max-w-md mx-auto">
                          <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            {lang === 'en'
                              ? 'Locked Until Prerequisites Are Complete'
                              : 'الحصة مقفلة حتى إتمام الشروط السابقة'}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {activeLecture.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {lang === 'en'
                              ? 'Finish watching the previous lecture and pass its quiz to unlock automatically.'
                              : 'أنهِ مشاهدة الحصة السابقة واجتز اختبارها لفتح هذه المحاضرة تلقائياً.'}
                          </p>
                        </div>

                        {(() => {
                          const prereq = getPrerequisiteDetails(activeLecture);
                          if (!prereq) return null;
                          return (
                            <div className="max-w-lg mx-auto border-t border-slate-100 dark:border-slate-800 pt-4 text-start space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                <div className="flex items-center gap-2.5">
                                  {prereq.prevWatched ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                  )}
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                      {lang === 'en'
                                        ? `1. Watch Lecture ${prereq.prevLec.sessionOrder || 1}: ${prereq.prevLec.title}`
                                        : `1. مشاهدة الحصة ${prereq.prevLec.sessionOrder || 1}: ${prereq.prevLec.title}`}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {prereq.prevWatched
                                        ? lang === 'en'
                                          ? 'Completed'
                                          : 'مكتمل'
                                        : lang === 'en'
                                        ? 'Not completed'
                                        : 'غير مكتمل'}
                                    </div>
                                  </div>
                                </div>

                                {!prereq.prevWatched && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveLecture(prereq.prevLec)}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer shrink-0"
                                  >
                                    {lang === 'en' ? 'Go to Lecture' : 'الانتقال للحصة'}
                                  </button>
                                )}
                              </div>

                              {prereq.prevQuiz && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                  <div className="flex items-center gap-2.5">
                                    {prereq.prevQuizPassed ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                                    )}
                                    <div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        {lang === 'en'
                                          ? `2. Pass ${prereq.prevQuiz.title} (60%+)`
                                          : `2. اجتياز ${prereq.prevQuiz.title} (60% فأعلى)`}
                                      </div>
                                      <div className="text-[11px] text-slate-500 tabular-nums">
                                        {prereq.prevQuizPassed
                                          ? lang === 'en'
                                            ? `Passed (${currentUser?.quizScores?.[prereq.prevQuiz.id] || 100}%)`
                                            : `تم الاجتياز بنسبة ${currentUser?.quizScores?.[prereq.prevQuiz.id] || 100}%`
                                          : lang === 'en'
                                          ? 'Quiz passing required'
                                          : 'مطلوب اجتياز الاختبار'}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleStartQuiz(prereq.prevQuiz!)}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer shrink-0"
                                  >
                                    {lang === 'en' ? 'Start Quiz' : 'بدء الاختبار'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )
                  ) : (
                    <div className="p-10 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      {lang === 'en'
                        ? 'No lectures published for this grade yet.'
                        : 'لا توجد محاضرات متاحة حالياً لهذا الصف.'}
                    </div>
                  )}
                </div>

                {/* Lecture Curriculum Playlist Column (Grouped by Unit with 16:9 Thumbnails) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedUnitFilter === 'all'
                          ? lang === 'en'
                            ? 'Curriculum Playlist'
                            : 'قائمة حصص المنهج'
                          : gradeUnits.find((u) => u.id === selectedUnitFilter)?.titleAr ||
                            (lang === 'en' ? 'Unit Playlist' : 'حصص الوحدة')}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        {filteredLectures.length} {lang === 'en' ? 'sessions' : 'حصص'}
                      </span>
                    </div>

                    {filteredLectures.length > 0 && (
                      <>
                        <div className="relative">
                          <Search
                            className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 pointer-events-none ${
                              isRtl ? 'right-3' : 'left-3'
                            }`}
                          />
                          <input
                            type="text"
                            value={lectureSearch}
                            onChange={(e) => setLectureSearch(e.target.value)}
                            placeholder={lang === 'en' ? 'Search lecture or unit...' : 'ابحث عن حصة أو وحدة...'}
                            className={`w-full min-h-[36px] py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                              isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'
                            }`}
                          />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: 'all', label: lang === 'en' ? 'All' : 'الكل' },
                            { id: 'available', label: lang === 'en' ? 'Available' : 'متاحة' },
                            { id: 'completed', label: lang === 'en' ? 'Completed' : 'مكتملة' },
                            { id: 'bookmarked', label: lang === 'en' ? 'Saved' : 'المحفوظة' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setLectureFilter(f.id as any)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                lectureFilter === f.id
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {nextTargetLecture && nextTargetLecture.id !== activeLecture?.id && (
                          <button
                            type="button"
                            onClick={() => setActiveLecture(nextTargetLecture)}
                            className="w-full px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/70 hover:border-teal-500 text-start transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                {lang === 'en' ? 'Next Recommended Session' : 'الحصة التالية المقترحة'}
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {nextTargetLecture.title}
                              </div>
                            </div>
                            <PlayCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const unitsToRender =
                        selectedUnitFilter === 'all'
                          ? gradeUnits
                          : gradeUnits.filter((u) => u.id === selectedUnitFilter);
                      const q = lectureSearch.trim().toLowerCase();

                      const renderLectureItem = (lec: Lecture, idx: number) => {
                        const isCurrent = activeLecture?.id === lec.id;
                        const unlocked = isLectureUnlocked(lec);
                        const isWatched = currentUser?.watchedLectureIds?.includes(lec.id);
                        const isBookmarked = bookmarkedLectureIds.includes(lec.id);

                        return (
                          <button
                            key={lec.id}
                            type="button"
                            onMouseEnter={() => {
                              if (unlocked && lec.videoUrl) prefetchVideoStream(lec.videoUrl);
                            }}
                            onClick={() => {
                              setActiveLecture(lec);
                              if (window.innerWidth < 1024) {
                                document
                                  .getElementById('videoPlayerSection')
                                  ?.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className={`w-full px-3.5 py-3 text-start transition-colors cursor-pointer flex items-center gap-3 border-b border-slate-100/80 dark:border-slate-800/80 last:border-b-0 ${
                              isCurrent
                                ? 'bg-teal-50/80 dark:bg-teal-950/40'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            {/* 16:9 Mini Thumbnail with Status Overlay */}
                            <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative bg-slate-900">
                              <img
                                src={
                                  lec.thumbnailUrl ||
                                  '/images/chemistry_lab_visual_1794141316456.jpg'
                                }
                                alt={lec.title}
                                loading="lazy"
                                decoding="async"
                                className={`w-full h-full object-cover ${
                                  !unlocked ? 'opacity-50 grayscale-[35%]' : ''
                                }`}
                              />
                              <div className="absolute inset-0 bg-slate-950/35 flex items-center justify-center">
                                {!unlocked ? (
                                  <Lock className="w-4 h-4 text-amber-300" />
                                ) : isWatched ? (
                                  <Check className="w-4 h-4 text-emerald-300" />
                                ) : (
                                  <PlayCircle
                                    className={`w-5 h-5 ${
                                      isCurrent ? 'text-teal-300' : 'text-white/95'
                                    }`}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5">
                                <div
                                  className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${
                                    isCurrent
                                      ? 'text-teal-800 dark:text-teal-300'
                                      : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {lec.title}
                                </div>
                                {isBookmarked && (
                                  <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0 mt-0.5" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums truncate">
                                <span>
                                  {lang === 'en'
                                    ? `#${lec.sessionOrder || idx + 1}`
                                    : `حصة ${lec.sessionOrder || idx + 1}`}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-sans">{lec.duration}</span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`font-sans font-semibold ${
                                    !unlocked
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : isWatched
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-teal-600 dark:text-teal-400'
                                  }`}
                                >
                                  {!unlocked
                                    ? (lec.pointsCost || 0) > 0
                                      ? lang === 'en'
                                        ? `${lec.pointsCost} Pts`
                                        : `${lec.pointsCost} نقطة`
                                      : lang === 'en'
                                      ? 'Locked'
                                      : 'مقفلة'
                                    : isWatched
                                    ? lang === 'en'
                                      ? 'Completed'
                                      : 'مكتملة'
                                    : lang === 'en'
                                    ? 'Available'
                                    : 'متاحة'}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      };

                      let totalRendered = 0;

                      const unitSections = unitsToRender.map((unit) => {
                        const unitAllLecs = getLecturesInUnit(filteredLectures, unit);
                        const matching = unitAllLecs.filter((lec) => {
                          const unlocked = isLectureUnlocked(lec);
                          const isWatched = Boolean(
                            currentUser?.watchedLectureIds?.includes(lec.id)
                          );
                          const isBookmarked = bookmarkedLectureIds.includes(lec.id);
                          if (lectureFilter === 'available' && !unlocked) return false;
                          if (lectureFilter === 'completed' && !isWatched) return false;
                          if (lectureFilter === 'bookmarked' && !isBookmarked) return false;
                          if (!q) return true;
                          return (
                            lec.title.toLowerCase().includes(q) ||
                            lec.chapter.toLowerCase().includes(q) ||
                            unit.titleAr.toLowerCase().includes(q)
                          );
                        });

                        if (matching.length === 0) return null;
                        totalRendered += matching.length;
                        const completedInUnit = unitAllLecs.filter((l) =>
                          currentUser?.watchedLectureIds?.includes(l.id)
                        ).length;

                        return (
                          <div key={unit.id}>
                            <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                {unit.titleAr}
                              </span>
                              <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                                {completedInUnit}/{unitAllLecs.length}
                              </span>
                            </div>
                            <div>{matching.map((lec, idx) => renderLectureItem(lec, idx))}</div>
                          </div>
                        );
                      });

                      if (filteredLectures.length === 0) {
                        return (
                          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                            <BookOpen className="w-7 h-7 text-teal-600/40 mx-auto" />
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              {lang === 'en'
                                ? 'No lectures published yet'
                                : 'لم يتم نشر محاضرات لهذا الصف حتى الآن'}
                            </div>
                          </div>
                        );
                      }

                      if (totalRendered === 0) {
                        return (
                          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                            <Search className="w-6 h-6 text-slate-400 mx-auto" />
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              {lang === 'en'
                                ? 'No matching lectures in this filter'
                                : 'لا توجد محاضرات مطابقة للبحث أو الفلتر المحدد'}
                            </div>
                          </div>
                        );
                      }

                      return unitSections;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* 2. QUIZZES TAB & ACTIVE EXAM ENGINE */}
            {(activeTab === 'quizzes' || activeQuiz) && (
              <QuizRunner
                lang={lang}
                currentUser={currentUser}
                siteConfig={siteConfig}
                filteredQuizzes={filteredQuizzes}
                activeQuiz={activeQuiz}
                currentQuestionIndex={currentQuestionIndex}
                selectedAnswers={selectedAnswers}
                quizSubmitted={quizSubmitted}
                showQuizCelebration={showQuizCelebration}
                onStartQuiz={handleStartQuiz}
                onExitQuiz={() => setActiveQuiz(null)}
                onGoToLectures={() => {
                  setActiveQuiz(null);
                  setActiveTab('lectures');
                }}
                onQuestionIndexChange={setCurrentQuestionIndex}
                onSelectAnswer={handleSelectAnswer}
                onSubmitQuiz={handleSubmitQuiz}
                calculateScore={calculateScore}
                onReportExamAlert={onReportExamAlert}
                onCheatCancelQuiz={handleCheatCancelQuiz}
              />
            )}

            {/* 3. FILES & ATTACHMENTS TAB */}
            {activeTab === 'files' && !activeQuiz && (
              <HandoutsTab
                lang={lang}
                gradeTitle={getGradeTitle(selectedGrade)}
                filteredAttachments={filteredAttachments}
                currentUser={currentUser}
                onUnlockAttachment={onUnlockAttachment}
              />
            )}

            {/* 4. POINTS WALLET & REDEEM CODES TAB */}
            {activeTab === 'points' && !activeQuiz && (
              <PointsWalletTab
                lang={lang}
                currentUser={currentUser}
                gradeTitle={getGradeTitle(selectedGrade)}
                selectedGrade={selectedGrade}
                filteredLectures={filteredLectures}
                filteredAttachments={filteredAttachments}
                rewards={rewards}
                onRedeemCode={async (code) => {
                  if (!onRedeemCode) {
                    throw new Error(
                      lang === 'en'
                        ? 'Code redemption service is currently unavailable.'
                        : 'خدمة شحن الأكواد غير متاحة حالياً.'
                    );
                  }
                  return await onRedeemCode(code);
                }}
                onUnlockLecture={async (lec) => {
                  if (onUnlockLecture) await onUnlockLecture(lec);
                }}
                onUnlockAttachment={async (file) => {
                  if (onUnlockAttachment) await onUnlockAttachment(file);
                }}
                onClaimReward={async (rew) => {
                  if (onClaimReward) await onClaimReward(rew);
                }}
                onOpenLecture={(lec) => {
                  setActiveLecture(lec);
                  setActiveTab('lectures');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onGoToFiles={() => setActiveTab('files')}
              />
            )}

            {/* 5. NOTIFICATIONS & ANNOUNCEMENTS TAB */}
            {activeTab === 'notifications' && !activeQuiz && (
              <StudentNotificationsTab
                notifications={visibleNotifications}
                readNotificationIds={readNotificationIds}
                gradeTitle={getGradeTitle(selectedGrade)}
                onMarkAllRead={markAllNotificationsRead}
                onMarkOneRead={markNotificationRead}
                onNavigateTab={(tab) => {
                  const safeTab = (tab as string) === 'study-hub' ? 'lectures' : tab;
                  setActiveTab(safeTab);
                  setActiveQuiz(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* 7. DEDICATED FULL-PAGE STUDENT PROFILE */}
            {activeTab === 'profile' && !activeQuiz && currentUser && (
              <StudentProfileModal
                isOpen={true}
                onClose={() => setActiveTab(lastTabBeforeProfileRef.current || 'lectures')}
                currentUser={currentUser}
                siteConfig={siteConfig}
                cloudinaryConfig={cloudinaryConfig}
                completedLecturesCount={completedLecturesCount}
                passedQuizzesCount={passedQuizzesCount}
                onSaveProfile={(updatedUser, nextCustom) => {
                  setCustomProfile(nextCustom);
                  if (updatedUser.grade) {
                    setSelectedGrade(updatedUser.grade);
                  }
                  onUpdateStudentProfile?.(
                    updatedUser,
                    lang === 'en'
                      ? 'Profile updated successfully!'
                      : 'تم حفظ وتحديث ملفك الشخصي بنجاح!'
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fixed Mobile Bottom Tab Bar (hidden inside distraction-free exam mode) */}
      {!activeQuiz && (
      <nav
        aria-label={lang === 'en' ? 'Student Navigation' : 'التنقل الرئيسي للطالب'}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('lectures');
              setActiveQuiz(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'lectures' && !activeQuiz
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Video className="w-5 h-5" />
            <span>{lang === 'en' ? 'Lectures' : 'المحاضرات'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'quizzes' || activeQuiz
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>{lang === 'en' ? 'Quizzes' : 'الامتحانات'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('points');
              setActiveQuiz(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'points'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span>{lang === 'en' ? 'Points' : 'النقاط'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('files');
              setActiveQuiz(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'files'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>{lang === 'en' ? 'PDFs' : 'الملازم'}</span>
          </button>

          <button
            type="button"
            onClick={openProfilePage}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <User className="w-5 h-5" />
            <span>{lang === 'en' ? 'Profile' : 'ملفي'}</span>
          </button>
        </div>
      </nav>
      )}
    </div>
  );
};
