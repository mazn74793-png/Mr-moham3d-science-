import React, { useState } from 'react';
import { 
  Trophy, Users, UserX, UserCheck, MessageSquare, Phone, 
  Search, Filter, ExternalLink, Sparkles, Award, ArrowUpRight, 
  CheckCircle2, AlertTriangle, ShieldCheck, Edit3, Trash2, RotateCcw, 
  UserPlus, X, Check, AlertCircle, RefreshCw, Ban, Unlock, Lock, KeyRound, ShieldAlert, Plus
} from 'lucide-react';
import { UserProfile, GradeLevel, Lecture, Quiz, AttachmentFile } from '../types';
import { DEFAULT_GRADES, GradeItem } from '../types/siteConfig';

interface TeacherReportsManagerProps {
  students: UserProfile[];
  lectures: Lecture[];
  quizzes: Quiz[];
  attachments?: AttachmentFile[];
  grades?: GradeItem[];
  onUpdateStudent?: (student: UserProfile) => Promise<boolean> | boolean | void;
  onDeleteStudent?: (studentId: string) => Promise<boolean> | boolean | void;
  onAddStudent?: (student: UserProfile) => Promise<boolean> | boolean | void;
  studentsSyncError?: string | null;
  onRetryCloudSync?: () => Promise<void> | void;
}

