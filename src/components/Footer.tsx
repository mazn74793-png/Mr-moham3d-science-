import React, { useState } from 'react';
import { MessageCircle, Phone, Youtube, Facebook, Send, KeyRound, X, Shield, FileText } from 'lucide-react';
import { SiteConfig } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';

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
  const { lang, isRtl, t } = useLanguage();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  React.useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#privacy') {
        setPrivacyOpen(true);
      } else if (hash === '#terms') {
        setTermsOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors w-full max-w-full overflow-hidden font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand & Teacher Bio (Cols 1-5) */}
          <div className={`lg:col-span-5 space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-bold text-xl shadow-md">
                <span className="font-mono text-xl">M.M</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {lang === 'en' ? 'Mr. Mohamed Mostafa' : `أ/ ${siteConfig.teacherName}`}
                </h3>
                <p className="text-xs text-teal-400">
                  {lang === 'en' ? 'Senior Chemistry & Science Educator · Class 2026' : (siteConfig.tagline || 'Senior Chemistry & Science Educator · دفعة 2026')}
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
                  onClick={() => onNavigate('student')}
                  className="hover:text-teal-400 transition-colors font-semibold text-teal-400"
                >
                  دخول منصة الطالب
                </button>
              </li>

              <li className="pt-2 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-500">

                <button 
                  onClick={() => setPrivacyOpen(true)}
                  className="hover:text-teal-400 hover:underline cursor-pointer"
                >
                  سياسة الخصوصية (Privacy Policy)
                </button>
                <span>·</span>
                <button 
                  onClick={() => setTermsOpen(true)}
                  className="hover:text-teal-400 hover:underline cursor-pointer"
                >
                  شروط الخدمة (Terms)
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
            <span 
              onDoubleClick={onOpenSecretAdmin} 
              className="cursor-default select-none"
              title=""
            >
              © 2026 جميع الحقوق محفوظة لمنصة الأستاذ {siteConfig.teacherName} - Chemistry & Science Educator.
            </span>
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

      {/* PRIVACY POLICY MODAL */}
      {privacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm text-right">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-teal-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold font-kufi text-base text-slate-900 dark:text-white">سياسة الخصوصية (Privacy Policy)</h3>
              </div>
              <button onClick={() => setPrivacyOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>تلتزم <strong>منصة الأستاذ محمد مصطفى</strong> بحماية خصوصية بيانات الطلاب وأولياء الأمور وفق أعلى المعايير الأمنية.</p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">1. البيانات التي نجمعها:</h4>
              <p>عند تسجيل الدخول باستخدام حساب Google، نقوم فقط بالوصول إلى اسمك وعنوان بريدك الإلكتروني وصورتك الشخصية لإنشاء ملفك الدراسي وحفظ نتائج امتحاناتك.</p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">2. أمان البيانات:</h4>
              <p>لا نقوم إطلاقاً ببيع أو مشاركة أي بيانات شخصية مع أي جهات خارجية أو أطراف ثالثة، وتستخدم فقط لتقديم الخدمة التعليمية ومتابعة المستوى الدراسي.</p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">3. للتواصل والاستفسار:</h4>
              <p>يمكنك التواصل مع إدارة المنصة عبر البريد الإلكتروني: {siteConfig.phone1} أو mizoo2y2@gmail.com.</p>
            </div>
            <button onClick={() => setPrivacyOpen(false)} className="w-full py-2.5 rounded-xl font-bold text-xs bg-teal-600 text-white">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm text-right">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-teal-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold font-kufi text-base text-slate-900 dark:text-white">شروط الاستخدام (Terms of Service)</h3>
              </div>
              <button onClick={() => setTermsOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>مرحباً بك في <strong>منصة الأستاذ محمد مصطفى التعليمية</strong>. باستخدامك للمنصة، فإنك توافق على الشروط التالية:</p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">1. الاستخدام الشخصي للمحتوى:</h4>
              <p>جميع المحاضرات والمذكرات وبنوك الأسئلة المتاحة على المنصة مخصصة للاستخدام الشخصي والدراسي للطالب المسجل فقط، ويحظر إعادة نشرها أو نسخها تجارياً.</p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">2. أمان الحساب:</h4>
              <p>يلتزم الطالب بالحفاظ على سرية بيانات تسجيل دخوله أو حسابه عبر Google وعدم مشاركته مع مستخدمين آخرين.</p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-1">3. التعديلات:</h4>
              <p>تحتفظ إدارة المنصة بالحق في تحديث شروط الخدمة لضمان أفضل تجربة تعليمية مستمرة.</p>
            </div>
            <button onClick={() => setTermsOpen(false)} className="w-full py-2.5 rounded-xl font-bold text-xs bg-teal-600 text-white">
              إغلاق
            </button>
          </div>
        </div>
      )}

    </footer>
  );
};
