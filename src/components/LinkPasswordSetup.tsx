import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  hasPasswordLinked,
  linkPasswordToCurrentUser,
  MANDATORY_ADMIN_PASSWORD,
} from '../firebase';
import { useLanguage } from '../context/LanguageContext';

interface LinkPasswordSetupProps {
  firebaseUser: FirebaseUser | null;
  isAdminAccount?: boolean;
  variant?: 'page' | 'inline';
  onLinkedSuccess?: (updatedUser: FirebaseUser) => void;
  onSkip?: () => void;
}

export const LinkPasswordSetup: React.FC<LinkPasswordSetupProps> = ({
  firebaseUser,
  isAdminAccount = false,
  variant = 'page',
  onLinkedSuccess,
  onSkip,
}) => {
  const { lang, isRtl } = useLanguage();
  const isEn = lang === 'en';
  const alreadyLinked = hasPasswordLinked(firebaseUser);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [copiedAdminPass, setCopiedAdminPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!firebaseUser || !firebaseUser.email) return null;

  const ContinueIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleCopyAdminPassword = async () => {
    try {
      await navigator.clipboard.writeText(MANDATORY_ADMIN_PASSWORD);
      setCopiedAdminPass(true);
      setTimeout(() => setCopiedAdminPass(false), 2000);
    } catch {}
  };

  const handleSyncMandatoryAdminPassword = async () => {
    if (busy) return;
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const updatedUser = await linkPasswordToCurrentUser(MANDATORY_ADMIN_PASSWORD, {
        allowPopupReauth: true,
      });
      setSuccessMsg(
        isEn
          ? `Unified mandatory admin password (${MANDATORY_ADMIN_PASSWORD}) synced and active! You can now sign in manually anytime.`
          : `تم تفعيل وتوحيد كلمة المرور الإدارية الإجبارية (${MANDATORY_ADMIN_PASSWORD}) بنجاح! يمكنك الدخول يدوياً الآن من أي جهاز.`
      );
      onLinkedSuccess?.(updatedUser);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError(
          isEn
            ? 'Email/Password sign-in provider must be enabled in Firebase Console → Authentication → Sign-in method.'
            : 'يجب تفعيل خيار البريد وكلمة المرور (Email/Password) من لوحة تحكم Firebase → Authentication → Sign-in method.'
        );
      } else if (code === 'auth/requires-recent-login') {
        setError(
          isEn
            ? 'Please approve the Google verification popup or sign out and back in once with Google to apply the unified password.'
            : 'يرجى تأكيد نافذة التحقق من Google أو تسجيل الخروج والدخول مرة أخرى بحساب Google لتثبيت كلمة المرور.'
        );
      } else {
        setError(
          isEn
            ? 'Could not sync mandatory admin password right now. Check your connection and try again.'
            : 'تعذر تفعيل كلمة المرور الإدارية الآن، تأكد من الاتصال وحاول مرة أخرى.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminAccount) {
      await handleSyncMandatoryAdminPassword();
      return;
    }
    if (busy) return;
    setError(null);
    setSuccessMsg(null);

    const cleanPass = password.trim();
    if (cleanPass.length < 6) {
      setError(
        isEn
          ? 'Please enter a password of at least 6 characters.'
          : 'يرجى كتابة كلمة مرور مكونة من 6 أحرف أو أرقام على الأقل.'
      );
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setError(
        isEn
          ? 'Password confirmation does not match.'
          : 'كلمتا المرور غير متطابقتين، يرجى التأكد والمحاولة مرة أخرى.'
      );
      return;
    }

    setBusy(true);
    try {
      const updatedUser = await linkPasswordToCurrentUser(cleanPass, {
        allowPopupReauth: true,
      });
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg(
        isEn
          ? 'Manual password saved! You can now sign in manually anytime with this email and password.'
          : 'تم ربط كلمة المرور بنجاح! يمكنك الآن الدخول يدوياً بالبريد وكلمة المرور في أي وقت بدون جوجل.'
      );
      onLinkedSuccess?.(updatedUser);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/weak-password') {
        setError(
          isEn
            ? 'Password is too weak — please choose at least 6 characters.'
            : 'كلمة المرور ضعيفة جداً — اختر 6 أحرف أو أرقام على الأقل.'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setError(
          isEn
            ? 'Email/Password sign-in provider must be enabled in Firebase Console → Authentication → Sign-in method.'
            : 'يجب تفعيل خيار البريد وكلمة المرور (Email/Password) من لوحة تحكم Firebase → Authentication → Sign-in method.'
        );
      } else if (code === 'auth/requires-recent-login') {
        setError(
          isEn
            ? 'For your security, please sign out and sign back in with Google once, then set your password.'
            : 'لأمان حسابك، يرجى تسجيل الخروج والدخول بجوجل مرة أخرى ثم تعيين كلمة المرور.'
        );
      } else {
        setError(
          isEn
            ? 'Could not link password right now. Check your internet connection and try again.'
            : 'تعذر ربط كلمة المرور الآن، تأكد من الاتصال وحاول مرة أخرى.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                alreadyLinked
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {isAdminAccount
                  ? alreadyLinked
                    ? isEn
                      ? 'Unified Mandatory Admin Password Active'
                      : 'الدخول اليدوي للإدارة مفعّل بكلمة المرور الموحدة'
                    : isEn
                    ? 'Activate Mandatory Admin Manual Password'
                    : 'تفعيل الدخول اليدوي بالباسورد الإداري الإجباري'
                  : alreadyLinked
                  ? isEn
                    ? 'Manual Sign-In Password Active'
                    : 'الدخول اليدوي بكلمة المرور مفعّل'
                  : isEn
                  ? 'Set Password for Manual Sign-In'
                  : 'عيّن كلمة مرور للدخول اليدوي بدون جوجل'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                {firebaseUser.email}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold self-start sm:self-auto ${
              alreadyLinked
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
            }`}
          >
            {alreadyLinked
              ? isEn
                ? 'Linked ✓'
                : 'مربوط وجاهز ✓'
              : isEn
              ? 'Not Set Yet'
              : 'لم تُضف بعد'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {isAdminAccount
            ? isEn
              ? `All verified admin & co-admin emails share the unified mandatory manual sign-in password (${MANDATORY_ADMIN_PASSWORD}). Click below to activate or force-sync your account to use it immediately.`
              : `جميع حسابات الإدارة والمشرفين المعتمدين تعمل إجبارياً بكلمة المرور الإدارية الموحدة (${MANDATORY_ADMIN_PASSWORD}) عند الدخول اليدوي. اضغط الزر أدناه لتفعيلها أو توحيدها فوراً لحسابك الحالي.`
            : alreadyLinked
            ? isEn
              ? 'You can sign in manually anytime using your email and password on any device, keeping full access.'
              : 'يمكنك تسجيل الدخول يدوياً في أي وقت بهذا البريد وكلمة المرور من أي جهاز بكامل الصلاحيات. يمكنك تحديث كلمة المرور أدناه إذا رغبت.'
            : isEn
            ? 'You signed in with Google. Add a password now so you can also sign in manually with Email & Password from any device without Google.'
            : 'حسابك مسجل بجوجل. أضف كلمة مرور الآن علشان تقدر تدخل يدوياً بالإيميل والباسورد بعد كده من أي جهاز من غير جوجل.'}
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {isAdminAccount ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/30">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isEn ? 'Mandatory Admin Password:' : 'كلمة المرور الإدارية الموحدة:'}
              </span>
              <code
                dir="ltr"
                className="px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono text-xs font-extrabold select-all"
              >
                {MANDATORY_ADMIN_PASSWORD}
              </code>
              <button
                type="button"
                onClick={handleCopyAdminPassword}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 cursor-pointer"
                title={isEn ? 'Copy password' : 'نسخ كلمة المرور'}
              >
                {copiedAdminPass ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSyncMandatoryAdminPassword}
              disabled={busy}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>
                {busy
                  ? isEn
                    ? 'Syncing...'
                    : 'جاري التوحيد...'
                  : alreadyLinked
                  ? isEn
                    ? `Enforce & Sync (${MANDATORY_ADMIN_PASSWORD})`
                    : `توحيد وتأكيد (${MANDATORY_ADMIN_PASSWORD})`
                  : isEn
                  ? `Activate (${MANDATORY_ADMIN_PASSWORD})`
                  : `تفعيل الدخول اليدوي (${MANDATORY_ADMIN_PASSWORD})`}
              </span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {alreadyLinked
                  ? isEn
                    ? 'New Password'
                    : 'كلمة المرور الجديدة'
                  : isEn
                  ? 'Password (min 6 chars)'
                  : 'كلمة المرور (6+ أحرف)'}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[42px] px-3 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-left focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={isEn ? 'Show password' : 'إظهار كلمة المرور'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isEn ? 'Confirm Password' : 'تأكيد كلمة المرور'}
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-left focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>
                {busy
                  ? isEn
                    ? 'Saving...'
                    : 'جاري الحفظ...'
                  : alreadyLinked
                  ? isEn
                    ? 'Update Password'
                    : 'تحديث كلمة المرور'
                  : isEn
                  ? 'Enable Manual Login'
                  : 'حفظ وتفعيل اليدوي'}
              </span>
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col justify-center"
    >
      <div className="max-w-2xl mx-auto w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Top Accent Banner */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-7 sm:p-9 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isAdminAccount
                ? isEn
                  ? 'Mandatory Admin Password Sync'
                  : 'تفعيل الباسورد الإداري الموحد'
                : isEn
                ? 'Manual Sign-In Setup'
                : 'إعداد الدخول اليدوي لحسابك'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
            {isAdminAccount
              ? isEn
                ? 'Activate unified mandatory admin password'
                : 'تفعيل الدخول اليدوي بكلمة المرور الإدارية الموحدة'
              : isEn
              ? 'Add a password to sign in manually anytime'
              : 'أضف كلمة مرور علشان لو حبيت تدخل يدوي بعد كده'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isAdminAccount
              ? isEn
                ? `Verified admin & co-admin accounts require the unified password (${MANDATORY_ADMIN_PASSWORD}) for manual sign-in. Click below once to activate it on your account.`
                : `جميع إيميلات الإدارة والمشرفين الموكدة تستخدم كلمة المرور الموحدة (${MANDATORY_ADMIN_PASSWORD}) إجبارياً للدخول اليدوي. اضغط الزر أدناه مرة واحدة لتفعيلها الآن.`
              : isEn
              ? 'You signed in using Google. Set a password now so if you ever want to log in manually with Email & Password on another device without Google, your account is ready right away.'
              : 'لقد سجلت الدخول بحساب Google بنجاح! أضف كلمة مرور الآن لتتمكن من تسجيل الدخول يدوياً بنفس البريد الإلكتروني وكلمة المرور لاحقاً من أي جهاز دون الحاجة لحساب Google.'}
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-mono text-teal-200" dir="ltr">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{firebaseUser.email}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-9 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isAdminAccount ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isEn ? 'Unified Mandatory Admin Password' : 'كلمة المرور الإدارية الإجبارية'}
                </div>
                <div className="text-lg font-mono font-extrabold text-teal-600 dark:text-teal-400 mt-1" dir="ltr">
                  {MANDATORY_ADMIN_PASSWORD}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyAdminPassword}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedAdminPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAdminPass ? (isEn ? 'Copied' : 'تم النسخ') : isEn ? 'Copy' : 'نسخ'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Choose a Password (min 6 chars)' : 'كلمة المرور (6 أحرف أو أرقام على الأقل)'}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[46px] px-4 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={isEn ? 'Toggle password' : 'إظهار كلمة المرور'}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Confirm Password' : 'تأكيد كلمة المرور'}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[46px] px-4 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-left focus:outline-hidden focus:border-teal-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={busy}
                className="min-h-[46px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isEn ? 'Skip for now (set later in settings)' : 'تخطي الآن (تعيينها لاحقاً من الحساب)'}
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className="min-h-[46px] px-7 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>
                {busy
                  ? isEn
                    ? 'Linking Password...'
                    : 'جاري حفظ كلمة المرور...'
                  : isAdminAccount
                  ? isEn
                    ? `Activate (${MANDATORY_ADMIN_PASSWORD}) & Continue`
                    : `تفعيل (${MANDATORY_ADMIN_PASSWORD}) والمتابعة`
                  : isEn
                  ? 'Save Password & Continue'
                  : 'حفظ كلمة المرور والمتابعة'}
              </span>
              {!busy && <ContinueIcon className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
