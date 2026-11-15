import React, { useState, useMemo } from 'react';
import { Atom, Calculator, Droplets, Search, Sparkles } from 'lucide-react';

interface ChemElement {
  num: number;
  sym: string;
  nameAr: string;
  nameEn: string;
  mass: number;
  category: 'nonmetal' | 'noble' | 'alkali' | 'alkaline' | 'metalloid' | 'metal' | 'transition' | 'halogen';
  catLabelAr: string;
  period: number;
  group: string;
  conf: string;
  ox: string;
  electronegativity?: number;
  anomalous?: boolean;
  note: string;
}

const ELEMENTS: ChemElement[] = [
  { num: 1, sym: 'H', nameAr: 'هيدروجين', nameEn: 'Hydrogen', mass: 1.008, category: 'nonmetal', catLabelAr: 'لافلز', period: 1, group: '1A', conf: '1s¹', ox: '+1, -1', electronegativity: 2.2, note: 'أبسط العناصر وأخفها، يكون أيون الهيدرونيوم H3O⁺ في المحاليل المائية.' },
  { num: 2, sym: 'He', nameAr: 'هيليوم', nameEn: 'Helium', mass: 4.003, category: 'noble', catLabelAr: 'غاز خامل', period: 1, group: '0', conf: '1s²', ox: '0', note: 'غاز خامل مستقر تماماً؛ يُستخدم في ملء المناطيد وأجواء اللحام الخاملة.' },
  { num: 3, sym: 'Li', nameAr: 'ليثيوم', nameEn: 'Lithium', mass: 6.941, category: 'alkali', catLabelAr: 'فلز قلوي', period: 2, group: '1A', conf: '[He] 2s¹', ox: '+1', electronegativity: 0.98, note: 'أخف فلز وأقوى عامل مختزل بجهد أكسدة قياسي موجب كبير في بطاريات أيون الليثيوم.' },
  { num: 4, sym: 'Be', nameAr: 'بيريليوم', nameEn: 'Beryllium', mass: 9.012, category: 'alkaline', catLabelAr: 'قلوي أرضي', period: 2, group: '2A', conf: '[He] 2s²', ox: '+2', electronegativity: 1.57, note: 'فلز خفيف ذو روابط تساهمية في كثير من مركباته وأكسيده متردد.' },
  { num: 5, sym: 'B', nameAr: 'بورون', nameEn: 'Boron', mass: 10.81, category: 'metalloid', catLabelAr: 'شبه فلز', period: 2, group: '3A', conf: '[He] 2s² 2p¹', ox: '+3', electronegativity: 2.04, note: 'شبه فلز يدخل في صناعة زجاج البايركس المقاوم للحرارة.' },
  { num: 6, sym: 'C', nameAr: 'كربون', nameEn: 'Carbon', mass: 12.011, category: 'nonmetal', catLabelAr: 'لافلز', period: 2, group: '4A', conf: '[He] 2s² 2p²', ox: '-4 إلى +4', electronegativity: 2.55, note: 'أساس الكيمياء العضوية لقدرته على تكوين سلاسل وحلقات بروابط أحادية وثنائية وثلاثية.' },
  { num: 7, sym: 'N', nameAr: 'نيتروجين', nameEn: 'Nitrogen', mass: 14.007, category: 'nonmetal', catLabelAr: 'لافلز', period: 2, group: '5A', conf: '[He] 2s² 2p³', ox: '-3 إلى +5', electronegativity: 3.04, note: 'يمثل 78% من الغلاف الجوي؛ وجود رابطة ثلاثية قوية يجعله خامل نسبياً عند الحرارة العادية.' },
  { num: 8, sym: 'O', nameAr: 'أكسجين', nameEn: 'Oxygen', mass: 15.999, category: 'nonmetal', catLabelAr: 'لافلز', period: 2, group: '6A', conf: '[He] 2s² 2p⁴', ox: '-2 (و-1 في فوق الأكاسيد)', electronegativity: 3.44, note: 'ثاني أعلى العناصر سالبية كهربية بعد الفلور؛ يظهر بعدد تأكسد +2 فقط مع الفلور OF2.' },
  { num: 9, sym: 'F', nameAr: 'فلور', nameEn: 'Fluorine', mass: 18.998, category: 'halogen', catLabelAr: 'هالوجين', period: 2, group: '7A', conf: '[He] 2s² 2p⁵', ox: '-1 فقط', electronegativity: 3.98, note: 'أعلى عنصر في السالبية الكهربية وأقوى عامل مؤكسد في الهالوجينات.' },
  { num: 10, sym: 'Ne', nameAr: 'نيون', nameEn: 'Neon', mass: 20.18, category: 'noble', catLabelAr: 'غاز خامل', period: 2, group: '0', conf: '[He] 2s² 2p⁶', ox: '0', note: 'غاز خامل مكتمل المستوى الخارجي؛ يضيء باللون الأحمر البرتقالي في أنابيب التفريغ.' },
  { num: 11, sym: 'Na', nameAr: 'صوديوم', nameEn: 'Sodium', mass: 22.99, category: 'alkali', catLabelAr: 'فلز قلوي', period: 3, group: '1A', conf: '[Ne] 3s¹', ox: '+1', electronegativity: 0.93, note: 'فلز شديد النشاط يتفاعل بعنف مع الماء؛ يعطي لون أصفر ذهبي في كشف اللهب.' },
  { num: 12, sym: 'Mg', nameAr: 'ماغنيسيوم', nameEn: 'Magnesium', mass: 24.305, category: 'alkaline', catLabelAr: 'قلوي أرضي', period: 3, group: '2A', conf: '[Ne] 3s²', ox: '+2', electronegativity: 1.31, note: 'يُميز كربونات الصوديوم (أبيض على البارد) عن البيكربونات (أبيض بعد التسخين) في التحليل.' },
  { num: 13, sym: 'Al', nameAr: 'ألومنيوم', nameEn: 'Aluminum', mass: 26.982, category: 'metal', catLabelAr: 'فلز ممثل', period: 3, group: '3A', conf: '[Ne] 3s² 3p¹', ox: '+3', electronegativity: 1.61, note: 'هيدروكسيده Al(OH)₃ متردد يذوب في وفرة NaOH لتكوين ميتا ألومينات الصوديوم.' },
  { num: 14, sym: 'Si', nameAr: 'سيليكون', nameEn: 'Silicon', mass: 28.085, category: 'metalloid', catLabelAr: 'شبه فلز', period: 3, group: '4A', conf: '[Ne] 3s² 3p²', ox: '+4, -4', electronegativity: 1.9, note: 'شبه موصل أساسي في صناعة الرقائق الإلكترونية والخلايا الشمسية.' },
  { num: 15, sym: 'P', nameAr: 'فسفور', nameEn: 'Phosphorus', mass: 30.974, category: 'nonmetal', catLabelAr: 'لافلز', period: 3, group: '5A', conf: '[Ne] 3s² 3p³', ox: '-3, +3, +5', electronegativity: 2.19, note: 'جزيء الفسفور البخاري رباعي الذرات P₄؛ يكون أملاح الفوسفات المميزة براسب أصفر مع AgNO₃.' },
  { num: 16, sym: 'S', nameAr: 'كبريت', nameEn: 'Sulfur', mass: 32.06, category: 'nonmetal', catLabelAr: 'لافلز', period: 3, group: '6A', conf: '[Ne] 3s² 3p⁴', ox: '-2, +4, +6', electronegativity: 2.58, note: 'يظهر بلون أصفر معلق عند تفاعل الثيوكبريتات مع HCl المخفف مع تصاعد SO₂.' },
  { num: 17, sym: 'Cl', nameAr: 'كلور', nameEn: 'Chlorine', mass: 35.45, category: 'halogen', catLabelAr: 'هالوجين', period: 3, group: '7A', conf: '[Ne] 3s² 3p⁵', ox: '-1, +1 إلى +7', electronegativity: 3.16, note: 'يكون راسب أبيض AgCl يذوب في محلول النشادر المركز ويصير بنفسجياً في الضوء.' },
  { num: 18, sym: 'Ar', nameAr: 'أرجون', nameEn: 'Argon', mass: 39.948, category: 'noble', catLabelAr: 'غاز خامل', period: 3, group: '0', conf: '[Ne] 3s² 3p⁶', ox: '0', note: 'ثالث أكثر غازات الغلاف الجوي وفرة ويُستخدم لحماية التفاعلات الحساسة.' },
  { num: 19, sym: 'K', nameAr: 'بوتاسيوم', nameEn: 'Potassium', mass: 39.098, category: 'alkali', catLabelAr: 'فلز قلوي', period: 4, group: '1A', conf: '[Ar] 4s¹', ox: '+1', electronegativity: 0.82, note: 'يدخل في KMnO₄ و K₂Cr₂O₇ كأشهر عوامل مؤكسدة؛ كشف اللهب بنفسجي فاتح.' },
  { num: 20, sym: 'Ca', nameAr: 'كالسيوم', nameEn: 'Calcium', mass: 40.078, category: 'alkaline', catLabelAr: 'قلوي أرضي', period: 4, group: '2A', conf: '[Ar] 4s²', ox: '+2', electronegativity: 1.0, note: 'هيدروكسيد الكالسيوم (ماء الجير الرائق) يتعكر بمرور CO₂ لمدة قصيرة؛ كشف اللهب أحمر طوبي.' },
  { num: 21, sym: 'Sc', nameAr: 'سكانديوم', nameEn: 'Scandium', mass: 44.956, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '3B', conf: '[Ar] 4s² 3d¹', ox: '+3 فقط', electronegativity: 1.36, note: 'شديد الخفة والصلابة في سبائك طائرات الميج، ومحاليله عديمة اللون (d⁰).' },
  { num: 22, sym: 'Ti', nameAr: 'تيتانيوم', nameEn: 'Titanium', mass: 47.867, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '4B', conf: '[Ar] 4s² 3d²', ox: '+2, +3, +4', electronegativity: 1.54, note: 'لا يرفضه الجسم البشري في زراعة الأسنان والمفاصل؛ وTiO₂ في مستحضرات الوقاية من الشمس.' },
  { num: 23, sym: 'V', nameAr: 'فاناديوم', nameEn: 'Vanadium', mass: 50.942, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '5B', conf: '[Ar] 4s² 3d³', ox: '+2 إلى +5', electronegativity: 1.63, note: 'يدخل V₂O₅ كعامل حفاز في صناعة حمض الكبريتيك بطريقة التلامس وفي تحضير حمض البنزويك.' },
  { num: 24, sym: 'Cr', nameAr: 'كروم', nameEn: 'Chromium', mass: 51.996, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '6B', conf: '[Ar] 4s¹ 3d⁵', ox: '+2, +3, +6', electronegativity: 1.66, anomalous: true, note: 'توزيع شاذ لاستقرار 3d⁵ نصف الممتلئ؛ يكون طبقة أكسيد غير مسامية تمنع استمرار صدئه (الخمول).' },
  { num: 25, sym: 'Mn', nameAr: 'منجنيز', nameEn: 'Manganese', mass: 54.938, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '7B', conf: '[Ar] 4s² 3d⁵', ox: '+2 إلى +7', electronegativity: 1.55, note: 'أعلى حالة تأكسد بالسلسلة (+7)؛ سبيكته مع الحديد أصلب من الصلب في قضبان السكك الحديدية.' },
  { num: 26, sym: 'Fe', nameAr: 'حديد', nameEn: 'Iron', mass: 55.845, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '8', conf: '[Ar] 4s² 3d⁶', ox: '+2, +3, +6', electronegativity: 1.83, note: 'أيون Fe³⁺ (3d⁵) أكثر ثباتاً واستقراراً من Fe²⁺ (3d⁶) ولذلك يسهل أكسدة الحديد الثنائي للثلاثي.' },
  { num: 27, sym: 'Co', nameAr: 'كوبالت', nameEn: 'Cobalt', mass: 58.933, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '8', conf: '[Ar] 4s² 3d⁷', ox: '+2, +3', electronegativity: 1.88, note: 'نظيره الكوبالت 60 يصدر أشعة جاما المستخدمة في حفظ الأغذية والكشف عن الأورام وشقوق اللحام.' },
  { num: 28, sym: 'Ni', nameAr: 'نيكل', nameEn: 'Nickel', mass: 58.693, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '8', conf: '[Ar] 4s² 3d⁸', ox: '+2, +3', electronegativity: 1.91, note: 'يشذ في الكتلة الذرية لوجود 5 نظائر مستقرة متوسطها 58.7؛ عامل حفاز مجزأ في هدرجة الزيوت.' },
  { num: 29, sym: 'Cu', nameAr: 'نحاس', nameEn: 'Copper', mass: 63.546, category: 'transition', catLabelAr: 'انتقالي 3d', period: 4, group: '1B', conf: '[Ar] 4s¹ 3d¹⁰', ox: '+1, +2', electronegativity: 1.9, anomalous: true, note: 'توزيع شاذ لاستقرار 3d¹⁰؛ عنصر انتقالي لأن حالة +2 تحتوي d⁹ غير ممتلئ.' },
  { num: 30, sym: 'Zn', nameAr: 'خارصين', nameEn: 'Zinc', mass: 65.38, category: 'metal', catLabelAr: 'غير انتقالي (d¹⁰)', period: 4, group: '2B', conf: '[Ar] 4s² 3d¹⁰', ox: '+2 فقط', electronegativity: 1.65, note: 'ليس عنصراً انتقالياً لانشغال d تاماً في الحالة الذرية والتأكسدية (+2)؛ يُستخدم في الجلفنة.' },
  { num: 35, sym: 'Br', nameAr: 'بروم', nameEn: 'Bromine', mass: 79.904, category: 'halogen', catLabelAr: 'هالوجين', period: 4, group: '7A', conf: '[Ar] 4s² 3d¹⁰ 4p⁵', ox: '-1 إلى +5', electronegativity: 2.96, note: 'ماء البروم الأحمر (في CCl₄) يكشف عن الرابطة المزدوجة والثلاثية باختفاء لونه؛ راسبه AgBr أبيض مصفر.' },
  { num: 47, sym: 'Ag', nameAr: 'فضة', nameEn: 'Silver', mass: 107.87, category: 'transition', catLabelAr: 'فلز عملة', period: 5, group: '1B', conf: '[Kr] 5s¹ 4d¹⁰', ox: '+1, +2', electronegativity: 1.93, anomalous: true, note: 'أيون Ag⁺ الكاشف التأكيدي لستة أنيونات: الكبريتيد (أسود)، الكبريتيت، والهاليدات والفوسفات.' },
  { num: 53, sym: 'I', nameAr: 'يود', nameEn: 'Iodine', mass: 126.9, category: 'halogen', catLabelAr: 'هالوجين', period: 5, group: '7A', conf: '[Kr] 5s² 4d¹⁰ 5p⁵', ox: '-1 إلى +7', electronegativity: 2.66, note: 'يزول لون محلول اليود البني مع الثيوكبريتات؛ راسبه AgI أصفر لا يذوب في محلول النشادر.' },
  { num: 56, sym: 'Ba', nameAr: 'باريوم', nameEn: 'Barium', mass: 137.33, category: 'alkaline', catLabelAr: 'قلوي أرضي', period: 6, group: '2A', conf: '[Xe] 6s²', ox: '+2', electronegativity: 0.89, note: 'كلوريد الباريوم يفرق بين الكبريتات (راسب أبيض لا يذوب في HCl) والفوسفات (أبيض يذوب في HCl).' },
  { num: 78, sym: 'Pt', nameAr: 'بلاتين', nameEn: 'Platinum', mass: 195.08, category: 'transition', catLabelAr: 'انتقالي 5d', period: 6, group: '8', conf: '[Xe] 6s¹ 4f¹⁴ 5d⁹', ox: '+2, +4', electronegativity: 2.28, note: 'قطب خامل في قطب الهيدروجين القياسي SHE ويمتز غاز الهيدروجين على البلاتين الأسفنجي.' },
  { num: 79, sym: 'Au', nameAr: 'ذهب', nameEn: 'Gold', mass: 196.97, category: 'transition', catLabelAr: 'فلز عملة', period: 6, group: '1B', conf: '[Xe] 6s¹ 4f¹⁴ 5d¹⁰', ox: '+1, +3', electronegativity: 2.54, anomalous: true, note: 'عالي الخمول الكيميائي وجهد اختزاله موجب كبير؛ سبيكته مع النحاس سبيكة استبدالية.' },
  { num: 80, sym: 'Hg', nameAr: 'زئبق', nameEn: 'Mercury', mass: 200.59, category: 'metal', catLabelAr: 'غير انتقالي', period: 6, group: '2B', conf: '[Xe] 6s² 4f¹⁴ 5d¹⁰', ox: '+1, +2', electronegativity: 2.0, note: 'الفلز السائل الوحيد عند حرارة الغرفة ويُستخدم في بطارية الزئبق وبخار مملغم.' },
  { num: 82, sym: 'Pb', nameAr: 'رصاص', nameEn: 'Lead', mass: 207.2, category: 'metal', catLabelAr: 'فلز ممثل', period: 6, group: '4A', conf: '[Xe] 6s² 4f¹⁴ 5d¹⁰ 6p²', ox: '+2, +4', electronegativity: 2.33, note: 'أسيتات الرصاص II يكشف عن H₂S (أسود PbS) والكبريتات (أبيض PbSO₄)؛ قطب بطارية السيارة.' },
];

