import React from 'react';
import { ArrowLeft, Play, Sparkles, Award, FlaskConical } from 'lucide-react';
import { SiteConfig } from '../types/siteConfig';

interface HeroSectionProps {
  siteConfig: SiteConfig;
  onJoinNow: () => void;
  onExploreLectures: () => void;
  onOpenLab: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  siteConfig,
  onJoinNow,
  onExploreLectures,
  onOpenLab,
}) => {
  // Determine calligraphy font class
  const getCalligraphyClass = () => {
    switch (siteConfig.calligraphyFont) {
      case 'Reem Kufi': return 'font-kufi';
      case 'Aref Ruqaa': return 'font-ruqaa';
      case 'Amiri': return 'font-amiri';
      default: return 'font-cairo';
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-20 bg-[#fafffb] dark:bg-slate-950 bg-molecules-pattern transition-colors w-full max-w-full">
      {/* Contained ambient gradients without negative margins */}
      <div className="absolute top-10 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Right Column (in RTL: Main text and CTAs) */}
          <div className="lg:col-span-7 text-right space-y-6">
            
            {/* Elegant Callout Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-teal-500"></span>
              <span className="font-kufi">{siteConfig.heroBadge}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            {/* Calligraphy Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.25]">
                <span>الأستاذ </span>
                <span className={`${getCalligraphyClass()} text-teal-600 dark:text-teal-400 relative inline-block underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-8`}>
                  {siteConfig.teacherName}
                </span>
              </h1>
              <p className="font-ruqaa text-xl sm:text-2xl text-amber-600 dark:text-amber-400 pt-1 font-semibold">
                {siteConfig.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-2xl">
              {siteConfig.heroDescription}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5 sm:gap-4">
              <button
                onClick={onJoinNow}
                className="group px-7 py-3.5 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-2xl shadow-lg shadow-teal-700/25 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>+ انضم لينا الآن</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreLectures}
                className="px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-teal-600 dark:text-teal-400 fill-teal-600 dark:fill-teal-400" />
                <span>المحاضرات المتاحة</span>
              </button>

              <button
                onClick={onOpenLab}
                className="px-4 py-3.5 text-sm font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>المعمل الافتراضي</span>
              </button>
            </div>

            {/* Social Proof Stats Strip */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                  14,800+
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  طالب متفوق في مصر
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                  98.6%
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  نسبة تقفيل الكيمياء
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono tabular-nums">
                  15+ عاماً
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  خبرة ثانوية عامة
                </div>
              </div>
            </div>

          </div>

          {/* Left Column (in RTL: Stylish Profile Image Card - strictly contained within container) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm sm:max-w-md">
              
              {/* Orange-to-Amber Gradient Frame Card */}
              <div className="relative rounded-3xl p-3 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 shadow-2xl shadow-orange-500/20 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[3/4] flex items-end">
                  
                  {/* Image with fallback */}
                  <img
                    src={siteConfig.profileImageUrl || '/src/assets/images/teacher_mohamed_mostafa_1794141316649.jpg'}
                    alt={siteConfig.teacherName}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = '/src/assets/images/teacher_mohamed_mostafa_1794141316649.jpg';
                    }}
                  />

                  {/* Scrim gradient overlay for high contrast readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Teacher Title Card Inside Frame */}
                  <div className="relative z-10 p-5 text-right w-full">
                    <div className="inline-block px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-bold text-xs font-mono mb-1.5 shadow-sm">
                      {siteConfig.heroBadge.split('·')[0]}
                    </div>
                    <h3 className="text-2xl font-bold text-white font-kufi">
                      أ/ {siteConfig.teacherName}
                    </h3>
                    <p className="text-xs text-amber-200 font-sans">
                      كبير معلّمي الكيمياء للثانوية العامة ومدرب أوائل الجمهورية
                    </p>
                  </div>
                </div>

                {/* Contained Top badge */}
                <div className="absolute top-5 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-kufi">أوائل الجمهورية</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
