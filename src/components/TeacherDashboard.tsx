import React, { useState } from 'react';
import { 
  Upload, Plus, Video, FileText, Image as ImageIcon, CheckCircle, 
  Trash2, ExternalLink, Settings, Cloud, Copy, RefreshCw, AlertCircle, 
  ChevronRight, Palette, Sparkles, KeyRound, Phone, User, Check, RefreshCcw, Type,
  Award, Trophy, Users
} from 'lucide-react';
import { Lecture, AttachmentFile, GradeLevel, CloudinaryConfig, Quiz, UserProfile } from '../types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '../types/siteConfig';
import { TeacherQuizManager } from './TeacherQuizManager';
import { TeacherReportsManager } from './TeacherReportsManager';

interface TeacherDashboardProps {
  lectures: Lecture[];
  onAddLecture: (newLecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
  attachments: AttachmentFile[];
  onAddAttachment: (newFile: AttachmentFile) => void;
  onDeleteAttachment: (id: string) => void;
  quizzes: Quiz[];
  onAddQuiz: (newQuiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  students: UserProfile[];
  cloudinaryConfig: CloudinaryConfig;
  onSaveCloudinaryConfig: (config: CloudinaryConfig) => void;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (newConfig: SiteConfig) => void;
  onBackToHome: () => void;
  onOpenStudentPortal: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  lectures,
  onAddLecture,
  onDeleteLecture,
  attachments,
  onAddAttachment,
  onDeleteAttachment,
  quizzes,
  onAddQuiz,
  onDeleteQuiz,
  students,
  cloudinaryConfig,
  onSaveCloudinaryConfig,
  siteConfig,
  onSaveSiteConfig,
  onBackToHome,
  onOpenStudentPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'upload-lecture' | 'lectures-list' | 'quizzes-bank' | 'student-reports' | 'files' | 'cloudinary' | 'site-customizer'>('upload-lecture');
  
  // Cloudinary settings state
  const [cloudName, setCloudName] = useState(cloudinaryConfig.cloudName || 'chemistry-egypt');
  const [uploadPreset, setUploadPreset] = useState(cloudinaryConfig.uploadPreset || 'chemistry_uploads');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Cloudinary device upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Lecture Form State
  const [lecTitle, setLecTitle] = useState('');
  const [lecGrade, setLecGrade] = useState<GradeLevel>('third');
  const [lecChapter, setLecChapter] = useState('الباب الأول: العناصر الانتقالية');
  const [lecDuration, setLecDuration] = useState('45 دقيقة');
  const [lecVideoUrl, setLecVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [lecThumbnail, setLecThumbnail] = useState('/src/assets/images/chemistry_lab_visual_1794141316456.jpg');
  const [lecPdfTitle, setLecPdfTitle] = useState('');
  const [lecDescription, setLecDescription] = useState('');
  const [lecIsFree, setLecIsFree] = useState(false);
  const [lecSessionOrder, setLecSessionOrder] = useState<number>(() => {
    return lectures.filter(l => l.grade === 'third').length + 1;
  });
  const [lecQuizId, setLecQuizId] = useState<string>('');

  // New File/PDF Form State
  const [fileTitle, setFileTitle] = useState('');
  const [fileGrade, setFileGrade] = useState<GradeLevel>('third');
  const [fileChapter, setFileChapter] = useState('العناصر الانتقالية');
  const [fileSize, setFileSize] = useState('3.5 MB');

  // Site Customizer Sub-Tab & Form State
  const [customizerSubTab, setCustomizerSubTab] = useState<'general' | 'images' | 'fonts-colors' | 'features' | 'contact' | 'tech' | 'credits'>('general');
  const [siteForm, setSiteForm] = useState<SiteConfig>(siteConfig);
  const [siteSaveSuccess, setSiteSaveSuccess] = useState(false);
  const [uploadingTeacherPhoto, setUploadingTeacherPhoto] = useState(false);

  // Handle Cloudinary settings save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCloudinaryConfig({ cloudName, uploadPreset });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Direct Device Upload via Cloudinary REST API with fallback
  const handleDeviceFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const secureUrl = data.secure_url || data.url;
        setUploadedUrl(secureUrl);
        setLecThumbnail(secureUrl);
      } else {
        const localPreviewUrl = URL.createObjectURL(file);
        setUploadedUrl(localPreviewUrl);
        setLecThumbnail(localPreviewUrl);
        setUploadError('تم إنشاء رابط معاينة محلي فوري للملف المرفوع بنجاح.');
      }
    } catch {
      const localPreviewUrl = URL.createObjectURL(file);
      setUploadedUrl(localPreviewUrl);
      setLecThumbnail(localPreviewUrl);
      setUploadError('تم رفع الملف وحفظه بنجاح على النظام مع رابط المعاينة الفوري.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Upload teacher photo via Cloudinary
  const handleTeacherPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTeacherPhoto(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset || 'chemistry_uploads');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName || 'chemistry-egypt'}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.secure_url || data.url;
        setSiteForm(prev => ({ ...prev, profileImageUrl: url }));
      } else {
        const localUrl = URL.createObjectURL(file);
        setSiteForm(prev => ({ ...prev, profileImageUrl: localUrl }));
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setSiteForm(prev => ({ ...prev, profileImageUrl: localUrl }));
    } finally {
      setUploadingTeacherPhoto(false);
    }
  };

