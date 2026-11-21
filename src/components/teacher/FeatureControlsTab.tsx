import React, { useState } from 'react';
import {
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  KeyRound,
  Mail,
  Award,
  ShieldAlert,
  FileText,
  Ticket,
  Bell,
  MessageCircle,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Loader2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import {
  SiteConfig,
  PlatformFeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  getResolvedFeatureFlags,
} from '../../types/siteConfig';
import { useLanguage } from '../../context/LanguageContext';

interface FeatureControlsTabProps {
  siteConfig: SiteConfig;
  siteForm: SiteConfig;
  setSiteForm: React.Dispatch<React.SetStateAction<SiteConfig>>;
  onSaveSiteConfig: (newConfig: SiteConfig) => Promise<boolean> | boolean | void;
  pendingApprovalsCount?: number;
  onNavigateToStudents?: () => void;
}

interface FeatureToggleDefinition {
  key: keyof PlatformFeatureFlags;
  group: 'auth' | 'student' | 'system';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  onLabelAr: string;
  onLabelEn: string;
  offLabelAr: string;
  offLabelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'teal' | 'amber' | 'rose' | 'indigo' | 'emerald';
  isWarningWhenOn?: boolean;
}

const FEATURE_DEFINITIONS: FeatureToggleDefinition[] = [
  // Group 1: Registration & Auth Controls
  {
    key: 'requireStudentApproval',
    group: 'auth',
    titleAr: 'الانتظار حتى موافقة الأدمن على الطالب الجديد',
    titleEn: 'Require Admin Approval for New Students',
    descAr:
      'عند التفعيل، ينتظر الطالب الجديد مراجعة وقبول الإدارة قبل دخول المحاضرات والامتحانات. عند الإغلاق، يتم تفعيل حسابات الطلاب الجدد تلقائياً فور إكمال التسجيل (تظل الحسابات المرفوضة أو المحظورة مقيدة).',
    descEn:
      'When ON, new students wait in pending approval until accepted by admin. When OFF, new registrations enter automatically (explicitly rejected/blocked accounts remain restricted).',
    onLabelAr: 'مفعّل (بموافقة الأدمن)',
    onLabelEn: 'ON (Admin Approval Required)',
    offLabelAr: 'مغلق (دخول تلقائي فوري)',
    offLabelEn: 'OFF (Instant Auto-Entry)',
    icon: UserCheck,
    tone: 'amber',
  },
  {
    key: 'allowPublicRegistration',
    group: 'auth',
    titleAr: 'فتح إنشاء حسابات طلاب جديدة للزوار',
    titleEn: 'Allow Public Student Registration',
    descAr:
      'السماح للطلاب الجدد بإنشاء حسابات عبر المنصة. عند الإغلاق يقتصر الدخول على الطلاب المسجلين مسبقاً والمشرفين فقط.',
    descEn:
      'Allow visitors to create new student accounts. When OFF, only existing students and admins can sign in.',
    onLabelAr: 'التسجيل مفتوح',
    onLabelEn: 'Registration Open',
    offLabelAr: 'التسجيل مغلق',
    offLabelEn: 'Registration Closed',
    icon: UserPlus,
    tone: 'teal',
  },
  {
    key: 'allowGoogleAuth',
    group: 'auth',
    titleAr: 'تسجيل الدخول بحساب Google',
    titleEn: 'Google Sign-In Authentication',
    descAr:
      'إظهار وإتاحة زر المتابعة السريعة بحساب Google في صفحة تسجيل الدخول وإنشاء الحساب.',
    descEn: 'Show and permit quick Google OAuth login across sign-in and sign-up screens.',
    onLabelAr: 'مفعّل',
    onLabelEn: 'Enabled',
    offLabelAr: 'معطّل',
    offLabelEn: 'Disabled',
    icon: KeyRound,
    tone: 'indigo',
  },
  {
    key: 'allowManualEmailAuth',
    group: 'auth',
    titleAr: 'تسجيل الدخول بالبريد وكلمة المرور',
    titleEn: 'Manual Email & Password Login',
    descAr:
      'إظهار وإتاحة نموذج الدخول اليدوي بالبريد الإلكتروني وكلمة المرور وخيار استعادة كلمة المرور.',
    descEn: 'Show and permit manual email & password sign-in, registration, and password reset.',
    onLabelAr: 'مفعّل',
    onLabelEn: 'Enabled',
    offLabelAr: 'معطّل',
    offLabelEn: 'Disabled',
    icon: Mail,
    tone: 'teal',
  },

  // Group 2: Student Portal Modules
  {
    key: 'enableQuizzes',
    group: 'student',
    titleAr: 'نظام الامتحانات والاختبارات الإلكترونية',
    titleEn: 'Online Quizzes & Assessments',
    descAr:
      'تفعيل قسم الامتحانات والاختبارات المرتبطة بالمحاضرات في بوابة الطالب.',
    descEn: 'Enable the Quizzes tab, assessments, and lecture-linked exams inside Student Portal.',
    onLabelAr: 'مفعّل للطلاب',
    onLabelEn: 'Enabled',
    offLabelAr: 'مخفي ومغلق',
    offLabelEn: 'Disabled',
    icon: Award,
    tone: 'amber',
  },
  {
    key: 'enableExamAntiCheat',
    group: 'student',
    titleAr: 'نظام حماية الامتحانات ومراقبة الغش (Focus Mode)',
    titleEn: 'Exam Anti-Cheat & Focus Mode Shield',
    descAr:
      'المفتاح الرئيسي لمنع لقطات الشاشة، رصد مغادرة التبويب، وضع التركيز الكامل، وإرسال تنبيهات الغش الفورية للأدمن.',
    descEn:
      'Master switch for Focus Mode, screenshot/screen-recording blocking, tab-leave tracking, and instant admin cheat alerts.',
    onLabelAr: 'الحماية الصارمة مفعلة',
    onLabelEn: 'Strict Shield ON',
    offLabelAr: 'الحماية معطلة مؤقتاً',
    offLabelEn: 'Shield OFF',
    icon: ShieldAlert,
    tone: 'rose',
  },
  {
    key: 'enableHandouts',
    group: 'student',
    titleAr: 'قسم المذكرات والملفات (PDF)',
    titleEn: 'Handouts & PDF Files Library',
    descAr:
      'إظهار تبويب المذكرات والملازم وروابط ملفات الـ PDF المرفقة داخل المحاضرات.',
    descEn: 'Show the PDF Handouts tab and downloadable attachments attached to lectures.',
    onLabelAr: 'متاح للطلاب',
    onLabelEn: 'Enabled',
    offLabelAr: 'مغلق',
    offLabelEn: 'Disabled',
    icon: FileText,
    tone: 'teal',
  },
  {
    key: 'enablePointsSystem',
    group: 'student',
    titleAr: 'نظام النقاط والأكواد والمكافآت',
    titleEn: 'Points Wallet, Redeem Codes & Rewards',
    descAr:
      'عرض محفظة النقاط وشحن الأكواد ومتجر المكافآت وفتح المحاضرات بالنقاط لدى الطلاب.',
    descEn: 'Display student Points Wallet, voucher code redemption, and points-gated unlocks.',
    onLabelAr: 'مفعّل',
    onLabelEn: 'Enabled',
    offLabelAr: 'معطّل',
    offLabelEn: 'Disabled',
    icon: Ticket,
    tone: 'amber',
  },
  {
    key: 'enableNotifications',
    group: 'student',
    titleAr: 'إشعارات وتنبيهات المنصة الداخلية',
    titleEn: 'In-App Notifications & Announcements',
    descAr:
      'عرض جرس التنبيهات وتبويب الإعلانات والرسائل الإدارية داخل بوابة الطالب.',
    descEn: 'Display the notification bell and announcements feed inside Student Portal.',
    onLabelAr: 'مفعّل',
    onLabelEn: 'Enabled',
    offLabelAr: 'معطّل',
    offLabelEn: 'Disabled',
    icon: Bell,
    tone: 'indigo',
  },
  {
    key: 'enableWhatsAppSupport',
    group: 'student',
    titleAr: 'أزرار التواصل مع فريق الدعم على واتساب',
    titleEn: 'WhatsApp Support Buttons & Links',
    descAr:
      'إظهار أو إخفاء أزرار التواصل المباشر مع الدعم الفني عبر واتساب في التسجيل وبوابة الطالب.',
    descEn: 'Show or hide WhatsApp support team CTAs across registration, pending screen, and Student Portal.',
    onLabelAr: 'ظاهر للطلاب',
    onLabelEn: 'Visible',
    offLabelAr: 'مخفي',
    offLabelEn: 'Hidden',
    icon: MessageCircle,
    tone: 'emerald',
  },

  // Group 3: System Availability
  {
    key: 'maintenanceMode',
    group: 'system',
    titleAr: 'وضع الصيانة المؤقت لبوابة الطالب',
    titleEn: 'Student Portal Maintenance Mode',
    descAr:
      'إيقاف دخول الطلاب مؤقتاً وإظهار رسالة تحديث وصيانة أنيقة لهم، بينما تظل لوحة تحكم الأدمن متاحة بالكامل.',
    descEn:
      'Temporarily pause Student Portal access with a clean maintenance notice while Admin Dashboard stays fully accessible.',
    onLabelAr: 'وضع الصيانة نشط الآن',
    onLabelEn: 'Maintenance ACTIVE',
    offLabelAr: 'المنصة تعمل بشكل طبيعي',
    offLabelEn: 'Normal Operation',
    icon: Wrench,
    tone: 'rose',
    isWarningWhenOn: true,
  },
];

export const FeatureControlsTab: React.FC<FeatureControlsTabProps> = ({
  siteConfig,
  siteForm,
  setSiteForm,
  onSaveSiteConfig,
  pendingApprovalsCount = 0,
  onNavigateToStudents,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const flags = getResolvedFeatureFlags({ ...siteConfig, ...siteForm });

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const enabledStandardCount = FEATURE_DEFINITIONS.filter(
    (d) => !d.isWarningWhenOn && flags[d.key]
  ).length;
  const totalStandardCount = FEATURE_DEFINITIONS.filter((d) => !d.isWarningWhenOn).length;

  const persistFlags = async (
    nextFlags: PlatformFeatureFlags,
    keyLabel: string,
    successText: string
  ) => {
    const previousConfig = { ...siteForm };
    const nextConfig: SiteConfig = {
      ...siteConfig,
      ...siteForm,
      featureFlags: nextFlags,
    };

    setSiteForm(nextConfig);
    setSavingKey(keyLabel);
    setNotice(null);

    try {
      const ok = await onSaveSiteConfig(nextConfig);
      if (ok === false) {
        setSiteForm(previousConfig);
        setNotice({
          type: 'error',
          text: isEn
            ? 'Could not save toggle to cloud. Check permissions and internet connection.'
            : 'تعذر حفظ التغيير في السحابة. تأكد من صلاحيات الجلسة والإنترنت.',
        });
        return;
      }
      setNotice({ type: 'success', text: successText });
    } catch {
      setSiteForm(previousConfig);
      setNotice({
        type: 'error',
        text: isEn ? 'Failed to update setting.' : 'حدث خطأ أثناء تحديث الإعداد.',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggle = async (def: FeatureToggleDefinition) => {
    if (savingKey) return;
    const nextValue = !flags[def.key];

    // Safety guard: never allow disabling both Google Auth and Manual Email Auth at once
    if (def.key === 'allowGoogleAuth' && !nextValue && !flags.allowManualEmailAuth) {
      setNotice({
        type: 'error',
        text: isEn
          ? 'At least one sign-in method (Google or Email/Password) must remain enabled.'
          : 'يجب إبقاء طريقة تسجيل دخول واحدة على الأقل مفعلة (Google أو البريد وكلمة المرور) حتى لا يُغلق الدخول.',
      });
      return;
    }
    if (def.key === 'allowManualEmailAuth' && !nextValue && !flags.allowGoogleAuth) {
      setNotice({
        type: 'error',
        text: isEn
          ? 'At least one sign-in method (Google or Email/Password) must remain enabled.'
          : 'يجب إبقاء طريقة تسجيل دخول واحدة على الأقل مفعلة (Google أو البريد وكلمة المرور) حتى لا يُغلق الدخول.',
      });
      return;
    }

    const nextFlags: PlatformFeatureFlags = {
      ...flags,
      [def.key]: nextValue,
    };

    const actionText = nextValue
      ? isEn
        ? `Enabled: ${def.titleEn}`
        : `تم تفعيل: ${def.titleAr}`
      : isEn
      ? `Disabled: ${def.titleEn}`
      : `تم إغلاق: ${def.titleAr}`;

    await persistFlags(nextFlags, def.key, actionText);
  };

  const handleRestoreDefaults = async () => {
    if (savingKey) return;
    await persistFlags(
      { ...DEFAULT_FEATURE_FLAGS },
      'reset-defaults',
      isEn
        ? 'All feature controls restored to recommended defaults.'
        : 'تمت استعادة جميع إعدادات الوظائف إلى الوضع الافتراضي الموصى به.'
    );
  };

  const groups: Array<{
    id: 'auth' | 'student' | 'system';
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
  }> = [
    {
      id: 'auth',
      titleAr: 'التسجيل وقبول الطلاب وطرق الدخول',
      titleEn: 'Registration, Student Approval & Sign-In',
      subtitleAr: 'تحكم في انتظار موافقة الأدمن، فتح التسجيل الجديد، وطرق المصادقة المتاحة.',
      subtitleEn: 'Control admin approval gating, public signups, and authentication providers.',
    },
    {
      id: 'student',
      titleAr: 'أقسام ومميزات بوابة الطالب',
      titleEn: 'Student Portal Modules & Security',
      subtitleAr: 'تفعيل أو إغلاق التبويبات والأدوات التي تظهر داخل منصة الطالب بشكل فوري.',
      subtitleEn: 'Enable or hide specific tabs and capabilities inside Student Portal in real time.',
    },
    {
      id: 'system',
      titleAr: 'حالة المنصة والصيانة',
      titleEn: 'Platform Availability & Maintenance',
      subtitleAr: 'إيقاف الوصول الطلابي مؤقتاً عند إجراء صيانة أو تحديثات شاملة.',
      subtitleEn: 'Temporarily lock Student Portal during maintenance without affecting Admins.',
    },
  ];

  const getToneIconClasses = (tone: FeatureToggleDefinition['tone'], enabled: boolean, isWarning?: boolean) => {
    if (isWarning && enabled) {
      return 'bg-rose-600 text-white';
    }
    if (!enabled) {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-400';
    }
    switch (tone) {
      case 'amber':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400';
      case 'rose':
        return 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400';
      case 'indigo':
        return 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400';
      case 'emerald':
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isEn ? 'Live Platform Controls' : 'التحكم الفوري في وظائف المنصة'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-kufi text-slate-900 dark:text-white">
            {isEn ? 'Enable & Disable Platform Features' : 'تفعيل وإغلاق وظائف ومميزات المنصة'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            {isEn
              ? 'Every toggle saves directly to Firestore and updates live across all student & visitor screens without requiring page refresh.'
              : 'كل تغيير يُحفظ فوراً في السحابة وينعكس مباشرة على جميع الطلاب والزوار بدون الحاجة لإعادة تحميل الصفحة.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums">
            {isEn
              ? `${enabledStandardCount}/${totalStandardCount} Active`
              : `${enabledStandardCount}/${totalStandardCount} مفعّل`}
          </div>

          <button
            type="button"
            disabled={Boolean(savingKey)}
            onClick={handleRestoreDefaults}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {savingKey === 'reset-defaults' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="w-3.5 h-3.5" />
            )}
            <span>{isEn ? 'Restore Defaults' : 'استعادة الافتراضي'}</span>
          </button>
        </div>
      </div>

      {/* Live Save Status Banner */}
      {notice && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Maintenance Active Alert */}
      {flags.maintenanceMode && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold text-rose-900 dark:text-rose-100">
                {isEn
                  ? 'Maintenance Mode is currently ACTIVE for students'
                  : 'تنبيه: وضع الصيانة مفعّل حالياً للطلاب'}
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                {isEn
                  ? 'Students see a temporary maintenance screen when opening Student Portal. Disable it below when ready.'
                  : 'الطلاب يرون حالياً شاشة الصيانة المؤقتة عند فتح بوابة الطالب، بينما لوحة الأدمن تعمل بالكامل.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={Boolean(savingKey)}
            onClick={() =>
              persistFlags(
                { ...flags, maintenanceMode: false },
                'maintenanceMode',
                isEn ? 'Maintenance Mode turned OFF.' : 'تم إنهاء وضع الصيانة وعادت المنصة للعمل.'
              )
            }
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isEn ? 'Turn Off Maintenance' : 'إنهاء الصيانة الآن'}
          </button>
        </div>
      )}

      {/* Grouped Feature Toggles */}
      <div className="space-y-6">
        {groups.map((group) => {
          const items = FEATURE_DEFINITIONS.filter((d) => d.group === group.id);
          return (
            <section
              key={group.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold font-kufi text-slate-900 dark:text-white">
                  {isEn ? group.titleEn : group.titleAr}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn ? group.subtitleEn : group.subtitleAr}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {items.map((item) => {
                  const IconComp = item.icon;
                  const enabled = Boolean(flags[item.key]);
                  const isSavingThis = savingKey === item.key;
                  const activeWarning = Boolean(item.isWarningWhenOn && enabled);

                  return (
                    <div
                      key={item.key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 ${
                        activeWarning
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                          : enabled
                          ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                          : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 opacity-85'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${getToneIconClasses(
                              item.tone,
                              enabled,
                              item.isWarningWhenOn
                            )}`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                              {isEn ? item.titleEn : item.titleAr}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {isEn ? item.descEn : item.descAr}
                            </p>
                          </div>
                        </div>

                        {/* Accessible Switch Button */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={isEn ? item.titleEn : item.titleAr}
                          disabled={Boolean(savingKey)}
                          onClick={() => handleToggle(item)}
                          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer disabled:opacity-60 ${
                            activeWarning
                              ? 'bg-rose-600'
                              : enabled
                              ? 'bg-teal-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              enabled
                                ? isEn
                                  ? 'translate-x-6'
                                  : '-translate-x-6'
                                : isEn
                                ? 'translate-x-1'
                                : '-translate-x-1'
                            }`}
                          >
                            {isSavingThis && (
                              <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                            )}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/50">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            activeWarning
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                              : enabled
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {enabled
                              ? isEn
                                ? item.onLabelEn
                                : item.onLabelAr
                              : isEn
                              ? item.offLabelEn
                              : item.offLabelAr}
                          </span>
                        </span>

                        {item.key === 'requireStudentApproval' &&
                          pendingApprovalsCount > 0 &&
                          onNavigateToStudents && (
                            <button
                              type="button"
                              onClick={onNavigateToStudents}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              <Users className="w-3 h-3" />
                              <span>
                                {isEn
                                  ? `${pendingApprovalsCount} awaiting review`
                                  : `${pendingApprovalsCount} طلب بانتظار المراجعة`}
                              </span>
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
