import React, { useState } from 'react';
import { 
  Play, CheckCircle2, Clock, FileText, Download, Award, BookOpen, 
  ChevronRight, ArrowRight, Video, Sparkles, Filter, Check, X, AlertCircle, HelpCircle
} from 'lucide-react';
import { Lecture, Quiz, AttachmentFile, GradeLevel, UserProfile } from '../types';

interface StudentPortalProps {
  currentUser: UserProfile | null;
  lectures: Lecture[];
  quizzes: Quiz[];
  attachments: AttachmentFile[];
  onBackToHome: () => void;
  onOpenTeacherDashboard: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  lectures,
  quizzes,
  attachments,
  onBackToHome,
  onOpenTeacherDashboard,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentUser?.grade || 'third');
  const [activeTab, setActiveTab] = useState<'lectures' | 'quizzes' | 'files' | 'periodic-table'>('lectures');
  const [activeLecture, setActiveLecture] = useState<Lecture>(lectures[0] || null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [studentNotes, setStudentNotes] = useState<string>('ملاحظة: تذكر أن عنصر الكروم والنحاس شواذ في التوزيع الإلكتروني 4s1 3d5.');

  const filteredLectures = lectures.filter((l) => l.grade === selectedGrade);
  const filteredQuizzes = quizzes.filter((q) => q.grade === selectedGrade);
  const filteredAttachments = attachments.filter((a) => a.grade === selectedGrade);

  // Handle quiz answer
  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
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

  return (
    <div className="min-h-screen bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      
      {/* Top Portal Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white border-b border-teal-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="العودة للصفحة الرئيسية"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-kufi">
                    منصة الطالب التعليمية · قيصر الكيمياء
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold font-mono">
                    دفعة 2026
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-teal-200">
                  مرحباً بك يا {currentUser ? currentUser.name : 'دكتور المستقبل'}! واصل استذكار محاضراتك واختباراتك الدورية.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentUser?.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com' && (
                <button
                  onClick={onOpenTeacherDashboard}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 hover:bg-amber-400/30 transition-colors cursor-pointer"
                >
                  لوحة التحكم (Admin)
                </button>
              )}

              <div className="px-3.5 py-2 rounded-xl bg-white/10 text-xs font-mono flex items-center gap-2">

                <Award className="w-4 h-4 text-amber-300" />
                <span>الدرجة التراكمية: 96%</span>
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
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
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
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
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
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
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
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'periodic-table'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>الجدول الدوري السريع</span>
            </button>
          </div>

          {/* Grade Selector Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
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
              تالتة ثانوي 2026
            </button>
          </div>

        </div>

        {/* 1. LECTURES TAB */}
        {activeTab === 'lectures' && !activeQuiz && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Active Video Player & Lesson Area (Right side in RTL) */}
            <div className="lg:col-span-8 space-y-6">
              {activeLecture ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  
                  {/* Video Screen Container */}
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 shadow-inner flex items-center justify-center border border-slate-800">
                    <iframe
                      src={activeLecture.videoUrl}
                      title={activeLecture.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Lecture Info */}
                  <div className="space-y-3">
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
                            مذكرة الشرح والتدريبات الخاصة بهذه المحاضرة
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => alert('تم بدء تحميل مذكرة الشرح بنجاح!')}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
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
                <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  لا توجد محاضرات متاحة حالياً لهذا الصف.
                </div>
              )}
            </div>

            {/* Lecture Playlist (Left side in RTL) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-kufi">
                  قائمة محاضرات {selectedGrade === 'first' ? 'أولى ثانوي' : selectedGrade === 'second' ? 'تانية ثانوي' : 'تالتة ثانوي'}
                </h3>
                <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">
                  {filteredLectures.length} دروس
                </span>
              </div>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredLectures.map((lec, idx) => {
                  const isCurrent = activeLecture?.id === lec.id;
                  return (
                    <div
                      key={lec.id}
                      onClick={() => setActiveLecture(lec)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                        isCurrent
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {lec.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          <span>{lec.duration}</span>
                          <span>·</span>
                          <span>{lec.chapter.split(':')[0]}</span>
                        </div>
                      </div>

                      {lec.isFreePreview ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                          مجانية
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 shrink-0">
                          مفعلة
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
                      كل امتحان يشمل تصحيحاً فورياً وتفسيراً علمياً مفصلاً لكل سؤال بمعادلاته.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredQuizzes.map((quiz) => (
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

                      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                        <span>{quiz.questions.length} أسئلة اختيار من متعدد</span>
                        <span>·</span>
                        <span>تصحيح ذكي فوري</span>
                      </div>

                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>ابدأ الامتحان الآن</span>
                      </button>
                    </div>
                  ))}
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
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                  >
                    إنهاء والعودة
                  </button>
                </div>

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
                            optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200';
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
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        السابق
                      </button>

                      {!quizSubmitted ? (
                        currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                          <button
                            onClick={() => setQuizSubmitted(true)}
                            className="px-6 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm"
                          >
                            تصحيح الامتحان الآن
                          </button>
                        ) : (
                          <button
                            onClick={() => setCurrentQuestionIndex(Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1))}
                            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
                          >
                            التالي
                          </button>
                        )
                      ) : (
                        <div className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono">
                          نتيجتك: {calculateScore()} من {activeQuiz.questions.length}
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
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                مكتبة المذكرات والملازم التعليمية
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                مذكرات منسقة بجودة عالية قابلة للطباعة لدفعة 2026.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAttachments.map((file) => (
                <div
                  key={file.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-mono text-slate-500">{file.fileSize}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
                      {file.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{file.chapter}</span>
                      <span>·</span>
                      <span>{file.pageCount || 20} صفحة</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`جاري تنزيل ملف "${file.title}" بصيغة PDF`)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل المستند PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PERIODIC TABLE & CHEMISTRY CHEAT SHEET */}
        {activeTab === 'periodic-table' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                دليل العناصر الانتقالية والجدول الدوري السريع 🧪
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                أهم العناصر الانتقالية (السلسلة الأولى 3d) مع أعدادها الذرية وتوزيعها الإلكتروني واستخداماتها.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { sym: 'Sc', num: 21, name: 'السكانديوم', conf: '3d¹ 4s²', use: 'طائرات الميج ومصابيح أبخرة الزئبق' },
                { sym: 'Ti', num: 22, name: 'التيتانيوم', conf: '3d² 4s²', use: 'زراعة الأسنان ومفاصل صناعية' },
                { sym: 'V', num: 23, name: 'الفاناديوم', conf: '3d³ 4s²', use: 'زنبركات السيارات وخامس أكسيد الفاناديوم' },
                { sym: 'Cr', num: 24, name: 'الكروم (شاذ)', conf: '3d⁵ 4s¹', use: 'طلاء المعادن ودباغة الجلود' },
                { sym: 'Mn', num: 25, name: 'المنجنيز', conf: '3d⁵ 4s²', use: 'خطوط السكك الحديدية وعبوات المشروبات' },
                { sym: 'Fe', num: 26, name: 'الحديد', conf: '3d⁶ 4s²', use: 'الخرسانة والفرن العالي وهابر-بوش' },
                { sym: 'Co', num: 27, name: 'الكوبالت', conf: '3d⁷ 4s²', use: 'البطاريات والكوبالت 60 المشع' },
                { sym: 'Ni', num: 28, name: 'النيكل', conf: '3d⁸ 4s²', use: 'بطاريات النيكل-كادميوم وهدرجة الزيوت' },
                { sym: 'Cu', num: 29, name: 'النحاس (شاذ)', conf: '3d¹⁰ 4s¹', use: 'كابلات الكهرباء وسبيكة البرونز' },
                { sym: 'Zn', num: 30, name: 'الخارصين', conf: '3d¹⁰ 4s²', use: 'جلفنة الفلزات لحمايتها من الصدأ' },
              ].map((elem) => (
                <div
                  key={elem.sym}
                  className="p-3.5 rounded-2xl bg-[#fafffb] dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 text-right space-y-1 hover:border-teal-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">{elem.sym}</span>
                    <span className="text-xs font-mono text-slate-400">{elem.num}</span>
                  </div>
                  <div className="font-bold text-xs font-kufi text-slate-900 dark:text-white">{elem.name}</div>
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 dir-ltr text-right">{elem.conf}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{elem.use}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
