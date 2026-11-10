import React, { useState } from 'react';
import { 
  Award, Plus, Trash2, CheckCircle2, Clock, HelpCircle, 
  Sparkles, BookOpen, AlertCircle, ChevronDown, Check, X 
} from 'lucide-react';
import { Quiz, QuizQuestion, GradeLevel, Lecture } from '../types';

interface TeacherQuizManagerProps {
  quizzes: Quiz[];
  lectures: Lecture[];
  onAddQuiz: (newQuiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
}

export const TeacherQuizManager: React.FC<TeacherQuizManagerProps> = ({
  quizzes,
  lectures,
  onAddQuiz,
  onDeleteQuiz,
}) => {
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Quiz Meta Form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizGrade, setQuizGrade] = useState<GradeLevel>('third');
  const [quizChapter, setQuizChapter] = useState('الباب الأول: العناصر الانتقالية');
  const [quizDuration, setQuizDuration] = useState<number>(15);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');

  // Questions Builder State
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: `q-${Date.now()}-1`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      formula: '',
    },
  ]);

  const filteredQuizzes = quizzes.filter((q) =>
    filterGrade === 'all' ? true : q.grade === filterGrade
  );

  const availableLectures = lectures.filter((l) => l.grade === quizGrade);

  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizSuccess, setQuizSuccess] = useState<string | null>(null);
  const [deleteConfirmQuizId, setDeleteConfirmQuizId] = useState<string | null>(null);

  const handleAddQuestionSlot = () => {
    setQuizError(null);
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        formula: '',
      },
    ]);
  };

  const handleRemoveQuestionSlot = (idx: number) => {
    if (questions.length <= 1) {
      setQuizError('يجب أن يحتوي الامتحان على سؤال واحد على الأقل.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[oIdx] = val;
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError(null);

    if (!quizTitle.trim()) {
      setQuizError('يرجى كتابة عنوان الامتحان الإلكتروني.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setQuizError(`يرجى كتابة نص السؤال رقم ${i + 1}.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setQuizError(`يرجى ملء جميع الخيارات الأربعة للسؤال رقم ${i + 1}.`);
          return;
        }
      }
    }

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: quizTitle.trim(),
      grade: quizGrade,
      chapter: quizChapter.trim() || 'كيمياء عامة',
      durationMinutes: Number(quizDuration) || 15,
      lectureId: selectedLectureId || undefined,
      questions: questions,
    };

    onAddQuiz(newQuiz);
    setQuizSuccess('تم حفظ وإضافة الامتحان بنجاح إلى بنك الأسئلة والمنصة! 🎯');
    setTimeout(() => setQuizSuccess(null), 4000);

    // Reset Form
    setQuizTitle('');
    setShowAddForm(false);
    setQuestions([
      {
        id: `q-${Date.now()}-1`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        formula: '',
      },
    ]);
  };

  return (
    <div className="space-y-6">
      
      {/* Quiz Feedback Banners */}
      {quizError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-between">
          <span>{quizError}</span>
          <button onClick={() => setQuizError(null)} className="text-rose-500 hover:text-rose-800">×</button>
        </div>
      )}
      {quizSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
          <span>{quizSuccess}</span>
          <button onClick={() => setQuizSuccess(null)} className="text-emerald-500 hover:text-emerald-800">×</button>
        </div>
      )}
      
      {/* Top Header & Action */}
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
            أضف امتحانات اختيار من متعدد، حدد الإجابات الصحيحة والتفسير العلمي، واربطها بالحصة لفتح قفل المحاضرات.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'إلغاء وإخفاء النموذج' : '+ إنشاء امتحان جديد'}</span>
        </button>
      </div>

      {/* CREATE NEW QUIZ FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmitQuiz} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-teal-500/30 shadow-xl space-y-6 text-right animate-fade-in-up">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>إعدادات الامتحان الأساسية</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Title */}
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

            {/* Grade */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الصف الدراسي *
              </label>
              <select
                value={quizGrade}
                onChange={(e) => setQuizGrade(e.target.value as GradeLevel)}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="first">الصف الأول الثانوي</option>
                <option value="second">الصف الثاني الثانوي</option>
                <option value="third">الصف الثالث الثانوي 2026</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الوقت المحدد (بالدقائق) *
              </label>
              <input
                type="number"
                min={5}
                max={180}
                required
                value={quizDuration}
                onChange={(e) => setQuizDuration(Number(e.target.value))}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
              />
            </div>

            {/* Chapter */}
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

            {/* Connected Lecture (for unlocking) */}
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

          {/* QUESTIONS BUILDER SECTION */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold font-kufi text-slate-900 dark:text-white">
                أسئلة الاختيار من متعدد ({questions.length} أسئلة)
              </h4>
              <button
                type="button"
                onClick={handleAddQuestionSlot}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة سؤال آخر</span>
              </button>
            </div>

            <div className="space-y-5">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-teal-600 text-white">
                      سؤال رقم {qIdx + 1}
                    </span>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionSlot(qIdx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="حذف هذا السؤال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      نص السؤال الكيميائي *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                      placeholder="مثال: أي من المركبات التالية يعطي لوناً أخضر عند تفاعله مع محلول هيدروكسيد الصوديوم؟"
                      className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Chemical Formula / Equation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      معادلة كيميائية مرافقة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={q.formula || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'formula', e.target.value)}
                      placeholder="مثال: FeSO4 + 2NaOH -> Fe(OH)2 + Na2SO4"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-right"
                    />
                  </div>

                  {/* 4 Options Grid with Correct Answer Radio Button */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      خيارات الإجابة (اختر الدائرة بجانب الإجابة الصحيحة):
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctAnswer === oIdx;
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
                              name={`correct-answer-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => handleUpdateQuestion(qIdx, 'correctAnswer', oIdx)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {String.fromCharCode(65 + oIdx)}:
                            </span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
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
                      value={q.explanation}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                      placeholder="اكتب التفسير العلمي الدقيق ليفهم الطالب سبب الإجابة..."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ ونشر الامتحان على المنصة 🚀</span>
            </button>
          </div>

        </form>
      )}

      {/* FILTER & QUIZZES LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold font-kufi text-slate-900 dark:text-white">
            قائمة الامتحانات في بنك الأسئلة ({filteredQuizzes.length})
          </h3>

          {/* Filter Grade */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterGrade('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGrade === 'all'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              الكل ({quizzes.length})
            </button>
            <button
              onClick={() => setFilterGrade('first')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGrade === 'first'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              أولى ثانوي
            </button>
            <button
              onClick={() => setFilterGrade('second')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGrade === 'second'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              تانية ثانوي
            </button>
            <button
              onClick={() => setFilterGrade('third')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGrade === 'third'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              تالتة ثانوي
            </button>
          </div>
        </div>

        {/* List of Quizzes */}
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
                      {quiz.grade === 'first' ? 'أولى ثانوي' : quiz.grade === 'second' ? 'تانية ثانوي' : 'تالتة ثانوي'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {quiz.durationMinutes} دقيقة
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {quiz.questions.length} أسئلة MCQs
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
                  {deleteConfirmQuizId === quiz.id ? (
                    <div className="flex items-center gap-1">
                      <button
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
                        onClick={() => setDeleteConfirmQuizId(null)}
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
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
        </div>

      </div>

    </div>
  );
};
