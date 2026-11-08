import React, { useState } from 'react';
import { X, LogIn, UserPlus, Phone, Lock, User, GraduationCap, CheckCircle, Sparkles, Globe, HelpCircle, Check, Copy } from 'lucide-react';
import { GradeLevel, UserProfile } from '../types';

interface AuthModalsProps {
  loginOpen: boolean;
  registerOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  loginOpen,
  registerOpen,
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
  onSwitchToLogin,
}) => {
  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [copiedVercelOrigin, setCopiedVercelOrigin] = useState(false);

  // Google Sign-In Prompt State
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regGrade, setRegGrade] = useState<GradeLevel>('third');
  const [regPassword, setRegPassword] = useState('');

  if (!loginOpen && !registerOpen) return null;

  // Handle manual login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserProfile = {
      id: `std-${Date.now()}`,
      name: loginPhone === '01000000000' ? 'أ/ محمد مصطفى' : 'أحمد محمود',
      role: loginPhone === '01000000000' ? 'teacher' : 'student',
      grade: 'third',
      phone: loginPhone || '01012345678',
    };
    onLoginSuccess(user);
    onClose();
  };

  // Google Sign-in Handler
  const handleGoogleSignInClick = () => {
    setGooglePromptOpen(true);
  };

  const handleConfirmGoogleLogin = (email: string, name: string) => {
    const user: UserProfile = {
      id: `google-${Date.now()}`,
      name: name || email.split('@')[0],
      role: 'student',
      grade: 'third',
      phone: '010XXXXXXXX',
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      score: 98,
    };
    onLoginSuccess(user);
    setGooglePromptOpen(false);
    onClose();
  };

  // Quick 1-click Demo Login
  const handleDemoStudentLogin = () => {
    const studentUser: UserProfile = {
      id: 'demo-student-1',
      name: 'أحمد محمود كمال',
      role: 'student',
      grade: 'third',
      phone: '01012345678',
      parentPhone: '01123456789',
      score: 96,
    };
    onLoginSuccess(studentUser);
    onClose();
  };

  const handleDemoTeacherLogin = () => {
    const teacherUser: UserProfile = {
      id: 'teacher-1',
      name: 'أ/ محمد مصطفى',
      role: 'teacher',
      phone: '01099887766',
    };
    onLoginSuccess(teacherUser);
    onClose();
  };

  // Handle register submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      alert('يرجى إدخال اسم الطالب');
      return;
    }
    const newUser: UserProfile = {
      id: `std-${Date.now()}`,
      name: regName,
      role: 'student',
      grade: regGrade,
      phone: regPhone || '01000000000',
      parentPhone: regParentPhone,
      score: 100,
    };
    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-teal-100 dark:border-slate-800 text-right my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GOOGLE ACCOUNT CHOOSER PROMPT MODAL */}
        {googlePromptOpen ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white font-kufi">
                  تسجيل الدخول عبر Google
                </h4>
                <p className="text-xs text-slate-500">
                  اختر حساب جوجل للمتابعة إلى منصة أ/ محمد مصطفى
                </p>
              </div>
            </div>

            {/* Quick account presets */}
            <div className="space-y-2">
              <button
                onClick={() => handleConfirmGoogleLogin('student.mohamed@gmail.com', 'أحمد محمود (طالب كيمياء)')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition-all flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">أحمد محمود (طالب ثانوية عامة)</div>
                    <div className="text-[11px] text-slate-500 font-mono">student.mohamed@gmail.com</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-600">تسجيل فوراً</span>
              </button>

              <button
                onClick={() => handleConfirmGoogleLogin('mizoo2y2@gmail.com', 'Mazen Mohamed')}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition-all flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm font-mono">
                    M
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Mazen Mohamed</div>
                    <div className="text-[11px] text-slate-500 font-mono">mizoo2y2@gmail.com</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600">تسجيل فوراً</span>
              </button>
            </div>

            {/* Custom Google Email input */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block font-kufi">
                أو اكتب بريد جوجل الخاص بك:
              </span>
              <input
                type="text"
                placeholder="اسمك الكامل"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="email"
                placeholder="your-name@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono dir-ltr text-right"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConfirmGoogleLogin(customGoogleEmail || 'user@gmail.com', customGoogleName || 'طالب جديد')}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                >
                  دخول بالحساب المخصص
                </button>
                <button
                  onClick={() => setGooglePromptOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  رجوع
                </button>
              </div>
            </div>
          </div>
        ) : loginOpen ? (
          /* LOGIN MODAL: يلا سجل دخولك */
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1">
                <LogIn className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                يلا سجل دخولك 🧪
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أهلاً بك في منصة قيصر الكيمياء للأستاذ محمد مصطفى
              </p>
            </div>

            {/* GOOGLE SIGN-IN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-sans">
                تسجيل الدخول باستخدام Google
              </span>
            </button>

            {/* Vercel & Google OAuth Guide Trigger */}
            <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs">
              <button
                type="button"
                onClick={() => setShowVercelGuide(!showVercelGuide)}
                className="w-full flex items-center justify-between text-teal-800 dark:text-teal-300 font-bold font-kufi cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>دليل تفعيل جوجل على Vercel ورابط المنصة</span>
                </div>
                <span>{showVercelGuide ? '▲' : '▼'}</span>
              </button>

              {showVercelGuide && (
                <div className="pt-2.5 mt-2 border-t border-teal-200 dark:border-teal-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <p>
                    لتشغيل تسجيل الدخول بحسابات Google عند نشر الموقع على Vercel:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 font-mono text-[10px] dir-ltr text-left bg-white dark:bg-slate-900 p-2 rounded-xl border border-teal-200 dark:border-slate-800">
                    <li>1. Open Google Cloud Console &gt; Credentials</li>
                    <li>2. Add to Authorized JavaScript origins:</li>
                    <li className="text-teal-600 font-bold">https://your-project.vercel.app</li>
                    <li>3. Add to Authorized redirect URIs:</li>
                    <li className="text-teal-600 font-bold">https://your-project.vercel.app</li>
                  </ol>
                  <div className="text-[10px] text-slate-500">
                    رابط المنصة يعمل فوراً على أي نطاق Vercel مخصص.
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 absolute">أو برقم الهاتف</span>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                className="py-2 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                دخول كطالب (أحمد محمود)
              </button>
              <button
                type="button"
                onClick={handleDemoTeacherLogin}
                className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs"
              >
                دخول كمعلم (أ/ محمد مصطفى)
              </button>
            </div>

            {/* Phone Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  رقم الهاتف أو كود الطالب
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full p-2.5 pl-10 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 pl-10 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 transition-all shadow-md shadow-teal-700/20"
              >
                تسجيل الدخول للمنصة
              </button>
            </form>

            <div className="text-center text-xs text-slate-500">
              <span>لسه معملتش حساب؟ </span>
              <button
                onClick={onSwitchToRegister}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                خش اعمل اكونت من هنا
              </button>
            </div>
          </div>
        ) : (
          /* REGISTER MODAL: خش اعمل اكونت */
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                خش اعمل اكونت جديد ✨
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                انضم الآن لأبطال الكيمياء مع الأستاذ محمد مصطفى لدفعة 2026
              </p>
            </div>

            {/* Quick Google registration button */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>تسجيل سريع باستخدام Google</span>
            </button>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  اسم الطالب رباعي *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: أحمد محمود كمال الدين"
                    className="w-full p-2.5 pl-10 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    رقم هاتف الطالب *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    رقم ولي الأمر *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regParentPhone}
                    onChange={(e) => setRegParentPhone(e.target.value)}
                    placeholder="011XXXXXXXX"
                    className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  السنة الدراسية *
                </label>
                <select
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value as GradeLevel)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="first">الصف الأول الثانوي</option>
                  <option value="second">الصف الثاني الثانوي</option>
                  <option value="third">الصف الثالث الثانوي (دفعة 2026)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="اختر كلمة مرور قوية"
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 transition-all shadow-md shadow-teal-700/20"
              >
                تأكيد إنشاء الحساب ودخول المنصة
              </button>
            </form>

            <div className="text-center text-xs text-slate-500">
              <span>عندك حساب بالفعل؟ </span>
              <button
                onClick={onSwitchToLogin}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                يلا سجل دخولك
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


