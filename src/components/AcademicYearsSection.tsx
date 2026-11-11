import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, ArrowLeft, ArrowRight, Check, Sparkles, 
  Video, FileText
} from 'lucide-react';
import { GradeLevel, Lecture, AttachmentFile } from '../types';
import { SiteConfig } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';

interface AcademicYearsSectionProps {
  siteConfig?: SiteConfig;
  lectures?: Lecture[];
  attachments?: AttachmentFile[];
  onSelectGrade: (grade: GradeLevel) => void;
  onPreviewCurriculum?: (grade: GradeLevel) => void;
}

interface GradeCardData {
  grade: GradeLevel;
  badgeAr: string;
  badgeEn: string;
  yearLabelAr: string;
  yearLabelEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  topicsAr: string[];
  topicsEn: string[];
  isPopular?: boolean;
}

const BASE_GRADES_DATA: GradeCardData[] = [
  {
    grade: 'first',
    badgeAr: 'الصف الأول الثانوي',
    badgeEn: '1st Secondary Grade',
    yearLabelAr: 'دفعة 2026',
    yearLabelEn: 'Class of 2026',
    titleAr: 'أولى ثانوي · التأسيس الشامل',
    titleEn: '1st Sec · Foundational Chemistry & Science',
    descriptionAr: 'مدخلك السلس لعالم الكيمياء وبناء عقلية علمية قوية لحل مسائل المول والمعادلات الأيونية بكل سهولة لمدارس اللغات والتجريبي.',
    descriptionEn: 'Your gateway to Chemistry & Science. Build strong problem-solving skills for mole concepts, ionic equations, and laboratory sciences.',
    topicsAr: [
      'الباب الأول: الكيمياء مركز العلوم وتقنيات النانو (Chemistry & Nanotechnology)',
      'الباب الثاني: الكيمياء الكمية وحساب المول والمعادلات (Stoichiometry & Mole Calculations)',
      'الباب الثالث: المحاليل والغرويات والأحماض والقواعد (Solutions, Acids & Bases)',
    ],
    topicsEn: [
      'Unit 1: Chemistry as the Central Science & Nanotechnology',
      'Unit 2: Quantitative Chemistry, Stoichiometry & The Mole',
      'Unit 3: Solutions, Colloids, Acids and Bases',
    ],
  },
  {
    grade: 'second',
    badgeAr: 'الصف الثاني الثانوي',
    badgeEn: '2nd Secondary Grade',
    yearLabelAr: 'دفعة 2026',
    yearLabelEn: 'Class of 2026',
    titleAr: 'تانية ثانوي · فهم الذرة والروابط',
    titleEn: '2nd Sec · Atomic Structure & Chemical Bonds',
    descriptionAr: 'فهم عميق لأعداد الكم، التوزيع الإلكتروني، وتدرج الخواص في الجدول الدوري الحديث وقواعد لويس والتهجين الجزيئي.',
    descriptionEn: 'Deep understanding of Quantum Numbers, Electronic Configuration, Periodic Table trends, and Hybridization theories.',
    topicsAr: [
      'الباب الأول: بنية الذرة وتجربة رذرفورد ونظرية بور (Atomic Structure & Bohr Theory)',
      'الباب الثاني: الجدول الدوري ونصف القطر والسالبية والتأين (Periodic Table Trends)',
      'الباب الثالث: الروابط الكيميائية ونظريات التهجين الجزيئي (Chemical Bonding & Hybridization)',
    ],
    topicsEn: [
      'Unit 1: Atomic Structure, Rutherford & Bohr Models',
      'Unit 2: The Periodic Table, Atomic Radii, Electronegativity & Ionization',
      'Unit 3: Chemical Bonding, Lewis Structures & Molecular Orbitals',
    ],
  },
  {
    grade: 'third',
    badgeAr: 'الصف الثالث الثانوي',
    badgeEn: '3rd Secondary Grade',
    yearLabelAr: 'دفعة 2026 الثانوية العامة 🔥',
    yearLabelEn: 'General Secondary 2026 🔥',
    titleAr: 'تالتة ثانوي · طريق الدرجة النهائية (60/60)',
    titleEn: '3rd Sec · Road to the Full Mark (60/60)',
    descriptionAr: 'المنهج الكامل مع خريطة طريق الكيمياء العضوية الأسطورية ومعادلات الحديد والاتزان الكيميائي الكهربي لطلاب اللغات والتجريبي.',
    descriptionEn: 'Comprehensive curriculum: Transition Metals, Iron Reactions roadmap, Chemical Equilibrium, Electrochemistry, and Complete Organic Chemistry.',
    topicsAr: [
      'الباب الأول: العناصر الانتقالية والمركبات والخواص المغناطيسية (Transition Elements)',
      'الباب الثاني: التحليل الكيميائي الكيفي والكمي والمسائل (Chemical Analysis)',
      'الباب الثالث: الاتزان الكيميائي والأيوني وقانون لوشاتيليه (Chemical Equilibrium)',
      'الباب الرابع: الكيمياء الكهربية والخلايا الجلفانية وقوانين فاراداي (Electrochemistry)',
      'الباب الخامس: الكيمياء العضوية الأسطورية الشاملة (Organic Chemistry)',
    ],
    topicsEn: [
      'Chapter 1: Transition Elements, Properties & Catalytic Activity',
      'Chapter 2: Qualitative and Quantitative Chemical Analysis',
      'Chapter 3: Chemical & Ionic Equilibrium (Le Chatelier)',
      'Chapter 4: Electrochemistry, Galvanic Cells & Faraday Laws',
      'Chapter 5: Comprehensive Organic Chemistry Mastery',
    ],
    isPopular: true,
  },
];

