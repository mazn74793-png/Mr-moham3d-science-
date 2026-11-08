import React from 'react';
import { MessageCircle, Phone, Youtube, Facebook, Send, KeyRound } from 'lucide-react';
import { SiteConfig } from '../types/siteConfig';

interface FooterProps {
  siteConfig: SiteConfig;
  onNavigate: (view: 'landing' | 'student' | 'teacher') => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenLogin: () => void;
  onOpenSecretAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  siteConfig,
  onNavigate,
  onScrollToSection,
  onOpenLogin,
  onOpenSecretAdmin,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand & Teacher Bio (Cols 1-5) */}
          <div className="lg:col-span-5 space-y-4 text-right">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-bold text-xl shadow-md">
                <span className="font-kufi text-2xl">م.م</span>
              </div>
              <div>
                <h3 className="font-kufi text-xl font-bold text-white">
                  أ/ {siteConfig.teacherName}
                </h3>
                <p className="text-xs text-teal-400 font-sans">
                  {siteConfig.tagline.split('..')[0] || 'قيصر الكيمياء'} · دفعة 2026
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md font-sans">
              {siteConfig.heroDescription}
            </p>

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
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:text-teal-400 flex items-center justify-center transition-colors text-slate-300"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
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
          <div className="lg:col-span-3 space-y-3 text-right">
            <h4 className="text-sm font-bold text-white font-kufi">روابط المنصة السريعة</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <button
                  onClick={() => { onNavigate('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-teal-400 transition-colors"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('features')}
                  className="hover:text-teal-400 transition-colors"
                >
                  مميزات المنصة
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('academic-years')}
                  className="hover:text-teal-400 transition-colors"
                >
                  السنوات الدراسية (دفعة 2026)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('virtual-lab')}
                  className="hover:text-teal-400 transition-colors"
                >
                  المعمل الكيميائي الافتراضي
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('student')}
                  className="hover:text-teal-400 transition-colors font-semibold text-teal-400"
                >
                  دخول منصة الطالب
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('teacher')}
                  className="hover:text-amber-400 transition-colors text-amber-300"
                >
                  لوحة تحكم الأستاذ (Cloudinary)
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Support & Branches (Cols 9-12) */}
          <div className="lg:col-span-4 space-y-3 text-right">
            <h4 className="text-sm font-bold text-white font-kufi">الدعم الفني وسنتر الحضور</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 justify-start">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="font-mono dir-ltr font-bold text-slate-200">{siteConfig.phone1} / {siteConfig.phone2}</span>
              </div>
              <div className="flex items-center gap-2 justify-start">
                <MessageCircle className="w-4 h-4 text-teal-400 shrink-0" />
                <span>خدمة أولياء الأمور والطلاب متاحة يومياً من 9 صباحاً حتى 11 مساءً</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] leading-relaxed text-teal-200">
                ⭐ مقرات السنتر: {siteConfig.centerBranches}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits Strip with Secret © Trigger and Mazen Mohamed Credit */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>جميع الحقوق محفوظة</span>
            
            {/* The Secret © trigger button requested by the user */}
            <button
              onClick={onOpenSecretAdmin}
              title="لوحة الإدارة والتخصيص (رمز 2825)"
              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 hover:bg-amber-400/20 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-400/50 transition-all font-mono font-bold text-sm cursor-pointer"
            >
              ©
            </button>
            
            <span>2026 لمنصة الأستاذ {siteConfig.teacherName} - قيصر الكيمياء.</span>
          </div>

          {/* Explicit Developer & Designer Credit: Mazen Mohamed */}
          <div className="flex items-center gap-1.5 font-sans">
            <span>تصميم وبرمجة:</span>
            <a
              href={siteConfig.developerUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
            >
              <span>{siteConfig.developerName || 'Mazen Mohamed'}</span>
              <span className="font-mono dir-ltr text-amber-400">{siteConfig.developerHandle || '@mazenmohamed'}</span>
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
};
