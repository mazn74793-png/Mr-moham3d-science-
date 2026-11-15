import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  FlaskConical,
  Timer,
  RotateCw,
  CheckCircle2,
  Search,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookMarked,
} from 'lucide-react';

interface FlashCardItem {
  id: string;
  unit: string;
  front: string;
  back: string;
  hint: string;
}

const FLASHCARDS: FlashCardItem[] = [
  {
    id: 'fc_1',
    unit: 'العناصر الانتقالية',
    front: 'لماذا يشذ التوزيع الإلكتروني لعنصري الكروم Cr(24) والنحاس Cu(29)؟',
    back: 'لأن الذرة تكون أقل طاقة وأكثر استقراراً عندما يكون المستوى الفرعي 3d نصف ممتلئ (3d⁵ في الكروم) أو تام الامتلاء (3d¹⁰ في النحاس).',
    hint: 'استقرار 3d⁵ و 3d¹⁰',
  },
  {
    id: 'fc_2',
    unit: 'العناصر الانتقالية',
    front: 'لماذا يسهل أكسدة أيون الحديد الثنائي Fe²⁺ إلى الحديد الثلاثي Fe³⁺؟',
    back: 'لأن Fe²⁺ توزيعه [Ar] 3d⁶ أما Fe³⁺ فتوزيعه [Ar] 3d⁵ نصف الممتلئ الأكثر استقراراً، فيسير التفاعل نحو الاستقرار.',
    hint: 'مقارنة 3d⁶ بـ 3d⁵',
  },
  {
    id: 'fc_3',
    unit: 'العناصر الانتقالية',
    front: 'ما الفرق بين سبيكة الحديد والكربون (البينية) وسبيكة السيمنتيت Fe₃C؟',
    back: 'سبيكة الحديد والكربون (الصلب) بينية تتكون بخلط مصهورين دون اتحاد كيميائي، بينما السيمنتيت سبيكة بينفلزية ناتجة عن اتحاد كيميائي لا يخضع لقوانين التكافؤ.',
    hint: 'أنواع السبائك',
  },
  {
    id: 'fc_4',
    unit: 'العناصر الانتقالية',
    front: 'ما ناتج تسخين أوكسالات الحديد II بمعزل عن الهواء vs في الهواء؟',
    back: 'بمعزل عن الهواء يعطي أكسيد الحديد الثنائي FeO (+ CO + CO₂)، أما في الهواء فيتأكسد FeO إلى أكسيد الحديد الثلاثي الأحمر Fe₂O₃.',
    hint: 'تفاعلات أوكسالات الحديد',
  },
  {
    id: 'fc_5',
    unit: 'التحليل الكيميائي',
    front: 'كيف تفرق عملياً بين ملح كبريتات الصوديوم Na₂SO₄ وفوسفات الصوديوم Na₃PO₄؟',
    back: 'بإضافة محلول كلوريد الباريوم BaCl₂: يتكون راسب أبيض مع كليهما، راسب BaSO₄ لا يذوب في HCl المخفف، بينما راسب Ba₃(PO₄)₂ يذوب فيه.',
    hint: 'مجموعة كلوريد الباريوم',
  },
  {
    id: 'fc_6',
    unit: 'التحليل الكيميائي',
    front: 'كيف تميز بين هيدروكسيد الصوديوم NaOH وهيدروكسيد الأمونيوم NH₄OH مع أملاح Al³⁺؟',
    back: 'يتكون راسب أبيض جيلاتيني من Al(OH)₃ مع كليهما، لكنه يذوب في الزيادة من NaOH (لتكوين ميتا ألومينات الصوديوم) ولا يذوب في زيادة NH₄OH.',
    hint: 'خواص هيدروكسيد الألومنيوم المتردد',
  },
  {
    id: 'fc_7',
    unit: 'التحليل الكيميائي',
    front: 'ما هي ألوان رواسب هاليدات الفضة (AgCl, AgBr, AgI) مع محلول النشادر المركز؟',
    back: 'AgCl أبيض يذوب سريعاً · AgBr أبيض مصفر يذوب ببطء · AgI أصفر لا يذوب في محلول النشادر.',
    hint: 'اختبار نترات الفضة',
  },
  {
    id: 'fc_8',
    unit: 'الاتزان الكيميائي',
    front: 'ما هي العوامل التي تغير قيمة ثابت الاتزان Kc أو Kp؟',
    back: 'درجة الحرارة فقط! تغير التركيز أو الضغط أو إضافة عامل حفاز يغير موضع الاتزان أو سرعته ولكنه لا يغير قيمة Kc إطلاقاً.',
    hint: 'قاعدة لوشاتيليه',
  },
  {
    id: 'fc_9',
    unit: 'الاتزان الكيميائي',
    front: 'متى تكون قيمة Kp مساوية لقيمة Kc في تفاعل غازي متزن؟',
    back: 'عندما يتساوى مجموع عدد مولات الغازات الناتجة مع مجموع عدد مولات الغازات المتفاعلة (Δn = 0).',
    hint: 'العلاقة بين Kc و Kp',
  },
  {
    id: 'fc_10',
    unit: 'الكهربية',
    front: 'اشرح قاعدة شحن وتفريغ خلية ثانوية (مثل بطارية الرصاص الحامضية)',
    back: 'أثناء التفريغ تعمل كخلية جلفانية تلقائية (الأنود سالب)، وأثناء الشحن تُوصل بمصدر خارجي أعلى قليلاً من جهدها فتعمل كخلية تحليلية وتنعكس التفاعلات.',
    hint: 'بطارية السيارة',
  },
  {
    id: 'fc_11',
    unit: 'الكهربية',
    front: 'اذكر قانون فاراداي العام للتحليل الكهربائي',
    back: 'عند مرور 1 فاراداي (96,500 كولوم) يترسب أو يتصاعد الكتلة المكافئة الجرامية للمادة عند الأقطاب (الكتلة الذرية ÷ التكافؤ).',
    hint: 'قوانين فاراداي',
  },
  {
    id: 'fc_12',
    unit: 'الكيمياء العضوية',
    front: 'كيف تحصل على حمض الأسيتيك من الإيثين (الإيثيلين)؟',
    back: 'هيدرة حفزية للإيثين في وجود H₂SO₄ عند 110°C لإنتاج الإيثانول، ثم أكسدة تامة للإيثانول بواسطة KMnO₄ المحمضة.',
    hint: 'تحويلات الهيدروكربونات',
  },
  {
    id: 'fc_13',
    unit: 'الكيمياء العضوية',
    front: 'كيف تميز بين الفينول وحمض الأسيتيك (أو الإيثانول)؟',
    back: 'الفينول يتفاعل مع FeCl₃ معطياً لوناً بنفسجياً، ومع ماء البروم معطياً راسباً أبيض، بينما يتفاعل الحمض مع Na₂CO₃ مع تصاعد فوران غاز CO₂.',
    hint: 'كشف الفينولات والأحماض',
  },
  {
    id: 'fc_14',
    unit: 'الكيمياء العضوية',
    front: 'اشرح قاعدة ماركونيكوف عند إضافة HBr إلى البروبين',
    back: 'عند إضافة متفاعل غير متماثل (HBr) إلى ألكين غير متماثل، يُضاف الهيدروجين لذرة الكربون الغنية بالهيدروجين والأيون السالب للأقل هيدروجيناً فينتج 2-بروموبروبان.',
    hint: 'إضافة الألكينات',
  },
];

