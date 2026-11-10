import React, { useState } from 'react';
import { 
  Moon, Sun, GraduationCap, LayoutDashboard, LogOut, Menu, X, 
  Shield, Globe, BookOpen, Sparkles, ChevronRight, ChevronLeft 
} from 'lucide-react';
import { UserProfile } from '../types';
import { SiteConfig } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  siteConfig: SiteConfig;
  darkMode: boolean;
  onToggleTheme: () => void;
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
  currentView: 'landing' | 'student' | 'teacher';
  onNavigate: (view: 'landing' | 'student' | 'teacher') => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  siteConfig,
  darkMode,
  onToggleTheme,
  currentUser,
  onOpenLogin,
  onLogout,
  currentView,
  onNavigate,
  onScrollToSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, toggleLang, t, isRtl } = useLanguage();

  // Extract initials for monogram
  const nameParts = siteConfig.teacherName.trim().split(' ');
  const monogram = nameParts.length >= 2 
    ? `${nameParts[0].charAt(0)}.${nameParts[1].charAt(0)}` 
    : nameParts[0].slice(0, 2);

  const isTeacherOrAdmin = currentUser?.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com';

  const teacherDisplayName = lang === 'en' 
    ? 'Mr. Mohamed Mostafa' 
    : `أ/ ${siteConfig.teacherName}`;

  const teacherDisplayTagline = lang === 'en'
    ? 'Senior Chemistry & Science Educator'
    : (siteConfig.tagline || 'خبير الكيمياء والعلوم لمدارس اللغات والتجريبي');

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-teal-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 w-full">

        {/* Zone 1: Brand Wordmark & Monogram */}
        <div 
          onClick={() => {
            onNavigate('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 select-none"
        >
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-500 dark:to-teal-700 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm shadow-teal-700/25 group-hover:scale-105 transition-transform shrink-0">
            <span className="font-cairo tracking-tighter">{monogram}</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-[7px] text-white font-mono shadow">
              ⚗
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-cairo text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate max-w-[125px] xs:max-w-[160px] sm:max-w-none">
                {teacherDisplayName}
              </span>
            </div>
            <span className="text-[9px] sm:text-xs font-semibold text-teal-600 dark:text-teal-400 tracking-wide font-cairo truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
              {teacherDisplayTagline}
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              if (currentView !== 'landing') onNavigate('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer ${
              currentView === 'landing' ? 'text-teal-600 dark:text-teal-400 font-bold' : ''
            }`}
          >
            {t('nav.home')}
          </button>
          
          <button
            onClick={() => onScrollToSection('features')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer"
          >
            {t('nav.features')}
          </button>

          <button
            onClick={() => onScrollToSection('academic-years')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer"
          >
            {t('nav.curriculum')}
          </button>

          {/* Quick switcher buttons to student LMS or teacher dashboard */}
          <button
            onClick={() => onNavigate('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'student'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t('nav.studentPortal')}</span>
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={() => onNavigate('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'teacher'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav.teacherDashboard')}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Mobile & Desktop Actions (Optimized spacing for phones) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Language Toggle Button (AR | EN) */}
          <button
            onClick={toggleLang}
            title={lang === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
            className="px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="font-mono text-[11px] sm:text-xs">
              {lang === 'ar' ? 'English' : 'عربي'}
            </span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Profile or Google Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div 
                onClick={() => onNavigate(isTeacherOrAdmin ? 'teacher' : 'student')}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 cursor-pointer hover:border-teal-400 transition-colors shrink-0"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-teal-400 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold font-cairo shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden xs:flex flex-col text-right">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[65px] sm:max-w-[110px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                    {isTeacherOrAdmin ? (
                      <>
                        <Shield className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Admin</span>
                      </>
                    ) : (
                      t('nav.student')
                    )}
                  </span>
                </div>
              </div>

              {/* Direct button to Admin dashboard on desktop */}
              {isTeacherOrAdmin && (
                <button
                  onClick={() => onNavigate('teacher')}
                  className="hidden md:flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{t('nav.teacherDashboard')}</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title={t('nav.logout')}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Google Sign-In Button with clear, polished mobile design */
            <button
              onClick={onOpenLogin}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-xl shadow-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="font-cairo hidden sm:inline">{t('nav.loginGoogle')}</span>
              <span className="font-cairo sm:hidden">{t('nav.loginGoogleShort')}</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 transition-colors"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-teal-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Polished with large, clear touch targets) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl px-4 py-4 space-y-2.5 shadow-xl animate-fade-in-up">
          
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => {
                onNavigate('landing');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-start px-3.5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between"
            >
              <span>{t('nav.home')}</span>
              <ChevronIcon className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onScrollToSection('features');
                setMobileMenuOpen(false);
              }}
              className="w-full text-start px-3.5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between"
            >
              <span>{t('nav.features')}</span>
              <ChevronIcon className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                onScrollToSection('academic-years');
                setMobileMenuOpen(false);
              }}
              className="w-full text-start px-3.5 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between"
            >
              <span>{t('nav.curriculum')}</span>
              <ChevronIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => {
                onNavigate('student');
                setMobileMenuOpen(false);
              }}
              className="w-full text-start px-4 py-3 text-sm font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-2xl flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div>{t('nav.studentPortal')}</div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">
                    {lang === 'ar' ? 'المحاضرات، الكويزات، والمذكرات' : 'Lectures, Quizzes & Handouts'}
                  </div>
                </div>
              </div>
              <ChevronIcon className="w-4 h-4 text-teal-600" />
            </button>

            {isTeacherOrAdmin && (
              <button
                onClick={() => {
                  onNavigate('teacher');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-start px-4 py-3 text-sm font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <div>{t('nav.teacherDashboard')}</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                      {lang === 'ar' ? 'إدارة الدروس والطلاب والتقارير' : 'Manage lectures, students & reports'}
                    </div>
                  </div>
                </div>
                <ChevronIcon className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {/* Quick settings row inside drawer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLang}
                  className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'English Language' : 'اللغة العربية'}</span>
                </button>

                <button
                  onClick={onToggleTheme}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                  <span>{darkMode ? (lang === 'ar' ? 'نهاري' : 'Light') : (lang === 'ar' ? 'ليلي' : 'Dark')}</span>
                </button>
              </div>

              {currentUser && (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout')}</span>
                </button>
              )}
            </div>

            {!currentUser && (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 text-center text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-98 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{t('nav.loginGoogle')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