export const TeacherReportsManager: React.FC<TeacherReportsManagerProps> = ({
  students,
  lectures,
  quizzes,
  attachments = [],
  grades,
  onUpdateStudent,
  onDeleteStudent,
  onAddStudent,
  studentsSyncError = null,
  onRetryCloudSync,
}) => {
  const [retryingSync, setRetryingSync] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  const handleRetrySyncClick = async () => {
    if (!onRetryCloudSync || retryingSync) return;
    setRetryingSync(true);
    try {
      await onRetryCloudSync();
    } finally {
      setRetryingSync(false);
    }
  };
  const resolvedGrades = grades && grades.length > 0 ? grades : DEFAULT_GRADES;
  const getGradeLabel = (gradeId?: string) => {
    if (!gradeId) return 'غير محدد';
    const found = resolvedGrades.find((g) => g.id === gradeId);
    return found?.badgeAr || found?.titleAr || gradeId;
  };
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Student Edit / Add Modal state
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // New Student form fields
  const [newStdName, setNewStdName] = useState('');
  const [newStdPhone, setNewStdPhone] = useState('');
  const [newStdParentPhone, setNewStdParentPhone] = useState('');
  const [newStdGrade, setNewStdGrade] = useState<GradeLevel>(
    resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third'
  );

  // Deletion confirm tracking
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Expanded Admin Permissions & Security Panel per student
  const [controllingStudentId, setControllingStudentId] = useState<string | null>(null);
  const [blockReasonDraft, setBlockReasonDraft] = useState<string>('');

  const handleToggleStudentBlock = async (std: UserProfile) => {
    if (!onUpdateStudent || savingAction) return;
    const nextBlocked = !Boolean(std.isBlocked);
    setSavingAction(true);
    try {
      const ok = await onUpdateStudent({
        ...std,
        isBlocked: nextBlocked,
        blockReason: nextBlocked
          ? blockReasonDraft.trim() || 'تم إيقاف الحساب مؤقتاً من قبل الإدارة.'
          : '',
      });
      if (ok === false) {
        showFeedback('تعذر حفظ حالة حظر الطالب في السحابة.', 'error');
        return;
      }
      showFeedback(
        nextBlocked
          ? `تم حظر الطالب (${std.name}) ومنعه من الدخول للمنصة.`
          : `تم فك الحظر وتفعيل حساب الطالب (${std.name}).`,
        'success'
      );
    } finally {
      setSavingAction(false);
    }
  };

  const handleUnlockQuizForStudent = async (std: UserProfile, quizId: string) => {
    if (!onUpdateStudent || savingAction) return;
    const nextCancelled = (std.cancelledQuizIds || []).filter((id) => id !== quizId);
    const nextPassed = (std.passedQuizIds || []).filter((id) => id !== quizId);
    const nextScores = { ...(std.quizScores || {}) };
    delete nextScores[quizId];
    const nextViolations = { ...(std.quizViolations || {}) };
    delete nextViolations[quizId];
    const vals = Object.values(nextScores);
    const nextAvg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

    setSavingAction(true);
    try {
      const ok = await onUpdateStudent({
        ...std,
        cancelledQuizIds: nextCancelled,
        passedQuizIds: nextPassed,
        quizScores: nextScores,
        quizViolations: nextViolations,
        score: nextAvg,
      });
      if (ok === false) {
        showFeedback('تعذر إعادة فتح الامتحان للطالب.', 'error');
        return;
      }
      showFeedback(`تم فتح الامتحان مجدداً للطالب (${std.name}) ومسح أي حظر سابق عليه.`, 'success');
    } finally {
      setSavingAction(false);
    }
  };

  const handleToggleLectureGrant = async (std: UserProfile, lecId: string) => {
    if (!onUpdateStudent || savingAction) return;
    const current = std.unlockedLectureIds || [];
    const exists = current.includes(lecId);
    const next = exists ? current.filter((id) => id !== lecId) : [...current, lecId];
    setSavingAction(true);
    try {
      const ok = await onUpdateStudent({ ...std, unlockedLectureIds: next });
      if (ok === false) {
        showFeedback('تعذر تعديل صلاحية المحاضرة في السحابة.', 'error');
        return;
      }
      showFeedback(
        exists ? `تم سحب الصلاحية اليدوية للمحاضرة من (${std.name}).` : `تم منح صلاحية المحاضرة للطالب (${std.name}).`,
        'success'
      );
    } finally {
      setSavingAction(false);
    }
  };

  const handleToggleAttachmentGrant = async (std: UserProfile, fileId: string) => {
    if (!onUpdateStudent || savingAction) return;
    const current = std.unlockedAttachmentIds || [];
    const exists = current.includes(fileId);
    const next = exists ? current.filter((id) => id !== fileId) : [...current, fileId];
    setSavingAction(true);
    try {
      const ok = await onUpdateStudent({ ...std, unlockedAttachmentIds: next });
      if (ok === false) {
        showFeedback('تعذر تعديل صلاحية المذكرة في السحابة.', 'error');
        return;
      }
      showFeedback(
        exists ? `تم سحب صلاحية المذكرة من (${std.name}).` : `تم منح صلاحية المذكرة للطالب (${std.name}).`,
        'success'
      );
    } finally {
      setSavingAction(false);
    }
  };

  const handleAdjustPoints = async (std: UserProfile, delta: number) => {
    if (!onUpdateStudent || savingAction) return;
    const nextPts = Math.max(0, (std.points ?? 0) + delta);
    setSavingAction(true);
    try {
      const ok = await onUpdateStudent({ ...std, points: nextPts });
      if (ok === false) {
        showFeedback('تعذر تعديل نقاط الطالب في السحابة.', 'error');
        return;
      }
      showFeedback(`أصبح رصيد (${std.name}) الآن ${nextPts} نقطة.`, 'success');
    } finally {
      setSavingAction(false);
    }
  };

  // Only consider student role (exclude teacher)
  const allStudents = students.filter((s) => s.role !== 'teacher');

  // Filter students
  const filteredStudents = allStudents.filter((std) => {
    if (filterGrade !== 'all' && std.grade !== filterGrade) return false;

    const watchedCount = std.watchedLectureIds?.length || 0;
    if (filterStatus === 'active' && watchedCount === 0) return false;
    if (filterStatus === 'absent' && watchedCount > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = std.name?.toLowerCase().includes(q);
      const matchPhone = std.phone?.includes(q) || std.parentPhone?.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    return true;
  });

  // Calculate high-level stats
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((s) => (s.watchedLectureIds?.length || 0) > 0).length;
  const absentStudents = totalStudents - activeStudents;

  // Leaderboard: Top 5 students based on real scores
  const topStudents = [...allStudents]
    .filter(s => (s.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  // Build WhatsApp URL for parent follow-up report
  const buildParentWhatsAppUrl = (student: UserProfile): string | null => {
    const parentPhoneClean = student.parentPhone?.replace(/\D/g, '') || '';
    if (!parentPhoneClean) return null;

    const watchedCount = student.watchedLectureIds?.length || 0;
    const gradeLecs = lectures.filter((l) => l.grade === student.grade);
    const totalLecs = gradeLecs.length || 1;
    const avgScore = student.score ?? 0;
    const isAttending = watchedCount > 0;

    const gradeArabic = getGradeLabel(student.grade);

    const message = `السلام عليكم ورحمة الله وبركاته،
عناية ولي أمر الطالب/ة (${student.name}) المحترم 🌸

نحيط سيادتكم علماً بتقرير المتابعة الدورية لمستوى الطالب في مادة الـ Chemistry & Science مع مستر محمد مصطفى (Senior Chemistry & Science Educator):
• الصف الدراسي: ${gradeArabic}
• الحصص المشاهدة: ${watchedCount} من إجمالي ${totalLecs} حصص
• حالة الحضور: ${isAttending ? 'ملتزم بالحضور والمتابعة ✅' : 'متغيب عن مشاهدة الحصص ⚠️'}
• متوسط درجات الامتحانات: ${avgScore}%

${isAttending ? 'نشكر الطالب على اجتهاده ونتمنى له دوام التوفيق.' : 'نرجو من سيادتكم حث الطالب على إنهاء الحصص المتأخرة والامتحانات لفتح المحاضرات القادمة.'}

لأي استفسار تواصلوا مع الدعم الفني للمنصة.`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/2${parentPhoneClean}?text=${encoded}`;
  };

  // Reset Student Quizzes / Progress
  const handleResetStudentProgress = async (student: UserProfile) => {
    if (!onUpdateStudent || savingAction) return;
    const updated: UserProfile = {
      ...student,
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      score: 0,
    };
    setSavingAction(true);
    try {
      const ok = await onUpdateStudent(updated);
      if (ok === false) {
        showFeedback('تعذر حفظ إعادة الضبط في السحابة — يرجى التحقق من الصلاحيات.', 'error');
        return;
      }
      showFeedback(`تمت إعادة ضبط محاولات الطالب (${student.name}) بنجاح.`, 'success');
    } finally {
      setSavingAction(false);
    }
  };

  // Save edited student
  const handleSaveEditedStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudent || savingAction) return;
    setSavingAction(true);
    try {
      const ok = await onUpdateStudent(editingStudent);
      if (ok === false) {
        showFeedback('تعذر حفظ تعديلات الطالب في السحابة — راجع صلاحيات الجلسة.', 'error');
        return;
      }
      const savedName = editingStudent.name;
      setEditingStudent(null);
      showFeedback(`تم تحديث بيانات الطالب (${savedName}) بنجاح!`, 'success');
    } finally {
      setSavingAction(false);
    }
  };

  // Handle create manual student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAction) return;
    if (!newStdName.trim()) {
      showFeedback('يرجى كتابة اسم الطالب.', 'error');
      return;
    }

    const created: UserProfile = {
      id: `std-${Date.now().toString().slice(-6)}`,
      name: newStdName.trim(),
      phone: newStdPhone.trim(),
      parentPhone: newStdParentPhone.trim(),
      grade: newStdGrade,
      role: 'student',
      profileCompleted: true,
      score: 0,
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      joinedAt: new Date().toISOString().split('T')[0],
    };

    if (onAddStudent) {
      setSavingAction(true);
      try {
        const ok = await onAddStudent(created);
        if (ok === false) {
          showFeedback('تعذر إضافة الطالب في السحابة — تحقق من تأكيد الحساب والصلاحيات.', 'error');
          return;
        }
      } finally {
        setSavingAction(false);
      }
    }
    setShowAddStudentModal(false);
    setNewStdName('');
    setNewStdPhone('');
    setNewStdParentPhone('');
    showFeedback(`تمت إضافة الطالب (${created.name}) بنجاح إلى السحابة.`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      
      {/* Sync Error Alert */}
      {studentsSyncError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{studentsSyncError}</span>
          </div>
          {onRetryCloudSync && (
            <button
              type="button"
              disabled={retryingSync}
              onClick={handleRetrySyncClick}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryingSync ? 'animate-spin' : ''}`} />
              <span>{retryingSync ? 'جاري التحميل...' : 'إعادة تحميل الطلاب الآن'}</span>
            </button>
          )}
        </div>
      )}

      {/* Inline Feedback Toast */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-sans font-bold shadow-md ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 text-emerald-800 dark:text-emerald-200'
            : feedbackMsg.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-rose-800 dark:text-rose-200'
            : 'bg-teal-50 dark:bg-teal-950/80 border border-teal-300 text-teal-800 dark:text-teal-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
            <span>لوحة متابعة الطلاب والغياب ولوحة الشرف 🎓</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans mt-1">
            سجل حقيقي ودقيق 100% للطلاب المسجلين ونسب حضورهم ودرجاتهم الفعلية في مادة Chemistry & Science.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRetryCloudSync && (
            <button
              type="button"
              disabled={retryingSync}
              onClick={handleRetrySyncClick}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryingSync ? 'animate-spin' : ''}`} />
              <span>{retryingSync ? 'جاري التحديث...' : 'تحديث من السحابة'}</span>
            </button>
          )}

          {onAddStudent && (
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-900/10 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة طالب يدوياً</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. SUMMARY STATS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-kufi">إجمالي الطلاب المسجلين</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totalStudents}
            </div>
            <span className="text-[10px] text-teal-600 font-sans">حسابات حقيقية مؤكدة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-kufi">ملتزمون بالحضور والمشاهدة</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {activeStudents}
            </div>
            <span className="text-[10px] text-emerald-600 font-sans">شاهدو الحصص بانتظام</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Absent Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-kufi">طلاب متغيبون عن المشاهدة</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {absentStudents}
            </div>
            <span className="text-[10px] text-rose-500 font-sans">يحتاجون متابعة مع ولي الأمر</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2. LEADERBOARD (لوحة شرف أوائل Chemistry & Science) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-teal-500/5 to-slate-900/5 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/40 shadow-md space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>لوحة الشرف الرسمية · أبطال Chemistry & Science 2026</span>
            </div>
            <h3 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
              أوائل الامتحانات وأعلى الطلاب تقييماً 🏆
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans">
              يتم ترتيب الطلاب تلقائياً وفقاً للنتائج الفعلية المحققة في كويزات وامتحانات المنصة.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-xs self-start sm:self-auto">
            تحديث فوري بالدرجات
          </div>
        </div>

        {topStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {topStudents.slice(0, 3).map((std, idx) => (
              <div 
                key={std.id}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  idx === 0 
                    ? 'bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-slate-900 border-amber-400 shadow-md'
                    : idx === 1 
                    ? 'bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700'
                    : 'bg-gradient-to-b from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-slate-900 border-orange-300 dark:border-orange-900'
                }`}
              >
                <div className="absolute top-4 left-4 text-2xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                    المركز {idx === 0 ? 'الأول' : idx === 1 ? 'الثاني' : 'الثالث'}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                    {std.name}
                  </h4>
                  <div className="text-xs text-slate-500 font-sans">
                    {getGradeLabel(std.grade)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">الدرجة الفعلية:</span>
                  <span className="text-xl font-extrabold font-mono text-teal-600 dark:text-teal-400">
                    {std.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs sm:text-sm">
            سيظهر الطلاب الأوائل هنا تلقائياً بمجرد إجرائهم لاختبارات المنصة وتحقيقهم درجات متميزة.
          </div>
        )}

      </div>

      {/* 3. DETAILED STUDENT ATTENDANCE & GRADES TABLE WITH FULL CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Table Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-kufi text-slate-900 dark:text-white">
              سجل تفاصيل الطلاب وإدارة الصلاحيات
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              تحكم كامل في تعديل بيانات الطلاب، إعادة المحاولات، وإرسال تقارير الغياب والحضور لأولياء الأمور.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الطالب أو الهاتف..."
                className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-teal-500 font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
            </div>

            {/* Grade Filter */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value as any)}
              className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-kufi"
            >
              <option value="all">جميع الصفوف</option>
              {resolvedGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.badgeAr}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden font-kufi"
            >
              <option value="all">كل الحالات</option>
              <option value="active">الملتزمون بالحضور فقط</option>
              <option value="absent">المتغيبون فقط</option>
            </select>
          </div>
        </div>

        {/* INLINE EDIT STUDENT PANEL */}
        {editingStudent && (
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border-2 border-teal-500/40 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                <span>تعديل بيانات الطالب</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    اسم الطالب
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الصف الدراسي
                  </label>
                  <select
                    value={editingStudent.grade}
                    onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value as GradeLevel })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                  >
                    {resolvedGrades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.badgeAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    هاتف الطالب
                  </label>
                  <input
                    type="text"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    هاتف ولي الأمر (واتساب)
                  </label>
                  <input
                    type="text"
                    value={editingStudent.parentPhone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-300 font-kufi">
                      رصيد نقاط الطالب (Points)
                    </label>
                    <div className="flex items-center gap-1">
                      {[25, 50, 100].map((bonus) => (
                        <button
                          key={bonus}
                          type="button"
                          onClick={() =>
                            setEditingStudent({
                              ...editingStudent,
                              points: Math.max(0, (Number(editingStudent.points) || 0) + bonus),
                            })
                          }
                          className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          +{bonus}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={10000000}
                    value={editingStudent.points ?? 0}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        points: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INLINE ADD STUDENT PANEL */}
        {showAddStudentModal && (
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border-2 border-teal-500/40 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600" />
                <span>إضافة طالب جديد يدوياً</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    اسم الطالب ثلاثي *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف أحمد محمود"
                    value={newStdName}
                    onChange={(e) => setNewStdName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الصف الدراسي
                  </label>
                  <select
                    value={newStdGrade}
                    onChange={(e) => setNewStdGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                  >
                    {resolvedGrades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.badgeAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    هاتف الطالب
                  </label>
                  <input
                    type="text"
                    placeholder="010XXXXXXXX"
                    value={newStdPhone}
                    onChange={(e) => setNewStdPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    هاتف ولي الأمر (واتساب)
                  </label>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={newStdParentPhone}
                    onChange={(e) => setNewStdParentPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                >
                  إضافة الطالب
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-kufi">
                <th className="py-3 px-3">الطالب</th>
                <th className="py-3 px-3">الصف</th>
                <th className="py-3 px-3">هاتف الطالب</th>
                <th className="py-3 px-3">هاتف ولي الأمر</th>
                <th className="py-3 px-3">الحصص المشاهدة</th>
                <th className="py-3 px-3">النقاط</th>
                <th className="py-3 px-3">التقييم</th>
                <th className="py-3 px-3">حالة الحضور</th>
                <th className="py-3 px-3 text-center">إجراءات الإدارة والمتابعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((std) => {
                const watchedCount = std.watchedLectureIds?.length || 0;
                const gradeLecs = lectures.filter((l) => l.grade === std.grade);
                const totalLecs = gradeLecs.length || 1;
                const isAttending = watchedCount > 0;

                return (
                  <React.Fragment key={std.id}>
                  <tr className={`transition-colors ${std.isBlocked ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'}`}>
                    
                    {/* Student Info */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white font-sans text-xs sm:text-sm">
                          {std.name}
                        </span>
                        {std.isBlocked && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                            محظور
                          </span>
                        )}
                        {(std.cancelledQuizIds?.length || 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                            إلغاء غش ({std.cancelledQuizIds?.length})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {std.email || std.id}
                      </div>
                    </td>

                    {/* Grade */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-teal-700 dark:text-teal-300">
                        {getGradeLabel(std.grade)}
                      </div>
                    </td>

                    {/* Student Phone */}
                    <td className="py-3.5 px-3 font-mono dir-ltr text-right text-slate-700 dark:text-slate-300">
                      {std.phone || '—'}
                    </td>

                    {/* Parent Phone */}
                    <td className="py-3.5 px-3 font-mono dir-ltr text-right text-amber-600 dark:text-amber-400 font-semibold">
                      {std.parentPhone || '—'}
                    </td>

                    {/* Watched Progress */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {watchedCount} / {totalLecs}
                        </span>
                        <div className="w-14 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((watchedCount / totalLecs) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {std.points ?? 0}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3 font-mono font-bold">
                      <span className={std.score && std.score >= 80 ? 'text-emerald-600' : std.score && std.score >= 50 ? 'text-amber-500' : 'text-slate-400'}>
                        {std.score ?? 0}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {std.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                          <Ban className="w-3 h-3" />
                          <span>محظور</span>
                        </span>
                      ) : isAttending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ملتزم ✅</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>غائب ⚠️</span>
                        </span>
                      )}
                    </td>

                    {/* Actions: Permissions + WhatsApp + Edit + Reset + Delete */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {onUpdateStudent && (
                          <button
                            type="button"
                            onClick={() => {
                              if (controllingStudentId === std.id) {
                                setControllingStudentId(null);
                              } else {
                                setControllingStudentId(std.id);
                                setBlockReasonDraft(std.blockReason || '');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                              controllingStudentId === std.id
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                            }`}
                            title="صلاحيات الطالب (حظر / فتح محاضرات / إعادة امتحان)"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>صلاحيات</span>
                          </button>
                        )}
                        
                        {/* WhatsApp Report Link */}
                        {(() => {
                          const waUrl = buildParentWhatsAppUrl(std);
                          if (!waUrl) {
                            return (
                              <button
                                type="button"
                                onClick={() => showFeedback('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.', 'error')}
                                className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center gap-1 opacity-50 cursor-not-allowed"
                                title="لا يوجد رقم هاتف مسجل لولي الأمر"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>واتساب</span>
                              </button>
                            );
                          }
                          return (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => showFeedback('تم فتح واتساب لإرسال تقرير المتابعة لولي الأمر بنجاح.', 'success')}
                              className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-xs"
                              title="إرسال تقرير حضور ودرجات بالواتساب لولي الأمر"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </a>
                          );
                        })()}

                        {/* Edit Student */}
                        {onUpdateStudent && (
                          <button
                            onClick={() => setEditingStudent({ ...std })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="تعديل بيانات الطالب والصف"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reset Quiz Attempts */}
                        {onUpdateStudent && (
                          <button
                            onClick={() => handleResetStudentProgress(std)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="إعادة ضبط محاولات الكويزات"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Student with Inline Confirmation */}
                        {onDeleteStudent && (
                          deleteConfirmId === std.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={savingAction}
                                onClick={async () => {
                                  if (savingAction) return;
                                  setSavingAction(true);
                                  try {
                                    const ok = await onDeleteStudent(std.id);
                                    if (ok === false) {
                                      showFeedback('تعذر حذف الطالب من السحابة — تحقق من الصلاحيات.', 'error');
                                      return;
                                    }
                                    setDeleteConfirmId(null);
                                    showFeedback(`تم حذف الطالب (${std.name}) من النظام.`, 'info');
                                  } finally {
                                    setSavingAction(false);
                                  }
                                }}
                                className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                              >
                                تأكيد
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(std.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="حذف حساب الطالب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}

                      </div>
                    </td>

                  </tr>

                  {/* EXPANDED ADMIN STUDENT CONTROL DRAWER */}
                  {controllingStudentId === std.id && onUpdateStudent && (
                    <tr>
                      <td colSpan={9} className="p-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-teal-200 dark:border-teal-800">
                        <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-teal-600" />
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-kufi">
                                  تحكم الإدارة المتقدم في حساب: {std.name}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  تحكم في الحظر، إعادة فتح الامتحانات الملغاة، منح صلاحية المحاضرات والمذكرات، وتعديل النقاط فورياً.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setControllingStudentId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer self-end sm:self-auto"
                            >
                              إغلاق اللوحة
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* 1. Account Block & Points Controls */}
                            <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-3">
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Ban className="w-4 h-4 text-rose-600" />
                                <span>حظر / تفعيل الحساب</span>
                              </div>
                              <input
                                type="text"
                                value={blockReasonDraft}
                                onChange={(e) => setBlockReasonDraft(e.target.value)}
                                placeholder="سبب الحظر (اختياري يظهر للطالب)..."
                                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                              <button
                                type="button"
                                disabled={savingAction}
                                onClick={() => handleToggleStudentBlock(std)}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                  std.isBlocked
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                              >
                                {std.isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                <span>{std.isBlocked ? 'فك حظر الحساب الآن' : 'حظر حساب الطالب فوراً'}</span>
                              </button>

                              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 space-y-2">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                  <span>تعديل سريع لرصيد النقاط:</span>
                                  <span className="font-mono text-amber-600 dark:text-amber-400">
                                    {std.points ?? 0} نقطة
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={savingAction}
                                    onClick={() => handleAdjustPoints(std, 25)}
                                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-[11px] cursor-pointer"
                                  >
                                    +25
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingAction}
                                    onClick={() => handleAdjustPoints(std, 50)}
                                    className="flex-1 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold font-mono text-[11px] cursor-pointer"
                                  >
                                    +50
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingAction}
                                    onClick={() => handleAdjustPoints(std, -25)}
                                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold font-mono text-[11px] cursor-pointer"
                                  >
                                    -25
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 2. Quizzes, Cheat Cancellations & Retake Unlock */}
                            <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-3">
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                                <span>حالة الامتحانات وإعادة الفتح</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {quizzes
                                  .filter((q) => !std.grade || q.grade === std.grade)
                                  .map((qz) => {
                                    const isCancelled = Boolean(std.cancelledQuizIds?.includes(qz.id));
                                    const scoreVal = std.quizScores?.[qz.id];
                                    const viol = std.quizViolations?.[qz.id];
                                    return (
                                      <div
                                        key={qz.id}
                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                                            {qz.title}
                                          </div>
                                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2">
                                            {isCancelled ? (
                                              <span className="text-rose-600 font-bold">ملغى (غش)</span>
                                            ) : scoreVal !== undefined ? (
                                              <span className="font-mono text-teal-600 font-bold">الدرجة: {scoreVal}%</span>
                                            ) : (
                                              <span>لم يُمتحن</span>
                                            )}
                                            {viol && (
                                              <span className="text-amber-600 font-bold">
                                                ({viol.count} مخالفات)
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {(isCancelled || scoreVal !== undefined || Boolean(viol)) && (
                                          <button
                                            type="button"
                                            disabled={savingAction}
                                            onClick={() => handleUnlockQuizForStudent(std, qz.id)}
                                            className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                                          >
                                            <Unlock className="w-3 h-3" />
                                            <span>{isCancelled ? 'فك الإلغاء' : 'إعادة'}</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* 3. Manual Grant/Revoke Lectures & Handouts */}
                            <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-3">
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-teal-600" />
                                <span>منح/سحب المحاضرات والمذكرات يدوياً</span>
                              </div>

                              <div className="max-h-48 overflow-y-auto space-y-1.5">
                                {lectures
                                  .filter((l) => !std.grade || l.grade === std.grade)
                                  .map((lec) => {
                                    const granted = Boolean(std.unlockedLectureIds?.includes(lec.id));
                                    return (
                                      <button
                                        key={lec.id}
                                        type="button"
                                        disabled={savingAction}
                                        onClick={() => handleToggleLectureGrant(std, lec.id)}
                                        className={`w-full p-2 rounded-xl border text-start text-[11px] font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                          granted
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className="truncate">🎥 {lec.title}</span>
                                        <span className="shrink-0 flex items-center gap-1">
                                          {granted ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 opacity-50" />}
                                          <span>{granted ? 'مفتوحة' : 'منح'}</span>
                                        </span>
                                      </button>
                                    );
                                  })}

                                {attachments
                                  .filter((f) => !std.grade || f.grade === std.grade)
                                  .map((file) => {
                                    const granted = Boolean(std.unlockedAttachmentIds?.includes(file.id));
                                    return (
                                      <button
                                        key={file.id}
                                        type="button"
                                        disabled={savingAction}
                                        onClick={() => handleToggleAttachmentGrant(std, file.id)}
                                        className={`w-full p-2 rounded-xl border text-start text-[11px] font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                          granted
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className="truncate">📄 {file.title}</span>
                                        <span className="shrink-0 flex items-center gap-1">
                                          {granted ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 opacity-50" />}
                                          <span>{granted ? 'مفتوحة' : 'منح'}</span>
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="p-10 text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                studentsSyncError
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600'
              }`}>
                {studentsSyncError ? <AlertCircle className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 font-kufi text-base">
                {studentsSyncError
                  ? 'تعذر قراءة سجل الطلاب من السحابة حالياً'
                  : 'لا توجد بيانات طلاب مطابقة'}
              </h4>
              <p className="text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
                {studentsSyncError
                  ? `${studentsSyncError} (ملاحظة: بيانات الطلاب لم تُحذف، هي محمية في السحابة حتى يتم التحقق من صلاحية الجلسة الحالية).`
                  : allStudents.length === 0
                  ? 'لم يسجل أي طالب في المنصة حتى الآن. شارك رابط موقعك مع طلابك، وستظهر بياناتهم الحقيقية ودرجاتهم الفعلية هنا فوراً.'
                  : 'جرب تغيير شروط الفلتر أو كتابة اسم طالب آخر في خانة البحث.'}
              </p>
              {studentsSyncError && onRetryCloudSync && (
                <button
                  type="button"
                  disabled={retryingSync}
                  onClick={handleRetrySyncClick}
                  className="mx-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryingSync ? 'animate-spin' : ''}`} />
                  <span>{retryingSync ? 'جاري إعادة التحميل...' : 'تحديث الصلاحيات وإعادة تحميل الطلاب'}</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
