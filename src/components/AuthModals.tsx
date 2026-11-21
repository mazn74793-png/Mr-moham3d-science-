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
  MailCheck,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { UserProfile, GradeLevel } from '../types';
import { SiteConfig, getResolvedGrades, getResolvedFeatureFlags } from '../types/siteConfig';
import {
  auth,
  googleProvider,
  getStudentFromCloud,
  fetchAdminConfigIfAuthorized,
  signInManualWithEmail,
  registerManualWithEmail,
  resendVerificationEmail,
  reloadCurrentAuthUser,
  sendPasswordReset,
} from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { buildWhatsAppSupportUrl } from '../utils/whatsapp';

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

function withRaceTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

function withRejectTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        const err: any = new Error('AUTH_TIMEOUT');
        err.code = 'auth/network-request-failed';
        reject(err);
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(val);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          reject(err);
        }
      });
  });
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
  const featureFlags = getResolvedFeatureFlags(siteConfig);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() =>
    registerOpen && featureFlags.allowPublicRegistration ? 'register' : 'login'
  );

  useEffect(() => {
    if (registerOpen && featureFlags.allowPublicRegistration) {
      setActiveTab('register');
    } else if (loginOpen || !featureFlags.allowPublicRegistration) {
      setActiveTab('login');
    }
  }, [loginOpen, registerOpen, featureFlags.allowPublicRegistration]);

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
  const [pendingAdminVerification, setPendingAdminVerification] = useState<{ email: string } | null>(null);
  const [verificationStatusMsg, setVerificationStatusMsg] = useState<string | null>(null);
  const [sendingVerifyEmail, setSendingVerifyEmail] = useState(false);
  const [recheckingVerify, setRecheckingVerify] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  // Forgot Password + Human Verification state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNumA, setForgotNumA] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [forgotNumB, setForgotNumB] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForgotChallenge = () => {
    setForgotNumA(Math.floor(Math.random() * 8) + 2);
    setForgotNumB(Math.floor(Math.random() * 8) + 2);
    setForgotAnswer('');
  };

  const handleOpenForgotMode = () => {
    setForgotMode(true);
    setForgotEmail(loginEmail || '');
    setForgotStatus(null);
    resetForgotChallenge();
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setForgotStatus({
        type: 'error',
        text: isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح أولاً.',
      });
      return;
    }
    const expected = forgotNumA + forgotNumB;
    if (Number(forgotAnswer.trim()) !== expected) {
      setForgotStatus({
        type: 'error',
        text: isEn
          ? 'Human verification answer is incorrect. Please calculate again.'
          : 'إجابة التحقق الأمني غير صحيحة. يرجى كتابة ناتج الجمع بشكل صحيح.',
      });
      resetForgotChallenge();
      return;
    }

    setForgotLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setForgotStatus({
        type: 'success',
        text: isEn
          ? `Password reset link sent to ${cleanEmail}. Check your inbox (and Spam/Junk folder).`
          : `تم إرسال رابط استعادة كلمة المرور إلى (${cleanEmail}). راجع بريدك الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).`,
      });
      resetForgotChallenge();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setForgotStatus({
          type: 'error',
          text: isEn
            ? 'No manual account found for this email.'
            : 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.',
        });
      } else if (code === 'auth/too-many-requests') {
        setForgotStatus({
          type: 'error',
          text: isEn
            ? 'Too many requests. Please wait a few minutes before retrying.'
            : 'تم إرسال عدة طلبات متتالية، يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.',
        });
      } else {
        setForgotStatus({
          type: 'error',
          text: isEn
            ? 'Could not send reset email. Please verify your email or try signing in with Google.'
            : 'تعذر إرسال رسالة الاستعادة، تأكد من صحة البريد الإلكتروني أو جرب الدخول بحساب Google.',
        });
      }
    } finally {
      setForgotLoading(false);
    }
  };

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
      const savedRaw =
        localStorage.getItem('mm_registered_students') ||
        sessionStorage.getItem('mm_registered_students');
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

    const hasGoogleProvider = Boolean(
      fbUser.providerData?.some((p) => p.providerId === 'google.com')
    );

    const cachedAdminEmails = siteConfig?.adminEmails || ['mizoo2y2@gmail.com'];
    const isAdminEmailMatch =
      cleanEmail === 'mizoo2y2@gmail.com' ||
      cachedAdminEmails.some((e) => e.toLowerCase().trim() === cleanEmail);

    // Only reload auth user when an unverified admin is signing in manually (to check if they clicked their link)
    let activeUser = fbUser;
    if (!fbUser.emailVerified && !hasGoogleProvider && isAdminEmailMatch) {
      const reloaded = await withRaceTimeout(reloadCurrentAuthUser(), 1800, fbUser);
      if (reloaded) activeUser = reloaded;
    }

    if (isAdminEmailMatch && !activeUser.emailVerified && !hasGoogleProvider) {
      setPendingAdminVerification({ email: cleanEmail });
      setVerificationStatusMsg(null);
      setAuthError(null);
      return;
    }

    const isInstantAdmin =
      Boolean(activeUser.emailVerified || hasGoogleProvider) && isAdminEmailMatch;

    if (isInstantAdmin) {
      setPendingAdminVerification(null);
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

    // Fast bounded parallel lookup: check co-admin privileges (if verified) and student cloud doc simultaneously
    const isVerifiedOrGoogle = Boolean(activeUser.emailVerified || hasGoogleProvider);
    const [adminCfg, cloudRecord] = await Promise.all([
      isVerifiedOrGoogle
        ? withRaceTimeout(fetchAdminConfigIfAuthorized(2500), 2600, null)
        : Promise.resolve(null),
      withRaceTimeout(
        getStudentFromCloud(fbUser.uid, 2000).catch(() => null),
        2100,
        null
      ),
    ]);

    const isAdmin =
      isVerifiedOrGoogle && checkIsAdminEmail(email, adminCfg?.adminEmails);

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

    if (
      !existingRecord &&
      !overrideFields?.profileCompleted &&
      !featureFlags.allowPublicRegistration
    ) {
      signOut(auth).catch(() => {});
      setAuthError(
        isEn
          ? 'New student registration is currently closed by the administrator. Please contact support for assistance.'
          : 'إنشاء حسابات طلاب جديدة مغلق حالياً من قِبل الإدارة. يمكنك التواصل مع فريق الدعم للمساعدة.'
      );
      return;
    }

    const isCompleted =
      Boolean(overrideFields?.profileCompleted) ||
      Boolean(existingRecord?.profileCompleted) ||
      isProfileMarkedCompleted(fbUser.uid, email);

    const resolvedApprovalStatus: UserProfile['approvalStatus'] =
      overrideFields?.approvalStatus ||
      cloudRecord?.approvalStatus ||
      existingRecord?.approvalStatus ||
      (cloudRecord?.profileCompleted || !featureFlags.requireStudentApproval
        ? 'approved'
        : 'pending');

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
      approvalStatus: resolvedApprovalStatus,
      watchedLectureIds: existingRecord?.watchedLectureIds || [],
      passedQuizIds: existingRecord?.passedQuizIds || [],
      quizScores: existingRecord?.quizScores || {},
      joinedAt: existingRecord?.joinedAt || new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const handleResendAdminVerify = async () => {
    if (sendingVerifyEmail) return;
    setSendingVerifyEmail(true);
    setVerificationStatusMsg(null);
    try {
      await resendVerificationEmail();
      setVerificationStatusMsg(
        isEn
          ? `Verification link sent to ${pendingAdminVerification?.email}. Open it, then click "Email Verified — Enter Dashboard".`
          : `تم إرسال رابط التفعيل إلى ${pendingAdminVerification?.email}. افتح الرابط في بريدك ثم اضغط «تم تأكيد البريد — دخول الآن».`
      );
    } catch {
      setVerificationStatusMsg(
        isEn
          ? 'Could not send email right now. Wait a moment or sign in with Google once for instant activation.'
          : 'تعذر إرسال الرسالة حالياً. انتظر دقيقة أو اضغط «المتابعة بحساب Google» للدخول والتفعيل الفوري.'
      );
    } finally {
      setSendingVerifyEmail(false);
    }
  };

  const handleRecheckAdminVerify = async () => {
    if (recheckingVerify) return;
    setRecheckingVerify(true);
    setVerificationStatusMsg(null);
    try {
      const updated = await reloadCurrentAuthUser();
      if (updated) {
        await updated.getIdToken(true);
        if (updated.emailVerified) {
          setPendingAdminVerification(null);
          await completeFirebaseUserLogin(updated);
          return;
        }
      }
      setVerificationStatusMsg(
        isEn
          ? 'Email is still unverified. Click the link inside your inbox first or use Google Sign-In.'
          : 'البريد ما زال غير مؤكد حتى الآن — افتح رسالة التأكيد في بريدك أولاً أو ادخل بحساب Google للتفعيل الفوري.'
      );
    } finally {
      setRecheckingVerify(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading || manualLoading) return;
    setAuthError(null);
    setSuggestGoogleLink(false);
    setPendingAdminVerification(null);

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

    setManualLoading(true);
    try {
      const fbUser = await withRejectTimeout(
        signInManualWithEmail(cleanEmail, loginPassword),
        15000
      );
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
        setAuthError(
          isEn
            ? 'Incorrect email or password. If you signed in with Google before and have not created a manual password yet, sign in once with Google to set your manual password.'
            : 'البريد الإلكتروني أو كلمة المرور غير صحيحة. لو كنت دخلت سابقاً بحساب Google ولم تقم بعمل كلمة مرور يدوية بعد، ادخل بـ Google مرة واحدة لتعيين كلمة مرورك اليدوية.'
        );
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
    if (!featureFlags.allowPublicRegistration) {
      setAuthError(
        isEn
          ? 'New student registration is currently closed by the administrator.'
          : 'إنشاء الحسابات الجديدة مغلق حالياً من قِبل الإدارة.'
      );
      return;
    }

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
      const fbUser = await withRejectTimeout(
        registerManualWithEmail(emailClean, passClean, nameClean),
        15000
      );

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
        approvalStatus: featureFlags.requireStudentApproval ? 'pending' : 'approved',
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

            <div className="pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  {featureFlags.requireStudentApproval
                    ? isEn
                      ? 'New student accounts require admin approval after signup.'
                      : 'تخضع الحسابات الجديدة لمراجعة وتفعيل الإدارة فور التسجيل.'
                    : isEn
                    ? 'New student accounts activate automatically right after signup.'
                    : 'يتم تفعيل حسابات الطلاب الجدد تلقائياً فور التسجيل.'}
                </span>
              </div>
              {featureFlags.enableWhatsAppSupport && (
                <>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isEn
                      ? 'Need help registering or activating your account? Contact our WhatsApp support team.'
                      : 'تحتاج مساعدة في التسجيل أو تفعيل حسابك؟ تواصل مباشرة مع فريق الدعم على واتساب.'}
                  </p>
                  <a
                    href={buildWhatsAppSupportUrl(
                      siteConfig,
                      isEn
                        ? 'Hello Support Team, I need help with my student account on the platform.'
                        : 'السلام عليكم، أحتاج مساعدة من فريق الدعم بخصوص حسابي على المنصة.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isEn ? 'WhatsApp Support Team' : 'تواصل مع فريق الدعم على واتساب'}
                    </span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Interactive Authentication Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
            {featureFlags.allowPublicRegistration ? (
              <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setAuthError(null);
                    setSuggestGoogleLink(false);
                    setPendingAdminVerification(null);
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
                    setPendingAdminVerification(null);
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
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isEn
                    ? 'New account registration is currently closed. Existing students & admins can sign in below.'
                    : 'إنشاء الحسابات الجديدة مغلق حالياً من الإدارة — متاح تسجيل الدخول للطلاب المسجلين والمشرفين.'}
                </span>
              </div>
            )}

            {pendingAdminVerification && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-xs space-y-3">
                <div className="flex items-start gap-2.5 font-bold">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold font-kufi">
                      {isEn
                        ? 'Admin Email Verification Required'
                        : 'تفعيل بريد الإدارة مطلوب لفتح لوحة التحكم'}
                    </div>
                    <p className="font-normal leading-relaxed">
                      {isEn
                        ? `You signed in manually with (${pendingAdminVerification.email}), but email ownership isn't verified yet. Cloud security rules require a verified email before opening Admin Dashboard — verify via link or sign in once with Google.`
                        : `تم التعرف على بريد الإدارة (${pendingAdminVerification.email})، لكن الحساب اليدوي غير مؤكد بالبريد الإلكتروني بعد. قواعد الأمان السحابية تشترط تأكيد البريد لفتح لوحة التحكم وتعديل البيانات.`}
                    </p>
                  </div>
                </div>

                {verificationStatusMsg && (
                  <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl">
                    {verificationStatusMsg}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={sendingVerifyEmail}
                    onClick={handleResendAdminVerify}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <MailCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {sendingVerifyEmail
                        ? isEn
                          ? 'Sending...'
                          : 'جاري الإرسال...'
                        : isEn
                        ? 'Send Verification Link'
                        : 'إرسال رابط التفعيل لبريدي'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={recheckingVerify}
                    onClick={handleRecheckAdminVerify}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${recheckingVerify ? 'animate-spin' : ''}`} />
                    <span>
                      {recheckingVerify
                        ? isEn
                          ? 'Checking...'
                          : 'جاري الفحص...'
                        : isEn
                        ? 'Email Verified — Enter Dashboard'
                        : 'تم تأكيد البريد — دخول الآن'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={handleGoogleLogin}
                    className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isEn ? 'Continue with Google (Instant)' : 'المتابعة بحساب Google (تفعيل فوري)'}
                  </button>
                </div>
              </div>
            )}

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

            {(featureFlags.allowGoogleAuth || !featureFlags.allowManualEmailAuth) && (
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
            )}

            {(featureFlags.allowGoogleAuth || !featureFlags.allowManualEmailAuth) &&
              featureFlags.allowManualEmailAuth && (
                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="shrink mx-3 text-xs text-slate-400">
                    {isEn ? 'Or manually with Email & Password' : 'أو الدخول اليدوي بالبريد وكلمة المرور'}
                  </span>
                  <div className="grow border-t border-slate-200 dark:border-slate-800" />
                </div>
              )}

            {featureFlags.allowManualEmailAuth && activeTab === 'login' && !forgotMode && (
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
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? 'Password' : 'كلمة المرور'}
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenForgotMode}
                      className="text-[11px] sm:text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      {isEn ? 'Forgot Password?' : 'نسيت كلمة المرور؟'}
                    </button>
                  </div>
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

            {featureFlags.allowManualEmailAuth && activeTab === 'login' && forgotMode && (
              <form
                onSubmit={handleSendPasswordReset}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-teal-200 dark:border-teal-800 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isEn ? 'Reset Password Verification' : 'استعادة كلمة المرور بعد التحقق'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setForgotStatus(null);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isEn ? 'Back to Sign In' : 'رجوع للدخول'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Enter your registered email and solve the security check below to receive a password reset link.'
                    : 'أدخل بريدك الإلكتروني المسجل وأكمل التحقق الأمني التالي لإرسال رابط تعيين كلمة مرور جديدة على بريدك.'}
                </p>

                {forgotStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                      forgotStatus.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {forgotStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{forgotStatus.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Registered Email' : 'البريد الإلكتروني المسجل'}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500 ${inputPad}`}
                      required
                    />
                    <Mail className={`w-4 h-4 text-slate-400 absolute top-3 ${inputIconPos}`} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>
                        {isEn ? 'Human Check: What is' : 'تحقق أمني: ما ناتج'} ({forgotNumA} + {forgotNumB})؟
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={resetForgotChallenge}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isEn ? 'New' : 'تغيير'}</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={forgotAnswer}
                    onChange={(e) => setForgotAnswer(e.target.value)}
                    placeholder={isEn ? 'Enter the sum...' : 'اكتب الناتج بالأرقام هنا...'}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-center focus:outline-hidden focus:border-teal-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px] disabled:opacity-60"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MailCheck className="w-4 h-4" />
                  )}
                  <span>
                    {forgotLoading
                      ? isEn
                        ? 'Sending Reset Link...'
                        : 'جاري التحقق والإرسال...'
                      : isEn
                      ? 'Verify & Send Reset Link'
                      : 'تحقق وإرسال رابط الاستعادة'}
                  </span>
                </button>
              </form>
            )}

            {featureFlags.allowManualEmailAuth &&
              featureFlags.allowPublicRegistration &&
              activeTab === 'register' && (
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
