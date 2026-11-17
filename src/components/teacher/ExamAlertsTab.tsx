import React, { useState } from 'react';
import {
  ShieldAlert,
  Ban,
  Unlock,
  CheckCircle2,
  Trash2,
  Phone,
  AlertTriangle,
  Clock,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { ExamSecurityAlert, UserProfile } from '../../types';
import { GradeItem, getGradeDisplayName } from '../../types/siteConfig';

interface ExamAlertsTabProps {
  alerts: ExamSecurityAlert[];
  students: UserProfile[];
  grades: GradeItem[];
  onResolveAlert?: (alert: ExamSecurityAlert) => Promise<boolean> | boolean | void;
  onDeleteAlert?: (alertId: string) => Promise<boolean> | boolean | void;
  onBlockToggleStudent?: (student: UserProfile, blocked: boolean, reason?: string) => Promise<boolean>;
  onAllowQuizRetake?: (student: UserProfile, quizId: string, alert?: ExamSecurityAlert) => Promise<boolean>;
}

export const ExamAlertsTab: React.FC<ExamAlertsTabProps> = ({
  alerts,
  students,
  grades,
  onResolveAlert,
  onDeleteAlert,
  onBlockToggleStudent,
  onAllowQuizRetake,
}) => {
  const [filterMode, setFilterMode] = useState<'unresolved' | 'cancelled' | 'all'>('unresolved');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const cancelledCount = alerts.filter((a) => a.actionTaken === 'cancelled').length;

  const visibleAlerts = alerts.filter((a) => {
    if (filterMode === 'unresolved') return !a.resolved;
    if (filterMode === 'cancelled') return a.actionTaken === 'cancelled';
    return true;
  });

  const getGradeTitle = (g?: string) => {
    if (!g) return 'غير محدد';
    const found = grades.find((x) => x.id === g);
    return found?.badgeAr || getGradeDisplayName(g);
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-rose-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>مركز مراقبة لجان الامتحانات ومكافحة الغش</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-kufi text-slate-900 dark:text-white">
            تنبيهات الغش ومخالفات الامتحانات ({unresolvedCount} غير مراجع)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            تصل جميع محاولات الخروج من اللجنة أو التصوير أو تسجيل الشاشة أو فتح أدوات المطور هنا فوراً مع إمكانية حظر الطالب أو إعادة فتح الامتحان له.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('unresolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterMode === 'unresolved'
                ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            جديدة ({unresolvedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterMode === 'cancelled'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ملغاة تلقائياً ({cancelledCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            الكل ({alerts.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {visibleAlerts.map((alert) => {
          const matchedStudent = students.find(
            (s) =>
              s.id === alert.studentUid ||
              (alert.studentEmail &&
                s.email &&
                s.email.toLowerCase().trim() === alert.studentEmail.toLowerCase().trim())
          );
          const isCancelled = alert.actionTaken === 'cancelled';
          const isBlocked = Boolean(matchedStudent?.isBlocked);
          const isQuizStillCancelled = Boolean(
            matchedStudent?.cancelledQuizIds?.includes(alert.quizId)
          );

          return (
            <div
              key={alert.id}
              className={`rounded-3xl p-5 sm:p-6 border-2 transition-all space-y-4 ${
                alert.resolved
                  ? 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-85'
                  : isCancelled
                  ? 'bg-rose-50/50 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800 shadow-sm'
                  : 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isCancelled
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {isCancelled
                          ? `تم إلغاء الامتحان تلقائياً (${alert.violationCount}/${alert.maxViolations})`
                          : `تحذير مخالفة (${alert.violationCount}/${alert.maxViolations})`}
                      </span>
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[11px] font-bold">
                      {getGradeTitle(alert.grade)}
                    </span>

                    {isBlocked && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
                        حساب الطالب محظور حالياً
                      </span>
                    )}

                    {alert.resolved && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>تمت المراجعة</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.createdAtDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-kufi">
                      {alert.studentName}
                    </h3>
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span>
                        الامتحان:{' '}
                        <strong className="text-slate-900 dark:text-white">{alert.quizTitle}</strong>
                      </span>
                      {alert.studentPhone && (
                        <span className="font-mono flex items-center gap-1 text-teal-700 dark:text-teal-300">
                          <Phone className="w-3 h-3" />
                          {alert.studentPhone}
                        </span>
                      )}
                      {alert.studentEmail && (
                        <span className="font-mono text-slate-500">{alert.studentEmail}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {matchedStudent && onAllowQuizRetake && (isCancelled || isQuizStillCancelled) && (
                    <button
                      type="button"
                      disabled={busyId === alert.id}
                      onClick={async () => {
                        setBusyId(alert.id);
                        try {
                          const ok = await onAllowQuizRetake(matchedStudent, alert.quizId, alert);
                          if (ok) {
                            showStatus(
                              'success',
                              `تم السماح للطالب (${alert.studentName}) بإعادة امتحان «${alert.quizTitle}».`
                            );
                          } else {
                            showStatus('error', 'تعذر تحديث صلاحية إعادة الامتحان في السحابة.');
                          }
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>السماح بإعادة الامتحان</span>
                    </button>
                  )}

                  {matchedStudent && onBlockToggleStudent && (
                    <button
                      type="button"
                      disabled={busyId === alert.id}
                      onClick={async () => {
                        setBusyId(alert.id);
                        try {
                          const nextBlocked = !isBlocked;
                          const ok = await onBlockToggleStudent(
                            matchedStudent,
                            nextBlocked,
                            nextBlocked
                              ? `تم الحظر بسبب مخالفات لجنة امتحان: ${alert.quizTitle}`
                              : ''
                          );
                          if (ok) {
                            showStatus(
                              'success',
                              nextBlocked
                                ? `تم حظر حساب الطالب (${matchedStudent.name}) فوراً.`
                                : `تم فك الحظر عن حساب الطالب (${matchedStudent.name}).`
                            );
                          } else {
                            showStatus('error', 'تعذر تحديث حالة الحظر في السحابة.');
                          }
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isBlocked ? 'فك حظر الطالب' : 'حظر الطالب'}</span>
                    </button>
                  )}

                  {onResolveAlert && !alert.resolved && (
                    <button
                      type="button"
                      disabled={busyId === alert.id}
                      onClick={async () => {
                        setBusyId(alert.id);
                        try {
                          await onResolveAlert({
                            ...alert,
                            resolved: true,
                            resolvedNote: 'تمت مراجعة التنبيه من لوحة المعلم',
                          });
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تمت المراجعة</span>
                    </button>
                  )}

                  {onDeleteAlert && (
                    <button
                      type="button"
                      disabled={busyId === alert.id}
                      onClick={async () => {
                        setBusyId(alert.id);
                        try {
                          await onDeleteAlert(alert.id);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer disabled:opacity-50"
                      title="حذف التنبيه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Recorded violation reasons */}
              <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  سجل المخالفات المرصودة داخل اللجنة:
                </div>
                <ul className="space-y-1 text-xs text-rose-700 dark:text-rose-300 font-semibold list-disc list-inside">
                  {alert.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}

        {visibleAlerts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
              لا توجد تنبيهات غش أو مخالفات في هذا القسم حالياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              جميع الامتحانات المراقبة تسير بانضباط، وأي محاولة خروج من اللجنة أو تصوير أو تسجيل شاشة ستظهر هنا تلقائياً فور حدوثها.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