const ATOMIC_MASS_MAP: Record<string, number> = Object.fromEntries(
  ELEMENTS.map((e) => [e.sym, e.mass])
);

const FORMULA_PRESETS = [
  { formula: 'H2SO4', label: 'حمض الكبريتيك' },
  { formula: 'Fe2(SO4)3', label: 'كبريتات الحديد III' },
  { formula: 'KMnO4', label: 'برمنجنات البوتاسيوم' },
  { formula: 'K2Cr2O7', label: 'ثاني كرومات البوتاسيوم' },
  { formula: 'Ca(OH)2', label: 'ماء الجير' },
  { formula: 'CH3COOH', label: 'حمض الأسيتيك' },
  { formula: 'C6H12O6', label: 'الجلوكوز' },
];

interface ParsedFormulaResult {
  totalMass: number;
  parts: Array<{ sym: string; count: number; mass: number; percent: number }>;
  error?: string;
}

function parseChemicalFormula(raw: string): ParsedFormulaResult {
  const formula = raw.replace(/\s+/g, '');
  if (!formula) {
    return { totalMass: 0, parts: [], error: 'أدخل الصيغة الكيميائية مثل H2SO4 أو Ca(OH)2' };
  }

  let idx = 0;

  function parseGroup(): Record<string, number> {
    const counts: Record<string, number> = {};
    while (idx < formula.length) {
      const ch = formula[idx];
      if (ch === ')' || ch === ']') {
        idx++;
        return counts;
      }
      if (ch === '(' || ch === '[') {
        idx++;
        const inner = parseGroup();
        const multStart = idx;
        while (idx < formula.length && /\d/.test(formula[idx])) idx++;
        const mult = multStart < idx ? parseInt(formula.slice(multStart, idx), 10) : 1;
        for (const [sym, cnt] of Object.entries(inner)) {
          counts[sym] = (counts[sym] || 0) + cnt * mult;
        }
        continue;
      }
      if (/[A-Z]/.test(ch)) {
        let sym = ch;
        idx++;
        while (idx < formula.length && /[a-z]/.test(formula[idx])) {
          sym += formula[idx];
          idx++;
        }
        if (!(sym in ATOMIC_MASS_MAP)) {
          throw new Error(`العنصر "${sym}" غير موجود في قاعدة البيانات المختصرة.`);
        }
        const numStart = idx;
        while (idx < formula.length && /\d/.test(formula[idx])) idx++;
        const count = numStart < idx ? parseInt(formula.slice(numStart, idx), 10) : 1;
        counts[sym] = (counts[sym] || 0) + count;
        continue;
      }
      throw new Error(`رمز غير مفهوم في الصيغة: "${ch}"`);
    }
    return counts;
  }

  try {
    const counts = parseGroup();
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return { totalMass: 0, parts: [], error: 'لم يتم العثور على عناصر صالحة.' };
    }
    let totalMass = 0;
    const rawParts = entries.map(([sym, count]) => {
      const m = ATOMIC_MASS_MAP[sym] * count;
      totalMass += m;
      return { sym, count, mass: m };
    });
    const parts = rawParts
      .map((p) => ({
        ...p,
        percent: totalMass > 0 ? (p.mass / totalMass) * 100 : 0,
      }))
      .sort((a, b) => b.percent - a.percent);

    return { totalMass, parts };
  } catch (err: any) {
    return { totalMass: 0, parts: [], error: err?.message || 'صيغة غير صالحة' };
  }
}

