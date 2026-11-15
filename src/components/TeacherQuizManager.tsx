import React, { useState } from 'react';
import {
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  X,
  Image as ImageIcon,
  Upload,
  Edit3,
  Copy,
  ChevronRight,
  ChevronLeft,
  Grid3X3,
} from 'lucide-react';
import { Quiz, QuizQuestion, GradeLevel, Lecture, CloudinaryConfig } from '../types';
import { DEFAULT_GRADES, GradeItem } from '../types/siteConfig';
import { uploadMediaFile, UploadProgressInfo } from '../utils/uploader';
import { UploadProgressBar } from './UploadProgressBar';
import { InlineMediaPreview } from './MediaPreview';

interface TeacherQuizManagerProps {
  quizzes: Quiz[];
  lectures: Lecture[];
  cloudinaryConfig?: CloudinaryConfig;
  grades?: GradeItem[];
  onAddQuiz: (newQuiz: Quiz) => Promise<boolean> | boolean | void;
  onUpdateQuiz?: (updatedQuiz: Quiz) => Promise<boolean> | boolean | void;
  onDeleteQuiz: (quizId: string) => Promise<boolean> | boolean | void;
}

function createEmptyQuestion(seed = 1): QuizQuestion {
  return {
    id: `q-${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 6)}`,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    formula: '',
  };
}

function isQuestionComplete(q: QuizQuestion): boolean {
  const hasPromptOrImage = Boolean(q.question?.trim() || q.imageUrl?.trim());
  const allOptionsFilled =
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((opt) => Boolean(opt && opt.trim()));
  return hasPromptOrImage && allOptionsFilled;
}

