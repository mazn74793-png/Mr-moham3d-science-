import React, { useState } from 'react';
import { Moon, Sun, Beaker, GraduationCap, LayoutDashboard, LogIn, UserPlus, LogOut, Menu, X } from 'lucide-react';
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
  onOpenRegister,
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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-teal-100 dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4 w-full">
        
        {/* Zone 1: Brand Wordmark & Monogram */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-500 dark:to-teal-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform shrink-0">
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

        {/* Zone 2: Navigation Links (single line, clean typography) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              if (currentView !== 'landing') onNavigate('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap ${
              currentView === 'landing' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''
            }`}
          >
            الرئيسية
          </button>
          
          <button
            onClick={() => onScrollToSection('features')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap"
          >
            المميزات
          </button>

          <button
            onClick={() => onScrollToSection('academic-years')}
            className="transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap"
          >
            السنوات الدراسية
          </button>

          <button
            onClick={() => onScrollToSection('virtual-lab')}
            className="flex items-center gap-1.5 transition-colors hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap"
          >
            <Beaker className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>المعمل الافتراضي</span>
          </button>

          {/* Quick switcher buttons to student LMS or teacher dashboard */}
          <button
            onClick={() => onNavigate('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'student'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>منصة الطالب</span>
          </button>

          <button
            onClick={() => onNavigate('teacher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'teacher'
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة المعلم</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Theme Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="تبديل المظهر"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div 
                onClick={() => onNavigate(currentUser.role === 'teacher' ? 'teacher' : 'student')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold font-kufi">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400">
                    {currentUser.role === 'teacher' ? 'المعلم' : 'طالب كيمياء'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* يلا سجل دخولك - Outline button */}
              <button
                onClick={onOpenLogin}
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300 border border-teal-600 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>يلا سجل دخولك</span>
              </button>

              {/* خش اعمل اكونت - Filled teal button */}
              <button
                onClick={onOpenRegister}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-sm shadow-teal-600/30 transition-all whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>خش اعمل اكونت</span>
              </button>
            </div>
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
          <button
            onClick={() => {
              onScrollToSection('virtual-lab');
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
          >
            <Beaker className="w-4 h-4 text-teal-600" />
            <span>المعمل الافتراضي</span>
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
            <button
              onClick={() => {
                onNavigate('teacher');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة تحكم الأستاذ</span>
            </button>
            {!currentUser && (
              <button
                onClick={() => {
                  onOpenRegister();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-teal-600 rounded-xl"
              >
                خش اعمل اكونت
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
