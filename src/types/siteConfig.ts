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
  teacherTitle: 'الأستاذ محمد مصطفى',
  tagline: 'قيصر الكيمياء .. من الأساسيات حتى التفوق وتقفيل الامتحان',
  heroDescription: 'مع أ. محمد الكيمستري تبان من منظور تاني. شرح واضح، أمثلة من الواقع، وتجارب عملية تخلّيك واثق في الامتحان ومقفل المادة. انضم للكورسات وابدأ من دلوقتي مع أقوى نظام متابعة وتدريبات شاملة.',
  heroBadge: 'دفعة 2026 الثانوية العامة · باب الحجز مفتوح',
  profileImageUrl: '/src/assets/images/teacher_mohamed_mostafa_1794141316649.jpg',
  calligraphyFont: 'Reem Kufi',
  bodyFont: 'Cairo',
  primaryColor: '#0d9488',
  phone1: '0100 234 5678',
  phone2: '0111 987 6543',
  whatsappNumber: '201012345678',
  facebookUrl: 'https://facebook.com',
  youtubeUrl: 'https://youtube.com',
  telegramUrl: 'https://t.me',
  centerBranches: 'القاهرة (مدينة نصر، المعادي، مصر الجديدة) والجيزة (الدقي، المهندسين، فيصل، الهرم).',
  developerName: 'Mazen Mohamed',
  developerHandle: '@mazenmohamed',
  developerUrl: 'https://github.com',
  feature1Title: '🏆 جوائز وهدايا',
  feature1Desc: 'عشان تعبك غالي علينا وبنحبك إحنا هنكافئك بطريقتنا. لابتوبات، دروع تميز، ومكافآت مالية لأوائل الامتحانات الشهرية والشاملة.',
  feature2Title: '💡 شرح أ/ محمد للكيمستري',
  feature2Desc: 'الكيمستري مش مجرد حفظ! شرح واضح، أمثلة من الواقع، وتجارب عملية بطريقة عمرك ما هتنساها، وتبسيط كامل لأصعب المسائل والمعادلات.',
  feature3Title: '🧪 تقييمات دورية',
  feature3Desc: 'كل نقطة في المنهج عليها امتحانات جزئية وامتحانات شاملة شهرية وتدريبات على كل درس بنظام التابلت والأسئلة الوزارية المقالية والاختيارية.',
  feature4Title: '👀 متابعة مستمرة',
  feature4Desc: 'تواصل مستمر معاك ومع ولي الأمر بحيث مفيش حاجة تفوتك وتكون متابع أول بأول مع تقارير أسبوعية تفصيلية عبر الواتساب.',
};
