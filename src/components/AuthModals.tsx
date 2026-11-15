import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  Phone,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Atom,
} from 'lucide-react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { UserProfile, GradeLevel } from '../types';
import { SiteConfig, getResolvedGrades } from '../types/siteConfig';
import { auth, googleProvider, getStudentFromCloud, fetchAdminConfigIfAuthorized } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalsProps {
  loginOpen: boolean;
  registerOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  siteConfig?: SiteConfig;
}

const REDIRECT_PENDING_KEY = 'mm_auth_redirect_pending';
const REDIRECT_TS_KEY = 'mm_auth_redirect_ts';

function isTopLevelWindow(): boolean {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  loginOpen,
  registerOpen,
  onClose,
  onLoginSuccess,
  siteConfig,
}) => {
  const { lang, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (registerOpen) {
      setActiveTab('register');
    } else if (loginOpen) {
      setActiveTab('login');
    }
  }, [loginOpen, registerOpen]);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const resolvedGrades = getResolvedGrades(siteConfig);

  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGrade, setRegGrade] = useState<GradeLevel>(() => {
    const popular = resolvedGrades.find((g) => g.isPopular);
    return popular?.id || resolvedGrades[0]?.id || 'third';
  });
  const [regParentPhone, setRegParentPhone] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const inputIconPos = isRtl ? 'right-3.5' : 'left-3.5';
  const inputPad = isRtl ? 'pl-4 pr-10' : 'pr-4 pl-10';

  const checkIsAdminEmail = (emailStr?: string, cloudAllowedEmails?: string[]) => {
    if (!emailStr) return false;
    const clean = emailStr.toLowerCase().trim();
    if (clean === 'mizoo2y2@gmail.com') return true;
    if (!cloudAllowedEmails || cloudAllowedEmails.length === 0) return false;
    return cloudAllowedEmails.some((e) => e.toLowerCase().trim() === clean);
  };

  const getExistingStudentRecord = (id?: string, email?: string): UserProfile | null => {
    try {
      const savedRaw = sessionStorage.getItem('mm_registered_students');
      if (savedRaw) {
        const list: UserProfile[] = JSON.parse(savedRaw);
        if (Array.isArray(list)) {
          const found = list.find(
            (s) =>
              (id && s.id === id) ||
              (email && s.email && s.email.toLowerCase().trim() === email.toLowerCase().trim())
          );
          if (found) return found;
        }
      }
    } catch {}
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

  const persistRedirectFlags = () => {
    const nowStr = String(Date.now());
    try {
      sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
      sessionStorage.setItem(REDIRECT_TS_KEY, nowStr);
    } catch {}
  };

  const clearRedirectFlags = () => {
    try {
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
      sessionStorage.removeItem(REDIRECT_TS_KEY);
    } catch {}
  };

  const completeFirebaseUserLogin = async (fbUser: NonNullable<typeof auth.currentUser>) => {
    const email = fbUser.email || '';
    const cleanEmail = email.toLowerCase().trim();
    const defaultGrade =
      resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third';

    const cachedAdminEmails = siteConfig?.adminEmails || ['mizoo2y2@gmail.com'];
    const isInstantAdmin =
      Boolean(fbUser.emailVerified) &&
      (cleanEmail === 'mizoo2y2@gmail.com' ||
        cachedAdminEmails.some((e) => e.toLowerCase().trim() === cleanEmail));

    if (isInstantAdmin) {
      onLoginSuccess({
        id: fbUser.uid,
        name: siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى',
        email,
        role: 'teacher',
        grade: defaultGrade,
        phone: siteConfig?.phone1 || '01002345678',
        parentPhone: '',
        avatarUrl: fbUser.photoURL || '',
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

    const [adminCfg, cloudRecord] = await Promise.all([
      fbUser.emailVerified ? fetchAdminConfigIfAuthorized(1500) : Promise.resolve(null),
      getStudentFromCloud(fbUser.uid, 1500).catch(() => null),
    ]);

    const isAdmin =
      Boolean(fbUser.emailVerified) && checkIsAdminEmail(email, adminCfg?.adminEmails);

    if (isAdmin) {
      onLoginSuccess({
        id: fbUser.uid,
        name: siteConfig?.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى',
        email,
        role: 'teacher',
        grade: defaultGrade,
        phone: siteConfig?.phone1 || '01002345678',
        parentPhone: '',
        avatarUrl: fbUser.photoURL || '',
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

    const existingRecord = cloudRecord || getExistingStudentRecord(fbUser.uid, email);
    const isCompleted =
      Boolean(existingRecord?.profileCompleted) || isProfileMarkedCompleted(fbUser.uid, email);

    onLoginSuccess({
      id: fbUser.uid,
      name:
        existingRecord?.name ||
        fbUser.displayName ||
        email.split('@')[0] ||
        (lang === 'en' ? 'Platform Student' : 'طالب منصة'),
      email,
      role: 'student',
      grade: existingRecord?.grade || defaultGrade,
      phone: existingRecord?.phone || '',
      parentPhone: existingRecord?.parentPhone || '',
      governorate: existingRecord?.governorate || (lang === 'en' ? 'Cairo' : 'القاهرة'),
      avatarUrl: fbUser.photoURL || existingRecord?.avatarUrl || '',
      score: existingRecord?.score || 0,
      points: existingRecord?.points || 0,
      unlockedLectureIds: existingRecord?.unlockedLectureIds || [],
      unlockedAttachmentIds: existingRecord?.unlockedAttachmentIds || [],
      claimedRewardIds: existingRecord?.claimedRewardIds || [],
      pointsHistory: existingRecord?.pointsHistory || [],
      profileCompleted: isCompleted,
      watchedLectureIds: existingRecord?.watchedLectureIds || [],
      passedQuizIds: existingRecord?.passedQuizIds || [],
      quizScores: existingRecord?.quizScores || {},
      joinedAt: existingRecord?.joinedAt || new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setAuthError(null);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setAuthError(
        lang === 'en'
          ? 'No internet connection right now — please check your network and try again.'
          : 'لا يوجد اتصال بالإنترنت حالياً — تأكد من الشبكة ثم أعد المحاولة.'
      );
      return;
    }

    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      clearRedirectFlags();
      await completeFirebaseUserLogin(result.user);
    } catch (err: any) {
      if (auth.currentUser) {
        clearRedirectFlags();
        await completeFirebaseUserLogin(auth.currentUser);
        return;
      }

      const code = err?.code || '';
      const lastRedirectTs = Number(sessionStorage.getItem(REDIRECT_TS_KEY) || '0');
      const canAutoRedirect = isTopLevelWindow() && Date.now() - lastRedirectTs > 15000;

      if (
        (code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment') &&
        canAutoRedirect
      ) {
        try {
          persistRedirectFlags();
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          clearRedirectFlags();
          setAuthError(
            lang === 'en'
              ? 'Browser blocked the sign-in window. Please allow popups and try again.'
              : 'حجب المتصفح نافذة تسجيل الدخول، يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.'
          );
        }
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(
          lang === 'en'
            ? 'Google sign-in was closed before completion. Please try again.'
            : 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية، يرجى المحاولة مرة أخرى.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          lang === 'en'
            ? `Domain (${window.location.hostname}) is not authorized in Firebase Authentication settings.`
            : `النطاق (${window.location.hostname}) غير مضاف بعد في قائمة النطاقات المصرح بها لتسجيل الدخول.`
        );
      } else if (code === 'auth/network-request-failed') {
        setAuthError(
          lang === 'en'
            ? 'Network error connecting to sign-in service. Check your connection and retry.'
            : 'تعذر الاتصال بخدمة تسجيل الدخول، تحقق من الشبكة ثم أعد المحاولة.'
        );
      } else {
        setAuthError(
          lang === 'en'
            ? 'Could not complete Google Sign-In. Please try again.'
            : 'تعذر تسجيل الدخول بحساب Google، يرجى المحاولة مرة أخرى.'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegularLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setAuthError(
        lang === 'en'
          ? 'Please enter your phone number or email address.'
          : 'يرجى كتابة رقم الهاتف أو البريد الإلكتروني.'
      );
      return;
    }

    if (checkIsAdminEmail(cleanId)) {
      handleGoogleLogin();
      return;
    }

    if (!loginPassword.trim()) {
      setAuthError(lang === 'en' ? 'Please enter your password.' : 'يرجى كتابة كلمة المرور.');
      return;
    }

    let existingList: UserProfile[] = [];
    try {
      const savedStudentsRaw = sessionStorage.getItem('mm_registered_students');
      if (savedStudentsRaw) {
        existingList = JSON.parse(savedStudentsRaw);
      }
    } catch {
      existingList = [];
    }

    const matched = existingList.find(
      (s) =>
        s.role !== 'teacher' &&
        (s.email?.toLowerCase() === cleanId.toLowerCase() || s.phone === cleanId)
    );

    if (matched) {
      const savedSecret = sessionStorage.getItem(`mm_local_pass_${matched.id}`);
      if (!savedSecret || savedSecret !== loginPassword.trim()) {
        setAuthError(
          lang === 'en'
            ? 'Incorrect password. Please double check and try again.'
            : 'كلمة المرور غير صحيحة، يرجى التحقق والمحاولة مرة أخرى.'
        );
        return;
      }
      onLoginSuccess(matched);
      onClose();
      return;
    }

    const defaultGrade =
      resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third';

    const newStudentUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: cleanId.includes('@')
        ? cleanId.split('@')[0]
        : lang === 'en'
        ? `Student (${cleanId.slice(-4)})`
        : `طالب منصة (${cleanId.slice(-4)})`,
      email: cleanId.includes('@') ? cleanId : '',
      phone: !cleanId.includes('@') ? cleanId : '',
      parentPhone: '',
      role: 'student',
      grade: defaultGrade,
      score: 0,
      profileCompleted: false,
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      joinedAt: new Date().toISOString().split('T')[0],
    };

    onLoginSuccess(newStudentUser);
    onClose();
  };

  const handleRegularRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const nameClean = regName.trim();
    const idClean = regIdentifier.trim();
    const parentPhoneClean = regParentPhone.trim();
    const passClean = regPassword.trim();

    if (!nameClean || nameClean.length < 3) {
      setAuthError(
        lang === 'en'
          ? 'Please enter the student full name (at least 3 characters).'
          : 'يرجى كتابة الاسم الثلاثي للطالب بشكل صحيح.'
      );
      return;
    }
    if (!idClean) {
      setAuthError(
        lang === 'en'
          ? 'Please enter student phone number or email.'
          : 'يرجى كتابة رقم هاتف الطالب أو البريد الإلكتروني.'
      );
      return;
    }
    if (!parentPhoneClean) {
      setAuthError(
        lang === 'en'
          ? 'Please enter parent WhatsApp phone number for progress updates.'
          : 'يرجى كتابة رقم هاتف ولي الأمر للتواصل ومتابعة التقارير.'
      );
      return;
    }
    if (!passClean || passClean.length < 4) {
      setAuthError(
        lang === 'en'
          ? 'Please create a password of at least 4 characters.'
          : 'يرجى إدخال كلمة مرور مكونة من 4 أحرف أو أرقام على الأقل.'
      );
      return;
    }

    if (checkIsAdminEmail(idClean)) {
      handleGoogleLogin();
      return;
    }

    const createdUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: nameClean,
      email: idClean.includes('@') ? idClean : '',
      phone: !idClean.includes('@') ? idClean : '',
      parentPhone: parentPhoneClean,
      role: 'student',
      grade: regGrade,
      score: 0,
      profileCompleted: true,
      watchedLectureIds: [],
      passedQuizIds: [],
      quizScores: {},
      joinedAt: new Date().toISOString().split('T')[0],
    };

    try {
      if (createdUser.email) {
        localStorage.setItem(`mm_profile_done_${createdUser.email.toLowerCase().trim()}`, 'true');
      }
      if (createdUser.phone) {
        localStorage.setItem(`mm_profile_done_${createdUser.phone.trim()}`, 'true');
      }
      localStorage.setItem(`mm_profile_done_${createdUser.id}`, 'true');
      sessionStorage.setItem(`mm_local_pass_${createdUser.id}`, passClean);

      const savedRaw = sessionStorage.getItem('mm_registered_students');
      const list: UserProfile[] = savedRaw ? JSON.parse(savedRaw) : [];
      const updated = [createdUser, ...list.filter((u) => u.id !== createdUser.id)];
      sessionStorage.setItem('mm_registered_students', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to session list:', err);
    }

    onLoginSuccess(createdUser);
    onClose();
  };

  if (!loginOpen && !registerOpen) return null;

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[calc(100vh-5rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col justify-center"
    >
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Back Navigation */}
        <div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <BackIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{lang === 'en' ? 'Back to Home' : 'العودة للصفحة الرئيسية'}</span>
          </button>
        </div>

        {/* Full-Page Split Auth Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/* Brand Editorial Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-7 sm:p-10 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <Atom className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">
                    {lang === 'en' ? 'Mr. Mohamed Mostafa' : 'أ/ محمد مصطفى'}
                  </div>
                  <div className="text-[11px] text-teal-300/90 font-mono">
                    {lang === 'en' ? 'Chemistry & Science · 2026' : 'خبير الكيمياء والعلوم · 2026'}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
                  {activeTab === 'login'
                    ? lang === 'en'
                      ? 'Welcome back to your Chemistry workspace'
                      : 'أهلاً بعودتك لمنصتك التعليمية'
                    : lang === 'en'
                    ? 'Create your student learning account'
                    : 'أنشئ حسابك الدراسي الآن'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {lang === 'en'
                    ? 'Access video lectures, interactive quizzes, PDF handouts, and your study equations bank in one organized place.'
                    : 'تابع جميع محاضراتك، الامتحانات الإلكترونية، المذكرات وبنك المعادلات في مكان واحد منظم.'}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Isolated, verified session per device & instant cloud sync.'
                  : 'جلسة دخول آمنة ومعزولة لكل جهاز مع مزامنة سحابية فورية.'}
              </span>
            </div>
          </div>

          {/* Interactive Authentication Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{lang === 'en' ? 'Sign In' : 'تسجيل الدخول'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Create Account' : 'إنشاء حساب جديد'}</span>
              </button>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 leading-relaxed font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-teal-500/30 hover:border-teal-500 bg-white dark:bg-slate-800/90 hover:bg-teal-50/50 dark:hover:bg-slate-700/60 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.99] min-h-[48px] disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600 shrink-0" />
                ) : (
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {googleLoading
                    ? lang === 'en'
                      ? 'Signing in with Google...'
                      : 'جاري تسجيل الدخول بحساب Google...'
                    : lang === 'en'
                    ? 'Continue with Google Account'
                    : 'المتابعة السريعة بحساب Google'}
                </span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink mx-3 text-xs text-slate-400">
                {lang === 'en' ? 'Or with phone & password' : 'أو بالحساب العادي'}
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleRegularLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'en' ? 'Phone Number or Email' : 'رقم الهاتف أو البريد الإلكتروني'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={lang === 'en' ? '010XXXXXXXX or email@example.com' : '010XXXXXXXX أو البريد الإلكتروني'}
                      className={`w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                      required
                    />
                    <Phone className={`w-4 h-4 text-slate-400 absolute top-3.5 ${inputIconPos}`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'en' ? 'Password' : 'كلمة المرور'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                      required
                    />
                    <Lock className={`w-4 h-4 text-slate-400 absolute top-3.5 ${inputIconPos}`} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] min-h-[48px]"
                >
                  <span>{lang === 'en' ? 'Sign In' : 'تسجيل الدخول'}</span>
                  <LogIn className="w-4 h-4" />
                </button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegularRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'en' ? 'Full Student Name' : 'الاسم ثلاثي للطالب'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. Ahmed Mohamed Ali' : 'مثال: أحمد محمد علي'}
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <User className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'en' ? 'Student Phone or Email' : 'رقم هاتف الطالب أو البريد'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regIdentifier}
                        onChange={(e) => setRegIdentifier(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <Phone className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'en' ? 'Academic Grade' : 'الصف الدراسي'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {resolvedGrades.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setRegGrade(g.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer truncate ${
                          regGrade === g.id
                            ? g.isPopular
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {lang === 'en' ? g.badgeEn || g.badgeAr : g.badgeAr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'en' ? 'Parent Phone (WhatsApp)' : 'رقم هاتف ولي الأمر (واتساب)'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regParentPhone}
                        onChange={(e) => setRegParentPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <Phone className={`w-4 h-4 text-emerald-500 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'en' ? 'Password' : 'كلمة المرور'}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <Lock className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] min-h-[48px]"
                >
                  <span>
                    {lang === 'en'
                      ? 'Create Account & Start Learning'
                      : 'إنشاء الحساب وبدء التعلم'}
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
