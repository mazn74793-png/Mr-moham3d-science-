import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, UserPlus, Phone, Lock, User, Sparkles, AlertCircle, 
  GraduationCap, Check, ArrowRight
} from 'lucide-react';
import { UserProfile, GradeLevel } from '../types';
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
  // Mode: 'login' or 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (registerOpen) {
      setActiveTab('register');
    } else if (loginOpen) {
      setActiveTab('login');
    }
  }, [loginOpen, registerOpen]);

  // Form states for regular login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form states for regular registration
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGrade, setRegGrade] = useState<GradeLevel>('third');
  const [regParentPhone, setRegParentPhone] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);

  // Client ID state
  const [clientIdInput] = useState(() => {
    return siteConfig?.googleClientId || localStorage.getItem('mm_google_client_id') || '244359507354-r0ic23fou6rfjgergu06i35ou2vn8qsc.apps.googleusercontent.com';
  });

  // Helper to determine if an email is authorized as Admin / Teacher
  const checkIsAdminEmail = (emailStr?: string) => {
    if (!emailStr) return false;
    const clean = emailStr.toLowerCase().trim();
    if (clean === 'mizoo2y2@gmail.com') return true;
    const list = siteConfig?.adminEmails || ['mizoo2y2@gmail.com'];
    return list.some((e) => e.toLowerCase().trim() === clean);
  };

  // Helper to lookup if student already has a saved completed profile
  const getExistingStudentRecord = (id?: string, email?: string): UserProfile | null => {
    try {
      const savedRaw = localStorage.getItem('mm_registered_students');
      if (savedRaw) {
        const list: UserProfile[] = JSON.parse(savedRaw);
        if (Array.isArray(list)) {
          const found = list.find(s => 
            (id && s.id === id) || 
            (email && s.email && s.email.toLowerCase().trim() === email.toLowerCase().trim())
          );
          if (found) return found;
        }
      }
    } catch (e) {}
    return null;
  };

  const isProfileMarkedCompleted = (id?: string, email?: string): boolean => {
    if (email && checkIsAdminEmail(email)) return true;
    if (email && localStorage.getItem(`mm_profile_done_${email.toLowerCase().trim()}`) === 'true') {
      return true;
    }
    if (id && localStorage.getItem(`mm_profile_done_${id}`) === 'true') {
      return true;
    }
    const record = getExistingStudentRecord(id, email);
    return Boolean(record?.profileCompleted);
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

      const existingRecord = getExistingStudentRecord(payload.sub, email);
      const isCompleted = isAdmin || isProfileMarkedCompleted(payload.sub, email);

      // Construct verified real user profile, preserving existing completed data
      const verifiedUser: UserProfile = {
        id: existingRecord?.id || payload.sub || `google-${Date.now()}`,
        name: isAdmin 
          ? (siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى') 
          : (existingRecord?.name || payload.name || email.split('@')[0]),
        email: email,
        role: isAdmin ? 'teacher' : 'student',
        grade: existingRecord?.grade || 'third',
        phone: isAdmin ? (siteConfig?.phone1 || '01002345678') : (existingRecord?.phone || ''),
        parentPhone: existingRecord?.parentPhone || '',
        governorate: existingRecord?.governorate || 'القاهرة',
        avatarUrl: payload.picture || existingRecord?.avatarUrl,
        score: existingRecord?.score || 0,
        profileCompleted: isCompleted,
        watchedLectureIds: existingRecord?.watchedLectureIds || [],
        passedQuizIds: existingRecord?.passedQuizIds || [],
        quizScores: existingRecord?.quizScores || {},
        joinedAt: existingRecord?.joinedAt || new Date().toISOString().split('T')[0],
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
  }, [loginOpen, registerOpen, clientIdInput, siteConfig?.googleClientId, activeTab]);

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

                  const existingRecord = getExistingStudentRecord(googleProfile.sub, email);
                  const isCompleted = isAdmin || isProfileMarkedCompleted(googleProfile.sub, email);

                  onLoginSuccess({
                    id: existingRecord?.id || googleProfile.sub || `google-${Date.now()}`,
                    name: isAdmin 
                      ? (siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى') 
                      : (existingRecord?.name || googleProfile.name || email.split('@')[0]),
                    email: email,
                    role: isAdmin ? 'teacher' : 'student',
                    grade: existingRecord?.grade || 'third',
                    phone: isAdmin ? (siteConfig?.phone1 || '01002345678') : (existingRecord?.phone || ''),
                    parentPhone: existingRecord?.parentPhone || '',
                    governorate: existingRecord?.governorate || 'القاهرة',
                    avatarUrl: googleProfile.picture || existingRecord?.avatarUrl,
                    score: existingRecord?.score || 0,
                    profileCompleted: isCompleted,
                    watchedLectureIds: existingRecord?.watchedLectureIds || [],
                    passedQuizIds: existingRecord?.passedQuizIds || [],
                    quizScores: existingRecord?.quizScores || {},
                    joinedAt: existingRecord?.joinedAt || new Date().toISOString().split('T')[0],
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

  // Regular Login Handler
  const handleRegularLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setAuthError('يرجى كتابة رقم الهاتف أو البريد الإلكتروني.');
      return;
    }
    if (!loginPassword.trim()) {
      setAuthError('يرجى كتابة كلمة المرور.');
      return;
    }

    const isAdmin = checkIsAdminEmail(cleanId);
    if (isAdmin) {
      onLoginSuccess({
        id: 'admin-teacher-1',
        name: siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى',
        email: cleanId,
        role: 'teacher',
        grade: 'third',
        phone: siteConfig?.phone1 || '01002345678',
        parentPhone: '',
        score: 0,
        profileCompleted: true,
        watchedLectureIds: [],
        passedQuizIds: [],
        quizScores: {},
        joinedAt: new Date().toISOString().split('T')[0],
      });
      onClose();
      return;
    }

    // Check existing students in localStorage
    const savedStudentsRaw = localStorage.getItem('mm_registered_students');
    let existingList: UserProfile[] = [];
    if (savedStudentsRaw) {
      try {
        existingList = JSON.parse(savedStudentsRaw);
      } catch (err) {
        existingList = [];
      }
    }

    const matched = existingList.find(
      s => s.email?.toLowerCase() === cleanId.toLowerCase() || s.phone === cleanId
    );

    if (matched) {
      onLoginSuccess(matched);
      onClose();
      return;
    }

    // If student not found yet, create their active profile directly
    const newStudentUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: cleanId.includes('@') ? cleanId.split('@')[0] : `طالب منصة (${cleanId.slice(-4)})`,
      email: cleanId.includes('@') ? cleanId : '',
      phone: !cleanId.includes('@') ? cleanId : '',
      parentPhone: '',
      role: 'student',
      grade: 'third',
      score: 0,
      profileCompleted: false, // will ask them to pick their grade
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      joinedAt: new Date().toISOString().split('T')[0],
    };

    onLoginSuccess(newStudentUser);
    onClose();
  };

  // Regular Register Handler
  const handleRegularRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const nameClean = regName.trim();
    const idClean = regIdentifier.trim();
    const parentPhoneClean = regParentPhone.trim();
    const passClean = regPassword.trim();

    if (!nameClean || nameClean.length < 3) {
      setAuthError('يرجى كتابة الاسم الثلاثي للطالب بشكل صحيح.');
      return;
    }
    if (!idClean) {
      setAuthError('يرجى كتابة رقم هاتف الطالب أو البريد الإلكتروني.');
      return;
    }
    if (!parentPhoneClean) {
      setAuthError('يرجى كتابة رقم هاتف ولي الأمر للتواصل ومتابعة التقارير.');
      return;
    }
    if (!passClean || passClean.length < 4) {
      setAuthError('يرجى إدخال كلمة مرور مكونة من 4 أحرف أو أرقام على الأقل.');
      return;
    }

    const isAdmin = checkIsAdminEmail(idClean);

    const createdUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: isAdmin ? (siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى') : nameClean,
      email: idClean.includes('@') ? idClean : '',
      phone: !idClean.includes('@') ? idClean : '',
      parentPhone: parentPhoneClean,
      role: isAdmin ? 'teacher' : 'student',
      grade: regGrade,
      score: 0,
      profileCompleted: true, // Data already provided!
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      joinedAt: new Date().toISOString().split('T')[0],
    };

    // Save into registered students list
    try {
      if (createdUser.email) {
        localStorage.setItem(`mm_profile_done_${createdUser.email.toLowerCase().trim()}`, 'true');
      }
      if (createdUser.phone) {
        localStorage.setItem(`mm_profile_done_${createdUser.phone.trim()}`, 'true');
      }
      localStorage.setItem(`mm_profile_done_${createdUser.id}`, 'true');

      const savedRaw = localStorage.getItem('mm_registered_students');
      const list: UserProfile[] = savedRaw ? JSON.parse(savedRaw) : [];
      const updated = [createdUser, ...list.filter(u => u.id !== createdUser.id)];
      localStorage.setItem('mm_registered_students', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to local list:', err);
    }

    onLoginSuccess(createdUser);
    onClose();
  };

  if (!loginOpen && !registerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-teal-100 dark:border-slate-800 text-right my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center sm:text-right mb-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto sm:mr-0 mb-2 shadow-xs">
            {activeTab === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h3 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
            {activeTab === 'login' ? 'تسجيل الدخول للمنصة' : 'إنشاء حساب طالب جديد'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans mt-1">
            {activeTab === 'login' 
              ? 'مرحباً بعودتك! سجل دخولك لمتابعة حصصك وامتحاناتك'
              : 'انضم الآن لأبطال الكيمياء وتابع دروسك أولاً بأول'}
          </p>
        </div>

        {/* Tab Switcher: تسجيل الدخول vs حساب جديد */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-5">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setAuthError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer font-kufi flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setAuthError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer font-kufi flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>إنشاء حساب جديد</span>
          </button>
        </div>

        {/* Error Banner */}
        {authError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 1. Quick Google Button (Available in both tabs) */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={handleTriggerRealGooglePopup}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-teal-500/30 hover:border-teal-500 bg-white dark:bg-slate-800/90 hover:bg-teal-50/50 dark:hover:bg-slate-700/60 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-98 min-h-[48px]"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
              المتابعة السريعة بحساب Google
            </span>
          </button>
          
          <div id="official-google-btn-container" className="flex justify-center" />
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-5">
          <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="shrink mx-3 text-xs text-slate-400 font-sans">أو بالحساب العادي</span>
          <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* 2. REGULAR LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleRegularLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                رقم الهاتف أو البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="010XXXXXXXX أو البريد الإلكتروني"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 font-sans"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 font-sans"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[46px] font-kufi"
            >
              <span>تسجيل الدخول</span>
              <LogIn className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 3. REGULAR REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegularRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الاسم ثلاثي للطالب
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 font-sans"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                رقم هاتف الطالب أو البريد
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regIdentifier}
                  onChange={(e) => setRegIdentifier(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 font-sans"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Academic Grade Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الصف الدراسي
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRegGrade('first')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold font-kufi border transition-all text-center ${
                    regGrade === 'first'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  أولى ثانوي
                </button>
                <button
                  type="button"
                  onClick={() => setRegGrade('second')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold font-kufi border transition-all text-center ${
                    regGrade === 'second'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  تانية ثانوي
                </button>
                <button
                  type="button"
                  onClick={() => setRegGrade('third')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold font-kufi border transition-all text-center ${
                    regGrade === 'third'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  تالتة ثانوي 🔥
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                رقم هاتف ولي الأمر (واتساب)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regParentPhone}
                  onChange={(e) => setRegParentPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 font-sans"
                  required
                />
                <Phone className="w-4 h-4 text-emerald-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 font-sans"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[46px] font-kufi"
            >
              <span>إنشاء الحساب وبدء التعلم</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
