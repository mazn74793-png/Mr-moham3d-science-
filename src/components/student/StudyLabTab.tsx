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
import { useLanguage } from '../../context/LanguageContext';

interface FlashCardItem {
  id: string;
  unitKey: string;
  unitAr: string;
  unitEn: string;
  frontAr: string;
  frontEn: string;
  backAr: string;
  backEn: string;
  hintAr: string;
  hintEn: string;
}

const FLASHCARDS: FlashCardItem[] = [
  {
    id: 'fc_1',
    unitKey: 'transition',
    unitAr: 'العناصر الانتقالية',
    unitEn: 'Transition Elements',
    frontAr: 'لماذا يشذ التوزيع الإلكتروني لعنصري الكروم Cr(24) والنحاس Cu(29)؟',
    frontEn: 'Why do Chromium Cr(24) and Copper Cu(29) have anomalous electron configurations?',
    backAr: 'لأن الذرة تكون أقل طاقة وأكثر استقراراً عندما يكون المستوى الفرعي 3d نصف ممتلئ (3d⁵ في الكروم) أو تام الامتلاء (3d¹⁰ في النحاس).',
    backEn: 'Because the atom has lower energy and higher stability when the 3d sublevel is half-filled (3d⁵ in Cr) or completely filled (3d¹⁰ in Cu).',
    hintAr: 'استقرار 3d⁵ و 3d¹⁰',
    hintEn: '3d⁵ & 3d¹⁰ stability',
  },
  {
    id: 'fc_2',
    unitKey: 'transition',
    unitAr: 'العناصر الانتقالية',
    unitEn: 'Transition Elements',
    frontAr: 'لماذا يسهل أكسدة أيون الحديد الثنائي Fe²⁺ إلى الحديد الثلاثي Fe³⁺؟',
    frontEn: 'Why is Fe²⁺ easily oxidized to Fe³⁺?',
    backAr: 'لأن Fe²⁺ توزيعه [Ar] 3d⁶ أما Fe³⁺ فتوزيعه [Ar] 3d⁵ نصف الممتلئ الأكثر استقراراً، فيسير التفاعل نحو الاستقرار.',
    backEn: 'Fe²⁺ has [Ar] 3d⁶ while Fe³⁺ has the more stable half-filled [Ar] 3d⁵ configuration, driving the reaction toward stability.',
    hintAr: 'مقارنة 3d⁶ بـ 3d⁵',
    hintEn: 'Compare 3d⁶ vs 3d⁵',
  },
  {
    id: 'fc_3',
    unitKey: 'transition',
    unitAr: 'العناصر الانتقالية',
    unitEn: 'Transition Elements',
    frontAr: 'ما الفرق بين سبيكة الحديد والكربون (البينية) وسبيكة السيمنتيت Fe₃C؟',
    frontEn: 'What is the difference between steel (interstitial alloy) and cementite Fe₃C?',
    backAr: 'سبيكة الحديد والكربون (الصلب) بينية تتكون بخلط مصهورين دون اتحاد كيميائي، بينما السيمنتيت سبيكة بينفلزية ناتجة عن اتحاد كيميائي لا يخضع لقوانين التكافؤ.',
    backEn: 'Steel is an interstitial alloy formed physically without chemical bonding, whereas cementite Fe₃C is an intermetallic compound formed chemically that violates normal valence laws.',
    hintAr: 'أنواع السبائك',
    hintEn: 'Alloy types',
  },
  {
    id: 'fc_4',
    unitKey: 'transition',
    unitAr: 'العناصر الانتقالية',
    unitEn: 'Transition Elements',
    frontAr: 'ما ناتج تسخين أوكسالات الحديد II بمعزل عن الهواء مقابل في الهواء؟',
    frontEn: 'What are the products of heating Iron(II) oxalate in air vs. away from air?',
    backAr: 'بمعزل عن الهواء يعطي أكسيد الحديد الثنائي FeO (+ CO + CO₂)، أما في الهواء فيتأكسد FeO إلى أكسيد الحديد الثلاثي الأحمر Fe₂O₃.',
    backEn: 'Away from air it yields black FeO (+ CO + CO₂); in air, FeO oxidizes further into red Iron(III) oxide Fe₂O₃.',
    hintAr: 'تفاعلات أوكسالات الحديد',
    hintEn: 'Iron oxalate pyrolysis',
  },
  {
    id: 'fc_5',
    unitKey: 'analytical',
    unitAr: 'التحليل الكيميائي',
    unitEn: 'Analytical Chemistry',
    frontAr: 'كيف تفرق عملياً بين ملح كبريتات الصوديوم Na₂SO₄ وفوسفات الصوديوم Na₃PO₄؟',
    frontEn: 'How do you distinguish Na₂SO₄ from Na₃PO₄ experimentally?',
    backAr: 'بإضافة محلول كلوريد الباريوم BaCl₂: يتكون راسب أبيض مع كليهما، راسب BaSO₄ لا يذوب في HCl المخفف، بينما راسب Ba₃(PO₄)₂ يذوب فيه.',
    backEn: 'Add BaCl₂ solution: both give a white precipitate. BaSO₄ is insoluble in dilute HCl, whereas Ba₃(PO₄)₂ dissolves in dilute HCl.',
    hintAr: 'مجموعة كلوريد الباريوم',
    hintEn: 'BaCl₂ group test',
  },
  {
    id: 'fc_6',
    unitKey: 'analytical',
    unitAr: 'التحليل الكيميائي',
    unitEn: 'Analytical Chemistry',
    frontAr: 'كيف تميز بين هيدروكسيد الصوديوم NaOH وهيدروكسيد الأمونيوم NH₄OH مع أملاح Al³⁺؟',
    frontEn: 'How can you differentiate NaOH and NH₄OH using an Al³⁺ salt?',
    backAr: 'يتكون راسب أبيض جيلاتيني من Al(OH)₃ مع كليهما، لكنه يذوب في الزيادة من NaOH (لتكوين ميتا ألومينات الصوديوم) ولا يذوب في زيادة NH₄OH.',
    backEn: 'Both produce a white gelatinous Al(OH)₃ precipitate, which dissolves in excess NaOH (forming sodium meta-aluminate) but not in excess NH₄OH.',
    hintAr: 'خواص هيدروكسيد الألومنيوم المتردد',
    hintEn: 'Amphoteric Al(OH)₃',
  },
  {
    id: 'fc_7',
    unitKey: 'analytical',
    unitAr: 'التحليل الكيميائي',
    unitEn: 'Analytical Chemistry',
    frontAr: 'ما هي ألوان رواسب هاليدات الفضة (AgCl, AgBr, AgI) مع محلول النشادر المركز؟',
    frontEn: 'Describe the colors and NH₄OH solubility of AgCl, AgBr, and AgI.',
    backAr: 'AgCl أبيض يذوب سريعاً · AgBr أبيض مصفر يذوب ببطء · AgI أصفر لا يذوب في محلول النشادر.',
    backEn: 'AgCl: white, dissolves readily · AgBr: yellowish-white, dissolves slowly · AgI: yellow, insoluble in NH₄OH.',
    hintAr: 'اختبار نترات الفضة',
    hintEn: 'AgNO₃ halide test',
  },
  {
    id: 'fc_8',
    unitKey: 'equilibrium',
    unitAr: 'الاتزان الكيميائي',
    unitEn: 'Chemical Equilibrium',
    frontAr: 'ما هي العوامل التي تغير قيمة ثابت الاتزان Kc أو Kp؟',
    frontEn: 'Which factors change the equilibrium constant Kc or Kp?',
    backAr: 'درجة الحرارة فقط! تغير التركيز أو الضغط أو إضافة عامل حفاز يغير موضع الاتزان أو سرعته ولكنه لا يغير قيمة Kc إطلاقاً.',
    backEn: 'Temperature only! Changes in concentration, pressure, or catalysts shift position/rate but never alter Kc or Kp.',
    hintAr: 'قاعدة لوشاتيليه',
    hintEn: "Le Chatelier's Principle",
  },
  {
    id: 'fc_9',
    unitKey: 'equilibrium',
    unitAr: 'الاتزان الكيميائي',
    unitEn: 'Chemical Equilibrium',
    frontAr: 'متى تكون قيمة Kp مساوية لقيمة Kc في تفاعل غازي متزن؟',
    frontEn: 'When does Kp equal Kc in a gaseous equilibrium reaction?',
    backAr: 'عندما يتساوى مجموع عدد مولات الغازات الناتجة مع مجموع عدد مولات الغازات المتفاعلة (Δn = 0).',
    backEn: 'When the total moles of gaseous products equal the total moles of gaseous reactants (Δn = 0).',
    hintAr: 'العلاقة بين Kc و Kp',
    hintEn: 'Kp and Kc relationship',
  },
  {
    id: 'fc_10',
    unitKey: 'electro',
    unitAr: 'الكهربية',
    unitEn: 'Electrochemistry',
    frontAr: 'اشرح قاعدة شحن وتفريغ خلية ثانوية (مثل بطارية الرصاص الحامضية)',
    frontEn: 'Explain charging vs. discharging in a lead-acid secondary cell.',
    backAr: 'أثناء التفريغ تعمل كخلية جلفانية تلقائية (الأنود سالب)، وأثناء الشحن تُوصل بمصدر خارجي أعلى قليلاً من جهدها فتعمل كخلية تحليلية وتنعكس التفاعلات.',
    backEn: 'During discharge it acts as a spontaneous galvanic cell; during charging an external DC source slightly above its EMF reverses the cell reactions (electrolytic mode).',
    hintAr: 'بطارية السيارة',
    hintEn: 'Lead-acid battery',
  },
  {
    id: 'fc_11',
    unitKey: 'electro',
    unitAr: 'الكهربية',
    unitEn: 'Electrochemistry',
    frontAr: 'اذكر قانون فاراداي العام للتحليل الكهربائي',
    frontEn: "State Faraday's general law of electrolysis.",
    backAr: 'عند مرور 1 فاراداي (96,500 كولوم) يترسب أو يتصاعد الكتلة المكافئة الجرامية للمادة عند الأقطاب (الكتلة الذرية ÷ التكافؤ).',
    backEn: 'Passing 1 Faraday (96,500 C) deposits or liberates 1 gram equivalent mass of any substance at the electrodes (Atomic mass ÷ Valence).',
    hintAr: 'قوانين فاراداي',
    hintEn: "Faraday's laws",
  },
  {
    id: 'fc_12',
    unitKey: 'organic',
    unitAr: 'الكيمياء العضوية',
    unitEn: 'Organic Chemistry',
    frontAr: 'كيف تحصل على حمض الأسيتيك من الإيثين (الإيثيلين)؟',
    frontEn: 'How do you synthesize acetic acid starting from ethene?',
    backAr: 'هيدرة حفزية للإيثين في وجود H₂SO₄ عند 110°C لإنتاج الإيثانول، ثم أكسدة تامة للإيثانول بواسطة KMnO₄ المحمضة.',
    backEn: 'Catalytic hydration of ethene with H₂SO₄ at 110°C to yield ethanol, followed by complete oxidation with acidified KMnO₄.',
    hintAr: 'تحويلات الهيدروكربونات',
    hintEn: 'Hydrocarbon conversions',
  },
  {
    id: 'fc_13',
    unitKey: 'organic',
    unitAr: 'الكيمياء العضوية',
    unitEn: 'Organic Chemistry',
    frontAr: 'كيف تميز بين الفينول وحمض الأسيتيك (أو الإيثانول)؟',
    frontEn: 'How do you distinguish phenol from acetic acid?',
    backAr: 'الفينول يتفاعل مع FeCl₃ معطياً لوناً بنفسجياً، ومع ماء البروم معطياً راسباً أبيض، بينما يتفاعل الحمض مع Na₂CO₃ مع تصاعد فوران غاز CO₂.',
    backEn: 'Phenol gives a violet color with FeCl₃ and a white precipitate with bromine water; acetic acid effervesces CO₂ gas with Na₂CO₃.',
    hintAr: 'كشف الفينولات والأحماض',
    hintEn: 'Phenol vs. acid test',
  },
  {
    id: 'fc_14',
    unitKey: 'organic',
    unitAr: 'الكيمياء العضوية',
    unitEn: 'Organic Chemistry',
    frontAr: 'اشرح قاعدة ماركونيكوف عند إضافة HBr إلى البروبين',
    frontEn: "State Markovnikov's rule for adding HBr to propene.",
    backAr: 'عند إضافة متفاعل غير متماثل (HBr) إلى ألكين غير متماثل، يُضاف الهيدروجين لذرة الكربون الغنية بالهيدروجين والأيون السالب للأقل هيدروجيناً فينتج 2-بروموبروبان.',
    backEn: 'When adding an unsymmetrical reagent (HBr) to an unsymmetrical alkene, H⁺ adds to the carbon with more H atoms and Br⁻ to the one with fewer, giving 2-bromopropane.',
    hintAr: 'إضافة الألكينات',
    hintEn: 'Alkene addition',
  },
];

