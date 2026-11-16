import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
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
  Eye,
  EyeOff,
} from 'lucide-react';
import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { UserProfile, GradeLevel } from '../types';
import { SiteConfig, getResolvedGrades } from '../types/siteConfig';
import {
  auth,
  googleProvider,
  getStudentFromCloud,
  fetchAdminConfigIfAuthorized,
  signInManualWithEmail,
  registerManualWithEmail,
  MANDATORY_ADMIN_PASSWORD,
  syncAdminMandatoryPassword,
} from '../firebase';
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
  const isEn = lang === 'en';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (registerOpen) {
      setActiveTab('register');
    } else if (loginOpen) {
      setActiveTab('login');
    }
  }, [loginOpen, registerOpen]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  const resolvedGrades = getResolvedGrades(siteConfig);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regGrade, setRegGrade] = useState<GradeLevel>(() => {
    const popular = resolvedGrades.find((g) => g.isPopular);
    return popular?.id || resolvedGrades[0]?.id || 'third';
  });
  const [regParentPhone, setRegParentPhone] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);
  const [suggestGoogleLink, setSuggestGoogleLink] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const inputIconPos = isRtl ? 'right-3.5' : 'left-3.5';
  const inputPad = isRtl ? 'pl-4 pr-10' : 'pr-4 pl-10';
  const inputPadBoth = isRtl ? 'pl-11 pr-10' : 'pr-11 pl-10';
  const eyeBtnPos = isRtl ? 'left-3' : 'right-3';

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

  const completeFirebaseUserLogin = async (
    fbUser: NonNullable<typeof auth.currentUser>,
    overrideFields?: Partial<UserProfile>
  ) => {
    const email = fbUser.email || overrideFields?.email || '';
    const cleanEmail = email.toLowerCase().trim();
    const defaultGrade =
      resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third';

    const cachedAdminEmails = siteConfig?.adminEmails || ['mizoo2y2@gmail.com'];
    const isInstantAdmin =
      Boolean(fbUser.emailVerified) &&
      (cleanEmail === 'mizoo2y2@gmail.com' ||
        cachedAdminEmails.some((e) => e.toLowerCase().trim() === cleanEmail));

    const hasGoogleProvider = Boolean(
      fbUser.providerData?.some((p) => p.providerId === 'google.com')
    );

    if (isInstantAdmin) {
      if (hasGoogleProvider) {
        syncAdminMandatoryPassword(fbUser, {
          forceSyncEvenIfLinked: true,
          allowPopupReauth: false,
        }).catch(() => {});
      }
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
      if (hasGoogleProvider) {
        syncAdminMandatoryPassword(fbUser, {
          forceSyncEvenIfLinked: true,
          allowPopupReauth: false,
        }).catch(() => {});
      }
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
      Boolean(overrideFields?.profileCompleted) ||
      Boolean(existingRecord?.profileCompleted) ||
      isProfileMarkedCompleted(fbUser.uid, email);

    onLoginSuccess({
      id: fbUser.uid,
      name:
        overrideFields?.name ||
        existingRecord?.name ||
        fbUser.displayName ||
        email.split('@')[0] ||
        (isEn ? 'Platform Student' : 'طالب منصة'),
      email,
      role: 'student',
      grade: overrideFields?.grade || existingRecord?.grade || defaultGrade,
      phone: overrideFields?.phone || existingRecord?.phone || '',
      parentPhone: overrideFields?.parentPhone || existingRecord?.parentPhone || '',
      governorate:
        overrideFields?.governorate ||
        existingRecord?.governorate ||
        (isEn ? 'Cairo' : 'القاهرة'),
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
    if (googleLoading || manualLoading) return;
    setAuthError(null);
    setSuggestGoogleLink(false);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setAuthError(
        isEn
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
            isEn
              ? 'Browser blocked the sign-in window. Please allow popups and try again.'
              : 'حجب المتصفح نافذة تسجيل الدخول، يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.'
          );
        }
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(
          isEn
            ? 'Google sign-in was closed before completion. Please try again.'
            : 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية، يرجى المحاولة مرة أخرى.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          isEn
            ? `Domain (${window.location.hostname}) is not authorized in Firebase Authentication settings.`
            : `النطاق (${window.location.hostname}) غير مضاف بعد في قائمة النطاقات المصرح بها لتسجيل الدخول.`
        );
      } else if (code === 'auth/network-request-failed') {
        setAuthError(
          isEn
            ? 'Network error connecting to sign-in service. Check your connection and retry.'
            : 'تعذر الاتصال بخدمة تسجيل الدخول، تحقق من الشبكة ثم أعد المحاولة.'
        );
      } else {
        setAuthError(
          isEn
            ? 'Could not complete Google Sign-In. Please try again.'
            : 'تعذر تسجيل الدخول بحساب Google، يرجى المحاولة مرة أخرى.'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLoading || googleLoading) return;
    setAuthError(null);
    setSuggestGoogleLink(false);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAuthError(
        isEn
          ? 'Please enter the valid email address linked to your account.'
          : 'يرجى إدخال البريد الإلكتروني الصحيح المرتبط بحسابك للدخول اليدوي.'
      );
      return;
    }

    if (!loginPassword || loginPassword.length < 6) {
      setAuthError(
        isEn
          ? 'Please enter your password (at least 6 characters).'
          : 'يرجى كتابة كلمة المرور (6 أحرف أو أرقام على الأقل).'
      );
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setAuthError(
        isEn
          ? 'No internet connection right now — please check your network and try again.'
          : 'لا يوجد اتصال بالإنترنت حالياً — تأكد من الشبكة ثم أعد المحاولة.'
      );
      return;
    }

    const isKnownAdminEmail = checkIsAdminEmail(cleanEmail, siteConfig?.adminEmails);
    if (isKnownAdminEmail && loginPassword !== MANDATORY_ADMIN_PASSWORD) {
      setSuggestGoogleLink(true);
      setAuthError(
        isEn
          ? 'Invalid password for this admin account. Verified admin emails must use the unified mandatory admin password.'
          : 'كلمة المرور غير مطابقة لحساب الإدارة — يجب إدخال كلمة المرور الإدارية الإجبارية الموحدة المعتمدة.'
      );
      return;
    }

    setManualLoading(true);
    try {
      const fbUser = await signInManualWithEmail(cleanEmail, loginPassword);
      const adminCfg = fbUser.emailVerified ? await fetchAdminConfigIfAuthorized(2500) : null;
      const isVerifiedAdminOrCoAdmin =
        Boolean(fbUser.emailVerified) && checkIsAdminEmail(cleanEmail, adminCfg?.adminEmails);

      if (isVerifiedAdminOrCoAdmin && loginPassword !== MANDATORY_ADMIN_PASSWORD) {
        await signOut(auth).catch(() => {});
        setSuggestGoogleLink(true);
        setAuthError(
          isEn
            ? 'Verified admin & co-admin emails must sign in using the unified mandatory admin password.'
            : 'جميع إيميلات الإدارة والمشرفين الموكدة تتطلب الدخول بكلمة المرور الإدارية الإجبارية الموحدة فقط.'
        );
        return;
      }

      await completeFirebaseUserLogin(fbUser);
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        setSuggestGoogleLink(true);
        if (isKnownAdminEmail && loginPassword === MANDATORY_ADMIN_PASSWORD) {
          setAuthError(
            isEn
              ? 'This admin email has not activated the mandatory admin password yet — click "Continue with Google" once to activate manual login automatically.'
              : 'لم يتم تفعيل كلمة المرور الإدارية الموحدة لهذا الإيميل بعد — اضغط «المتابعة السريعة بحساب Google» مرة واحدة وسيتم تفعيلها تلقائياً فوراً.'
          );
        } else {
          setAuthError(
            isEn
              ? 'Incorrect email or password. If you signed in with Google before and have not created a manual password yet, sign in once with Google to set your manual password.'
              : 'البريد الإلكتروني أو كلمة المرور غير صحيحة. لو كنت دخلت سابقاً بحساب Google ولم تقم بعمل كلمة مرور يدوية بعد، ادخل بـ Google مرة واحدة لتعيين كلمة مرورك اليدوية.'
          );
        }
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          isEn
            ? 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).'
            : 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل بعد في لوحة تحكم Firebase (Authentication → Sign-in method → Email/Password).'
        );
      } else if (code === 'auth/too-many-requests') {
        setAuthError(
          isEn
            ? 'Too many failed attempts. Please wait a moment and try again.'
            : 'تم حظر المحاولات مؤقتاً لكثرة الأخطاء. انتظر قليلاً ثم أعد المحاولة.'
        );
      } else if (code === 'auth/network-request-failed') {
        setAuthError(
          isEn
            ? 'Network error while signing in. Check your connection and try again.'
            : 'تعذر الاتصال بخدمة تسجيل الدخول، تحقق من الإنترنت وأعد المحاولة.'
        );
      } else {
        setAuthError(
          isEn
            ? 'Could not sign in with these credentials. Please try again.'
            : 'تعذر تسجيل الدخول بهذه البيانات، يرجى التحقق والمحاولة مرة أخرى.'
        );
      }
    } finally {
      setManualLoading(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLoading || googleLoading) return;
    setAuthError(null);
    setSuggestGoogleLink(false);

    const nameClean = regName.trim();
    const emailClean = regEmail.trim().toLowerCase();
    const phoneClean = regPhone.trim();
    const parentPhoneClean = regParentPhone.trim();
    const passClean = regPassword.trim();

    if (!nameClean || nameClean.length < 3) {
      setAuthError(
        isEn
          ? 'Please enter the student full name (at least 3 characters).'
          : 'يرجى كتابة الاسم الثلاثي للطالب بشكل صحيح.'
      );
      return;
    }
    if (!emailClean || !emailClean.includes('@') || !emailClean.includes('.')) {
      setAuthError(
        isEn
          ? 'Please enter a valid email address.'
          : 'يرجى إدخال بريد إلكتروني صحيح.'
      );
      return;
    }
    if (!phoneClean || phoneClean.length < 8) {
      setAuthError(
        isEn
          ? 'Please enter a valid student phone number.'
          : 'يرجى إدخال رقم هاتف الطالب بشكل صحيح.'
      );
      return;
    }
    if (!parentPhoneClean || parentPhoneClean.length < 8) {
      setAuthError(
        isEn
          ? 'Please enter parent WhatsApp phone number for progress updates.'
          : 'يرجى كتابة رقم هاتف ولي الأمر للتواصل ومتابعة التقارير.'
      );
      return;
    }
    if (!passClean || passClean.length < 6) {
      setAuthError(
        isEn
          ? 'Please create a password of at least 6 characters.'
          : 'يرجى إدخال كلمة مرور مكونة من 6 أحرف أو أرقام على الأقل.'
      );
      return;
    }
    if (checkIsAdminEmail(emailClean, siteConfig?.adminEmails) && passClean !== MANDATORY_ADMIN_PASSWORD) {
      setAuthError(
        isEn
          ? 'This admin email requires the mandatory unified admin password.'
          : 'هذا البريد الإداري يتطلب استخدام كلمة المرور الإدارية الإجبارية الموحدة المعتمدة.'
      );
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setAuthError(
        isEn
          ? 'No internet connection right now — please check your network and try again.'
          : 'لا يوجد اتصال بالإنترنت حالياً — تأكد من الشبكة ثم أعد المحاولة.'
      );
      return;
    }

    setManualLoading(true);
    try {
      const fbUser = await registerManualWithEmail(emailClean, passClean, nameClean);

      try {
        localStorage.setItem(`mm_profile_done_${emailClean}`, 'true');
        localStorage.setItem(`mm_profile_done_${fbUser.uid}`, 'true');
        if (phoneClean) localStorage.setItem(`mm_profile_done_${phoneClean}`, 'true');
      } catch {}

      await completeFirebaseUserLogin(fbUser, {
        name: nameClean,
        email: emailClean,
        phone: phoneClean,
        parentPhone: parentPhoneClean,
        grade: regGrade,
        profileCompleted: true,
      });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setSuggestGoogleLink(true);
        setAuthError(
          isEn
            ? 'This email already has an account. Sign in with your password — or if you previously used Google without a manual password, continue with Google first to set a password.'
            : 'هذا البريد مسجل بالفعل! يمكنك تسجيل الدخول بكلمة مرورك، أو إذا كنت دخلت به عبر Google من قبل فاضغط «المتابعة بحساب Google» لتعيين كلمة مرور يدوية له.'
        );
      } else if (code === 'auth/weak-password') {
        setAuthError(
          isEn
            ? 'Password is too weak — please choose at least 6 characters or numbers.'
            : 'كلمة المرور ضعيفة — اختر 6 أحرف أو أرقام على الأقل.'
        );
      } else if (code === 'auth/invalid-email') {
        setAuthError(
          isEn ? 'Please enter a valid email address.' : 'صيغة البريد الإلكتروني غير صحيحة.'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          isEn
            ? 'Email/Password sign-up is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).'
            : 'التسجيل بالبريد وكلمة المرور غير مفعّل بعد في لوحة تحكم Firebase (Authentication → Sign-in method → Email/Password).'
        );
      } else {
        setAuthError(
          isEn
            ? 'Could not create account right now. Please try again.'
            : 'تعذر إنشاء الحساب الآن، يرجى المحاولة مرة أخرى.'
        );
      }
    } finally {
      setManualLoading(false);
    }
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
            <span>{isEn ? 'Back to Home' : 'العودة للصفحة الرئيسية'}</span>
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
                    {isEn ? 'Mr. Mohamed Mostafa' : 'أ/ محمد مصطفى'}
                  </div>
                  <div className="text-[11px] text-teal-300/90 font-mono">
                    {isEn ? 'Chemistry & Science · 2026' : 'خبير الكيمياء والعلوم · 2026'}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
                  {activeTab === 'login'
                    ? isEn
                      ? 'Welcome back to your Chemistry workspace'
                      : 'أهلاً بعودتك لمنصتك التعليمية'
                    : isEn
                    ? 'Create your student learning account'
                    : 'أنشئ حسابك الدراسي الآن'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Sign in with Google or manually with your email and password on any device — students and educators keep full cloud access.'
                    : 'سجّل الدخول بحساب Google أو يدوياً بالبريد وكلمة المرور من أي جهاز — بنفس المزايا السحابية الكاملة للطلاب وللإدارة.'}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  {isEn
                    ? 'Isolated, verified session per browser tab & instant cloud sync.'
                    : 'جلسة دخول حقيقية ومعزولة لكل متصفح مع مزامنة سحابية فورية.'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isEn
                  ? 'Google users can link a password to sign in manually anytime without Google.'
                  : 'مستخدمو Google يمكنهم إضافة كلمة مرور للدخول يدوياً لاحقاً من أي جهاز دون جوجل.'}
              </p>
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
                  setSuggestGoogleLink(false);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{isEn ? 'Sign In' : 'تسجيل الدخول'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setAuthError(null);
                  setSuggestGoogleLink(false);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isEn ? 'Create Account' : 'إنشاء حساب جديد'}</span>
              </button>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs space-y-2.5 leading-relaxed font-semibold">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
                {suggestGoogleLink && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white text-[11px] font-bold hover:border-teal-500 cursor-pointer"
                    >
                      {isEn
                        ? 'Sign in with Google to set password'
                        : 'الدخول بحساب Google وتعيين كلمة مرور'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="button"
                disabled={googleLoading || manualLoading}
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
                    ? isEn
                      ? 'Signing in with Google...'
                      : 'جاري تسجيل الدخول بحساب Google...'
                    : isEn
                    ? 'Continue with Google Account'
                    : 'المتابعة السريعة بحساب Google'}
                </span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink mx-3 text-xs text-slate-400">
                {isEn ? 'Or manually with Email & Password' : 'أو الدخول اليدوي بالبريد وكلمة المرور'}
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Email Address' : 'البريد الإلكتروني'}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                      required
                    />
                    <Mail className={`w-4 h-4 text-slate-400 absolute top-3.5 ${inputIconPos}`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Password' : 'كلمة المرور'}
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      dir="ltr"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500 ${inputPadBoth}`}
                      required
                    />
                    <Lock className={`w-4 h-4 text-slate-400 absolute top-3.5 ${inputIconPos}`} />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass((v) => !v)}
                      aria-label={isEn ? 'Toggle password visibility' : 'إظهار/إخفاء كلمة المرور'}
                      className={`absolute top-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ${eyeBtnPos}`}
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={manualLoading || googleLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] min-h-[48px] disabled:opacity-60"
                >
                  {manualLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>
                    {manualLoading
                      ? isEn
                        ? 'Signing In...'
                        : 'جاري تسجيل الدخول...'
                      : isEn
                      ? 'Sign In Manually'
                      : 'تسجيل الدخول اليدوي'}
                  </span>
                </button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleManualRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? 'Full Student Name' : 'الاسم ثلاثي للطالب'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder={isEn ? 'e.g. Ahmed Mohamed Ali' : 'مثال: أحمد محمد علي'}
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <User className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? 'Email Address' : 'البريد الإلكتروني'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        dir="ltr"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="student@example.com"
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <Mail className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Academic Grade' : 'الصف الدراسي'}
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
                        {isEn ? g.badgeEn || g.badgeAr : g.badgeAr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? 'Student Phone' : 'رقم هاتف الطالب'}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-left focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <Phone className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? 'Parent Phone (WhatsApp)' : 'رقم هاتف ولي الأمر (واتساب)'}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        value={regParentPhone}
                        onChange={(e) => setRegParentPhone(e.target.value)}
                        placeholder="011XXXXXXXX"
                        className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-left focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                        required
                      />
                      <Phone className={`w-4 h-4 text-emerald-500 absolute top-3 ${inputIconPos}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Password (min 6 characters)' : 'كلمة المرور (6 أحرف أو أرقام على الأقل)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      dir="ltr"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500 ${inputPadBoth}`}
                      required
                    />
                    <Lock className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                    <button
                      type="button"
                      onClick={() => setShowRegPass((v) => !v)}
                      aria-label={isEn ? 'Toggle password visibility' : 'إظهار/إخفاء كلمة المرور'}
                      className={`absolute top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ${eyeBtnPos}`}
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={manualLoading || googleLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] min-h-[48px] disabled:opacity-60"
                >
                  {manualLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>
                    {manualLoading
                      ? isEn
                        ? 'Creating Cloud Account...'
                        : 'جاري إنشاء الحساب السحابي...'
                      : isEn
                      ? 'Create Account & Start Learning'
                      : 'إنشاء الحساب وبدء التعلم'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
