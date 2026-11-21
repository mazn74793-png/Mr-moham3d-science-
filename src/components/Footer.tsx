import React from 'react';
import { MessageCircle, Phone, Youtube, Facebook, Send } from 'lucide-react';
import { SiteConfig, getResolvedFeatureFlags } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';

export type AppView =
  | 'landing'
  | 'student'
  | 'teacher'
  | 'auth'
  | 'onboarding'
  | 'privacy'
  | 'terms';

interface FooterProps {
  siteConfig: SiteConfig;
  onNavigate: (view: AppView) => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenLogin: () => void;
  onOpenSecretAdmin: () => void;
}

function resolveQuickLinkTitle(title: string, url: string, lang: 'ar' | 'en'): string {
  if (lang === 'ar') return title;
  if (url === '#home' || title === 'الرئيسية') return 'Home';
  if (url === '#features' || title === 'مميزات المنصة') return 'Platform Features';
  if (url === '#academic-years' || title.includes('السنوات الدراسية')) return 'Academic Years (Class 2026)';
  if (url === '#student' || title.includes('منصة الطالب')) return 'Student Portal';
  return title;
}

export const Footer: React.FC<FooterProps> = ({
  siteConfig,
  onNavigate,
  onScrollToSection,
  onOpenSecretAdmin,
}) => {
  const { lang, isRtl } = useLanguage();
  const featureFlags = getResolvedFeatureFlags(siteConfig);

  const bioText =
    lang === 'en'
      ? 'With Mr. Mohamed Mostafa, Chemistry & Science become crystal clear — real-world examples, interactive explanations, and structured assessments built for excellence.'
      : siteConfig.footerBio || siteConfig.heroDescription;

  const branchesText =
    lang === 'en'
      ? 'Cairo (Nasr City, Maadi, Heliopolis), Giza (Dokki, Mohandessin, Faisal, Haram) & Live Online Sessions.'
      : siteConfig.centerBranches;

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors w-full max-w-full overflow-hidden font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-slate-800">
          {/* Brand & Teacher Bio (Cols 1-5) */}
          <div className={`lg:col-span-5 space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                <span className="font-mono text-xl">M.M</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {lang === 'en' ? 'Mr. Mohamed Mostafa' : `أ/ ${siteConfig.teacherName}`}
                </h3>
                <p className="text-xs text-teal-400">
                  {lang === 'en'
                    ? 'Senior Chemistry & Science Educator · Class 2026'
                    : siteConfig.tagline || 'Senior Chemistry & Science Educator · دفعة 2026'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md font-sans">{bioText}</p>

            {/* Social channels */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={siteConfig.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:text-teal-400 flex items-center justify-center transition-colors text-slate-300"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:text-teal-400 flex items-center justify-center transition-colors text-slate-300"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              {featureFlags.enableWhatsAppSupport && (
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:text-teal-400 flex items-center justify-center transition-colors text-slate-300"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              <a
                href={siteConfig.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:text-teal-400 flex items-center justify-center transition-colors text-slate-300"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links (Cols 6-8) */}
          <div className={`lg:col-span-3 space-y-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h4 className="text-sm font-bold text-white font-kufi">
              {lang === 'en' ? 'Quick Platform Links' : 'روابط المنصة السريعة'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              {siteConfig.footerQuickLinks && siteConfig.footerQuickLinks.length > 0 ? (
                siteConfig.footerQuickLinks.map((link) => (
                  <li key={link.id}>
                    {link.url.startsWith('http') ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-teal-400 transition-colors"
                      >
                        {link.title}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (link.url === '#home') {
                            onNavigate('landing');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } else if (link.url === '#student') {
                            onNavigate('student');
                          } else if (link.url.startsWith('#')) {
                            onScrollToSection(link.url.replace('#', ''));
                          } else {
                            onNavigate('landing');
                          }
                        }}
                        className="hover:text-teal-400 transition-colors cursor-pointer"
                      >
                        {resolveQuickLinkTitle(link.title, link.url, lang)}
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('landing');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      {lang === 'en' ? 'Home' : 'الرئيسية'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onScrollToSection('features')}
                      className="hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      {lang === 'en' ? 'Platform Features' : 'مميزات المنصة'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onScrollToSection('academic-years')}
                      className="hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      {lang === 'en' ? 'Academic Years (Class 2026)' : 'السنوات الدراسية (دفعة 2026)'}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onNavigate('student')}
                      className="hover:text-teal-400 transition-colors font-semibold text-teal-400 cursor-pointer"
                    >
                      {lang === 'en' ? 'Student Portal' : 'دخول منصة الطالب'}
                    </button>
                  </li>
                </>
              )}

              <li className="pt-2 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('privacy');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-teal-400 hover:underline cursor-pointer"
                >
                  {lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية (Privacy Policy)'}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('terms');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-teal-400 hover:underline cursor-pointer"
                >
                  {lang === 'en' ? 'Terms of Service' : 'شروط الخدمة (Terms)'}
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Support & Branches (Cols 9-12) */}
          <div className={`lg:col-span-4 space-y-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h4 className="text-sm font-bold text-white font-kufi">
              {lang === 'en' ? 'Support & Study Centers' : 'الدعم الفني وسنتر الحضور'}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 justify-start">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="font-mono font-bold text-slate-200" dir="ltr">
                  {siteConfig.phone1} / {siteConfig.phone2}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-start">
                <MessageCircle className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Student & parent support available daily from 9 AM to 11 PM'
                    : 'خدمة أولياء الأمور والطلاب متاحة يومياً من 9 صباحاً حتى 11 مساءً'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] leading-relaxed text-teal-200">
                {lang === 'en' ? 'Centers: ' : 'مقرات السنتر: '}
                {branchesText}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits Strip with Secret © Trigger and Developer Credit */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              onDoubleClick={onOpenSecretAdmin}
              className="cursor-default select-none"
              title=""
            >
              {lang === 'en'
                ? '© 2026 Mr. Mohamed Mostafa Platform · All rights reserved.'
                : `© 2026 جميع الحقوق محفوظة لمنصة الأستاذ ${siteConfig.teacherName} - Chemistry & Science Educator.`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-sans">
            <span>{lang === 'en' ? 'Designed & Built by:' : 'تصميم وبرمجة:'}</span>
            <a
              href={siteConfig.developerUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
            >
              <span>{siteConfig.developerName || 'Mazen Mohamed'}</span>
              <span className="font-mono text-amber-400" dir="ltr">
                {siteConfig.developerHandle || '@mazenmohamed'}
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