interface EquationEntry {
  id: string;
  unitKey: string;
  unitAr: string;
  unitEn: string;
  titleAr: string;
  titleEn: string;
  equation: string;
  reagentNoteAr: string;
  reagentNoteEn: string;
  visualTextAr: string;
  visualTextEn: string;
  swatchHex: string;
}

const EQUATION_BANK: EquationEntry[] = [
  {
    id: 'eq_1',
    unitKey: 'iron',
    unitAr: 'الحديد وأكاسيده',
    unitEn: 'Iron & Its Oxides',
    titleAr: 'أكسدة أوكسالات الحديد II وتسخينها',
    titleEn: 'Thermal Decomposition of Iron(II) Oxalate',
    equation: '(COO)₂Fe  ──(No Air / بمعزل)──▶  FeO + CO↑ + CO₂↑',
    reagentNoteAr: 'إذا تم التسخين في الهواء يتأكسد FeO إلى Fe₂O₃ الأحمر',
    reagentNoteEn: 'If heated in air, FeO rapidly oxidizes to red Fe₂O₃.',
    visualTextAr: 'FeO أسود → Fe₂O₃ أحمر داكن',
    visualTextEn: 'Black FeO → Dark Red Fe₂O₃',
    swatchHex: '#991b1b',
  },
  {
    id: 'eq_2',
    unitKey: 'iron',
    unitAr: 'الحديد وأكاسيده',
    unitEn: 'Iron & Its Oxides',
    titleAr: 'اختزال الهيماتيت في الفرن العالي',
    titleEn: 'Hematite Reduction in the Blast Furnace',
    equation: 'Fe₂O₃ + 3CO  ──(> 700°C)──▶  2Fe + 3CO₂↑',
    reagentNoteAr: 'العامل المختزل هو أول أكسيد الكربون CO الناتج من فحم الكوك',
    reagentNoteEn: 'Reducing agent is carbon monoxide (CO) derived from coke.',
    visualTextAr: 'اختزال كامل إلى حديد منصهر',
    visualTextEn: 'Complete reduction to molten iron',
    swatchHex: '#475569',
  },
  {
    id: 'eq_3',
    unitKey: 'iron',
    unitAr: 'الحديد وأكاسيده',
    unitEn: 'Iron & Its Oxides',
    titleAr: 'تفاعل أكسيد الحديد المغناطيسي مع حمض مركز ساخن',
    titleEn: 'Magnetite with Hot Concentrated Sulfuric Acid',
    equation: 'Fe₃O₄ + 4H₂SO₄(conc)  ──Δ──▶  FeSO₄ + Fe₂(SO₄)₃ + 4H₂O',
    reagentNoteAr: 'يُثبت أن Fe₃O₄ أكسيد مختلط لأنه يعطي أملاح الحديد II و III معاً',
    reagentNoteEn: 'Proves Fe₃O₄ is a mixed oxide yielding both Fe(II) and Fe(III) salts.',
    visualTextAr: 'خليط أخضر باهت (II) + أصفر باهت (III)',
    visualTextEn: 'Pale green (II) + Pale yellow (III) mix',
    swatchHex: '#ca8a04',
  },
  {
    id: 'eq_4',
    unitKey: 'qualitative',
    unitAr: 'التحليل الكيفي',
    unitEn: 'Qualitative Analysis',
    titleAr: 'الكشف عن كاتيون الحديد الثلاثي Fe³⁺',
    titleEn: 'Confirmatory Test for Fe³⁺ Cation',
    equation: 'FeCl₃ + 3NH₄OH  ──▶  Fe(OH)₃↓ + 3NH₄Cl',
    reagentNoteAr: 'كاشف المجموعة التحليلية الثالثة، يذوب الراسب في الأحماض المخففة',
    reagentNoteEn: 'Analytical Group III reagent; precipitate dissolves in dilute acids.',
    visualTextAr: 'راسب جيلاتيني بني محمر',
    visualTextEn: 'Reddish-brown gelatinous precipitate',
    swatchHex: '#7c2d12',
  },
  {
    id: 'eq_5',
    unitKey: 'qualitative',
    unitAr: 'التحليل الكيفي',
    unitEn: 'Qualitative Analysis',
    titleAr: 'الكشف عن كاتيون النحاس الثنائي Cu²⁺',
    titleEn: 'Detection of Cu²⁺ Cation with H₂S',
    equation: 'CuSO₄ + H₂S  ──(HCl acidic)──▶  CuS↓ + H₂SO₄',
    reagentNoteAr: 'كاشف المجموعة التحليلية الثانية، يذوب الراسب في حمض النيتريك الساخن',
    reagentNoteEn: 'Analytical Group II reagent; precipitate dissolves in hot nitric acid.',
    visualTextAr: 'راسب أسود من كبريتيد النحاس II',
    visualTextEn: 'Black CuS precipitate',
    swatchHex: '#0f172a',
  },
  {
    id: 'eq_6',
    unitKey: 'qualitative',
    unitAr: 'التحليل الكيفي',
    unitEn: 'Qualitative Analysis',
    titleAr: 'تجربة الحلقة البنية للكشف عن أنيون النترات NO₃⁻',
    titleEn: 'Brown Ring Test for Nitrate Anion NO₃⁻',
    equation: '2NaNO₃ + 6FeSO₄ + 4H₂SO₄  ──▶  3Fe₂(SO₄)₃ + Na₂SO₄ + 4H₂O + 2NO↑',
    reagentNoteAr: 'يتحد NO مع وفرة FeSO₄ البارد مكوناً مركب الحلقة البنية FeSO₄·NO (تزول بالرج أو التسخين)',
    reagentNoteEn: 'NO binds excess cold FeSO₄ forming FeSO₄·NO brown ring (vanishes on shaking/heating).',
    visualTextAr: 'حلقة بنية عند السطح الفاصل',
    visualTextEn: 'Brown ring at liquid interface',
    swatchHex: '#78350f',
  },
  {
    id: 'eq_7',
    unitKey: 'qualitative',
    unitAr: 'التحليل الكيفي',
    unitEn: 'Qualitative Analysis',
    titleAr: 'تمييز أنيون الثيوكبريتات S₂O₃²⁻',
    titleEn: 'Identification of Thiosulfate Anion S₂O₃²⁻',
    equation: 'Na₂S₂O₃ + 2HCl  ──▶  2NaCl + H₂O + SO₂↑ + S↓',
    reagentNoteAr: 'يتصاعد غاز يخضر ورقة ثاني كرومات البوتاسيوم + يعلق الكبريت الأصفر',
    reagentNoteEn: 'SO₂ turns acidified K₂Cr₂O₇ paper green + yellow sulfur suspension forms.',
    visualTextAr: 'معلق أصفر + إخضرار الكرومات',
    visualTextEn: 'Yellow sulfur + Green dichromate paper',
    swatchHex: '#eab308',
  },
  {
    id: 'eq_8',
    unitKey: 'organic',
    unitAr: 'الكيمياء العضوية',
    unitEn: 'Organic Chemistry',
    titleAr: 'تفاعل باير للكشف عن الرابطة المزدوجة',
    titleEn: "Baeyer's Test for Unsaturation (C=C)",
    equation: 'CH₂=CH₂ + H₂O + [O]  ──(KMnO₄ / alkaline)──▶  HO-CH₂-CH₂-OH',
    reagentNoteAr: 'يتكون إيثيلين جليكول (مانع تجمد الماء بالسيارات) ويزول اللون البنفسجي',
    reagentNoteEn: 'Produces ethylene glycol (antifreeze) and discharges purple KMnO₄ color.',
    visualTextAr: 'زوال اللون البنفسجي لـ KMnO₄',
    visualTextEn: 'Purple KMnO₄ color disappears',
    swatchHex: '#9333ea',
  },
  {
    id: 'eq_9',
    unitKey: 'organic',
    unitAr: 'الكيمياء العضوية',
    unitEn: 'Organic Chemistry',
    titleAr: 'تحضير الإستر وتفاعله (الأسترة)',
    titleEn: 'Esterification Reaction (Ethyl Acetate)',
    equation: 'CH₃COOH + C₂H₅OH  ⇌  (H₂SO₄ conc)  CH₃COOC₂H₅ + H₂O',
    reagentNoteAr: 'يمتص حمض الكبريتيك الماء لمنع التفاعل العكسي؛ يتميز برائحة الفاكهة الذكية',
    reagentNoteEn: 'Conc. H₂SO₄ absorbs water to prevent reverse hydrolysis; fruity aroma.',
    visualTextAr: 'إستر أسيتات الإيثيل (رائحة ذكية)',
    visualTextEn: 'Ethyl acetate ester (fruity odor)',
    swatchHex: '#0d9488',
  },
  {
    id: 'eq_10',
    unitKey: 'electro',
    unitAr: 'الكهربية',
    unitEn: 'Electrochemistry',
    titleAr: 'التفاعل الكلي في بطارية الرصاص الحامضية',
    titleEn: 'Overall Lead-Acid Storage Battery Reaction',
    equation: 'Pb + PbO₂ + 4H⁺ + 2SO₄²⁻  ⇌ (Discharge / Charge) ⇌  2PbSO₄↓ + 2H₂O',
    reagentNoteAr: 'EMF للخلية الواحدة ≈ 2.05V والبطارية 6 خلايا متصلة على التوالي ≈ 12V',
    reagentNoteEn: 'Single cell EMF ≈ 2.05V; 6 cells in series give ≈ 12V.',
    visualTextAr: 'تقل كثافة الحمض بالتفريغ (أقل من 1.2)',
    visualTextEn: 'Acid density drops on discharge (< 1.2 g/cm³)',
    swatchHex: '#334155',
  },
];

