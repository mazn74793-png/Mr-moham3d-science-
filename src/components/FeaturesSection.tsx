import React from 'react';
import { Trophy, Lightbulb, FlaskRound as Flask, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { SiteConfig } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';

interface FeaturesSectionProps {
  siteConfig: SiteConfig;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ siteConfig }) => {
  const { lang, t } = useLanguage();

  return (
    <section id="features" className="py-12 sm:py-20 bg-white dark:bg-slate-900 transition-colors w-full max-w-full overflow-hidden font-cairo">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
            <span>{t('features.tag')}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'en' ? 'Smart Chemistry & Science Features ⚡' : 'ايه المميزات اللي بنقدمهالك؟ ⚡'}
          </h2>
          <p className="text-xs sm:text-base lg:text-lg text-slate-600 dark:text-slate-400">
            {t('features.desc')}
          </p>
        </div>

        {/* Features 2x2 Grid: 2 per row on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-7 items-stretch py-2">
          
          {/* Card 1 */}
          <div className="group rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 bg-[#fafffb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default">
            <div className="space-y-2.5 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors leading-snug">
                {lang === 'en' ? 'Rewards & Honor Board' : siteConfig.feature1Title}
              </h3>
              <p className="text-[11px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {lang === 'en' ? 'Ongoing recognition and awards for highest quiz scorers with certificates of excellence.' : siteConfig.feature1Desc}
              </p>
            </div>
            <div className="pt-3 sm:pt-5 mt-3 sm:mt-5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'en' ? 'Weekly Top Honors' : 'تكريم دوري لأبطال الدفعة'}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 bg-gradient-to-b from-[#0f766e] to-[#042f2e] text-white border border-teal-400/50 shadow-lg shadow-teal-950/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-default">
            <div className="absolute -top-10 -left-10 w-32 h-32 sm:w-44 sm:h-44 bg-teal-300/15 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2.5 sm:space-y-4 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              </div>
              <div className="text-[11px] font-mono font-bold text-teal-200 tracking-wide">
                {lang === 'en' ? 'Bilingual Method' : 'منهجية مبتكرة'}
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white leading-snug">
                {lang === 'en' ? 'Interactive Chemistry & Science' : siteConfig.feature2Title}
              </h3>
              <p className="text-[11px] sm:text-xs lg:text-sm text-teal-50 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {lang === 'en' ? 'Deep breakdown of transition elements, organic formulas and scientific principles.' : siteConfig.feature2Desc}
              </p>
            </div>
            
            <div className="pt-3 sm:pt-5 mt-3 sm:mt-5 border-t border-teal-600/60 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-teal-200 relative z-10">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{lang === 'en' ? 'Mastery & Application' : 'فهم عميق وتطبيق فوري'}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 bg-[#fafffb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default">
            <div className="space-y-2.5 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-teal-100 dark:bg-teal-950/70 flex items-center justify-center text-teal-700 dark:text-teal-400 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Flask className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors leading-snug">
                {lang === 'en' ? 'Sequential Session & Quiz Lock' : siteConfig.feature3Title}
              </h3>
              <p className="text-[11px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {lang === 'en' ? 'Strict academic discipline: subsequent sessions stay locked until prior video and quiz are finished.' : siteConfig.feature3Desc}
              </p>
            </div>
            <div className="pt-3 sm:pt-5 mt-3 sm:mt-5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'en' ? 'Guaranteed Commitment' : 'التزام ومتابعة حقيقية'}</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 bg-[#fafffb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default">
            <div className="space-y-2.5 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-sky-100 dark:bg-sky-950/70 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors leading-snug">
                {lang === 'en' ? 'Secure Stream & Dynamic Watermark' : siteConfig.feature4Title}
              </h3>
              <p className="text-[11px] sm:text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {lang === 'en' ? 'Protected video player with real-time watermark overlay of student phone and ID to deter recording.' : siteConfig.feature4Desc}
              </p>
            </div>
            <div className="pt-3 sm:pt-5 mt-3 sm:mt-5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-sky-600 dark:text-sky-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'en' ? 'Complete IP Protection' : 'حماية المحتوى التعليمي'}</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
