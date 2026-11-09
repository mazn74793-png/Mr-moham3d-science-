import React, { useState } from 'react';
import { User, Phone, GraduationCap, MapPin, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { GradeLevel, UserProfile } from '../types';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية (المنصورة)',
  'الغربية (طنطا / المحلة)',
  'القليوبية',
  'الشرقية (الزقازيق)',
  'المنوفية',
  'البحيرة (دمنهور)',
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
  'شمال سيناء',
  'جنوب سيناء',
  'مطروح',
  'الوادي الجديد',
];

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  isOpen,
  currentUser,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [grade, setGrade] = useState<GradeLevel>(currentUser.grade || 'third');
  const [phone, setPhone] = useState(currentUser.phone && currentUser.phone !== '010XXXXXXXX' ? currentUser.phone : '');
  const [parentPhone, setParentPhone] = useState(currentUser.parentPhone || '');
  const [governorate, setGovernorate] = useState(currentUser.governorate || 'القاهرة');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !parentPhone.trim()) {
      alert('من فضلك أكمل جميع البيانات المطلوبة لتفعيل حسابك.');
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      grade: grade,
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      governorate: governorate,
      profileCompleted: true,
      score: 0, // Zeroed out as explicitly requested
      watchedLectureIds: currentUser.watchedLectureIds || [],
      passedQuizIds: currentUser.passedQuizIds || [],
      quizScores: currentUser.quizScores || {},
      joinedAt: currentUser.joinedAt || new Date().toISOString().split('T')[0],
    };

    onSaveProfile(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-teal-500/30 text-right space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="space-y-2 text-center sm:text-right border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>خطوة واحدة لتفعيل منصتك</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-kufi text-slate-900 dark:text-white">
            استكمال بيانات الطالب 🧪
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            مرحباً بك يا بطل! حدد سنتك الدراسية وبيانات الاتصال لتخصيص محتواك الدراسي بدقة وتفعيل العلامة المائية الآمنة على حصصك.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>الاسم الثلاثي للطالب *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد محمود كمال"
              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Academic Grade (Radio Cards) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span>الصف الدراسي (المحتوى المخصص) *</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setGrade('first')}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  grade === 'first'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-sm font-bold font-kufi">أولى ثانوي</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">دفعة 2026</div>
              </button>

              <button
                type="button"
                onClick={() => setGrade('second')}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  grade === 'second'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-sm font-bold font-kufi">تانية ثانوي</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">دفعة 2026</div>
              </button>

              <button
                type="button"
                onClick={() => setGrade('third')}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  grade === 'third'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-sm font-bold font-kufi">تالتة ثانوي 🔥</div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">الشهادة الثانوية</div>
              </button>
            </div>
          </div>

          {/* Student Phone & Parent Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>رقم هاتف الطالب (واتساب) *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono dir-ltr text-right"
              />
              <p className="text-[10px] text-slate-500">يظهر كعلامة مائية أمنية متحركة على الفيديو</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>رقم ولي الأمر (للمتابعة) *</span>
              </label>
              <input
                type="tel"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="011XXXXXXXX"
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono dir-ltr text-right"
              />
              <p className="text-[10px] text-slate-500">لإرسال درجات الكويزات وتقارير الغياب</p>
            </div>
          </div>

          {/* Governorate */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>المحافظة *</span>
            </label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-2.5 text-[11px] text-teal-800 dark:text-teal-300">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>بياناتك مؤمنة بالكامل ومشفرة لحفظ حقوق حسابك وربط نتائجك الدراسية.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 transition-all shadow-lg shadow-teal-700/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>حفظ البيانات وتفعيل منصتي الدراسية</span>
          </button>

        </form>

      </div>
    </div>
  );
};
