import React from 'react';
import { Trophy, Lightbulb, FlaskRound as Flask, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { SiteConfig } from '../types/siteConfig';

interface FeaturesSectionProps {
  siteConfig: SiteConfig;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ siteConfig }) => {
  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-900 transition-colors w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
            <span>لماذا تختار منصتنا؟</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-kufi">
            ايه المميزات اللي بنقدمهالك؟ ⚡
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            منظومة تعليمية متكاملة مصممة خصيصاً لتوصيلك لقمة التفوق والدرجة النهائية في مادة الكيمياء.
          </p>
        </div>

        {/* 4-Column Grid with modern alternating tilted floating animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-7 items-stretch py-4">
          
          {/* Card 1: Tilted Left */}
          <div 
            className="group rounded-3xl p-7 bg-[#fafffb] dark:bg-slate-800/80 border-2 border-slate-200/80 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-900/15 animate-tilt-left flex flex-col justify-between cursor-default will-change-transform"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-kufi group-hover:text-amber-500 transition-colors">
                {siteConfig.feature1Title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {siteConfig.feature1Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>تكريم دوري لأبطال الدفعة</span>
            </div>
          </div>

          {/* Card 2: Tilted Right (Highlighted Dark Teal Card) */}
          <div 
            className="group rounded-3xl p-7 bg-gradient-to-b from-[#0f766e] to-[#042f2e] text-white border-2 border-teal-400/60 shadow-xl shadow-teal-950/40 hover:shadow-2xl hover:border-teal-300 animate-tilt-right flex flex-col justify-between relative overflow-hidden cursor-default will-change-transform"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="absolute -top-10 -left-10 w-44 h-44 bg-teal-300/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-amber-300 shadow-xs group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                <Lightbulb className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-400/25 text-teal-200 text-xs font-mono font-semibold">
                طريقة مبتكرة
              </div>
              <h3 className="text-xl font-bold text-white font-kufi">
                {siteConfig.feature2Title}
              </h3>
              <p className="text-sm sm:text-base text-teal-50 leading-relaxed font-sans">
                {siteConfig.feature2Desc}
              </p>
            </div>
            
            <div className="pt-6 mt-6 border-t border-teal-600/60 flex items-center gap-2 text-xs font-bold text-teal-200 relative z-10">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>فهم عميق وتطبيق فوري</span>
            </div>
          </div>

          {/* Card 3: Tilted Left */}
          <div 
            className="group rounded-3xl p-7 bg-[#fafffb] dark:bg-slate-800/80 border-2 border-slate-200/80 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-900/15 animate-tilt-left flex flex-col justify-between cursor-default will-change-transform"
            style={{ animationDelay: '0.8s' }}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/70 flex items-center justify-center text-teal-700 dark:text-teal-400 shadow-xs group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Flask className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-kufi group-hover:text-teal-600 transition-colors">
                {siteConfig.feature3Title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {siteConfig.feature3Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>تصحيح فوري وتحليل نقاط الضعف</span>
            </div>
          </div>

          {/* Card 4: Tilted Right */}
          <div 
            className="group rounded-3xl p-7 bg-[#fafffb] dark:bg-slate-800/80 border-2 border-slate-200/80 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-900/15 animate-tilt-right flex flex-col justify-between cursor-default will-change-transform"
            style={{ animationDelay: '1.2s' }}
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/70 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-kufi group-hover:text-sky-500 transition-colors">
                {siteConfig.feature4Title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {siteConfig.feature4Desc}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>فريق مساعدين متاحين 24/7 للرد</span>
            </div>
          </div>

        </div>
      </div>


    </section>
  );
};
