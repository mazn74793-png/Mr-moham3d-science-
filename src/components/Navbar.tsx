import React, { useState } from 'react';
import { 
  Moon, Sun, GraduationCap, LayoutDashboard, LogOut, Menu, X, 
  Shield, Globe, Sparkles, ChevronRight, ChevronLeft, Home, BookOpen, Layers
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

  const isTeacherOrAdmin = 
    currentUser?.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com' ||
    currentUser?.role === 'teacher' ||
    Boolean(currentUser?.email && siteConfig.adminEmails?.some(e => e.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()));

  const teacherDisplayName = lang === 'en' 
    ? 'Mr. Mohamed Mostafa' 
    : `أ/ ${siteConfig.teacherName}`;

  const teacherDisplayTagline = lang === 'en'
    ? 'Senior Chemistry & Science Educator'
    : (siteConfig.tagline || 'كيمياء ولغات · دفعة 2026');

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const handleGoHome = () => {
    onNavigate('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleSectionClick = (sectionId: string) => {
    onScrollToSection(sectionId);
    setMobileMenuOpen(false);
  };

  const handlePortalClick = (view: 'student' | 'teacher') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-teal-100/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-4 w-full">

        {/* Zone 1: Brand Wordmark & Monogram */}
        <div 
          onClick={handleGoHome}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 select-none min-w-0"
        >
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 dark:from-teal-500 dark:to-teal-700 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm shadow-teal-700/25 group-hover:scale-105 transition-transform shrink-0">
            <span className="font-cairo tracking-tighter">{monogram}</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-[7px] text-white font-mono shadow">
              ⚗
            </div>
          </div>
          
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1">
              <span className="font-cairo text-xs xs:text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                {teacherDisplayName}
              </span>
            </div>
            <span className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-teal-600 dark:text-teal-400 tracking-wide font-cairo truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
              {teacherDisplayTagline}
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Clean Navigation Links (Connected to all views) */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={handleGoHome}
            className={`transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentView === 'landing' ? 'text-teal-600 dark:text-teal-400 font-bold' : ''
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{t('nav.home')}</span>
          </button>
          
          <button
            onClick={() => handleSectionClick('features')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('nav.features')}</span>
          </button>

          <button
            onClick={() => handleSectionClick('academic-years')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>{t('nav.curriculum')}</span>
          </button>

          {/* Quick switcher buttons to student LMS or teacher dashboard */}
          <button
            onClick={() => onNavigate('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'student'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-600" />
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
              <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('nav.teacherDashboard')}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Mobile & Desktop Actions (Tight, perfectly balanced in both RTL and LTR, tailored for iPhone & all screens) */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
          
          {/* Language Toggle Button (AR | EN) with compact mobile mode */}
          <button
            onClick={toggleLang}
            title={lang === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
            className="h-9 px-2 sm:px-2.5 text-xs font-bold rounded-xl text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">
              <span className="xs:hidden">{lang === 'ar' ? 'EN' : 'ع'}</span>
              <span className="hidden xs:inline">{lang === 'ar' ? 'English' : 'عربي'}</span>
            </span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
            className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* User Profile or Google Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div 
                onClick={() => onNavigate(isTeacherOrAdmin ? 'teacher' : 'student')}
                className="h-9 flex items-center gap-1.5 px-1.5 sm:px-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 cursor-pointer hover:border-teal-400 transition-colors shrink-0"
                title={lang === 'en' ? 'Open Dashboard' : 'فتح لوحة التحكم'}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-teal-400 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold font-cairo shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[75px] sm:max-w-[100px]">
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
                  className="hidden md:flex items-center gap-1 h-9 px-3 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{t('nav.teacherDashboard')}</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title={t('nav.logout')}
                className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Google Sign-In Button with balanced iPhone & responsive width */
            <button
              onClick={onOpenLogin}
              className="h-9 px-2 xs:px-2.5 sm:px-3.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-xl shadow-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="font-cairo">
                <span className="xs:hidden">{lang === 'ar' ? 'دخول' : 'Login'}</span>
                <span className="hidden xs:inline">{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              </span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 transition-colors"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-teal-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Polished with large, clear touch targets and iPhone Safe-Area support) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl px-4 py-4 space-y-2.5 shadow-xl animate-fade-in-up pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={handleGoHome}
              className={`w-full text-start px-3.5 py-3 text-sm font-bold rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                currentView === 'landing'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-extrabold'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-teal-600" />
                <span>{t('nav.home')}</span>
              </div>
              <ChevronIcon className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleSectionClick('features')}
              className="w-full text-start px-3.5 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('nav.features')}</span>
              </div>
              <ChevronIcon className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleSectionClick('academic-years')}
              className="w-full text-start px-3.5 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>{t('nav.curriculum')}</span>
              </div>
              <ChevronIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => handlePortalClick('student')}
              className={`w-full text-start px-4 py-3 text-sm font-bold rounded-2xl flex items-center justify-between shadow-xs cursor-pointer ${
                currentView === 'student'
                  ? 'bg-teal-600 text-white'
                  : 'text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  currentView === 'student' ? 'bg-white/20 text-white' : 'bg-teal-600 text-white'
                }`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div>{t('nav.studentPortal')}</div>
                  <div className={`text-[10px] font-normal ${
                    currentView === 'student' ? 'text-teal-100' : 'text-teal-600 dark:text-teal-400'
                  }`}>
                    {lang === 'ar' ? 'المحاضرات، الكويزات، والمذكرات' : 'Lectures, Quizzes & Handouts'}
                  </div>
                </div>
              </div>
              <ChevronIcon className="w-4 h-4" />
            </button>

            {isTeacherOrAdmin && (
              <button
                onClick={() => handlePortalClick('teacher')}
                className={`w-full text-start px-4 py-3 text-sm font-bold rounded-2xl flex items-center justify-between shadow-xs cursor-pointer ${
                  currentView === 'teacher'
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800'
                }`}
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
                  className="px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'English Language' : 'اللغة العربية'}</span>
                </button>

                <button
                  onClick={onToggleTheme}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
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
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-1 cursor-pointer"
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
                className="w-full py-3.5 text-center text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-98 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 cursor-pointer min-h-[48px]"
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
