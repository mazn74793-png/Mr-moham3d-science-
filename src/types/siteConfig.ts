export interface FooterQuickLink {
  id: string;
  title: string;
  url: string;
}

export interface SiteConfig {
  teacherName: string;
  teacherTitle: string;
  tagline: string;
  heroDescription: string;
  heroBadge: string;
  profileImageUrl: string;
  calligraphyFont: 'Reem Kufi' | 'Aref Ruqaa' | 'Amiri' | 'Cairo';
  bodyFont: 'Cairo' | 'Tajawal' | 'Almarai';
  primaryColor: string; // e.g. '#0d9488'
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
  
  // Customizable Academic Years Names & Descriptions
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
  heroDescription: 'مع مستر محمد مصطفى دراسة الـ Chemistry & Science بأسلوب تفاعلي حديث يجمع بين الفهم الدقيق والتدريب المستمر على نمط الامتحانات لطلاب مدارس اللغات والتجريبي دفعة 2026.',
  heroBadge: 'Chemistry & Science · Experimental & Language Schools 2026',
  profileImageUrl: '/images/teacher_placeholder.svg',
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
  centerBranches: 'القاهرة (مدينة نصر، المعادي، مصر الجديدة) والجيزة (الدقي، المهندسين، فيصل، الهرم) وحصص الأونلاين التفاعلية.',
  developerName: 'Mazen Mohamed',
  developerHandle: '@mazenmohamed',
  developerUrl: 'https://github.com/mazenmohamed',
  footerBio: 'مع أ. محمد الكيمستري تبان من منظور تاني. شرح واضح، أمثلة من الواقع، وتجارب عملية تخلّيك واثق في الامتحان ومقفل المادة. انضم للكورسات وابدأ من دلوقتي مع أقوى نظام متابعة وتدريبات شاملة.',
  footerQuickLinks: [
    { id: 'l1', title: 'الرئيسية', url: '#home' },
    { id: 'l2', title: 'مميزات المنصة', url: '#features' },
    { id: 'l3', title: 'السنوات الدراسية (دفعة 2026)', url: '#academic-years' },
    { id: 'l4', title: 'دخول منصة الطالب', url: '#student' },
  ],
  gradeFirstTitleAr: 'أولى ثانوي · التأسيس الشامل',
  gradeFirstTitleEn: '1st Sec · Foundational Chemistry & Science',
  gradeFirstBadgeAr: 'الصف الأول الثانوي',
  gradeFirstDescAr: 'مدخلك السلس لعالم الكيمياء وبناء عقلية علمية قوية لحل مسائل المول والمعادلات الأيونية بكل سهولة لمدارس اللغات والتجريبي.',

  gradeSecondTitleAr: 'تانية ثانوي · فهم الذرة والروابط',
  gradeSecondTitleEn: '2nd Sec · Atomic Structure & Chemical Bonds',
  gradeSecondBadgeAr: 'الصف الثاني الثانوي',
  gradeSecondDescAr: 'فهم عميق لأعداد الكم، التوزيع الإلكتروني، وتدرج الخواص في الجدول الدوري الحديث وقواعد لويس والتهجين الجزيئي.',

  gradeThirdTitleAr: 'تالتة ثانوي · طريق الدرجة النهائية (60/60)',
  gradeThirdTitleEn: '3rd Sec · Road to the Full Mark (60/60)',
  gradeThirdBadgeAr: 'الصف الثالث الثانوي (دفعة 2026)',
  gradeThirdDescAr: 'المنهج الكامل مع خريطة طريق الكيمياء العضوية الأسطورية ومعادلات الحديد والاتزان الكيميائي الكهربي لطلاب اللغات والتجريبي.',

  feature1Title: '🏆 دروع وتكريم الأوائل',
  feature1Desc: 'مكافآت وجوائز دورية لأعلى درجات الاختبارات الإلكترونية والشاملة لطلاب اللغات والتجريبي.',
  feature2Title: '💡 تبسيط الـ Chemistry & Science',
  feature2Desc: 'الـ Chemistry مش مجرد حفظ معادلات! شرح مفاهيم علمية دقيقة، حل المسائل الكيميائية المعقدة خطوة بخطوة باللغة الإنجليزية والمصطلحات المعتمدة.',
  feature3Title: '🧪 تجارب معملية ومسائل تطبيقية',
  feature3Desc: 'محاكاة تفاعلية للتفاعلات الكيميائية وتدريبات مكثفة على أحدث أفكار امتحانات الثانوية العامة والشهادات التجريبية.',
  feature4Title: '⚡ متابعة 24/7 مع مستر محمد',
  feature4Desc: 'فريق عمل متكامل للرد الفوري على كل الأسئلة والمسائل الصعبة ومتابعة ولي الأمر عبر واتساب.',
};
