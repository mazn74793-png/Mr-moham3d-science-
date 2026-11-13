export interface FooterQuickLink {
  id: string;
  title: string;
  url: string;
}

export interface GradeItem {
  id: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn?: string;
  yearLabelAr?: string;
  yearLabelEn?: string;
  topicsAr?: string[];
  topicsEn?: string[];
  isPopular?: boolean;
}

export const DEFAULT_GRADES: GradeItem[] = [
  {
    id: 'first',
    badgeAr: 'الصف الأول الثانوي',
    badgeEn: '1st Secondary Grade',
    yearLabelAr: 'دفعة 2026',
    yearLabelEn: 'Class of 2026',
    titleAr: 'أولى ثانوي · التأسيس الشامل',
    titleEn: '1st Sec · Foundational Chemistry & Science',
    descAr:
      'مدخلك السلس لعالم الكيمياء وبناء عقلية علمية قوية لحل مسائل المول والمعادلات الأيونية بكل سهولة لمدارس اللغات والتجريبي.',
    descEn:
      'Your gateway to Chemistry & Science. Build strong problem-solving skills for mole concepts, ionic equations, and laboratory sciences.',
    topicsAr: [
      'الباب الأول: الكيمياء مركز العلوم وتقنيات النانو (Chemistry & Nanotechnology)',
      'الباب الثاني: الكيمياء الكمية وحساب المول والمعادلات (Stoichiometry & Mole Calculations)',
      'الباب الثالث: المحاليل والغرويات والأحماض والقواعد (Solutions, Acids & Bases)',
    ],
    topicsEn: [
      'Unit 1: Chemistry as the Central Science & Nanotechnology',
      'Unit 2: Quantitative Chemistry, Stoichiometry & The Mole',
      'Unit 3: Solutions, Colloids, Acids and Bases',
    ],
    isPopular: false,
  },
  {
    id: 'second',
    badgeAr: 'الصف الثاني الثانوي',
    badgeEn: '2nd Secondary Grade',
    yearLabelAr: 'دفعة 2026',
    yearLabelEn: 'Class of 2026',
    titleAr: 'تانية ثانوي · فهم الذرة والروابط',
    titleEn: '2nd Sec · Atomic Structure & Chemical Bonds',
    descAr:
      'فهم عميق لأعداد الكم، التوزيع الإلكتروني، وتدرج الخواص في الجدول الدوري الحديث وقواعد لويس والتهجين الجزيئي.',
    descEn:
      'Deep understanding of Quantum Numbers, Electronic Configuration, Periodic Table trends, and Hybridization theories.',
    topicsAr: [
      'الباب الأول: بنية الذرة وتجربة رذرفورد ونظرية بور (Atomic Structure & Bohr Theory)',
      'الباب الثاني: الجدول الدوري ونصف القطر والسالبية والتأين (Periodic Table Trends)',
      'الباب الثالث: الروابط الكيميائية ونظريات التهجين الجزيئي (Chemical Bonding & Hybridization)',
    ],
    topicsEn: [
      'Unit 1: Atomic Structure, Rutherford & Bohr Models',
      'Unit 2: The Periodic Table, Atomic Radii, Electronegativity & Ionization',
      'Unit 3: Chemical Bonding, Lewis Structures & Molecular Orbitals',
    ],
    isPopular: false,
  },
  {
    id: 'third',
    badgeAr: 'الصف الثالث الثانوي',
    badgeEn: '3rd Secondary Grade',
    yearLabelAr: 'دفعة 2026 الثانوية العامة',
    yearLabelEn: 'General Secondary 2026',
    titleAr: 'تالتة ثانوي · طريق الدرجة النهائية (60/60)',
    titleEn: '3rd Sec · Road to the Full Mark (60/60)',
    descAr:
      'المنهج الكامل مع خريطة طريق الكيمياء العضوية الأسطورية ومعادلات الحديد والاتزان الكيميائي الكهربي لطلاب اللغات والتجريبي.',
    descEn:
      'Comprehensive curriculum: Transition Metals, Iron Reactions roadmap, Chemical Equilibrium, Electrochemistry, and Complete Organic Chemistry.',
    topicsAr: [
      'الباب الأول: العناصر الانتقالية والمركبات والخواص المغناطيسية (Transition Elements)',
      'الباب الثاني: التحليل الكيميائي الكيفي والكمي والمسائل (Chemical Analysis)',
      'الباب الثالث: الاتزان الكيميائي والأيوني وقانون لوشاتيليه (Chemical Equilibrium)',
      'الباب الرابع: الكيمياء الكهربية والخلايا الجلفانية وقوانين فاراداي (Electrochemistry)',
      'الباب الخامس: الكيمياء العضوية الأسطورية الشاملة (Organic Chemistry)',
    ],
    topicsEn: [
      'Chapter 1: Transition Elements, Properties & Catalytic Activity',
      'Chapter 2: Qualitative and Quantitative Chemical Analysis',
      'Chapter 3: Chemical & Ionic Equilibrium (Le Chatelier)',
      'Chapter 4: Electrochemistry, Galvanic Cells & Faraday Laws',
      'Chapter 5: Comprehensive Organic Chemistry Mastery',
    ],
    isPopular: true,
  },
];

