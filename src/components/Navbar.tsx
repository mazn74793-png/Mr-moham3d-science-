import React, { useState } from 'react';
import { Moon, Sun, GraduationCap, LayoutDashboard, LogOut, Menu, X, Shield, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { SiteConfig } from '../types/siteConfig';

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

  // Extract initials for monogram
  const nameParts = siteConfig.teacherName.trim().split(' ');
  const monogram = nameParts.length >= 2 
    ? `${nameParts[0].charAt(0)}.${nameParts[1].charAt(0)}` 
    : nameParts[0].slice(0, 2);

  const isTeacherOrAdmin = currentUser?.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com';

  return (
    <header className="relative w-full max-w-full bg-white/95 dark:bg-slate-900/95 border-b border-teal-100 dark:border-slate-800 transition-colors duration-200 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4 w-full">

        
        {/* Zone 1: Brand Wordmark & Monogram */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-500 dark:to-teal-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform shrink-0">
            <span className="font-kufi tracking-tighter">{monogram}</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] text-white font-mono shadow">
              ⚗
            </div>
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1">
              <span className="font-kufi text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate max-w-[140px] sm:max-w-none">
                أ/ {siteConfig.teacherName}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-teal-600 dark:text-teal-400 tracking-wide font-sans truncate">
              {siteConfig.tagline.split('..')[0] || 'قيصر الكيمياء'}
            </span>
          </div>
        </div>

        {/* Zone 2: Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              if (currentView !== 'landing') onNavigate('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer ${
              currentView === 'landing' ? 'text-teal-600 dark:text-teal-400 font-bold' : ''
            }`}
          >
            الرئيسية
          </button>
          
          <button
            onClick={() => onScrollToSection('features')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer"
          >
            المميزات
          </button>

          <button
            onClick={() => onScrollToSection('academic-years')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap cursor-pointer"
          >
            السنوات الدراسية (2026)
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
            <span>منصة الطالب</span>
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
              <span>لوحة الإدارة والتحكم</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Theme Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                onClick={() => onNavigate(isTeacherOrAdmin ? 'teacher' : 'student')}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 cursor-pointer hover:border-teal-400 transition-colors"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-teal-400 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold font-kufi shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col text-right">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[70px] xs:max-w-[95px] sm:max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                    {isTeacherOrAdmin ? (
                      <>
                        <Shield className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Admin</span>
                      </>
                    ) : (
                      'طالب'
                    )}
                  </span>
                </div>
              </div>

              {/* Direct button to Admin dashboard if teacher */}
              {isTeacherOrAdmin && (
                <button
                  onClick={() => onNavigate('teacher')}
                  className="hidden md:flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>لوحة التحكم</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Single unified Google Sign-In button optimized for all mobile viewports */
            <button
              onClick={onOpenLogin}
              className="px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-teal-50/50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-2xl shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer group active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="font-sans hidden sm:inline">تسجيل الدخول بجوجل</span>
              <span className="font-sans sm:hidden">دخول Google</span>
            </button>
          )}


          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-2">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full text-right px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg"
          >
            الرئيسية
          </button>
          <button
            onClick={() => {
              onScrollToSection('features');
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg"
          >
            المميزات
          </button>
          <button
            onClick={() => {
              onScrollToSection('academic-years');
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg"
          >
            السنوات الدراسية
          </button>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => {
                onNavigate('student');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 text-sm font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 rounded-lg flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>دخول منصة الطالب</span>
            </button>
            {isTeacherOrAdmin && (
              <button
                onClick={() => {
                  onNavigate('teacher');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-right px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة تحكم وإدارة المنصة</span>
              </button>
            )}
            {!currentUser && (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-teal-600 rounded-xl flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>تسجيل الدخول بجوجل</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