interface EquationEntry {
  id: string;
  unit: string;
  title: string;
  equation: string;
  reagentNote: string;
  visualText: string;
  swatchHex: string;
}

const EQUATION_BANK: EquationEntry[] = [
  {
    id: 'eq_1',
    unit: 'الحديد وأكاسيده',
    title: 'أكسدة أوكسالات الحديد II وتسخينها',
    equation: '(COO)₂Fe  ──(معزل عن الهواء)──▶  FeO + CO↑ + CO₂↑',
    reagentNote: 'إذا تم التسخين في الهواء يتأكسد FeO إلى Fe₂O₃ الأحمر',
    visualText: 'FeO أسود → Fe₂O₃ أحمر داكن',
    swatchHex: '#991b1b',
  },
  {
    id: 'eq_2',
    unit: 'الحديد وأكاسيده',
    title: 'اختزال الهيماتيت في الفرن العالي',
    equation: 'Fe₂O₃ + 3CO  ──(> 700°C)──▶  2Fe + 3CO₂↑',
    reagentNote: 'العامل المختزل هو أول أكسيد الكربون CO الناتج من فحم الكوك',
    visualText: 'اختزال كامل إلى حديد منصهر',
    swatchHex: '#475569',
  },
  {
    id: 'eq_3',
    unit: 'الحديد وأكاسيده',
    title: 'تفاعل أكسيد الحديد المغناطيسي مع حمض مركز ساخن',
    equation: 'Fe₃O₄ + 4H₂SO₄(conc)  ──Δ──▶  FeSO₄ + Fe₂(SO₄)₃ + 4H₂O',
    reagentNote: 'يُثبت أن Fe₃O₄ أكسيد مختلط لأنه يعطي أملاح الحديد II و III معاً',
    visualText: 'خليط أخضر باهت (II) + أصفر باهت (III)',
    swatchHex: '#ca8a04',
  },
  {
    id: 'eq_4',
    unit: 'التحليل الكيفي',
    title: 'الكشف عن كاتيون الحديد الثلاثي Fe³⁺',
    equation: 'FeCl₃ + 3NH₄OH  ──▶  Fe(OH)₃↓ + 3NH₄Cl',
    reagentNote: 'كاشف المجموعة التحليلية الثالثة، يذوب الراسب في الأحماض المخففة',
    visualText: 'راسب جيلاتيني بني محمر',
    swatchHex: '#7c2d12',
  },
  {
    id: 'eq_5',
    unit: 'التحليل الكيفي',
    title: 'الكشف عن كاتيون النحاس الثنائي Cu²⁺',
    equation: 'CuSO₄ + H₂S  ──(HCl وسط حمضي)──▶  CuS↓ + H₂SO₄',
    reagentNote: 'كاشف المجموعة التحليلية الثانية، يذوب الراسب في حمض النيتريك الساخن',
    visualText: 'راسب أسود من كبريتيد النحاس II',
    swatchHex: '#0f172a',
  },
  {
    id: 'eq_6',
    unit: 'التحليل الكيفي',
    title: 'تجربة الحلقة البنية للكشف عن أنيون النترات NO₃⁻',
    equation: '2NaNO₃ + 6FeSO₄ + 4H₂SO₄  ──▶  3Fe₂(SO₄)₃ + Na₂SO₄ + 4H₂O + 2NO↑',
    reagentNote: 'يتحد NO مع وفرة FeSO₄ البارد مكوناً مركب الحلقة البنية FeSO₄·NO (تزول بالرج أو التسخين)',
    visualText: 'حلقة بنية عند السطح الفاصل',
    swatchHex: '#78350f',
  },
  {
    id: 'eq_7',
    unit: 'التحليل الكيفي',
    title: 'تمييز أنيون الثيوكبريتات S₂O₃²⁻',
    equation: 'Na₂S₂O₃ + 2HCl  ──▶  2NaCl + H₂O + SO₂↑ + S↓',
    reagentNote: 'يتصاعد غاز يخضر ورقة ثاني كرومات البوتاسيوم + يعلق الكبريت الأصفر',
    visualText: 'معلق أصفر + إخضرار الكرومات',
    swatchHex: '#eab308',
  },
  {
    id: 'eq_8',
    unit: 'الكيمياء العضوية',
    title: 'تفاعل باير للكشف عن الرابطة المزدوجة',
    equation: 'CH₂=CH₂ + H₂O + [O]  ──(KMnO₄ / قلوي)──▶  HO-CH₂-CH₂-OH',
    reagentNote: 'يتكون إيثيلين جليكول (مانع تجمد الماء بالسيارات) ويزول اللون البنفسجي',
    visualText: 'زوال اللون البنفسجي لـ KMnO₄',
    swatchHex: '#9333ea',
  },
  {
    id: 'eq_9',
    unit: 'الكيمياء العضوية',
    title: 'تحضير الإستر وتفاعله (الأسترة)',
    equation: 'CH₃COOH + C₂H₅OH  ⇌  (H₂SO₄ conc)  CH₃COOC₂H₅ + H₂O',
    reagentNote: 'يمتص حمض الكبريتيك الماء لمنع التفاعل العكسي؛ يتميز برائحة الفاكهة الذكية',
    visualText: 'إستر أسيتات الإيثيل (رائحة ذكية)',
    swatchHex: '#0d9488',
  },
  {
    id: 'eq_10',
    unit: 'الكهربية',
    title: 'التفاعل الكلي في بطارية الرصاص الحامضية',
    equation: 'Pb + PbO₂ + 4H⁺ + 2SO₄²⁻  ⇌ (تفريغ / شحن) ⇌  2PbSO₄↓ + 2H₂O',
    reagentNote: 'EMF للخلية الواحدة ≈ 2.05V والبطارية 6 خلايا متصلة على التوالي ≈ 12V',
    visualText: 'تقل كثافة الحمض بالتفريغ (أقل من 1.2)',
    swatchHex: '#334155',
  },
];