export interface SiteConfig {
  teacherName: string;
  teacherTitle: string;
  tagline: string;
  heroDescription: string;
  heroBadge: string;
  profileImageUrl: string;
  calligraphyFont: 'Reem Kufi' | 'Aref Ruqaa' | 'Amiri' | 'Cairo';
  bodyFont: 'Cairo' | 'Tajawal' | 'Almarai';
  primaryColor: string;
  googleClientId?: string;
  adminEmails: string[];
  phone1: string;
  phone2: string;
  whatsappNumber: string;
  facebookUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  centerBranches: string;
  developerName: string;
  developerHandle: string;
  developerUrl: string;
  footerBio?: string;
  footerQuickLinks?: FooterQuickLink[];

  // Dynamic Academic Years list (editable & extensible by Admin)
  grades?: GradeItem[];

  // Legacy Academic Years Names & Descriptions (kept for backwards compatibility)
  gradeFirstTitleAr?: string;
  gradeFirstTitleEn?: string;
  gradeFirstBadgeAr?: string;
  gradeFirstDescAr?: string;

  gradeSecondTitleAr?: string;
  gradeSecondTitleEn?: string;
  gradeSecondBadgeAr?: string;
  gradeSecondDescAr?: string;

  gradeThirdTitleAr?: string;
  gradeThirdTitleEn?: string;
  gradeThirdBadgeAr?: string;
  gradeThirdDescAr?: string;

  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  teacherName: 'محمد مصطفى',
  teacherTitle: 'Mr. Mohamed Mostafa',
  tagline: 'Senior Chemistry & Science Educator · خبير الكيمياء والعلوم لمدارس اللغات والتجريبي',
  heroDescription:
    'مع مستر محمد مصطفى دراسة الـ Chemistry & Science بأسلوب تفاعلي حديث يجمع بين الفهم الدقيق والتدريب المستمر على نمط الامتحانات لطلاب مدارس اللغات والتجريبي دفعة 2026.',
  heroBadge: 'Chemistry & Science · Experimental & Language Schools 2026',
  profileImageUrl: '',
  calligraphyFont: 'Cairo',
  bodyFont: 'Cairo',
  primaryColor: '#0d9488',
  googleClientId: '244359507354-r0ic23fou6rfjgergu06i35ou2vn8qsc.apps.googleusercontent.com',
  adminEmails: ['mizoo2y2@gmail.com'],
  phone1: '0100 234 5678',
  phone2: '0111 987 6543',
  whatsappNumber: '201012345678',
  facebookUrl: 'https://facebook.com',
  youtubeUrl: 'https://youtube.com',
  telegramUrl: 'https://t.me',
  centerBranches:
    'القاهرة (مدينة نصر، المعادي، مصر الجديدة) والجيزة (الدقي، المهندسين، فيصل، الهرم) وحصص الأونلاين التفاعلية.',
  developerName: 'Mazen Mohamed',
  developerHandle: '@mazenmohamed',
  developerUrl: 'https://github.com/mazenmohamed',
  footerBio:
    'مع أ. محمد الكيمستري تبان من منظور تاني. شرح واضح، أمثلة من الواقع، وتجارب عملية تخلّيك واثق في الامتحان ومقفل المادة. انضم للكورسات وابدأ من دلوقتي مع أقوى نظام متابعة وتدريبات شاملة.',
  footerQuickLinks: [
    { id: 'l1', title: 'الرئيسية', url: '#home' },
    { id: 'l2', title: 'مميزات المنصة', url: '#features' },
    { id: 'l3', title: 'السنوات الدراسية (دفعة 2026)', url: '#academic-years' },
    { id: 'l4', title: 'دخول منصة الطالب', url: '#student' },
  ],
  grades: DEFAULT_GRADES,

  gradeFirstTitleAr: 'أولى ثانوي · التأسيس الشامل',
  gradeFirstTitleEn: '1st Sec · Foundational Chemistry & Science',
  gradeFirstBadgeAr: 'الصف الأول الثانوي',
  gradeFirstDescAr:
    'مدخلك السلس لعالم الكيمياء وبناء عقلية علمية قوية لحل مسائل المول والمعادلات الأيونية بكل سهولة لمدارس اللغات والتجريبي.',

