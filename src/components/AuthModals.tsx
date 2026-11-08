import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, UserPlus, Phone, Lock, User, Sparkles, Globe, 
  HelpCircle, Check, Copy, KeyRound, ExternalLink, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { GradeLevel, UserProfile } from '../types';
import { SiteConfig } from '../types/siteConfig';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalsProps {
  loginOpen: boolean;
  registerOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  siteConfig?: SiteConfig;
  onUpdateGoogleClientId?: (clientId: string) => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  loginOpen,
  registerOpen,
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
  onSwitchToLogin,
  siteConfig,
  onUpdateGoogleClientId,
}) => {
  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);

  // Client ID state
  const [clientIdInput, setClientIdInput] = useState(() => {
    return siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id') || '244359507354-r0ic23fou6rfjgergu06i35ou2vn8qsc.apps.googleusercontent.com';
  });
  const [savedClientIdMsg, setSavedClientIdMsg] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<string>('جاهز للربط');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regGrade, setRegGrade] = useState<GradeLevel>('third');
  const [regPassword, setRegPassword] = useState('');

  // Helper to determine if an email is authorized as Admin / Teacher
  const checkIsAdminEmail = (emailStr?: string) => {
    if (!emailStr) return false;
    const clean = emailStr.toLowerCase().trim();
    if (clean === 'mizoo2y2@gmail.com') return true;
    const list = siteConfig?.adminEmails || ['mizoo2y2@gmail.com'];
    return list.some((e) => e.toLowerCase().trim() === clean);
  };

  // Handle Google Credential Response from Official Google Identity Services
  const handleGoogleCredentialResponse = (response: any) => {
    if (!response?.credential) return;
    try {
      // Decode JWT token from Google
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const email = payload.email || '';
      const isAdmin = checkIsAdminEmail(email);

      // Construct verified real user profile
      const verifiedUser: UserProfile = {
        id: payload.sub || `google-${Date.now()}`,
        name: isAdmin ? (siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى') : (payload.name || email.split('@')[0]),
        email: email,
        role: isAdmin ? 'teacher' : 'student',
        grade: 'third',
        phone: isAdmin ? (siteConfig?.phone1 || '01002345678') : '010XXXXXXXX',
        avatarUrl: payload.picture,
        score: 100,
      };

      onLoginSuccess(verifiedUser);
      onClose();
    } catch (err) {
      console.error('Failed to parse Google JWT credential', err);
    }
  };

  // Initialize official Google Identity Services whenever modal opens
  useEffect(() => {
    if (!loginOpen && !registerOpen) return;

    const currentClientId = clientIdInput || siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id');

    const initGoogleGSI = () => {
      if (window.google?.accounts?.id && currentClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: currentClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official Google button into container if present
          const btnElem = document.getElementById('official-google-btn-container');
          if (btnElem) {
            btnElem.innerHTML = '';
            window.google.accounts.id.renderButton(btnElem, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 320,
              locale: 'ar',
            });
          }
          setGoogleStatus('تم تهيئة Google SDK بنجاح');
        } catch (e: any) {
          console.warn('GIS initialize notice:', e);
        }
      }
    };

    const timer = setTimeout(initGoogleGSI, 250);
    return () => clearTimeout(timer);
  }, [loginOpen, registerOpen, clientIdInput, siteConfig?.googleClientId]);

  // Trigger Real Google Popup
  const handleTriggerRealGooglePopup = () => {
    const activeClientId = clientIdInput || siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id');

    if (!activeClientId) {
      // Prompt user to enter their client ID
      setShowClientIdConfig(true);
      return;
    }

    // Try Google OAuth2 Token Client (opens real browser popup window to pick account)
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                // Fetch real user profile from Google API
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await res.json();
                if (googleProfile?.email) {
                  const email = googleProfile.email;
                  const isAdmin = checkIsAdminEmail(email);

                  onLoginSuccess({
                    id: googleProfile.sub || `google-${Date.now()}`,
                    name: isAdmin ? (siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى') : (googleProfile.name || email.split('@')[0]),
                    email: email,
                    role: isAdmin ? 'teacher' : 'student',
                    grade: 'third',
                    phone: isAdmin ? (siteConfig?.phone1 || '01002345678') : '010XXXXXXXX',
                    avatarUrl: googleProfile.picture,
                    score: 100,
                  });
                  onClose();
                  return;
                }
              } catch (err) {
                console.error('Error fetching Google userinfo:', err);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('OAuth2 popup error, trying One Tap prompt:', e);
      }
    }


    // If accounts.id is available, prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowClientIdConfig(true);
        }
      });
      return;
    }

    setShowClientIdConfig(true);
  };

  // Save custom Google Client ID
  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    localStorage.setItem('mm_google_client_id', clientIdInput.trim());
    if (onUpdateGoogleClientId) {
      onUpdateGoogleClientId(clientIdInput.trim());
    }
    setSavedClientIdMsg(true);
    setTimeout(() => {
      setSavedClientIdMsg(false);
      setShowClientIdConfig(false);
    }, 1500);
  };

  if (!loginOpen && !registerOpen) return null;

  // Handle phone login
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
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {loginOpen ? (
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
                تسجيل الدخول المباشر للطلاب بحساب Google الشخصي أو الهاتف
              </p>
            </div>

            {/* SINGLE UNIFIED GOOGLE SIGN-IN BUTTON */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleTriggerRealGooglePopup}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-teal-500/30 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-teal-50/50 dark:hover:bg-slate-700/60 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer group hover:border-teal-500 active:scale-98"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
                  المتابعة بحساب Google
                </span>
              </button>


              {/* Google Client ID quick toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-1">
                <button
                  type="button"
                  onClick={() => setShowClientIdConfig(!showClientIdConfig)}
                  className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{showClientIdConfig ? 'إخفاء إعداد Client ID' : 'تخصيص Google Client ID'}</span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Google Identity SDK</span>
              </div>

              {/* Google Client ID Configuration Box */}
              {showClientIdConfig && (
                <form onSubmit={handleSaveClientId} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800 space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-kufi">
                      ضع Client ID الخاص بمشروعك هنا:
                    </span>
                    {savedClientIdMsg && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم الحفظ!
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono dir-ltr text-left"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700"
                    >
                      تفعيل وحفظ Client ID
                    </button>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <span>نسخ من Google Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </form>
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 absolute">أو برقم الهاتف</span>
            </div>

            {/* Quick Demo Access Bar for Students */}
            <div>
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                دخول تجريبي سريع كطالب (أحمد محمود)
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
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 transition-all shadow-md shadow-teal-700/20 cursor-pointer"
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

            {/* Google Sign-in trigger for registration */}
            <button
              type="button"
              onClick={handleTriggerRealGooglePopup}
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
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 transition-all shadow-md shadow-teal-700/20 cursor-pointer"
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