const PH_PRESETS = [
  { label: 'HCl 0.1M', ph: 1.0 },
  { label: 'عصير الليمون', ph: 2.3 },
  { label: 'خل 0.1M', ph: 2.9 },
  { label: 'ماء نقي 25°C', ph: 7.0 },
  { label: 'دم الإنسان', ph: 7.4 },
  { label: 'بيكربونات NaHCO₃', ph: 8.4 },
  { label: 'محلول النشادر', ph: 11.2 },
  { label: 'NaOH 0.1M', ph: 13.0 },
];

export const PeriodicTableTab: React.FC = () => {
  const [labMode, setLabMode] = useState<'elements' | 'molar' | 'ph'>('elements');

  // 1. Periodic Explorer state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'transition' | 'nonmetal' | 'alkali'>('all');
  const [selectedSym, setSelectedSym] = useState('Cr');

  // 2. Molar Mass Calculator state
  const [formulaInput, setFormulaInput] = useState('Fe2(SO4)3');
  const [sampleGrams, setSampleGrams] = useState('20');

  // 3. pH Lab state
  const [phValue, setPhValue] = useState(7.0);

  const filteredElements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ELEMENTS.filter((el) => {
      if (categoryFilter === 'transition' && el.category !== 'transition') return false;
      if (categoryFilter === 'nonmetal' && !['nonmetal', 'halogen', 'noble'].includes(el.category)) return false;
      if (categoryFilter === 'alkali' && !['alkali', 'alkaline', 'metal'].includes(el.category)) return false;
      if (!q) return true;
      return (
        el.sym.toLowerCase().includes(q) ||
        el.nameAr.includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        String(el.num) === q
      );
    });
  }, [searchQuery, categoryFilter]);

  const inspectedElement =
    ELEMENTS.find((e) => e.sym === selectedSym) || filteredElements[0] || ELEMENTS[0];

  const molarResult = useMemo(() => parseChemicalFormula(formulaInput), [formulaInput]);
  const numericGrams = Number(sampleGrams);
  const computedMoles =
    molarResult.totalMass > 0 && Number.isFinite(numericGrams) && numericGrams >= 0
      ? numericGrams / molarResult.totalMass
      : 0;

  // pH metrics
  const pohValue = Math.max(0, Math.min(14, 14 - phValue));
  const hConcExp = (-phValue).toFixed(1);
  const ohConcExp = (-pohValue).toFixed(1);

  const phClassification =
    phValue < 3
      ? { text: 'حمض قوي جداً', color: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' }
      : phValue < 6.5
      ? { text: 'وسط حمضي', color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' }
      : phValue <= 7.5
      ? { text: 'وسط متعادل', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' }
      : phValue <= 11
      ? { text: 'وسط قاعدي', color: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' }
      : { text: 'قاعدة قوية', color: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-600' };

  const indicators = [
    {
      name: 'عباد الشمس (Litmus)',
      colorLabel: phValue < 5 ? 'أحمر' : phValue > 8 ? 'أزرق' : 'أرجواني متعادل',
      swatchClass: phValue < 5 ? 'bg-rose-500' : phValue > 8 ? 'bg-blue-600' : 'bg-purple-500',
    },
    {
      name: 'الفينولفثالين (Phenolphthalein)',
      colorLabel: phValue >= 8.2 ? 'أحمر وردي' : 'عديم اللون',
      swatchClass:
        phValue >= 8.2
          ? 'bg-pink-500'
          : 'bg-slate-200 dark:bg-slate-700 border border-dashed border-slate-400',
    },
    {
      name: 'الميثيل البرتقالي (Methyl Orange)',
      colorLabel: phValue < 3.1 ? 'أحمر' : phValue > 4.4 ? 'أصفر' : 'برتقالي متعادل',
      swatchClass: phValue < 3.1 ? 'bg-rose-600' : phValue > 4.4 ? 'bg-amber-400' : 'bg-orange-500',
    },
    {
      name: 'أزرق بروموثيمول (Bromothymol Blue)',
      colorLabel: phValue < 6.0 ? 'أصفر' : phValue > 7.6 ? 'أزرق' : 'أخضر فاتح (متعادل)',
      swatchClass: phValue < 6.0 ? 'bg-amber-400' : phValue > 7.6 ? 'bg-blue-600' : 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Lab Tool Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setLabMode('elements')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            labMode === 'elements'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Atom className="w-4 h-4 shrink-0" />
          <span>الجدول الدوري التفاعلي ({ELEMENTS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setLabMode('molar')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            labMode === 'molar'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4 shrink-0" />
          <span>حاسبة الكتلة المولية</span>
        </button>

        <button
          type="button"
          onClick={() => setLabMode('ph')}
          className={`flex-1 min-w-[140px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            labMode === 'ph'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Droplets className="w-4 h-4 shrink-0" />
          <span>مختبر الأس الهيدروجيني pH</span>
        </button>
      </div>

      {/* MODE 1: INTERACTIVE PERIODIC TABLE */}
      {labMode === 'elements' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          {/* Top Inspector Stage */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-600 text-white flex flex-col items-center justify-center shrink-0 font-mono tabular-nums shadow-sm">
                <span className="text-[11px] opacity-85 leading-none">{inspectedElement.num}</span>
                <span className="text-2xl sm:text-3xl font-extrabold leading-tight">
                  {inspectedElement.sym}
                </span>
                <span className="text-[10px] opacity-85">{inspectedElement.mass}</span>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {inspectedElement.nameAr}
                  </h3>
                  <span className="text-xs font-mono text-slate-500">({inspectedElement.nameEn})</span>
                  {inspectedElement.anomalous && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                      توزيع شاذ
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                  <span className="font-semibold text-teal-700 dark:text-teal-400">
                    {inspectedElement.catLabelAr}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>الدورة {inspectedElement.period}</span>
                  <span aria-hidden="true">·</span>
                  <span>المجموعة {inspectedElement.group}</span>
                </div>

                <div className="text-xs font-mono text-slate-700 dark:text-slate-200 dir-ltr text-right">
                  {inspectedElement.conf}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-2 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-700 pt-3 lg:pt-0 lg:pr-5">
              <div className="flex flex-wrap gap-3 text-xs tabular-nums">
                <div>
                  <span className="text-slate-500">حالات التأكسد: </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                    {inspectedElement.ox}
                  </span>
                </div>
                {inspectedElement.electronegativity && (
                  <div>
                    <span className="text-slate-500">السالبية الكهربية: </span>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                      {inspectedElement.electronegativity}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectedElement.note}
              </p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الرمز أو العدد الذري (مثال: Fe أو 26)..."
                className="w-full min-h-[44px] pr-10 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'transition', label: 'الانتقالية 3d/4d' },
                { id: 'nonmetal', label: 'اللافلزات والغازات' },
                { id: 'alkali', label: 'الفلزات النشطة' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Elements Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {filteredElements.map((elem) => {
              const active = elem.sym === inspectedElement.sym;
              return (
                <button
                  key={elem.sym}
                  type="button"
                  onClick={() => setSelectedSym(elem.sym)}
                  className={`min-h-[84px] p-2 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-1 ring-teal-500/30'
                      : elem.anomalous
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-teal-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">{elem.num}</span>
                  <span className="text-lg font-extrabold font-mono text-teal-700 dark:text-teal-400 leading-none">
                    {elem.sym}
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                    {elem.nameAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: MOLAR MASS & % COMPOSITION CALCULATOR */}
      {labMode === 'molar' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              حاسبة الكتلة المولية وعدد المولات
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              اكتب أي صيغة كيميائية بالأحرف الإنجليزية (تدعم الأقواس مثل Fe2(SO4)3) لحساب الكتلة المولية والنسبة المئوية لكل عنصر.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Input Control Zone */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الصيغة الكيميائية للمركب
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formulaInput}
                  onChange={(e) => setFormulaInput(e.target.value)}
                  placeholder="Example: H2SO4, Ca(OH)2"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500">أمثلة جاهزة من المنهج:</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_PRESETS.map((p) => (
                    <button
                      key={p.formula}
                      type="button"
                      onClick={() => setFormulaInput(p.formula)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        formulaInput === p.formula
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span className="font-mono" dir="ltr">{p.formula}</span> · {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كتلة العينة بالجرام (m) لحساب عدد المولات (n = m / M):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  dir="ltr"
                  value={sampleGrams}
                  onChange={(e) => setSampleGrams(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Live Calculation Results Zone */}
            <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              {molarResult.error ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  {molarResult.error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">الكتلة المولية (M)</div>
                      <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-teal-700 dark:text-teal-400">
                        {molarResult.totalMass.toFixed(2)}{' '}
                        <span className="text-xs font-sans font-semibold text-slate-500">g/mol</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">عدد المولات (n)</div>
                      <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {computedMoles.toFixed(4)}{' '}
                        <span className="text-xs font-sans font-semibold text-slate-500">mol</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      النسبة المئوية الكتلية للعناصر المكونة:
                    </div>
                    {molarResult.parts.map((part) => {
                      const elemInfo = ELEMENTS.find((e) => e.sym === part.sym);
                      return (
                        <div key={part.sym} className="space-y-1">
                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              <span className="font-mono text-teal-700 dark:text-teal-400">{part.sym}</span> ×{' '}
                              {part.count} {elemInfo ? `(${elemInfo.nameAr})` : ''}
                            </span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {part.mass.toFixed(2)} g ·{' '}
                              <strong className="text-slate-900 dark:text-white">
                                {part.percent.toFixed(1)}%
                              </strong>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, part.percent)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: INTERACTIVE pH & INDICATOR COLOR LAB */}
      {labMode === 'ph' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              مختبر الأس الهيدروجيني (pH) وألوان الأدلة الكيميائية
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              حرّك مؤشر pH أو اختر محلولاً لمراقبة تركيز أيونات الهيدروجين والهيدروكسيل وتغير ألوان الأدلة الأربعة فوراً.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* pH Slider & Presets */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">قيمة pH</span>
                  <span className={`text-sm font-extrabold ${phClassification.color}`}>
                    {phClassification.text}
                  </span>
                </div>

                <div className="text-3xl font-extrabold font-mono tabular-nums text-center text-slate-900 dark:text-white">
                  pH = {phValue.toFixed(1)}
                </div>

                <input
                  type="range"
                  min={0}
                  max={14}
                  step={0.1}
                  dir="ltr"
                  value={phValue}
                  onChange={(e) => setPhValue(Number(e.target.value))}
                  aria-label="قيمة الأس الهيدروجيني"
                  className="w-full accent-teal-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-400" dir="ltr">
                  <span>0 (حمض قوي)</span>
                  <span>7 (متعادل)</span>
                  <span>14 (قاعدة قوية)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>محاليل شائعة:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PH_PRESETS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setPhValue(item.ph)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        Math.abs(phValue - item.ph) < 0.05
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {item.label} ({item.ph})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Concentrations & Indicator Readout */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[11px] text-slate-500">pOH</div>
                  <div className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                    {pohValue.toFixed(1)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center" dir="ltr">
                  <div className="text-[11px] text-slate-500">[H⁺] M</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-teal-700 dark:text-teal-400">
                    10^({hConcExp})
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center" dir="ltr">
                  <div className="text-[11px] text-slate-500">[OH⁻] M</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                    10^({ohConcExp})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {indicators.map((ind) => (
                  <div
                    key={ind.name}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {ind.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        اللون: <strong>{ind.colorLabel}</strong>
                      </div>
                    </div>
                    <span
                      aria-label={ind.colorLabel}
                      className={`w-8 h-8 rounded-full shrink-0 shadow-xs ${ind.swatchClass}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
