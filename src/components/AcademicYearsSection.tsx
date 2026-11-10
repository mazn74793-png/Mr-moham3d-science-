import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, ArrowLeft, Check, Sparkles, 
  Video, FileText, Flame
} from 'lucide-react';
import { GradeLevel } from '../types';

interface AcademicYearsSectionProps {
  onSelectGrade: (grade: GradeLevel) => void;
  onPreviewCurriculum: (grade: GradeLevel) => void;
}

interface GradeCardData {
  grade: GradeLevel;
  badge: string;
  yearLabel: string;
  title: string;
  description: string;
  topics: string[];
  lecturesCount: string;
  filesCount: string;
  bgGradient: string;
  accentColor: string;
  isPopular?: boolean;
}

const GRADES_DATA: GradeCardData[] = [
  {
    grade: 'first',
    badge: 'الصف الأول الثانوي',
    yearLabel: 'دفعة 2026',
    title: 'أولى ثانوي · التأسيس الشامل',
    description: 'مدخلك السلس لعالم الكيمياء وبناء عقلية علمية قوية لحل مسائل المول والمعادلات الأيونية بكل سهولة.',
    topics: [
      'الباب الأول: الكيمياء مركز العلوم وتقنيات النانو',
      'الباب الثاني: الكيمياء الكمية وحساب المول والمعادلات',
      'الباب الثالث: المحاليل والغرويات والأحماض والقواعد',
    ],
    lecturesCount: '28 محاضرة تفاعلية',
    filesCount: '14 مذكرة واختبار',
    bgGradient: 'from-slate-900 via-teal-950 to-slate-900',
    accentColor: 'text-teal-400',
  },
  {
    grade: 'second',
    badge: 'الصف الثاني الثانوي',
    yearLabel: 'دفعة 2026',
    title: 'تانية ثانوي · فهم الذرة والروابط',
    description: 'فهم عميق لأعداد الكم، التوزيع الإلكتروني، وتدرج الخواص في الجدول الدوري الحديث وقواعد لويس والتهجين.',
    topics: [
      'الباب الأول: بنية الذرة وتجربة رذرفورد ونظرية بور',
      'الباب الثاني: الجدول الدوري ونصف القطر والسالبية والتأين',
      'الباب الثالث: الروابط الكيميائية ونظريات التهجين الجزيئي',
    ],
    lecturesCount: '36 محاضرة تفاعلية',
    filesCount: '20 مذكرة واختبار',
    bgGradient: 'from-slate-900 via-sky-950 to-slate-900',
    accentColor: 'text-sky-400',
  },
  {
    grade: 'third',
    badge: 'الصف الثالث الثانوي',
    yearLabel: 'دفعة 2026 الثانوية العامة 🔥',
    title: 'تالتة ثانوي · طريق الدرجة النهائية (60/60)',
    description: 'المنهج الكامل مع خريطة طريق الكيمياء العضوية الأسطورية ومعادلات الحديد والاتزان الكيميائي الكهربي.',
    topics: [
      'الباب الأول: العناصر الانتقالية والمركبات والخواص المغناطيسية',
      'الباب الثاني: التحليل الكيميائي الكيفي والكمي والمسائل',
      'الباب الثالث: الاتزان الكيميائي والأيوني وقانون لوشاتيليه',
      'الباب الرابع: الكيمياء الكهربية والخلايا الجلفانية وقوانين فاراداي',
      'الباب الخامس: الكيمياء العضوية الأسطورية الشاملة',
    ],
    lecturesCount: '65 محاضرة كاملة',
    filesCount: '30 بنك أسئلة واختبار',
    bgGradient: 'from-teal-950 via-slate-950 to-teal-900',
    accentColor: 'text-amber-400',
    isPopular: true,
  },
];

