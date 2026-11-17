import React, { useState } from 'react';
import {
  User,
  Phone,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import { GradeLevel, UserProfile } from '../types';
import { SiteConfig, getResolvedGrades } from '../types/siteConfig';
import { useLanguage } from '../context/LanguageContext';
import { buildWhatsAppSupportUrl } from '../utils/whatsapp';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  siteConfig?: SiteConfig;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  onCancel?: () => void;
}

const EGYPT_GOVERNORATES: Array<{ ar: string; en: string }> = [
  { ar: 'القاهرة', en: 'Cairo' },
  { ar: 'الجيزة', en: 'Giza' },
  { ar: 'الإسكندرية', en: 'Alexandria' },
  { ar: 'الدقهلية (المنصورة)', en: 'Dakahlia (Mansoura)' },
  { ar: 'الغربية (طنطا / المحلة)', en: 'Gharbia (Tanta / Mahalla)' },
  { ar: 'القليوبية', en: 'Qalyubia' },
  { ar: 'الشرقية (الزقازيق)', en: 'Sharqia (Zagazig)' },
  { ar: 'المنوفية', en: 'Monufia' },
  { ar: 'البحيرة (دمنهور)', en: 'Beheira (Damanhour)' },
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
  { ar: 'شمال سيناء', en: 'North Sinai' },
  { ar: 'جنوب سيناء', en: 'South Sinai' },
  { ar: 'مطروح', en: 'Matrouh' },
  { ar: 'الوادي الجديد', en: 'New Valley' },
];

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  isOpen,
  currentUser,
  siteConfig,
  onSaveProfile,
  onCancel,
}) => {
  const { lang, isRtl } = useLanguage();
  const resolvedGrades = getResolvedGrades(siteConfig);
  const [name, setName] = useState(currentUser.name || '');
  const [grade, setGrade] = useState<GradeLevel>(
    currentUser.grade || resolvedGrades.find((g) => g.isPopular)?.id || resolvedGrades[0]?.id || 'third'
  );
  const [phone, setPhone] = useState(
    currentUser.phone && currentUser.phone !== '010XXXXXXXX' ? currentUser.phone : ''
  );
  const [parentPhone, setParentPhone] = useState(currentUser.parentPhone || '');
  const [governorate, setGovernorate] = useState(currentUser.governorate || 'القاهرة');
  const [onboardError, setOnboardError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);
    if (!name.trim() || !phone.trim() || !parentPhone.trim()) {
      setOnboardError(
        lang === 'en'
          ? 'Please complete all required fields to activate your account.'
          : 'من فضلك أكمل جميع البيانات المطلوبة لتفعيل حسابك.'
      );
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      grade,
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      governorate,
      profileCompleted: true,
      approvalStatus: currentUser.approvalStatus === 'approved' ? 'approved' : 'pending',
      score: currentUser.score ?? 0,
      watchedLectureIds: currentUser.watchedLectureIds || [],
      passedQuizIds: currentUser.passedQuizIds || [],
      quizScores: currentUser.quizScores || {},
      joinedAt: currentUser.joinedAt || new Date().toISOString().split('T')[0],
    };

    onSaveProfile(updated);
  };

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[calc(100vh-5rem)] py-8 sm:py-12 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950 font-cairo flex flex-col justify-center"
    >
      <div className="max-w-2xl mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-9 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'en' ? 'One Step to Activate' : 'خطوة واحدة لتفعيل منصتك'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {lang === 'en' ? 'Complete Student Profile' : 'استكمال بيانات الطالب'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'en'
                ? 'Choose your academic year and contact details to personalize your lectures and enable your security watermark.'
                : 'حدد سنتك الدراسية وبيانات الاتصال لتخصيص محتواك الدراسي بدقة وتفعيل العلامة المائية الآمنة على حصصك.'}
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Sign Out' : 'خروج'}</span>
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {onboardError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {onboardError}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>{lang === 'en' ? 'Full Student Name *' : 'الاسم الثلاثي للطالب *'}</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Ahmed Mahmoud Kamal' : 'مثال: أحمد محمود كمال'}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Academic Grade */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>{lang === 'en' ? 'Academic Grade *' : 'الصف الدراسي (المحتوى المخصص) *'}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {resolvedGrades.map((g) => {
                const isSelected = grade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGrade(g.id)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? g.isPopular
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                          : 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold">
                      {lang === 'en' ? g.badgeEn || g.badgeAr : g.badgeAr}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {lang === 'en' ? g.yearLabelEn || 'Class of 2026' : g.yearLabelAr || 'دفعة 2026'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>{lang === 'en' ? 'Student Phone (WhatsApp) *' : 'رقم هاتف الطالب (واتساب) *'}</span>
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                {lang === 'en'
                  ? 'Displayed as a protective security watermark on lectures'
                  : 'يظهر كعلامة مائية أمنية متحركة على الفيديو'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'en' ? 'Parent Phone Number *' : 'رقم ولي الأمر (للمتابعة) *'}</span>
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="011XXXXXXXX"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                {lang === 'en'
                  ? 'Used for quiz scores & attendance reports'
                  : 'لإرسال درجات الكويزات وتقارير الغياب'}
              </p>
            </div>
          </div>

          {/* Governorate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{lang === 'en' ? 'Governorate *' : 'المحافظة *'}</span>
            </label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov.ar} value={gov.ar}>
                  {lang === 'en' ? gov.en : gov.ar}
                </option>
              ))}
            </select>
          </div>

          {/* Security & Admin Approval Notice + WhatsApp Support */}
          <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-800 dark:text-teal-300">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                {lang === 'en'
                  ? 'After saving, the admin reviews & approves your account before platform access unlocks.'
                  : 'بعد الحفظ يتم إرسال طلبك لمراجعة الإدارة وتفعيل الحساب، ويمكنك التواصل مع الدعم لتسريع التفعيل.'}
              </span>
            </div>
            <a
              href={buildWhatsAppSupportUrl(
                siteConfig,
                lang === 'en'
                  ? `Hello Support, I just registered (${name || currentUser.name}) and need help activating my account.`
                  : `السلام عليكم فريق الدعم، قمت بتسجيل حسابي (${name || currentUser.name}) وأرجو المراجعة والتفعيل.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'en' ? 'WhatsApp Support' : 'واتساب الدعم'}</span>
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full min-h-[48px] py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {lang === 'en'
                ? 'Save Details & Request Activation'
                : 'حفظ البيانات وإرسال طلب التفعيل'}
            </span>
          </button>
        </form>
      </div>
    </section>
  );
};
