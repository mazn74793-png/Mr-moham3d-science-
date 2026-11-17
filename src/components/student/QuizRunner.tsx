import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Award,
  Clock,
  HelpCircle,
  Trophy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
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
  XCircle,
  RotateCcw,
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
  const [reviewFilter, setReviewFilter] = useState<'all' | 'mistakes' | 'correct'>('all');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const autoSubmittedQuizIdRef = useRef<string | null>(null);

  // Pre-Exam Rules & Agreement Gate State
  const [examConfirmed, setExamConfirmed] = useState<boolean>(false);
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);

  // Exam Zoom, Exit Confirmation & Unanswered Redirect State
  const [examZoomLevel, setExamZoomLevel] = useState<1 | 1.15 | 1.3>(1);
  const [confirmExitOpen, setConfirmExitOpen] = useState<boolean>(false);
  const [unansweredAlert, setUnansweredAlert] = useState<{
    count: number;
    numbers: number[];
  } | null>(null);
  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);

  // Real-time Anti-Cheat, Anti-Capture & Focus Mode State
  const [violationCount, setViolationCount] = useState<number>(0);
  const [violationReasons, setViolationReasons] = useState<string[]>([]);
  const [privacyCurtainReason, setPrivacyCurtainReason] = useState<string | null>(null);
  const [cancelledByCheat, setCancelledByCheat] = useState<boolean>(false);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(() =>
    typeof document !== 'undefined' ? !document.hidden && document.hasFocus() : true
  );
  const [captureShieldActive, setCaptureShieldActive] = useState<boolean>(false);
  const [watermarkPos, setWatermarkPos] = useState<{ top: number; left: number }>({
    top: 22,
    left: 16,
  });

  const violationCountRef = useRef<number>(0);
  const violationReasonsRef = useRef<string[]>([]);
  const lastViolationAtRef = useRef<number>(0);
  const wasFullscreenRef = useRef<boolean>(false);
  const cancelledRef = useRef<boolean>(false);
  const viewportBaselineRef = useRef<{
    w: number;
    h: number;
    chromeW: number;
    chromeH: number;
  } | null>(null);
  const focusHistoryLockedRef = useRef<boolean>(false);

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
  const isContentObscured = Boolean(
    examActivelyRunning &&
      isProctoringActive &&
      (privacyCurtainReason || !isWindowFocused || captureShieldActive)
  );

  // Reset per-attempt tracking whenever activeQuiz changes
  useEffect(() => {
    if (!activeQuiz) {
      setVisitedIds({});
      setReviewFilter('all');
      setSecondsLeft(0);
      setExamConfirmed(false);
      setAgreedToRules(false);
      setConfirmExitOpen(false);
      setUnansweredAlert(null);
      setExamZoomLevel(1);
      setViolationCount(0);
      setViolationReasons([]);
      setPrivacyCurtainReason(null);
      setCancelledByCheat(false);
      setIsWindowFocused(true);
      setCaptureShieldActive(false);
      violationCountRef.current = 0;
      violationReasonsRef.current = [];
      lastViolationAtRef.current = 0;
      wasFullscreenRef.current = false;
      cancelledRef.current = false;
      viewportBaselineRef.current = null;
      focusHistoryLockedRef.current = false;
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
    setConfirmExitOpen(false);
    setUnansweredAlert(null);
    setViolationCount(0);
    setViolationReasons([]);
    setPrivacyCurtainReason(null);
    setCancelledByCheat(false);
    setIsWindowFocused(!document.hidden && document.hasFocus());
    setCaptureShieldActive(false);
    violationCountRef.current = 0;
    violationReasonsRef.current = [];
    lastViolationAtRef.current = 0;
    wasFullscreenRef.current = Boolean(document.fullscreenElement);
    setIsFullscreenActive(Boolean(document.fullscreenElement));
    cancelledRef.current = false;
    viewportBaselineRef.current = {
      w: window.innerWidth,
      h: window.innerHeight,
      chromeW: Math.max(0, window.outerWidth - window.innerWidth),
      chromeH: Math.max(0, window.outerHeight - window.innerHeight),
    };
    autoSubmittedQuizIdRef.current = null;
  }, [activeQuiz?.id]);

  useEffect(() => {
    const syncFs = () => setIsFullscreenActive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFs);
    return () => document.removeEventListener('fullscreenchange', syncFs);
  }, []);

  useEffect(() => {
    if (!quizSubmitted) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, [quizSubmitted]);

  useEffect(() => {
    if (!activeQuiz || quizSubmitted) {
      setUnansweredAlert(null);
      return;
    }
    const stillUnanswered = activeQuiz.questions
      .map((q, idx) => (selectedAnswers[q.id] === undefined ? idx + 1 : -1))
      .filter((n) => n > 0);
    if (stillUnanswered.length === 0) {
      setUnansweredAlert(null);
    } else if (unansweredAlert) {
      setUnansweredAlert({ count: stillUnanswered.length, numbers: stillUnanswered });
    }
  }, [activeQuiz, selectedAnswers, quizSubmitted]);

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

  // Active Anti-Cheat, Anti-Screenshot/Recording & Focus Mode Listeners
  useEffect(() => {
    if (!examActivelyRunning || !isProctoringActive) return;

    viewportBaselineRef.current = {
      w: window.innerWidth,
      h: window.innerHeight,
      chromeW: Math.max(0, window.outerWidth - window.innerWidth),
      chromeH: Math.max(0, window.outerHeight - window.innerHeight),
    };

    // Push Focus Mode history trap so browser/Android Back button cannot exit the exam silently
    if (!focusHistoryLockedRef.current) {
      try {
        window.history.pushState({ examFocusLock: true, quizId: activeQuiz?.id }, '');
        focusHistoryLockedRef.current = true;
      } catch {}
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowFocused(false);
        setCaptureShieldActive(true);
        registerViolation(
          'تم الخروج من صفحة الامتحان أو فتح تطبيق/تبويب آخر',
          'Left exam page or switched tabs/apps',
          true
        );
      } else if (document.hasFocus()) {
        setIsWindowFocused(true);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowFocused(false);
      setCaptureShieldActive(true);
      registerViolation(
        'فقدان التركيز عن شاشة الامتحان أو محاولة فتح نافذة/تصوير الشاشة',
        'Exam window lost focus or screenshot/overlay tool opened',
        true
      );
    };

    const handleWindowFocus = () => {
      if (!document.hidden) {
        setIsWindowFocused(true);
      }
    };

    const handlePageHide = () => {
      setIsWindowFocused(false);
      setCaptureShieldActive(true);
      registerViolation(
        'محاولة مغادرة أو إخفاء صفحة الامتحان',
        'Attempted to leave or hide exam window',
        true
      );
    };

    const handleFreeze = () => {
      setIsWindowFocused(false);
      setCaptureShieldActive(true);
      registerViolation(
        'تم تجميد صفحة الامتحان أو التحويل لتطبيق آخر على الهاتف',
        'Exam page suspended or switched to another mobile app',
        true
      );
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      registerViolation(
        'محاولة إغلاق أو إعادة تحميل صفحة الامتحان أثناء تفعيل وضع التركيز',
        'Attempted to close or reload exam page during Focus Mode',
        true
      );
      return '';
    };

    const handlePopState = () => {
      if (cancelledRef.current) return;
      try {
        window.history.pushState({ examFocusLock: true, quizId: activeQuiz?.id }, '');
      } catch {}
      setConfirmExitOpen(true);
      registerViolation(
        'محاولة الضغط على زر الرجوع للخروج من وضع التركيز بالامتحان',
        'Attempted browser Back navigation out of Exam Focus Mode',
        true
      );
    };

    const handleResize = () => {
      const base = viewportBaselineRef.current;
      if (!base) return;
      const wRatio = base.w > 0 ? window.innerWidth / base.w : 1;
      const hRatio = base.h > 0 ? window.innerHeight / base.h : 1;
      const chromeW = Math.max(0, window.outerWidth - window.innerWidth);
      const chromeH = Math.max(0, window.outerHeight - window.innerHeight);
      const devToolsDockedDelta =
        chromeW - base.chromeW > 175 || chromeH - base.chromeH > 175;
      const splitScreenShrunk = wRatio < 0.72 || hRatio < 0.68;

      if (devToolsDockedDelta || splitScreenShrunk) {
        setCaptureShieldActive(true);
        registerViolation(
          devToolsDockedDelta
            ? 'تم رصد فتح أدوات المطور أو تغيير مساحة نافذة المتصفح أثناء الامتحان'
            : 'تم رصد فتح وضع تقسيم الشاشة أو تصغير نافذة الاختبار',
          devToolsDockedDelta
            ? 'Developer tools or browser dock detected during exam'
            : 'Split-screen or resized exam window detected',
          true
        );
      }
    };

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        wasFullscreenRef.current = true;
      } else if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        setCaptureShieldActive(true);
        registerViolation(
          'الخروج من وضع ملء الشاشة (Focus Mode) أثناء الامتحان',
          'Exited fullscreen Focus Mode during exam',
          true
        );
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    const handleClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      registerViolation(
        'محاولة نسخ أو قص أو لصق محتوى داخل صفحة الامتحان',
        'Attempted clipboard copy/cut/paste inside exam',
        false
      );
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleEnterPiP = (e: Event) => {
      e.preventDefault?.();
      setCaptureShieldActive(true);
      registerViolation(
        'تم منع محاولة تشغيل نافذة عائمة (Picture-in-Picture) أثناء الامتحان',
        'Picture-in-Picture attempt blocked during exam',
        true
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const code = (e.code || '').toLowerCase();

      // Immediate synchronous screen blackout on Meta/OS screenshot modifier keys
      if (key === 'meta' || key === 'os' || code.includes('meta')) {
        setCaptureShieldActive(true);
      }

      const isPrintScreen =
        key === 'printscreen' || code === 'printscreen' || e.keyCode === 44;
      const isDevTools =
        key === 'f12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
        (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(key));
      const isSavePrintSelectCopy =
        (e.ctrlKey || e.metaKey) && ['p', 's', 'u', 'c', 'x', 'a'].includes(key);
      const isSystemScreenshotOrRec =
        ((e.metaKey || e.ctrlKey) && e.shiftKey && ['s', '3', '4', '5', '6', 'r'].includes(key)) ||
        (e.metaKey && ['g', 'r'].includes(key)) ||
        (e.altKey && isPrintScreen);

      if (isPrintScreen || isDevTools || isSavePrintSelectCopy || isSystemScreenshotOrRec) {
        e.preventDefault();
        e.stopPropagation();
        setCaptureShieldActive(true);
        if ((isPrintScreen || isSystemScreenshotOrRec) && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        registerViolation(
          isPrintScreen || isSystemScreenshotOrRec
            ? 'محاولة التقاط لقطة شاشة أو تشغيل تسجيل الشاشة أثناء الامتحان'
            : isDevTools
            ? 'محاولة فتح أدوات المطور (Inspect / DevTools) أثناء الامتحان'
            : 'محاولة طباعة أو حفظ أو نسخ محتوى أسئلة الامتحان',
          isPrintScreen || isSystemScreenshotOrRec
            ? 'Attempted screenshot or screen recording shortcut during exam'
            : isDevTools
            ? 'Attempted to open browser DevTools during exam'
            : 'Attempted to print, save, or copy exam questions',
          true
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const code = (e.code || '').toLowerCase();
      if (key === 'printscreen' || code === 'printscreen' || e.keyCode === 44) {
        setCaptureShieldActive(true);
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

    // Intercept window.print()
    const originalPrint = window.print;
    try {
      window.print = () => {
        setCaptureShieldActive(true);
        registerViolation(
          'تم حظر محاولة طباعة صفحة الامتحان',
          'Blocked attempt to print exam page',
          true
        );
      };
    } catch {}

    // Intercept navigator.mediaDevices.getDisplayMedia & screen-source getUserMedia
    let originalGetDisplayMedia: any = null;
    let originalGetUserMedia: any = null;
    const mediaDevicesObj = navigator.mediaDevices as any;
    if (mediaDevicesObj) {
      if (typeof mediaDevicesObj.getDisplayMedia === 'function') {
        try {
          originalGetDisplayMedia = mediaDevicesObj.getDisplayMedia;
          mediaDevicesObj.getDisplayMedia = () => {
            setCaptureShieldActive(true);
            registerViolation(
              'محاولة تشغيل تسجيل الشاشة أو مشاركتها (Screen Record/Share) أثناء الامتحان',
              'Attempted screen recording or screen share during exam',
              true
            );
            return Promise.reject(
              new Error(
                isEn
                  ? 'Screen recording is strictly blocked during active exams.'
                  : 'تسجيل ومشاركة الشاشة محظور تماماً أثناء الامتحان.'
              )
            );
          };
        } catch {}
      }

      if (typeof mediaDevicesObj.getUserMedia === 'function') {
        try {
          originalGetUserMedia = mediaDevicesObj.getUserMedia.bind(mediaDevicesObj);
          mediaDevicesObj.getUserMedia = (constraints: any) => {
            const videoConstraints = constraints?.video;
            const isScreenCaptureAttempt =
              videoConstraints &&
              typeof videoConstraints === 'object' &&
              (videoConstraints.chromeMediaSource ||
                videoConstraints.mediaSource === 'screen' ||
                videoConstraints.mediaSource === 'window' ||
                videoConstraints.displaySurface);
            if (isScreenCaptureAttempt) {
              setCaptureShieldActive(true);
              registerViolation(
                'محاولة التقاط أو بث شاشة الاختبار عبر وسائط المتصفح',
                'Screen capture media constraint blocked during exam',
                true
              );
              return Promise.reject(new Error('Screen capture blocked during exam.'));
            }
            return originalGetUserMedia(constraints);
          };
        } catch {}
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('freeze', handleFreeze);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('enterpictureinpicture', handleEnterPiP, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('freeze', handleFreeze);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('enterpictureinpicture', handleEnterPiP, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      try {
        window.print = originalPrint;
      } catch {}
      if (mediaDevicesObj && originalGetDisplayMedia) {
        try {
          mediaDevicesObj.getDisplayMedia = originalGetDisplayMedia;
        } catch {}
      }
      if (mediaDevicesObj && originalGetUserMedia) {
        try {
          mediaDevicesObj.getUserMedia = originalGetUserMedia;
        } catch {}
      }
    };
  }, [examActivelyRunning, isProctoringActive, registerViolation, isEn, activeQuiz?.id]);

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
    setCaptureShieldActive(false);
    setPrivacyCurtainReason(null);
    setIsWindowFocused(true);
    viewportBaselineRef.current = {
      w: window.innerWidth,
      h: window.innerHeight,
      chromeW: Math.max(0, window.outerWidth - window.innerWidth),
      chromeH: Math.max(0, window.outerHeight - window.innerHeight),
    };
    setExamConfirmed(true);
    if (
      activeQuiz.proctoringEnabled !== false &&
      typeof document.documentElement?.requestFullscreen === 'function'
    ) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          wasFullscreenRef.current = true;
        })
        .catch(() => {
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

        {/* Strict Focus Mode & Anti-Capture Highlights */}
        {isProctoringActive && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-start">
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 space-y-1">
              <div className="text-xs font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Strict Focus Mode' : 'وضع التركيز ومنع الخروج'}</span>
              </div>
              <p className="text-[11px] text-rose-700/90 dark:text-rose-300 leading-relaxed">
                {isEn
                  ? 'Browser Back, tab switching, split-screen, and exiting fullscreen are blocked.'
                  : 'يُمنع الرجوع أو تبديل التبويب أو تقسيم الشاشة أو الخروج من وضع ملء الشاشة.'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-1">
              <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Anti-Capture Shield' : 'حظر التصوير والتسجيل'}</span>
              </div>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300 leading-relaxed">
                {isEn
                  ? 'Auto-blackout on PrintScreen, screen recording, DevTools, or clipboard copy.'
                  : 'تعتيم فوري للشاشة مع علامة مائية عند محاولة التصوير أو تسجيل الشاشة أو النسخ.'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/70 space-y-1">
              <div className="text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Auto Admin Alerts' : 'تنبيه تلقائي للأدمن'}</span>
              </div>
              <p className="text-[11px] text-teal-800/90 dark:text-teal-300 leading-relaxed">
                {isEn
                  ? 'Every violation instantly alerts the admin and cancels the quiz at the strike limit.'
                  : 'يُرسل تنبيه فوري للمعلم مع كل مخالفة، ويُلغى الاختبار تلقائياً عند بلوغ الحد الأقصى.'}
              </p>
            </div>
          </div>
        )}

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
  const correctCount = quizSubmitted ? score : 0;
  const mistakesCount = quizSubmitted
    ? Math.max(0, activeQuiz.questions.length - correctCount)
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
    if (quizSubmitted) {
      window.setTimeout(() => {
        const el = document.getElementById(`exam-review-q-${idx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }
  };

  const handleResumeFocusMode = () => {
    setPrivacyCurtainReason(null);
    setCaptureShieldActive(false);
    setIsWindowFocused(true);
    if (
      examActivelyRunning &&
      isProctoringActive &&
      !document.fullscreenElement &&
      typeof document.documentElement?.requestFullscreen === 'function'
    ) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          wasFullscreenRef.current = true;
        })
        .catch(() => {});
    }
  };

  const handleConfirmExitNow = () => {
    if (examActivelyRunning && isProctoringActive && activeQuiz && onReportExamAlert) {
      const nextCount = Math.max(1, violationCountRef.current + 1);
      const exitReason = isEn
        ? 'Exited active Focus Mode exam page before submission'
        : 'مغادرة صفحة الاختبار قبل التسليم أثناء تفعيل وضع التركيز (Focus Mode)';
      const exitAlert: ExamSecurityAlert = {
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
        reasons: [...violationReasonsRef.current, exitReason],
        actionTaken: 'warning',
        resolved: false,
        createdAtDate: new Date().toISOString().split('T')[0],
      };
      try {
        Promise.resolve(onReportExamAlert(exitAlert)).catch(() => {});
      } catch {}
    }

    setConfirmExitOpen(false);
    setEnlargedQuizImage(null);
    setPrivacyCurtainReason(null);
    setCaptureShieldActive(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onExitQuiz();
  };

  const handleRequestExit = () => {
    if (quizSubmitted || isQuizCancelled) {
      handleConfirmExitNow();
      return;
    }
    setConfirmExitOpen(true);
  };

  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else if (typeof document.documentElement?.requestFullscreen === 'function') {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const getUnansweredIndices = () =>
    activeQuiz.questions
      .map((q, idx) => (selectedAnswers[q.id] === undefined ? idx : -1))
      .filter((idx) => idx >= 0);

  const handleJumpToNextUnanswered = () => {
    const indices = getUnansweredIndices();
    if (indices.length === 0) {
      setUnansweredAlert(null);
      return;
    }
    const nextAfterCurrent = indices.find((idx) => idx > currentQuestionIndex);
    const targetIdx = nextAfterCurrent !== undefined ? nextAfterCurrent : indices[0];
    setMobilePaletteOpen(true);
    jumpToQuestion(targetIdx);
  };

  const handleAttemptSubmit = () => {
    const indices = getUnansweredIndices();
    if (indices.length > 0) {
      setUnansweredAlert({
        count: indices.length,
        numbers: indices.map((i) => i + 1),
      });
      setMobilePaletteOpen(true);
      jumpToQuestion(indices[0]);
      return;
    }
    setUnansweredAlert(null);
    onSubmitQuiz();
  };

  const questionHeadingSize =
    examZoomLevel === 1.3
      ? 'text-xl sm:text-2xl leading-relaxed'
      : examZoomLevel === 1.15
      ? 'text-lg sm:text-xl leading-relaxed'
      : 'text-base sm:text-lg leading-relaxed';

  const formulaTextSize =
    examZoomLevel === 1.3
      ? 'text-base sm:text-lg'
      : examZoomLevel === 1.15
      ? 'text-sm sm:text-base'
      : 'text-xs sm:text-sm';

  const optionTextSize =
    examZoomLevel === 1.3
      ? 'text-base sm:text-lg'
      : examZoomLevel === 1.15
      ? 'text-[15px] sm:text-base'
      : 'text-sm sm:text-base';

  const zoomPercent = Math.round(examZoomLevel * 100);

  return (
    <div
      className={`max-w-5xl mx-auto space-y-4 relative ${
        examActivelyRunning && isProctoringActive ? 'exam-secure-surface rounded-3xl' : ''
      }`}
    >
      {/* Dynamic Multi-Row Anti-Photography Watermark Overlay */}
      {examActivelyRunning && isProctoringActive && !isContentObscured && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none fixed inset-0 z-30 overflow-hidden"
        >
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="absolute transition-all duration-1000 ease-in-out -rotate-12 text-slate-900/[0.065] dark:text-white/[0.065] font-mono font-extrabold text-xs sm:text-sm whitespace-nowrap"
              style={{
                top: `${(watermarkPos.top + row * 23) % 90}%`,
                left: `${(watermarkPos.left + row * 21) % 68}%`,
              }}
            >
              {currentUser.name} · {currentUser.phone || currentUser.email || currentUser.id} ·{' '}
              {activeQuiz.title} · FOCUS MODE
            </div>
          ))}
        </div>
      )}

      {/* Opaque Privacy & Anti-Capture Blackout Shield (Triggers synchronously on Blur / Tab Switch / Capture Keys) */}
      {isContentObscured && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[95] bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <EyeOff className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-700/70 text-xs font-mono font-extrabold text-rose-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? `FOCUS LOCK · STRIKE ${violationCount} / ${maxAllowedViolations}`
                  : `قفل وضع التركيز · مخالفة ${violationCount} من ${maxAllowedViolations}`}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              {isEn
                ? 'Exam Screen Shielded — Anti-Capture & Focus Lock'
                : 'تم تعتيم شاشة الاختبار تلقائياً — حماية ضد التصوير والخروج'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {privacyCurtainReason ||
                (isEn
                  ? 'Exam content is hidden whenever window focus is lost or screen capture is attempted.'
                  : 'يتم إخفاء الأسئلة فوراً عند فقدان التركيز أو محاولة تصوير/تسجيل الشاشة.')}{' '}
              {isEn
                ? `Reaching ${maxAllowedViolations} violations cancels your exam and notifies the teacher automatically.`
                : `تم إرسال تنبيه تلقائي للأدمن، وعند بلوغ (${maxAllowedViolations}) مخالفات سيتم إلغاء الامتحان تلقائياً.`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResumeFocusMode}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm cursor-pointer flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isEn
                ? 'Re-enter Focus Mode & Resume Exam'
                : 'تفعيل وضع التركيز واستئناف الامتحان'}
            </span>
          </button>
        </div>
      )}

      {/* Obscure actual question DOM underneath blackout shield so OS snapshots capture blank background */}
      <div className={isContentObscured ? 'opacity-0 invisible pointer-events-none select-none space-y-4' : 'space-y-4'}>
      {/* Top Quiz Header Bar (Dedicated Focus Mode Exam Header with Zoom + Timer + Confirm Exit) */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative z-10 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white truncate">
                {activeQuiz.title}
              </h3>
              {examActivelyRunning && isProctoringActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>{isEn ? 'Focus Mode Locked' : 'وضع التركيز المشدد'}</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 tabular-nums mt-0.5">
              <span>
                {isEn
                  ? `Q ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`
                  : `السؤال ${currentQuestionIndex + 1} من ${activeQuiz.questions.length}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-700 dark:text-teal-300 font-bold">
                {quizSubmitted
                  ? isEn
                    ? `Correct ${correctCount}/${activeQuiz.questions.length}`
                    : `الدرجة ${correctCount}/${activeQuiz.questions.length}`
                  : isEn
                  ? `Answered ${answeredCount}/${activeQuiz.questions.length}`
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
            {/* Exam Zoom Controls */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5"
              aria-label={isEn ? 'Exam zoom controls' : 'تكبير وتصغير خط الأسئلة'}
            >
              <button
                type="button"
                onClick={() =>
                  setExamZoomLevel((prev) => (prev === 1.3 ? 1.15 : 1))
                }
                disabled={examZoomLevel === 1}
                title={isEn ? 'Zoom Out' : 'تصغير الخط'}
                className="min-h-[36px] min-w-[34px] px-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setExamZoomLevel((prev) =>
                    prev === 1 ? 1.15 : prev === 1.15 ? 1.3 : 1
                  )
                }
                title={isEn ? 'Cycle zoom level' : 'نسبة التكبير الحالية (اضغط للتبديل)'}
                className="min-h-[36px] px-2 text-[11px] font-mono font-extrabold text-teal-700 dark:text-teal-300 tabular-nums cursor-pointer"
              >
                {zoomPercent}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setExamZoomLevel((prev) => (prev === 1 ? 1.15 : 1.3))
                }
                disabled={examZoomLevel === 1.3}
                title={isEn ? 'Zoom In' : 'تكبير الأسئلة والاختيارات'}
                className="min-h-[36px] min-w-[34px] px-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {typeof document !== 'undefined' &&
              typeof document.documentElement?.requestFullscreen === 'function' && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                title={
                  isFullscreenActive
                    ? isEn
                      ? 'Exit Fullscreen'
                      : 'إنهاء ملء الشاشة'
                    : isEn
                    ? 'Fullscreen Zoom Mode'
                    : 'تكبير ملء الشاشة'
                }
                className="hidden sm:inline-flex min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 items-center justify-center cursor-pointer"
              >
                {isFullscreenActive ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}

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
              onClick={handleRequestExit}
              className="min-h-[40px] px-3 sm:px-3.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer shrink-0"
            >
              {isEn ? 'Exit' : 'خروج'}
            </button>
          </div>
        </div>

        {/* Inline Exit Confirmation Banner (Zero Popup) */}
        {confirmExitOpen && !quizSubmitted && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-900 dark:text-rose-100 font-bold">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div>
                  {isEn
                    ? 'Confirm exiting the exam?'
                    : 'هل أنت متأكد من الخروج من الامتحان الآن؟'}
                </div>
                <div className="text-[11px] font-normal text-rose-700 dark:text-rose-300">
                  {isEn
                    ? `You solved ${answeredCount} of ${activeQuiz.questions.length} questions. Unsubmitted answers will be lost.`
                    : `قمت بحل ${answeredCount} من أصل ${activeQuiz.questions.length} سؤالاً، ولن تُحسب درجتك عند الخروج قبل التسليم.`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmExitOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold cursor-pointer"
              >
                {isEn ? 'Stay in Exam' : 'متابعة الامتحان'}
              </button>
              <button
                type="button"
                onClick={handleConfirmExitNow}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                {isEn ? 'Yes, Exit' : 'نعم، تأكيد الخروج'}
              </button>
            </div>
          </div>
        )}

        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              quizSubmitted ? 'bg-emerald-500' : 'bg-teal-600'
            }`}
            style={{
              width: `${Math.round(
                ((quizSubmitted ? correctCount : answeredCount) / totalQuestions) * 100
              )}%`,
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

          {/* Status Legend: neutral before submit, graded after submit */}
          {quizSubmitted ? (
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold tabular-nums">
              <div className="px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-center">
                <div>{isEn ? 'Correct' : 'إجابات صحيحة'}</div>
                <div className="font-mono text-xs">{correctCount}</div>
              </div>
              <div className="px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-center">
                <div>{isEn ? 'Wrong / Missed' : 'أخطاء / غير محلولة'}</div>
                <div className="font-mono text-xs">{mistakesCount}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold tabular-nums">
              <div className="px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-center">
                <div>{isEn ? 'Unopened' : 'لم يُفتح'}</div>
                <div className="font-mono text-xs">{unopenedCount}</div>
              </div>
              <div className="px-2 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-center">
                <div>{isEn ? 'Opened' : 'مفتوح بدون حل'}</div>
                <div className="font-mono text-xs">{openedUnansweredCount}</div>
              </div>
              <div className="px-2 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 text-center">
                <div>{isEn ? 'Selected' : 'تم الحل'}</div>
                <div className="font-mono text-xs">{answeredCount}</div>
              </div>
            </div>
          )}

          {/* Post-Submission Review Filter */}
          {quizSubmitted && (
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
                {isEn ? `Wrong (${mistakesCount})` : `الغلط (${mistakesCount})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewFilter('correct');
                  const firstRightIdx = activeQuiz.questions.findIndex(
                    (q) => selectedAnswers[q.id] === q.correctAnswer
                  );
                  if (firstRightIdx >= 0) jumpToQuestion(firstRightIdx);
                }}
                className={`flex-1 min-h-[36px] py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {isEn ? `Right (${correctCount})` : `الصح (${correctCount})`}
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
                const isCorrectAns = quizSubmitted && selectedAnswers[q.id] === q.correctAnswer;
                if (quizSubmitted && reviewFilter === 'mistakes' && isCorrectAns) {
                  return null;
                }
                if (quizSubmitted && reviewFilter === 'correct' && !isCorrectAns) {
                  return null;
                }
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isOpened = Boolean(visitedIds[q.id] || isCurrent);

                let squareClasses =
                  'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-teal-400';
                let statusText = isEn ? 'Unopened' : 'لم يُفتح بعد';

                if (quizSubmitted) {
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
                } else if (isAnswered) {
                  squareClasses =
                    'bg-teal-600 hover:bg-teal-700 text-white border-teal-700';
                  statusText = isEn ? 'Answer selected' : 'تم اختيار إجابة';
                } else if (isOpened) {
                  squareClasses = 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600';
                  statusText = isEn ? 'Opened, unanswered' : 'مفتوح بدون حل';
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
                      isCurrent && !quizSubmitted
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
              onClick={handleAttemptSubmit}
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

        {/* RIGHT PANEL: EITHER ACTIVE QUESTION (NO GRADING SHOWN) OR COMPLETE POST-SUBMIT REVIEW */}
        {quizSubmitted ? (
          <div className="lg:col-span-8 space-y-5">
            {/* Result Summary Banner */}
            {(() => {
              const percentage = Math.round((score / totalQuestions) * 100);
              const passThreshold = activeQuiz.passingScore ?? 60;
              const passed = percentage >= passThreshold;
              return (
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold ${
                          passed
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {passed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>
                          {passed
                            ? isEn
                              ? 'Passed Exam'
                              : 'ناجح ومجتاز للاختبار'
                            : isEn
                            ? 'Below Passing Score'
                            : `تحتاج ${passThreshold}% للنجاح`}
                        </span>
                      </span>
                      <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                        {isEn
                          ? 'Full Exam Review (All Correct & Wrong Answers)'
                          : 'المراجعة الشاملة لجميع أسئلة الامتحان (الصح والغلط)'}
                      </h3>
                    </div>

                    <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shrink-0">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {isEn ? 'Final Score' : 'النتيجة النهائية'}
                      </div>
                      <div
                        className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                          passed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {percentage}%
                      </div>
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {score} / {activeQuiz.questions.length}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats + Filter Pills + Actions */}
                  <div className="grid grid-cols-3 gap-2 text-center tabular-nums text-xs">
                    <button
                      type="button"
                      onClick={() => setReviewFilter('all')}
                      className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                        reviewFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isEn
                        ? `All Questions (${activeQuiz.questions.length})`
                        : `كل الأسئلة (${activeQuiz.questions.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter('correct')}
                      className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                        reviewFilter === 'correct'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isEn ? `Right (${correctCount})` : `الصح (${correctCount})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter('mistakes')}
                      className={`p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                        reviewFilter === 'mistakes'
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isEn ? `Wrong (${mistakesCount})` : `الغلط (${mistakesCount})`}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onStartQuiz(activeQuiz)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isEn ? 'Retake Quiz' : 'إعادة الامتحان'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onExitQuiz}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold cursor-pointer"
                    >
                      {isEn ? 'All Quizzes' : 'قائمة الامتحانات'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEnlargedQuizImage(null);
                        onGoToLectures();
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {isEn ? 'Go to Lectures' : 'الذهاب للحصص'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Complete Question-by-Question Review List (Right & Wrong) */}
            {(() => {
              const itemsToRender = activeQuiz.questions
                .map((q, idx) => ({ q, idx }))
                .filter(({ q }) => {
                  const isCorrectAns = selectedAnswers[q.id] === q.correctAnswer;
                  if (reviewFilter === 'mistakes') return !isCorrectAns;
                  if (reviewFilter === 'correct') return isCorrectAns;
                  return true;
                });

              if (itemsToRender.length === 0) {
                return (
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      {reviewFilter === 'mistakes'
                        ? isEn
                          ? 'No wrong answers — great job!'
                          : 'لا توجد أي أخطاء — ممتاز جداً!'
                        : isEn
                        ? 'No matching questions in this filter.'
                        : 'لا توجد أسئلة مطابقة لهذا الفلتر.'}
                    </div>
                  </div>
                );
              }

              return itemsToRender.map(({ q, idx }) => {
                const studentChoice = selectedAnswers[q.id];
                const isAnswered = studentChoice !== undefined;
                const isCorrectAns = studentChoice === q.correctAnswer;

                return (
                  <div
                    key={q.id || idx}
                    id={`exam-review-q-${idx}`}
                    className={`p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 space-y-4 ${
                      isCorrectAns
                        ? 'border-emerald-300/90 dark:border-emerald-800'
                        : 'border-rose-300/90 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-extrabold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {isEn
                          ? `Question ${idx + 1} / ${activeQuiz.questions.length}`
                          : `سؤال رقم ${idx + 1} من ${activeQuiz.questions.length}`}
                      </span>

                      {isCorrectAns ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Correct Answer' : 'إجابة صحيحة'}</span>
                        </span>
                      ) : isAnswered ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 text-xs font-extrabold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Wrong Answer' : 'إجابة خاطئة'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 text-xs font-extrabold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Not Answered' : 'لم يتم اختيار إجابة'}</span>
                        </span>
                      )}
                    </div>

                    {q.imageUrl && (
                      <div>
                        {enlargedQuizImage === q.imageUrl ? (
                          <div className="rounded-2xl border border-teal-500/40 bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {isEn ? `Question Image ${idx + 1}` : `صورة السؤال ${idx + 1}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEnlargedQuizImage(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{isEn ? 'Close' : 'إغلاق'}</span>
                              </button>
                            </div>
                            <img
                              src={q.imageUrl}
                              alt={`Question ${idx + 1}`}
                              className="w-full max-h-[70vh] object-contain mx-auto rounded-xl"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEnlargedQuizImage(q.imageUrl || null)}
                            className="group relative w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-zoom-in block"
                          >
                            <img
                              src={q.imageUrl}
                              alt={`Question ${idx + 1}`}
                              decoding="async"
                              className="w-full max-h-[340px] object-contain mx-auto"
                            />
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-bold absolute bottom-2 left-2">
                              <ZoomIn className="w-3 h-3" />
                              <span>{isEn ? 'Enlarge' : 'تكبير'}</span>
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {q.question?.trim() && (
                      <h4 className={`${questionHeadingSize} font-bold text-slate-900 dark:text-white`}>
                        {q.question}
                      </h4>
                    )}

                    {q.formula?.trim() && (
                      <div
                        dir="ltr"
                        className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 ${formulaTextSize} font-mono text-teal-800 dark:text-teal-300 text-center font-bold`}
                      >
                        {q.formula}
                      </div>
                    )}

                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isRightOpt = q.correctAnswer === oIdx;
                        const isStudentOpt = studentChoice === oIdx;

                        let optClass =
                          'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400';
                        let tagLabel: string | null = null;
                        let tagClass = '';

                        if (isRightOpt && isStudentOpt) {
                          optClass =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-bold';
                          tagLabel = isEn ? 'Your Correct Answer' : 'إجابتك الصحيحة ✓';
                          tagClass =
                            'bg-emerald-600 text-white';
                        } else if (isRightOpt) {
                          optClass =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-bold';
                          tagLabel = isEn ? 'Correct Answer' : 'الإجابة الصحيحة ✓';
                          tagClass =
                            'bg-emerald-600 text-white';
                        } else if (isStudentOpt) {
                          optClass =
                            'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 font-bold';
                          tagLabel = isEn ? 'Your Choice' : 'إجابتك الخاطئة ✗';
                          tagClass =
                            'bg-rose-600 text-white';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`w-full p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${optClass}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-lg border border-current/25 flex items-center justify-center text-xs shrink-0 font-mono font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className={optionTextSize}>{opt}</span>
                            </div>

                            {tagLabel && (
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shrink-0 ${tagClass}`}>
                                {tagLabel}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Side-by-side summary when wrong or skipped */}
                    {!isCorrectAns && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold">
                          <span className="opacity-80">{isEn ? 'Your answer: ' : 'إجابتك: '}</span>
                          <span>
                            {isAnswered
                              ? q.options[studentChoice] || '—'
                              : isEn
                              ? 'Not answered'
                              : 'لم يتم الحل'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold">
                          <span className="opacity-80">{isEn ? 'Correct answer: ' : 'الإجابة الصحيحة: '}</span>
                          <span>{q.options[q.correctAnswer] || '—'}</span>
                        </div>
                      </div>
                    )}

                    {/* Scientific Explanation */}
                    {(q.explanation?.trim() || !isCorrectAns) && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1 text-start">
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 shrink-0" />
                          <span>{isEn ? 'Scientific Explanation:' : 'التفسير العلمي:'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {q.explanation?.trim() ||
                            (isEn
                              ? 'Review the model answer highlighted in green above.'
                              : 'راجع الإجابة النموذجية الموضحة باللون الأخضر أعلاه.')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          currentQuestion && (
            <div className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              {/* Redirect Prompt when student tries to submit with unanswered questions */}
              {unansweredAlert && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div>
                          {isEn
                            ? `${unansweredAlert.count} unanswered question(s) remaining`
                            : `يوجد ${unansweredAlert.count} سؤال لم تقم بحله بعد — تم توجيهك إليه`}
                        </div>
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mt-0.5 font-mono">
                          {isEn
                            ? `Questions: ${unansweredAlert.numbers.join(', ')}`
                            : `أرقام الأسئلة غير المحلولة: ${unansweredAlert.numbers.join(' ، ')}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnansweredAlert(null)}
                      aria-label={isEn ? 'Dismiss notice' : 'إغلاق التنبيه'}
                      className="p-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleJumpToNextUnanswered}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {isEn ? 'Go to Next Unanswered' : 'الانتقال للسؤال التالي غير المحلول'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUnansweredAlert(null);
                        onSubmitQuiz();
                      }}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs font-bold cursor-pointer"
                    >
                      {isEn ? 'Submit Anyway' : 'تسليم الامتحان على أي حال'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold font-mono tabular-nums text-teal-700 dark:text-teal-300">
                  {isEn
                    ? `Question ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`
                    : `سؤال رقم ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`}
                </span>

                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold ${
                    selectedAnswers[currentQuestion.id] !== undefined
                      ? 'text-teal-700 dark:text-teal-300'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {selectedAnswers[currentQuestion.id] !== undefined ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Choice saved (editable until submit)' : 'تم حفظ اختيارك (التصحيح بعد التسليم)'}</span>
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
                <h4 className={`${questionHeadingSize} font-bold text-slate-900 dark:text-white transition-all`}>
                  {currentQuestion.question}
                </h4>
              )}

              {currentQuestion.formula?.trim() && (
                <div
                  dir="ltr"
                  className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 ${formulaTextSize} font-mono text-teal-800 dark:text-teal-300 text-center font-bold`}
                >
                  {currentQuestion.formula}
                </div>
              )}

              {/* Answer Options — strictly neutral selection state during active exam (no right/wrong hint) */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, oIdx) => {
                  const qId = currentQuestion.id;
                  const isSelected = selectedAnswers[qId] === oIdx;

                  const optionStyle = isSelected
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-950 dark:text-teal-100 font-bold ring-1 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:border-teal-400';

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => onSelectAnswer(qId, oIdx)}
                      className={`w-full min-h-[52px] text-start p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <span className={optionTextSize}>{opt}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-extrabold">
                            {isEn ? 'Selected' : 'اختيارك'}
                          </span>
                        )}
                        <span
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-bold ${
                            isSelected
                              ? 'border-teal-600 bg-teal-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

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

                {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleAttemptSubmit}
                    className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
                  >
                    {remainingUnanswered > 0
                      ? isEn
                        ? `Submit (${remainingUnanswered} unanswered)`
                        : `تسليم الامتحان (متبقي ${remainingUnanswered})`
                      : isEn
                      ? 'Submit & View Review'
                      : 'تسليم الامتحان وعرض المراجعة'}
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
                )}
              </div>
            </div>
          )
        )}
      </div>
      </div>
    </div>
  );
};
