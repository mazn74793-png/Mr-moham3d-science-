import React, { useState } from 'react';
import { Award, Clock, HelpCircle, Trophy, ZoomIn } from 'lucide-react';
import { Quiz, UserProfile } from '../../types';
import { MediaPreviewModal } from '../MediaPreview';

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
  const [enlargedQuizImage, setEnlargedQuizImage] = useState<string | null>(null);

  if (!activeQuiz) {
    return (
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
              {lang === 'en' ? 'No quizzes created yet' : 'لا توجد اختبارات مضافة لهذا الصف بعد'}
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
                    onClick={() => onStartQuiz(quiz)}
                    className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isPassed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>{quizScore !== undefined ? 'إعادة الامتحان' : 'بدء الامتحان'}</span>
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

  return (
    <>
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
              onClick={() => {
                setEnlargedQuizImage(null);
                onExitQuiz();
              }}
              className="min-h-[40px] px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer shrink-0"
            >
              خروج
            </button>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-200"
              style={{
                width: `${Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%`,
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

        {currentQuestion && (
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            {currentQuestion.imageUrl && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setEnlargedQuizImage(currentQuestion.imageUrl || null)}
                  className="group relative w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-zoom-in block"
                >
                  <img
                    src={currentQuestion.imageUrl}
                    alt={`صورة السؤال ${currentQuestionIndex + 1}`}
                    decoding="async"
                    className="w-full max-h-[420px] object-contain mx-auto"
                  />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-bold absolute bottom-2.5 left-2.5 group-hover:bg-teal-600 transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>اضغط لتكبير الصورة</span>
                  </span>
                </button>
              </div>
            )}

            {currentQuestion.question?.trim() && (
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h4>
            )}

            {!quizSubmitted && currentQuestion.formula?.trim() && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-teal-800 dark:text-teal-300 dir-ltr text-center font-bold">
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
                  {currentQuestion.explanation}
                </p>
                {currentQuestion.formula && (
                  <div className="pt-1 text-xs font-mono text-amber-900 dark:text-amber-200 dir-ltr font-bold">
                    {currentQuestion.formula}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEnlargedQuizImage(null);
                  onQuestionIndexChange(Math.max(0, currentQuestionIndex - 1));
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
                    onClick={onSubmitQuiz}
                    className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer"
                  >
                    تصحيح واعتماد النتيجة
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEnlargedQuizImage(null);
                      onQuestionIndexChange(
                        Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1)
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
                    للحصص
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MediaPreviewModal
        isOpen={Boolean(enlargedQuizImage)}
        onClose={() => setEnlargedQuizImage(null)}
        url={enlargedQuizImage || ''}
        title={`صورة السؤال ${currentQuestionIndex + 1}`}
        kind="image"
      />
    </>
  );
};