interface StudyLabTabProps {
  studentId?: string;
}

export const StudyLabTab: React.FC<StudyLabTabProps> = ({ studentId }) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const storageSuffix = studentId || 'guest';
  const [subMode, setSubMode] = useState<'flashcards' | 'equations' | 'timer'>('flashcards');

  // Flashcards State
  const [unitFilter, setUnitFilter] = useState<string>('__ALL__');
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

  const cardUnits = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    map.set('__ALL__', { key: '__ALL__', label: isEn ? 'All' : 'الكل' });
    FLASHCARDS.forEach((c) => {
      if (!map.has(c.unitKey)) {
        map.set(c.unitKey, { key: c.unitKey, label: isEn ? c.unitEn : c.unitAr });
      }
    });
    return Array.from(map.values());
  }, [isEn]);

  const visibleCards = useMemo(
    () => (unitFilter === '__ALL__' ? FLASHCARDS : FLASHCARDS.filter((c) => c.unitKey === unitFilter)),
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
  const [eqUnit, setEqUnit] = useState('__ALL__');

  const eqUnits = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    map.set('__ALL__', { key: '__ALL__', label: isEn ? 'All' : 'الكل' });
    EQUATION_BANK.forEach((e) => {
      if (!map.has(e.unitKey)) {
        map.set(e.unitKey, { key: e.unitKey, label: isEn ? e.unitEn : e.unitAr });
      }
    });
    return Array.from(map.values());
  }, [isEn]);

  const filteredEquations = useMemo(() => {
    const q = eqQuery.trim().toLowerCase();
    return EQUATION_BANK.filter((eq) => {
      if (eqUnit !== '__ALL__' && eq.unitKey !== eqUnit) return false;
      if (!q) return true;
      return (
        eq.titleAr.toLowerCase().includes(q) ||
        eq.titleEn.toLowerCase().includes(q) ||
        eq.equation.toLowerCase().includes(q) ||
        eq.reagentNoteAr.toLowerCase().includes(q) ||
        eq.reagentNoteEn.toLowerCase().includes(q) ||
        eq.visualTextAr.toLowerCase().includes(q) ||
        eq.visualTextEn.toLowerCase().includes(q)
      );
    });
  }, [eqQuery, eqUnit]);

  // Pomodoro Timer State
  const [focusDurationMin, setFocusDurationMin] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const defaultGoalAr = 'مراجعة معادلات الباب الأول وحل شيت';
  const defaultGoalEn = 'Review Chapter 1 equations & practice sheet';
  const [focusGoal, setFocusGoal] = useState<string>(isEn ? defaultGoalEn : defaultGoalAr);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(`mm_study_${storageSuffix}_pomodoro`) || '0') || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    setFocusGoal((prev) => {
      if (isEn && prev === defaultGoalAr) return defaultGoalEn;
      if (!isEn && prev === defaultGoalEn) return defaultGoalAr;
      return prev;
    });
  }, [isEn]);

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
          <span>{isEn ? `Flashcards (${FLASHCARDS.length})` : `بطاقات المراجعة (${FLASHCARDS.length})`}</span>
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
          <span>{isEn ? 'Equations & Colors' : 'بنك المعادلات والرواسب'}</span>
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
          <span>{isEn ? 'Focus Timer' : 'مؤقت التركيز للمذاكرة'}</span>
        </button>
      </div>

      {/* 1. FLASHCARDS ENGINE */}
      {subMode === 'flashcards' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {isEn ? 'Active Recall Flashcards' : 'بطاقات المراجعة السريعة (Flashcards)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Tap a card to reveal the model answer, then track your mastery.'
                  : 'اضغط على البطاقة لإظهار الإجابة النموذجية ثم حدد مدى إتقانك لها.'}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {isEn ? 'Mastery:' : 'الإتقان:'}{' '}
                <strong className="text-teal-600 dark:text-teal-400">{masteredIds.length}</strong> / {FLASHCARDS.length} ({masteryPct}%)
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
                key={u.key}
                type="button"
                onClick={() => {
                  setUnitFilter(u.key);
                  setCardIdx(0);
                  setIsFlipped(false);
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  unitFilter === u.key
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {u.label}
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
              <span>{isEn ? currentCard.unitEn : currentCard.unitAr}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {safeCardIndex + 1} / {visibleCards.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isFlipped
                  ? isEn
                    ? 'Model Answer'
                    : 'الإجابة النموذجية'
                  : isEn
                  ? 'Exam Question'
                  : 'السؤال الامتحاني'}
              </span>
            </div>

            <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed max-w-2xl">
              {isFlipped
                ? isEn
                  ? currentCard.backEn
                  : currentCard.backAr
                : isEn
                ? currentCard.frontEn
                : currentCard.frontAr}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>
                {isFlipped
                  ? isEn
                    ? 'Tap to flip back to question'
                    : 'اضغط للعودة للسؤال'
                  : isEn
                  ? `Hint: ${currentCard.hintEn} · Tap to reveal answer`
                  : `تلميح: ${currentCard.hintAr} · اضغط لكشف الإجابة`}
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
                {isEn ? 'Previous' : 'السابق'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCardIdx((prev) => (prev + 1) % visibleCards.length);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {isEn ? 'Next' : 'التالي'}
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
              <span>
                {isCurrentMastered
                  ? isEn
                    ? 'Mastered (Tap to undo)'
                    : 'تم الإتقان (اضغط للإلغاء)'
                  : isEn
                  ? 'Mark as Mastered'
                  : 'أتقنت هذه المعلومة'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. EQUATIONS & PRECIPITATE COLORS ENCYCLOPEDIA */}
      {subMode === 'equations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {isEn ? 'Balanced Equations & Precipitate Colors' : 'بنك المعادلات الموزونة وألوان الرواسب'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn
                ? 'Search any equation, reagent, or precipitate color for rapid exam revision.'
                : 'ابحث عن أي معادلة أو كاشف أو لون راسب لتراجع أهم معادلات المنهج بسرعة.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                className={`w-4 h-4 text-slate-400 absolute top-3.5 pointer-events-none ${
                  isEn ? 'left-3.5' : 'right-3.5'
                }`}
              />
              <input
                type="text"
                value={eqQuery}
                onChange={(e) => setEqQuery(e.target.value)}
                placeholder={
                  isEn
                    ? 'Search Fe3O4, brown ring, Baeyer...'
                    : 'ابحث بـ Fe3O4 أو الحلقة البنية أو باير...'
                }
                className={`w-full min-h-[44px] py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isEn ? 'pl-10 pr-3' : 'pr-10 pl-3'
                }`}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {eqUnits.map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => setEqUnit(u.key)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    eqUnit === u.key
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {u.label}
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
                    <span className="font-bold text-teal-700 dark:text-teal-400">
                      {isEn ? eq.unitEn : eq.unitAr}
                    </span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                        style={{ backgroundColor: eq.swatchHex }}
                      />
                      <span>{isEn ? eq.visualTextEn : eq.visualTextAr}</span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {isEn ? eq.titleEn : eq.titleAr}
                  </h3>

                  <div
                    dir="ltr"
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-teal-300 overflow-x-auto text-center"
                  >
                    {eq.equation}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isEn ? eq.reagentNoteEn : eq.reagentNoteAr}
                </p>
              </div>
            ))}

            {filteredEquations.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-slate-500">
                {isEn
                  ? 'No matching equations found. Try keywords like Fe, CuS, or Baeyer.'
                  : 'لا توجد معادلات مطابقة لبحثك. جرّب كلمة أخرى مثل Fe أو الحديد أو الكبريت.'}
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
                {isEn ? 'Pomodoro Focus Timer' : 'مؤقت التركيز للمذاكرة (Pomodoro)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Structure distraction-free chemistry blocks and count completed sessions.'
                  : 'نظّم وقت مذاكرة الكيمياء وحل المسائل بدون تشتيت وتابع عدد الجلسات المنجزة.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3.5 py-2 rounded-xl tabular-nums">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {isEn ? `Completed Sessions: ${completedSessions}` : `الجلسات المنجزة: ${completedSessions}`}
              </span>
            </div>
          </div>

          <div className="max-w-lg mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-5 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { mins: 25, label: isEn ? '25m Focus' : '25 د تركيز' },
                { mins: 45, label: isEn ? '45m Deep Review' : '45 د مراجعة عميقة' },
                { mins: 5, label: isEn ? '5m Break' : '5 د راحة' },
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

            <div
              className="text-5xl sm:text-6xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-wider"
              dir="ltr"
            >
              {timerMins}:{timerSecs}
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${timerPct}%` }}
              />
            </div>

            <div className={`space-y-1.5 ${isEn ? 'text-left' : 'text-right'}`}>
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-teal-600" />
                <span>{isEn ? 'Session Goal:' : 'هدف هذه الجلسة:'}</span>
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
                <span>
                  {timerRunning
                    ? isEn
                      ? 'Pause'
                      : 'إيقاف مؤقت'
                    : isEn
                    ? 'Start Session'
                    : 'بدء الجلسة'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectTimerPreset(focusDurationMin)}
                aria-label={isEn ? 'Reset timer' : 'إعادة ضبط المؤقت'}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isEn ? 'Reset' : 'إعادة'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
