import React, { useState, useEffect } from 'react';
import { 
  Play, CheckCircle2, Clock, FileText, Download, Award, BookOpen, 
  ChevronRight, ArrowRight, Video, Sparkles, Filter, Check, X, AlertCircle, HelpCircle,
  Lock, AlertTriangle, ShieldCheck, Trophy, ChevronLeft
} from 'lucide-react';
import { Lecture, Quiz, AttachmentFile, GradeLevel, UserProfile } from '../types';
import { SecureVideoPlayer } from './SecureVideoPlayer';

interface StudentPortalProps {
  currentUser: UserProfile | null;
  lectures: Lecture[];
  quizzes: Quiz[];
  attachments: AttachmentFile[];
  onBackToHome: () => void;
  onOpenTeacherDashboard: () => void;
  onUpdateStudentProfile?: (updatedUser: UserProfile) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  lectures,
  quizzes,
  attachments,
  onBackToHome,
  onOpenTeacherDashboard,
  onUpdateStudentProfile,
}) => {
  const isTeacher = currentUser?.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com' || currentUser?.role === 'teacher';
  
  // Student view is locked strictly to their own grade; teacher can toggle to inspect all
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentUser?.grade || 'third');

  useEffect(() => {
    if (!isTeacher && currentUser?.grade) {
      setSelectedGrade(currentUser.grade);
    }
  }, [currentUser?.grade, isTeacher]);

  const [activeTab, setActiveTab] = useState<'lectures' | 'quizzes' | 'files' | 'periodic-table'>('lectures');
  
  // Filter lectures for the chosen grade and sort by sequence
  const filteredLectures = lectures
    .filter((l) => l.grade === selectedGrade)
    .sort((a, b) => (a.sessionOrder || 1) - (b.sessionOrder || 1));

  const filteredQuizzes = quizzes.filter((q) => q.grade === selectedGrade);
  const filteredAttachments = attachments.filter((a) => a.grade === selectedGrade);

  const [activeLecture, setActiveLecture] = useState<Lecture>(filteredLectures[0] || lectures[0] || null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Update activeLecture if grade changes
  useEffect(() => {
    if (filteredLectures.length > 0 && (!activeLecture || activeLecture.grade !== selectedGrade)) {
      setActiveLecture(filteredLectures[0]);
    }
  }, [selectedGrade, filteredLectures]);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [studentNotes, setStudentNotes] = useState<string>('ملاحظة: تذكر أن عنصر الكروم والنحاس شواذ في التوزيع الإلكتروني 4s1 3d5.');
  const [showQuizCelebration, setShowQuizCelebration] = useState<string | null>(null);

  // Sequential Unlocking Logic
  const isLectureUnlocked = (lec: Lecture): boolean => {
    if (isTeacher) return true; // Teacher has bypass
    const idx = filteredLectures.findIndex((l) => l.id === lec.id);
    if (idx <= 0) return true; // Session 1 is always unlocked

    const prevLec = filteredLectures[idx - 1];
    const prevWatched = currentUser?.watchedLectureIds?.includes(prevLec.id);
    const prevQuizId = prevLec.quizId;
    
    // If previous lecture has a quiz, it must be passed with >= 60%
    let prevQuizPassed = true;
    if (prevQuizId) {
      const isPassedInList = currentUser?.passedQuizIds?.includes(prevQuizId);
      const score = currentUser?.quizScores?.[prevQuizId] ?? 0;
      prevQuizPassed = Boolean(isPassedInList || score >= 60);
    }

    return Boolean(prevWatched && prevQuizPassed);
  };

  // Find prerequisite lecture details for a locked lecture
  const getPrerequisiteDetails = (lec: Lecture) => {
    const idx = filteredLectures.findIndex((l) => l.id === lec.id);
    if (idx <= 0) return null;
    const prevLec = filteredLectures[idx - 1];
    const prevWatched = Boolean(currentUser?.watchedLectureIds?.includes(prevLec.id));
    const prevQuiz = quizzes.find((q) => q.id === prevLec.quizId) || null;
    const prevQuizPassed = prevQuiz ? Boolean(currentUser?.passedQuizIds?.includes(prevQuiz.id) || (currentUser?.quizScores?.[prevQuiz.id] ?? 0) >= 60) : true;
    return { prevLec, prevWatched, prevQuiz, prevQuizPassed };
  };

  // Handle Mark Lecture as Watched
  const handleMarkWatched = (lecId: string) => {
    if (!currentUser) return;
    const currentWatched = currentUser.watchedLectureIds || [];
    if (!currentWatched.includes(lecId)) {
      const updatedWatched = [...currentWatched, lecId];
      const updatedUser: UserProfile = {
        ...currentUser,
        watchedLectureIds: updatedWatched,
      };
      onUpdateStudentProfile?.(updatedUser);
    }
  };

  // Handle starting a specific quiz directly
  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setShowQuizCelebration(null);
    setActiveTab('quizzes');
  };

  // Handle quiz selection
  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
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

  // Handle submitting quiz
  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    setQuizSubmitted(true);

    const score = calculateScore();
    const total = activeQuiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    if (currentUser) {
      const currentScores = { ...(currentUser.quizScores || {}), [activeQuiz.id]: percentage };
      const currentPassed = [...(currentUser.passedQuizIds || [])];

      if (percentage >= 60 && !currentPassed.includes(activeQuiz.id)) {
        currentPassed.push(activeQuiz.id);
        setShowQuizCelebration(`مبروك يا بطل! أحرزت ${percentage}% وتم فك قفل الحصة التالية بنجاح 🎉`);
      }

      // Calculate new cumulative score
      const scoreValues = Object.values(currentScores);
      const avgScore = scoreValues.length > 0 
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : percentage;

      const updatedUser: UserProfile = {
        ...currentUser,
        quizScores: currentScores,
        passedQuizIds: currentPassed,
        score: avgScore,
      };

      onUpdateStudentProfile?.(updatedUser);
    }
  };

  // Real student cumulative score
  const studentCumulativeScore = currentUser?.score ?? 0;

  // Grade label helper
  const getGradeTitle = (g: GradeLevel) => {
    switch (g) {
      case 'first': return 'الصف الأول الثانوي';
      case 'second': return 'الصف الثاني الثانوي';
      default: return 'الصف الثالث الثانوي (دفعة 2026)';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      
      {/* Top Portal Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white border-b border-teal-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="العودة للصفحة الرئيسية"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-kufi">
                    لوحة تحكم الطالب · قيصر الكيمياء
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold font-mono">
                    {getGradeTitle(selectedGrade)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-teal-200">
                  مرحباً بك يا {currentUser ? currentUser.name : 'دكتور المستقبل'}! المحتوى مخصص لصفك الدراسي ومؤمن بنظام التسلسل الذكي.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isTeacher && (
                <button
                  onClick={onOpenTeacherDashboard}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 hover:bg-amber-400/30 transition-colors cursor-pointer"
                >
                  لوحة التحكم (Admin)
                </button>
              )}

              <div className="px-3.5 py-2 rounded-xl bg-white/10 text-xs font-mono flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span>الدرجة التراكمية الحقيقية: {studentCumulativeScore}%</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs & Grade Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          
          {/* Main Module Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setActiveTab('lectures'); setActiveQuiz(null); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'lectures' && !activeQuiz
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>المحاضرات والشرح ({filteredLectures.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('quizzes'); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'quizzes'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>الامتحانات الإلكترونية ({filteredQuizzes.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('files'); setActiveQuiz(null); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'files'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>المذكرات والملفات ({filteredAttachments.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('periodic-table'); setActiveQuiz(null); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'periodic-table'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>الجدول الدوري السريع</span>
            </button>
          </div>

          {/* Grade Selector - only visible to teacher for preview, for students their grade is locked */}
          {isTeacher ? (
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
              <span className="text-[10px] text-slate-500 font-bold px-1.5">معاينة الصف:</span>
              <button
                onClick={() => setSelectedGrade('first')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedGrade === 'first'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                أولى ثانوي
              </button>
              <button
                onClick={() => setSelectedGrade('second')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedGrade === 'second'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                تانية ثانوي
              </button>
              <button
                onClick={() => setSelectedGrade('third')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedGrade === 'third'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                تالتة ثانوي
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300">
              📌 {getGradeTitle(selectedGrade)}
            </div>
          )}

        </div>

        {/* 1. LECTURES TAB */}
        {activeTab === 'lectures' && !activeQuiz && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Active Video Player or Locked Screen (Right side in RTL) */}
            <div className="lg:col-span-8 space-y-6">
              {activeLecture ? (
                isLectureUnlocked(activeLecture) ? (
                  /* UNLOCKED: SECURE VIDEO PLAYER WITH DYNAMIC WATERMARK */
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    
                    {/* Safe Secure Video Player */}
                    <SecureVideoPlayer
                      lecture={activeLecture}
                      currentUser={currentUser}
                      isWatched={Boolean(currentUser?.watchedLectureIds?.includes(activeLecture.id))}
                      onMarkWatched={handleMarkWatched}
                      onTakeQuiz={(quizId) => {
                        const targetQuiz = quizzes.find((q) => q.id === quizId) || filteredQuizzes[0];
                        if (targetQuiz) handleStartQuiz(targetQuiz);
                      }}
                    />

                    {/* Lecture Info */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 font-mono">
                          {activeLecture.chapter}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {activeLecture.duration}
                          </span>
                          <span>{activeLecture.viewsCount} مشاهدة</span>
                        </div>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                        {activeLecture.title}
                      </h2>

                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {activeLecture.description}
                      </p>
                    </div>

                    {/* Attached Handout Download Strip */}
                    {activeLecture.pdfTitle && (
                      <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {activeLecture.pdfTitle}
                            </div>
                            <div className="text-xs text-teal-700 dark:text-teal-300">
                              مذكرة الشرح والتدريبات الخاصة بهذه الحصة
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => alert('تم بدء تحميل مذكرة الشرح بنجاح!')}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>تحميل المذكرة PDF</span>
                        </button>
                      </div>
                    )}

                    {/* Student Quick Notes Tool */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-kufi">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <span>كشكول ملاحظاتك السريعة على هذه المحاضرة:</span>
                      </label>
                      <textarea
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        rows={3}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="اكتب معادلة أو ملاحظة هامة تريد الرجوع لها قبل الامتحان..."
                      />
                    </div>

                  </div>
                ) : (
                  /* LOCKED SCREEN: PREREQUISITE WARNING */
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-amber-300 dark:border-amber-800/60 shadow-xl space-y-6 text-center">
                    
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
                      <Lock className="w-10 h-10 animate-bounce" />
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                      <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
                        الحصة مغلقة حتى إتمام الشروط
                      </div>
                      <h3 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                        {activeLecture.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                        لضمان التأسيس المتين وحصولك على الدرجة النهائية، تم قفل هذه المحاضرة تلقائياً حتى تنتهي من مشاهدة الحصة السابقة واجتياز اختبارها بنجاح.
                      </p>
                    </div>

                    {/* Prerequisite Checklist Box */}
                    {(() => {
                      const prereq = getPrerequisiteDetails(activeLecture);
                      if (!prereq) return null;
                      return (
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-right space-y-3.5 max-w-lg mx-auto">
                          <h4 className="text-xs font-bold font-kufi text-slate-800 dark:text-slate-200">
                            متطلبات فك القفل:
                          </h4>

                          {/* Step 1: Watch previous lecture */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                              {prereq.prevWatched ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                              )}
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  1. مشاهدة الحصة {prereq.prevLec.sessionOrder || 1}: {prereq.prevLec.title}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {prereq.prevWatched ? 'تمت المشاهدة بنجاح ✅' : 'لم تنتهِ من مشاهدتها بعد'}
                                </div>
                              </div>
                            </div>

                            {!prereq.prevWatched && (
                              <button
                                onClick={() => setActiveLecture(prereq.prevLec)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer shrink-0"
                              >
                                الذهاب للمحاضرة
                              </button>
                            )}
                          </div>

                          {/* Step 2: Pass previous quiz */}
                          {prereq.prevQuiz && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-2.5">
                                {prereq.prevQuizPassed ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                                )}
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                                    2. اجتياز: {prereq.prevQuiz.title} (60% فأعلى)
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {prereq.prevQuizPassed 
                                      ? `تم الاجتياز بنسبة ${currentUser?.quizScores?.[prereq.prevQuiz.id] || 100}% ✅` 
                                      : 'مطلوب اجتياز الكويز لفتح هذه الحصة'}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleStartQuiz(prereq.prevQuiz!)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 cursor-pointer shrink-0"
                              >
                                حل الكويز الآن
                              </button>
                            </div>
                          )}

                        </div>
                      );
                    })()}

                  </div>
                )
              ) : (
                <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  لا توجد محاضرات متاحة حالياً لهذا الصف.
                </div>
              )}
            </div>

            {/* Lecture Playlist with Locks (Left side in RTL) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-kufi">
                  قائمة حصص {getGradeTitle(selectedGrade)}
                </h3>
                <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">
                  {filteredLectures.length} حصص
                </span>
              </div>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredLectures.map((lec, idx) => {
                  const isCurrent = activeLecture?.id === lec.id;
                  const unlocked = isLectureUnlocked(lec);
                  const isWatched = currentUser?.watchedLectureIds?.includes(lec.id);

                  return (
                    <div
                      key={lec.id}
                      onClick={() => setActiveLecture(lec)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-sm'
                          : unlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                        !unlocked
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          : isCurrent
                          ? 'bg-teal-600 text-white'
                          : isWatched
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {!unlocked ? (
                          <Lock className="w-4 h-4 text-amber-500" />
                        ) : isWatched ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{lec.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          <span>{lec.duration}</span>
                          <span>·</span>
                          <span>{lec.chapter.split(':')[0]}</span>
                        </div>
                      </div>

                      {!unlocked ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1 shrink-0 font-mono">
                          <Lock className="w-3 h-3" />
                          <span>مقفل</span>
                        </span>
                      ) : isWatched ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                          تم الحضور ✅
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 shrink-0">
                          متاح
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* 2. QUIZZES TAB & ACTIVE EXAM ENGINE */}
        {(activeTab === 'quizzes' || activeQuiz) && (
          <div>
            {!activeQuiz ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                      الامتحانات الإلكترونية والتقييمات الدورية
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      كل امتحان يشمل تصحيحاً فورياً وتفسيراً علمياً مفصلاً لكل سؤال بمعادلاته مع حفظ الدرجة في ملفك الشخصي.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredQuizzes.map((quiz) => {
                    const quizScore = currentUser?.quizScores?.[quiz.id];
                    const isPassed = currentUser?.passedQuizIds?.includes(quiz.id) || (quizScore !== undefined && quizScore >= 60);

                    return (
                      <div
                        key={quiz.id}
                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:shadow-xl transition-all space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold font-mono">
                            {quiz.chapter}
                          </span>
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {quiz.durationMinutes} دقيقة
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-kufi">
                          {quiz.title}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>{quiz.questions.length} أسئلة اختيار من متعدد</span>
                          {quizScore !== undefined ? (
                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                              isPassed 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              درجتك: {quizScore}% {isPassed ? '(ناجح)' : '(يحتاج إعادة)'}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">لم يُحل بعد</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                            isPassed
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50'
                              : 'bg-teal-600 hover:bg-teal-700 text-white'
                          }`}
                        >
                          <Award className="w-4 h-4" />
                          <span>{quizScore !== undefined ? 'إعادة الامتحان للتحسين' : 'ابدأ الامتحان الآن'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ACTIVE QUIZ ENGINE RUNNER */
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Quiz Runner Top Header */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg font-kufi text-slate-900 dark:text-white">
                      {activeQuiz.title}
                    </h3>
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">
                      السؤال {currentQuestionIndex + 1} من {activeQuiz.questions.length}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    إنهاء والعودة
                  </button>
                </div>

                {/* Quiz Celebration Banner if passed */}
                {showQuizCelebration && (
                  <div className="p-4 rounded-2xl bg-emerald-500 text-white text-center font-bold text-sm shadow-xl flex items-center justify-center gap-2 animate-bounce">
                    <Trophy className="w-5 h-5 text-amber-300" />
                    <span>{showQuizCelebration}</span>
                  </div>
                )}

                {/* Question Card */}
                {activeQuiz.questions[currentQuestionIndex] && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
                    
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                        سؤال رقم {currentQuestionIndex + 1}:
                      </span>
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                        {activeQuiz.questions[currentQuestionIndex].question}
                      </h4>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                      {activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                        const qId = activeQuiz.questions[currentQuestionIndex].id;
                        const isSelected = selectedAnswers[qId] === oIdx;
                        const isCorrect = activeQuiz.questions[currentQuestionIndex].correctAnswer === oIdx;

                        let optionStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-400';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isSelected && !isCorrect) {
                            optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isSelected) {
                          optionStyle = 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 font-bold';
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectAnswer(qId, oIdx)}
                            className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                          >
                            <span className="text-sm sm:text-base">{opt}</span>
                            <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs shrink-0 font-mono">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation after submission */}
                    {quizSubmitted && (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-right">
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300 font-kufi flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4" />
                          <span>التفسير العلمي وملاحظة قيصر الكيمياء:</span>
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

                    {/* Navigation between questions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        السابق
                      </button>

                      {!quizSubmitted ? (
                        currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                          <button
                            onClick={handleSubmitQuiz}
                            className="px-6 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm cursor-pointer"
                          >
                            تصحيح الامتحان واعتماد النتيجة
                          </button>
                        ) : (
                          <button
                            onClick={() => setCurrentQuestionIndex(Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1))}
                            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
                          >
                            التالي
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono">
                            نتيجتك: {calculateScore()} من {activeQuiz.questions.length} ({Math.round((calculateScore() / activeQuiz.questions.length) * 100)}%)
                          </div>
                          <button
                            onClick={() => {
                              setActiveQuiz(null);
                              setActiveTab('lectures');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white"
                          >
                            العودة للحصص
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                  مذكرات وملفات {getGradeTitle(selectedGrade)}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  تحميل مباشر للمذكرات وبنوك الأسئلة والشيتات بصيغة PDF عالية الجودة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAttachments.map((file) => (
                <div
                  key={file.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-kufi leading-snug">
                      {file.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>{file.chapter}</span>
                      <span>·</span>
                      <span>{file.fileSize}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`تم بدء تحميل ملف (${file.title}) بنجاح!`)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل الآن PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PERIODIC TABLE QUICK REFERENCE */}
        {activeTab === 'periodic-table' && !activeQuiz && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <span>الجدول الدوري الحديث · مفاتيح السلسلة الانتقالية 3d</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                مرجع سريع لأهم عناصر السلسلة الأولى وتوزيعها الإلكتروني الشاذ وحالات تأكسدها الشهيرة لدفعة 2026.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
                {[
                  { sym: 'Sc', num: 21, name: 'سكانديوم', conf: '[Ar] 4s² 3d¹', ox: '+3' },
                  { sym: 'Ti', num: 22, name: 'تيتانيوم', conf: '[Ar] 4s² 3d²', ox: '+2, +3, +4' },
                  { sym: 'V', num: 23, name: 'فاناديوم', conf: '[Ar] 4s² 3d³', ox: '+2, +3, +4, +5' },
                  { sym: 'Cr', num: 24, name: 'كروم ⭐', conf: '[Ar] 4s¹ 3d⁵ (شاذ)', ox: '+2, +3, +6' },
                  { sym: 'Mn', num: 25, name: 'منجنيز', conf: '[Ar] 4s² 3d⁵', ox: '+2 إلى +7' },
                  { sym: 'Fe', num: 26, name: 'حديد', conf: '[Ar] 4s² 3d⁶', ox: '+2, +3' },
                  { sym: 'Co', num: 27, name: 'كوبالت', conf: '[Ar] 4s² 3d⁷', ox: '+2, +3' },
                  { sym: 'Ni', num: 28, name: 'نيكل', conf: '[Ar] 4s² 3d⁸', ox: '+2, +3' },
                  { sym: 'Cu', num: 29, name: 'نحاس ⭐', conf: '[Ar] 4s¹ 3d¹⁰ (شاذ)', ox: '+1, +2' },
                  { sym: 'Zn', num: 30, name: 'خارصين', conf: '[Ar] 4s² 3d¹⁰', ox: '+2 فقط' },
                ].map((elem) => (
                  <div
                    key={elem.sym}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-1 hover:border-teal-400 transition-colors"
                  >
                    <div className="text-[10px] text-slate-400 font-mono">{elem.num}</div>
                    <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">{elem.sym}</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{elem.name}</div>
                    <div className="text-[9px] text-amber-600 dark:text-amber-400 font-mono dir-ltr">{elem.conf}</div>
                    <div className="text-[10px] text-slate-500 font-mono">حالات: {elem.ox}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
