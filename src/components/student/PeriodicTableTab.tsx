import React, { useState } from 'react';

const TRANSITION_ELEMENTS = [
  { sym: 'Sc', num: 21, name: 'سكانديوم', conf: '[Ar] 4s² 3d¹', ox: '+3', note: 'عنصر نادر شديد الصلابة وخفيف الوزن، يُستخدم في سبائك الطائرات المقاتلة.' },
  { sym: 'Ti', num: 22, name: 'تيتانيوم', conf: '[Ar] 4s² 3d²', ox: '+2, +3, +4', note: 'لا يرفضه الجسم البشري، يُستخدم في زراعة الأسنان والمفاصل الصناعية.' },
  { sym: 'V', num: 23, name: 'فاناديوم', conf: '[Ar] 4s² 3d³', ox: '+2, +3, +4, +5', note: 'يُضاف للصلب لصناعة زنبركات السيارات لمقاومة التآكل والصلابة العالية.' },
  { sym: 'Cr', num: 24, name: 'كروم', conf: '[Ar] 4s¹ 3d⁵ (شاذ)', ox: '+2, +3, +6', note: 'شاذ في التوزيع الإلكتروني لأن المستوى 3d نصف ممتلئ يكون أكثر استقراراً.' },
  { sym: 'Mn', num: 25, name: 'منجنيز', conf: '[Ar] 4s² 3d⁵', ox: '+2 إلى +7', note: 'هش جداً في حالته النقية لذلك يُستخدم دائماً في صورة سبائك مثل سبيكة خطوط السكك الحديدية.' },
  { sym: 'Fe', num: 26, name: 'حديد', conf: '[Ar] 4s² 3d⁶', ox: '+2, +3', note: 'عصب الصناعات الثقيلة وأكثر عناصر السلسلة الانتقالية الأولى استخداماً.' },
  { sym: 'Co', num: 27, name: 'كوبالت', conf: '[Ar] 4s² 3d⁷', ox: '+2, +3', note: 'يشبه الحديد في القابلية للتمغنط، ونظيره المشع الكوبالت 60 يُستخدم في حفظ الأغذية والكشف عن الأورام.' },
  { sym: 'Ni', num: 28, name: 'نيكل', conf: '[Ar] 4s² 3d⁸', ox: '+2, +3', note: 'المجال التطبيقي: النيكل المجزأ عامل حفاز في هدرجة الزيوت النباتية.' },
  { sym: 'Cu', num: 29, name: 'نحاس', conf: '[Ar] 4s¹ 3d¹⁰ (شاذ)', ox: '+1, +2', note: 'شاذ في التوزيع الإلكتروني لأن المستوى 3d تام الامتلاء يمنح الذرة استقراراً أعلى.' },
  { sym: 'Zn', num: 30, name: 'خارصين', conf: '[Ar] 4s² 3d¹⁰', ox: '+2 فقط', note: 'يُستخدم في جلفنة المعادن لحمايتها من الصدأ (ليس عنصراً انتقالياً لانشغال 3d التام).' },
];

export const PeriodicTableTab: React.FC = () => {
  const [selectedElementSym, setSelectedElementSym] = useState<string>('Cr');

  const inspectedElement =
    TRANSITION_ELEMENTS.find((el) => el.sym === selectedElementSym) || TRANSITION_ELEMENTS[0];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            مفاتيح السلسلة الانتقالية الأولى (3d)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            اضغط على أي عنصر لعرض التوزيع الإلكتروني وحالات التأكسد والملاحظة الامتحانية.
          </p>
        </div>

        {/* Active Element Inspector */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-teal-600 text-white flex flex-col items-center justify-center shrink-0 font-mono tabular-nums">
              <span className="text-[10px] opacity-80 leading-none">{inspectedElement.num}</span>
              <span className="text-xl font-bold leading-tight">{inspectedElement.sym}</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {inspectedElement.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono dir-ltr text-right">
                {inspectedElement.conf} · حالات التأكسد: {inspectedElement.ox}
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-md">
            {inspectedElement.note}
          </p>
        </div>

        {/* Interactive Elements Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {TRANSITION_ELEMENTS.map((elem) => {
            const active = elem.sym === inspectedElement.sym;
            return (
              <button
                key={elem.sym}
                type="button"
                onClick={() => setSelectedElementSym(elem.sym)}
                className={`min-h-[96px] p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-1 ring-teal-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                }`}
              >
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">{elem.num}</span>
                <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                  {elem.sym}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {elem.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