  gradeSecondTitleAr: 'تانية ثانوي · فهم الذرة والروابط',
  gradeSecondTitleEn: '2nd Sec · Atomic Structure & Chemical Bonds',
  gradeSecondBadgeAr: 'الصف الثاني الثانوي',
  gradeSecondDescAr:
    'فهم عميق لأعداد الكم، التوزيع الإلكتروني، وتدرج الخواص في الجدول الدوري الحديث وقواعد لويس والتهجين الجزيئي.',

  gradeThirdTitleAr: 'تالتة ثانوي · طريق الدرجة النهائية (60/60)',
  gradeThirdTitleEn: '3rd Sec · Road to the Full Mark (60/60)',
  gradeThirdBadgeAr: 'الصف الثالث الثانوي (دفعة 2026)',
  gradeThirdDescAr:
    'المنهج الكامل مع خريطة طريق الكيمياء العضوية الأسطورية ومعادلات الحديد والاتزان الكيميائي الكهربي لطلاب اللغات والتجريبي.',

  feature1Title: '🏆 دروع وتكريم الأوائل',
  feature1Desc: 'مكافآت وجوائز دورية لأعلى درجات الاختبارات الإلكترونية والشاملة لطلاب اللغات والتجريبي.',
  feature2Title: '💡 تبسيط الـ Chemistry & Science',
  feature2Desc:
    'الـ Chemistry مش مجرد حفظ معادلات! شرح مفاهيم علمية دقيقة، حل المسائل الكيميائية المعقدة خطوة بخطوة باللغة الإنجليزية والمصطلحات المعتمدة.',
  feature3Title: '🧪 تجارب معملية ومسائل تطبيقية',
  feature3Desc:
    'محاكاة تفاعلية للتفاعلات الكيميائية وتدريبات مكثفة على أحدث أفكار امتحانات الثانوية العامة والشهادات التجريبية.',
  feature4Title: '⚡ متابعة 24/7 مع مستر محمد',
  feature4Desc:
    'فريق عمل متكامل للرد الفوري على كل الأسئلة والمسائل الصعبة ومتابعة ولي الأمر عبر واتساب.',
};

export function getResolvedGrades(siteConfig?: SiteConfig): GradeItem[] {
  const source =
    Array.isArray(siteConfig?.grades) && siteConfig.grades.length > 0
      ? siteConfig.grades
      : DEFAULT_GRADES;

  return source.map((g) => {
    if (!siteConfig) return g;
    if (g.id === 'first') {
      return {
        ...g,
        titleAr: g.titleAr || siteConfig.gradeFirstTitleAr || DEFAULT_GRADES[0].titleAr,
        titleEn: g.titleEn || siteConfig.gradeFirstTitleEn || DEFAULT_GRADES[0].titleEn,
        badgeAr: g.badgeAr || siteConfig.gradeFirstBadgeAr || DEFAULT_GRADES[0].badgeAr,
        descAr: g.descAr || siteConfig.gradeFirstDescAr || DEFAULT_GRADES[0].descAr,
      };
    }
    if (g.id === 'second') {
      return {
        ...g,
        titleAr: g.titleAr || siteConfig.gradeSecondTitleAr || DEFAULT_GRADES[1].titleAr,
        titleEn: g.titleEn || siteConfig.gradeSecondTitleEn || DEFAULT_GRADES[1].titleEn,
        badgeAr: g.badgeAr || siteConfig.gradeSecondBadgeAr || DEFAULT_GRADES[1].badgeAr,
        descAr: g.descAr || siteConfig.gradeSecondDescAr || DEFAULT_GRADES[1].descAr,
      };
    }
    if (g.id === 'third') {
      return {
        ...g,
        titleAr: g.titleAr || siteConfig.gradeThirdTitleAr || DEFAULT_GRADES[2].titleAr,
        titleEn: g.titleEn || siteConfig.gradeThirdTitleEn || DEFAULT_GRADES[2].titleEn,
        badgeAr: g.badgeAr || siteConfig.gradeThirdBadgeAr || DEFAULT_GRADES[2].badgeAr,
        descAr: g.descAr || siteConfig.gradeThirdDescAr || DEFAULT_GRADES[2].descAr,
      };
    }
    return g;
  });
}

export function getGradeDisplayName(
  gradeId?: string,
  siteConfig?: SiteConfig,
  lang: 'ar' | 'en' = 'ar'
): string {
  if (!gradeId) return lang === 'en' ? 'Unspecified' : 'غير محدد';
  const grades = getResolvedGrades(siteConfig);
  const found = grades.find((g) => g.id === gradeId);
  if (found) {
    return lang === 'en' ? found.badgeEn || found.titleEn : found.badgeAr || found.titleAr;
  }
  return gradeId;
}
