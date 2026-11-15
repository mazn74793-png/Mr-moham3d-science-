import React, { useState } from 'react';
import {
  Sparkles,
  Ticket,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Gift,
  History,
  Atom,
  Award,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Crown,
} from 'lucide-react';
import { AttachmentFile, Lecture, PointReward, UserProfile } from '../../types';

interface PointsWalletTabProps {
  lang: string;
  currentUser: UserProfile;
  gradeTitle: string;
  selectedGrade: string;
  filteredLectures: Lecture[];
  filteredAttachments: AttachmentFile[];
  rewards: PointReward[];
  onRedeemCode: (code: string) => Promise<{ pointsAdded: number; newBalance: number; code: string }>;
  onUnlockLecture: (lecture: Lecture) => Promise<void>;
  onUnlockAttachment: (file: AttachmentFile) => Promise<void>;
  onClaimReward: (reward: PointReward) => Promise<void>;
  onOpenLecture: (lecture: Lecture) => void;
  onGoToFiles: () => void;
}

function getChemistryRank(points: number) {
  if (points >= 700) {
    return {
      titleAr: 'أستاذ الكيمياء',
      titleEn: 'Grand Chemist',
      level: 4,
      nextThreshold: 700,
      prevThreshold: 300,
      progressPct: 100,
      pointsToNext: 0,
    };
  }
  if (points >= 300) {
    const pct = Math.round(((points - 300) / 400) * 100);
    return {
      titleAr: 'كيميائي محترف',
      titleEn: 'Pro Chemist',
      level: 3,
      nextThreshold: 700,
      prevThreshold: 300,
      progressPct: Math.max(8, Math.min(100, pct)),
      pointsToNext: 700 - points,
    };
  }
  if (points >= 100) {
    const pct = Math.round(((points - 100) / 200) * 100);
    return {
      titleAr: 'باحث تفاعلات',
      titleEn: 'Lab Researcher',
      level: 2,
      nextThreshold: 300,
      prevThreshold: 100,
      progressPct: Math.max(8, Math.min(100, pct)),
      pointsToNext: 300 - points,
    };
  }
  const pct = Math.round((points / 100) * 100);
  return {
    titleAr: 'مستكشف ذري',
    titleEn: 'Atomic Explorer',
    level: 1,
    nextThreshold: 100,
    prevThreshold: 0,
    progressPct: Math.max(4, Math.min(100, pct)),
    pointsToNext: 100 - points,
  };
}

function getRewardCategoryLabel(cat: PointReward['category'], isEn: boolean): string {
  switch (cat) {
    case 'badge':
      return isEn ? 'Achievement Badge' : 'وسام تميز';
    case 'discount':
      return isEn ? 'Special Discount' : 'خصم خاص';
    case 'material':
      return isEn ? 'Bonus Material' : 'محتوى إضافي';
    default:
      return isEn ? 'Exclusive Perk' : 'ميزة حصرية';
  }
}

