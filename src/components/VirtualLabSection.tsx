import React, { useState } from 'react';
import { FlaskConical, Beaker, RotateCcw, Sparkles, Flame, Droplets, Info } from 'lucide-react';

interface Experiment {
  id: string;
  title: string;
  reagentA: string;
  reagentB: string;
  reagentAName: string;
  reagentBName: string;
  equation: string;
  resultColor: string;
  observation: string;
  hasBubbles: boolean;
  precipitate: boolean;
  tempChange: string;
  curriculumChapter: string;
}

const EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-1',
    title: 'تفاعل التعادل مع دليل الفينولفثالين',
    reagentA: 'حمض الهيدروكلوريك HCl',
    reagentB: 'هيدروكسيد الصوديوم NaOH + Ph.Ph',
    reagentAName: 'HCl (عديم اللون)',
    reagentBName: 'NaOH مع دليل (وردي)',
    equation: 'HCl + NaOH \\rightarrow NaCl + H_2O',
    resultColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 border-emerald-300',
    observation: 'اختفاء اللون الوردي تماماً وتحول المحلول إلى عديم اللون لتعادل الوسط عند pH = 7، مع تصاعد حرارة طفيفة.',
    hasBubbles: false,
    precipitate: false,
    tempChange: '+4°C (تفاعل طارد للحرارة)',
    curriculumChapter: 'الباب الثاني (التحليل الحجمي - المعايرة)',
  },
  {
    id: 'exp-2',
    title: 'تكوين راسب بني محمر لهيدروكسيد الحديد (III)',
    reagentA: 'محلول كلوريد الحديد (III) FeCl3',
    reagentB: 'محلول هيدروكسيد الصوديوم NaOH',
    reagentAName: 'FeCl3 (أصفر باهت)',
    reagentBName: 'NaOH (قلوي عديم اللون)',
    equation: 'FeCl_3 + 3NaOH \\rightarrow Fe(OH)_3\\downarrow + 3NaCl',
    resultColor: 'bg-amber-700/80 text-amber-100 border-amber-600',
    observation: 'تكوّن راسب جيلاتيني بني محمر من هيدروكسيد الحديد (III) لا يذوب في الزيادة من الصودا الكاوية، ويذوب في الأحماض.',
    hasBubbles: false,
    precipitate: true,
    tempChange: '+2°C',
    curriculumChapter: 'الباب الأول والباب الثاني (الكشف عن كاتيون الحديد III)',
  },
  {
    id: 'exp-3',
    title: 'تفاعل فلز الحديد مع حمض الهيدروكلوريك المخفف',
    reagentA: 'برادة حديد نشطة Fe (s)',
    reagentB: 'حمض الهيدروكلوريك المخفف HCl (aq)',
    reagentAName: 'برادة حديد Fe',
    reagentBName: 'حمض HCl مخفف',
    equation: 'Fe + 2HCl \\rightarrow FeCl_2 + H_2\\uparrow',
    resultColor: 'bg-teal-200/80 dark:bg-teal-900/60 text-teal-950 border-teal-400',
    observation: 'فوران شديد وتصاعد فقاعات غاز الهيدروجين الذي يشتعل بفرقعة، ويتلون المحلول بالأخضر الفاتح (FeCl2) لأن الهيدروجين عامل مختزل يمنع تكوّن أملاح الحديد III.',
    hasBubbles: true,
    precipitate: false,
    tempChange: '+9°C (تصاعد سريع للغاز)',
    curriculumChapter: 'الباب الأول (تفاعلات فلز الحديد والأحماض)',
  },
];