export const AcademicYearsSection: React.FC<AcademicYearsSectionProps> = ({
  onSelectGrade,
}) => {
  const [currentIndex, setCurrentIndex] = useState(2); // Start on 3rd Secondary (flagship)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  // Scroll to index
  const scrollToIndex = (idx: number) => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth;
    sliderRef.current.scrollTo({
      left: idx * width,
      behavior: 'smooth',
    });
    setCurrentIndex(idx);
  };

  // Next / Previous navigation
  const handleNext = () => {
    const next = (currentIndex + 1) % GRADES_DATA.length;
    scrollToIndex(next);
  };

  const handlePrev = () => {
    const prev = (currentIndex - 1 + GRADES_DATA.length) % GRADES_DATA.length;
    scrollToIndex(prev);
  };

  // Auto-play timer (slides automatically every 4.5 seconds)
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      setCurrentIndex((prev) => {
        const next = (prev + 1) % GRADES_DATA.length;
        if (sliderRef.current) {
          const width = sliderRef.current.clientWidth;
          sliderRef.current.scrollTo({
            left: next * width,
            behavior: 'smooth',
          });
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Handle manual swipe/scroll update
  const handleScroll = () => {
    if (!sliderRef.current) return;
    const scrollLeft = Math.abs(sliderRef.current.scrollLeft);
    const width = sliderRef.current.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex >= 0 && newIndex < GRADES_DATA.length && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  return (
    <section id="academic-years" className="py-16 sm:py-20 bg-[#fafffb] dark:bg-slate-950 transition-colors w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <span>السنوات الدراسية المتاحة</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-kufi">
            السنوات الدراسية 🎓
          </h2>
          
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 font-sans">
            اختار السنة الدراسية وتصفح محتواها التفاعلي في بطاقة ذكية واحدة تتحرك تلقائياً وتدعم التمرير
          </p>
        </div>

        {/* SINGLE MASTER INTERACTIVE CARD WITH HORIZONTAL SCROLL & AUTO-MOVEMENT */}
        <div 
          className="relative max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl shadow-2xl border-2 border-teal-500/30 overflow-hidden"
          onMouseEnter={() => { isInteractingRef.current = true; }}
          onMouseLeave={() => { isInteractingRef.current = false; }}
          onTouchStart={() => { isInteractingRef.current = true; }}
          onTouchEnd={() => { isInteractingRef.current = false; }}
        >

          {/* Top Control Bar: Grade Tabs Centered */}
          <div className="p-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-center">
            
            {/* Grade Switcher Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800 overflow-x-auto scrollbar-none w-full sm:w-auto justify-center">
              {GRADES_DATA.map((item, idx) => (
                <button
                  key={item.grade}
                  onClick={() => scrollToIndex(idx)}
                  className={`flex-1 sm:flex-none py-2 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold font-kufi transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    currentIndex === idx
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md scale-102'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.isPopular && <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  <span>{item.badge}</span>
                </button>
              ))}
            </div>

          </div>

          {/* HORIZONTAL SWIPABLE TRACK */}
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex flex-row overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none w-full"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {GRADES_DATA.map((card, idx) => (
              <div
                key={card.grade}
                className="w-full shrink-0 snap-start p-6 sm:p-10 flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <span className="text-xs font-bold font-mono px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{card.badge}</span>
                    </span>
                    
                    <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${
                      card.isPopular 
                        ? 'bg-amber-400 text-slate-950 shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {card.yearLabel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white font-kufi mb-3">
                    {card.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-sans">
                    {card.description}
                  </p>

                  {/* Syllabus Points */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-kufi mb-2">
                      محتويات منهج الدفعة:
                    </div>
                    {card.topics.map((topic, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats Badges */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3 border-y border-slate-100 dark:border-slate-800 mb-8">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <span>{card.lecturesCount}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span>{card.filesCount}</span>
                    </div>
                  </div>

                </div>

                {/* Main Action Button */}
                <div>
                  <button
                    onClick={() => onSelectGrade(card.grade)}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-98 min-h-[52px] font-kufi ${
                      card.isPopular
                        ? 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-teal-900/20'
                    }`}
                  >
                    <span>دخول محاضرات {card.badge}</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Bottom Dots Indicator */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {GRADES_DATA.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => scrollToIndex(dotIdx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === dotIdx
                      ? 'w-8 bg-teal-600 dark:bg-teal-400'
                      : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  aria-label={`انتقال للصف رقم ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