interface StudyLabTabProps {
  studentId?: string;
}

export const StudyLabTab: React.FC<StudyLabTabProps> = ({ studentId }) => {
  const storageSuffix = studentId || 'guest';
  const [subMode, setSubMode] = useState<'flashcards' | 'equations' | 'timer'>('flashcards');

  // Flashcards State
  const [unitFilter, setUnitFilter] = useState<string>('الكل');
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`mm_study_${storageSuffix}_mastered`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`mm_study_${storageSuffix}_mastered`, JSON.stringify(masteredIds));
    } catch {}
  }, [masteredIds, storageSuffix]);

  const cardUnits = useMemo(
    () => ['الكل', ...Array.from(new Set(FLASHCARDS.map((c) => c.unit)))],
    []
  );

  const visibleCards = useMemo(
    () => (unitFilter === 'الكل' ? FLASHCARDS : FLASHCARDS.filter((c) => c.unit === unitFilter)),
    [unitFilter]
  );

  const safeCardIndex = Math.min(cardIdx, Math.max(0, visibleCards.length - 1));
  const currentCard = visibleCards[safeCardIndex] || FLASHCARDS[0];
  const isCurrentMastered = masteredIds.includes(currentCard.id);
  const masteryPct = Math.round((masteredIds.length / FLASHCARDS.length) * 100);

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Equations Search State
  const [eqQuery, setEqQuery] = useState('');
  const [eqUnit, setEqUnit] = useState('الكل');

  const eqUnits = useMemo(
    () => ['الكل', ...Array.from(new Set(EQUATION_BANK.map((e) => e.unit)))],
    []
  );

  const filteredEquations = useMemo(() => {
    const q = eqQuery.trim().toLowerCase();
    return EQUATION_BANK.filter((eq) => {
      if (eqUnit !== 'الكل' && eq.unit !== eqUnit) return false;
      if (!q) return true;
      return (
        eq.title.toLowerCase().includes(q) ||
        eq.equation.toLowerCase().includes(q) ||
        eq.reagentNote.toLowerCase().includes(q) ||
        eq.visualText.toLowerCase().includes(q)
      );
    });
  }, [eqQuery, eqUnit]);

  // Pomodoro Timer State
  const [focusDurationMin, setFocusDurationMin] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [focusGoal, setFocusGoal] = useState<string>('مراجعة معادلات الباب الأول وحل شيت');
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(`mm_study_${storageSuffix}_pomodoro`) || '0') || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setCompletedSessions((c) => {
            const next = c + 1;
            try {
              localStorage.setItem(`mm_study_${storageSuffix}_pomodoro`, String(next));
            } catch {}
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, storageSuffix]);

  const selectTimerPreset = (mins: number) => {
    setTimerRunning(false);
    setFocusDurationMin(mins);
    setSecondsLeft(mins * 60);
  };

  const timerMins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const timerSecs = String(secondsLeft % 60).padStart(2, '0');
  const timerPct =
    focusDurationMin > 0
      ? Math.min(100, Math.round(((focusDurationMin * 60 - secondsLeft) / (focusDurationMin * 60)) * 100))
      : 0;

  return (
    <div className="space-y-4">
      {/* Tool Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSubMode('flashcards')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            subMode === 'flashcards'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>بطاقات المراجعة ({FLASHCARDS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubMode('equations')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            subMode === 'equations'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4 shrink-0" />
          <span>بنك المعادلات والرواسب</span>
        </button>

        <button
          type="button"
          onClick={() => setSubMode('timer')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            subMode === 'timer'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Timer className="w-4 h-4 shrink-0" />
          <span>مؤقت التركيز للمذاكرة</span>
        </button>
      </div>

      {/* 1. FLASHCARDS ENGINE */}
      {subMode === 'flashcards' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                بطاقات المراجعة السريعة (Flashcards)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                اضغط على البطاقة لإظهار الإجابة النموذجية ثم حدد مدى إتقانك لها.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                الإتقان: <strong className="text-teal-600 dark:text-teal-400">{masteredIds.length}</strong> / {FLASHCARDS.length} ({masteryPct}%)
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${masteryPct}%` }}
            />
          </div>

          {/* Unit Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {cardUnits.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUnitFilter(u);
                  setCardIdx(0);
                  setIsFlipped(false);
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  unitFilter === u
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Interactive Card Stage */}
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className={`w-full min-h-[220px] sm:min-h-[250px] p-6 sm:p-8 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isFlipped
                ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-teal-400'
            }`}
          >
            <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
              <span>{currentCard.unit}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {safeCardIndex + 1} / {visibleCards.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{isFlipped ? 'الإجابة النموذجية' : 'السؤال الامتحاني'}</span>
            </div>

            <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed max-w-2xl">
              {isFlipped ? currentCard.back : currentCard.front}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>
                {isFlipped ? 'اضغط للعودة للسؤال' : `تلميح: ${currentCard.hint} · اضغط لكشف الإجابة`}
              </span>
            </div>
          </button>

          {/* Card Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCardIdx((prev) => (prev - 1 + visibleCards.length) % visibleCards.length);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCardIdx((prev) => (prev + 1) % visibleCards.length);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                التالي
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleMastered(currentCard.id)}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                isCurrentMastered
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCurrentMastered ? 'تم الإتقان (اضغط للإلغاء)' : 'أتقنت هذه المعلومة'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. EQUATIONS & PRECIPITATE COLORS ENCYCLOPEDIA */}
      {subMode === 'equations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              بنك المعادلات الموزونة وألوان الرواسب
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              ابحث عن أي معادلة أو كاشف أو لون راسب لتراجع أهم معادلات المنهج بسرعة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={eqQuery}
                onChange={(e) => setEqQuery(e.target.value)}
                placeholder="ابحث بـ Fe3O4 أو الحلقة البنية أو باير..."
                className="w-full min-h-[44px] pr-10 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {eqUnits.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setEqUnit(u)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    eqUnit === u
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredEquations.map((eq) => (
              <div
                key={eq.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-teal-700 dark:text-teal-400">{eq.unit}</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                        style={{ backgroundColor: eq.swatchHex }}
                      />
                      <span>{eq.visualText}</span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {eq.title}
                  </h3>

                  <div
                    dir="ltr"
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-teal-300 overflow-x-auto text-center"
                  >
                    {eq.equation}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {eq.reagentNote}
                </p>
              </div>
            ))}

            {filteredEquations.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-slate-500">
                لا توجد معادلات مطابقة لبحثك. جرّب كلمة أخرى مثل Fe أو الحديد أو الكبريت.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SMART STUDY FOCUS TIMER (POMODORO) */}
      {subMode === 'timer' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                مؤقت التركيز للمذاكرة (Pomodoro)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                نظّم وقت مذاكرة الكيمياء وحل المسائل بدون تشتيت وتابع عدد الجلسات المنجزة.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3.5 py-2 rounded-xl tabular-nums">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>الجلسات المنجزة: {completedSessions}</span>
            </div>
          </div>

          <div className="max-w-lg mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-5 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { mins: 25, label: '25 د تركيز' },
                { mins: 45, label: '45 د مراجعة عميقة' },
                { mins: 5, label: '5 د راحة' },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  onClick={() => selectTimerPreset(preset.mins)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    focusDurationMin === preset.mins
                      ? 'bg-teal-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="text-5xl sm:text-6xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-wider" dir="ltr">
              {timerMins}:{timerSecs}
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${timerPct}%` }}
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-teal-600" />
                <span>هدف هذه الجلسة:</span>
              </label>
              <input
                type="text"
                value={focusGoal}
                onChange={(e) => setFocusGoal(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTimerRunning((prev) => !prev)}
                className="min-h-[48px] px-7 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'إيقاف مؤقت' : 'بدء الجلسة'}</span>
              </button>

              <button
                type="button"
                onClick={() => selectTimerPreset(focusDurationMin)}
                aria-label="إعادة ضبط المؤقت"
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
