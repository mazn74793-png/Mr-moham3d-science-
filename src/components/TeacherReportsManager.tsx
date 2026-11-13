import React, { useState } from 'react';
import { 
  Trophy, Users, UserX, UserCheck, MessageSquare, Phone, 
  Search, Filter, ExternalLink, Sparkles, Award, ArrowUpRight, 
  CheckCircle2, AlertTriangle, ShieldCheck, Edit3, Trash2, RotateCcw, 
  UserPlus, X, Check, AlertCircle
} from 'lucide-react';
import { UserProfile, GradeLevel, Lecture, Quiz } from '../types';
import { DEFAULT_GRADES, GradeItem } from '../types/siteConfig';

interface TeacherReportsManagerProps {
  students: UserProfile[];
  lectures: Lecture[];
  quizzes: Quiz[];
  grades?: GradeItem[];
  onUpdateStudent?: (student: UserProfile) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddStudent?: (student: UserProfile) => void;
}

export const TeacherReportsManager: React.FC<TeacherReportsManagerProps> = ({
  students,
  lectures,
  quizzes,
  grades,
  onUpdateStudent,
  onDeleteStudent,
  onAddStudent,
}) => {
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
  const handleResetStudentProgress = (student: UserProfile) => {
    if (!onUpdateStudent) return;
    const updated: UserProfile = {
      ...student,
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      score: 0,
    };
    onUpdateStudent(updated);
    showFeedback(`تمت إعادة ضبط محاولات الطالب (${student.name}) بنجاح.`, 'success');
  };

  // Save edited student
  const handleSaveEditedStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudent) return;
    onUpdateStudent(editingStudent);
    setEditingStudent(null);
    showFeedback(`تم تحديث بيانات الطالب (${editingStudent.name}) بنجاح!`, 'success');
  };

  // Handle create manual student
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
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
      onAddStudent(created);
    }
    setShowAddStudentModal(false);
    setNewStdName('');
    setNewStdPhone('');
    setNewStdParentPhone('');
    showFeedback(`تمت إضافة الطالب (${created.name}) بنجاح إلى النظام.`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in text-right">
      
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
                  <tr key={std.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white font-sans text-xs sm:text-sm">
                        {std.name}
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

                    {/* Score */}
                    <td className="py-3.5 px-3 font-mono font-bold">
                      <span className={std.score && std.score >= 80 ? 'text-emerald-600' : std.score && std.score >= 50 ? 'text-amber-500' : 'text-slate-400'}>
                        {std.score ?? 0}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {isAttending ? (
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

                    {/* Actions: WhatsApp Report + Edit + Reset + Delete */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
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
                                onClick={() => {
                                  onDeleteStudent(std.id);
                                  setDeleteConfirmId(null);
                                  showFeedback(`تم حذف الطالب (${std.name}) من النظام.`, 'info');
                                }}
                                className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
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
                );
              })}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 font-kufi text-base">
                لا توجد بيانات طلاب مطابقة
              </h4>
              <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
                {allStudents.length === 0 
                  ? 'لم يسجل أي طالب في المنصة حتى الآن. شارك رابط موقعك مع طلابك، وستظهر بياناتهم الحقيقية ودرجاتهم الفعلية هنا فوراً.'
                  : 'جرب تغيير شروط الفلتر أو كتابة اسم طالب آخر في خانة البحث.'}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold font-kufi text-slate-900 dark:text-white">
                تعديل بيانات الطالب
              </h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  الصف الدراسي
                </label>
                <select
                  value={editingStudent.grade}
                  onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value as GradeLevel })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden font-mono"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600" />
                <span>إضافة طالب جديد يدوياً</span>
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3">
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  الصف الدراسي
                </label>
                <select
                  value={newStdGrade}
                  onChange={(e) => setNewStdGrade(e.target.value as GradeLevel)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden font-mono"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  إضافة الطالب
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
