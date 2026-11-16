import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Megaphone,
  Award,
  Video,
  Flame,
  Trophy,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  PlatformNotification,
  NotificationCategory,
  NotificationCtaTab,
} from '../../types';
import { GradeItem } from '../../types/siteConfig';
import { useLanguage } from '../../context/LanguageContext';

interface NotificationsTabProps {
  notifications: PlatformNotification[];
  resolvedGrades: GradeItem[];
  authorName: string;
  onSaveNotification: (notif: PlatformNotification) => Promise<boolean>;
  onDeleteNotification: (id: string) => Promise<boolean>;
}

const CATEGORY_META: Record<
  NotificationCategory,
  {
    labelEn: string;
    labelAr: string;
    badgeCls: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  announcement: {
    labelEn: 'Announcement',
    labelAr: 'إعلان وتنويه',
    badgeCls: 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    icon: Megaphone,
  },
  lecture: {
    labelEn: 'New Lecture',
    labelAr: 'محاضرة جديدة',
    badgeCls: 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    icon: Video,
  },
  exam: {
    labelEn: 'Exam Alert',
    labelAr: 'موعد امتحان',
    badgeCls: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Award,
  },
  urgent: {
    labelEn: 'Important',
    labelAr: 'تنبيه هام',
    badgeCls: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: Flame,
  },
  congrats: {
    labelEn: 'Encouragement',
    labelAr: 'رسالة تحفيز وتكريم',
    badgeCls: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: Trophy,
  },
};

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  resolvedGrades,
  authorName,
  onSaveNotification,
  onDeleteNotification,
}) => {
  const { lang, isRtl } = useLanguage();
  const isEn = lang === 'en';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('announcement');
  const [grade, setGrade] = useState<string>('all');
  const [pinned, setPinned] = useState<boolean>(true);
  const [active, setActive] = useState<boolean>(true);
  const [ctaTab, setCtaTab] = useState<NotificationCtaTab | ''>('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setCategory('announcement');
    setGrade('all');
    setPinned(true);
    setActive(true);
    setCtaTab('');
    setCtaLabel('');
  };

  const startEditing = (item: PlatformNotification) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setCategory(item.category);
    setGrade(item.grade || 'all');
    setPinned(Boolean(item.pinned));
    setActive(Boolean(item.active));
    setCtaTab(item.ctaTab || '');
    setCtaLabel(item.ctaLabel || '');
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyInspirationalTemplate = (kind: 'welcome' | 'exam' | 'lecture') => {
    if (kind === 'welcome') {
      setCategory('congrats');
      setTitle(
        isEn
          ? 'Your path to a full Chemistry score starts today'
          : 'طريقك للدرجة النهائية في الكيمياء يبدأ بخطوة ثابتة اليوم'
      );
      setMessage(
        isEn
          ? 'Stay consistent with every session, take notes cleanly alongside the lecture, and challenge yourself on the quiz right after. Excellence is built one reaction at a time.'
          : 'أبطالي الأعزاء، التميز في الكيمياء لا يأتي صدفة؛ بل بالالتزام بكل حصة، وتدوين الملاحظات الذكية، وحل الاختبار التطبيقي فور المشاهدة. أنتم قادرون على القمة دائماً!'
      );
      setCtaTab('lectures');
      setCtaLabel(isEn ? 'Open Latest Lecture' : 'ابدأ المذاكرة الآن');
    } else if (kind === 'exam') {
      setCategory('exam');
      setTitle(
        isEn
          ? 'New Assessment Published — Test Your Mastery!'
          : 'تم إتاحة امتحان تقييمي جديد — اختبر جاهزيتك الآن!'
      );
      setMessage(
        isEn
          ? 'Review the chapter equations and key laws first, then launch the timed exam from the Quizzes tab. Aim for 100% and unlock your next session automatically.'
          : 'راجع أهم معادلات وقوانين الباب بتركيز قبل الدخول، ثم ادخل على الامتحان الإلكتروني من قسم الامتحانات. تذكر أن اجتياز الامتحان يفتح لك المحاضرة التالية تلقائياً!'
      );
      setCtaTab('quizzes');
      setCtaLabel(isEn ? 'Go to Quizzes' : 'انتقل للامتحانات');
    } else {
      setCategory('lecture');
      setTitle(
        isEn
          ? 'Fresh Session & Summary Handout Available'
          : 'محاضرة جديدة ومذكرة ملخصة متاحة الآن في منصتك'
      );
      setMessage(
        isEn
          ? 'A brand-new Chemistry lecture is live with its printable PDF handout and timestamped key notes. Watch at your preferred pace and bookmark important parts for quick review.'
          : 'تم رفع محاضرة شرح جديدة مع ملزمة القوانين والتدريبات الخاصة بها. استمتع بمشاهدة واضحة وسلسة واحفظ أهم النقاط للمراجعة السريعة في أي وقت.'
      );
      setCtaTab('lectures');
      setCtaLabel(isEn ? 'Watch Session' : 'شاهد المحاضرة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setNotice(null);

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      setNotice({
        type: 'error',
        text: isEn
          ? 'Please write a clear notification headline.'
          : 'يرجى كتابة عنوان واضح للإشعار.',
      });
      return;
    }
    if (!cleanMessage || cleanMessage.length < 5) {
      setNotice({
        type: 'error',
        text: isEn
          ? 'Please write the notification message.'
          : 'يرجى كتابة نص الرسالة للطلاب.',
      });
      return;
    }

    const existingItem = editingId ? notifications.find((n) => n.id === editingId) : null;
    const payload: PlatformNotification = {
      id: editingId || `notif_${Date.now()}`,
      title: cleanTitle.slice(0, 200),
      message: cleanMessage.slice(0, 3000),
      category,
      grade: grade || 'all',
      pinned,
      active,
      authorName: (authorName || 'أ/ محمد مصطفى').slice(0, 150),
      dateAdded: existingItem?.dateAdded || new Date().toISOString().split('T')[0],
      ctaTab: ctaTab || undefined,
      ctaLabel: ctaTab && ctaLabel.trim() ? ctaLabel.trim().slice(0, 80) : undefined,
    };

    setSaving(true);
    try {
      const ok = await onSaveNotification(payload);
      if (ok) {
        setNotice({
          type: 'success',
          text: editingId
            ? isEn
              ? 'Notification updated in cloud and visible to students immediately!'
              : 'تم تعديل الإشعار وتحديثه سحابياً بنجاح!'
            : isEn
            ? 'Notification published live to students!'
            : 'تم نشر الإشعار بنجاح للطلاب في السحابة!',
        });
        resetForm();
      } else {
        setNotice({
          type: 'error',
          text: isEn
            ? 'Could not publish notification. Check your permissions and connection.'
            : 'تعذر حفظ الإشعار في السحابة، تأكد من الاتصال والصلاحيات.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (
    item: PlatformNotification,
    patch: Partial<Pick<PlatformNotification, 'active' | 'pinned'>>
  ) => {
    await onSaveNotification({
      ...item,
      ...patch,
    });
  };

  const getGradeLabel = (gradeId: string) => {
    if (gradeId === 'all') return isEn ? 'All Academic Grades' : 'جميع الصفوف الدراسية';
    const found = resolvedGrades.find((g) => g.id === gradeId);
    if (!found) return gradeId;
    return isEn ? found.badgeEn || found.badgeAr : found.badgeAr;
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const PreviewIcon = CATEGORY_META[category].icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-2 rounded-xl bg-teal-600 text-white">
                <Bell className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                {isEn
                  ? 'Student Notifications & Announcements'
                  : 'قسم الإشعارات والتوجيهات الطلابية'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Publish inspiring announcements, exam alerts, or new lecture updates to any grade and edit them anytime.'
                : 'أنشئ رسائل ملهمة وتنبيهات للامتحانات والمحاضرات الجديدة لكل صف أو للجميع، مع إمكانية التعديل الفوري في أي وقت.'}
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-300 font-mono tabular-nums self-start sm:self-auto">
            {notifications.length} {isEn ? 'Notifications' : 'إشعارات'}
          </div>
        </div>

        {notice && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Quick Inspiration Templates */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEn ? 'Quick phrasing templates:' : 'صياغات جاهزة أنيقة:'}</span>
          </span>
          <button
            type="button"
            onClick={() => applyInspirationalTemplate('welcome')}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
          >
            {isEn ? 'Motivational Note' : 'رسالة تحفيزية ملهمة'}
          </button>
          <button
            type="button"
            onClick={() => applyInspirationalTemplate('exam')}
            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 cursor-pointer"
          >
            {isEn ? 'Exam Readiness Alert' : 'تنبيه امتحان وتقييم'}
          </button>
          <button
            type="button"
            onClick={() => applyInspirationalTemplate('lecture')}
            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 cursor-pointer"
          >
            {isEn ? 'New Lecture Release' : 'إعلان محاضرة ومذكرة'}
          </button>
        </div>

        {/* Create / Edit Notification Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <span>{isEn ? 'Editing Notification' : 'تعديل الإشعار الحالي'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-teal-600" />
                    <span>{isEn ? 'Compose New Notification' : 'كتابة إشعار جديد للطلاب'}</span>
                  </>
                )}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Cancel Edit' : 'إلغاء التعديل'}</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isEn ? 'Headline' : 'عنوان الإشعار'}
              </label>
              <input
                type="text"
                maxLength={200}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isEn
                    ? 'e.g. Chapter 2 Comprehensive Revision Now Live'
                    : 'مثال: المراجعة الشاملة للباب الثاني متاحة الآن!'
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isEn ? 'Message Body' : 'تفاصيل الرسالة والتوجيه للطلاب'}
              </label>
              <textarea
                rows={4}
                maxLength={3000}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isEn
                    ? 'Write a warm, clear message with guidance or study instructions...'
                    : 'اكتب رسالة راقية وواضحة تحتوي على التوجيهات أو المواعيد المهمة لطلابك...'
                }
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isEn ? 'Category' : 'نوع الإشعار'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {isEn ? CATEGORY_META[cat].labelEn : CATEGORY_META[cat].labelAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isEn ? 'Target Audience' : 'الصف الدراسي المستهدف'}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">{isEn ? 'All Grades' : 'جميع الصفوف الدراسية'}</option>
                  {resolvedGrades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {isEn ? g.badgeEn || g.badgeAr : g.badgeAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isEn ? 'Quick Action Button (Optional)' : 'زر توجيه مباشر للطالب (اختياري)'}
                </label>
                <select
                  value={ctaTab}
                  onChange={(e) => setCtaTab(e.target.value as NotificationCtaTab | '')}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{isEn ? 'No button' : 'بدون زر توجيه'}</option>
                  <option value="lectures">{isEn ? 'Open Lectures' : 'قسم المحاضرات'}</option>
                  <option value="quizzes">{isEn ? 'Open Quizzes' : 'قسم الامتحانات'}</option>
                  <option value="files">{isEn ? 'Open PDF Handouts' : 'قسم الملازم PDF'}</option>
                  <option value="points">{isEn ? 'Open Points Wallet' : 'قسم النقاط والأكواد'}</option>
                  <option value="study-hub">{isEn ? 'Open Study & Equations' : 'قسم المعادلات والمذاكرة'}</option>
                </select>
              </div>

              {ctaTab && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isEn ? 'Button Text' : 'نص الزر'}
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder={isEn ? 'e.g. Start Quiz Now' : 'مثال: افتح القسم الآن'}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span>{isEn ? 'Pin to top of student feed' : 'تثبيت الإشعار في أعلى القائمة'}</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>{isEn ? 'Visible to students immediately' : 'ظاهر ومفعّل للطلاب'}</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {saving
                    ? isEn
                      ? 'Saving to Cloud...'
                      : 'جاري الحفظ في السحابة...'
                    : editingId
                    ? isEn
                      ? 'Save Changes to Notification'
                      : 'حفظ التعديلات على الإشعار'
                    : isEn
                    ? 'Publish Notification'
                    : 'نشر الإشعار للطلاب الآن'}
                </span>
              </button>
            </div>
          </div>

          {/* Live Student Card Preview */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Live Student Preview:' : 'معاينة شكل الإشعار عند الطالب:'}
            </div>
            <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white border border-teal-500/30 shadow-md space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${CATEGORY_META[category].badgeCls}`}
                >
                  <PreviewIcon className="w-3.5 h-3.5" />
                  <span>{isEn ? CATEGORY_META[category].labelEn : CATEGORY_META[category].labelAr}</span>
                </span>
                {pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    <Pin className="w-3 h-3" />
                    <span>{isEn ? 'Pinned' : 'مثبت'}</span>
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-base sm:text-lg font-extrabold leading-snug">
                  {title.trim() ||
                    (isEn
                      ? 'Notification Headline Appears Here'
                      : 'عنوان الإشعار يظهر هنا بأناقة')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {message.trim() ||
                    (isEn
                      ? 'Your encouraging guidance, schedule update, or exam note for students will appear clearly here.'
                      : 'رسالتك التحفيزية أو تنبيهك الأكاديمي للطلاب سيظهر هنا بتنسيق مريح وواضح.')}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  {authorName} · {getGradeLabel(grade)}
                </span>
                {ctaTab && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-500 text-slate-950 font-bold">
                    <span>{ctaLabel.trim() || (isEn ? 'Open Section' : 'انتقال الآن')}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Published Notifications List with Full Edit / Toggle / Delete */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
          {isEn ? 'Published Notifications History' : 'سجل الإشعارات المنشورة (تعديل وحذف فوري)'}
        </h3>

        {notifications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'No notifications published yet' : 'لم يتم نشر أي إشعارات للطلاب بعد'}
            </div>
            <p className="text-xs text-slate-500">
              {isEn
                ? 'Use the composer above to publish your first announcement.'
                : 'استخدم النموذج أعلاه لإرسال أول إشعار أو رسالة تشجيع لطلابك.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.announcement;
              const CatIcon = meta.icon;
              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.active
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/60 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${meta.badgeCls}`}
                      >
                        <CatIcon className="w-3 h-3" />
                        <span>{isEn ? meta.labelEn : meta.labelAr}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        {getGradeLabel(item.grade)}
                      </span>
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                          <Pin className="w-3 h-3" />
                          <span>{isEn ? 'Pinned' : 'مثبت'}</span>
                        </span>
                      )}
                      {!item.active && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {isEn ? 'Hidden' : 'مخفي'}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {item.dateAdded}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickToggle(item, { pinned: !item.pinned })}
                      title={item.pinned ? (isEn ? 'Unpin' : 'إلغاء التثبيت') : isEn ? 'Pin' : 'تثبيت'}
                      className={`min-h-[38px] px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        item.pinned
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickToggle(item, { active: !item.active })}
                      title={item.active ? (isEn ? 'Hide' : 'إخفاء') : isEn ? 'Show' : 'إظهار'}
                      className="min-h-[38px] px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {item.active ? <Eye className="w-3.5 h-3.5 text-teal-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="min-h-[38px] px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Edit' : 'تعديل'}</span>
                    </button>

                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteNotification(item.id);
                            setConfirmDeleteId(null);
                            if (editingId === item.id) resetForm();
                          }}
                          className="min-h-[38px] px-3 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isEn ? 'Confirm' : 'حذف مؤكد'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[38px] px-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                        >
                          {isEn ? 'No' : 'إلغاء'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="min-h-[38px] px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
