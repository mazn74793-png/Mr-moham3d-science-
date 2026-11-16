import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Quiz, UserProfile } from '../../types';

interface QuizRunnerProps {
  lang: string;
  currentUser: UserProfile;
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
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  lang,
  currentUser,
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
}) => {
  const isEn = lang === 'en';
  const [enlargedQuizImage, setEnlargedQuizImage] = useState<string | null>(null);
  // Track which question IDs the student has opened/visited in the current attempt
  const [visitedIds, setVisitedIds] = useState<Record<string, boolean>>({});
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'mistakes'>('all');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const autoSubmittedQuizIdRef = useRef<string | null>(null);

  const PrevChevron = isEn ? ChevronLeft : ChevronRight;
  const NextChevron = isEn ? ChevronRight : ChevronLeft;

  // Reset visited tracking & countdown timer when starting a new quiz
  useEffect(() => {
    if (!activeQuiz) {
      setVisitedIds({});
      setReviewFilter('all');
      setSecondsLeft(0);
      autoSubmittedQuizIdRef.current = null;
      return;
    }
    const firstQ = activeQuiz.questions[0];
    setVisitedIds(firstQ ? { [firstQ.id]: true } : {});
    setReviewFilter('all');
    const mins = Math.max(1, Number(activeQuiz.durationMinutes) || 15);
    setSecondsLeft(mins * 60);
    autoSubmittedQuizIdRef.current = null;
  }, [activeQuiz?.id]);

  // Live countdown timer during active unsubmitted attempt
  useEffect(() => {
    if (!activeQuiz || quizSubmitted) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (autoSubmittedQuizIdRef.current !== activeQuiz.id) {
            autoSubmittedQuizIdRef.current = activeQuiz.id;
            window.setTimeout(() => onSubmitQuiz(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeQuiz, quizSubmitted, onSubmitQuiz]);

  // Arrow-key question navigation for faster exam flow
  useEffect(() => {
    if (!activeQuiz) return;
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
  }, [activeQuiz, currentQuestionIndex, isEn, onQuestionIndexChange]);

  // Mark currently viewed question as opened/visited
  useEffect(() => {
    if (!activeQuiz) return;
    const activeQ = activeQuiz.questions[currentQuestionIndex];
    if (!activeQ) return;
    setVisitedIds((prev) => (prev[activeQ.id] ? prev : { ...prev, [activeQ.id]: true }));
  }, [activeQuiz, currentQuestionIndex]);

  if (!activeQuiz) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isEn ? 'Online Quizzes & Assessments' : 'الامتحانات الإلكترونية'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isEn
              ? 'Instant grading, scientific explanations, and a color-coded question map for quick review.'
              : 'تصحيح فوري وتفسير علمي لكل سؤال مع خريطة أرقام الأسئلة لسهولة التنقل والمراجعة.'}
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
              const isPassed =
                currentUser.passedQuizIds?.includes(quiz.id) ||
                (quizScore !== undefined && quizScore >= 60);

              return (
                <div
                  key={quiz.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover-card-lift animate-fade-in-up flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="font-semibold text-teal-700 dark:text-teal-400 truncate">
                        {quiz.chapter}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {quiz.durationMinutes} {isEn ? 'min' : 'دقيقة'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {quiz.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>
                        {quiz.questions.length} {isEn ? 'questions' : 'سؤال'}
                      </span>
                      <span aria-hidden="true">·</span>
                      {quizScore !== undefined ? (
                        <span
                          className={`font-bold ${
                            isPassed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isEn
                            ? `Score ${quizScore}% (${isPassed ? 'Passed' : 'Retake needed'})`
                            : `درجتك ${quizScore}% (${isPassed ? 'ناجح' : 'إعادة مطلوبة'})`}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {isEn ? 'Not attempted yet' : 'لم يُحل بعد'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartQuiz(quiz)}
                    className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isPassed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      {quizScore !== undefined
                        ? isEn
                          ? 'Retake Quiz'
                          : 'إعادة الامتحان'
                        : isEn
                        ? 'Start Quiz'
                        : 'بدء الامتحان'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const score = calculateScore();
  const totalQuestions = Math.max(1, activeQuiz.questions.length);

  // Classify every question into 1 of the 3 states:
  // 1) 'answered' -> Green
  // 2) 'opened_unanswered' -> Red
  // 3) 'unopened' -> Plain neutral
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
  const isTimerLow = !quizSubmitted && secondsLeft > 0 && secondsLeft <= 120;

  const jumpToQuestion = (idx: number) => {
    setEnlargedQuizImage(null);
    onQuestionIndexChange(idx);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Quiz Header Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
              {activeQuiz.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 tabular-nums mt-0.5">
              <span>
                {isEn
                  ? `Question ${currentQuestionIndex + 1} of ${activeQuiz.questions.length}`
                  : `السؤال ${currentQuestionIndex + 1} من ${activeQuiz.questions.length}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {isEn
                  ? `Solved ${answeredCount} / ${activeQuiz.questions.length}`
                  : `تم حل ${answeredCount} / ${activeQuiz.questions.length}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!quizSubmitted && (
              <div
                dir="ltr"
                className={`min-h-[40px] px-3 rounded-xl border text-xs font-mono font-extrabold tabular-nums flex items-center gap-1.5 ${
                  isTimerLow
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isTimerLow ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`} />
                <span>{timerMinutes}:{timerSeconds}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEnlargedQuizImage(null);
                onExitQuiz();
              }}
              className="min-h-[40px] px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
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

      {showQuizCelebration && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{showQuizCelebration}</span>
        </div>
      )}

      {/* Split Layout: Numbered Question Squares Navigator + Active Question Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* QUESTION NUMBER SQUARES PANEL */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
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
              className="lg:hidden text-[11px] font-bold text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 cursor-pointer"
            >
              {mobilePaletteOpen
                ? isEn
                  ? 'Hide Grid'
                  : 'إخفاء المربعات'
                : isEn
                ? 'Show Grid'
                : 'عرض المربعات'}
            </button>
          </div>

          {/* 3-Color Status Legend */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold tabular-nums">
            <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-center">
              <div>{isEn ? 'Unopened' : 'لم يُفتح'}</div>
              <div className="font-mono text-xs">{unopenedCount}</div>
            </div>
            <div className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-center">
              <div>{isEn ? 'Opened' : 'مفتوح بدون حل'}</div>
              <div className="font-mono text-xs">{openedUnansweredCount}</div>
            </div>
            <div className="px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center">
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
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isEn ? `All (${activeQuiz.questions.length})` : `الكل (${activeQuiz.questions.length})`}
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
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  reviewFilter === 'mistakes'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isEn ? `Mistakes (${mistakesCount})` : `الأخطاء (${mistakesCount})`}
              </button>
            </div>
          )}

          {/* Small Numbered Question Squares */}
          <div
            className={`${
              mobilePaletteOpen ? 'block' : 'hidden lg:block'
            } max-h-[200px] lg:max-h-[380px] overflow-y-auto pt-1 pb-1`}
          >
            <div className="flex flex-wrap gap-1.5">
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
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400';
                let statusText = isEn ? 'Unopened' : 'لم يُفتح بعد';

                if (isAnswered) {
                  if (quizSubmitted) {
                    const isCorrectAns = selectedAnswers[q.id] === q.correctAnswer;
                    squareClasses = isCorrectAns
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-rose-500 text-white border-rose-600';
                    statusText = isCorrectAns
                      ? isEn
                        ? 'Correct'
                        : 'إجابة صحيحة'
                      : isEn
                      ? 'Incorrect'
                      : 'إجابة خاطئة';
                  } else {
                    squareClasses =
                      'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600';
                    statusText = isEn ? 'Answered' : 'اتفتح واتحل';
                  }
                } else if (isOpened) {
                  squareClasses = 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600';
                  statusText = isEn ? 'Opened, unanswered' : 'اتفتح بس متحلش';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => jumpToQuestion(idx)}
                    aria-label={isEn ? `Question ${idx + 1} - ${statusText}` : `سؤال ${idx + 1} - ${statusText}`}
                    title={isEn ? `Question ${idx + 1}: ${statusText}` : `سؤال ${idx + 1}: ${statusText}`}
                    className={`w-9 h-9 rounded-lg border text-xs font-mono font-extrabold tabular-nums flex items-center justify-center transition-transform cursor-pointer shrink-0 ${squareClasses} ${
                      isCurrent
                        ? 'ring-2 ring-offset-2 ring-teal-500 dark:ring-offset-slate-900 scale-105'
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
              className="w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
            {/* Current Question Header Status */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold font-mono tabular-nums text-teal-700 dark:text-teal-300">
                {isEn
                  ? `Question ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`
                  : `سؤال رقم ${currentQuestionIndex + 1} / ${activeQuiz.questions.length}`}
              </span>

              <span
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  selectedAnswers[currentQuestion.id] !== undefined
                    ? 'text-emerald-600 dark:text-emerald-400'
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
                      className="w-full max-h-[420px] object-contain mx-auto"
                    />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-bold absolute bottom-2.5 left-2.5 group-hover:bg-teal-600 transition-colors">
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
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-teal-800 dark:text-teal-300 text-center font-bold"
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
                  'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:border-teal-400';
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
                    'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 font-bold';
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
                  <div dir="ltr" className="pt-1 text-xs font-mono text-amber-900 dark:text-amber-200 font-bold">
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
                className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
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
