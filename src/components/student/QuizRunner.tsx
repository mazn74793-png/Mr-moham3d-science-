import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Award,
  Clock,
  HelpCircle,
  Trophy,
  ZoomIn,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Grid3X3,
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  EyeOff,
  FileCheck2,
  Ban,
} from 'lucide-react';
import { ExamSecurityAlert, Quiz, UserProfile } from '../../types';
import { SiteConfig } from '../../types/siteConfig';

interface QuizRunnerProps {
  lang: string;
  currentUser: UserProfile;
  siteConfig?: SiteConfig;
  filteredQuizzes: Quiz[];
  activeQuiz: Quiz | null;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number>;
  quizSubmitted: boolean;
  showQuizCelebration: string | null;
  onStartQuiz: (quiz: Quiz) => void;
  onExitQuiz: () => void;
  onGoToLectures: () => void;
  onQuestionIndexChange: (index: number) => void;
  onSelectAnswer: (questionId: string, answerIndex: number) => void;
  onSubmitQuiz: () => void;
  calculateScore: () => number;
  onReportExamAlert?: (alert: ExamSecurityAlert) => Promise<void> | void;
  onCheatCancelQuiz?: (quiz: Quiz, violationCount: number, reasons: string[]) => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  lang,
  currentUser,
  siteConfig,
  filteredQuizzes,
  activeQuiz,
  currentQuestionIndex,
  selectedAnswers,
  quizSubmitted,
  showQuizCelebration,
  onStartQuiz,
  onExitQuiz,
  onGoToLectures,
  onQuestionIndexChange,
  onSelectAnswer,
  onSubmitQuiz,
  calculateScore,
  onReportExamAlert,
  onCheatCancelQuiz,
}) => {
  const isEn = lang === 'en';
  const [enlargedQuizImage, setEnlargedQuizImage] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Record<string, boolean>>({});
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'mistakes'>('all');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const autoSubmittedQuizIdRef = useRef<string | null>(null);

  // Pre-Exam Rules & Agreement Gate State
  const [examConfirmed, setExamConfirmed] = useState<boolean>(false);
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);

  // Real-time Anti-Cheat & Proctoring State
  const [violationCount, setViolationCount] = useState<number>(0);
  const [violationReasons, setViolationReasons] = useState<string[]>([]);
  const [privacyCurtainReason, setPrivacyCurtainReason] = useState<string | null>(null);
  const [cancelledByCheat, setCancelledByCheat] = useState<boolean>(false);
  const [watermarkPos, setWatermarkPos] = useState<{ top: number; left: number }>({
    top: 22,
    left: 16,
  });

  const violationCountRef = useRef<number>(0);
  const violationReasonsRef = useRef<string[]>([]);
  const lastViolationAtRef = useRef<number>(0);
  const wasFullscreenRef = useRef<boolean>(false);
  const cancelledRef = useRef<boolean>(false);

  const PrevChevron = isEn ? ChevronLeft : ChevronRight;
  const NextChevron = isEn ? ChevronRight : ChevronLeft;

  const isQuizPreCancelled = Boolean(
    activeQuiz && currentUser.cancelledQuizIds?.includes(activeQuiz.id)
  );
  const isQuizCancelled = isQuizPreCancelled || cancelledByCheat;
  const isProctoringActive = activeQuiz?.proctoringEnabled !== false;
  const maxAllowedViolations = Math.max(1, Number(activeQuiz?.maxViolations) || 3);
  const warningThresholdSeconds = Math.max(0, Number(activeQuiz?.warningMinutes ?? 5)) * 60;
  const examActivelyRunning = Boolean(
    activeQuiz && examConfirmed && !quizSubmitted && !isQuizCancelled
  );

  // Reset per-attempt tracking whenever activeQuiz changes
  useEffect(() => {
    if (!activeQuiz) {
      setVisitedIds({});
      setReviewFilter('all');
      setSecondsLeft(0);
      setExamConfirmed(false);
      setAgreedToRules(false);
      setViolationCount(0);
      setViolationReasons([]);
      setPrivacyCurtainReason(null);
      setCancelledByCheat(false);
      violationCountRef.current = 0;
      violationReasonsRef.current = [];
      lastViolationAtRef.current = 0;
      wasFullscreenRef.current = false;
      cancelledRef.current = false;
      autoSubmittedQuizIdRef.current = null;
      return;
    }

    const firstQ = activeQuiz.questions[0];
    setVisitedIds(firstQ ? { [firstQ.id]: true } : {});
    setReviewFilter('all');
    const mins = Math.max(1, Number(activeQuiz.durationMinutes) || 15);
    setSecondsLeft(mins * 60);
    setExamConfirmed(activeQuiz.requireAgreement === false);
    setAgreedToRules(false);
    setViolationCount(0);
    setViolationReasons([]);
    setPrivacyCurtainReason(null);
    setCancelledByCheat(false);
    violationCountRef.current = 0;
    violationReasonsRef.current = [];
    lastViolationAtRef.current = 0;
    wasFullscreenRef.current = Boolean(document.fullscreenElement);
    cancelledRef.current = false;
    autoSubmittedQuizIdRef.current = null;
  }, [activeQuiz?.id]);

  // Move watermark periodically during active exam so static overlays cannot mask it
  useEffect(() => {
    if (!examActivelyRunning) return;
    const positions = [
      { top: 18, left: 14 },
      { top: 45, left: 48 },
      { top: 72, left: 20 },
      { top: 30, left: 62 },
      { top: 60, left: 12 },
    ];
    let idx = 0;
    const id = window.setInterval(() => {
      idx = (idx + 1) % positions.length;
      setWatermarkPos(positions[idx]);
    }, 6500);
    return () => window.clearInterval(id);
  }, [examActivelyRunning]);

  // Body print/capture lock class during active exam
  useEffect(() => {
    if (examActivelyRunning && isProctoringActive) {
      document.body.classList.add('exam-active-lock');
    } else {
      document.body.classList.remove('exam-active-lock');
    }
    return () => {
      document.body.classList.remove('exam-active-lock');
    };
  }, [examActivelyRunning, isProctoringActive]);

  // Register a debounced exam security violation and auto-cancel + alert admin on threshold
  const registerViolation = useCallback(
    (reasonAr: string, reasonEn: string, showCurtain = true) => {
      if (!activeQuiz || !examConfirmed || quizSubmitted || cancelledRef.current) return;
      if (activeQuiz.proctoringEnabled === false) return;

      const now = Date.now();
      if (now - lastViolationAtRef.current < 1200) {
        if (showCurtain) {
          setPrivacyCurtainReason(isEn ? reasonEn : reasonAr);
        }
        return;
      }
      lastViolationAtRef.current = now;

      const reasonLabel = isEn ? reasonEn : reasonAr;
      const nextCount = violationCountRef.current + 1;
      const updatedReasons = [...violationReasonsRef.current, reasonLabel];
      violationCountRef.current = nextCount;
      violationReasonsRef.current = updatedReasons;

      setViolationCount(nextCount);
      setViolationReasons(updatedReasons);

      const willCancel = nextCount >= maxAllowedViolations;
      if (showCurtain && !willCancel) {
        setPrivacyCurtainReason(reasonLabel);
      }

      const alertPayload: ExamSecurityAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        studentUid: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentPhone: currentUser.phone,
        grade: activeQuiz.grade,
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        violationCount: nextCount,
        maxViolations: maxAllowedViolations,
        reasons: updatedReasons,
        actionTaken: willCancel ? 'cancelled' : 'warning',
        resolved: false,
        createdAtDate: new Date().toISOString().split('T')[0],
      };

      try {
        Promise.resolve(onReportExamAlert?.(alertPayload)).catch(() => {});
      } catch {}

      if (willCancel) {
        cancelledRef.current = true;
        setCancelledByCheat(true);
        setPrivacyCurtainReason(null);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        onCheatCancelQuiz?.(activeQuiz, nextCount, updatedReasons);
      }
    },
    [
      activeQuiz,
      examConfirmed,
      quizSubmitted,
      isEn,
      maxAllowedViolations,
      currentUser,
      onReportExamAlert,
      onCheatCancelQuiz,
    ]
  );

  // Active Anti-Cheat & Screenshot/Recording Deterrence Listeners
  useEffect(() => {
    if (!examActivelyRunning || !isProctoringActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation(
          'تم الخروج من صفحة الامتحان أو فتح تطبيق/تبويب آخر',
          'Left exam page or switched tabs/apps',
          true
        );
      }
    };

    const handleWindowBlur = () => {
      registerViolation(
        'فقدان التركيز عن شاشة الامتحان أو محاولة فتح نافذة أخرى',
        'Exam window lost focus or another overlay/app opened',
        true
      );
    };

    const handlePageHide = () => {
      registerViolation(
        'محاولة مغادرة أو إخفاء صفحة الامتحان',
        'Attempted to leave or hide exam window',
        true
      );
    };

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        wasFullscreenRef.current = true;
      } else if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        registerViolation(
          'الخروج من وضع ملء الشاشة أثناء الامتحان',
          'Exited fullscreen mode during exam',
          true
        );
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopyOrCut = (e: ClipboardEvent) => {
      e.preventDefault();
      registerViolation(
        'محاولة نسخ محتوى أسئلة الامتحان',
        'Attempted to copy/cut exam questions',
        false
      );
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const isPrintScreen = key === 'printscreen' || e.code === 'PrintScreen';
      const isDevTools =
        key === 'f12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key));
      const isSavePrintView =
        (e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(key);
      const isSystemScreenshot =
        ((e.metaKey || e.ctrlKey) && e.shiftKey && ['s', '3', '4', '5'].includes(key));

      if (isPrintScreen || isDevTools || isSavePrintView || isSystemScreenshot) {
        e.preventDefault();
        e.stopPropagation();
        if (isPrintScreen && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        registerViolation(
          isPrintScreen || isSystemScreenshot
            ? 'محاولة التقاط لقطة شاشة أو طباعة أثناء الامتحان'
            : 'محاولة فتح أدوات المطور أو حفظ صفحة الامتحان',
          isPrintScreen || isSystemScreenshot
            ? 'Attempted screenshot or print shortcut during exam'
            : 'Attempted to open developer tools or save page',
          true
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if (key === 'printscreen' || e.code === 'PrintScreen') {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        registerViolation(
          'تم رصد ضغط زر التقاط الشاشة (PrintScreen)',
          'PrintScreen key capture detected',
          true
        );
      }
    };

    // Intercept navigator.mediaDevices.getDisplayMedia to deter in-browser screen recording
    let originalGetDisplayMedia: any = null;
    const mediaDevicesObj = navigator.mediaDevices as any;
    if (mediaDevicesObj && typeof mediaDevicesObj.getDisplayMedia === 'function') {
      try {
        originalGetDisplayMedia = mediaDevicesObj.getDisplayMedia;
        mediaDevicesObj.getDisplayMedia = () => {
          registerViolation(
            'محاولة تشغيل تسجيل الشاشة أو مشاركتها أثناء الامتحان',
            'Attempted screen recording or screen share during exam',
            true
          );
          return Promise.reject(
            new Error(
              isEn
                ? 'Screen recording is blocked during active exams.'
                : 'تسجيل ومشاركة الشاشة محظور أثناء الامتحان.'
            )
          );
        };
      } catch {}
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyOrCut);
    document.addEventListener('cut', handleCopyOrCut);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyOrCut);
      document.removeEventListener('cut', handleCopyOrCut);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      if (mediaDevicesObj && originalGetDisplayMedia) {
        try {
          mediaDevicesObj.getDisplayMedia = originalGetDisplayMedia;
        } catch {}
      }
    };
  }, [examActivelyRunning, isProctoringActive, registerViolation, isEn]);

  // Live countdown timer starts ONLY after the student confirms exam start
  useEffect(() => {
    if (!examActivelyRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (activeQuiz && autoSubmittedQuizIdRef.current !== activeQuiz.id) {
            autoSubmittedQuizIdRef.current = activeQuiz.id;
            window.setTimeout(() => onSubmitQuiz(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [examActivelyRunning, activeQuiz, onSubmitQuiz]);

  // Arrow-key question navigation for faster exam flow
  useEffect(() => {
    if (!activeQuiz || !examConfirmed) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowRight') {
        const delta = isEn ? 1 : -1;
        onQuestionIndexChange(
          Math.max(0, Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + delta))
        );
      } else if (e.key === 'ArrowLeft') {
        const delta = isEn ? -1 : 1;
        onQuestionIndexChange(
          Math.max(0, Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + delta))
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeQuiz, examConfirmed, currentQuestionIndex, isEn, onQuestionIndexChange]);

  // Mark currently viewed question as opened/visited
  useEffect(() => {
    if (!activeQuiz) return;
    const activeQ = activeQuiz.questions[currentQuestionIndex];
    if (!activeQ) return;
    setVisitedIds((prev) => (prev[activeQ.id] ? prev : { ...prev, [activeQ.id]: true }));
  }, [activeQuiz, currentQuestionIndex]);

  const handleConfirmAndStartExam = () => {
    if (!activeQuiz) return;
    const mins = Math.max(1, Number(activeQuiz.durationMinutes) || 15);
    setSecondsLeft(mins * 60);
    setExamConfirmed(true);
    if (activeQuiz.proctoringEnabled !== false && document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          wasFullscreenRef.current = true;
        })
        .catch(() => {
          // Safe fallback on iPhone/Safari browsers that don't support document fullscreen
          wasFullscreenRef.current = false;
        });
    }
  };

  // 1. QUIZ LIST VIEW
  if (!activeQuiz) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isEn ? 'Online Quizzes & Assessments' : 'الامتحانات الإلكترونية'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {isEn
              ? 'Instant grading, scientific explanations, proctored timing, and a mobile-friendly question map.'
              : 'تصحيح فوري وتفسير علمي لكل سؤال مع مراقبة ذكية للوقت وخريطة واضحة لأرقام الأسئلة على الموبايل.'}
          </p>
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Award className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              {isEn ? 'No quizzes created yet' : 'لا توجد اختبارات مضافة لهذا الصف بعد'}
            </h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuizzes.map((quiz) => {
              const quizScore = currentUser.quizScores?.[quiz.id];
              const passThreshold = quiz.passingScore ?? 60;
              const isCancelled = Boolean(currentUser.cancelledQuizIds?.includes(quiz.id));
              const isPassed =
                !isCancelled &&
                (currentUser.passedQuizIds?.includes(quiz.id) ||
                  (quizScore !== undefined && quizScore >= passThreshold));
              const storedViolations = currentUser.quizViolations?.[quiz.id];

              return (
                <div
                  key={quiz.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col justify-between gap-4 transition-colors ${
                    isCancelled
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-teal-400 hover-card-lift'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span className="font-bold text-teal-700 dark:text-teal-300 truncate">
                        {quiz.chapter}
                      </span>
                      <span className="flex items-center gap-1 shrink-0 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {quiz.durationMinutes} {isEn ? 'min' : 'دقيقة'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {quiz.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>
                        {quiz.questions.length} {isEn ? 'questions' : 'سؤال'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {isEn ? `Pass: ${passThreshold}%` : `النجاح من ${passThreshold}%`}
                      </span>
                      {quiz.proctoringEnabled !== false && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isEn ? 'Proctored' : 'لجنة مراقبة'}
                          </span>
                        </>
                      )}
                    </div>

                    {isCancelled ? (
                      <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-start gap-2">
                        <Ban className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <span>
                          {isEn
                            ? `Exam locked due to proctoring violations (${storedViolations?.count || 0}). Contact your teacher to unlock.`
                            : `تم إلغاء الامتحان بسبب مخالفة اللجنة (${storedViolations?.count || 0} مخالفات). تواصل مع المعلم لإعادة الفتح.`}
                        </span>
                      </div>
                    ) : quizScore !== undefined ? (
                      <div
                        className={`text-xs font-bold ${
                          isPassed
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isEn
                          ? `Score ${quizScore}% (${isPassed ? 'Passed' : 'Retake needed'})`
                          : `درجتك ${quizScore}% (${isPassed ? 'ناجح' : 'إعادة مطلوبة'})`}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        {isEn ? 'Not attempted yet' : 'لم يُحل بعد'}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isCancelled}
                    onClick={() => onStartQuiz(quiz)}
                    className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 ${
                      isCancelled
                        ? 'bg-rose-200/80 dark:bg-rose-950 text-rose-800 dark:text-rose-300 cursor-not-allowed opacity-85'
                        : isPassed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
                        : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                    }`}
                  >
                    {isCancelled ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          {isEn ? 'Locked — Contact Teacher' : 'مقفل — تواصل مع المعلم'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>
                          {quizScore !== undefined
                            ? isEn
                              ? 'Retake Quiz'
                              : 'إعادة الامتحان'
                            : isEn
                            ? 'Enter Exam Room'
                            : 'دخول صفحة الامتحان'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. CANCELLED DUE TO ANTI-CHEAT LOCK SCREEN
  if (isQuizCancelled) {
    const savedViolations = currentUser.quizViolations?.[activeQuiz.id];
    const reasonsToShow =
      violationReasons.length > 0 ? violationReasons : savedViolations?.reasons || [];
    const totalStrikes = Math.max(violationCount, savedViolations?.count || 0);

    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800 shadow-lg space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-extrabold">
            <Ban className="w-3.5 h-3.5" />
            {isEn ? 'Exam Terminated & Reported' : 'تم إلغاء الامتحان وإبلاغ الإدارة'}
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {activeQuiz.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            {isEn
              ? `Your exam session was automatically cancelled after reaching ${totalStrikes} security violations. Score was recorded as 0% and a full report was sent to the teacher.`
              : `تم إنهاء وإلغاء امتحانك تلقائياً بعد تسجيل (${totalStrikes}) مخالفات متكررة لقواعد اللجنة. تم رصد الدرجة 0% وإرسال تنبيه فوري للمعلم.`}
          </p>
        </div>

        {reasonsToShow.length > 0 && (
          <div className="text-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 space-y-2">
            <div className="text-xs font-extrabold text-rose-800 dark:text-rose-300">
              {isEn ? 'Recorded Violations Log:' : 'سجل المخالفات المرصودة:'}
            </div>
            <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-200 list-disc list-inside">
              {reasonsToShow.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onExitQuiz}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold cursor-pointer"
          >
            {isEn ? 'Back to Quizzes' : 'العودة لقائمة الامتحانات'}
          </button>
          <button
            type="button"
            onClick={onGoToLectures}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            {isEn ? 'Go to Lectures' : 'الذهاب للمحاضرات'}
          </button>
        </div>
      </div>
    );
  }

  // 3. PRE-EXAM CONFIRMATION & RULES SCREEN (Timer starts AFTER confirmation)
  if (!examConfirmed && !quizSubmitted) {
    const passThreshold = activeQuiz.passingScore ?? 60;
    const instructions =
      Array.isArray(activeQuiz.examInstructions) && activeQuiz.examInstructions.length > 0
        ? activeQuiz.examInstructions
        : isEn
        ? [
            'Do not leave the exam tab, switch apps, or minimize the browser window.',
            'Screenshots, screen recording, printing, and copying questions are strictly blocked.',
            'The quiz submits automatically once the countdown timer reaches zero.',
          ]
        : [
            'ممنوع مغادرة صفحة الامتحان أو التنقل بين التطبيقات والتبويبات الأخرى.',
            'ممنوع تماماً التقاط لقطة شاشة أو تسجيل الشاشة أو النسخ والطباعة أثناء اللجنة.',
            'يتم تسليم الإجابات وتصحيحها تلقائياً بمجرد انتهاء الوقت المحدد.',
          ];

    return (
      <div className="max-w-3xl mx-auto p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700 dark:text-teal-300">
              <FileCheck2 className="w-4 h-4" />
              {isEn ? 'Pre-Exam Confirmation & Rules' : 'تعليمات وتأكيد دخول لجنة الامتحان'}
            </span>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {activeQuiz.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeQuiz.chapter}</p>
          </div>
          <button
            type="button"
            onClick={onExitQuiz}
            className="min-h-[40px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
          >
            {isEn ? 'Back' : 'رجوع'}
          </button>
        </div>

        {/* Key Exam Numbers Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center tabular-nums">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn ? 'Questions' : 'عدد الأسئلة'}
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {activeQuiz.questions.length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn ? 'Duration' : 'مدة الامتحان'}
            </div>
            <div className="text-base font-extrabold text-teal-700 dark:text-teal-300 font-mono mt-0.5">
              {activeQuiz.durationMinutes} {isEn ? 'm' : 'د'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn ? 'Pass Score' : 'درجة النجاح'}
            </div>
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
              {passThreshold}%
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <div className="text-[11px] text-amber-800 dark:text-amber-300">
              {isEn ? 'Proctoring' : 'حد المخالفات'}
            </div>
            <div className="text-base font-extrabold text-amber-900 dark:text-amber-200 font-mono mt-0.5">
              {isProctoringActive
                ? `${maxAllowedViolations} ${isEn ? 'strikes' : 'إنذار'}`
                : isEn
                ? 'Open'
                : 'مفتوح'}
            </div>
          </div>
        </div>

        {/* Teacher Instructions */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isEn ? 'Exam Rules & Security Monitoring' : 'شروط اللجنة ونظام الحماية والمراقبة'}
            </span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            {instructions.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600/15 text-teal-700 dark:text-teal-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
          {warningThresholdSeconds > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isEn
                  ? `You will receive an automatic countdown warning when ${Math.round(
                      warningThresholdSeconds / 60
                    )} minutes remain.`
                  : `سيظهر لك تنبيه تحذيري تلقائي عند تبقّي ${Math.round(
                      warningThresholdSeconds / 60
                    )} دقائق على نهاية الوقت.`}
              </span>
            </div>
          )}
        </div>

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/30 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedToRules}
            onChange={(e) => setAgreedToRules(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded accent-teal-600 shrink-0 cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
            {isEn
              ? 'I have read and agree to all exam rules. I understand the timer starts immediately after pressing Start and violations may cancel my attempt.'
              : 'أقرّ بأنني قرأت جميع شروط وتعليمات الامتحان وألتزم بها، وأعلم أن المؤقت يبدأ فوراً بعد الضغط على بدء الامتحان وأن مخالفة اللجنة تؤدي لإلغائه.'}
          </span>
        </label>

        <button
          type="button"
          disabled={!agreedToRules}
          onClick={handleConfirmAndStartExam}
          className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>
            {isEn ? 'Confirm & Start Exam Now' : 'تأكيد وبدء الامتحان الآن'}
          </span>
        </button>
      </div>
    );
  }

  // 4. ACTIVE EXAM WORKSPACE
  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const score = calculateScore();
  const totalQuestions = Math.max(1, activeQuiz.questions.length);

  let answeredCount = 0;
  let openedUnansweredCount = 0;
  let unopenedCount = 0;

  activeQuiz.questions.forEach((q, idx) => {
    const isAnswered = selectedAnswers[q.id] !== undefined;
    const isOpened = Boolean(visitedIds[q.id] || idx === currentQuestionIndex);
    if (isAnswered) answeredCount++;
    else if (isOpened) openedUnansweredCount++;
    else unopenedCount++;
  });

  const remainingUnanswered = activeQuiz.questions.length - answeredCount;
  const mistakesCount = quizSubmitted
    ? activeQuiz.questions.filter((q) => selectedAnswers[q.id] !== q.correctAnswer).length
    : 0;

  const timerMinutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const timerSeconds = String(secondsLeft % 60).padStart(2, '0');
  const isCriticalTime = !quizSubmitted && secondsLeft > 0 && secondsLeft <= 60;
  const isWarningTime =
    !quizSubmitted &&
    secondsLeft > 60 &&
    warningThresholdSeconds > 0 &&
    secondsLeft <= warningThresholdSeconds;

  const jumpToQuestion = (idx: number) => {
    setEnlargedQuizImage(null);
    onQuestionIndexChange(idx);
  };

  return (
    <div
      className={`max-w-5xl mx-auto space-y-4 relative ${
        examActivelyRunning && isProctoringActive ? 'exam-secure-surface rounded-3xl' : ''
      }`}
    >
      {/* Dynamic Anti-Piracy Moving Watermark Overlay */}
      {examActivelyRunning && isProctoringActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none fixed inset-0 z-30 overflow-hidden"
        >
          <div
            className="absolute transition-all duration-1000 ease-in-out -rotate-12 text-slate-900/[0.06] dark:text-white/[0.06] font-mono font-extrabold text-xs sm:text-sm whitespace-nowrap"
            style={{ top: `${watermarkPos.top}%`, left: `${watermarkPos.left}%` }}
          >
            {currentUser.name} · {currentUser.phone || currentUser.id} ·{' '}
            {siteConfig?.teacherName || 'منصة الكيمياء'}
          </div>
          <div
            className="absolute transition-all duration-1000 ease-in-out -rotate-12 text-slate-900/[0.05] dark:text-white/[0.05] font-mono font-extrabold text-[11px] sm:text-xs whitespace-nowrap"
            style={{
              top: `${(watermarkPos.top + 42) % 85}%`,
              left: `${(watermarkPos.left + 38) % 72}%`,
            }}
          >
            {currentUser.email || currentUser.id} · PROCTORED EXAM
          </div>
        </div>
      )}

      {/* Privacy Blackout Shield on Blur / Tab Switch / PrintScreen */}
      {privacyCurtainReason && examActivelyRunning && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[85] bg-slate-950/98 text-white flex flex-col items-center justify-center p-6 text-center space-y-5 backdrop-blur-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <EyeOff className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <div className="text-xs font-mono font-extrabold text-rose-400">
              {isEn
                ? `SECURITY STRIKE ${violationCount} / ${maxAllowedViolations}`
                : `مخالفة لجنة رقم ${violationCount} من ${maxAllowedViolations}`}
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              {isEn ? 'Exam Screen Protected' : 'حماية اللجنة مفعّلة — ممنوع الخروج'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {privacyCurtainReason}.{' '}
              {isEn
                ? `Warning: reaching ${maxAllowedViolations} violations will automatically cancel your exam and notify the teacher.`
                : `تحذير: عند الوصول إلى (${maxAllowedViolations}) مخالفات سيتم إلغاء امتحانك تلقائياً وإرسال تقرير للمعلم.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPrivacyCurtainReason(null)}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm cursor-pointer"
          >
            {isEn ? 'Acknowledge & Resume Exam' : 'فهمت، العودة للامتحان الآن'}
          </button>
        </div>
      )}

      {/* Top Quiz Header Bar */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white truncate">
              {activeQuiz.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 tabular-nums mt-0.5">
              <span>
                {isEn
                  ? `Q ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`
                  : `السؤال ${currentQuestionIndex + 1} من ${activeQuiz.questions.length}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {isEn
                  ? `Solved ${answeredCount}/${activeQuiz.questions.length}`
                  : `تم حل ${answeredCount}/${activeQuiz.questions.length}`}
              </span>
              {isProctoringActive && !quizSubmitted && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-bold ${
                      violationCount > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-teal-700 dark:text-teal-300'
                    }`}
                  >
                    {isEn
                      ? `Strikes ${violationCount}/${maxAllowedViolations}`
                      : `مخالفات ${violationCount}/${maxAllowedViolations}`}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!quizSubmitted && (
              <div
                dir="ltr"
                className={`min-h-[40px] px-2.5 sm:px-3 rounded-xl border text-xs sm:text-sm font-mono font-extrabold tabular-nums flex items-center gap-1.5 ${
                  isCriticalTime
                    ? 'bg-rose-600 border-rose-700 text-white animate-pulse'
                    : isWarningTime
                    ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <Clock
                  className={`w-3.5 h-3.5 ${
                    isCriticalTime
                      ? 'text-white'
                      : isWarningTime
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-teal-600 dark:text-teal-400'
                  }`}
                />
                <span>
                  {timerMinutes}:{timerSeconds}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEnlargedQuizImage(null);
                if (document.fullscreenElement && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                }
                onExitQuiz();
              }}
              className="min-h-[40px] px-3 sm:px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
            >
              {isEn ? 'Exit' : 'خروج'}
            </button>
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-200"
            style={{
              width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Countdown Warning Banners */}
      {isCriticalTime && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm relative z-10">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {isEn
              ? `Final Countdown: ${secondsLeft}s remaining — your exam will auto-submit at 00:00!`
              : `تحذير عاجل: متبقي ${secondsLeft} ثانية فقط وسيتم تسليم الامتحان تلقائياً!`}
          </span>
        </div>
      )}

      {isWarningTime && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 relative z-10">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {isEn
              ? `Time Warning: Less than ${Math.ceil(secondsLeft / 60)} minutes left. Review your map before submission.`
              : `تنبيه الوقت: متبقي أقل من ${Math.ceil(
                  secondsLeft / 60
                )} دقائق على انتهاء الامتحان، راجع خريطة الأسئلة.`}
          </span>
        </div>
      )}

      {/* Strike Warning Banner if > 0 violations occurred */}
      {!quizSubmitted && violationCount > 0 && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-between gap-2 relative z-10">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            {isEn
              ? `Security Alert: ${violationCount}/${maxAllowedViolations} violations logged & sent to Admin.`
              : `تنبيه أمان: تم تسجيل (${violationCount}/${maxAllowedViolations}) مخالفة وإبلاغ المعلم.`}
          </span>
          <span className="font-mono text-[11px] shrink-0">
            {isEn
              ? `${maxAllowedViolations - violationCount} left`
              : `متبقي ${maxAllowedViolations - violationCount}`}
          </span>
        </div>
      )}

      {showQuizCelebration && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 relative z-10">
          <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{showQuizCelebration}</span>
        </div>
      )}

      {/* Split Layout: Numbered Question Squares Navigator + Active Question Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative z-10">
        {/* QUESTION NUMBER SQUARES PANEL — Mobile-first 44px+ touch targets */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              <Grid3X3 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {isEn
                  ? `Question Map (${activeQuiz.questions.length})`
                  : `خريطة الأسئلة (${activeQuiz.questions.length})`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobilePaletteOpen((p) => !p)}
              className="lg:hidden min-h-[36px] text-[11px] font-bold text-teal-800 dark:text-teal-200 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 cursor-pointer"
            >
              {mobilePaletteOpen
                ? isEn
                  ? 'Hide Map'
                  : 'إخفاء الخريطة'
                : isEn
                ? 'Show Map'
                : 'عرض الخريطة'}
            </button>
          </div>

          {/* 3-Color Status Legend */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold tabular-nums">
            <div className="px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-center">
              <div>{isEn ? 'Unopened' : 'لم يُفتح'}</div>
              <div className="font-mono text-xs">{unopenedCount}</div>
            </div>
            <div className="px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-center">
              <div>{isEn ? 'Opened' : 'مفتوح بدون حل'}</div>
              <div className="font-mono text-xs">{openedUnansweredCount}</div>
            </div>
            <div className="px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-center">
              <div>{isEn ? 'Solved' : 'تم حله'}</div>
              <div className="font-mono text-xs">{answeredCount}</div>
            </div>
          </div>

          {/* Post-Submission Mistakes Filter */}
          {quizSubmitted && mistakesCount > 0 && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`flex-1 min-h-[36px] py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isEn
                  ? `All (${activeQuiz.questions.length})`
                  : `الكل (${activeQuiz.questions.length})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewFilter('mistakes');
                  const firstWrongIdx = activeQuiz.questions.findIndex(
                    (q) => selectedAnswers[q.id] !== q.correctAnswer
                  );
                  if (firstWrongIdx >= 0) jumpToQuestion(firstWrongIdx);
                }}
                className={`flex-1 min-h-[36px] py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'mistakes'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-300'
                }`}
              >
                {isEn ? `Mistakes (${mistakesCount})` : `الأخطاء (${mistakesCount})`}
              </button>
            </div>
          )}

          {/* Responsive Numbered Question Grid (44px+ comfortable touch cells on mobile) */}
          <div
            className={`${
              mobilePaletteOpen ? 'block' : 'hidden lg:block'
            } max-h-[240px] lg:max-h-[380px] overflow-y-auto pt-1 pb-1 px-0.5`}
          >
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-2">
              {activeQuiz.questions.map((q, idx) => {
                if (
                  quizSubmitted &&
                  reviewFilter === 'mistakes' &&
                  selectedAnswers[q.id] === q.correctAnswer
                ) {
                  return null;
                }
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isOpened = Boolean(visitedIds[q.id] || isCurrent);

                let squareClasses =
                  'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-teal-400';
                let statusText = isEn ? 'Unopened' : 'لم يُفتح بعد';

                if (isAnswered) {
                  if (quizSubmitted) {
                    const isCorrectAns = selectedAnswers[q.id] === q.correctAnswer;
                    squareClasses = isCorrectAns
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-rose-600 text-white border-rose-700';
                    statusText = isCorrectAns
                      ? isEn
                        ? 'Correct'
                        : 'إجابة صحيحة'
                      : isEn
                      ? 'Incorrect'
                      : 'إجابة خاطئة';
                  } else {
                    squareClasses =
                      'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
                    statusText = isEn ? 'Answered' : 'اتفتح واتحل';
                  }
                } else if (isOpened) {
                  squareClasses = 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700';
                  statusText = isEn ? 'Opened, unanswered' : 'اتفتح بس متحلش';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => jumpToQuestion(idx)}
                    aria-label={
                      isEn
                        ? `Question ${idx + 1} - ${statusText}`
                        : `سؤال ${idx + 1} - ${statusText}`
                    }
                    title={
                      isEn
                        ? `Question ${idx + 1}: ${statusText}`
                        : `سؤال ${idx + 1}: ${statusText}`
                    }
                    className={`min-h-[44px] w-full rounded-xl border text-xs sm:text-sm font-mono font-extrabold tabular-nums flex items-center justify-center transition-transform cursor-pointer ${squareClasses} ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 ring-teal-500 dark:ring-offset-slate-900 scale-[1.03]'
                        : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {!quizSubmitted && (
            <button
              type="button"
              onClick={onSubmitQuiz}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {remainingUnanswered > 0
                  ? isEn
                    ? `Submit Quiz (${remainingUnanswered} left)`
                    : `إنهاء وتصحيح الامتحان (باقي ${remainingUnanswered})`
                  : isEn
                  ? 'Submit & Grade Now'
                  : 'تصحيح واعتماد النتيجة الآن'}
              </span>
            </button>
          )}
        </aside>

        {/* ACTIVE QUESTION WORKSPACE */}
        {currentQuestion && (
          <div className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold font-mono tabular-nums text-teal-700 dark:text-teal-300">
                {isEn
                  ? `Question ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`
                  : `سؤال رقم ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`}
              </span>

              <span
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  selectedAnswers[currentQuestion.id] !== undefined
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {selectedAnswers[currentQuestion.id] !== undefined ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Answer selected' : 'تم اختيار إجابة'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Not answered yet' : 'لم يتم الحل بعد'}</span>
                  </>
                )}
              </span>
            </div>

            {currentQuestion.imageUrl && (
              <div className="space-y-2">
                {enlargedQuizImage === currentQuestion.imageUrl ? (
                  <div className="rounded-2xl border border-teal-500/40 bg-slate-50 dark:bg-slate-950 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isEn
                          ? `Expanded Question Image ${currentQuestionIndex + 1}`
                          : `تكبير صورة السؤال ${currentQuestionIndex + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnlargedQuizImage(null)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Close Zoom' : 'إغلاق التكبير'}</span>
                      </button>
                    </div>
                    <img
                      src={currentQuestion.imageUrl}
                      alt={
                        isEn
                          ? `Question ${currentQuestionIndex + 1}`
                          : `صورة السؤال ${currentQuestionIndex + 1}`
                      }
                      draggable={false}
                      className="w-full max-h-[75vh] object-contain mx-auto rounded-xl"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEnlargedQuizImage(currentQuestion.imageUrl || null)}
                    className="group relative w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-zoom-in block"
                  >
                    <img
                      src={currentQuestion.imageUrl}
                      alt={
                        isEn
                          ? `Question ${currentQuestionIndex + 1}`
                          : `صورة السؤال ${currentQuestionIndex + 1}`
                      }
                      decoding="async"
                      draggable={false}
                      className="w-full max-h-[420px] object-contain mx-auto"
                    />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-bold absolute bottom-2.5 left-2.5 group-hover:bg-teal-600 transition-colors">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Tap to enlarge' : 'اضغط لتكبير الصورة'}</span>
                    </span>
                  </button>
                )}
              </div>
            )}

            {currentQuestion.question?.trim() && (
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h4>
            )}

            {!quizSubmitted && currentQuestion.formula?.trim() && (
              <div
                dir="ltr"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-teal-800 dark:text-teal-300 text-center font-bold"
              >
                {currentQuestion.formula}
              </div>
            )}

            <div className="space-y-2.5">
              {currentQuestion.options.map((opt, oIdx) => {
                const qId = currentQuestion.id;
                const isSelected = selectedAnswers[qId] === oIdx;
                const isCorrect = currentQuestion.correctAnswer === oIdx;

                let optionStyle =
                  'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:border-teal-400';
                if (quizSubmitted) {
                  if (isCorrect) {
                    optionStyle =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optionStyle =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                  }
                } else if (isSelected) {
                  optionStyle =
                    'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-950 dark:text-teal-100 font-bold';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => onSelectAnswer(qId, oIdx)}
                    className={`w-full min-h-[52px] text-start p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                  >
                    <span className="text-sm sm:text-base">{opt}</span>
                    <span className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs shrink-0 font-mono">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5 text-start">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{isEn ? 'Scientific Explanation:' : 'التفسير العلمي:'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQuestion.explanation ||
                    (isEn
                      ? 'Model answer recorded for this question.'
                      : 'تم تسجيل الإجابة النموذجية لهذا السؤال.')}
                </p>
                {currentQuestion.formula && (
                  <div
                    dir="ltr"
                    className="pt-1 text-xs font-mono text-amber-900 dark:text-amber-200 font-bold"
                  >
                    {currentQuestion.formula}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => jumpToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <PrevChevron className="w-4 h-4" />
                <span>{isEn ? 'Previous' : 'السابق'}</span>
              </button>

              {!quizSubmitted ? (
                currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={onSubmitQuiz}
                    className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
                  >
                    {isEn ? 'Submit & Grade' : 'تصحيح واعتماد النتيجة'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      jumpToQuestion(
                        Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1)
                      )
                    }
                    className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <span>{isEn ? 'Next' : 'التالي'}</span>
                    <NextChevron className="w-4 h-4" />
                  </button>
                )
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                    {score} / {activeQuiz.questions.length} (
                    {Math.round((score / totalQuestions) * 100)}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEnlargedQuizImage(null);
                      onGoToLectures();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white cursor-pointer"
                  >
                    {isEn ? 'To Lectures' : 'للحصص'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
