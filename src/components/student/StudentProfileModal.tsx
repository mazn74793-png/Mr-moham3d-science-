import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Check,
  Sparkles,
  Atom,
  FlaskConical,
  Crown,
  Award,
  Flame,
  Camera,
  Loader2,
  Target,
  Palette,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { GradeLevel, UserProfile, CloudinaryConfig } from '../../types';
import { SiteConfig, getResolvedGrades, getGradeDisplayName } from '../../types/siteConfig';
import { uploadMediaFile } from '../../utils/uploader';

export type StudentCardThemeId = 'teal' | 'amber' | 'indigo' | 'emerald';
export type StudentAvatarIconId = 'atom' | 'flask' | 'crown' | 'award' | 'sparkles' | 'flame';

export interface StudentCustomProfile {
  titleBadge: string;
  studyGoal: string;
  targetScore: string;
  cardTheme: StudentCardThemeId;
  avatarIcon: StudentAvatarIconId;
}

export const DEFAULT_CUSTOM_PROFILE: StudentCustomProfile = {
  titleBadge: 'كيميائي المستقبل',
  studyGoal: 'الدرجة النهائية في الكيمياء بإذن الله',
  targetScore: '60 / 60',
  cardTheme: 'teal',
  avatarIcon: 'atom',
};

export const STUDENT_CARD_THEMES: Record<
  StudentCardThemeId,
  {
    label: string;
    cardBg: string;
    chipBg: string;
    accentText: string;
    dotColor: string;
  }
> = {
  teal: {
    label: 'فيروزي المختبر',
    cardBg: 'bg-gradient-to-bl from-teal-700 via-teal-800 to-slate-900',
    chipBg: 'bg-teal-400/20 text-teal-100 border-teal-300/30',
    accentText: 'text-teal-200',
    dotColor: 'bg-teal-500',
  },
  amber: {
    label: 'ذهبي التفوق',
    cardBg: 'bg-gradient-to-bl from-amber-600 via-amber-700 to-slate-900',
    chipBg: 'bg-amber-300/20 text-amber-100 border-amber-200/30',
    accentText: 'text-amber-200',
    dotColor: 'bg-amber-500',
  },
  indigo: {
    label: 'نيلي النخبة',
    cardBg: 'bg-gradient-to-bl from-indigo-700 via-indigo-800 to-slate-900',
    chipBg: 'bg-indigo-300/20 text-indigo-100 border-indigo-200/30',
    accentText: 'text-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  emerald: {
    label: 'زمردي التميز',
    cardBg: 'bg-gradient-to-bl from-emerald-700 via-emerald-800 to-slate-900',
    chipBg: 'bg-emerald-300/20 text-emerald-100 border-emerald-200/30',
    accentText: 'text-emerald-200',
    dotColor: 'bg-emerald-500',
  },
};

export function renderStudentAvatarIcon(iconId: StudentAvatarIconId, className = 'w-6 h-6') {
  switch (iconId) {
    case 'flask':
      return <FlaskConical className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'atom':
    default:
      return <Atom className={className} />;
  }
}

export function loadStudentCustomProfile(studentId?: string): StudentCustomProfile {
  if (!studentId) return DEFAULT_CUSTOM_PROFILE;
  try {
    const raw = localStorage.getItem(`mm_profile_custom_${studentId}`);
    if (!raw) return DEFAULT_CUSTOM_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      titleBadge: parsed.titleBadge || DEFAULT_CUSTOM_PROFILE.titleBadge,
      studyGoal: parsed.studyGoal || DEFAULT_CUSTOM_PROFILE.studyGoal,
      targetScore: parsed.targetScore || DEFAULT_CUSTOM_PROFILE.targetScore,
      cardTheme: STUDENT_CARD_THEMES[parsed.cardTheme as StudentCardThemeId]
        ? parsed.cardTheme
        : 'teal',
      avatarIcon: parsed.avatarIcon || 'atom',
    };
  } catch {
    return DEFAULT_CUSTOM_PROFILE;
  }
}

export function saveStudentCustomProfile(studentId: string, custom: StudentCustomProfile): void {
  try {
    localStorage.setItem(`mm_profile_custom_${studentId}`, JSON.stringify(custom));
  } catch {
    // ignore storage limits
  }
}

const TITLE_PRESETS = [
  'كيميائي المستقبل',
  'بطل العضوية',
  'دكتور 2026',
  'صائد الدرجات النهائية',
  'مهندس المعادلات',
  'نجم المنصة',
];

