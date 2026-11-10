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
  adminEmails?: string[];
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
  profileImageUrl: '/src/assets/images/teacher_mohamed_mostafa_1794141316649.jpg',
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
  centerBranches: 'القاهرة والجيزة لمدارس اللغات والتجريبي وحصص الأونلاين التفاعلية.',
  developerName: 'Mazen Mohamed',
  developerHandle: '@mazenmohamed',
  developerUrl: 'https://github.com',
  feature1Title: '🏆 دروع وتكريم الأوائل',
  feature1Desc: 'مكافآت وجوائز دورية لأعلى درجات الاختبارات الإلكترونية والشاملة لطلاب اللغات والتجريبي.',
  feature2Title: '💡 تبسيط الـ Chemistry & Science',
  feature2Desc: 'الـ Chemistry مش مجرد حفظ معادلات! شرح مفاهيم علمية دقيقة، حل المسائل الكيميائية المعقدة خطوة بخطوة باللغة الإنجليزية والمصطلحات المعتمدة.',
  feature3Title: '🧪 تجارب معملية ومسائل تطبيقية',
  feature3Desc: 'محاكاة تفاعلية للتفاعلات الكيميائية وتدريبات مكثفة على أحدث أفكار امتحانات الثانوية العامة والشهادات التجريبية.',
  feature4Title: '⚡ متابعة 24/7 مع مستر محمد',
  feature4Desc: 'فريق عمل متكامل للرد الفوري على كل الأسئلة والمسائل الصعبة ومتابعة ولي الأمر عبر واتساب.',
};
