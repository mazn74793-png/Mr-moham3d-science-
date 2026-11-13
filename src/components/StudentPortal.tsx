import React, { useState, useEffect } from 'react';
import {
  Play,
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
  HelpCircle,
  Lock,
  AlertTriangle,
  Trophy,
  Atom,
  LayoutDashboard,
  ZoomIn,
  X,
} from 'lucide-react';
import { Lecture, Quiz, AttachmentFile, GradeLevel, UserProfile } from '../types';
import { SiteConfig, getResolvedGrades, getGradeDisplayName } from '../types/siteConfig';
import { SecureVideoPlayer } from './SecureVideoPlayer';
import { useLanguage } from '../context/LanguageContext';

interface StudentPortalProps {
  currentUser: UserProfile | null;
  lectures: Lecture[];
  quizzes: Quiz[];
  attachments: AttachmentFile[];
  siteConfig?: SiteConfig;
  onBackToHome: () => void;
  onOpenTeacherDashboard: () => void;
  onUpdateStudentProfile?: (updatedUser: UserProfile) => void;
}

const TRANSITION_ELEMENTS = [
  { sym: 'Sc', num: 21, name: 'سكانديوم', conf: '[Ar] 4s² 3d¹', ox: '+3', note: 'عنصر نادر شديد الصلابة وخفيف الوزن، يُستخدم في سبائك الطائرات المقاتلة.' },
  { sym: 'Ti', num: 22, name: 'تيتانيوم', conf: '[Ar] 4s² 3d²', ox: '+2, +3, +4', note: 'لا يرفضه الجسم البشري، يُستخدم في زراعة الأسنان والمفاصل الصناعية.' },
  { sym: 'V', num: 23, name: 'فاناديوم', conf: '[Ar] 4s² 3d³', ox: '+2, +3, +4, +5', note: 'يُضاف للصلب لصناعة زنبركات السيارات لمقاومة التآكل والصلابة العالية.' },
  { sym: 'Cr', num: 24, name: 'كروم', conf: '[Ar] 4s¹ 3d⁵ (شاذ)', ox: '+2, +3, +6', note: 'شاذ في التوزيع الإلكتروني لأن المستوى 3d نصف ممتلئ يكون أكثر استقراراً.' },
  { sym: 'Mn', num: 25, name: 'منجنيز', conf: '[Ar] 4s² 3d⁵', ox: '+2 إلى +7', note: 'هش جداً في حالته النقية لذلك يُستخدم دائماً في صورة سبائك مثل سبيكة خطوط السكك الحديدية.' },
  { sym: 'Fe', num: 26, name: 'حديد', conf: '[Ar] 4s² 3d⁶', ox: '+2, +3', note: 'عصب الصناعات الثقيلة وأكثر عناصر السلسلة الانتقالية الأولى استخداماً.' },
  { sym: 'Co', num: 27, name: 'كوبالت', conf: '[Ar] 4s² 3d⁷', ox: '+2, +3', note: 'يشبه الحديد في القابلية للتمغنط، ونظيره المشع الكوبالت 60 يُستخدم في حفظ الأغذية والكشف عن الأورام.' },
  { sym: 'Ni', num: 28, name: 'نيكل', conf: '[Ar] 4s² 3d⁸', ox: '+2, +3', note: 'المجال التطبيقي: النيكل المجزأ عامل حفاز في هدرجة الزيوت النباتية.' },
  { sym: 'Cu', num: 29, name: 'نحاس', conf: '[Ar] 4s¹ 3d¹⁰ (شاذ)', ox: '+1, +2', note: 'شاذ في التوزيع الإلكتروني لأن المستوى 3d تام الامتلاء يمنح الذرة استقراراً أعلى.' },
  { sym: 'Zn', num: 30, name: 'خارصين', conf: '[Ar] 4s² 3d¹⁰', ox: '+2 فقط', note: 'يُستخدم في جلفنة المعادن لحمايتها من الصدأ (ليس عنصراً انتقالياً لانشغال 3d التام).' },
];

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  lectures,
  quizzes,
  attachments,
  siteConfig,
  onBackToHome,
  onOpenTeacherDashboard,
  onUpdateStudentProfile,
}) => {
  const { lang, isRtl } = useLanguage();
  const resolvedGrades = getResolvedGrades(siteConfig);
  const adminEmailList = (siteConfig?.adminEmails || ['mizoo2y2@gmail.com']).map((e) =>
    e.toLowerCase().trim()
  );
  const currentUserEmail = currentUser?.email?.toLowerCase().trim() || '';
  const isTeacher =
    currentUserEmail === 'mizoo2y2@gmail.com' ||
    (currentUserEmail !== '' && adminEmailList.includes(currentUserEmail)) ||
    currentUser?.role === 'teacher';

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentUser?.grade || resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third'
  );

  useEffect(() => {
    if (!isTeacher && currentUser?.grade) {
      setSelectedGrade(currentUser.grade);
    }
  }, [currentUser?.grade, isTeacher]);

  const [activeTab, setActiveTab] = useState<'lectures' | 'quizzes' | 'files' | 'periodic-table'>(
    'lectures'
  );

  const filteredLectures = lectures
    .filter((l) => l.grade === selectedGrade)
    .sort((a, b) => (a.sessionOrder || 1) - (b.sessionOrder || 1));

  const filteredQuizzes = quizzes.filter((q) => q.grade === selectedGrade);
  const filteredAttachments = attachments.filter((a) => a.grade === selectedGrade);

  const [activeLecture, setActiveLecture] = useState<Lecture | null>(
    filteredLectures[0] || lectures[0] || null
  );
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedElementSym, setSelectedElementSym] = useState<string>('Cr');

  useEffect(() => {
    if (filteredLectures.length > 0 && (!activeLecture || activeLecture.grade !== selectedGrade)) {
      setActiveLecture(filteredLectures[0]);
    } else if (filteredLectures.length === 0) {
      setActiveLecture(null);
    }
  }, [selectedGrade, filteredLectures]);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizCelebration, setShowQuizCelebration] = useState<string | null>(null);
  const [enlargedQuizImage, setEnlargedQuizImage] = useState<string | null>(null);

  // Per-lecture persistent quick notes
  const [studentNotes, setStudentNotes] = useState<string>('');
  useEffect(() => {
    if (!activeLecture?.id) return;
    const saved = localStorage.getItem(`mm_note_${activeLecture.id}`);
    setStudentNotes(
      saved ??
        'ملاحظة: تذكر أن عنصر الكروم والنحاس شواذ في التوزيع الإلكتروني لاستقرار المستوى الفرعي 3d.'
    );
  }, [activeLecture?.id]);

  const handleNotesChange = (val: string) => {
    setStudentNotes(val);
    if (activeLecture?.id) {
      localStorage.setItem(`mm_note_${activeLecture.id}`, val);
    }
  };

  // Sequential Unlocking Logic
  const isLectureUnlocked = (lec: Lecture): boolean => {
    if (isTeacher) return true;
    const idx = filteredLectures.findIndex((l) => l.id === lec.id);
    if (idx <= 0) return true;

    const prevLec = filteredLectures[idx - 1];
    const prevWatched = currentUser?.watchedLectureIds?.includes(prevLec.id);
    const prevQuizId = prevLec.quizId;

    let prevQuizPassed = true;
    if (prevQuizId) {
      const isPassedInList = currentUser?.passedQuizIds?.includes(prevQuizId);
      const score = currentUser?.quizScores?.[prevQuizId] ?? 0;
      prevQuizPassed = Boolean(isPassedInList || score >= 60);
    }

    return Boolean(prevWatched && prevQuizPassed);
  };

  const getPrerequisiteDetails = (lec: Lecture) => {
    const idx = filteredLectures.findIndex((l) => l.id === lec.id);
    if (idx <= 0) return null;
    const prevLec = filteredLectures[idx - 1];
    const prevWatched = Boolean(currentUser?.watchedLectureIds?.includes(prevLec.id));
    const prevQuiz = quizzes.find((q) => q.id === prevLec.quizId) || null;
    const prevQuizPassed = prevQuiz
      ? Boolean(
          currentUser?.passedQuizIds?.includes(prevQuiz.id) ||
            (currentUser?.quizScores?.[prevQuiz.id] ?? 0) >= 60
        )
      : true;
    return { prevLec, prevWatched, prevQuiz, prevQuizPassed };
  };

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

    if (currentUser) {
      const currentScores = { ...(currentUser.quizScores || {}), [activeQuiz.id]: percentage };
      const currentPassed = [...(currentUser.passedQuizIds || [])];

      if (percentage >= 60 && !currentPassed.includes(activeQuiz.id)) {
        currentPassed.push(activeQuiz.id);
        setShowQuizCelebration(
          `أحسنت! حققت ${percentage}% وتم فتح الحصة التالية بنجاح.`
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
  const passedQuizzesCount = filteredQuizzes.filter(
    (q) =>
      currentUser?.passedQuizIds?.includes(q.id) || (currentUser?.quizScores?.[q.id] ?? 0) >= 60
  ).length;

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

  const inspectedElement =
    TRANSITION_ELEMENTS.find((el) => el.sym === selectedElementSym) || TRANSITION_ELEMENTS[0];

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden font-cairo pb-24 lg:pb-12">
      {/* Compact Non-Sticky Student Sub-Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onBackToHome}
                aria-label={lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 text-xs font-bold shrink-0 cursor-pointer"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span className="hidden sm:inline">{lang === 'en' ? 'Home' : 'الرئيسية'}</span>
              </button>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {lang === 'en'
                    ? `Welcome, ${currentUser.name.split(' ')[0]}`
                    : `مرحباً، ${currentUser.name.split(' ')[0]}`}
                </h1>
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
            </div>

            <div className="flex items-center gap-2 shrink-0">
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

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* Desktop Segmented Navigation & Teacher Grade Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Desktop Module Tabs (hidden on mobile because mobile uses Fixed Bottom Tab Bar) */}
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
                setActiveTab('periodic-table');
                setActiveQuiz(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'periodic-table'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Atom className="w-4 h-4" />
              <span>{lang === 'en' ? 'Periodic Table' : 'الجدول الدوري'}</span>
            </button>
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

        {/* Flex column with responsive ordering: On mobile, active learning workspace comes FIRST, summary strip goes below; on desktop, summary KPI strip sits neatly at top */}
        <div className="flex flex-col gap-6">
          {/* Compact 4-Metric Quick Strip (Order 2 on mobile so student goes straight to video, Order 1 on desktop) */}
          {!activeQuiz && (
            <div className="order-2 lg:order-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (nextTargetLecture) {
                    setActiveLecture(nextTargetLecture);
                    setActiveTab('lectures');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 text-right transition-colors flex flex-col justify-between gap-2 cursor-pointer"
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
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-right transition-colors flex flex-col justify-between gap-2 cursor-pointer"
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
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 text-right transition-colors flex flex-col justify-between gap-2 cursor-pointer"
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
                onClick={() => setActiveTab('periodic-table')}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 text-right transition-colors flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{lang === 'en' ? 'Overall Score' : 'المعدل التراكمي'}</span>
                  <Atom className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
                  {studentCumulativeScore}%
                </div>
              </button>
            </div>
          )}

          {/* PRIMARY WORKSPACE (Order 1 on mobile, Order 2 on desktop) */}
          <div className="order-1 lg:order-2">
            {/* 1. LECTURES TAB */}
            {activeTab === 'lectures' && !activeQuiz && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Active Video Player Column */}
                <div id="videoPlayerSection" className="lg:col-span-8 space-y-5">
                  {activeLecture ? (
                    isLectureUnlocked(activeLecture) ? (
                      <div className="space-y-4">
                        {/* Modern Edge-to-Edge Mobile Video Stage */}
                        <SecureVideoPlayer
                          lecture={activeLecture}
                          currentUser={currentUser}
                          isWatched={Boolean(
                            currentUser?.watchedLectureIds?.includes(activeLecture.id)
                          )}
                          onMarkWatched={handleMarkWatched}
                          onTakeQuiz={(quizId) => {
                            const targetQuiz =
                              quizzes.find((q) => q.id === quizId) || filteredQuizzes[0];
                            if (targetQuiz) handleStartQuiz(targetQuiz);
                          }}
                        />

                        {/* Clean Single-Elevation Lecture Info Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              <span className="font-semibold text-teal-700 dark:text-teal-400">
                                {activeLecture.chapter}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {activeLecture.duration}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{activeLecture.viewsCount} مشاهدة</span>
                            </div>

                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                              {activeLecture.title}
                            </h2>

                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {activeLecture.description}
                            </p>
                          </div>

                          {/* Attached PDF Handout Row */}
                          {activeLecture.pdfTitle && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {activeLecture.pdfTitle}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    مذكرة الشرح والتدريبات لهذه الحصة
                                  </div>
                                </div>
                              </div>

                              {activeLecture.pdfUrl && activeLecture.pdfUrl !== '#' ? (
                                <a
                                  href={activeLecture.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>تحميل المذكرة PDF</span>
                                </a>
                              ) : (
                                <span className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 shrink-0 cursor-not-allowed">
                                  <Download className="w-4 h-4" />
                                  <span>غير متاح حالياً</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Quick Notes Section separated cleanly with hairline divider */}
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <span>ملاحظاتك السريعة على الحصة (تُحفظ تلقائياً):</span>
                            </label>
                            <textarea
                              value={studentNotes}
                              onChange={(e) => handleNotesChange(e.target.value)}
                              rows={2}
                              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="اكتب معادلة أو ملاحظة هامة تريد الرجوع لها..."
                            />
                          </div>
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
                            الحصة مقفلة حتى إتمام الشروط السابقة
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {activeLecture.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            أنهِ مشاهدة الحصة السابقة واجتز اختبارها لفتح هذه المحاضرة تلقائياً.
                          </p>
                        </div>

                        {(() => {
                          const prereq = getPrerequisiteDetails(activeLecture);
                          if (!prereq) return null;
                          return (
                            <div className="max-w-lg mx-auto border-t border-slate-100 dark:border-slate-800 pt-4 text-right space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                <div className="flex items-center gap-2.5">
                                  {prereq.prevWatched ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                  )}
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                      1. مشاهدة الحصة {prereq.prevLec.sessionOrder || 1}:{' '}
                                      {prereq.prevLec.title}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {prereq.prevWatched ? 'مكتمل' : 'غير مكتمل'}
                                    </div>
                                  </div>
                                </div>

                                {!prereq.prevWatched && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveLecture(prereq.prevLec)}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer shrink-0"
                                  >
                                    الانتقال للحصة
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
                                        2. اجتياز {prereq.prevQuiz.title} (60% فأعلى)
                                      </div>
                                      <div className="text-[11px] text-slate-500 tabular-nums">
                                        {prereq.prevQuizPassed
                                          ? `تم الاجتياز بنسبة ${
                                              currentUser?.quizScores?.[prereq.prevQuiz.id] || 100
                                            }%`
                                          : 'مطلوب اجتياز الاختبار'}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleStartQuiz(prereq.prevQuiz!)}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer shrink-0"
                                  >
                                    بدء الاختبار
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
                      لا توجد محاضرات متاحة حالياً لهذا الصف.
                    </div>
                  )}
                </div>

                {/* Lecture Curriculum Playlist Column */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      قائمة حصص المنهج
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {filteredLectures.length} حصص
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
                    {filteredLectures.map((lec, idx) => {
                      const isCurrent = activeLecture?.id === lec.id;
                      const unlocked = isLectureUnlocked(lec);
                      const isWatched = currentUser?.watchedLectureIds?.includes(lec.id);

                      return (
                        <button
                          key={lec.id}
                          type="button"
                          onClick={() => {
                            setActiveLecture(lec);
                            if (window.innerWidth < 1024) {
                              document
                                .getElementById('videoPlayerSection')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`w-full min-h-[64px] px-4 py-3 text-right transition-colors cursor-pointer flex items-center gap-3 ${
                            isCurrent
                              ? 'bg-teal-50/80 dark:bg-teal-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono tabular-nums text-xs font-bold ${
                              !unlocked
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                : isCurrent
                                ? 'bg-teal-600 text-white'
                                : isWatched
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {!unlocked ? (
                              <Lock className="w-4 h-4 text-amber-500" />
                            ) : isWatched ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isCurrent
                                  ? 'text-teal-800 dark:text-teal-300'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {lec.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
                              <span>{lec.duration}</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{lec.chapter.split(':')[0]}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  !unlocked
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : isWatched
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-teal-600 dark:text-teal-400'
                                }
                              >
                                {!unlocked ? 'مقفلة' : isWatched ? 'مكتملة' : 'متاحة'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {filteredLectures.length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                        <BookOpen className="w-7 h-7 text-teal-600/40 mx-auto" />
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {lang === 'en'
                            ? 'No lectures published yet'
                            : 'لم يتم نشر محاضرات لهذا الصف حتى الآن'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. QUIZZES TAB & ACTIVE EXAM ENGINE */}
            {(activeTab === 'quizzes' || activeQuiz) && (
              <div>
                {!activeQuiz ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                        الامتحانات الإلكترونية
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        تصحيح فوري وتفسير علمي لكل سؤال مع حفظ الدرجة في ملفك.
                      </p>
                    </div>

                    {filteredQuizzes.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <Award className="w-8 h-8 text-amber-500 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          {lang === 'en'
                            ? 'No quizzes created yet'
                            : 'لا توجد اختبارات مضافة لهذا الصف بعد'}
                        </h4>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredQuizzes.map((quiz) => {
                          const quizScore = currentUser?.quizScores?.[quiz.id];
                          const isPassed =
                            currentUser?.passedQuizIds?.includes(quiz.id) ||
                            (quizScore !== undefined && quizScore >= 60);

                          return (
                            <div
                              key={quiz.id}
                              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  <span className="font-semibold text-teal-700 dark:text-teal-400 truncate">
                                    {quiz.chapter}
                                  </span>
                                  <span className="flex items-center gap-1 shrink-0">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    {quiz.durationMinutes} دقيقة
                                  </span>
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                  {quiz.title}
                                </h3>

                                <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                                  <span>{quiz.questions.length} سؤال</span>
                                  <span aria-hidden="true">·</span>
                                  {quizScore !== undefined ? (
                                    <span
                                      className={`font-bold ${
                                        isPassed
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      درجتك {quizScore}% ({isPassed ? 'ناجح' : 'إعادة مطلوبة'})
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                      لم يُحل بعد
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleStartQuiz(quiz)}
                                className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                  isPassed
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                              >
                                <Award className="w-4 h-4" />
                                <span>
                                  {quizScore !== undefined ? 'إعادة الامتحان' : 'بدء الامتحان'}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Active Quiz Runner */
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                            {activeQuiz.title}
                          </h3>
                          <p className="text-xs text-slate-500 tabular-nums">
                            السؤال {currentQuestionIndex + 1} من {activeQuiz.questions.length}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveQuiz(null)}
                          className="min-h-[40px] px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer shrink-0"
                        >
                          خروج
                        </button>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full transition-all duration-200"
                          style={{
                            width: `${Math.round(
                              ((currentQuestionIndex + 1) /
                                Math.max(1, activeQuiz.questions.length)) *
                                100
                            )}%`,
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

                    {activeQuiz.questions[currentQuestionIndex] && (
                      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
                        {activeQuiz.questions[currentQuestionIndex].imageUrl && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEnlargedQuizImage(
                                  activeQuiz.questions[currentQuestionIndex].imageUrl || null
                                )
                              }
                              className="group relative w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-zoom-in block"
                            >
                              <img
                                src={activeQuiz.questions[currentQuestionIndex].imageUrl}
                                alt={`صورة السؤال ${currentQuestionIndex + 1}`}
                                className="w-full max-h-[420px] object-contain mx-auto"
                              />
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-bold absolute bottom-2.5 left-2.5 group-hover:bg-teal-600 transition-colors">
                                <ZoomIn className="w-3.5 h-3.5" />
                                <span>اضغط لتكبير الصورة</span>
                              </span>
                            </button>
                          </div>
                        )}

                        {activeQuiz.questions[currentQuestionIndex].question?.trim() && (
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                            {activeQuiz.questions[currentQuestionIndex].question}
                          </h4>
                        )}

                        {!quizSubmitted && activeQuiz.questions[currentQuestionIndex].formula?.trim() && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-teal-800 dark:text-teal-300 dir-ltr text-center font-bold">
                            {activeQuiz.questions[currentQuestionIndex].formula}
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                            const qId = activeQuiz.questions[currentQuestionIndex].id;
                            const isSelected = selectedAnswers[qId] === oIdx;
                            const isCorrect =
                              activeQuiz.questions[currentQuestionIndex].correctAnswer === oIdx;

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
                                onClick={() => handleSelectAnswer(qId, oIdx)}
                                className={`w-full min-h-[52px] text-right p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
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
                          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5 text-right">
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <HelpCircle className="w-4 h-4 shrink-0" />
                              <span>التفسير العلمي:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {activeQuiz.questions[currentQuestionIndex].explanation}
                            </p>
                            {activeQuiz.questions[currentQuestionIndex].formula && (
                              <div className="pt-1 text-xs font-mono text-amber-900 dark:text-amber-200 dir-ltr font-bold">
                                {activeQuiz.questions[currentQuestionIndex].formula}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setEnlargedQuizImage(null);
                              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                            }}
                            disabled={currentQuestionIndex === 0}
                            className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            السابق
                          </button>

                          {!quizSubmitted ? (
                            currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                              <button
                                type="button"
                                onClick={handleSubmitQuiz}
                                className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
                              >
                                تصحيح واعتماد النتيجة
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEnlargedQuizImage(null);
                                  setCurrentQuestionIndex(
                                    Math.min(
                                      activeQuiz.questions.length - 1,
                                      currentQuestionIndex + 1
                                    )
                                  );
                                }}
                                className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
                              >
                                التالي
                              </button>
                            )
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                                {calculateScore()} / {activeQuiz.questions.length} (
                                {Math.round(
                                  (calculateScore() / Math.max(1, activeQuiz.questions.length)) *
                                    100
                                )}
                                %)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEnlargedQuizImage(null);
                                  setActiveQuiz(null);
                                  setActiveTab('lectures');
                                }}
                                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white cursor-pointer"
                              >
                                للحصص
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. FILES & ATTACHMENTS TAB */}
            {activeTab === 'files' && !activeQuiz && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                    مذكرات {getGradeTitle(selectedGrade)}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    تحميل مباشر للمذكرات وبنوك الأسئلة بصيغة PDF.
                  </p>
                </div>

                {filteredAttachments.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <FileText className="w-8 h-8 text-teal-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {lang === 'en'
                        ? 'No handouts or files added yet'
                        : 'لا توجد مذكرات مضافة لهذا الصف بعد'}
                    </h4>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAttachments.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                              {file.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                              <span className="truncate">{file.chapter}</span>
                              <span aria-hidden="true">·</span>
                              <span className="shrink-0">{file.fileSize}</span>
                            </div>
                          </div>
                        </div>

                        {file.downloadUrl && file.downloadUrl !== '#' ? (
                          <a
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>تحميل PDF</span>
                          </a>
                        ) : (
                          <span className="w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 cursor-not-allowed">
                            <Download className="w-4 h-4" />
                            <span>غير متاح للتحميل حالياً</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. INTERACTIVE PERIODIC TABLE */}
            {activeTab === 'periodic-table' && !activeQuiz && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                      مفاتيح السلسلة الانتقالية الأولى (3d)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      اضغط على أي عنصر لعرض التوزيع الإلكتروني وحالات التأكسد والملاحظة الامتحانية.
                    </p>
                  </div>

                  {/* Active Element Inspector */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-teal-600 text-white flex flex-col items-center justify-center shrink-0 font-mono tabular-nums">
                        <span className="text-[10px] opacity-80 leading-none">
                          {inspectedElement.num}
                        </span>
                        <span className="text-xl font-bold leading-tight">
                          {inspectedElement.sym}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {inspectedElement.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono dir-ltr text-right">
                          {inspectedElement.conf} · حالات التأكسد: {inspectedElement.ox}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-md">
                      {inspectedElement.note}
                    </p>
                  </div>

                  {/* Interactive Elements Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {TRANSITION_ELEMENTS.map((elem) => {
                      const active = elem.sym === inspectedElement.sym;
                      return (
                        <button
                          key={elem.sym}
                          type="button"
                          onClick={() => setSelectedElementSym(elem.sym)}
                          className={`min-h-[96px] p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            active
                              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-1 ring-teal-500/30'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                          }`}
                        >
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {elem.num}
                          </span>
                          <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                            {elem.sym}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {elem.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Mobile Bottom Tab Bar (Natural thumb zone navigation, <= 15% aggregate sticky cap) */}
      <nav
        aria-label="التنقل الرئيسي للطالب"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-4 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('lectures');
              setActiveQuiz(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
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
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
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
              setActiveTab('files');
              setActiveQuiz(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
              activeTab === 'files'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>{lang === 'en' ? 'PDFs' : 'المذكرات'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('periodic-table');
              setActiveQuiz(null);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
              activeTab === 'periodic-table'
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Atom className="w-5 h-5" />
            <span>{lang === 'en' ? 'Elements' : 'الجدول'}</span>
          </button>
        </div>
      </nav>

      {/* Enlarged Quiz Question Image Lightbox */}
      {enlargedQuizImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setEnlargedQuizImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setEnlargedQuizImage(null)}
            aria-label="إغلاق معاينة الصورة"
            className="absolute top-4 left-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={enlargedQuizImage}
            alt="صورة السؤال مكبرة"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