const AVATAR_ICON_OPTIONS: Array<{ id: StudentAvatarIconId; label: string }> = [
  { id: 'atom', label: 'ذرة' },
  { id: 'flask', label: 'مختبر' },
  { id: 'crown', label: 'تاج' },
  { id: 'award', label: 'وسام' },
  { id: 'sparkles', label: 'بريق' },
  { id: 'flame', label: 'شعلة' },
];

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
];

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  siteConfig?: SiteConfig;
  cloudinaryConfig?: CloudinaryConfig;
  completedLecturesCount: number;
  passedQuizzesCount: number;
  onSaveProfile: (updatedUser: UserProfile, customProfile: StudentCustomProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  siteConfig,
  cloudinaryConfig,
  completedLecturesCount,
  passedQuizzesCount,
  onSaveProfile,
}) => {
  const resolvedGrades = getResolvedGrades(siteConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [parentPhone, setParentPhone] = useState(currentUser.parentPhone || '');
  const [governorate, setGovernorate] = useState(currentUser.governorate || 'القاهرة');
  const [grade, setGrade] = useState<GradeLevel>(currentUser.grade || 'third');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [custom, setCustom] = useState<StudentCustomProfile>(() =>
    loadStudentCustomProfile(currentUser.id)
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'basic' | 'special'>('basic');

  useEffect(() => {
    if (!isOpen) return;
    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setParentPhone(currentUser.parentPhone || '');
    setGovernorate(currentUser.governorate || 'القاهرة');
    setGrade(currentUser.grade || 'third');
    setAvatarUrl(currentUser.avatarUrl || '');
    setCustom(loadStudentCustomProfile(currentUser.id));
    setErrorMsg(null);
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const theme = STUDENT_CARD_THEMES[custom.cardTheme] || STUDENT_CARD_THEMES.teal;
  const displayGradeName = getGradeDisplayName(grade, siteConfig, 'ar');

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPG / PNG).');
      return;
    }

    setErrorMsg(null);
    setUploadingPhoto(true);
    try {
      const res = await uploadMediaFile(file, {
        cloudName: cloudinaryConfig?.cloudName,
        uploadPreset: cloudinaryConfig?.uploadPreset,
        resourceType: 'image',
      });
      if (res.url && res.url.length <= 2000) {
        setAvatarUrl(res.url);
      } else {
        setErrorMsg('رابط الصورة طويل جداً، يرجى تجربة صورة أصغر.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر رفع الصورة الشخصية حالياً.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanParentPhone = parentPhone.trim();

    if (cleanName.length < 3 || cleanName.length > 200) {
      setActiveSection('basic');
      setErrorMsg('يرجى كتابة اسمك الكامل بشكل صحيح (3 أحرف على الأقل).');
      return;
    }

    if (cleanPhone && cleanPhone.length < 8) {
      setActiveSection('basic');
      setErrorMsg('يرجى التأكد من رقم هاتف الطالب أو تركه فارغاً.');
      return;
    }

    if (cleanPhone.length > 50 || cleanParentPhone.length > 50) {
      setActiveSection('basic');
      setErrorMsg('رقم الهاتف أطول من المسموح.');
      return;
    }

    const cleanCustom: StudentCustomProfile = {
      titleBadge: custom.titleBadge.trim() || DEFAULT_CUSTOM_PROFILE.titleBadge,
      studyGoal: custom.studyGoal.trim() || DEFAULT_CUSTOM_PROFILE.studyGoal,
      targetScore: custom.targetScore.trim() || DEFAULT_CUSTOM_PROFILE.targetScore,
      cardTheme: custom.cardTheme,
      avatarIcon: custom.avatarIcon,
    };

    saveStudentCustomProfile(currentUser.id, cleanCustom);

    const updatedUser: UserProfile = {
      ...currentUser,
      name: cleanName,
      phone: cleanPhone,
      parentPhone: cleanParentPhone,
      governorate,
      grade,
      avatarUrl: avatarUrl.trim(),
      profileCompleted: true,
    };

    onSaveProfile(updatedUser, cleanCustom);
    onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto font-cairo"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                ملفي الشخصي وبطاقتي المميزة
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                عدّل بياناتك الدراسية وخصّص هويتك في المنصة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الملف الشخصي"
            className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* LIVE SPECIAL STUDENT ID CARD PREVIEW */}
          <div
            className={`relative rounded-2xl p-4 sm:p-5 text-white shadow-lg overflow-hidden ${theme.cardBg}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar Photo or Selected Chemistry Emblem */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name || 'صورة الطالب'}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-slate-900"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
                      {renderStudentAvatarIcon(custom.avatarIcon, 'w-8 h-8 sm:w-10 sm:h-10 text-white')}
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-black/20 border-white/20">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span className="truncate">{custom.titleBadge || 'كيميائي المستقبل'}</span>
                  </div>

                  <h3 className="text-base sm:text-xl font-extrabold truncate">
                    {name.trim() || 'اسم الطالب'}
                  </h3>

                  <div className={`text-xs font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5 ${theme.accentText}`}>
                    <span>{displayGradeName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{governorate}</span>
                    {phone && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums" dir="ltr">
                          {phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Score & Live Stats */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/15 shrink-0">
                <div className="text-right sm:text-left">
                  <div className="text-[10px] text-white/75">الهدف في الكيمياء</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-amber-300">
                    {custom.targetScore || '60 / 60'}
                  </div>
                </div>
                <div className="text-[11px] text-white/85 font-mono tabular-nums">
                  {completedLecturesCount} حصة · {passedQuizzesCount} كويز · {currentUser.points ?? 0} نقطة
                </div>
              </div>
            </div>

            {custom.studyGoal && (
              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center gap-2 text-xs text-white/90">
                <Target className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">{custom.studyGoal}</span>
              </div>
            )}
          </div>

          {/* Section Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveSection('basic')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeSection === 'basic'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <User className="w-4 h-4" />
              <span>البيانات الأساسية والسنة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('special')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                activeSection === 'special'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>تخصيص مميز وهدفك</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeSection === 'basic' ? (
            <div className="space-y-4">
              {/* Profile Photo Controls */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">صورة حسابك الشخصية</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    ارفع صورتك أو استخدم شعار الكيمياء المفضل من تبويب التخصيص
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>{avatarUrl ? 'تغيير الصورة' : 'رفع صورة'}</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      aria-label="إزالة الصورة الشخصية"
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>الاسم الكامل</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك الثلاثي..."
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Academic Year / Grade Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  <span>اختر الصف / السنة الدراسية</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {resolvedGrades.map((g) => {
                    const selected = grade === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGrade(g.id)}
                        className={`p-3 rounded-xl border text-right transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          selected
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold truncate">{g.badgeAr}</div>
                          <div className="text-[11px] opacity-80 truncate">{g.titleAr}</div>
                        </div>
                        {selected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phones Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Phone className="w-4 h-4 text-teal-600" />
                    <span>رقم هاتف الطالب (واتساب)</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    maxLength={50}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-mono tabular-nums text-left text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>رقم هاتف ولي الأمر</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    maxLength={50}
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01198765432"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-mono tabular-nums text-left text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Governorate */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>المحافظة</span>
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom Title Badge */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>اختر لقبك المميز (يظهر في المنصة وبطاقتك)</span>
                </label>
                <input
                  type="text"
                  maxLength={32}
                  value={custom.titleBadge}
                  onChange={(e) => setCustom((prev) => ({ ...prev, titleBadge: e.target.value }))}
                  placeholder="مثال: كيميائي المستقبل"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TITLE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustom((prev) => ({ ...prev, titleBadge: preset }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        custom.titleBadge === preset
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Goal & Target Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Target className="w-4 h-4 text-teal-600" />
                    <span>شعارك أو هدفك الدراسي</span>
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={custom.studyGoal}
                    onChange={(e) => setCustom((prev) => ({ ...prev, studyGoal: e.target.value }))}
                    placeholder="مثال: حلمي كلية الطب و60/60 في الكيمياء"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>الدرجة المستهدفة</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={custom.targetScore}
                    onChange={(e) => setCustom((prev) => ({ ...prev, targetScore: e.target.value }))}
                    placeholder="60 / 60"
                    dir="ltr"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Card Theme Color Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Palette className="w-4 h-4 text-teal-600" />
                  <span>لون بطاقتك المميز</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(STUDENT_CARD_THEMES) as StudentCardThemeId[]).map((themeId) => {
                    const item = STUDENT_CARD_THEMES[themeId];
                    const selected = custom.cardTheme === themeId;
                    return (
                      <button
                        key={themeId}
                        type="button"
                        onClick={() => setCustom((prev) => ({ ...prev, cardTheme: themeId }))}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                          selected
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${item.dotColor}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chemistry Emblem Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Atom className="w-4 h-4 text-teal-600" />
                  <span>أيقونة الشعار الكيميائي</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_ICON_OPTIONS.map((opt) => {
                    const selected = custom.avatarIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCustom((prev) => ({ ...prev, avatarIcon: opt.id }))}
                        className={`min-h-[56px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
                          selected
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {renderStudentAvatarIcon(opt.id, 'w-5 h-5')}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Save / Cancel Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={uploadingPhoto}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
