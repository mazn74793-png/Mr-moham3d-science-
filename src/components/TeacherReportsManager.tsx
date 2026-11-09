import React, { useState } from 'react';
import { 
  Trophy, Users, UserX, UserCheck, MessageSquare, Phone, 
  Search, Filter, ExternalLink, Sparkles, Award, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { UserProfile, GradeLevel, Lecture, Quiz } from '../types';

interface TeacherReportsManagerProps {
  students: UserProfile[];
  lectures: Lecture[];
  quizzes: Quiz[];
}

export const TeacherReportsManager: React.FC<TeacherReportsManagerProps> = ({
  students,
  lectures,
  quizzes,
}) => {
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Only consider student role (exclude teacher)
  const allStudents = students.filter((s) => s.role !== 'teacher');

  // Filter students
  const filteredStudents = allStudents.filter((std) => {
    // Grade filter
    if (filterGrade !== 'all' && std.grade !== filterGrade) return false;

    // Status filter (absent = watched 0 lectures or 0 quizzes)
    const watchedCount = std.watchedLectureIds?.length || 0;
    if (filterStatus === 'active' && watchedCount === 0) return false;
    if (filterStatus === 'absent' && watchedCount > 0) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = std.name?.toLowerCase().includes(q);
      const matchPhone = std.phone?.includes(q) || std.parentPhone?.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    return true;
  });

  // Calculate high-level metrics
  const totalCount = allStudents.length;
  const activeCount = allStudents.filter((s) => (s.watchedLectureIds?.length || 0) > 0).length;
  const absentCount = allStudents.filter((s) => (s.watchedLectureIds?.length || 0) === 0).length;
  
  // Calculate top students for Leaderboard (Honor Roll)
  const sortedForLeaderboard = [...allStudents]
    .filter((s) => (s.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  // Send WhatsApp message to parent
  const handleSendParentWhatsApp = (student: UserProfile) => {
    const parentPhoneClean = student.parentPhone?.replace(/\D/g, '') || '';
    if (!parentPhoneClean) {
      alert('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
      return;
    }

    const watchedCount = student.watchedLectureIds?.length || 0;
    const gradeLecs = lectures.filter((l) => l.grade === student.grade);
    const totalLecs = gradeLecs.length || 1;
    const avgScore = student.score ?? 0;
    const isAttending = watchedCount > 0;

    const gradeArabic = student.grade === 'third' 
      ? 'الثالث الثانوي (دفعة 2026)' 
      : student.grade === 'second' 
      ? 'الثاني الثانوي' 
      : 'الأول الثانوي';

    const message = `السلام عليكم ورحمة الله وبركاته،
عناية ولي أمر الطالب/ة (${student.name}) المحترم 🌸

نحيط سيادتكم علماً بتقرير المتابعة الدورية لمستوى الطالب في مادة الكيمياء مع الأستاذ محمد مصطفى (قيصر الكيمياء):
• الصف الدراسي: ${gradeArabic}
• الحصص المشاهدة: ${watchedCount} من إجمالي ${totalLecs} حصص
• حالة الحضور: ${isAttending ? 'ملتزم بالحضور والمتابعة ✅' : 'متغيب عن مشاهدة الحصص ⚠️'}
• متوسط درجات الامتحانات: ${avgScore}%

${isAttending ? 'نشكر الطالب على اجتهاده ونتمنى له دوام التوفيق.' : 'نرجو من سيادتكم حث الطالب على إنهاء الحصص المتأخرة والامتحانات لفتح المحاضرات القادمة.'}

لأي استفسار تواصلوا مع الدعم الفني للمنصة.`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/2${parentPhoneClean}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* 1. TOP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold font-kufi">إجمالي الطلاب المسجلين</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalCount}
          </div>
          <div className="text-[11px] text-teal-600 font-sans">بيانات حقيقية مسجلة بالمنصة</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold font-kufi">الملتزمين بالحضور والمشاهدة</span>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">
            {activeCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-sans">
            {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% نسبة الحضور` : '0%'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold font-kufi">الطلاب الغائبين عن الحصص</span>
            <UserX className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 font-mono">
            {absentCount}
          </div>
          <div className="text-[11px] text-rose-500 font-sans">يتطلب إرسال إنذار ومتابعة أولياء الأمور</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold font-kufi">أبطال لوحة الشرف</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-500 font-mono">
            {sortedForLeaderboard.length}
          </div>
          <div className="text-[11px] text-amber-600 font-sans">أعلى درجات تقفيل في الامتحانات</div>
        </div>

      </div>

      {/* 2. LEADERBOARD (لوحة شرف أوائل الكيمياء) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-teal-500/5 to-slate-900/5 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/40 shadow-md space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>لوحة الشرف الرسمية · أبطال قيصر الكيمياء 2026</span>
            </div>
            <h3 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
              أوائل الجمهورية وأعلى الطلاب تقييماً في الامتحانات 🏆
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              يتم ترتيب الطلاب تلقائياً وفقاً للنتائج الفعلية المحققة في كويزات وامتحانات المنصة.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-xs self-start sm:self-auto">
            تحديث فوري بالدرجات
          </div>
        </div>

        {/* Podium / Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedForLeaderboard.slice(0, 3).map((std, rankIdx) => {
            const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'];
            const colors = [
              'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
              'border-slate-300 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white',
              'border-amber-700/50 bg-amber-950/20 text-amber-800 dark:text-amber-300',
            ];

            return (
              <div
                key={std.id}
                className={`p-6 rounded-3xl border-2 shadow-sm space-y-4 text-center transition-all hover:scale-102 ${colors[rankIdx]}`}
              >
                <div className="text-xs font-bold font-mono tracking-wider">
                  {medals[rankIdx]}
                </div>

                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-bold text-2xl flex items-center justify-center font-kufi shadow-md">
                  {std.name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold font-kufi text-slate-900 dark:text-white">
                    {std.name}
                  </h4>
                  <div className="text-xs text-slate-500 font-sans">
                    {std.grade === 'third' ? 'تالتة ثانوي' : std.grade === 'second' ? 'تانية ثانوي' : 'أولى ثانوي'}
                    {std.governorate ? ` · ${std.governorate}` : ''}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-center gap-2">
                  <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {std.score}%
                  </span>
                  <span className="text-xs font-bold text-slate-500">الدرجة التراكمية</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. STUDENT ATTENDANCE & ABSENTEE REPORT TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-kufi text-slate-900 dark:text-white">
              سجل حضور وغياب الطلاب ومتابعة الحصص
            </h3>
            <p className="text-xs text-slate-500">
              تابع من شاهد المحاضرات ومن تخلف عنها لإرسال تقرير فوري لولي الأمر عبر الواتساب.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="p-2.5 pr-8 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
            </div>

            {/* Grade Filter */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value as any)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">جميع الصفوف</option>
              <option value="first">أولى ثانوي</option>
              <option value="second">تانية ثانوي</option>
              <option value="third">تالتة ثانوي</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">الكل (حضور وغياب)</option>
              <option value="active">الملتزمين بالحضور ✅</option>
              <option value="absent">المتغيبين عن المشاهدة ⚠️</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-kufi">
                <th className="py-3 px-3">الطالب</th>
                <th className="py-3 px-3">الصف والمحافظة</th>
                <th className="py-3 px-3">هاتف الطالب</th>
                <th className="py-3 px-3">هاتف ولي الأمر</th>
                <th className="py-3 px-3">الحصص المشاهدة</th>
                <th className="py-3 px-3">التقييم</th>
                <th className="py-3 px-3">حالة الحضور</th>
                <th className="py-3 px-3 text-center">إجراء المتابعة</th>
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
                        {std.id}
                      </div>
                    </td>

                    {/* Grade & Gov */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-teal-700 dark:text-teal-300">
                        {std.grade === 'third' ? 'تالتة ثانوي' : std.grade === 'second' ? 'تانية ثانوي' : 'أولى ثانوي'}
                      </div>
                      <div className="text-[10px] text-slate-500">{std.governorate || 'غير محدد'}</div>
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
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleSendParentWhatsApp(std)}
                        disabled={!std.parentPhone}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed mx-auto active:scale-95"
                        title="إرسال تقرير حضور ودرجات بالواتساب لولي الأمر"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>تقرير واتساب</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              لا توجد بيانات طلاب مطابقة لخيارات البحث المحددة.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