export const AcademicYearsSection: React.FC<AcademicYearsSectionProps> = ({
  siteConfig,
  lectures = [],
  attachments = [],
  onSelectGrade,
}) => {
  // Dynamically compute grade data with admin customized names
  const GRADES_DATA: GradeCardData[] = BASE_GRADES_DATA.map((card) => {
    if (!siteConfig) return card;
    if (card.grade === 'first') {
      return {
        ...card,
        titleAr: siteConfig.gradeFirstTitleAr || card.titleAr,
        titleEn: siteConfig.gradeFirstTitleEn || card.titleEn,
        badgeAr: siteConfig.gradeFirstBadgeAr || card.badgeAr,
        descriptionAr: siteConfig.gradeFirstDescAr || card.descriptionAr,
      };
    }
    if (card.grade === 'second') {
      return {
        ...card,
        titleAr: siteConfig.gradeSecondTitleAr || card.titleAr,
        titleEn: siteConfig.gradeSecondTitleEn || card.titleEn,
        badgeAr: siteConfig.gradeSecondBadgeAr || card.badgeAr,
        descriptionAr: siteConfig.gradeSecondDescAr || card.descriptionAr,
      };
    }
    if (card.grade === 'third') {
      return {
        ...card,
        titleAr: siteConfig.gradeThirdTitleAr || card.titleAr,
        titleEn: siteConfig.gradeThirdTitleEn || card.titleEn,
        badgeAr: siteConfig.gradeThirdBadgeAr || card.badgeAr,
        descriptionAr: siteConfig.gradeThirdDescAr || card.descriptionAr,
      };
    }
    return card;
  });
  const [currentIndex, setCurrentIndex] = useState(2); // Start on 3rd Secondary (flagship)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const { lang, isRtl } = useLanguage();

  const ActionArrow = isRtl ? ArrowLeft : ArrowRight;

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
    const nextIdx = (currentIndex + 1) % GRADES_DATA.length;
    scrollToIndex(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + GRADES_DATA.length) % GRADES_DATA.length;
    scrollToIndex(prevIdx);
  };

  // Auto-scroll loop every 4.5 seconds when not interacting
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      if (!isInteractingRef.current) {
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
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Handle user manual scroll
  const handleScroll = () => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth;
    const newIdx = Math.round(sliderRef.current.scrollLeft / width);
    if (newIdx >= 0 && newIdx < GRADES_DATA.length && newIdx !== currentIndex) {
      setCurrentIndex(newIdx);
    }
  };

  return (
    <section id="academic-years" className="py-12 sm:py-20 bg-[#fafffb] dark:bg-slate-950 transition-colors w-full max-w-full overflow-hidden font-cairo">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Secondary School Curriculum' : 'المراحل والصفوف الدراسية'}</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'en' ? 'Curriculum for Class of 2026' : 'المناهج التعليمية لدفعة 2026 ⚗️'}
          </h2>
          <p className="text-xs sm:text-base lg:text-lg text-slate-600 dark:text-slate-400">
            {lang === 'en'
              ? 'Select your secondary school grade to access specialized lessons, lectures and quizzes.'
              : 'اختر سنتك الدراسية للوصول لكافة المحاضرات المخصصة والشيتات والكويزات فوراً.'}
          </p>
        </div>

        {/* Grade Selector Tabs Strip */}
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 px-2">
          {GRADES_DATA.map((item, idx) => (
            <button
              key={item.grade}
              onClick={() => {
                scrollToIndex(idx);
                setIsAutoPlaying(false);
              }}
              className={`px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentIndex === idx
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20 scale-102'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-400'
              }`}
            >
              <span>{lang === 'en' ? item.badgeEn : item.badgeAr}</span>
              {item.isPopular && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* The Flagship Single Slider Card */}
        <div 
          className="relative max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-teal-200/80 dark:border-slate-800 shadow-xl overflow-hidden"
          onMouseEnter={() => { isInteractingRef.current = true; }}
          onMouseLeave={() => { isInteractingRef.current = false; }}
          onTouchStart={() => { isInteractingRef.current = true; }}
          onTouchEnd={() => { isInteractingRef.current = false; }}
        >
          {/* Scrollable Container */}
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex flex-row overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none w-full"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {GRADES_DATA.map((card) => {
              const gradeLectures = (lectures || []).filter(l => l.grade === card.grade);
              const gradeAttachments = (attachments || []).filter(a => a.grade === card.grade);

              const realLecturesCount = gradeLectures.length;
              const realFilesCount = gradeAttachments.length;

              // Distinct chapters added by the teacher
              const realChapters = Array.from(new Set(gradeLectures.map(l => l.chapter.trim()).filter(Boolean)));
              
              // Latest lecture titles
              const recentLectures = gradeLectures.slice(0, 3);

              return (
                <div
                  key={card.grade}
                  className="w-full shrink-0 snap-start p-5 sm:p-10 flex flex-col justify-between"
                >
                  <div>
                    
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <span className="text-xs font-bold font-mono px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? card.badgeEn : card.badgeAr}</span>
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{lang === 'en' ? 'Live Platform Data' : 'بيانات حقيقية لايف'}</span>
                        </span>

                        <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${
                          card.isPopular 
                            ? 'bg-amber-400 text-slate-950 shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {lang === 'en' ? card.yearLabelEn : card.yearLabelAr}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-3">
                      {lang === 'en' ? card.titleEn : card.titleAr}
                    </h3>

                    <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-5 sm:mb-6">
                      {lang === 'en' ? card.descriptionEn : card.descriptionAr}
                    </p>

                    {/* Dynamic Real Curriculum Topics */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-5 sm:mb-6 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                        <span>{lang === 'en' ? 'Curriculum Scope & Real Units:' : 'أبواب المنهج والمحتويات المسجلة بالمنصة:'}</span>
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-semibold">
                          {realChapters.length > 0 ? `${realChapters.length} أبواب مفعلة` : 'المنهج الوزاري'}
                        </span>
                      </div>

                      {/* Display either teacher's real chapters or syllabus default */}
                      {realChapters.length > 0 ? (
                        realChapters.map((chap, cIdx) => {
                          const chapLecsCount = gradeLectures.filter(l => l.chapter.trim() === chap).length;
                          return (
                            <div key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                              <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-semibold">{chap}</span>
                                <span className="text-[11px] text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 font-mono">
                                  {lang === 'en' ? `${chapLecsCount} sessions` : `${chapLecsCount} حصص`}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        (lang === 'en' ? card.topicsEn : card.topicsAr).map((topic, tIdx) => (
                          <div key={tIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                            <span>{topic}</span>
                          </div>
                        ))
                      )}

                      {/* Real Lecture Titles Highlight Strip */}
                      {recentLectures.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 text-[11px] text-slate-500 font-sans">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{lang === 'en' ? 'Latest added sessions: ' : 'أحدث الحصص المرفوعة: '}</span>
                          {recentLectures.map(l => l.title).join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* Stats Badges: Real Strictly-Calculated Counts */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3 border-y border-slate-100 dark:border-slate-800 mb-6 sm:mb-8">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-teal-600 dark:text-teal-400 text-sm sm:text-base font-extrabold">{realLecturesCount}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{lang === 'en' ? 'Platform Lectures' : 'محاضرة فعلية بالمنصة'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-amber-600 dark:text-amber-400 text-sm sm:text-base font-extrabold">{realFilesCount}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{lang === 'en' ? 'Handouts & Notes' : 'مذكرة وشيت متاحين'}</div>
                        </div>
                      </div>
                    </div>

                  </div>

                {/* Main Action Button */}
                <div>
                  <button
                    onClick={() => onSelectGrade(card.grade)}
                    className={`w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl font-extrabold text-sm sm:text-lg transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer shadow-lg active:scale-98 min-h-[48px] sm:min-h-[52px] ${
                      card.isPopular
                        ? 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-teal-900/20'
                    }`}
                  >
                    <span>{lang === 'en' ? `Access ${card.badgeEn} Lectures` : `دخول محاضرات ${card.badgeAr}`}</span>
                    <ActionArrow className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                </div>
              );
            })}
          </div>

          {/* Bottom Dots Indicator */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
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