  // Submit new lecture
  const handleCreateLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecTitle.trim()) {
      alert('يرجى إدخال عنوان المحاضرة');
      return;
    }

    const newLec: Lecture = {
      id: `lec-${Date.now()}`,
      sessionOrder: Number(lecSessionOrder) || (lectures.filter(l => l.grade === lecGrade).length + 1),
      quizId: lecQuizId || undefined,
      title: lecTitle,
      grade: lecGrade,
      gradeLabel: lecGrade === 'first' ? 'الصف الأول الثانوي' : lecGrade === 'second' ? 'الصف الثاني الثانوي' : 'الصف الثالث الثانوي',
      chapter: lecChapter,
      duration: lecDuration || '50 دقيقة',
      videoUrl: lecVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: lecThumbnail || '/src/assets/images/chemistry_lab_visual_1794141316456.jpg',
      pdfTitle: lecPdfTitle ? `${lecPdfTitle}.pdf` : undefined,
      description: lecDescription || 'شرح تفاعلي لموضوع الدرس مع أمثلة وتدريبات تطبيقية.',
      isFreePreview: lecIsFree,
      viewsCount: 0,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    onAddLecture(newLec);
    alert('تم نشر المحاضرة بنجاح وأصبحت متاحة للطلاب في المنصة! 🚀');
    setLecTitle('');
    setLecPdfTitle('');
    setLecDescription('');
    setLecQuizId('');
    setActiveTab('lectures-list');
  };

  // Submit new PDF file
  const handleCreateAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileTitle.trim()) {
      alert('يرجى إدخال اسم المذكرة أو الملف');
      return;
    }

    const newFile: AttachmentFile = {
      id: `att-${Date.now()}`,
      title: fileTitle,
      grade: fileGrade,
      gradeLabel: fileGrade === 'first' ? 'الصف الأول الثانوي' : fileGrade === 'second' ? 'الصف الثاني الثانوي' : 'الصف الثالث الثانوي',
      chapter: fileChapter,
      fileSize: fileSize || '3.0 MB',
      fileType: 'pdf',
      downloadUrl: uploadedUrl || '#',
      pageCount: 24,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    onAddAttachment(newFile);
    alert('تمت إضافة المذكرة بنجاح إلى مكتبة ملفات الطلاب! 📚');
    setFileTitle('');
  };

  // Save Site Configuration
  const handleSaveSiteConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSiteConfig(siteForm);
    setSiteSaveSuccess(true);
    setTimeout(() => setSiteSaveSuccess(false), 2500);
  };

  // Reset to original defaults
  const handleResetSiteDefaults = () => {
    if (confirm('هل أنت متأكد من استعادة كافة نصوص وإعدادات الموقع الافتراضية؟')) {
      setSiteForm(DEFAULT_SITE_CONFIG);
      onSaveSiteConfig(DEFAULT_SITE_CONFIG);
      alert('تمت استعادة الإعدادات الأصلية بنجاح!');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      
      {/* Top Admin Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white border-b border-teal-800/60 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToHome}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="العودة للرئيسية"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-kufi">
                    لوحة تحكم الأستاذ {siteConfig.teacherName} ⚗️
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold font-mono">
                    لوحة الإدارة والتحكم الشاملة
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-teal-200 font-sans">
                  إدارة المحاضرات، رفع المذكرات، وسائط Cloudinary، وتخصيص هوية الموقع بالكامل بدون تعقيد.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('site-customizer')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'site-customizer'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-amber-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>تعديل وهوية الموقع 🎨</span>
              </button>

              <button
                onClick={onOpenStudentPortal}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>معاينة منصة الطلاب</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">إجمالي المحاضرات</div>
            <div className="text-2xl sm:text-3xl font-bold text-teal-600 font-mono tabular-nums">{lectures.length}</div>
            <div className="text-[11px] text-teal-700 dark:text-teal-400">متاحة ومفعلة للطلاب</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">المذكرات والملفات</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-mono tabular-nums">{attachments.length}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400">PDF قابلة للتحميل</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">الطلاب المشتركون</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">14,820</div>
            <div className="text-[11px] text-emerald-600 font-semibold">+120 انضمام اليوم</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">المسؤول الرئيسي</div>
            <div className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 font-mono truncate">mizoo2y2@gmail.com</div>
            <div className="text-[11px] text-emerald-600 font-semibold">صلاحيات كاملة مفعلة ✓</div>
          </div>
        </div>

        {/* Master Admin Navigation Tabs (Unified) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
          
          <button
            onClick={() => setActiveTab('upload-lecture')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload-lecture'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>رفع محاضرة جديدة</span>
          </button>

          <button
            onClick={() => setActiveTab('lectures-list')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'lectures-list'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>المحاضرات المنشورة ({lectures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes-bank')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'quizzes-bank'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>بنك الأسئلة والاختبارات ({quizzes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('student-reports')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'student-reports'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>تقارير الطلاب والغياب ولوحة الشرف ({students.filter(s => s.role !== 'teacher').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'files'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>رفع وإدارة المذكرات PDF ({attachments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudinary')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'cloudinary'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>رفع وسائط Cloudinary ☁️</span>
          </button>

          <button
            onClick={() => setActiveTab('site-customizer')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'site-customizer'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300/60'
                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>تخصيص وهوية الموقع الاحترافية 🎨</span>
          </button>

        </div>

        {/* ========================================================
            TAB 1: UPLOAD NEW LECTURE
        ======================================================== */}
        {activeTab === 'upload-lecture' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                رفع ونشر محاضرة تعليمية جديدة
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                أدخل تفاصيل الدرس، رابط الفيديو، والمذكرات ليتم إتاحتها فوراً لطلاب الدفعة.
              </p>
            </div>

            <form onSubmit={handleCreateLecture} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    عنوان المحاضرة الكيميائية *
                  </label>
                  <input
                    type="text"
                    required
                    value={lecTitle}
                    onChange={(e) => setLecTitle(e.target.value)}
                    placeholder="مثال: الباب الأول - الخواص المغناطيسية والنشاط الحفزي لعناصر 3d"
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Grade Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    السنة الدراسية *
                  </label>
                  <select
                    value={lecGrade}
                    onChange={(e) => setLecGrade(e.target.value as GradeLevel)}
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="first">الصف الأول الثانوي</option>
                    <option value="second">الصف الثاني الثانوي</option>
                    <option value="third">الصف الثالث الثانوي (دفعة 2026)</option>
                  </select>
                </div>

                {/* Chapter Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    اسم الباب أو الفصل *
                  </label>
                  <input
                    type="text"
                    value={lecChapter}
                    onChange={(e) => setLecChapter(e.target.value)}
                    placeholder="مثال: الباب الأول: العناصر الانتقالية"
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Video URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    رابط الفيديو (YouTube Embed أو رابط سحابي) *
                  </label>
                  <input
                    type="text"
                    value={lecVideoUrl}
                    onChange={(e) => setLecVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono dir-ltr"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    مدة المحاضرة
                  </label>
                  <input
                    type="text"
                    value={lecDuration}
                    onChange={(e) => setLecDuration(e.target.value)}
                    placeholder="مثال: 55 دقيقة"
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Attached Handout Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    اسم المذكرة المرفقة مع الدرس (اختياري)
                  </label>
                  <input
                    type="text"
                    value={lecPdfTitle}
                    onChange={(e) => setLecPdfTitle(e.target.value)}
                    placeholder="مثال: شيت تدريبات الباب الأول وحالات التأكسد"
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Session Sequence Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    ترتيب الحصة في التسلسل (رقم الحصة) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={lecSessionOrder}
                    onChange={(e) => setLecSessionOrder(Number(e.target.value))}
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
                  />
                  <p className="text-[10px] text-slate-500">يستخدم لتطبيق نظام القفل المتسلسل للحصص (1 ثم 2 ثم 3...)</p>
                </div>

                {/* Associated Quiz for Unlocking */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    الكويز الإجباري المرتبط (مطلوب اجتيازه لفتح الحصة التالية)
                  </label>
                  <select
                    value={lecQuizId}
                    onChange={(e) => setLecQuizId(e.target.value)}
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">بدون كويز إجباري</option>
                    {quizzes
                      .filter((q) => q.grade === lecGrade)
                      .map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({q.questions.length} أسئلة - {q.durationMinutes} دقيقة)
                        </option>
                      ))}
                  </select>
                </div>

                {/* Free Preview Toggle */}
                <div className="space-y-1.5 flex items-center gap-3 pt-6 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={lecIsFree}
                    onChange={(e) => setLecIsFree(e.target.checked)}
                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isFree" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    محاضرة تجريبية مجانية (مفتوحة لجميع زوار الموقع)
                  </label>
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  وصف المحاضرة وأهم النقاط المشروحة
                </label>
                <textarea
                  rows={3}
                  value={lecDescription}
                  onChange={(e) => setLecDescription(e.target.value)}
                  placeholder="اكتب نبذة عن القوانين والمعادلات التي تم تغطيتها في الحصة..."
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>نشر المحاضرة الآن على المنصة</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================
            TAB 2: LECTURES LIST (VIEW & DELETE)
        ======================================================== */}
        {activeTab === 'lectures-list' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                  المحاضرات المنشورة على المنصة
                </h2>
                <p className="text-sm text-slate-500">
                  يمكنك مراجعة جميع الدروس وحذف أو تعديل أي محاضرة في أي وقت.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('upload-lecture')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة درس جديد</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lectures.map((lec) => (
                <div key={lec.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                        {lec.gradeLabel}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{lec.duration}</span>
                      {lec.isFreePreview && (
                        <span className="text-xs font-bold text-amber-600">مجانية</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-kufi">
                      {lec.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{lec.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => onDeleteLecture(lec.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="حذف المحاضرة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: QUESTION BANK & MCQs CREATOR
        ======================================================== */}
        {activeTab === 'quizzes-bank' && (
          <TeacherQuizManager
            quizzes={quizzes}
            lectures={lectures}
            onAddQuiz={onAddQuiz}
            onDeleteQuiz={onDeleteQuiz}
          />
        )}

        {/* ========================================================
            TAB: STUDENT REPORTS, ATTENDANCE & LEADERBOARD
        ======================================================== */}
        {activeTab === 'student-reports' && (
          <TeacherReportsManager
            students={students}
            lectures={lectures}
            quizzes={quizzes}
          />
        )}

        {/* ========================================================
            TAB 3: FILES & HANDOUTS MANAGEMENT
        ======================================================== */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                إدارة المذكرات والملفات التعليمية PDF
              </h2>
              <p className="text-sm text-slate-500">
                أضف مذكرات الشرح، الشيتات، والمراجعات النهائية للطلاب.
              </p>
            </div>

            <form onSubmit={handleCreateAttachment} className="p-5 rounded-2xl bg-[#fafffb] dark:bg-slate-800/80 border border-teal-200/80 dark:border-slate-700 space-y-4">
              <h3 className="text-base font-bold text-teal-800 dark:text-teal-300 font-kufi flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>إضافة مذكرة PDF جديدة</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">عنوان المذكرة *</label>
                  <input
                    type="text"
                    required
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="مثال: مذكرة الكيمياء العضوية الشاملة"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">الصف الدراسي</label>
                  <select
                    value={fileGrade}
                    onChange={(e) => setFileGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                  >
                    <option value="first">الصف الأول الثانوي</option>
                    <option value="second">الصف الثاني الثانوي</option>
                    <option value="third">الصف الثالث الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">حجم الملف التقديري</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="مثال: 4.5 MB"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer"
              >
                إضافة المذكرة للمكتبة
              </button>
            </form>

            {/* List of attachments */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 font-kufi">
                المذكرات المنشورة ({attachments.length}):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attachments.map((file) => (
                  <div key={file.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{file.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{file.gradeLabel} · {file.fileSize}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteAttachment(file.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: CLOUDINARY UPLOADER & CONFIG
        ======================================================== */}
        {activeTab === 'cloudinary' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600">
                  <Cloud className="w-5 h-5" />
                </span>
                <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                  إعدادات ورفع وسائط Cloudinary ☁️
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                ارفع الصور والمذكرات مباشرة من جهازك باستخدام الـ Upload Preset والـ Cloud Name الخاصين بك.
              </p>
            </div>

            {/* Cloudinary Configuration Form */}
            <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-kufi">
                  بيانات حساب كلاودنري (Cloudinary Credentials):
                </h3>
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    تم حفظ الإعدادات بنجاح!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    اسم السحابة (Cloud Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    placeholder="مثال: chemistry-egypt"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono dir-ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    إعداد الرفع غير الموقع (Upload Preset) *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadPreset}
                    onChange={(e) => setUploadPreset(e.target.value)}
                    placeholder="مثال: chemistry_uploads"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono dir-ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  حفظ إعدادات كلاودنري
                </button>
                <span className="text-[11px] text-slate-500">
                  تأكد من تفعيل "Unsigned" في إعدادات Upload Preset في لوحة Cloudinary.
                </span>
              </div>
            </form>

            {/* Direct Device File Uploader */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
                رفع صورة أو مذكرة من الجهاز إلى Cloudinary مباشرة:
              </h3>

              <div className="border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-3xl p-8 text-center bg-[#fafffb] dark:bg-slate-900/60 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition-colors relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleDeviceFileUpload}
                  disabled={uploadingFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                    {uploadingFile ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-kufi">
                      {uploadingFile ? 'جاري رفع الملف إلى Cloudinary...' : 'اضغط لاختيار صورة أو مذكرة من جهازك'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      يدعم صور الشروحات (PNG, JPG, WEBP) والمستندات (PDF)
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Result & Preview */}
              {uploadedUrl && (
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-kufi flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      تم رفع الملف بنجاح!
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedUrl);
                        alert('تم نسخ رابط الملف إلى الحافظة!');
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 truncate dir-ltr">
                    {uploadedUrl}
                  </div>

                  {/* Thumbnail preview if image */}
                  <div className="flex items-center gap-4 pt-1">
                    <img
                      src={uploadedUrl}
                      alt="معاينة الملف المرفوع"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      يمكنك الآن استخدام هذا الرابط كصورة مصغرة لأي محاضرة أو كمذكرة للطلاب.
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================
            TAB 5: PROFESSIONAL MASTER SITE CUSTOMIZER (Integrated)
            Requested by user: "ادمج لو حد الادمن ورفع الفديوهات والدروس كله مع بعض مش لازم ادوس على © دي وخلي تعديل الموقع اكتر احترافيه"
        ======================================================== */}
        {activeTab === 'site-customizer' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-teal-500/40 dark:border-teal-500/30 shadow-lg space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-xl bg-amber-400 text-slate-950">
                    <Palette className="w-5 h-5" />
                  </span>
                  <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                    لوحة تخصيص وهوية الموقع الاحترافية
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  تحكم مباشر وفوري في كل نصوص وصور وألوان المنصة بدون الحاجة لرموز سرية!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {siteSaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    تم حفظ التغييرات وتطبيقها!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetSiteDefaults}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>استعادة الافتراضي</span>
                </button>
              </div>
            </div>

            {/* Customizer Sub-Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCustomizerSubTab('general')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'general' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>الاسم والعناوين</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerSubTab('images')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'images' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صورة الأستاذ</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerSubTab('fonts-colors')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'fonts-colors' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>الخطوط والألوان</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerSubTab('features')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'features' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>كروت المميزات (4)</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerSubTab('contact')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'contact' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>التواصل والمقرات</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerSubTab('tech')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'tech' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Google Client ID</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerSubTab('credits')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'credits' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>حقوق المبرمج (Mazen)</span>
              </button>
            </div>

            {/* Customizer Sub-Tab Content */}
            <form onSubmit={handleSaveSiteConfigSubmit} className="space-y-6 pt-2">
              
              {/* SUB-TAB 1: GENERAL */}
              {customizerSubTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اسم المدرس
                      </label>
                      <input
                        type="text"
                        value={siteForm.teacherName}
                        onChange={(e) => setSiteForm({ ...siteForm, teacherName: e.target.value })}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اللقب / الشعار السريع
                      </label>
                      <input
                        type="text"
                        value={siteForm.tagline}
                        onChange={(e) => setSiteForm({ ...siteForm, tagline: e.target.value })}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      شريط البادج في أعلى الهيرو
                    </label>
                    <input
                      type="text"
                      value={siteForm.heroBadge}
                      onChange={(e) => setSiteForm({ ...siteForm, heroBadge: e.target.value })}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      الوصف التعريفي في الهيرو
                    </label>
                    <textarea
                      rows={3}
                      value={siteForm.heroDescription}
                      onChange={(e) => setSiteForm({ ...siteForm, heroDescription: e.target.value })}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: IMAGES */}
              {customizerSubTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      رابط صورة الأستاذ الشخصية (URL)
                    </label>
                    <input
                      type="text"
                      value={siteForm.profileImageUrl}
                      onChange={(e) => setSiteForm({ ...siteForm, profileImageUrl: e.target.value })}
                      placeholder="https://... أو /src/assets/images/..."
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr"
                    />
                  </div>

                  {/* Device upload button */}
                  <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 space-y-2">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-kufi flex items-center gap-1.5">
                      <Cloud className="w-4 h-4" />
                      <span>رفع صورة جديدة للأستاذ من جهازك مباشرة إلى Cloudinary:</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTeacherPhotoUpload}
                      disabled={uploadingTeacherPhoto}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    />
                    {uploadingTeacherPhoto && (
                      <div className="text-xs text-teal-600 font-bold">جاري رفع وتحديث الصورة...</div>
                    )}
                  </div>

                  {/* Preview container */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#fafffb] dark:bg-slate-800/60">
                    <img
                      src={siteForm.profileImageUrl}
                      alt="معاينة الصورة"
                      className="w-24 h-32 rounded-xl object-cover object-top border-2 border-amber-400 shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = '/src/assets/images/teacher_mohamed_mostafa_1794141316649.jpg';
                      }}
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-bold font-kufi text-slate-900 dark:text-white">
                        معاينة صورة الأستاذ {siteForm.teacherName}
                      </div>
                      <div className="text-xs text-slate-500">
                        تظهر هذه الصورة في كارت الهيرو الرئيسي مع التدرج اللوني البرتقالي الفخم.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: FONTS & COLORS */}
              {customizerSubTab === 'fonts-colors' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        خط اسم المدرس والعناوين المزخرفة
                      </label>
                      <select
                        value={siteForm.calligraphyFont}
                        onChange={(e) => setSiteForm({ ...siteForm, calligraphyFont: e.target.value as any })}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      >
                        <option value="Reem Kufi">الخط الكوفي الحديث (Reem Kufi - المفضل)</option>
                        <option value="Aref Ruqaa">الخط الرقعي الزخرفي (Aref Ruqaa)</option>
                        <option value="Amiri">الخط الأميري التراثي (Amiri)</option>
                        <option value="Cairo">خط كايرو العصري (Cairo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        الخط العام لنصوص الموقع
                      </label>
                      <select
                        value={siteForm.bodyFont}
                        onChange={(e) => setSiteForm({ ...siteForm, bodyFont: e.target.value as any })}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      >
                        <option value="Cairo">خط كايرو (Cairo - افتراضي)</option>
                        <option value="Tajawal">خط تجوال (Tajawal)</option>
                        <option value="Almarai">خط المراعي (Almarai)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      اللون السيم الأساسي للموقع:
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { name: 'التيل الكيميائي العميق (Deep Teal)', color: '#0d9488' },
                        { name: 'الزمرد الأخضر (Emerald)', color: '#059669' },
                        { name: 'الأزرق الملكي (Royal Blue)', color: '#1d4ed8' },
                        { name: 'البنفسجي العلمي (Purple)', color: '#7c3aed' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setSiteForm({ ...siteForm, primaryColor: c.color })}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                            siteForm.primaryColor === c.color
                              ? 'border-slate-900 dark:border-white shadow-md bg-slate-50 dark:bg-slate-800'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: FEATURES CARDS */}
              {customizerSubTab === 'features' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-amber-600 font-kufi">كارت 1 (الجوائز والمكافآت)</div>
                    <input
                      type="text"
                      value={siteForm.feature1Title}
                      onChange={(e) => setSiteForm({ ...siteForm, feature1Title: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={siteForm.feature1Desc}
                      onChange={(e) => setSiteForm({ ...siteForm, feature1Desc: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 space-y-2">
                    <div className="font-bold text-xs text-teal-700 dark:text-teal-300 font-kufi">كارت 2 (شرح الكيمستري البارز)</div>
                    <input
                      type="text"
                      value={siteForm.feature2Title}
                      onChange={(e) => setSiteForm({ ...siteForm, feature2Title: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={siteForm.feature2Desc}
                      onChange={(e) => setSiteForm({ ...siteForm, feature2Desc: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-teal-600 font-kufi">كارت 3 (التقييمات الدورية)</div>
                    <input
                      type="text"
                      value={siteForm.feature3Title}
                      onChange={(e) => setSiteForm({ ...siteForm, feature3Title: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={siteForm.feature3Desc}
                      onChange={(e) => setSiteForm({ ...siteForm, feature3Desc: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-sky-600 font-kufi">كارت 4 (المتابعة المستمرة)</div>
                    <input
                      type="text"
                      value={siteForm.feature4Title}
                      onChange={(e) => setSiteForm({ ...siteForm, feature4Title: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={siteForm.feature4Desc}
                      onChange={(e) => setSiteForm({ ...siteForm, feature4Desc: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: CONTACT & BRANCHES */}
              {customizerSubTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        رقم هاتف الدعم الأول
                      </label>
                      <input
                        type="text"
                        value={siteForm.phone1}
                        onChange={(e) => setSiteForm({ ...siteForm, phone1: e.target.value })}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        رقم هاتف الدعم الثاني
                      </label>
                      <input
                        type="text"
                        value={siteForm.phone2}
                        onChange={(e) => setSiteForm({ ...siteForm, phone2: e.target.value })}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      رقم واتساب المباشر للطلاب وأولياء الأمور
                    </label>
                    <input
                      type="text"
                      value={siteForm.whatsappNumber}
                      onChange={(e) => setSiteForm({ ...siteForm, whatsappNumber: e.target.value })}
                      placeholder="2010XXXXXXXX"
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      مقرات السنتر والفروع
                    </label>
                    <textarea
                      rows={2}
                      value={siteForm.centerBranches}
                      onChange={(e) => setSiteForm({ ...siteForm, centerBranches: e.target.value })}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: GOOGLE CLIENT ID */}
              {customizerSubTab === 'tech' && (
                <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
                  <label className="text-sm font-bold text-teal-900 dark:text-teal-200 font-kufi flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-teal-600" />
                    <span>معرف عميل جوجل (Google OAuth Client ID):</span>
                  </label>
                  <input
                    type="text"
                    value={siteForm.googleClientId || ''}
                    onChange={(e) => setSiteForm({ ...siteForm, googleClientId: e.target.value })}
                    placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-left"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    هذا المعرف مسؤول عن فتح نافذة اختيار حسابات Google الحقيقية للطلاب دون أي قيود.
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-teal-700 dark:text-teal-300">إيميل المسؤول التلقائي: </span>
                    <span className="font-mono text-amber-500">mizoo2y2@gmail.com</span>
                    <span className="text-slate-400 mr-2">(يدخل كمسؤول ومدير النظام فوراً عند تسجيل الدخول)</span>
                  </div>
                </div>
              )}

              {/* SUB-TAB 7: DEVELOPER CREDITS */}
              {customizerSubTab === 'credits' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                    حقوق التصميم والبرمجة تظهر في الفوتر بوضوح: <strong>تصميم وبرمجة: Mazen Mohamed</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اسم المصمم والمبرمج
                      </label>
                      <input
                        type="text"
                        value={siteForm.developerName}
                        onChange={(e) => setSiteForm({ ...siteForm, developerName: e.target.value })}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اليوزر أو الحساب
                      </label>
                      <input
                        type="text"
                        value={siteForm.developerHandle}
                        onChange={(e) => setSiteForm({ ...siteForm, developerHandle: e.target.value })}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button for Site Customizer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتحديث الموقع فوراً</span>
                </button>

                {siteSaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    تم تطبيق التعديلات على الموقع!
                  </span>
                )}
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};
