import React, { useState } from 'react';
import { BookOpen, GraduationCap, ArrowLeft, Check, Sparkles, Video, FileText, ChevronLeft } from 'lucide-react';
import { GradeLevel } from '../types';

interface AcademicYearsSectionProps {
  onSelectGrade: (grade: GradeLevel) => void;
  onPreviewCurriculum: (grade: GradeLevel) => void;
}

export const AcademicYearsSection: React.FC<AcademicYearsSectionProps> = ({
  onSelectGrade,
  onPreviewCurriculum,
}) => {
  return (
    <section id="academic-years" className="py-20 bg-[#fafffb] dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <span>السنوات الدراسية المتاحة</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-kufi">
            السنوات الدراسية
          </h2>
          
          {/* Exact Subtitle required */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-sans">
            اختار السنة الدراسية وادخل علي المحاضرات المتاحة لدفعة 2026
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* 1. الصف الأول الثانوي */}
          <div className="group rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-2xl hover-card-lift transition-all duration-300 flex flex-col justify-between relative cursor-default">

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  الصف الأول الثانوي
                </span>
                <span className="text-xs text-slate-500 font-mono">دفعة 2026</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-kufi mb-2">
                أولى ثانوي · التأسيس الشامل
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                مدخلك السلس لعالم الكيمياء وبناء عقلية علمية قوية لحل مسائل المول والمعادلات الأيونية بكل سهولة.
              </p>

              <div className="space-y-2.5 mb-6 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>الباب الأول: الكيمياء مركز العلوم والنانو</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>الباب الثاني: الكيمياء الكمية وحساب المول</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>الباب الثالث: المحاليل والغرويات والأحماض</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 py-3 border-y border-slate-100 dark:border-slate-800 mb-6">
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-teal-600" />
                  28 محاضرة
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  14 مذكرة واختبار
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onSelectGrade('first')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[48px]"
              >
                <span>دخول محاضرات أولى ثانوي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. الصف الثاني الثانوي */}
          <div className="group rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-2xl hover-card-lift transition-all duration-300 flex flex-col justify-between relative cursor-default">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  الصف الثاني الثانوي
                </span>
                <span className="text-xs text-slate-500 font-mono">دفعة 2026</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-kufi mb-2">
                تانية ثانوي · فهم الذرة والروابط
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                فهم عميق لأعداد الكم، التوزيع الإلكتروني، وتدرج الخواص في الجدول الدوري الحديث وقواعد لويس.
              </p>

              <div className="space-y-2.5 mb-6 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>الباب الأول: بنية الذرة وتجربة رذرفورد وبور</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>الباب الثاني: الجدول الدوري ونصف القطر والتأين</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>الباب الثالث: الروابط الكيميائية والتهجين الجزيئي</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 py-3 border-y border-slate-100 dark:border-slate-800 mb-6">
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-teal-600" />
                  36 محاضرة
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  20 مذكرة واختبار
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onSelectGrade('second')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:bg-teal-600 group-hover:text-white active:scale-95 min-h-[48px]"
              >
                <span>دخول محاضرات تانية ثانوي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. الصف الثالث الثانوي (Flagship / Highlighted) */}
          <div className="group rounded-3xl p-7 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white border-2 border-teal-400/80 shadow-2xl shadow-teal-900/40 hover-card-lift hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-default">

            
            {/* Top Badge: الأكثر إقبالاً */}
            <div className="absolute top-0 left-0 bg-amber-400 text-slate-950 text-xs font-bold px-4 py-1 rounded-br-2xl font-mono shadow-sm">
              الأقوى · دفعة الثانوية العامة 2026 🔥
            </div>

            <div className="pt-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  الصف الثالث الثانوي
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white font-kufi mb-2">
                تالتة ثانوي · طريق الدرجة النهائية
              </h3>
              
              <p className="text-sm text-teal-100 leading-relaxed mb-6 font-sans">
                المنهج الكامل مع خريطة طريق الكيمياء العضوية ومعادلات الحديد والاتزان الكيميائي لضمان الـ 60/60.
              </p>

              <div className="space-y-2.5 mb-6 text-sm text-teal-50">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>العناصر الانتقالية والخواص المغناطيسية</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>التحليل الكيميائي الكيفي والكمي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الاتزان الكيميائي وقانون لوشاتيليه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الكيمياء الكهربية وقوانين فاراداي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الكيمياء العضوية الأسطورية الشاملة</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-teal-300 py-3 border-y border-teal-800/80 mb-6">
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-amber-400" />
                  65 محاضرة
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  30 بنك أسئلة شامل
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onSelectGrade('third')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[48px]"
              >
                <span>دخول محاضرات تالتة ثانوي 2026</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
