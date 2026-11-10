import { Lecture, Quiz, AttachmentFile, CloudinaryConfig, UserProfile } from '../types';

export const INITIAL_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'chemistry-egypt',
  uploadPreset: 'mohamed_mostafa_preset',
};

export const INITIAL_LECTURES: Lecture[] = [
  // الصف الثالث الثانوي
  {
    id: 'lec-3-1',
    sessionOrder: 1,
    quizId: 'quiz-3-1',
    title: 'مقدمة العناصر الانتقالية والتركيب الإلكتروني للسلسلة الأولى 3d (الحصة 1)',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'الباب الأول: العناصر الانتقالية',
    duration: '48 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'مذكرة شرح الحصة الأولى - التوزيع الإلكتروني وحالات التأكسد.pdf',
    pdfUrl: '#',
    description: 'شرح مفصل وممتع لقواعد التوزيع الإلكتروني الشاذ للكروم والنحاس، مع تحليل حالات التأكسد الأكثر استقراراً وعلاقتها بالطاقة وطرق حل مسائل امتحان الثانوية العامة.',
    isFreePreview: true,
    viewsCount: 3420,
    dateAdded: '2026-10-15',
  },
  {
    id: 'lec-3-2',
    sessionOrder: 2,
    quizId: 'quiz-3-2',
    title: 'الخواص العامة للفلزات الانتقالية: الألوان والمغناطيسية والنشاط الحفزي (الحصة 2)',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'الباب الأول: العناصر الانتقالية',
    duration: '55 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'جدول مقارنة الخواص البارامغناطيسية والديامغناطيسية.pdf',
    pdfUrl: '#',
    description: 'إزاي تحدد المادة Para أو Dia بالنظر وبدون حسابات معقدة؟ سر نظرية امتصاص الفوتونات وانعكاس اللون المتمم بأسلوب مستر محمد مصطفى (Chemistry & Science).',
    isFreePreview: false,
    viewsCount: 2890,
    dateAdded: '2026-10-22',
  },
  {
    id: 'lec-3-3',
    sessionOrder: 3,
    quizId: 'quiz-3-3',
    title: 'تفاعلات وأكاسيد الحديد: خريطة طريق المعادلات من خام الهيماتيت للحديد الصلب (الحصة 3)',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'الباب الأول: العناصر الانتقالية',
    duration: '62 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'خريطة ذهنية لمعادلات الحديد وأكاسيده الثلاثة.pdf',
    pdfUrl: '#',
    description: 'الخريطة السحرية لمعادلات الحديد اللي هتخليك تحل أي مسألة أو تحويلة في أقل من 30 ثانية. من الفرن العالي وفرن مدركس وحتى تسخين أكسالات الحديد بمعزل عن الهواء.',
    isFreePreview: false,
    viewsCount: 4120,
    dateAdded: '2026-11-01',
  },
  {
    id: 'lec-3-4',
    sessionOrder: 4,
    quizId: 'quiz-3-4',
    title: 'الكيمياء العضوية الأسطورية: الألكانات وطرق التسمية بنظام الأيوباك IUPAC (الحصة 4)',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'الباب الخامس: الكيمياء العضوية',
    duration: '70 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'كتيب قواعد التسمية الإنجليزية والعربية العضوية 2026.pdf',
    pdfUrl: '#',
    description: 'أقوى تأسيس في الكيمياء العضوية، هنبدأ من ذرة الكربون وروابطها الأربعة، وإزاي تحدد أطول سلسلة كربونية وترقم بدون أي لخبطة مهما كانت التفرعات معقدة.',
    isFreePreview: false,
    viewsCount: 5200,
    dateAdded: '2026-11-05',
  },

  // الصف الثاني الثانوي
  {
    id: 'lec-2-1',
    sessionOrder: 1,
    quizId: 'quiz-2-1',
    title: 'تطور مفهوم بنية الذرة: من دالتون وطومسون إلى تجربة رذرفورد الذهبية (الحصة 1)',
    grade: 'second',
    gradeLabel: 'الصف الثاني الثانوي',
    chapter: 'الباب الأول: بنية الذرة',
    duration: '42 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'ملخص تجربة صفيحة الذهب وتفسير انحراف جسيمات ألفا.pdf',
    pdfUrl: '#',
    description: 'رحلة استكشاف الذرة ومكوناتها، كيف كشفت أشعة المهبط عن الإلكترون وماذا حدث لجسيمات ألفا داخل رقاقة الذهب لتثبت أن معظم حجم الذرة فراغ.',
    isFreePreview: true,
    viewsCount: 2150,
    dateAdded: '2026-10-18',
  },
  {
    id: 'lec-2-2',
    sessionOrder: 2,
    quizId: 'quiz-2-2',
    title: 'أعداد الكم الأربعة (n, l, ml, ms) وقواعد التوزيع الإلكتروني (الحصة 2)',
    grade: 'second',
    gradeLabel: 'الصف الثاني الثانوي',
    chapter: 'الباب الأول: بنية الذرة',
    duration: '50 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'تمارين محلولة على أعداد الكم الأربعة وقاعدة هوند.pdf',
    pdfUrl: '#',
    description: 'مبدأ البناء التصاعدي، مبدأ باولي للاستبعاد، وقاعدة هوند في توزيع الإلكترونات. كيفية حساب قيم أعداد الكم بدقة للالكترون الأخير في أي عنصر.',
    isFreePreview: false,
    viewsCount: 1980,
    dateAdded: '2026-10-28',
  },

  // الصف الأول الثانوي
  {
    id: 'lec-1-1',
    sessionOrder: 1,
    quizId: 'quiz-1-1',
    title: 'الكيمياء مركز العلوم وأهمية أدوات القياس في المعمل الكيميائي (الحصة 1)',
    grade: 'first',
    gradeLabel: 'الصف الأول الثانوي',
    chapter: 'الباب الأول: الكيمياء مركز العلوم',
    duration: '38 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'دليل أدوات المعمل: الماصة، السحاحة، والمخبار المدرج.pdf',
    pdfUrl: '#',
    description: 'مدخلك لعالم الكيمياء، هنتعرف على علاقة الكيمياء بالفيزياء والبيولوجي والطب، وتدريب عملي على قراءة حجوم السوائل واستخدام أجهزة الـ pH الرقمية.',
    isFreePreview: true,
    viewsCount: 3100,
    dateAdded: '2026-10-12',
  },
  {
    id: 'lec-1-2',
    sessionOrder: 2,
    quizId: 'quiz-1-2',
    title: 'المول والمعادلة الأيونية وحساب كتل المواد المتفاعلة والناتجة (الحصة 2)',
    grade: 'first',
    gradeLabel: 'الصف الأول الثانوي',
    chapter: 'الباب الثاني: الكيمياء الكمية',
    duration: '52 دقيقة',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
    pdfTitle: 'مثلثات قوانين المول والكتلة الجزيئية وعدد أفوجادرو.pdf',
    pdfUrl: '#',
    description: 'تطبيق مباشر على كتابة المعادلات الأيونية الموزونة لتفاعلات الترسيب والتعادل، وقوانين المول وحجم الغاز في م.ض.د (STP).',
    isFreePreview: false,
    viewsCount: 2450,
    dateAdded: '2026-10-25',
  },
];

