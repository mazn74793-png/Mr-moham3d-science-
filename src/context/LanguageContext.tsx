import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  isRtl: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Brand & Header
    'brand.teacherName': 'أ/ محمد مصطفى',
    'brand.tagline': 'Senior Chemistry & Science Educator',
    'brand.subtagline': 'خبير الكيمياء والعلوم لمدارس اللغات والتجريبي',
    'nav.home': 'الرئيسية',
    'nav.features': 'المميزات',
    'nav.curriculum': 'السنوات الدراسية (2026)',
    'nav.studentPortal': 'منصة الطالب',
    'nav.teacherDashboard': 'لوحة الإدارة',
    'nav.login': 'تسجيل الدخول',
    'nav.loginGoogle': 'تسجيل الدخول بجوجل',
    'nav.loginGoogleShort': 'دخول Google',
    'nav.logout': 'تسجيل الخروج',
    'nav.theme': 'المظهر',
    'nav.lang': 'English',
    'nav.student': 'طالب',
    'nav.admin': 'مسؤول',

    // Hero Section
    'hero.badge': 'دفعة الثانوية العامة 2026 · مدارس اللغات والتجريبي',
    'hero.titlePrefix': 'مع مستر',
    'hero.titleName': 'محمد مصطفى',
    'hero.titleSuffix': 'الكيمياء والعلوم بفهم وبساطة',
    'hero.desc': 'المنصة التعليمية المتطورة لتدريس الكيمياء والعلوم لطلاب مدارس اللغات والتجريبي. محاضرات تفاعلية، نظام قفل متسلسل ذكي، مشغل فيديو محمي، وامتحانات متابعة دورية.',
    'hero.joinNow': 'انضم الآن للمنصة',
    'hero.exploreLectures': 'استكشف المحاضرات',
    'hero.stat1': 'بث فيديو مشفر 100%',
    'hero.stat2': 'شيتات وبنك أسئلة',
    'hero.stat3': 'متابعة وتقارير فورية',

    // Features Section
    'features.tag': 'تجربة تعليمية متقدمة',
    'features.title': 'مميزات منصة الكيمياء والعلوم الذكية',
    'features.desc': 'صُممت المنصة لتوفير أقصى درجات الفهم لطلاب مدارس اللغات والتجريبي بنظام تعليمي تفاعلي حديث.',
    'features.f1Title': 'لوحة شرف ومكافآت المتفوقين',
    'features.f1Desc': 'تكريم دوري لأعلى الطلاب تقييماً في الامتحانات وتحفيز مستمر للتفوق.',
    'features.f2Title': 'شرح Chemistry & Science تفاعلي',
    'features.f2Desc': 'تغطية عميقة لجميع المصطلحات والمعادلات بالإنجليزية والعربية بأسلوب تجريبي مبسط.',
    'features.f3Title': 'نظام قفل الحصص والكويزات',
    'features.f3Desc': 'تسلسل دراسي إجباري: لا يمكن فتح الحصة التالية إلا بعد مشاهدة الحصة واجتياز كويز المتابعة.',
    'features.f4Title': 'مشغل فيديو آمن مع علامة مائية',
    'features.f4Desc': 'حماية البث من التصوير الخارجي بعلامة مائية ديناميكية تعرض بيانات الطالب ورقم الهاتف.',

    // Academic Years
    'years.tag': 'الصفوف الدراسية',
    'years.title': 'المناهج والمحاضرات لدفعة 2026',
    'years.desc': 'اختر صفك الدراسي لبدء رحلة التعلم الذكية والمحاضرات المخصصة.',
    'grade.first': 'الصف الأول الثانوي',
    'grade.firstEn': '1st Secondary Grade (Science & Chemistry)',
    'grade.second': 'الصف الثاني الثانوي',
    'grade.secondEn': '2nd Secondary Grade (Chemistry & Periodic Table)',
    'grade.third': 'الصف الثالث الثانوي',
    'grade.thirdEn': '3rd Secondary Grade (General Secondary 2026)',
    'grade.explore': 'استعراض محاضرات الصف',

    // Student Portal
    'portal.title': 'منصة محاضرات واختبارات الطالب',
    'portal.subtitle': 'محاضراتك المتاحة، بنك الكويزات، والمذكرات الدراسية',
    'portal.tabLectures': 'المحاضرات التعليمية',
    'portal.tabQuizzes': 'بنك الاختبارات',
    'portal.tabFiles': 'المذكرات والملازم PDF',
    'portal.tabLeaderboard': 'لوحة الشرف',
    'portal.freePreview': 'محاضرة تجريبية مجانية',
    'portal.session': 'حصة رقم',
    'portal.duration': 'المدة',
    'portal.locked': 'مقفولة - تتطلب إنهاء الحصة السابقة واجتياز الكويز',
    'portal.openLecture': 'مشاهدة المحاضرة الآن',
    'portal.downloadPdf': 'تحميل المذكرة المرفقة',
    'portal.quizRequired': 'امتحان إجباري مرتبط بالحصة',
    'portal.quizStart': 'بدء الامتحان',
    'portal.quizScore': 'النتيجة',

    // Footer
    'footer.rights': 'جميع الحقوق محفوظة لمنصة أ/ محمد مصطفى',
    'footer.educator': 'Senior Chemistry & Science Educator',
    'footer.quickLinks': 'روابط سريعة',
  },
  en: {
    // Brand & Header
    'brand.teacherName': 'Mr. Mohamed Mostafa',
    'brand.tagline': 'Senior Chemistry & Science Educator',
    'brand.subtagline': 'Expert Educator for Languages & Experimental Schools',
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.curriculum': 'Grades (2026)',
    'nav.studentPortal': 'Student Portal',
    'nav.teacherDashboard': 'Admin Panel',
    'nav.login': 'Sign In',
    'nav.loginGoogle': 'Sign In with Google',
    'nav.loginGoogleShort': 'Google Login',
    'nav.logout': 'Sign Out',
    'nav.theme': 'Theme',
    'nav.lang': 'عربي',
    'nav.student': 'Student',
    'nav.admin': 'Admin',

    // Hero Section
    'hero.badge': 'Class of 2026 · Languages & Experimental Schools',
    'hero.titlePrefix': 'With',
    'hero.titleName': 'Mr. Mohamed Mostafa',
    'hero.titleSuffix': 'Chemistry & Science with True Insight',
    'hero.desc': 'The premier educational platform for Chemistry & Science for Language and Experimental schools. Interactive lectures, sequential progression, secure video player, and real-time assessments.',
    'hero.joinNow': 'Join Platform Now',
    'hero.exploreLectures': 'Explore Lectures',
    'hero.stat1': '100% Encrypted Video Stream',
    'hero.stat2': 'Question Bank & Handouts',
    'hero.stat3': 'Real-Time Progress & Reports',

    // Features Section
    'features.tag': 'Modern Learning Experience',
    'features.title': 'Smart Chemistry & Science Platform Features',
    'features.desc': 'Engineered to deliver supreme clarity for language & experimental school students with advanced interactive systems.',
    'features.f1Title': 'Honor Board & Student Rewards',
    'features.f1Desc': 'Regular recognition for top exam achievers with ongoing incentives for excellence.',
    'features.f2Title': 'Interactive Chemistry & Science Focus',
    'features.f2Desc': 'In-depth coverage of scientific concepts and equations in clear English & Arabic.',
    'features.f3Title': 'Session Lock & Mandatory Quizzes',
    'features.f3Desc': 'Progressive sequence: subsequent sessions unlock only after completing the lecture and passing its follow-up quiz.',
    'features.f4Title': 'Secure Player with Dynamic Watermark',
    'features.f4Desc': 'Screen-recording prevention via transparent watermarks displaying student credentials.',

    // Academic Years
    'years.tag': 'Curriculum Grades',
    'years.title': 'Academic Courses for Class of 2026',
    'years.desc': 'Select your secondary school grade to access customized lectures and quizzes.',
    'grade.first': '1st Secondary Grade',
    'grade.firstEn': 'Science & Basic Chemistry (Languages)',
    'grade.second': '2nd Secondary Grade',
    'grade.secondEn': 'Atomic Structure & Periodic Table',
    'grade.third': '3rd Secondary Grade',
    'grade.thirdEn': 'General Secondary 2026 (Transition Elements & Organic)',
    'grade.explore': 'Explore Grade Lectures',

    // Student Portal
    'portal.title': 'Student Lectures & Assessment Portal',
    'portal.subtitle': 'Your accessible video lectures, quizzes, and PDF handouts',
    'portal.tabLectures': 'Video Lectures',
    'portal.tabQuizzes': 'Quizzes Bank',
    'portal.tabFiles': 'PDF Handouts',
    'portal.tabLeaderboard': 'Honor Board',
    'portal.freePreview': 'Free Preview Session',
    'portal.session': 'Session #',
    'portal.duration': 'Duration',
    'portal.locked': 'Locked - Requires completing prior session & quiz',
    'portal.openLecture': 'Watch Lecture Now',
    'portal.downloadPdf': 'Download Handout PDF',
    'portal.quizRequired': 'Mandatory Follow-up Quiz',
    'portal.quizStart': 'Start Quiz',
    'portal.quizScore': 'Score',

    // Footer
    'footer.rights': 'All rights reserved · Mr. Mohamed Mostafa Platform',
    'footer.educator': 'Senior Chemistry & Science Educator',
    'footer.quickLinks': 'Quick Links',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
  toggleLang: () => {},
  isRtl: true,
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('mm_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const isRtl = lang === 'ar';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('mm_lang', newLang);
  };

  const toggleLang = () => {
    const nextLang: Language = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.ar[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
