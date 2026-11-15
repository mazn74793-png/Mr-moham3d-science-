import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Gift,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Edit3,
  X,
} from 'lucide-react';
import { AttachmentFile, Lecture, PointReward, RedeemCode } from '../../types';
import { GradeItem, getGradeDisplayName } from '../../types/siteConfig';

interface PointsCodesTabProps {
  redeemCodes: RedeemCode[];
  rewards: PointReward[];
  lectures: Lecture[];
  attachments: AttachmentFile[];
  resolvedGrades: GradeItem[];
  onCreateRedeemCode: (code: RedeemCode) => Promise<boolean> | boolean;
  onCreateRedeemCodesBatch: (codes: RedeemCode[]) => Promise<boolean> | boolean;
  onToggleRedeemCode: (codeId: string, active: boolean) => Promise<boolean> | boolean;
  onDeleteRedeemCode: (codeId: string) => Promise<boolean> | boolean;
  onSaveReward: (reward: PointReward) => Promise<boolean> | boolean;
  onDeleteReward: (rewardId: string) => Promise<boolean> | boolean;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRandomCode(prefix = 'MM'): string {
  const part = (len: number) =>
    Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return `${prefix}-${part(4)}-${part(4)}`;
}

export const PointsCodesTab: React.FC<PointsCodesTabProps> = ({
  redeemCodes,
  rewards,
  lectures,
  attachments,
  resolvedGrades,
  onCreateRedeemCode,
  onCreateRedeemCodesBatch,
  onToggleRedeemCode,
  onDeleteRedeemCode,
  onSaveReward,
  onDeleteReward,
}) => {
  // Code generator mode: single vs batch
  const [genMode, setGenMode] = useState<'single' | 'batch'>('single');
  const [customCode, setCustomCode] = useState(() => generateRandomCode('CHEM'));
  const [batchPrefix, setBatchPrefix] = useState('MM');
  const [batchCount, setBatchCount] = useState(5);
  const [codePoints, setCodePoints] = useState(50);
  const [codeMaxUses, setCodeMaxUses] = useState(1);
  const [codeLabel, setCodeLabel] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  // Rewards creator / editor
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCost, setRewardCost] = useState(100);
  const [rewardCategory, setRewardCategory] = useState<PointReward['category']>('perk');
  const [rewardGrade, setRewardGrade] = useState('all');
  const [savingReward, setSavingReward] = useState(false);

