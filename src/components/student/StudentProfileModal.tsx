import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Check,
  Sparkles,
  Atom,
  FlaskConical,
  Crown,
  Award,
  Flame,
  Camera,
  Loader2,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { GradeLevel, UserProfile, CloudinaryConfig } from '../../types';
import { SiteConfig, getResolvedGrades, getGradeDisplayName } from '../../types/siteConfig';
import { uploadMediaFile } from '../../utils/uploader';
import { useLanguage } from '../../context/LanguageContext';
import { auth } from '../../firebase';
import { LinkPasswordSetup } from '../LinkPasswordSetup';

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
  titleBadge: 'Honor Chemist',
  studyGoal: '60 / 60',
  targetScore: '60 / 60',
  cardTheme: 'teal',
  avatarIcon: 'atom',
};

export const STUDENT_CARD_THEMES: Record<
  StudentCardThemeId,
  {
    label: string;
    labelEn: string;
    cardBg: string;
    ringColor: string;
    accentText: string;
    dotColor: string;
  }
> = {
  teal: {
    label: 'فيروزي',
    labelEn: 'Obsidian Teal',
    cardBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950',
    ringColor: 'border-teal-500/30',
    accentText: 'text-teal-300',
    dotColor: 'bg-teal-500',
  },
  amber: {
    label: 'ذهبي',
    labelEn: 'Royal Gold',
    cardBg: 'bg-gradient-to-br from-slate-950 via-stone-900 to-amber-950',
    ringColor: 'border-amber-400/30',
    accentText: 'text-amber-300',
    dotColor: 'bg-amber-400',
  },
  indigo: {
    label: 'نيلي',
    labelEn: 'Midnight Indigo',
    cardBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950',
    ringColor: 'border-indigo-400/30',
    accentText: 'text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  emerald: {
    label: 'زمردي',
    labelEn: 'Deep Emerald',
    cardBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950',
    ringColor: 'border-emerald-400/30',
    accentText: 'text-emerald-300',
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

const AVATAR_ICON_OPTIONS: StudentAvatarIconId[] = [
  'atom',
  'flask',
  'crown',
  'award',
  'sparkles',
  'flame',
];

const EGYPT_GOVERNORATES: Array<{ ar: string; en: string }> = [
  { ar: 'القاهرة', en: 'Cairo' },
  { ar: 'الجيزة', en: 'Giza' },
  { ar: 'الإسكندرية', en: 'Alexandria' },
  { ar: 'القليوبية', en: 'Qalyubia' },
  { ar: 'الدقهلية', en: 'Dakahlia' },
  { ar: 'الشرقية', en: 'Sharqia' },
  { ar: 'الغربية', en: 'Gharbia' },
  { ar: 'المنوفية', en: 'Monufia' },
  { ar: 'البحيرة', en: 'Beheira' },
  { ar: 'كفر الشيخ', en: 'Kafr El Sheikh' },
  { ar: 'دمياط', en: 'Damietta' },
  { ar: 'بورسعيد', en: 'Port Said' },
  { ar: 'الإسماعيلية', en: 'Ismailia' },
  { ar: 'السويس', en: 'Suez' },
  { ar: 'الفيوم', en: 'Faiyum' },
  { ar: 'بني سويف', en: 'Beni Suef' },
  { ar: 'المنيا', en: 'Minya' },
  { ar: 'أسيوط', en: 'Asyut' },
  { ar: 'سوهاج', en: 'Sohag' },
  { ar: 'قنا', en: 'Qena' },
  { ar: 'الأقصر', en: 'Luxor' },
  { ar: 'أسوان', en: 'Aswan' },
  { ar: 'البحر الأحمر', en: 'Red Sea' },
  { ar: 'الوادي الجديد', en: 'New Valley' },
  { ar: 'مطروح', en: 'Matrouh' },
  { ar: 'شمال سيناء', en: 'North Sinai' },
  { ar: 'جنوب سيناء', en: 'South Sinai' },
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
  const { lang, isRtl } = useLanguage();
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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

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
    setSavedNotice(false);
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const theme = STUDENT_CARD_THEMES[custom.cardTheme] || STUDENT_CARD_THEMES.teal;
  const displayGradeName = getGradeDisplayName(grade, siteConfig, lang === 'en' ? 'en' : 'ar');
  const displayTitleBadge =
    custom.titleBadge === 'كيميائي المستقبل' && lang === 'en'
      ? 'Honor Chemist'
      : custom.titleBadge === 'Honor Chemist' && lang === 'ar'
      ? 'كيميائي المستقبل'
      : custom.titleBadge;

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg(
        lang === 'en' ? 'Please choose an image file (JPG / PNG).' : 'يرجى اختيار ملف صورة صالح.'
      );
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
        setErrorMsg(
          lang === 'en' ? 'Image link is too long. Try a smaller file.' : 'رابط الصورة طويل جداً.'
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || (lang === 'en' ? 'Photo upload failed.' : 'تعذر رفع الصورة حالياً.')
      );
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
      setErrorMsg(
        lang === 'en'
          ? 'Enter your full name (at least 3 characters).'
          : 'اكتب اسمك الكامل (3 أحرف على الأقل).'
      );
      return;
    }

    if (cleanPhone && cleanPhone.length < 8) {
      setErrorMsg(lang === 'en' ? 'Check student phone number.' : 'تأكد من رقم الهاتف.');
      return;
    }

    if (cleanPhone.length > 50 || cleanParentPhone.length > 50) {
      setErrorMsg(lang === 'en' ? 'Phone number is too long.' : 'رقم الهاتف طويل جداً.');
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
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2600);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6 animate-fade-in">
      {/* Minimal Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <BackIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>{lang === 'en' ? 'Back' : 'رجوع'}</span>
        </button>

        <span className="text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 font-mono">
          {lang === 'en' ? 'Student Profile' : 'الملف الشخصي'}
        </span>
      </div>

      {/* Luxury Two-Column Full-Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Obsidian Metallic Member Pass Card */}
        <div className="lg:col-span-5">
          <div
            className={`relative rounded-3xl p-6 sm:p-8 text-white shadow-xl border ${theme.ringColor} ${theme.cardBg} overflow-hidden space-y-7`}
          >
            {/* Subtle Metallic Radial Sheens */}
            <div
              className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-white/[0.04] blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Header Row: Brand Emblem + Custom Title Chip */}
            <div className="relative flex items-center justify-between gap-3">
              <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-white/50">
                MM ACADEMY · 2026
              </div>
              {displayTitleBadge && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold text-amber-300">
                  <Sparkles className="w-3 h-3" />
                  <span className="truncate max-w-[140px]">{displayTitleBadge}</span>
                </span>
              )}
            </div>

            {/* Center Identity: Squircle Avatar + Upload Control */}
            <div className="relative flex flex-col items-center text-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || 'Avatar'}
                    className="w-24 h-24 rounded-3xl object-cover border-2 border-white/25 shadow-lg bg-slate-900"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    {renderStudentAvatarIcon(custom.avatarIcon, 'w-10 h-10 text-white')}
                  </div>
                )}

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
                  aria-label={lang === 'en' ? 'Upload photo' : 'تغيير الصورة'}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    aria-label={lang === 'en' ? 'Remove photo' : 'حذف الصورة'}
                    className="absolute -bottom-2 -left-2 w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-rose-600 text-white border border-white/15 shadow-md flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1 min-w-0 max-w-full">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                  {name.trim() || (lang === 'en' ? 'Student Name' : 'اسم الطالب')}
                </h1>
                <p className={`text-xs font-semibold ${theme.accentText}`}>{displayGradeName}</p>
              </div>
            </div>

            {/* Minimal Hairline 3-Column Stats */}
            <div className="relative pt-5 border-t border-white/10 grid grid-cols-3 divide-x divide-white/10 rtl:divide-x-reverse text-center tabular-nums">
              <div className="px-2">
                <div className="text-lg sm:text-xl font-extrabold font-mono text-amber-300">
                  {currentUser.points ?? 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/55 mt-0.5">
                  {lang === 'en' ? 'Points' : 'النقاط'}
                </div>
              </div>
              <div className="px-2">
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white">
                  {completedLecturesCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/55 mt-0.5">
                  {lang === 'en' ? 'Watched' : 'الحصص'}
                </div>
              </div>
              <div className="px-2">
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white">
                  {passedQuizzesCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/55 mt-0.5">
                  {lang === 'en' ? 'Quizzes' : 'الامتحانات'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Airy Minimal Edit Form + Manual Password Security Card */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
          >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{lang === 'en' ? 'Profile saved.' : 'تم حفظ التعديلات.'}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'en' ? 'Full Name' : 'الاسم الكامل'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Academic Grade Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'en' ? 'Academic Year' : 'السنة الدراسية'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {resolvedGrades.map((g) => {
                const selected = grade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGrade(g.id)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400'
                    }`}
                  >
                    <span className="truncate">{lang === 'en' ? g.badgeEn || g.badgeAr : g.badgeAr}</span>
                    {selected && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phones + Governorate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'en' ? 'Student Phone' : 'هاتف الطالب'}
              </label>
              <input
                type="tel"
                dir="ltr"
                maxLength={50}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-mono tabular-nums text-left text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'en' ? 'Parent Phone' : 'هاتف ولي الأمر'}
              </label>
              <input
                type="tel"
                dir="ltr"
                maxLength={50}
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="011XXXXXXXX"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-mono tabular-nums text-left text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'en' ? 'Governorate' : 'المحافظة'}
            </label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov.ar} value={gov.ar}>
                  {lang === 'en' ? gov.en : gov.ar}
                </option>
              ))}
            </select>
          </div>

          {/* Sleek Collapsible Pass Customization */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCustomizeOpen((prev) => !prev)}
              className="w-full min-h-[42px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{lang === 'en' ? 'Personalize Pass' : 'تخصيص البطاقة'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {customizeOpen ? '−' : '+'}
              </span>
            </button>

            {customizeOpen && (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? 'Title Badge' : 'اللقب المميز'}
                    </label>
                    <input
                      type="text"
                      maxLength={28}
                      value={custom.titleBadge}
                      onChange={(e) => setCustom((prev) => ({ ...prev, titleBadge: e.target.value }))}
                      placeholder={lang === 'en' ? 'Honor Chemist' : 'كيميائي المستقبل'}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? 'Target Score' : 'الدرجة المستهدفة'}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      dir="ltr"
                      value={custom.targetScore}
                      onChange={(e) => setCustom((prev) => ({ ...prev, targetScore: e.target.value }))}
                      placeholder="60 / 60"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Metallic Accent Dots & Emblem Row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {(Object.keys(STUDENT_CARD_THEMES) as StudentCardThemeId[]).map((themeId) => {
                      const item = STUDENT_CARD_THEMES[themeId];
                      const selected = custom.cardTheme === themeId;
                      return (
                        <button
                          key={themeId}
                          type="button"
                          onClick={() => setCustom((prev) => ({ ...prev, cardTheme: themeId }))}
                          title={lang === 'en' ? item.labelEn : item.label}
                          aria-label={lang === 'en' ? item.labelEn : item.label}
                          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                            selected ? 'ring-2 ring-offset-2 ring-teal-500 dark:ring-offset-slate-900 scale-110' : ''
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full ${item.dotColor}`} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {AVATAR_ICON_OPTIONS.map((iconId) => {
                      const selected = custom.avatarIcon === iconId;
                      return (
                        <button
                          key={iconId}
                          type="button"
                          onClick={() => setCustom((prev) => ({ ...prev, avatarIcon: iconId }))}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                            selected
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal-400'
                          }`}
                        >
                          {renderStudentAvatarIcon(iconId, 'w-4 h-4')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {lang === 'en' ? 'Cancel' : 'إلغاء'}
            </button>
            <button
              type="submit"
              disabled={uploadingPhoto}
              className="min-h-[44px] px-7 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'en' ? 'Save Changes' : 'حفظ التعديلات'}</span>
            </button>
          </div>
          </form>

          {auth.currentUser && (
            <LinkPasswordSetup
              firebaseUser={auth.currentUser}
              variant="inline"
            />
          )}
        </div>
      </div>
    </div>
  );
};
