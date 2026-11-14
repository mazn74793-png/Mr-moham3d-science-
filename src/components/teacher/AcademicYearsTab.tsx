import React, { useState } from 'react';
import { GraduationCap, Check, Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { GradeItem, SiteConfig } from '../../types/siteConfig';

interface AcademicYearsTabProps {
  resolvedGrades: GradeItem[];
  siteForm: SiteConfig;
  setSiteForm: React.Dispatch<React.SetStateAction<SiteConfig>>;
  onSaveSiteConfig: (config: SiteConfig) => Promise<boolean> | boolean | void;
}

export const AcademicYearsTab: React.FC<AcademicYearsTabProps> = ({
  resolvedGrades,
  siteForm,
  setSiteForm,
  onSaveSiteConfig,
}) => {
  const [selectedAcademicTab, setSelectedAcademicTab] = useState<string>(
    resolvedGrades[0]?.id || 'first'
  );
  const [showAddGradeForm, setShowAddGradeForm] = useState(false);
  const [newGradeBadgeAr, setNewGradeBadgeAr] = useState('');
  const [newGradeBadgeEn, setNewGradeBadgeEn] = useState('');
  const [newGradeTitleAr, setNewGradeTitleAr] = useState('');
  const [newGradeYearLabelAr, setNewGradeYearLabelAr] = useState('دفعة 2026');
  const [newGradeDescAr, setNewGradeDescAr] = useState('');
  const [newGradeIsPopular, setNewGradeIsPopular] = useState(false);
  const [gradeFormNotice, setGradeFormNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleteGradeConfirmId, setDeleteGradeConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const activeAcademicGrade =
    resolvedGrades.find((g) => g.id === selectedAcademicTab) || resolvedGrades[0];

  const handleUpdateGradeItem = (gradeId: string, patch: Partial<GradeItem>) => {
    const nextGrades = resolvedGrades.map((g) => (g.id === gradeId ? { ...g, ...patch } : g));
    const nextConfig: SiteConfig = { ...siteForm, grades: nextGrades };

    if (gradeId === 'first') {
      if (patch.titleAr !== undefined) nextConfig.gradeFirstTitleAr = patch.titleAr;
      if (patch.titleEn !== undefined) nextConfig.gradeFirstTitleEn = patch.titleEn;
      if (patch.badgeAr !== undefined) nextConfig.gradeFirstBadgeAr = patch.badgeAr;
      if (patch.descAr !== undefined) nextConfig.gradeFirstDescAr = patch.descAr;
    } else if (gradeId === 'second') {
      if (patch.titleAr !== undefined) nextConfig.gradeSecondTitleAr = patch.titleAr;
      if (patch.titleEn !== undefined) nextConfig.gradeSecondTitleEn = patch.titleEn;
      if (patch.badgeAr !== undefined) nextConfig.gradeSecondBadgeAr = patch.badgeAr;
      if (patch.descAr !== undefined) nextConfig.gradeSecondDescAr = patch.descAr;
    } else if (gradeId === 'third') {
      if (patch.titleAr !== undefined) nextConfig.gradeThirdTitleAr = patch.titleAr;
      if (patch.titleEn !== undefined) nextConfig.gradeThirdTitleEn = patch.titleEn;
      if (patch.badgeAr !== undefined) nextConfig.gradeThirdBadgeAr = patch.badgeAr;
      if (patch.descAr !== undefined) nextConfig.gradeThirdDescAr = patch.descAr;
    }

    setSiteForm(nextConfig);
  };

  const handleAddNewGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setGradeFormNotice(null);

    if (!newGradeBadgeAr.trim() || !newGradeTitleAr.trim()) {
      setGradeFormNotice({
        type: 'error',
        message: 'يرجى إدخال اسم السنة الدراسية والعنوان بالعربية.',
      });
      return;
    }

    const newId = `grade_${Date.now()}`;
    const newItem: GradeItem = {
      id: newId,
      badgeAr: newGradeBadgeAr.trim(),
      badgeEn: newGradeBadgeEn.trim() || newGradeBadgeAr.trim(),
      titleAr: newGradeTitleAr.trim(),
      titleEn: newGradeTitleAr.trim(),
      yearLabelAr: newGradeYearLabelAr.trim() || 'دفعة 2026',
      yearLabelEn: 'Class of 2026',
      descAr:
        newGradeDescAr.trim() ||
        `منهج ${newGradeBadgeAr.trim()} المتكامل للمحاضرات والامتحانات والمذكرات.`,
      descEn: '',
      isPopular: newGradeIsPopular,
    };

    const nextGrades = [...resolvedGrades, newItem];
    const updatedConfig: SiteConfig = { ...siteForm, grades: nextGrades };

    setSaving(true);
    try {
      const saved = await onSaveSiteConfig(updatedConfig);
      if (saved === false) {
        setGradeFormNotice({
          type: 'error',
          message: 'تعذر حفظ السنة الجديدة في قاعدة البيانات السحابية.',
        });
        return;
      }

      setSiteForm(updatedConfig);
      setSelectedAcademicTab(newId);
      setShowAddGradeForm(false);
      setNewGradeBadgeAr('');
      setNewGradeBadgeEn('');
      setNewGradeTitleAr('');
      setNewGradeYearLabelAr('دفعة 2026');
      setNewGradeDescAr('');
      setNewGradeIsPopular(false);
      setGradeFormNotice({
        type: 'success',
        message: `تمت إضافة السنة الدراسية (${newItem.badgeAr}) وحفظها في الرئيسية بنجاح! 🎓`,
      });
      setTimeout(() => setGradeFormNotice(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomGrade = async (gradeId: string) => {
    if (resolvedGrades.length <= 1) {
      setGradeFormNotice({
        type: 'error',
        message: 'يجب الإبقاء على سنة دراسية واحدة على الأقل.',
      });
      return;
    }
    const nextGrades = resolvedGrades.filter((g) => g.id !== gradeId);
    const updatedConfig: SiteConfig = { ...siteForm, grades: nextGrades };
    setDeleteGradeConfirmId(null);

    const saved = await onSaveSiteConfig(updatedConfig);
    if (saved === false) {
      setGradeFormNotice({
        type: 'error',
        message: 'تعذر حذف السنة من قاعدة البيانات السحابية.',
      });
      return;
    }

    setSiteForm(updatedConfig);
    setSelectedAcademicTab(nextGrades[0]?.id || 'first');
    setGradeFormNotice({ type: 'success', message: 'تم حذف السنة الدراسية بنجاح.' });
    setTimeout(() => setGradeFormNotice(null), 3500);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await onSaveSiteConfig(siteForm);
      if (saved === false) {
        setGradeFormNotice({
          type: 'error',
          message: 'تعذر حفظ التعديلات على السحابة.',
        });
        return;
      }
      setGradeFormNotice({
        type: 'success',
        message: 'تم تطبيق أسماء السنوات والحفظ في السحابة بنجاح!',
      });
      setTimeout(() => setGradeFormNotice(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-500 text-white">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
              إدارة وتخصيص السنوات الدراسية 🎓
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            أضف سنوات دراسية جديدة أو عدّل أسماء ووصف أي سنة، وستنعكس فوراً في الرئيسية وبوابة الطالب.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddGradeForm((prev) => !prev);
            setGradeFormNotice(null);
          }}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          {showAddGradeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddGradeForm ? 'إغلاق نموذج الإضافة' : 'إضافة سنة دراسية جديدة +'}</span>
        </button>
      </div>

      {gradeFormNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-2 ${
            gradeFormNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{gradeFormNotice.message}</span>
          <button
            type="button"
            onClick={() => setGradeFormNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showAddGradeForm && (
        <form
          onSubmit={handleAddNewGrade}
          className="p-6 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border-2 border-teal-400/50 space-y-4"
        >
          <div className="font-bold text-sm text-teal-900 dark:text-teal-200 font-kufi flex items-center gap-2">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>إضافة سنة أو مرحلة دراسية جديدة للمنصة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                اسم السنة / الشارة بالعربية *
              </label>
              <input
                type="text"
                required
                value={newGradeBadgeAr}
                onChange={(e) => setNewGradeBadgeAr(e.target.value)}
                placeholder="مثال: الشهادة الإعدادية أو مراجعات الأزهر"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                الاسم بالإنجليزية (اختياري)
              </label>
              <input
                type="text"
                value={newGradeBadgeEn}
                onChange={(e) => setNewGradeBadgeEn(e.target.value)}
                placeholder="e.g. Prep 3 Science"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 dir-ltr text-right"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                عنوان الكارت الرئيسي بالعربية *
              </label>
              <input
                type="text"
                required
                value={newGradeTitleAr}
                onChange={(e) => setNewGradeTitleAr(e.target.value)}
                placeholder="مثال: تالتة إعدادي · التأسيس المتكامل في العلوم"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                وسم الدفعة (Badge Year Label)
              </label>
              <input
                type="text"
                value={newGradeYearLabelAr}
                onChange={(e) => setNewGradeYearLabelAr(e.target.value)}
                placeholder="مثال: دفعة 2026"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              وصف السنة في الصفحة الرئيسية
            </label>
            <textarea
              rows={2}
              value={newGradeDescAr}
              onChange={(e) => setNewGradeDescAr(e.target.value)}
              placeholder="وصف مختصر لما يشمله الكورس والمنهج لهذه السنة..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newGradeIsPopular}
                onChange={(e) => setNewGradeIsPopular(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>تمييز كسنة رئيسية / شهادة (Popular 🔥)</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ وإضافة السنة للمنصة'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Dynamic Grades Switcher Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {resolvedGrades.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setSelectedAcademicTab(g.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAcademicGrade?.id === g.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{g.badgeAr}</span>
            {g.isPopular && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>
        ))}
      </div>

      {activeAcademicGrade && (
        <form onSubmit={handleSaveChanges} className="space-y-6">
          <div className="p-6 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-sm text-indigo-900 dark:text-indigo-200 font-kufi flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>تعديل بيانات: {activeAcademicGrade.badgeAr}</span>
              </div>

              {resolvedGrades.length > 1 &&
                (deleteGradeConfirmId === activeAcademicGrade.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-rose-600">تأكيد الحذف؟</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomGrade(activeAcademicGrade.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      نعم احذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteGradeConfirmId(null)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteGradeConfirmId(activeAcademicGrade.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف هذه السنة</span>
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  العنوان بالعربية
                </label>
                <input
                  type="text"
                  value={activeAcademicGrade.titleAr || ''}
                  onChange={(e) =>
                    handleUpdateGradeItem(activeAcademicGrade.id, { titleAr: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  العنوان بالإنجليزية (Title En)
                </label>
                <input
                  type="text"
                  value={activeAcademicGrade.titleEn || ''}
                  onChange={(e) =>
                    handleUpdateGradeItem(activeAcademicGrade.id, { titleEn: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الشارة العلوية / اسم الصف (Badge)
                </label>
                <input
                  type="text"
                  value={activeAcademicGrade.badgeAr || ''}
                  onChange={(e) =>
                    handleUpdateGradeItem(activeAcademicGrade.id, { badgeAr: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  وسم الدفعة (مثل: دفعة 2026)
                </label>
                <input
                  type="text"
                  value={activeAcademicGrade.yearLabelAr || ''}
                  onChange={(e) =>
                    handleUpdateGradeItem(activeAcademicGrade.id, { yearLabelAr: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                الوصف والشرح المختصر للكارت في الرئيسية
              </label>
              <textarea
                rows={3}
                value={activeAcademicGrade.descAr || ''}
                onChange={(e) =>
                  handleUpdateGradeItem(activeAcademicGrade.id, { descAr: e.target.value })
                }
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={Boolean(activeAcademicGrade.isPopular)}
                onChange={(e) =>
                  handleUpdateGradeItem(activeAcademicGrade.id, { isPopular: e.target.checked })
                }
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span>تمييز هذه السنة كشهادة رئيسية / مميزة في الواجهة</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ تعديلات السنوات في الرئيسية'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