export const TeacherQuizManager: React.FC<TeacherQuizManagerProps> = ({
  quizzes,
  lectures,
  cloudinaryConfig,
  grades,
  onAddQuiz,
  onUpdateQuiz,
  onDeleteQuiz,
}) => {
  const resolvedGrades = grades && grades.length > 0 ? grades : DEFAULT_GRADES;
  const getGradeLabel = (gradeId?: string) => {
    if (!gradeId) return 'غير محدد';
    const found = resolvedGrades.find((g) => g.id === gradeId);
    return found?.badgeAr || found?.titleAr || gradeId;
  };

  const defaultGradeId =
    resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third';

  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Quiz Meta Form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizGrade, setQuizGrade] = useState<GradeLevel>(defaultGradeId);
  const [quizChapter, setQuizChapter] = useState('الباب الأول: العناصر الانتقالية');
  const [quizDuration, setQuizDuration] = useState<number>(15);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');

  // Question image upload state
  const [uploadingQuestionIdx, setUploadingQuestionIdx] = useState<number | null>(null);
  const [questionLocalPreviews, setQuestionLocalPreviews] = useState<Record<number, string>>({});
  const [questionUploadProgress, setQuestionUploadProgress] = useState<number>(0);
  const [questionUploadMeta, setQuestionUploadMeta] = useState<UploadProgressInfo | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Questions Builder State with active square + visited tracking (same 3 colors!)
  const [questions, setQuestions] = useState<QuizQuestion[]>([createEmptyQuestion(1)]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [visitedQuestionIds, setVisitedQuestionIds] = useState<Record<string, boolean>>({});

  const filteredQuizzes = quizzes.filter((q) =>
    filterGrade === 'all' ? true : q.grade === filterGrade
  );

  const availableLectures = lectures.filter((l) => l.grade === quizGrade);

  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizSuccess, setQuizSuccess] = useState<string | null>(null);
  const [deleteConfirmQuizId, setDeleteConfirmQuizId] = useState<string | null>(null);

  const openNewQuizBuilder = () => {
    const firstQ = createEmptyQuestion(1);
    setEditingQuizId(null);
    setQuizTitle('');
    setQuizGrade(defaultGradeId);
    setQuizChapter('الباب الأول: العناصر الانتقالية');
    setQuizDuration(15);
    setSelectedLectureId('');
    setQuestions([firstQ]);
    setActiveQuestionIdx(0);
    setVisitedQuestionIds({ [firstQ.id]: true });
    setQuizError(null);
    setShowBuilder(true);
  };

  const openEditQuizBuilder = (quiz: Quiz) => {
    const clonedQuestions: QuizQuestion[] =
      quiz.questions && quiz.questions.length > 0
        ? quiz.questions.map((q, idx) => ({
            id: q.id || `q-${Date.now()}-${idx + 1}`,
            question: q.question || '',
            options:
              Array.isArray(q.options) && q.options.length === 4
                ? [...q.options]
                : ['', '', '', ''],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            explanation: q.explanation || '',
            formula: q.formula || '',
            imageUrl: q.imageUrl || undefined,
          }))
        : [createEmptyQuestion(1)];

    const initialVisited: Record<string, boolean> = {};
    if (clonedQuestions[0]) initialVisited[clonedQuestions[0].id] = true;

    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title || '');
    setQuizGrade(quiz.grade || defaultGradeId);
    setQuizChapter(quiz.chapter || '');
    setQuizDuration(quiz.durationMinutes || 15);
    setSelectedLectureId(quiz.lectureId || '');
    setQuestions(clonedQuestions);
    setActiveQuestionIdx(0);
    setVisitedQuestionIds(initialVisited);
    setQuizError(null);
    setShowBuilder(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectQuestionIdx = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setActiveQuestionIdx(idx);
    const targetQ = questions[idx];
    if (targetQ) {
      setVisitedQuestionIds((prev) => ({ ...prev, [targetQ.id]: true }));
    }
  };

  const handleAddQuestionSlot = (count = 1) => {
    setQuizError(null);
    const created = Array.from({ length: count }, (_, i) =>
      createEmptyQuestion(questions.length + i + 1)
    );
    const nextIdx = questions.length;
    setQuestions((prev) => [...prev, ...created]);
    // Open the first newly added square automatically
    setActiveQuestionIdx(nextIdx);
    if (created[0]) {
      setVisitedQuestionIds((prev) => ({ ...prev, [created[0].id]: true }));
    }
  };

  const handleDuplicateQuestion = (idx: number) => {
    const src = questions[idx];
    if (!src) return;
    const copy: QuizQuestion = {
      ...src,
      id: `q-${Date.now()}-dup-${Math.random().toString(36).slice(2, 6)}`,
      options: [...src.options],
    };
    const nextList = [...questions.slice(0, idx + 1), copy, ...questions.slice(idx + 1)];
    setQuestions(nextList);
    setActiveQuestionIdx(idx + 1);
    setVisitedQuestionIds((prev) => ({ ...prev, [copy.id]: true }));
  };

  const handleRemoveQuestionSlot = (idx: number) => {
    if (questions.length <= 1) {
      setQuizError('يجب أن يحتوي الامتحان على سؤال واحد على الأقل.');
      return;
    }
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    const clampedIdx = Math.min(idx, next.length - 1);
    setActiveQuestionIdx(clampedIdx);
    if (next[clampedIdx]) {
      setVisitedQuestionIds((prev) => ({ ...prev, [next[clampedIdx].id]: true }));
    }
  };

  const handleUpdateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (!copy[idx]) return prev;
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (!copy[qIdx]) return prev;
      const opts = [...copy[qIdx].options];
      opts[oIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  const handleQuestionImageUpload = async (qIdx: number, file: File) => {
    setQuizError(null);
    const localUrl = URL.createObjectURL(file);
    setQuestionLocalPreviews((prev) => ({ ...prev, [qIdx]: localUrl }));
    setUploadingQuestionIdx(qIdx);
    setQuestionUploadProgress(0);
    setQuestionUploadMeta(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName: cloudinaryConfig?.cloudName || 'chemistry-egypt',
        uploadPreset: cloudinaryConfig?.uploadPreset || 'chemistry_uploads',
        resourceType: 'image',
        onProgress: (percent, info) => {
          setQuestionUploadProgress(percent);
          setQuestionUploadMeta(info);
        },
      });
      handleUpdateQuestion(qIdx, 'imageUrl', result.url);
    } catch (err: any) {
      setQuizError(err?.message || `فشل رفع صورة السؤال رقم ${qIdx + 1}`);
    } finally {
      URL.revokeObjectURL(localUrl);
      setQuestionLocalPreviews((prev) => {
        const copy = { ...prev };
        delete copy[qIdx];
        return copy;
      });
      setUploadingQuestionIdx(null);
      setQuestionUploadProgress(0);
      setQuestionUploadMeta(null);
    }
  };

  const handleQuickFillOptions = (qIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (!copy[qIdx]) return prev;
      copy[qIdx] = { ...copy[qIdx], options: ['أ', 'ب', 'ج', 'د'] };
      return copy;
    });
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError(null);

    if (uploadingQuestionIdx !== null) {
      setQuizError('يرجى الانتظار حتى يكتمل رفع صورة السؤال قبل حفظ الامتحان.');
      return;
    }

    if (!quizTitle.trim()) {
      setQuizError('يرجى كتابة عنوان الامتحان الإلكتروني.');
      return;
    }

    // Validate every question and jump automatically to first incomplete one!
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim() && !q.imageUrl?.trim()) {
        selectQuestionIdx(i);
        setQuizError(`يرجى كتابة نص السؤال رقم ${i + 1} أو رفع صورة للسؤال.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          selectQuestionIdx(i);
          setQuizError(`يرجى ملء جميع الخيارات الأربعة للسؤال رقم ${i + 1}.`);
          return;
        }
      }
    }

    const payloadQuiz: Quiz = {
      id: editingQuizId || `quiz-${Date.now()}`,
      title: quizTitle.trim(),
      grade: quizGrade,
      chapter: quizChapter.trim() || 'كيمياء عامة',
      durationMinutes: Number(quizDuration) || 15,
      lectureId: selectedLectureId || undefined,
      questions,
    };

    setSavingQuiz(true);
    try {
      const saved =
        editingQuizId && onUpdateQuiz
          ? await onUpdateQuiz(payloadQuiz)
          : await onAddQuiz(payloadQuiz);

      if (saved === false) {
        setQuizError('تعذر حفظ الامتحان في قاعدة البيانات. تحقق من الاتصال وصلاحيات المشرف.');
        return;
      }

      setQuizSuccess(
        editingQuizId
          ? `تم تحديث امتحان (${payloadQuiz.title}) وجميع أسئلته في السحابة بنجاح!`
          : 'تم حفظ وإضافة الامتحان بنجاح إلى بنك الأسئلة والمنصة!'
      );
      setTimeout(() => setQuizSuccess(null), 4000);

      setEditingQuizId(null);
      setQuizTitle('');
      setShowBuilder(false);
    } finally {
      setSavingQuiz(false);
    }
  };

  const activeQ = questions[activeQuestionIdx] || questions[0];

  // Builder square counts: Green (complete), Red (opened/incomplete), Plain (unopened/incomplete)
  let completedSlots = 0;
  let openedIncompleteSlots = 0;
  let unopenedSlots = 0;
  questions.forEach((q, idx) => {
    const complete = isQuestionComplete(q);
    const opened = Boolean(visitedQuestionIds[q.id] || idx === activeQuestionIdx);
    if (complete) completedSlots++;
    else if (opened) openedIncompleteSlots++;
    else unopenedSlots++;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banners */}
      {quizError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-between gap-2">
          <span>{quizError}</span>
          <button
            type="button"
            onClick={() => setQuizError(null)}
            className="text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
      {quizSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
          <span>{quizSuccess}</span>
          <button
            type="button"
            onClick={() => setQuizSuccess(null)}
            className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام بنك الأسئلة والتصحيح التلقائي</span>
          </div>
          <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
            بنك الأسئلة والاختبارات الإلكترونية (MCQs)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            أنشئ امتحانات بأي عدد من الأسئلة أو عدّل أي امتحان أو سؤال منشور مسبقاً مباشرة من خلال شبكة أرقام الأسئلة.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showBuilder) {
              setShowBuilder(false);
              setEditingQuizId(null);
            } else {
              openNewQuizBuilder();
            }
          }}
          className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {showBuilder ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showBuilder ? 'إغلاق المحرر' : '+ إنشاء امتحان جديد'}</span>
        </button>
      </div>

      {/* CREATE / EDIT QUIZ BUILDER */}
      {showBuilder && (
        <form
          onSubmit={handleSubmitQuiz}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border-2 border-teal-500/30 shadow-xl space-y-6 text-right"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>
                {editingQuizId
                  ? `تعديل الامتحان والأسئلة: ${quizTitle || 'امتحان'}`
                  : 'إعدادات الامتحان الجديد'}
              </span>
            </h3>
            {editingQuizId && (
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                وضع التعديل على امتحان منشور
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                عنوان الامتحان / الكويز *
              </label>
              <input
                type="text"
                required
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="مثال: كويز الحصة 2: ألوان وأكاسيد الحديد والمغناطيسية"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الصف الدراسي *
              </label>
              <select
                value={quizGrade}
                onChange={(e) => setQuizGrade(e.target.value as GradeLevel)}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                الوقت المحدد (بالدقائق) *
              </label>
              <input
                type="number"
                min={5}
                max={300}
                required
                value={quizDuration}
                onChange={(e) => setQuizDuration(Number(e.target.value))}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                اسم الباب / الفصل
              </label>
              <input
                type="text"
                value={quizChapter}
                onChange={(e) => setQuizChapter(e.target.value)}
                placeholder="مثال: الباب الأول: العناصر الانتقالية"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                المحاضرة المرتبطة بهذا الكويز (لفك قفل التالية)
              </label>
              <select
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">بدون ربط مباشر (امتحان عام)</option>
                {availableLectures.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    الحصة {lec.sessionOrder || 1}: {lec.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3-COLOR QUESTION SQUARES NAVIGATOR IN BUILDER */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                <Grid3X3 className="w-4 h-4 text-teal-600" />
                <span>مربعات أرقام الأسئلة ({questions.length} سؤال)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestionSlot(1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ سؤال جديد</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionSlot(5)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  + 5 أسئلة سريعة
                </button>
              </div>
            </div>

            {/* 3-Color Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold tabular-nums">
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                <span>لم يُفتح ({unopenedSlots})</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <span className="w-3 h-3 rounded bg-rose-500" />
                <span>مفتوح وغير مكتمل ({openedIncompleteSlots})</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>مكتمل وجاهز ({completedSlots})</span>
              </span>
            </div>

            {/* Numbered Squares Grid */}
            <div className="max-h-[180px] overflow-y-auto pt-1 pb-1">
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === activeQuestionIdx;
                  const complete = isQuestionComplete(q);
                  const opened = Boolean(visitedQuestionIds[q.id] || isCurrent);

                  let squareStyle =
                    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
                  let title = 'لم يُفتح بعد';
                  if (complete) {
                    squareStyle = 'bg-emerald-500 text-white border-emerald-600';
                    title = 'مكتمل وجاهز';
                  } else if (opened) {
                    squareStyle = 'bg-rose-500 text-white border-rose-600';
                    title = 'مفتوح ولم تكتمل بياناته';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => selectQuestionIdx(idx)}
                      title={`سؤال ${idx + 1}: ${title}`}
                      className={`w-9 h-9 rounded-lg border text-xs font-mono font-extrabold tabular-nums flex items-center justify-center cursor-pointer transition-transform shrink-0 ${squareStyle} ${
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
          </div>

          {/* ACTIVE QUESTION EDITOR PANEL */}
          {activeQ && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-teal-600 text-white">
                    تحرير سؤال رقم {activeQuestionIdx + 1} من {questions.length}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isQuestionComplete(activeQ)
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isQuestionComplete(activeQ) ? 'مكتمل' : 'أضف نص/صورة + 4 خيارات'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDuplicateQuestion(activeQuestionIdx)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-400 flex items-center gap-1 cursor-pointer"
                    title="نسخ هذا السؤال لسؤال جديد"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>تكرار</span>
                  </button>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionSlot(activeQuestionIdx)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                      title="حذف هذا السؤال"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Image Upload */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-teal-300 dark:border-teal-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>صورة السؤال (اختياري):</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`question-img-${activeQuestionIdx}`}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        uploadingQuestionIdx === activeQuestionIdx
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{activeQ.imageUrl ? 'تغيير الصورة' : 'رفع صورة السؤال'}</span>
                    </label>
                    <input
                      id={`question-img-${activeQuestionIdx}`}
                      type="file"
                      accept="image/*"
                      disabled={uploadingQuestionIdx !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) handleQuestionImageUpload(activeQuestionIdx, f);
                      }}
                      className="hidden"
                    />

                    {activeQ.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(activeQuestionIdx, 'imageUrl', '')}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 cursor-pointer"
                      >
                        حذف الصورة
                      </button>
                    )}
                  </div>
                </div>

                {uploadingQuestionIdx === activeQuestionIdx && (
                  <UploadProgressBar
                    label={`جاري رفع صورة السؤال رقم ${activeQuestionIdx + 1}...`}
                    progress={questionUploadProgress}
                    meta={questionUploadMeta}
                  />
                )}

                {(questionLocalPreviews[activeQuestionIdx] || activeQ.imageUrl) && (
                  <div className="pt-1">
                    <InlineMediaPreview
                      url={questionLocalPreviews[activeQuestionIdx] || activeQ.imageUrl}
                      title={`صورة السؤال رقم ${activeQuestionIdx + 1}`}
                      kind="image"
                      compact
                    />
                  </div>
                )}
              </div>

              {/* Question Prompt */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  نص السؤال الكيميائي (اختياري في حالة رفع صورة)
                </label>
                <textarea
                  rows={2}
                  value={activeQ.question}
                  onChange={(e) => handleUpdateQuestion(activeQuestionIdx, 'question', e.target.value)}
                  placeholder="اكتب نص السؤال هنا أو اكتفِ برفع صورة السؤال بالأعلى..."
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Formula */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  معادلة كيميائية مرافقة (اختياري)
                </label>
                <input
                  type="text"
                  value={activeQ.formula || ''}
                  onChange={(e) => handleUpdateQuestion(activeQuestionIdx, 'formula', e.target.value)}
                  placeholder="مثال: FeSO4 + 2NaOH -> Fe(OH)2 + Na2SO4"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-right"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    خيارات الإجابة (اختر الدائرة بجانب الإجابة الصحيحة):
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickFillOptions(activeQuestionIdx)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    تعبئة خيارات أ / ب / ج / د تلقائياً
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeQ.options.map((opt, oIdx) => {
                    const isCorrect = activeQ.correctAnswer === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-answer-${activeQuestionIdx}`}
                          checked={isCorrect}
                          onChange={() =>
                            handleUpdateQuestion(activeQuestionIdx, 'correctAnswer', oIdx)
                          }
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {String.fromCharCode(65 + oIdx)}:
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            handleUpdateOption(activeQuestionIdx, oIdx, e.target.value)
                          }
                          placeholder={`الخيار ${oIdx + 1}`}
                          className="flex-1 p-1 text-xs bg-transparent focus:outline-none"
                        />
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-600 font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 shrink-0">
                            صحيحة ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>تفسير الإجابة النموذجية (يظهر للطالب بعد التصحيح):</span>
                </label>
                <textarea
                  rows={2}
                  value={activeQ.explanation}
                  onChange={(e) =>
                    handleUpdateQuestion(activeQuestionIdx, 'explanation', e.target.value)
                  }
                  placeholder="اكتب التفسير العلمي الدقيق ليفهم الطالب سبب الإجابة..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Previous / Next Question Switcher */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  disabled={activeQuestionIdx === 0}
                  onClick={() => selectQuestionIdx(activeQuestionIdx - 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السؤال السابق</span>
                </button>

                {activeQuestionIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => selectQuestionIdx(activeQuestionIdx + 1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 cursor-pointer flex items-center gap-1"
                  >
                    <span>السؤال التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddQuestionSlot(1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة السؤال التالي</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowBuilder(false);
                setEditingQuizId(null);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={savingQuiz || uploadingQuestionIdx !== null}
              className="px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {savingQuiz
                  ? 'جاري الحفظ...'
                  : editingQuizId
                  ? 'حفظ تعديلات الامتحان والأسئلة'
                  : 'حفظ ونشر الامتحان على المنصة'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* FILTER & QUIZZES LIST WITH EDIT BUTTON */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold font-kufi text-slate-900 dark:text-white">
            قائمة الامتحانات في بنك الأسئلة ({filteredQuizzes.length})
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterGrade('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGrade === 'all'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              الكل ({quizzes.length})
            </button>
            {resolvedGrades.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setFilterGrade(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterGrade === g.id
                    ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {g.badgeAr}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredQuizzes.map((quiz) => {
            const connectedLec = lectures.find((l) => l.id === quiz.lectureId);
            return (
              <div
                key={quiz.id}
                className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 text-right">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold font-mono">
                      {getGradeLabel(quiz.grade)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {quiz.durationMinutes} دقيقة
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {quiz.questions.length} سؤال
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-white font-kufi">
                    {quiz.title}
                  </h4>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>الباب: {quiz.chapter}</span>
                    {connectedLec && (
                      <>
                        <span>·</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">
                          مرتبط بـ: الحصة {connectedLec.sessionOrder || 1} ({connectedLec.title})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditQuizBuilder(quiz)}
                    className="px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="تعديل الامتحان والأسئلة"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل الامتحان والأسئلة</span>
                  </button>

                  {deleteConfirmQuizId === quiz.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteQuiz(quiz.id);
                          setDeleteConfirmQuizId(null);
                          setQuizSuccess(`تم حذف امتحان (${quiz.title}) بنجاح.`);
                          setTimeout(() => setQuizSuccess(null), 3000);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        تأكيد الحذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmQuizId(null)}
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmQuizId(quiz.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="حذف الامتحان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredQuizzes.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">
              لا توجد امتحانات مسجلة لهذا التصنيف بعد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