export const INITIAL_ATTACHMENTS: AttachmentFile[] = [
  {
    id: 'att-1',
    title: 'مذكرة السلسلة الانتقالية الأولى والمغناطيسية 2026',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'العناصر الانتقالية',
    fileSize: '4.8 MB',
    fileType: 'pdf',
    downloadUrl: '#',
    pageCount: 32,
    dateAdded: '2026-10-15',
  },
  {
    id: 'att-2',
    title: 'خرائط المعادلات الذهنية لأكاسيد وتفاعلات الحديد',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'العناصر الانتقالية',
    fileSize: '2.1 MB',
    fileType: 'pdf',
    downloadUrl: '#',
    pageCount: 8,
    dateAdded: '2026-10-29',
  },
  {
    id: 'att-3',
    title: 'بنك أسئلة الكيمياء العضوية والألكانات والألكينات',
    grade: 'third',
    gradeLabel: 'الصف الثالث الثانوي',
    chapter: 'الكيمياء العضوية',
    fileSize: '6.5 MB',
    fileType: 'pdf',
    downloadUrl: '#',
    pageCount: 45,
    dateAdded: '2026-11-04',
  },
  {
    id: 'att-4',
    title: 'شيت قوانين ومسائل أعداد الكم وقاعدة هوند',
    grade: 'second',
    gradeLabel: 'الصف الثاني الثانوي',
    chapter: 'بنية الذرة',
    fileSize: '3.2 MB',
    fileType: 'pdf',
    downloadUrl: '#',
    pageCount: 18,
    dateAdded: '2026-10-20',
  },
  {
    id: 'att-5',
    title: 'ملزمة مراجعة الباب الأول: الكيمياء مركز العلوم وتكنولوجيا النانو',
    grade: 'first',
    gradeLabel: 'الصف الأول الثانوي',
    chapter: 'مركز العلوم',
    fileSize: '3.7 MB',
    fileType: 'pdf',
    downloadUrl: '#',
    pageCount: 22,
    dateAdded: '2026-10-16',
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  // كويز الحصة الأولى - تالتة ثانوي
  {
    id: 'quiz-3-1',
    lectureId: 'lec-3-1',
    title: 'امتحان الحصة 1: التوزيع الإلكتروني للعناصر الانتقالية وحالات التأكسد',
    grade: 'third',
    chapter: 'الباب الأول: العناصر الانتقالية',
    durationMinutes: 15,
    questions: [
      {
        id: 'q1',
        question: 'عنصر انتقالي من السلسلة الأولى (3d) عزمه المغناطيسي في حالته الذرية أكبر ما يمكن، يكون تركيبه الإلكتروني:',
        options: [
          '[Ar] 4s¹ 3d⁵ (الكروم Cr)',
          '[Ar] 4s² 3d⁵ (المنجنيز Mn)',
          '[Ar] 4s¹ 3d¹⁰ (النحاس Cu)',
          '[Ar] 4s² 3d⁶ (الحديد Fe)'
        ],
        correctAnswer: 0,
        explanation: 'عنصر الكروم يحتوي على 6 إلكترونات مفردة (واحد في 4s وخمسة في 3d) مما يجعله صاحب أكبر عدد من الإلكترونات المفردة وبالتالي أكبر عزم مغناطيسي في الحالة الذرية.',
        formula: 'Cr_{24} = [Ar]_{18} 4s^1 3d^5'
      },
      {
        id: 'q2',
        question: 'أي العناصر التالية له أعلى حالة تأكسد شائعة ومستقرة تصل إلى +7؟',
        options: [
          'المنجنيز (Mn)',
          'الفاناديوم (V)',
          'السكانديوم (Sc)',
          'التيتانيوم (Ti)'
        ],
        correctAnswer: 0,
        explanation: 'المنجنيز يفقد إلكتروني 4s وإلكترونات 3d الخمسة بالكامل ليعطي حالة التأكسد القصوى +7 كما في برمنجانات البوتاسيوم KMnO4.',
        formula: 'Mn_{25} = [Ar]_{18} 4s^2 3d^5 \\implies Mn^{7+} = [Ar]_{18}'
      },
      {
        id: 'q3',
        question: 'المستوى الفرعي 3d يكون نصف ممتلئ وأكثر استقراراً في أيون:',
        options: [
          'Fe³⁺ (الحديد الثلاثي)',
          'Fe²⁺ (الحديد الثنائي)',
          'Cu²⁺ (النحاس الثنائي)',
          'Sc³⁺ (السكانديوم الثلاثي)'
        ],
        correctAnswer: 0,
        explanation: 'عند تأكسد الحديد Fe إلى Fe³⁺ يفقد إلكترونين من 4s وإلكتروناً من 3d فيصبح 3d⁵ (نصف ممتلئ)، مما يجعله أكثر استقراراً من Fe²⁺.',
        formula: 'Fe^{3+} = [Ar]_{18} 3d^5'
      }
    ]
  },

  // كويز الحصة الثانية - تالتة ثانوي
  {
    id: 'quiz-3-2',
    lectureId: 'lec-3-2',
    title: 'امتحان الحصة 2: الخواص العامة، الألوان والمغناطيسية والنشاط الحفزي',
    grade: 'third',
    chapter: 'الباب الأول: العناصر الانتقالية',
    durationMinutes: 15,
    questions: [
      {
        id: 'q2-1',
        question: 'المادة التي تتنافر مع المجال المغناطيسي الخارجي (ديامغناطيسية) هي:',
        options: [
          'ZnSO₄ (كبريتات الخارصين)',
          'FeCl₃ (كلوريد الحديد الثلاثي)',
          'Cr₂O₃ (أكسيد الكروم الثلاثي)',
          'V₂O₅ (خامس أكسيد الفاناديوم)'
        ],
        correctAnswer: 0,
        explanation: 'أيون الخارصين Zn²⁺ يكون تركيبه [Ar] 3d¹⁰، وجميع أوربيتالات 3d ممتلئة في حالة ازدواج تام ولا توجد إلكترونات مفردة.',
        formula: 'Zn^{2+} = [Ar]_{18} 3d^{10}'
      },
      {
        id: 'q2-2',
        question: 'عندما تمتص المادة الانتقالية فوتونات اللون الأحمر من الضوء الأبيض فإنها تبدو للعين باللون:',
        options: [
          'الأخضر (اللون المتمم للأحمر)',
          'الأزرق',
          'الأصفر',
          'البرتقالي'
        ],
        correctAnswer: 0,
        explanation: 'اللون الذي تراه العين هو محصلة الألوان المتبقية المنعكسة (اللون المتمم Complementary Color)، والمتمم للون الأحمر هو اللون الأخضر.',
      }
    ]
  },

  // كويز الحصة الثالثة - تالتة ثانوي
  {
    id: 'quiz-3-3',
    lectureId: 'lec-3-3',
    title: 'امتحان الحصة 3: معادلات وتحويلات أكاسيد الحديد',
    grade: 'third',
    chapter: 'الباب الأول: العناصر الانتقالية',
    durationMinutes: 15,
    questions: [
      {
        id: 'q3-1',
        question: 'عند تسخين أكسالات الحديد (II) بمعزل عن الهواء يتكون:',
        options: [
          'أكسيد حديد (II) وغازات أول وثاني أكسيد الكربون',
          'أكسيد حديد (III) وثاني أكسيد الكربون',
          'أكسيد حديد مغناطيسي فقط',
          'فلز الحديد الحر وبخار ماء'
        ],
        correctAnswer: 0,
        explanation: 'بمعزل عن الهواء يتكون FeO ولا يتأكسد إلى Fe2O3 بسبب وجود غاز أول أكسيد الكربون (CO) الذي يعمل كعامل مختزل قوي.',
        formula: '(COO)_2Fe \\xrightarrow{\\Delta \\text{ (بمعزل عن الهواء)}} FeO + CO\\uparrow + CO_2\\uparrow'
      },
      {
        id: 'q3-2',
        question: 'أكسيد الحديد الأسود المغناطيسي Fe3O4 يعتبر أكسيداً مختلطاً لأنه يتفاعل مع الأحماض المركزة الساخنة ليعطي:',
        options: [
          'أملاح حديد (II) وأملاح حديد (III) وماء',
          'أملاح حديد (II) فقط وغاز هيدروجين',
          'أملاح حديد (III) فقط وماء',
          'غاز ثاني أكسيد الكبريت وفلز الحديد'
        ],
        correctAnswer: 0,
        explanation: 'Fe3O4 خليط من FeO و Fe2O3 ولذلك يعطي خليطاً من أملاح الحديد الثنائي والثلاثي مع الأحماض المركزة الساخنة.',
      }
    ]
  },

  // كويز الحصة الرابعة - تالتة ثانوي
  {
    id: 'quiz-3-4',
    lectureId: 'lec-3-4',
    title: 'امتحان الحصة 4: أساسيات الكيمياء العضوية وتسمية الأيوباك',
    grade: 'third',
    chapter: 'الكيمياء العضوية',
    durationMinutes: 20,
    questions: [
      {
        id: 'q4-1',
        question: 'الاسم الصحيح للمركب التالي طبقاً لنظام الأيوباك IUPAC: (CH3)2CH-CH2-CH3 هو:',
        options: [
          '2-ميثيل بيوتان',
          '3-ميثيل بيوتان',
          'أيزوبنتان',
          '2-إيثيل بروبان'
        ],
        correctAnswer: 0,
        explanation: 'أطول سلسلة كربونية متصلة تحتوي على 4 ذرات كربون (بيوتان)، ونبدأ الترقيم من الطرف الأقرب للتفرع ليأخذ التفرع الميثيل رقم 2.',
        formula: 'CH_3-CH(CH_3)-CH_2-CH_3'
      }
    ]
  },

  // الصف الثاني الثانوي
  {
    id: 'quiz-2-1',
    lectureId: 'lec-2-1',
    title: 'امتحان الحصة 1: تطور بنية الذرة وتجربة رذرفورد',
    grade: 'second',
    chapter: 'بنية الذرة',
    durationMinutes: 10,
    questions: [
      {
        id: 'q2-1-1',
        question: 'العالم الذي افترض أن معظم حجم الذرة فراغ بعد ارتداد قلة ضئيلة جداً من جسيمات ألفا هو:',
        options: [
          'رذرفورد',
          'دالتون',
          'طومسون',
          'بور'
        ],
        correctAnswer: 0,
        explanation: 'تجربة رذرفورد الشهيرة بإطلاق جسيمات ألفا على صفيحة رقيقة من الذهب أثبتت أن معظم حجم الذرة فراغ لوجود نواة متناهية الصغر وكثيفة في المركز.',
      }
    ]
  },
  {
    id: 'quiz-2-2',
    lectureId: 'lec-2-2',
    title: 'امتحان الحصة 2: أعداد الكم وقواعد التوزيع الإلكتروني',
    grade: 'second',
    chapter: 'بنية الذرة',
    durationMinutes: 10,
    questions: [
      {
        id: 'q2-2-1',
        question: 'أقصى عدد من الإلكترونات يستوعبه المستوى الفرعي الذي له عدد الكم الثانوي l = 2 هو:',
        options: [
          '10 إلكترونات (المستوى الفرعي d)',
          '6 إلكترونات (المستوى الفرعي p)',
          '14 إلكترون (المستوى الفرعي f)',
          '2 إلكترون (المستوى الفرعي s)'
        ],
        correctAnswer: 0,
        explanation: 'عندما تكون قيمة l = 2 فإن المستوى الفرعي هو d، ويحتوي على 5 أوربيتالات، وكل أوربيتال يتسع لإلكترونين كحد أقصى (5 × 2 = 10).',
      }
    ]
  },

  // الصف الأول الثانوي
  {
    id: 'quiz-1-1',
    lectureId: 'lec-1-1',
    title: 'امتحان الحصة 1: الكيمياء مركز العلوم وأدوات القياس',
    grade: 'first',
    chapter: 'مركز العلوم',
    durationMinutes: 10,
    questions: [
      {
        id: 'q1-1-1',
        question: 'الأداة الزجاجية الدقيقة المستخدمة في عمليات المعايرة بدقة عالية تسمى:',
        options: [
          'السحاحة (Burette)',
          'المخبار المدرج',
          'الكأس الزجاجي',
          'الماصة العادية'
        ],
        correctAnswer: 0,
        explanation: 'تستخدم السحاحة في تجارب المعايرة الدقيقة لقياس حجوم المحاليل المضافة قطرة قطرة بدقة بالغة.',
      }
    ]
  },
  {
    id: 'quiz-1-2',
    lectureId: 'lec-1-2',
    title: 'امتحان الحصة 2: الحسابات الكيميائية والمول والمعادلة الأيونية',
    grade: 'first',
    chapter: 'الكيمياء الكمية',
    durationMinutes: 12,
    questions: [
      {
        id: 'q1-2-1',
        question: 'كتلة مول واحد من غاز الأكسجين O2 (الكتلة الذرية O = 16) تساوي:',
        options: [
          '32 جرام/مول',
          '16 جرام/مول',
          '64 جرام/مول',
          '8 جرام/مول'
        ],
        correctAnswer: 0,
        explanation: 'جزيء غاز الأكسجين ثنائي الذرة O2، وبالتالي كتلته المولية = 2 × 16 = 32 جم/مول.',
        formula: 'M(O_2) = 2 \\times 16 = 32\\text{ g/mol}'
      }
    ]
  }
];

// الطلاب المسجلين الحقيقيين للمنصة (فارغة افتراضياً لضمان دقة وحسابية البيانات)
export const INITIAL_STUDENTS: UserProfile[] = [];


export interface LabReagent {
  id: string;
  name: string;
  formula: string;
  color: string;
  type: 'acid' | 'base' | 'salt' | 'indicator' | 'metal';
  pH: number;
}

export const LAB_REAGENTS: LabReagent[] = [
  { id: 'hcl', name: 'حمض الهيدروكلوريك', formula: 'HCl (aq)', color: '#e0f2fe', type: 'acid', pH: 1 },
  { id: 'naoh', name: 'هيدروكسيد الصوديوم', formula: 'NaOH (aq)', color: '#ecfdf5', type: 'base', pH: 13 },
  { id: 'cuso4', name: 'كبريتات النحاس (II)', formula: 'CuSO4 (aq)', color: '#38bdf8', type: 'salt', pH: 6 },
  { id: 'fecl3', name: 'كلوريد الحديد (III)', formula: 'FeCl3 (aq)', color: '#fef08a', type: 'salt', pH: 3 },
  { id: 'phph', name: 'دليل الفينولفثالين', formula: 'C20H14O4', color: '#ffffff', type: 'indicator', pH: 7 },
  { id: 'fe_powder', name: 'برادة الحديد', formula: 'Fe (s)', color: '#64748b', type: 'metal', pH: 7 },
];
