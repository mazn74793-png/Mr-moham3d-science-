import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { UserProfile } from '../types';
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
  siteConfig,
}) => {
  // Client ID state
  const [clientIdInput] = useState(() => {
    return siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id') || '244359507354-r0ic23fou6rfjgergu06i35ou2vn8qsc.apps.googleusercontent.com';
  });
  const [authError, setAuthError] = useState<string | null>(null);

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
        phone: isAdmin ? (siteConfig?.phone1 || '01002345678') : '',
        parentPhone: '',
        avatarUrl: payload.picture,
        score: 0,
        profileCompleted: isAdmin ? true : false,
        watchedLectureIds: [],
        passedQuizIds: [],
        quizScores: {},
        joinedAt: new Date().toISOString().split('T')[0],
      };

      onLoginSuccess(verifiedUser);
      onClose();
    } catch (err) {
      console.error('Failed to parse Google JWT credential', err);
      setAuthError('تعذر معالجة استجابة تسجيل الدخول بجوجل.');
    }
  };

  // Initialize official Google Identity Services whenever modal opens
  useEffect(() => {
    if (!loginOpen && !registerOpen) return;

    const currentClientId = clientIdInput || siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id') || '244359507354-r0ic23fou6rfjgergu06i35ou2vn8qsc.apps.googleusercontent.com';

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
    setAuthError(null);
    const activeClientId = clientIdInput || siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id') || '244359507354-r0ic23fou6rfjgergu06i35ou2vn8qsc.apps.googleusercontent.com';

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
                    phone: isAdmin ? (siteConfig?.phone1 || '01002345678') : '',
                    parentPhone: '',
                    avatarUrl: googleProfile.picture,
                    score: 0,
                    profileCompleted: isAdmin ? true : false,
                    watchedLectureIds: [],
                    passedQuizIds: [],
                    quizScores: {},
                    joinedAt: new Date().toISOString().split('T')[0],
                  });
                  onClose();
                  return;
                }
              } catch (err) {
                console.error('Error fetching Google userinfo:', err);
                setAuthError('حدث خطأ أثناء جلب بيانات الحساب من Google.');
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
      window.google.accounts.id.prompt();
      return;
    }
  };

  if (!loginOpen && !registerOpen) return null;

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

        {/* UNIFIED STRICT GOOGLE AUTHENTICATION SCREEN */}
        <div className="space-y-6 text-center sm:text-right">
          
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto sm:mr-0 mb-1 shadow-xs">
              <LogIn className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
              تسجيل الدخول للمنصة 🧪
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              سجل دخولك بحساب Google الشخصي المعتمد لمتابعة حصصك الدراسية، أداء الامتحانات، وحفظ درجاتك في سجلك الأكاديمي.
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* MAIN GOOGLE SIGN-IN BUTTON */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleTriggerRealGooglePopup}
              className="w-full py-4 px-5 rounded-2xl border-2 border-teal-500/40 hover:border-teal-500 bg-white dark:bg-slate-800 hover:bg-teal-50/50 dark:hover:bg-slate-700/60 shadow-md shadow-teal-900/5 transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-98 min-h-[52px]"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">
                المتابعة بحساب Google
              </span>
            </button>

            {/* Official GIS container fallback */}
            <div id="official-google-btn-container" className="flex justify-center" />
          </div>

          {/* Strict Security Policy Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-right">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-kufi">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>تعليمات أمان الحسابات:</span>
            </div>
            
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed font-sans pr-4 list-disc">
              <li>الدخول مقتصر على حسابات Google الرسمية لضمان حقوق الملكية ومنع الحسابات الوهمية.</li>
              <li>للطلاب الجدد: يتم استكمال بيانات الصف الدراسي ورقم ولي الأمر فور تسجيل الدخول.</li>
              <li>للأستاذ المشرف: التسجيل ببريد <span className="font-mono text-teal-600 dark:text-teal-400 dir-ltr font-bold">mizoo2y2@gmail.com</span> يفتح لوحة الإدارة والتحكم مباشرة.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