  // Code editor modal state
  const [editingCode, setEditingCode] = useState<RedeemCode | null>(null);
  const [savingEditedCode, setSavingEditedCode] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  const [confirmDeleteReward, setConfirmDeleteReward] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingCode) return;

    const pointsVal = Math.max(1, Math.min(100000, Math.round(Number(codePoints) || 10)));
    const maxUsesVal = Math.max(1, Math.min(100000, Math.round(Number(codeMaxUses) || 1)));
    const today = new Date().toISOString().split('T')[0];

    setSavingCode(true);
    try {
      if (genMode === 'single') {
        const clean = customCode.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9_\-]/g, '');
        if (!clean || clean.length < 3) {
          showToast('error', 'أدخل كود مكون من 3 أحرف أو أرقام إنجليزية على الأقل.');
          return;
        }
        const item: RedeemCode = {
          id: clean,
          code: clean,
          points: pointsVal,
          maxUses: maxUsesVal,
          usedCount: 0,
          active: true,
          label: codeLabel.trim() || undefined,
          createdAtDate: today,
        };
        const ok = await onCreateRedeemCode(item);
        if (ok) {
          showToast('success', `تم إنشاء كود (${clean}) بقيمة ${pointsVal} نقطة!`);
          setCustomCode(generateRandomCode('CHEM'));
          setCodeLabel('');
        }
      } else {
        const count = Math.max(1, Math.min(50, Math.round(Number(batchCount) || 5)));
        const cleanPrefix =
          batchPrefix.trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '').slice(0, 12) || 'MM';
        const usedSet = new Set(redeemCodes.map((c) => c.code));
        const list: RedeemCode[] = [];
        for (let i = 0; i < count; i++) {
          let code = generateRandomCode(cleanPrefix);
          while (usedSet.has(code)) {
            code = generateRandomCode(cleanPrefix);
          }
          usedSet.add(code);
          list.push({
            id: code,
            code,
            points: pointsVal,
            maxUses: maxUsesVal,
            usedCount: 0,
            active: true,
            label: codeLabel.trim() || `دفعة ${cleanPrefix}`,
            createdAtDate: today,
          });
        }
        const ok = await onCreateRedeemCodesBatch(list);
        if (ok) {
          showToast('success', `تم توليد وحفظ ${list.length} أكواد جديدة بقيمة ${pointsVal} نقطة لكل كود!`);
          setCodeLabel('');
        }
      }
    } finally {
      setSavingCode(false);
    }
  };

  const handleCopySingle = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedId(code);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyAllActive = () => {
    const activeList = redeemCodes
      .filter((c) => c.active && c.usedCount < c.maxUses)
      .map((c) => `${c.code} (${c.points} نقطة)`)
      .join('\n');
    if (!activeList) {
      showToast('error', 'لا توجد أكواد نشطة متاحة للنسخ.');
      return;
    }
    navigator.clipboard?.writeText(activeList).catch(() => {});
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 2000);
  };

  const resetRewardForm = () => {
    setEditingRewardId(null);
    setRewardTitle('');
    setRewardDesc('');
    setRewardCost(100);
    setRewardCategory('perk');
    setRewardGrade('all');
  };

  const handleLoadRewardForEdit = (rew: PointReward) => {
    setEditingRewardId(rew.id);
    setRewardTitle(rew.title);
    setRewardDesc(rew.description || '');
    setRewardCost(rew.pointsCost);
    setRewardCategory(rew.category);
    setRewardGrade(rew.grade || 'all');
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim() || savingReward) return;
    setSavingReward(true);
    try {
      const existing = editingRewardId ? rewards.find((r) => r.id === editingRewardId) : undefined;
      const reward: PointReward = {
        id: existing ? existing.id : `rew-${Date.now()}`,
        title: rewardTitle.trim(),
        description: rewardDesc.trim(),
        pointsCost: Math.max(1, Math.min(100000, Math.round(Number(rewardCost) || 50))),
        category: rewardCategory,
        grade: rewardGrade,
        active: existing ? existing.active : true,
        dateAdded: existing?.dateAdded || new Date().toISOString().split('T')[0],
      };
      const ok = await onSaveReward(reward);
      if (ok) {
        showToast(
          'success',
          existing
            ? `تم تحديث مكافأة "${reward.title}" بنجاح!`
            : `تمت إضافة مكافأة "${reward.title}" لمتجر الطلاب!`
        );
        resetRewardForm();
      }
    } finally {
      setSavingReward(false);
    }
  };

  const handleSaveEditedCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode || savingEditedCode) return;
    setSavingEditedCode(true);
    try {
      const updated: RedeemCode = {
        ...editingCode,
        points: Math.max(1, Math.min(100000, Math.round(Number(editingCode.points) || 10))),
        maxUses: Math.max(
          editingCode.usedCount || 0,
          Math.max(1, Math.min(100000, Math.round(Number(editingCode.maxUses) || 1)))
        ),
        label: editingCode.label?.trim() || undefined,
      };
      const ok = await onCreateRedeemCode(updated);
      if (ok) {
        showToast('success', `تم تحديث كود (${updated.code}) بنجاح!`);
        setEditingCode(null);
      }
    } finally {
      setSavingEditedCode(false);
    }
  };

  const pointPricedLectures = lectures.filter((l) => (l.pointsCost || 0) > 0);
  const pointPricedAttachments = attachments.filter((a) => (a.pointsCost || 0) > 0);

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. REDEEM CODES GENERATOR & LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-amber-500" />
              <span>إنشاء وإدارة أكواد شحن النقاط (Redeem Codes)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              أنشئ كوداً مخصصاً أو دفعة عشوائية من الأكواد لتوزيعها على طلابك لشحن محافظهم وفتح المحاضرات والمكافآت.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setGenMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                genMode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              كود واحد مخصص
            </button>
            <button
              type="button"
              onClick={() => setGenMode('batch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                genMode === 'batch'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>توليد دفعة أكواد</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleCreateCodes}
          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {genMode === 'single' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  نص الكود (أحرف إنجليزية وأرقام) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    dir="ltr"
                    placeholder="CHEM-VIP-100"
                    className="flex-1 p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomCode(generateRandomCode('CHEM'))}
                    className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold hover:bg-slate-300 cursor-pointer shrink-0"
                  >
                    عشوائي
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    بادئة الأكواد (Prefix)
                  </label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                    dir="ltr"
                    placeholder="MM"
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    عدد الأكواد (1 - 50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                قيمة النقاط لكل كود *
              </label>
              <input
                type="number"
                min={1}
                max={100000}
                required
                value={codePoints}
                onChange={(e) => setCodePoints(Number(e.target.value))}
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-amber-600 dark:text-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                أقصى عدد طلاب يستخدموا الكود *
              </label>
              <input
                type="number"
                min={1}
                max={100000}
                required
                value={codeMaxUses}
                onChange={(e) => setCodeMaxUses(Number(e.target.value))}
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                ملاحظة / وصف الكود (اختياري — يظهر للطالب في السجل)
              </label>
              <input
                type="text"
                value={codeLabel}
                onChange={(e) => setCodeLabel(e.target.value)}
                placeholder="مثال: هدية أوائل امتحان الباب الأول"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={savingCode}
              className="min-h-[42px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>
                {savingCode
                  ? 'جاري الإنشاء...'
                  : genMode === 'single'
                  ? 'حفظ ونشر الكود'
                  : `توليد ${batchCount} أكواد الآن`}
              </span>
            </button>
          </div>
        </form>

        {/* Codes Table */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-kufi">
              الأكواد المسجلة ({redeemCodes.length})
            </h3>
            <button
              type="button"
              onClick={handleCopyAllActive}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'تم نسخ جميع الأكواد المتاحة!' : 'نسخ جميع الأكواد المتاحة'}</span>
            </button>
          </div>

          {redeemCodes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              لم تقم بإنشاء أي أكواد بعد — استخدم النموذج بالأعلى لتوليد أول كود للطلاب!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {redeemCodes.map((item) => {
                const used = item.usedCount || 0;
                const max = item.maxUses || 1;
                const exhausted = used >= max;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      !item.active || exhausted
                        ? 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          dir="ltr"
                          className="font-mono text-sm font-extrabold text-slate-900 dark:text-white tracking-wider"
                        >
                          {item.code}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          +{item.points} نقطة
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 tabular-nums">
                        <span>
                          الاستخدام: {used} / {max}
                        </span>
                        {item.label && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{item.label}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.code)}
                        title="نسخ الكود"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer"
                      >
                        {copiedId === item.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingCode(item)}
                        title="تعديل نقاط أو عدد استخدامات الكود"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleRedeemCode(item.id, !item.active)}
                        title={item.active ? 'إيقاف الكود مؤقتاً' : 'تفعيل الكود'}
                        className={`p-2 rounded-xl cursor-pointer transition-colors ${
                          item.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {confirmDeleteCode === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRedeemCode(item.id);
                              setConfirmDeleteCode(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            حذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCode(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[10px] cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCode(item.id)}
                          title="حذف الكود"
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* 2. POINT REWARDS STORE BUILDER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold font-kufi text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <span>متجر المكافآت والمزايا القابلة للاستبدال بالنقاط</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            أضف خصومات، شارات تميز، أو مزايا إضافية يشتريها الطالب بنقاطه من محفظته.
          </p>
        </div>

        <form
          onSubmit={handleAddReward}
          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                اسم المكافأة أو الميزة *
              </label>
              <input
                type="text"
                required
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                placeholder="مثال: خصم 50% على المراجعة النهائية"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                السعر بالنقاط *
              </label>
              <input
                type="number"
                min={1}
                max={100000}
                required
                value={rewardCost}
                onChange={(e) => setRewardCost(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                النوع
              </label>
              <select
                value={rewardCategory}
                onChange={(e) => setRewardCategory(e.target.value as PointReward['category'])}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="perk">ميزة حصرية</option>
                <option value="discount">خصم خاص</option>
                <option value="badge">وسام تميز</option>
                <option value="material">محتوى إضافي</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                الصف المستهدف
              </label>
              <select
                value={rewardGrade}
                onChange={(e) => setRewardGrade(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="all">جميع الصفوف</option>
                {resolvedGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.badgeAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  تفاصيل المكافأة (اختياري)
                </label>
                <input
                  type="text"
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  placeholder="تفاصيل الاستلام أو كيفية الاستخدام..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editingRewardId && (
                  <button
                    type="button"
                    onClick={resetRewardForm}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingReward}
                  className="min-h-[40px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {savingReward
                      ? 'جاري الحفظ...'
                      : editingRewardId
                      ? 'حفظ تعديل المكافأة'
                      : 'إضافة للمتجر'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {rewards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rewards.map((rew) => (
              <div
                key={rew.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  editingRewardId === rew.id
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                    : !rew.active
                    ? 'border-slate-200 dark:border-slate-800 opacity-70'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {rew.pointsCost} نقطة
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500">
                      {rew.grade === 'all'
                        ? 'كل الصفوف'
                        : getGradeDisplayName(rew.grade, undefined, 'ar')}
                    </span>
                    {!rew.active && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-500 font-bold">موقوفة</span>
                      </>
                    )}
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {rew.title}
                  </div>
                  {rew.description && (
                    <div className="text-xs text-slate-500 truncate">{rew.description}</div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadRewardForEdit(rew)}
                    title="تعديل المكافأة"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSaveReward({ ...rew, active: !rew.active })}
                    title={rew.active ? 'إيقاف المكافأة' : 'تفعيل المكافأة'}
                    className={`p-2 rounded-xl cursor-pointer transition-colors ${
                      rew.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  {confirmDeleteReward === rew.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteReward(rew.id);
                          setConfirmDeleteReward(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        تأكيد
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteReward(null)}
                        className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[10px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteReward(rew.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Redeem Code Modal */}
      {editingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                <h3 className="text-base font-bold font-kufi text-slate-900 dark:text-white">
                  تعديل كود <span dir="ltr" className="font-mono text-teal-600">{editingCode.code}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCode(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    قيمة النقاط *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    required
                    value={editingCode.points}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, points: Number(e.target.value) })
                    }
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الحد الأقصى للاستخدام
                  </label>
                  <input
                    type="number"
                    min={Math.max(1, editingCode.usedCount || 0)}
                    max={100000}
                    required
                    value={editingCode.maxUses}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, maxUses: Number(e.target.value) })
                    }
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  ملاحظة / وصف الكود
                </label>
                <input
                  type="text"
                  value={editingCode.label || ''}
                  onChange={(e) => setEditingCode({ ...editingCode, label: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCode(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEditedCode}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingEditedCode ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. POINT-PRICED CONTENT SUMMARY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold font-kufi text-slate-900 dark:text-white">
          المحتوى المسعّر بالنقاط حالياً ({pointPricedLectures.length} محاضرات ·{' '}
          {pointPricedAttachments.length} مذكرات)
        </h3>
        <p className="text-xs text-slate-500">
          لتسعير أي محاضرة أو مذكرة بعدد نقاط معين يفتحه الطالب برصيده، حدد خانة "تكلفة الفتح بالنقاط" عند رفع أو تعديل المحاضرة أو المذكرة.
        </p>

        {(pointPricedLectures.length > 0 || pointPricedAttachments.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pointPricedLectures.map((l) => (
              <div
                key={l.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Video className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {l.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  {l.pointsCost} نقطة
                </span>
              </div>
            ))}
            {pointPricedAttachments.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {a.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  {a.pointsCost} نقطة
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
