import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Play, Sparkles, Award, Atom, Camera } from 'lucide-react';
import { SiteConfig } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  siteConfig: SiteConfig;
  onJoinNow: () => void;
  onExploreLectures: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  siteConfig,
  onJoinNow,
  onExploreLectures,
}) => {
  const { lang, isRtl, t } = useLanguage();

  const ActionArrow = isRtl ? ArrowLeft : ArrowRight;

  const isValidCustomImage = (raw?: string) => {
    if (!raw) return false;
    const trimmed = raw.trim();
    if (!trimmed) return false;
    if (trimmed.includes('teacher_mohamed_mostafa') || trimmed.includes('teacher_placeholder') || trimmed.includes('/src/assets/')) {
      return false;
    }
    return trimmed.startsWith('http') || trimmed.startsWith('/uploads/') || trimmed.startsWith('data:');
  };

  const [imgSrc, setImgSrc] = useState<string>(() => (isValidCustomImage(siteConfig.profileImageUrl) ? siteConfig.profileImageUrl : ''));
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    setImgSrc(isValidCustomImage(siteConfig.profileImageUrl) ? siteConfig.profileImageUrl : '');
  }, [siteConfig.profileImageUrl]);

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-14 lg:pt-12 lg:pb-20 bg-[#fafffb] dark:bg-slate-950 bg-molecules-pattern transition-colors w-full max-w-full font-cairo">
      {/* Contained ambient glowing auras with pulsing animation */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main text and CTAs */}
          <div className={`lg:col-span-7 ${isRtl ? 'text-right' : 'text-left'} space-y-6 animate-fade-in-up`}>
            
            {/* Elegant Callout Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50/90 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs sm:text-sm font-bold shadow-xs hover:scale-102 transition-transform">
              <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-ping"></span>
              <span>{lang === 'en' ? 'Class of 2026 · Languages & Experimental Schools' : siteConfig.heroBadge}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            {/* Heading with Gradient & Accent underline */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.35] sm:leading-[1.25]">
                {lang === 'en' ? (
                  <>
                    <span>With Senior Educator </span>
                    <span className="text-teal-600 dark:text-teal-400 relative inline-block underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-8">
                      Mr. Mohamed Mostafa
                    </span>
                  </>
                ) : (
                  <>
                    <span>مع الأستاذ </span>
                    <span className="text-teal-600 dark:text-teal-400 relative inline-block underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-8 transition-transform duration-300 hover:scale-105 cursor-default">
                      {siteConfig.teacherName}
                    </span>
                  </>
                )}
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl text-amber-600 dark:text-amber-400 pt-0.5 font-bold leading-normal">
                {lang === 'en' 
                  ? 'Senior Chemistry & Science Educator · High School 2026' 
                  : siteConfig.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {lang === 'en'
                ? 'The premier educational platform for Chemistry & Science designed specifically for language and experimental school students. Interactive lectures, dynamic watermarked stream, sequential progression, and real-time assessments.'
                : siteConfig.heroDescription}
            </p>

            {/* Action Buttons with high-end micro-interactions and mobile responsiveness */}
            <div className="pt-2 flex flex-row items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={onJoinNow}
                className="group relative overflow-hidden flex-1 sm:flex-none px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 rounded-2xl shadow-xl shadow-teal-700/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer hover:-translate-y-0.5 min-h-[48px] sm:min-h-[50px] whitespace-nowrap"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
                <span className="relative z-10">{lang === 'en' ? '+ Join Us Now' : '+ انضم لينا الآن'}</span>
                <ActionArrow className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 relative z-10 ${isRtl ? 'group-hover:-translate-x-1.5' : 'group-hover:translate-x-1.5'}`} />
              </button>

              <button
                onClick={onExploreLectures}
                className="flex-1 sm:flex-none px-4 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 min-h-[48px] sm:min-h-[50px] whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400 fill-teal-600 dark:fill-teal-400" />
                <span>{lang === 'en' ? 'Explore Lectures' : 'المحاضرات'}</span>
              </button>
            </div>

            {/* Social Proof Stats Strip with Card Lift */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
              <div className="p-2 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/60">
                <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                  14,800+
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {lang === 'en' ? 'Students Mentored' : 'طالب متفوق في مصر'}
                </div>
              </div>

              <div className="p-2 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/60">
                <div className="text-xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                  98.6%
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {lang === 'en' ? 'Chemistry Distinction' : 'نسبة تميز في الكيمياء'}
                </div>
              </div>

              <div className="p-2 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/60">
                <div className="text-xl sm:text-3xl font-extrabold text-amber-500 font-mono tabular-nums">
                  15+
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {lang === 'en' ? 'Years of Excellence' : 'عاماً من الخبرة'}
                </div>
              </div>
            </div>

          </div>

          {/* Teacher Photo Column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center">
              
              {/* Soft atmospheric radial glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-teal-500/25 via-teal-400/10 to-amber-400/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse -z-10" />

              {/* Floating Orbit Atom Ring */}
              <div className="absolute -top-6 -right-6 w-20 h-20 text-teal-500/20 dark:text-teal-400/20 pointer-events-none animate-float-slow">
                <Atom className="w-full h-full animate-orbit" />
              </div>

              {/* Image or Clean Educator Crest Placeholder */}
              <div className="relative w-full flex items-center justify-center group">
                {imgSrc && !imgError ? (
                  <img
                    src={imgSrc}
                    alt={siteConfig.teacherName}
                    decoding="async"
                    className="w-full max-h-[480px] object-contain object-bottom drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105 animate-float-slow cursor-pointer rounded-3xl"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full aspect-[3/4] max-h-[460px] rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border-2 border-teal-500/30 shadow-2xl flex flex-col items-center justify-center p-8 text-center space-y-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(20,184,166,0.22),transparent_65%)]" />
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-extrabold text-3xl font-mono shadow-xl border border-teal-300/40 relative z-10">
                      M.M
                    </div>
                    <div className="space-y-1.5 relative z-10">
                      <div className="text-xl font-extrabold text-white">
                        {lang === 'en' ? 'Mr. Mohamed Mostafa' : `أ/ ${siteConfig.teacherName}`}
                      </div>
                      <div className="text-xs text-teal-300 font-semibold">
                        Senior Chemistry & Science Educator
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-teal-100 text-xs font-semibold relative z-10">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>{lang === 'en' ? 'Upload Educator Photo via Cloudinary' : 'في انتظار رفع صورة الأستاذ من Cloudinary'}</span>
                    </div>
                  </div>
                )}

                {/* Elegant Glass Floating Badge for the Teacher */}
                <div className="absolute bottom-4 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-teal-200/60 dark:border-teal-700/50 rounded-2xl px-4 py-2.5 shadow-xl shadow-teal-900/10 flex items-center gap-3 transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm font-mono shadow-xs">
                    M.M
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-cairo">
                      {lang === 'en' ? 'Mr. Mohamed Mostafa' : `أ/ ${siteConfig.teacherName}`}
                    </div>
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                      {lang === 'en' ? 'Senior Chemistry & Science Educator' : 'خبير الكيمياء والعلوم لمدارس اللغات'}
                    </div>
                  </div>
                </div>

                {/* Floating Award pill on the top */}
                <div className="absolute top-2 right-2 backdrop-blur-md bg-amber-400/95 text-slate-950 rounded-xl px-3 py-1 shadow-md flex items-center gap-1.5 text-xs font-bold font-cairo animate-float-reverse">
                  <Award className="w-3.5 h-3.5 text-slate-950" />
                  <span>{lang === 'en' ? 'Top Ranks Mentor 2026' : 'مدرب أوائل 2026'}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