export const VirtualLabSection: React.FC = () => {
  const [selectedExp, setSelectedExp] = useState<Experiment>(EXPERIMENTS[0]);
  const [isReacting, setIsReacting] = useState(false);
  const [reacted, setReacted] = useState(false);

  const handleStartReaction = () => {
    setIsReacting(true);
    setReacted(false);
    setTimeout(() => {
      setIsReacting(false);
      setReacted(true);
    }, 1200);
  };

  const handleReset = () => {
    setIsReacting(false);
    setReacted(false);
  };

  const handleSelect = (exp: Experiment) => {
    setSelectedExp(exp);
    setIsReacting(false);
    setReacted(false);
  };

  return (
    <section id="virtual-lab" className="py-20 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>تجربة تفاعلية حصرية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white font-kufi">
            معمل الكيمياء الافتراضي لطلاب الأستاذ محمد مصطفى 🧪
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            جرب خلط الكواشف الكيميائية بنفسك، وشاهد تغير الألوان وتصاعد الغازات وتكوّن الرواسب كما تشرحها حصص المعمل.
          </p>
        </div>

        {/* Interactive Lab Stage & Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Controls Deck (Right side in RTL) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                اختر التجربة الكيميائية:
              </span>

              <div className="space-y-3">
                {EXPERIMENTS.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleSelect(exp)}
                    className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedExp.id === exp.id
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm sm:text-base font-kufi">{exp.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {exp.curriculumChapter.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {exp.equation}
                    </p>
                  </button>
                ))}
              </div>

              {/* Experiment details callout */}
              <div className="p-4 rounded-2xl bg-[#fafffb] dark:bg-slate-800 border border-teal-100 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 font-kufi">
                  <Info className="w-4 h-4" />
                  <span>المواد المتفاعلة في الأنبوبة:</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div>• المتفاعل الأول: <span className="font-semibold">{selectedExp.reagentA}</span></div>
                  <div>• المتفاعل الثاني: <span className="font-semibold">{selectedExp.reagentB}</span></div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStartReaction}
                disabled={isReacting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isReacting ? 'جاري خلط المحاليل...' : reacted ? 'إعادة التفاعل' : 'ابدأ التفاعل الكيميائي ⚗️'}</span>
              </button>

              <button
                onClick={handleReset}
                title="تفريغ الكأس المعملي"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Visual Lab Stage (Left side in RTL) */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 relative flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Ambient glassware visual */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar of Stage */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                <span className="text-xs font-mono text-teal-300 font-semibold">{selectedExp.curriculumChapter}</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{reacted ? selectedExp.tempChange : 'درجة حرارة الغرفة (25°C)'}</span>
              </div>
            </div>

            {/* Center Chemical Flask Apparatus Simulation */}
            <div className="py-8 flex flex-col items-center justify-center relative min-h-[260px]">
              
              {/* Chemical Vessel Simulation */}
              <div className="relative w-44 h-56 flex flex-col items-center justify-end">
                {/* Flask Neck */}
                <div className="w-12 h-14 border-x-2 border-t-2 border-white/40 rounded-t-lg bg-white/5 backdrop-blur-xs relative z-10">
                  {/* Pouring stream when reacting */}
                  {isReacting && (
                    <div className="w-1.5 h-full mx-auto bg-amber-400 animate-pulse rounded-full" />
                  )}
                </div>

                {/* Flask Body */}
                <div className="w-44 h-44 rounded-b-3xl border-2 border-white/40 bg-white/10 backdrop-blur-sm relative overflow-hidden flex items-end p-2 shadow-inner">
                  
                  {/* Liquid inside flask */}
                  <div 
                    className={`w-full rounded-b-2xl transition-all duration-700 relative ${
                      reacted
                        ? `${selectedExp.resultColor} h-32`
                        : isReacting
                        ? 'bg-amber-400/70 h-28 animate-pulse'
                        : 'bg-teal-400/30 h-20'
                    }`}
                  >
                    {/* Animated bubbles if gas evolved */}
                    {reacted && selectedExp.hasBubbles && (
                      <div className="absolute inset-0 flex justify-around items-end overflow-hidden pb-1">
                        <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce duration-300"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce delay-200"></span>
                        <span className="w-3 h-3 rounded-full bg-white/80 animate-bounce delay-150"></span>
                      </div>
                    )}

                    {/* Precipitate sediment at bottom */}
                    {reacted && selectedExp.precipitate && (
                      <div className="absolute bottom-0 inset-x-0 h-4 bg-amber-950/90 rounded-b-2xl flex items-center justify-center text-[10px] text-amber-200 font-bold">
                        راسب جيلاتيني (سقوط في القاع)
                      </div>
                    )}
                  </div>

                  {/* Glass measurement ticks */}
                  <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-[9px] font-mono text-white/50 select-none">
                    <span>- 200ml</span>
                    <span>- 150ml</span>
                    <span>- 100ml</span>
                    <span>- 50ml</span>
                  </div>
                </div>
              </div>

              {/* Status indicator badge */}
              <div className="mt-4">
                {isReacting ? (
                  <span className="text-xs font-bold text-amber-400 animate-pulse font-kufi">
                    ⚗️ جاري حدوث التفاعل الكيميائي وتكسير الروابط...
                  </span>
                ) : reacted ? (
                  <span className="text-xs font-bold text-teal-400 font-kufi">
                    ✓ اكتمل التفاعل وتم الوصول لحالة الاتزان الكيميائي
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-sans">
                    اضغط على "ابدأ التفاعل الكيميائي" لرؤية النتيجة
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Observation & Equation Deck */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold font-kufi">المعادلة الكيميائية الموزونة:</span>
                <span className="font-mono text-xs sm:text-sm text-amber-400 font-bold dir-ltr">
                  {selectedExp.equation}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-teal-400">الملاحظة والاستنتاج: </span>
                {selectedExp.observation}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
