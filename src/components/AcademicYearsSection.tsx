import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Video,
  FileText,
} from 'lucide-react';
import { GradeLevel, Lecture, AttachmentFile } from '../types';
import { SiteConfig, getResolvedGrades } from '../types/siteConfig';
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

export const AcademicYearsSection: React.FC<AcademicYearsSectionProps> = ({
  siteConfig,
  lectures = [],
  attachments = [],
  onSelectGrade,
}) => {
  const resolvedGrades = getResolvedGrades(siteConfig);
  const GRADES_DATA: GradeCardData[] = resolvedGrades.map((card) => ({
    grade: card.id,
    badgeAr: card.badgeAr,
    badgeEn: card.badgeEn || card.badgeAr,
    yearLabelAr: card.yearLabelAr || 'دفعة 2026',
    yearLabelEn: card.yearLabelEn || 'Class of 2026',
    titleAr: card.titleAr,
    titleEn: card.titleEn || card.titleAr,
    descriptionAr: card.descAr,
    descriptionEn: card.descEn || card.descAr,
    topicsAr: card.topicsAr || [],
    topicsEn: card.topicsEn || [],
    isPopular: card.isPopular,
  }));

  const [currentIndex, setCurrentIndex] = useState(() => {
    const popularIdx = GRADES_DATA.findIndex((g) => g.isPopular);
    return popularIdx >= 0 ? popularIdx : Math.max(0, GRADES_DATA.length - 1);
  });
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartXRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const { lang, isRtl } = useLanguage();

  const ActionArrow = isRtl ? ArrowLeft : ArrowRight;

  // Keep currentIndex within bounds when custom grades are added/removed
  useEffect(() => {
    if (GRADES_DATA.length > 0 && currentIndex >= GRADES_DATA.length) {
      setCurrentIndex(GRADES_DATA.length - 1);
    }
  }, [GRADES_DATA.length, currentIndex]);

  const scrollToIndex = (idx: number) => {
    if (GRADES_DATA.length === 0) return;
    const boundedIdx = Math.max(0, Math.min(idx, GRADES_DATA.length - 1));
    setCurrentIndex(boundedIdx);
  };

  // Next / Previous navigation
  const handleNext = () => {
    if (GRADES_DATA.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % GRADES_DATA.length);
  };

  const handlePrev = () => {
    if (GRADES_DATA.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + GRADES_DATA.length) % GRADES_DATA.length);
  };

  // Auto-scroll loop every 4.5 seconds when not interacting
  useEffect(() => {
    if (!isAutoPlaying || GRADES_DATA.length <= 1) return;

    const timer = window.setInterval(() => {
      if (!isInteractingRef.current) {
        setCurrentIndex((prev) => (prev + 1) % GRADES_DATA.length);
      }
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, GRADES_DATA.length]);

  return (
    <section id="academic-years" className="py-12 sm:py-20 bg-[#fafffb] dark:bg-slate-950 transition-colors w-full max-w-full overflow-hidden font-cairo">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2 sm:space-y-3 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Secondary School Curriculum' : 'المراحل والصفوف الدراسية'}</span>
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
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
              type="button"
              onClick={() => {
                scrollToIndex(idx);
                setIsAutoPlaying(false);
              }}
              className={`px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentIndex === idx
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20 scale-105 -translate-y-0.5'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:-translate-y-0.5'
              }`}
            >
              <span>{lang === 'en' ? item.badgeEn : item.badgeAr}</span>
            </button>
          ))}
        </div>

        {/* The Flagship Single Slider Card */}
        <div className="relative max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/15 via-amber-400/10 to-teal-500/15 rounded-[2.5rem] blur-2xl pointer-events-none animate-glow-pulse -z-10" />
        <div
          className="relative rounded-3xl bg-white dark:bg-slate-900 border-2 border-teal-200/80 dark:border-slate-800 hover:border-teal-400/80 shadow-xl transition-all duration-300 overflow-hidden"
          onMouseEnter={() => { isInteractingRef.current = true; }}
          onMouseLeave={() => { isInteractingRef.current = false; }}
          onTouchStart={(e) => {
            isInteractingRef.current = true;
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            isInteractingRef.current = false;
            const startX = touchStartXRef.current;
            const endX = e.changedTouches[0]?.clientX;
            touchStartXRef.current = null;
            if (startX !== null && typeof endX === 'number') {
              const delta = endX - startX;
              if (Math.abs(delta) > 45) {
                setIsAutoPlaying(false);
                if (delta < 0) {
                  handleNext();
                } else {
                  handlePrev();
                }
              }
            }
          }}
        >
          {/* Viewport & Transform Track locked to LTR so RTL never hangs */}
          <div dir="ltr" className="w-full overflow-hidden">
            <div
              className="flex flex-row transition-transform duration-500 ease-out will-change-transform w-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
            {GRADES_DATA.map((card) => {
              const gradeLectures = (lectures || []).filter((l) => l.grade === card.grade);
              const gradeAttachments = (attachments || []).filter((a) => a.grade === card.grade);

              const realLecturesCount = gradeLectures.length;
              const realFilesCount = gradeAttachments.length;

              const realChapters = Array.from(
                new Set(gradeLectures.map((l) => l.chapter.trim()).filter(Boolean))
              );
              const recentLectures = gradeLectures.slice(0, 3);

              return (
                <div
                  key={card.grade}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={`w-full shrink-0 snap-start p-5 sm:p-10 flex flex-col justify-between ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  <div>
                    {/* Clean Inline Header Metadata */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-300">
                        <GraduationCap className="w-4 h-4 shrink-0" />
                        <span>{lang === 'en' ? card.badgeEn : card.badgeAr}</span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">
                          {lang === 'en' ? card.yearLabelEn : card.yearLabelAr}
                        </span>
                      </div>
                      {card.isPopular && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                          {lang === 'en' ? 'Most Popular' : 'الأكثر انضماماً'}
                        </span>
                      )}
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
                        <span>
                          {lang === 'en'
                            ? 'Curriculum Scope & Units:'
                            : 'أبواب المنهج والمحتويات المسجلة بالمنصة:'}
                        </span>
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-semibold">
                          {realChapters.length > 0
                            ? lang === 'en'
                              ? `${realChapters.length} Active Units`
                              : `${realChapters.length} أبواب مفعلة`
                            : lang === 'en'
                            ? 'Ministry Curriculum'
                            : 'المنهج الوزاري'}
                        </span>
                      </div>

                      {realChapters.length > 0 ? (
                        realChapters.map((chap, cIdx) => {
                          const chapLecsCount = gradeLectures.filter(
                            (l) => l.chapter.trim() === chap
                          ).length;
                          return (
                            <div
                              key={cIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                            >
                              <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                              <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-semibold">{chap}</span>
                                <span className="text-[11px] text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 font-mono">
                                  {lang === 'en'
                                    ? `${chapLecsCount} sessions`
                                    : `${chapLecsCount} حصص`}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (lang === 'en' ? card.topicsEn : card.topicsAr).length > 0 ? (
                        (lang === 'en' ? card.topicsEn : card.topicsAr).map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                          >
                            <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                            <span>{topic}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>
                            {lang === 'en'
                              ? 'Full interactive curriculum lectures, handouts, and electronic quizzes.'
                              : 'منهج متكامل يشمل المحاضرات التفاعلية والمذكرات والامتحانات الإلكترونية.'}
                          </span>
                        </div>
                      )}

                      {recentLectures.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 text-[11px] text-slate-500 font-sans">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {lang === 'en' ? 'Latest added sessions: ' : 'أحدث الحصص المرفوعة: '}
                          </span>
                          {recentLectures.map((l) => l.title).join(' • ')}
                        </div>
                      )}
                    </div>

                    {/* Stats Badges */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3 border-y border-slate-100 dark:border-slate-800 mb-6 sm:mb-8">
                      <div className="p-2 rounded-xl hover-card-lift hover:bg-teal-50/40 dark:hover:bg-teal-950/30 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-teal-600 dark:text-teal-400 text-sm sm:text-base font-extrabold">
                            {realLecturesCount}
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            {lang === 'en' ? 'Platform Lectures' : 'محاضرة فعلية بالمنصة'}
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl hover-card-lift hover:bg-amber-50/40 dark:hover:bg-amber-950/30 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-amber-600 dark:text-amber-400 text-sm sm:text-base font-extrabold">
                            {realFilesCount}
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            {lang === 'en' ? 'Handouts & Notes' : 'مذكرة وشيت متاحين'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Action Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectGrade(card.grade)}
                      className={`group relative overflow-hidden w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl font-extrabold text-sm sm:text-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer shadow-lg active:scale-98 min-h-[48px] sm:min-h-[52px] ${
                        card.isPopular
                          ? 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-500/20'
                          : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-teal-900/20'
                      }`}
                    >
                      <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
                      <span className="relative z-10">
                        {lang === 'en'
                          ? `Access ${card.badgeEn} Lectures`
                          : `دخول محاضرات ${card.badgeAr}`}
                      </span>
                      <ActionArrow className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isRtl ? 'group-hover:-translate-x-1.5' : 'group-hover:translate-x-1.5'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Bottom Controls: Prev / Dots / Next */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                handlePrev();
              }}
              aria-label={lang === 'en' ? 'Previous Grade' : 'الصف السابق'}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-500 hover:scale-105 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all"
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              {GRADES_DATA.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    scrollToIndex(dotIdx);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === dotIdx
                      ? 'w-8 bg-teal-600 dark:bg-teal-400'
                      : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  aria-label={
                    lang === 'en' ? `Go to grade ${dotIdx + 1}` : `انتقال للصف رقم ${dotIdx + 1}`
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                handleNext();
              }}
              aria-label={lang === 'en' ? 'Next Grade' : 'الصف التالي'}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-500 hover:scale-105 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all"
            >
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        </div>

      </div>
    </section>
  );
};