export const PointsWalletTab: React.FC<PointsWalletTabProps> = ({
  lang,
  currentUser,
  gradeTitle,
  selectedGrade,
  filteredLectures,
  filteredAttachments,
  rewards,
  onRedeemCode,
  onUnlockLecture,
  onUnlockAttachment,
  onClaimReward,
  onOpenLecture,
  onGoToFiles,
}) => {
  const isEn = lang === 'en';
  const [codeInput, setCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [celebrationBanner, setCelebrationBanner] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const pointsBalance = Number(currentUser.points) || 0;
  const rank = getChemistryRank(pointsBalance);
  const unlockedLectureIds = currentUser.unlockedLectureIds || [];
  const unlockedAttachmentIds = currentUser.unlockedAttachmentIds || [];
  const claimedRewardIds = currentUser.claimedRewardIds || [];
  const history = currentUser.pointsHistory || [];

  const pointLectures = filteredLectures.filter((l) => (l.pointsCost || 0) > 0);
  const pointAttachments = filteredAttachments.filter((a) => (a.pointsCost || 0) > 0);
  const visibleRewards = rewards.filter(
    (r) => r.active && (r.grade === 'all' || r.grade === selectedGrade)
  );

  const showCelebration = (title: string, subtitle: string) => {
    setErrorBanner(null);
    setCelebrationBanner({ title, subtitle });
    window.setTimeout(() => {
      setCelebrationBanner((prev) => (prev?.title === title ? null : prev));
    }, 5000);
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim() || redeeming) return;
    setErrorBanner(null);
    setCelebrationBanner(null);
    setRedeeming(true);
    try {
      const res = await onRedeemCode(codeInput);
      setCodeInput('');
      showCelebration(
        isEn
          ? `Added +${res.pointsAdded} Points to your balance!`
          : `تمت إضافة +${res.pointsAdded} نقطة إلى رصيدك بنجاح!`,
        isEn
          ? `Code (${res.code}) redeemed instantly — New balance: ${res.newBalance} Pts.`
          : `كود الشحن (${res.code}) اتفعل فوراً — رصيدك الحالي الآن ${res.newBalance} نقطة.`
      );
    } catch (err: any) {
      setErrorBanner(
        err?.message ||
          (isEn
            ? 'Could not redeem code. Verify the code and try again.'
            : 'تعذر تفعيل الكود، تأكد من صحته وحاول مرة أخرى.')
      );
    } finally {
      setRedeeming(false);
    }
  };

  const handleUnlockLec = async (lec: Lecture) => {
    if (busyItemId) return;
    setErrorBanner(null);
    setBusyItemId(lec.id);
    try {
      await onUnlockLecture(lec);
      showCelebration(
        isEn ? `Unlocked "${lec.title}"!` : `تم فتح محاضرة "${lec.title}" بنجاح!`,
        isEn
          ? 'Points deducted. You can now watch this lecture anytime.'
          : 'تم خصم النقاط من محفظتك والمحاضرة مفتوحة لك الآن في أي وقت.'
      );
    } catch (err: any) {
      setErrorBanner(
        err?.message ||
          (isEn ? 'Could not unlock lecture right now.' : 'تعذر فتح المحاضرة بالنقاط حالياً.')
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleUnlockFile = async (file: AttachmentFile) => {
    if (busyItemId) return;
    setErrorBanner(null);
    setBusyItemId(file.id);
    try {
      await onUnlockAttachment(file);
      showCelebration(
        isEn ? `Unlocked "${file.title}"!` : `تم فتح مذكرة "${file.title}" بنجاح!`,
        isEn
          ? 'You can now preview and download it from the Handouts tab.'
          : 'يمكنك الآن معاينتها وتحميلها من قسم المذكرات.'
      );
    } catch (err: any) {
      setErrorBanner(
        err?.message ||
          (isEn ? 'Could not unlock handout right now.' : 'تعذر فتح المذكرة بالنقاط حالياً.')
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleClaim = async (reward: PointReward) => {
    if (busyItemId) return;
    setErrorBanner(null);
    setBusyItemId(reward.id);
    try {
      await onClaimReward(reward);
      showCelebration(
        isEn ? `Claimed "${reward.title}"!` : `مبروك! حصلت على "${reward.title}"`,
        isEn ? 'Reward recorded on your account.' : 'تم تسجيل المكافأة في حسابك بنجاح.'
      );
    } catch (err: any) {
      setErrorBanner(
        err?.message ||
          (isEn ? 'Could not redeem reward right now.' : 'تعذر استبدال المكافأة حالياً.')
      );
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Celebration or Error Alerts */}
      {celebrationBanner && (
        <div
          role="status"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-700 text-white shadow-lg border border-emerald-400/40 flex items-start justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold font-kufi">{celebrationBanner.title}</h3>
              <p className="text-xs text-emerald-50/95 leading-relaxed">
                {celebrationBanner.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCelebrationBanner(null)}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 cursor-pointer shrink-0"
          >
            {isEn ? 'Close' : 'إغلاق'}
          </button>
        </div>
      )}

      {errorBanner && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 text-xs sm:text-sm font-bold"
        >
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorBanner}</span>
        </div>
      )}

      {/* Hero Wallet & Rank Card + Redeem Code Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Balance & Chemistry Rank */}
        <div className="lg:col-span-7 rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-700/50 shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-kufi">
                <Crown className="w-4 h-4" />
                <span>{isEn ? 'Points Wallet & Academic Rank' : 'محفظة النقاط والمستوى العلمي'}</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                  {pointsBalance}
                </span>
                <span className="text-sm sm:text-base font-bold text-teal-300 font-kufi">
                  {isEn ? 'Points' : 'نقطة كيمياء'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'Redeem instructor codes to unlock special lectures, PDF handouts, and instant rewards.'
                  : 'اشحن أكواد المستر واجمع النقاط لفتح المحاضرات الخاصة والمذكرات والمكافآت الفورية.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center shrink-0 min-w-[108px]">
              <Atom className="w-6 h-6 text-amber-300 mx-auto mb-1" />
              <div className="text-[10px] text-teal-200 font-mono">
                {isEn ? `Level ${rank.level}` : `المستوى ${rank.level}`}
              </div>
              <div className="text-xs font-bold text-white font-kufi mt-0.5">
                {isEn ? rank.titleEn : rank.titleAr}
              </div>
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs text-teal-100/90 tabular-nums">
              <span className="font-semibold">
                {rank.pointsToNext > 0
                  ? isEn
                    ? `${rank.pointsToNext} points to next rank`
                    : `متبقي ${rank.pointsToNext} نقطة للترقية للمستوى التالي`
                  : isEn
                  ? 'Maximum platform rank reached'
                  : 'وصلت إلى أعلى رتبة علمية على المنصة'}
              </span>
              <span className="font-mono font-bold text-amber-300">{rank.progressPct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber-300 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${rank.progressPct}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300 pt-1 tabular-nums">
              <span>
                {isEn
                  ? `Unlocked lectures: ${unlockedLectureIds.length}`
                  : `محاضرات مفتوحة بالنقاط: ${unlockedLectureIds.length}`}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isEn
                  ? `Unlocked PDFs: ${unlockedAttachmentIds.length}`
                  : `مذكرات مفتوحة: ${unlockedAttachmentIds.length}`}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isEn
                  ? `Rewards claimed: ${claimedRewardIds.length}`
                  : `مكافآت مستبدلة: ${claimedRewardIds.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* Redeem Code Box */}
        <form
          onSubmit={handleRedeemSubmit}
          className="lg:col-span-5 rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm font-kufi">
              <Ticket className="w-5 h-5 text-amber-500" />
              <span>{isEn ? 'Redeem Top-Up Code' : 'اشحن رصيدك بكود (Redeem Code)'}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEn
                ? 'Enter the code provided by Mr. Mohamed Mostafa to credit points immediately.'
                : 'أدخل الكود الذي حصلت عليه من الأستاذ محمد مصطفى لإضافة النقاط لحسابك فوراً.'}
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder={isEn ? 'e.g. MM-CHEM-2026' : 'مثال: MM-CHEM-2026'}
              dir="ltr"
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={redeeming || !codeInput.trim()}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {redeeming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEn ? 'Verifying code...' : 'جاري التحقق وشحن النقاط...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isEn ? 'Redeem & Add Points' : 'تفعيل الكود وإضافة النقاط'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Point-Gated Lectures */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>
                {isEn
                  ? `Points-Unlockable Lectures (${gradeTitle})`
                  : `محاضرات تفتحها بالنقاط (${gradeTitle})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Unlock special lectures instantly with your points balance.'
                : 'افتح أي محاضرة مميزة فوراً برصيد نقاطك وشاهدها بلا قيود.'}
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {pointLectures.length} {isEn ? 'lectures' : 'محاضرات'}
          </span>
        </div>

        {pointLectures.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            {isEn
              ? 'No points-priced lectures for this grade yet — use your balance for handouts & rewards.'
              : 'لا توجد محاضرات مسعّرة بالنقاط لهذا الصف حالياً — استعمل أكوادك في المكافآت والمذكرات أو ترقب الإضافات الجديدة.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pointLectures.map((lec) => {
              const cost = lec.pointsCost || 0;
              const isUnlocked = unlockedLectureIds.includes(lec.id);
              const canAfford = pointsBalance >= cost;
              const isBusy = busyItemId === lec.id;

              return (
                <div
                  key={lec.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                      <span className="font-semibold text-teal-700 dark:text-teal-400 truncate">
                        {lec.chapter}
                      </span>
                      <span
                        className={`font-mono font-bold shrink-0 ${
                          isUnlocked
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isUnlocked ? (isEn ? 'Unlocked ✓' : 'مفتوحة ✓') : `${cost} ${isEn ? 'Pts' : 'نقطة'}`}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {lec.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {lec.description}
                    </p>
                  </div>

                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => onOpenLecture(lec)}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>{isEn ? 'Watch Lecture' : 'مشاهدة المحاضرة الآن'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(busyItemId) || !canAfford}
                      onClick={() => handleUnlockLec(lec)}
                      className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : canAfford ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>
                        {isBusy
                          ? isEn
                            ? 'Unlocking...'
                            : 'جاري الفتح...'
                          : canAfford
                          ? isEn
                            ? `Unlock for ${cost} Pts`
                            : `افتح المحاضرة بـ ${cost} نقطة`
                          : isEn
                          ? `Need ${cost - pointsBalance} more Pts`
                          : `ينقصك ${cost - pointsBalance} نقطة`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Point-Gated Handouts & Admin Rewards Store */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Rewards Store */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              <span>{isEn ? 'Rewards Store' : 'متجر المكافآت والمزايا'}</span>
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {visibleRewards.length} {isEn ? 'available' : 'متاح'}
            </span>
          </div>

          {visibleRewards.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              {isEn
                ? 'Exclusive rewards and discounts will appear here soon.'
                : 'سيضيف الأستاذ محمد مصطفى مكافآت وخصومات حصرية هنا قريباً.'}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRewards.map((reward) => {
                const isClaimed = claimedRewardIds.includes(reward.id);
                const canAfford = pointsBalance >= reward.pointsCost;
                const isBusy = busyItemId === reward.id;

                return (
                  <div
                    key={reward.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-teal-700 dark:text-teal-400">
                          {getRewardCategoryLabel(reward.category, isEn)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                          {reward.pointsCost} {isEn ? 'Pts' : 'نقطة'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {reward.title}
                      </h3>
                      {reward.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {reward.description}
                        </p>
                      )}
                    </div>

                    {isClaimed ? (
                      <span className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isEn ? 'Claimed' : 'تم الحصول عليها'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(busyItemId) || !canAfford}
                        onClick={() => handleClaim(reward)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
                          canAfford
                            ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        <span>
                          {isBusy
                            ? isEn
                              ? 'Redeeming...'
                              : 'جاري الاستبدال...'
                            : isEn
                            ? 'Redeem'
                            : 'استبدال النقاط'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Point-Gated Handouts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Points-Unlockable Handouts' : 'مذكرات تفتحها بالنقاط'}</span>
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {pointAttachments.length} {isEn ? 'files' : 'ملفات'}
            </span>
          </div>

          {pointAttachments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              {isEn
                ? 'All available handouts for this grade are currently free in the Handouts tab.'
                : 'كل المذكرات المتاحة لهذا الصف مفتوحة مجاناً حالياً في قسم المذكرات.'}
            </div>
          ) : (
            <div className="space-y-3">
              {pointAttachments.map((file) => {
                const cost = file.pointsCost || 0;
                const isUnlocked = unlockedAttachmentIds.includes(file.id);
                const canAfford = pointsBalance >= cost;
                const isBusy = busyItemId === file.id;

                return (
                  <div
                    key={file.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>{file.chapter}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {cost} {isEn ? 'Pts' : 'نقطة'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {file.title}
                      </h3>
                    </div>

                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={onGoToFiles}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isEn ? 'Unlocked — View Handout' : 'مفتوحة — افتح المذكرات'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(busyItemId) || !canAfford}
                        onClick={() => handleUnlockFile(file)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
                          canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                        <span>
                          {isBusy
                            ? isEn
                              ? 'Unlocking...'
                              : 'جاري الفتح...'
                            : isEn
                            ? `Unlock (${cost} Pts)`
                            : `فتح بـ ${cost} نقطة`}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Points Activity Log */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base font-kufi text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{isEn ? 'Points Activity History' : 'سجل عمليات النقاط والشحن'}</span>
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {isEn ? `Last ${history.length}` : `آخر ${history.length} عمليات`}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {isEn
              ? 'No transactions yet — redeem your first code above to get started.'
              : 'لم تقم بأي عمليات شحن أو استبدال بعد — ابدأ بإدخال أول كود في الأعلى!'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {history.map((entry) => {
              const isCredit = entry.delta > 0;
              return (
                <div
                  key={entry.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {entry.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {entry.date}
                        {entry.code ? ` · ${entry.code}` : ''}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-mono font-extrabold tabular-nums shrink-0 ${
                      isCredit
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isCredit ? `+${entry.delta}` : entry.delta}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
