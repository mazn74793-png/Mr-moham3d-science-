import React, { useState } from 'react';
import { 
  Upload, Plus, Video, FileText, Image as ImageIcon, CheckCircle, 
  Trash2, ExternalLink, Settings, Cloud, Copy, RefreshCw, AlertCircle, 
  ChevronRight, Palette, Sparkles, KeyRound, Phone, User, Check, RefreshCcw, Type,
  Award, Trophy, Users, Edit3, Film, X, Shield, ShieldCheck, GraduationCap,
  LayoutDashboard, Menu, Link as LinkIcon, Compass, Eye
} from 'lucide-react';
import { Lecture, AttachmentFile, GradeLevel, CloudinaryConfig, Quiz, UserProfile } from '../types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '../types/siteConfig';
import { TeacherQuizManager } from './TeacherQuizManager';
import { TeacherReportsManager } from './TeacherReportsManager';
import { uploadMediaFile } from '../utils/uploader';

interface TeacherDashboardProps {
  lectures: Lecture[];
  onAddLecture: (newLecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
  onUpdateLecture?: (updated: Lecture) => void;
  attachments: AttachmentFile[];
  onAddAttachment: (newFile: AttachmentFile) => void;
  onDeleteAttachment: (id: string) => void;
  quizzes: Quiz[];
  onAddQuiz: (newQuiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  students: UserProfile[];
  onUpdateStudent?: (student: UserProfile) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddStudent?: (student: UserProfile) => void;
  cloudinaryConfig: CloudinaryConfig;
  onSaveCloudinaryConfig: (config: CloudinaryConfig) => void;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (newConfig: SiteConfig) => void;
  onBackToHome: () => void;
  onOpenStudentPortal: () => void;
  onResetAllData?: () => void;
}

export type TeacherDashboardTab = 
  | 'overview' 
  | 'all-students' 
  | 'upload-lecture' 
  | 'lectures-list' 
  | 'quizzes-bank' 
  | 'files' 
  | 'academic-years' 
  | 'co-admins' 
  | 'site-customizer' 
  | 'cloudinary';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  lectures,
  onAddLecture,
  onDeleteLecture,
  onUpdateLecture,
  attachments,
  onAddAttachment,
  onDeleteAttachment,
  quizzes,
  onAddQuiz,
  onDeleteQuiz,
  students,
  onUpdateStudent,
  onDeleteStudent,
  onAddStudent,
  cloudinaryConfig,
  onSaveCloudinaryConfig,
  siteConfig,
  onSaveSiteConfig,
  onBackToHome,
  onOpenStudentPortal,
  onResetAllData,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherDashboardTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteAdminConfirmEmail, setDeleteAdminConfirmEmail] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [selectedAcademicTab, setSelectedAcademicTab] = useState<'first' | 'second' | 'third'>('first');
  const [newQuickLinkTitle, setNewQuickLinkTitle] = useState('');
  const [newQuickLinkUrl, setNewQuickLinkUrl] = useState('');
  
  // Cloudinary settings state
  const [cloudName, setCloudName] = useState(cloudinaryConfig.cloudName || 'chemistry-egypt');
  const [uploadPreset, setUploadPreset] = useState(cloudinaryConfig.uploadPreset || 'chemistry_uploads');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Cloudinary device video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const [videoUploadNotice, setVideoUploadNotice] = useState<string | null>(null);

  // Cloudinary device file upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cloudinary device Handout / PDF direct upload state
  const [handoutFile, setHandoutFile] = useState<File | null>(null);
  const [uploadingHandout, setUploadingHandout] = useState(false);
  const [handoutProgress, setHandoutProgress] = useState(0);
  const [handoutCloudUrl, setHandoutCloudUrl] = useState<string>('');

  // Storage Quota Calculation (Cloudinary Free Plan: 25.0 GB total storage)
  const CLOUDINARY_TOTAL_QUOTA_GB = 25.0;

  // Real calculations derived directly from live state
  const calculateTotalUsedMB = () => {
    let totalMB = 0;
    // Calculate files & handouts
    attachments.forEach((file) => {
      const raw = (file.fileSize || '').trim().toLowerCase();
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        if (raw.includes('gb')) {
          totalMB += num * 1024;
        } else if (raw.includes('kb')) {
          totalMB += num / 1024;
        } else {
          totalMB += num; // default MB
        }
      } else {
        totalMB += 3.5;
      }
    });

    // Calculate video lectures (avg HD lecture size ~ 125 MB)
    lectures.forEach((lec) => {
      if (lec.videoUrl) {
        totalMB += 125.0;
      }
    });

    return totalMB;
  };

  const totalUsedMB = calculateTotalUsedMB();
  const totalUsedGB = Number((totalUsedMB / 1024).toFixed(2));
  const remainingGB = Number(Math.max(0, CLOUDINARY_TOTAL_QUOTA_GB - totalUsedGB).toFixed(2));
  const usedPercentage = Number(Math.min(100, (totalUsedGB / CLOUDINARY_TOTAL_QUOTA_GB) * 100).toFixed(1));

  // Feedback states (Zero Popups)
  const [lectureFormError, setLectureFormError] = useState<string | null>(null);
  const [lectureFormSuccess, setLectureFormSuccess] = useState<string | null>(null);
  const [fileFormError, setFileFormError] = useState<string | null>(null);
  const [fileFormSuccess, setFileFormSuccess] = useState<string | null>(null);
  const [copiedUrlSuccess, setCopiedUrlSuccess] = useState(false);

  // Editing Lecture & Confirmations
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [deleteConfirmLecId, setDeleteConfirmLecId] = useState<string | null>(null);
  const [deleteConfirmFileId, setDeleteConfirmFileId] = useState<string | null>(null);

  // New Lecture Form State
  const [lecTitle, setLecTitle] = useState('');
  const [lecGrade, setLecGrade] = useState<GradeLevel>('third');
  const [lecChapter, setLecChapter] = useState('الباب الأول: العناصر الانتقالية');
  const [lecDuration, setLecDuration] = useState('45 دقيقة');
  const [lecVideoUrl, setLecVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [lecThumbnail, setLecThumbnail] = useState('/images/chemistry_lab_visual_1794141316456.jpg');
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
  const [customizerSubTab, setCustomizerSubTab] = useState<'general' | 'images' | 'fonts-colors' | 'features' | 'footer' | 'contact' | 'tech' | 'credits'>('general');
  const [siteForm, setSiteForm] = useState<SiteConfig>(siteConfig);
  const [siteSaveSuccess, setSiteSaveSuccess] = useState(false);
  const [uploadingTeacherPhoto, setUploadingTeacherPhoto] = useState(false);

  // Sync siteForm when siteConfig updates from props
  React.useEffect(() => {
    setSiteForm(siteConfig);
  }, [siteConfig]);

  // Handle adding new Co-Admin with full permissions
  const handleAddCoAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminNotice(null);
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setAdminNotice({ type: 'error', message: 'يرجى إدخال بريد إلكتروني صحيح.' });
      return;
    }
    const currentAdmins = siteForm.adminEmails || ['mizoo2y2@gmail.com'];
    if (currentAdmins.includes(email)) {
      setAdminNotice({ type: 'error', message: 'هذا البريد مسجل كمدير ومسؤول بالفعل!' });
      return;
    }
    const updatedAdmins = [...currentAdmins, email];
    const updatedConfig: SiteConfig = { ...siteForm, adminEmails: updatedAdmins };
    setSiteForm(updatedConfig);
    onSaveSiteConfig(updatedConfig);
    setNewAdminEmail('');
    setAdminNotice({ type: 'success', message: `تمت إضافة المشرف والمدير المساعد (${email}) بنجاح وبكامل الصلاحيات! 🛡️` });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Handle removing a Co-Admin
  const handleRemoveCoAdmin = (emailToRemove: string) => {
    if (emailToRemove === 'mizoo2y2@gmail.com') return; // Cannot delete primary owner
    const currentAdmins = siteForm.adminEmails || ['mizoo2y2@gmail.com'];
    const updatedAdmins = currentAdmins.filter(em => em !== emailToRemove);
    const updatedConfig: SiteConfig = { ...siteForm, adminEmails: updatedAdmins };
    setSiteForm(updatedConfig);
    onSaveSiteConfig(updatedConfig);
    setDeleteAdminConfirmEmail(null);
    setAdminNotice({ type: 'success', message: `تم حذف المدير المساعد (${emailToRemove}) بنجاح.` });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Handle adding new Footer Quick Link
  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickLinkTitle.trim() || !newQuickLinkUrl.trim()) return;
    const currentLinks = siteForm.footerQuickLinks || [];
    const newLink = {
      id: `link-${Date.now()}`,
      title: newQuickLinkTitle.trim(),
      url: newQuickLinkUrl.trim()
    };
    const updatedConfig: SiteConfig = { ...siteForm, footerQuickLinks: [...currentLinks, newLink] };
    setSiteForm(updatedConfig);
    onSaveSiteConfig(updatedConfig);
    setNewQuickLinkTitle('');
    setNewQuickLinkUrl('');
  };

  // Handle removing a Footer Quick Link
  const handleRemoveQuickLink = (idToRemove: string) => {
    const currentLinks = siteForm.footerQuickLinks || [];
    const updatedConfig: SiteConfig = { ...siteForm, footerQuickLinks: currentLinks.filter(l => l.id !== idToRemove) };
    setSiteForm(updatedConfig);
    onSaveSiteConfig(updatedConfig);
  };

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

    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: 'image',
      });
      setUploadedUrl(result.url);
      setLecThumbnail(result.url);
      setUploadError('تم رفع الملف وحفظه بنجاح على النظام لجميع المتصفحات ☁️');
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء رفع الملف');
    } finally {
      setUploadingFile(false);
    }
  };

  // Upload teacher photo via Cloudinary / Server Persistent Storage (works in incognito & all browsers)
  const handleTeacherPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTeacherPhoto(true);
    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: 'image',
      });
      const url = result.url;
      setSiteForm((prev: SiteConfig) => ({ ...prev, profileImageUrl: url }));
      // Immediately save to persistent database on the server
      onSaveSiteConfig({ ...siteConfig, profileImageUrl: url });
      setAdminNotice({ 
        type: 'success', 
        message: result.source === 'cloudinary' 
          ? 'تم رفع وتثبيت صورة الأستاذ من كلاودنري بنجاح دائم! ☁️' 
          : 'تم رفع وتثبيت صورة الأستاذ وحفظها في قاعدة البيانات السحابية لجميع المتصفحات بنجاح! ☁️'
      });
    } catch (err: any) {
      setAdminNotice({ type: 'error', message: err.message || 'فشل رفع الصورة' });
    } finally {
      setUploadingTeacherPhoto(false);
    }
  };

  // Cloudinary Direct Video Upload from Device
  const handleCloudinaryVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setUploadingVideo(true);
    setVideoUploadProgress(0);
    setVideoUploadSuccess(false);
    setVideoUploadNotice(null);

    const activeCloud = cloudName.trim() || 'chemistry-egypt';
    const activePreset = uploadPreset.trim() || 'chemistry_uploads';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', activePreset);
    formData.append('resource_type', 'video');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${activeCloud}/video/upload`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setVideoUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploadingVideo(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          const secureUrl = res.secure_url || res.url;
          setLecVideoUrl(secureUrl);
          if (res.duration) {
            const mins = Math.max(1, Math.round(res.duration / 60));
            setLecDuration(`${mins} دقيقة`);
          }
          setVideoUploadSuccess(true);
          setVideoUploadNotice('تم رفع الفيديو بسرعة فائقة على كلاودنري وأصبح جاهزاً للبث السحابي المباشر ⚡');
        } catch {
          uploadMediaFile(file, { resourceType: 'video' })
            .then(res => {
              setLecVideoUrl(res.url);
              setVideoUploadSuccess(true);
              setVideoUploadNotice('تم حفظ الفيديو بنجاح على السيرفر لجميع الأجهزة والوضع الخفي ⚡');
            })
            .catch(() => {});
        }
      } else {
        uploadMediaFile(file, { resourceType: 'video' })
          .then(res => {
            setLecVideoUrl(res.url);
            setVideoUploadSuccess(true);
            setVideoUploadNotice('تم حفظ الفيديو بنجاح على السيرفر لجميع الأجهزة والوضع الخفي ⚡');
          })
          .catch(() => {});
      }
    };

    xhr.onerror = () => {
      setUploadingVideo(false);
      uploadMediaFile(file, { resourceType: 'video' })
        .then(res => {
          setLecVideoUrl(res.url);
          setVideoUploadSuccess(true);
          setVideoUploadNotice('تم حفظ الفيديو بنجاح على السيرفر لجميع الأجهزة والوضع الخفي ⚡');
        })
        .catch(() => {});
    };

    xhr.send(formData);
  };

  // Submit new lecture
  const handleCreateLecture = (e: React.FormEvent) => {
    e.preventDefault();
    setLectureFormError(null);
    setLectureFormSuccess(null);

    if (!lecTitle.trim()) {
      setLectureFormError('يرجى إدخال عنوان المحاضرة');
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
      thumbnailUrl: lecThumbnail || '/images/chemistry_lab_visual_1794141316456.jpg',
      pdfTitle: lecPdfTitle ? `${lecPdfTitle}.pdf` : undefined,
      description: lecDescription || 'شرح تفاعلي لموضوع الدرس مع أمثلة وتدريبات تطبيقية.',
      isFreePreview: lecIsFree,
      viewsCount: 0,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    onAddLecture(newLec);
    setLectureFormSuccess('تم نشر المحاضرة بنجاح وأصبحت متاحة للطلاب في المنصة! 🚀');
    setTimeout(() => setLectureFormSuccess(null), 4000);
    setLecTitle('');
    setLecPdfTitle('');
    setLecDescription('');
    setLecQuizId('');
    setVideoFile(null);
    setVideoUploadSuccess(false);
  };

  // Save edited lecture
  const handleSaveEditedLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecture) return;
    if (onUpdateLecture) {
      onUpdateLecture(editingLecture);
      setLectureFormSuccess('تم تحديث وتعديل المحاضرة بنجاح! ⚡');
      setTimeout(() => setLectureFormSuccess(null), 3500);
    }
    setEditingLecture(null);
  };

  // Handle Direct Handout Upload to Cloudinary with Real-Time Progress
  const handleSelectHandoutFile = (file: File) => {
    setHandoutFile(file);
    // Auto title if empty
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    if (!fileTitle) {
      setFileTitle(nameWithoutExt);
    }
    // Calculate real file size in MB
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);

    setUploadingHandout(true);
    setHandoutProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const xhr = new XMLHttpRequest();
    // Use raw or auto endpoint on Cloudinary
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setHandoutProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploadingHandout(false);
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          const finalUrl = res.secure_url || res.url;
          setHandoutCloudUrl(finalUrl);
          setFileFormSuccess(`تم رفع المذكرة بنجاح إلى كلاودنري (${file.name} · ${sizeInMB} MB) ☁️`);
          setTimeout(() => setFileFormSuccess(null), 4000);
        } catch {
          uploadMediaFile(file, { resourceType: 'raw' })
            .then(res => {
              setHandoutCloudUrl(res.url);
              setFileFormSuccess(`تم حفظ المذكرة بنجاح على السيرفر لجميع المتصفحات (${file.name}) ☁️`);
              setTimeout(() => setFileFormSuccess(null), 4000);
            })
            .catch(() => {});
        }
      } else {
        uploadMediaFile(file, { resourceType: 'raw' })
          .then(res => {
            setHandoutCloudUrl(res.url);
            setFileFormSuccess(`تم حفظ المذكرة بنجاح على السيرفر لجميع المتصفحات (${file.name}) ☁️`);
            setTimeout(() => setFileFormSuccess(null), 4000);
          })
          .catch(() => {});
      }
    };

    xhr.onerror = () => {
      setUploadingHandout(false);
      uploadMediaFile(file, { resourceType: 'raw' })
        .then(res => {
          setHandoutCloudUrl(res.url);
          setFileFormSuccess(`تم حفظ المذكرة بنجاح على السيرفر لجميع المتصفحات (${file.name}) ☁️`);
          setTimeout(() => setFileFormSuccess(null), 4000);
        })
        .catch(() => {});
    };

    xhr.send(formData);
  };

  // Submit new PDF file
  const handleCreateAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    setFileFormError(null);
    setFileFormSuccess(null);

    if (!fileTitle.trim()) {
      setFileFormError('يرجى إدخال اسم المذكرة أو الملف');
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
      downloadUrl: handoutCloudUrl || uploadedUrl || '#',
      pageCount: 24,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    onAddAttachment(newFile);
    setFileFormSuccess('تمت إضافة المذكرة بنجاح إلى مكتبة ملفات الطلاب وتم تحديث مساحة التخزين فورياً! 📚');
    setTimeout(() => setFileFormSuccess(null), 4000);
    setFileTitle('');
    setHandoutFile(null);
    setHandoutCloudUrl('');
    setHandoutProgress(0);
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
    setSiteForm(DEFAULT_SITE_CONFIG);
    onSaveSiteConfig(DEFAULT_SITE_CONFIG);
    setSiteSaveSuccess(true);
    setTimeout(() => setSiteSaveSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full max-w-full overflow-x-hidden">
      
      {/* Top Admin Header */}
      <header className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white border-b border-teal-800/60 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Toggle Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(prev => !prev)}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="القائمة الجانبية"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5 text-amber-300" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                onClick={onBackToHome}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="العودة للرئيسية"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold font-kufi">
                    لوحة تحكم الأستاذ {siteConfig.teacherName} ⚗️
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>مسؤول معتمد</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('site-customizer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'site-customizer'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-amber-300 hidden sm:flex'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>هوية الموقع 🎨</span>
              </button>

              <button
                onClick={onOpenStudentPortal}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>معاينة الطلاب</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Modern Two-Column Layout: Responsive Sidebar on Side + Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] w-full">
        
        {/* Sidebar Navigation on the side */}
        <aside className={`w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 lg:p-5 flex flex-col justify-between ${isMobileSidebarOpen ? 'block' : 'hidden lg:flex'}`}>
          <div className="space-y-6">
            
            {/* Quick Profile Pill in Sidebar */}
            <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-teal-600 shrink-0 border border-teal-400/40">
                <img
                  src={siteForm.profileImageUrl?.replace('/src/assets/images/', '/images/') || '/images/teacher_mohamed_mostafa_1794141316649.jpg'}
                  alt={siteForm.teacherName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/images/teacher_mohamed_mostafa_1794141316649.jpg'; }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate font-kufi">
                  {siteForm.teacherName}
                </div>
                <div className="text-[10px] text-teal-700 dark:text-teal-400 truncate font-mono">
                  {siteForm.adminEmails?.[0] || 'mizoo2y2@gmail.com'}
                </div>
              </div>
            </div>

            {/* Section 1: Overview & Students */}
            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                الرئيسية والمتابعة
              </div>
              
              <button
                onClick={() => { setActiveTab('overview'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>نظرة عامة وسريعة</span>
                </div>
                <span className="text-[10px] opacity-75">لوحة التحكم</span>
              </button>

              <button
                onClick={() => { setActiveTab('all-students'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'all-students'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>سجل وقائمة الطلاب</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-slate-900 dark:text-amber-200 text-[10px] font-bold font-mono">
                  {students.filter(s => s.role !== 'teacher').length}
                </span>
              </button>
            </div>

            {/* Section 2: Educational Content */}
            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                المحتوى التعليمي
              </div>

              <button
                onClick={() => { setActiveTab('upload-lecture'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'upload-lecture'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>رفع محاضرة جديدة</span>
                </div>
                <span className="text-[10px] text-teal-400">فيديو + كويز</span>
              </button>

              <button
                onClick={() => { setActiveTab('lectures-list'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'lectures-list'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-sky-500" />
                  <span>المحاضرات المنشورة</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  {lectures.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('quizzes-bank'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'quizzes-bank'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>بنك الأسئلة والاختبارات</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  {quizzes.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('files'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'files'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>الملازم ومساحة التخزين</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                  {attachments.length}
                </span>
              </button>
            </div>

            {/* Section 3: System Administration & Customization */}
            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                إدارة المنصة وهوية الموقع
              </div>

              <button
                onClick={() => { setActiveTab('academic-years'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'academic-years'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>تخصيص أسماء السنوات</span>
                </div>
                <span className="text-[10px] text-teal-400">الرئيسية</span>
              </button>

              <button
                onClick={() => { setActiveTab('co-admins'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'co-admins'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-teal-500" />
                  <span>المشرفين والمدراء المساعدين</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-mono font-bold">
                  {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('site-customizer'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'site-customizer'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-purple-500" />
                  <span>هوية الموقع والفوتر</span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold">تعديل</span>
              </button>

              <button
                onClick={() => { setActiveTab('cloudinary'); setIsMobileSidebarOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === 'cloudinary'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>إعدادات Cloudinary</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">25 GB</span>
              </button>
            </div>

          </div>

          {/* Sidebar Bottom Cloudinary Storage Monitor */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-teal-600" />
                <span>سعة كلاودنري السحابية</span>
              </span>
              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold text-[11px]">
                {remainingGB} GB متبقية
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usedPercentage > 85 ? 'bg-rose-500' : usedPercentage > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(4, usedPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`} مستخدمة</span>
              <span>من 25 GB</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">

          {/* ========================================================
              TAB 0: MODERN DASHBOARD OVERVIEW & QUICK LAUNCHPADS
          ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Header Greeting */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>المنظومة السحابية المحدثة · دفعة 2026</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-kufi">
                    أهلاً بك يا أستاذ {siteConfig.teacherName} ⚗️
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-sans">
                    لوحة التحكم المركزية تتيح لك إدارة المحاضرات، بنك الأسئلة، الطلاب، المذكرات السحابية عبر Cloudinary، وتخصيص أسماء السنوات الدراسية وإضافة مشرفين بكل سلاسة.
                  </p>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveTab('lectures-list')}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-teal-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
                    <span>المحاضرات</span>
                    <Video className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-teal-600 font-mono tabular-nums">{lectures.length}</div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400">محاضرة منشورة ومفعلة</div>
                </div>

                <div 
                  onClick={() => setActiveTab('files')}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-amber-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
                    <span>المذكرات والملفات</span>
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-500 font-mono tabular-nums">{attachments.length}</div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">PDF على Cloudinary</div>
                </div>

                <div 
                  onClick={() => setActiveTab('all-students')}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
                    <span>الطلاب المشتركون</span>
                    <Users className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                    {students.filter(s => s.role !== 'teacher').length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold">حسابات حقيقية مسجلة</div>
                </div>

                <div 
                  onClick={() => setActiveTab('co-admins')}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 hover:border-sky-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
                    <span>فريق الإدارة (Admins)</span>
                    <ShieldCheck className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-sky-600 font-mono tabular-nums">
                    {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length}
                  </div>
                  <div className="text-[11px] text-sky-600 font-semibold">بكامل الصلاحيات الإدارية</div>
                </div>
              </div>

              {/* Cloudinary Live Storage Monitor Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white border border-teal-800/50 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-teal-300 font-mono">سعة تخزين كلاودنري السحابية (Cloudinary Live Storage)</span>
                    </div>
                    <h3 className="text-xl font-bold font-kufi">
                      المساحة المتبقية: <span className="text-amber-300 font-mono">{remainingGB} GB</span> من إجمالي {CLOUDINARY_TOTAL_QUOTA_GB} GB
                    </h3>
                  </div>

                  <div className="text-left sm:text-right font-mono">
                    <div className="text-xs text-slate-400">المستهلك الفعلي:</div>
                    <div className="text-lg font-bold text-teal-300">
                      {totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`}
                      <span className="text-xs text-slate-400 font-normal mr-1.5">({usedPercentage}%)</span>
                    </div>
                  </div>
                </div>

                {/* Visual Storage Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usedPercentage > 85 ? 'bg-rose-500' : usedPercentage > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.max(3, usedPercentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>0 GB</span>
                    <span>المستخدم: {totalUsedGB} GB ({lectures.length} فيديو + {attachments.length} ملزمة)</span>
                    <span>الحد الأقصى المجاني: {CLOUDINARY_TOTAL_QUOTA_GB} GB</span>
                  </div>
                </div>
              </div>

              {/* Fast Action Launchpads */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
                  روابط التشغيل السريعة:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <button
                    onClick={() => setActiveTab('upload-lecture')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-sm text-right transition-all group cursor-pointer"
                  >
                    <Plus className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">رفع محاضرة</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">فيديو وكويز مباشر</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('all-students')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-sm text-right transition-all group cursor-pointer"
                  >
                    <Users className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">سجل الطلاب</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">جميع السنوات</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('files')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-sm text-right transition-all group cursor-pointer"
                  >
                    <FileText className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">رفع مذكرة PDF</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">تحديث سعة التخزين</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('academic-years')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-sm text-right transition-all group cursor-pointer"
                  >
                    <GraduationCap className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">أسماء السنوات</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">تعديل كروت الرئيسية</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('co-admins')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-sm text-right transition-all group cursor-pointer"
                  >
                    <ShieldCheck className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">إضافة مدير مساعد</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">صلاحيات كاملة فورية</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('site-customizer')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-sm text-right transition-all group cursor-pointer"
                  >
                    <Palette className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">هوية الموقع والفوتر</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">الروابط ونبذة المعلم</div>
                  </button>
                </div>
              </div>

              {/* Quick Preview of Recent Lectures */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
                    آخر المحاضرات المنشورة ({lectures.length}):
                  </h3>
                  <button
                    onClick={() => setActiveTab('lectures-list')}
                    className="text-xs text-teal-600 hover:underline font-bold cursor-pointer"
                  >
                    عرض وإدارة جميع المحاضرات ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lectures.slice(0, 3).map(lec => (
                    <div key={lec.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3">
                      <img 
                        src={lec.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg'} 
                        alt={lec.title} 
                        className="w-14 h-14 rounded-xl object-cover shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{lec.title}</div>
                        <div className="text-[11px] text-teal-600 font-mono mt-0.5">{lec.duration} · حصة {lec.sessionOrder}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-Out / Reset Data Control */}
              <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                    <Trash2 className="w-4 h-4" />
                    <span>إدارة وتصفير بيانات المنصة (Clear All Data):</span>
                  </div>
                  <p className="text-xs text-rose-600/90 dark:text-rose-400/80 max-w-xl leading-relaxed">
                    تصفير جميع المحاضرات والاختبارات والمذكرات والطلاب والبدء من 0 بقيم حسابية حقيقية تماماً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-700/20 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>تصفير وإفراغ كل البيانات</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB: CUSTOMIZE ACADEMIC YEARS (Reflecting on Landing Page)
              Requested by user: "واعدل اسماء السنوات وتبان بره في الرئيسيه"
          ======================================================== */}
          {activeTab === 'academic-years' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-xl bg-indigo-500 text-white">
                      <GraduationCap className="w-5 h-5" />
                    </span>
                    <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                      تخصيص أسماء ووصف السنوات الدراسية 🎓
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    قم بتعديل عناوين وشارات ووصف كل صف دراسي، وستظهر التعديلات مباشرة وفورياً لجميع زوار المنصة في الصفحة الرئيسية.
                  </p>
                </div>

                {siteSaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-300">
                    <Check className="w-4 h-4" />
                    تم تطبيق الأسماء على الرئيسية فورياً!
                  </span>
                )}
              </div>

              {/* Grades Switcher Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedAcademicTab('first')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedAcademicTab === 'first'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  الصف الأول الثانوي (1st Sec)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAcademicTab('second')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedAcademicTab === 'second'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  الصف الثاني الثانوي (2nd Sec)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAcademicTab('third')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedAcademicTab === 'third'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  الصف الثالث الثانوي (3rd Sec)
                </button>
              </div>

              {/* Grade Customization Form */}
              <form onSubmit={handleSaveSiteConfigSubmit} className="space-y-6">
                
                {selectedAcademicTab === 'first' && (
                  <div className="p-6 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-4">
                    <div className="font-bold text-sm text-indigo-900 dark:text-indigo-200 font-kufi flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>بيانات الصف الأول الثانوي:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان بالعربية</label>
                        <input
                          type="text"
                          value={siteForm.gradeFirstTitleAr || ''}
                          onChange={(e) => setSiteForm({ ...siteForm, gradeFirstTitleAr: e.target.value })}
                          placeholder="مثال: أولى ثانوي · التأسيس الشامل"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان بالإنجليزية (Title En)</label>
                        <input
                          type="text"
                          value={siteForm.gradeFirstTitleEn || ''}
                          onChange={(e) => setSiteForm({ ...siteForm, gradeFirstTitleEn: e.target.value })}
                          placeholder="e.g. 1st Sec · Foundational Chemistry & Science"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 dir-ltr text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الشارة العلوية (Badge)</label>
                      <input
                        type="text"
                        value={siteForm.gradeFirstBadgeAr || ''}
                        onChange={(e) => setSiteForm({ ...siteForm, gradeFirstBadgeAr: e.target.value })}
                        placeholder="مثال: الصف الأول الثانوي"
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوصف والشرح المختصر للكارت في الرئيسية</label>
                      <textarea
                        rows={3}
                        value={siteForm.gradeFirstDescAr || ''}
                        onChange={(e) => setSiteForm({ ...siteForm, gradeFirstDescAr: e.target.value })}
                        placeholder="اكتب وصف المنهج ومحتويات الصف الأول..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>
                  </div>
                )}

                {selectedAcademicTab === 'second' && (
                  <div className="p-6 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-4">
                    <div className="font-bold text-sm text-teal-900 dark:text-teal-200 font-kufi flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>بيانات الصف الثاني الثانوي:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان بالعربية</label>
                        <input
                          type="text"
                          value={siteForm.gradeSecondTitleAr || ''}
                          onChange={(e) => setSiteForm({ ...siteForm, gradeSecondTitleAr: e.target.value })}
                          placeholder="مثال: تانية ثانوي · فهم الذرة والروابط"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان بالإنجليزية (Title En)</label>
                        <input
                          type="text"
                          value={siteForm.gradeSecondTitleEn || ''}
                          onChange={(e) => setSiteForm({ ...siteForm, gradeSecondTitleEn: e.target.value })}
                          placeholder="e.g. 2nd Sec · Atomic Structure & Chemical Bonds"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 dir-ltr text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الشارة العلوية (Badge)</label>
                      <input
                        type="text"
                        value={siteForm.gradeSecondBadgeAr || ''}
                        onChange={(e) => setSiteForm({ ...siteForm, gradeSecondBadgeAr: e.target.value })}
                        placeholder="مثال: الصف الثاني الثانوي"
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوصف والشرح المختصر للكارت في الرئيسية</label>
                      <textarea
                        rows={3}
                        value={siteForm.gradeSecondDescAr || ''}
                        onChange={(e) => setSiteForm({ ...siteForm, gradeSecondDescAr: e.target.value })}
                        placeholder="اكتب وصف المنهج ومحتويات الصف الثاني..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>
                  </div>
                )}

                {selectedAcademicTab === 'third' && (
                  <div className="p-6 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-4">
                    <div className="font-bold text-sm text-amber-900 dark:text-amber-200 font-kufi flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>بيانات الصف الثالث الثانوي (الشهادة الثانوية العامة واللغات):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان بالعربية</label>
                        <input
                          type="text"
                          value={siteForm.gradeThirdTitleAr || ''}
                          onChange={(e) => setSiteForm({ ...siteForm, gradeThirdTitleAr: e.target.value })}
                          placeholder="مثال: تالتة ثانوي · طريق الدرجة النهائية (60/60)"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">العنوان بالإنجليزية (Title En)</label>
                        <input
                          type="text"
                          value={siteForm.gradeThirdTitleEn || ''}
                          onChange={(e) => setSiteForm({ ...siteForm, gradeThirdTitleEn: e.target.value })}
                          placeholder="e.g. 3rd Sec · Road to the Full Mark (60/60)"
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 dir-ltr text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الشارة العلوية (Badge)</label>
                      <input
                        type="text"
                        value={siteForm.gradeThirdBadgeAr || ''}
                        onChange={(e) => setSiteForm({ ...siteForm, gradeThirdBadgeAr: e.target.value })}
                        placeholder="مثال: الصف الثالث الثانوي (دفعة 2026)"
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوصف والشرح المختصر للكارت في الرئيسية</label>
                      <textarea
                        rows={3}
                        value={siteForm.gradeThirdDescAr || ''}
                        onChange={(e) => setSiteForm({ ...siteForm, gradeThirdDescAr: e.target.value })}
                        placeholder="اكتب وصف المنهج ومحتويات الصف الثالث..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-700/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ وتحديث أسماء السنوات في الرئيسية الآن</span>
                  </button>

                  {siteSaveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      تم حفظ التعديلات بنجاح!
                    </span>
                  )}
                </div>

              </form>
            </div>
          )}

          {/* ========================================================
              TAB: CO-ADMINS & PERMISSIONS MANAGEMENT
              Requested by user: "واقدر اخلي في ادمن معايا ليه صلاحيات يرفع ويحذف زي انا بالظبط"
          ======================================================== */}
          {activeTab === 'co-admins' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-xl bg-teal-600 text-white">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                      إدارة المشرفين والمدراء المساعدين (Co-Admins) 🛡️
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    أضف بريد أي مساعد أو مدير ترغب في منحه نفس صلاحياتك بالكامل (رفع المحاضرات، حذف وتعديل الملفات، وإدارة الطلاب).
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-300 font-mono">
                  {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).length} مدراء نشطون
                </div>
              </div>

              {/* Notification Notice (No Browser Popups) */}
              {adminNotice && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
                  adminNotice.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                  {adminNotice.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{adminNotice.message}</span>
                </div>
              )}

              {/* Add New Co-Admin Form */}
              <form onSubmit={handleAddCoAdmin} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 font-kufi flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>إضافة بريد إلكتروني لمدير مساعد جديد:</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="assistant@science.com أو gmail الخاص به"
                    className="w-full sm:flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-right"
                  />

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>منح صلاحيات الإدارة كاملة</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  بمجرد تسجيل هذا الحساب الدخول عبر Google أو بريده الإلكتروني، سيعامله النظام كأدمن مباشر ويفتح له لوحة التحكم وصلاحيات الرفع والحذف فوراً.
                </p>
              </form>

              {/* List of Active Administrators */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-kufi">
                  قائمة المدراء والمشرفين المسجلين في النظام:
                </h3>

                <div className="space-y-2">
                  {/* Primary Owner */}
                  <div className="p-4 rounded-2xl border-2 border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        👑
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                          <span>mizoo2y2@gmail.com</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold font-kufi">
                            المالك والمؤسس الرئيسي
                          </span>
                        </div>
                        <div className="text-[11px] text-teal-700 dark:text-teal-400">
                          كافة الصلاحيات السيادية (غير قابل للحذف)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                      نشط دائم ✓
                    </span>
                  </div>

                  {/* Added Co-Admins */}
                  {(siteForm.adminEmails || ['mizoo2y2@gmail.com'])
                    .filter(email => email !== 'mizoo2y2@gmail.com')
                    .map((email) => (
                      <div key={email} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                              {email}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              مدير مساعد · صلاحيات كاملة للرفع والتعديل والحذف وإدارة الطلاب
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {deleteAdminConfirmEmail === email ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-rose-600 font-bold">تأكيد الحذف؟</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCoAdmin(email)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                نعم، احذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAdminConfirmEmail(null)}
                                className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteAdminConfirmEmail(email)}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1"
                              title="إلغاء صلاحيات هذا المدير"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs font-bold">إزالة</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                  {(siteForm.adminEmails || ['mizoo2y2@gmail.com']).filter(e => e !== 'mizoo2y2@gmail.com').length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      لم تتم إضافة أي مدراء مساعدين بعد. أدخل بريد مساعدك في الحقل أعلاه لمنحه صلاحيات كاملة.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB: ALL STUDENTS DIRECTORY & MANAGEMENT
              Requested by user: "تالت حاجه عايز قايمه الطلاب لجميع السنوات واقدر اضيف واحذف"
          ======================================================== */}
          {activeTab === 'all-students' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 font-kufi">
                    سجل وقائمة الطلاب الشاملة لجميع السنوات (الأول، الثاني، والثالث الثانوي)
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono">
                  {students.filter(s => s.role !== 'teacher').length} طالب مسجل
                </span>
              </div>

              <TeacherReportsManager
                students={students}
                lectures={lectures}
                quizzes={quizzes}
                onUpdateStudent={onUpdateStudent}
                onDeleteStudent={onDeleteStudent}
                onAddStudent={onAddStudent}
              />
            </div>
          )}

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

            {/* Inline Notifications (Zero Popups) */}
            {lectureFormSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{lectureFormSuccess}</span>
              </div>
            )}

            {lectureFormError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-sm font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{lectureFormError}</span>
              </div>
            )}

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

                {/* Cloudinary Fast Device Video Uploader Card */}
                <div className="md:col-span-2 p-5 rounded-3xl bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-teal-100/30 dark:from-slate-800/80 dark:to-teal-950/30 border-2 border-teal-200 dark:border-teal-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                        <Film className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-teal-950 dark:text-teal-200 font-kufi">
                          رفع فيديو المحاضرة مباشرة من جهازك (Cloudinary ⚡)
                        </h4>
                        <p className="text-xs text-teal-700/80 dark:text-teal-400">
                          رفع فائق السرعة والخفة بدقة عالية ومعالجة تلقائية للبث السحابي المباشر.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300">
                        Cloud: {cloudName || 'chemistry-egypt'}
                      </span>
                    </div>
                  </div>

                  {/* File input trigger */}
                  <div className="border-2 border-dashed border-teal-400/80 dark:border-teal-600 rounded-2xl p-6 text-center bg-white/70 dark:bg-slate-900/60 hover:bg-white transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                      onChange={handleCloudinaryVideoUpload}
                      disabled={uploadingVideo}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {uploadingVideo ? (
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                        ) : (
                          <Upload className="w-6 h-6 text-teal-600" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-kufi">
                        {uploadingVideo ? 'جاري رفع ومعالجة الفيديو إلى Cloudinary...' : 'اضغط لاختيار فيديو المحاضرة من جهازك أو اسحبه هنا'}
                      </div>
                      <p className="text-xs text-slate-500">
                        يدعم جميع الصيغ (MP4, MKV, MOV, WEBM) · يتم توليد رابط البث السحابي المباشر فوراً
                      </p>
                    </div>
                  </div>

                  {/* Active Upload Progress Bar */}
                  {uploadingVideo && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold font-mono">
                        <span className="text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          جاري الرفع السحابي السريع...
                        </span>
                        <span className="text-teal-600 font-extrabold">{videoUploadProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-200"
                          style={{ width: `${Math.max(videoUploadProgress, 5)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Upload Success Notice */}
                  {videoUploadSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5 font-kufi">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          {videoUploadNotice || 'تم تجهيز الفيديو بنجاح وأصبح جاهزاً للبث!'}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                          {lecDuration}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 dir-ltr">
                        {lecVideoUrl}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video URL */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                    رابط بث الفيديو (تم تعبئته تلقائياً من كلاودنري أو الصق رابط YouTube Embed) *
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
            TAB 2: LECTURES LIST (VIEW, EDIT & DELETE)
        ======================================================== */}
        {activeTab === 'lectures-list' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                  المحاضرات المنشورة على المنصة ({lectures.length})
                </h2>
                <p className="text-sm text-slate-500">
                  يمكنك مراجعة جميع الدروس وتعديل تفاصيلها أو حذفها بكل سهولة وبدون تعقيد.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('upload-lecture')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة درس جديد</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lectures.map((lec) => (
                <div key={lec.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                        {lec.gradeLabel}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        حصة رقم {lec.sessionOrder || 1}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{lec.duration}</span>
                      {lec.isFreePreview && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          مجانية
                        </span>
                      )}
                      {lec.quizId && (
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                          مرتبطة بكويز إجباري
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-kufi">
                      {lec.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{lec.description}</p>
                    <div className="text-[11px] font-mono text-slate-400 truncate max-w-md dir-ltr">
                      {lec.videoUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setEditingLecture(lec)}
                      className="px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="تعديل المحاضرة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {deleteConfirmLecId === lec.id ? (
                      <div className="flex items-center gap-1.5 p-1 bg-rose-50 dark:bg-rose-950/80 rounded-xl border border-rose-300 dark:border-rose-800">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1">حذف نهائي؟</span>
                        <button
                          onClick={() => {
                            onDeleteLecture(lec.id);
                            setDeleteConfirmLecId(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setDeleteConfirmLecId(null)}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmLecId(lec.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="حذف المحاضرة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {lectures.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  لا توجد محاضرات منشورة حالياً. ابدأ برفع أول محاضرة الآن!
                </div>
              )}
            </div>

            {/* Edit Lecture Modal */}
            {editingLecture && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-bold font-kufi text-slate-900 dark:text-white">
                        تعديل تفاصيل المحاضرة
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingLecture(null)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditedLecture} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        عنوان المحاضرة *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingLecture.title}
                        onChange={(e) => setEditingLecture({ ...editingLecture, title: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                          السنة الدراسية
                        </label>
                        <select
                          value={editingLecture.grade}
                          onChange={(e) => {
                            const g = e.target.value as GradeLevel;
                            setEditingLecture({
                              ...editingLecture,
                              grade: g,
                              gradeLabel: g === 'first' ? 'الصف الأول الثانوي' : g === 'second' ? 'الصف الثاني الثانوي' : 'الصف الثالث الثانوي'
                            });
                          }}
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                        >
                          <option value="first">الصف الأول الثانوي</option>
                          <option value="second">الصف الثاني الثانوي</option>
                          <option value="third">الصف الثالث الثانوي</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                          اسم الباب أو الفصل
                        </label>
                        <input
                          type="text"
                          value={editingLecture.chapter}
                          onChange={(e) => setEditingLecture({ ...editingLecture, chapter: e.target.value })}
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                          مدة المحاضرة
                        </label>
                        <input
                          type="text"
                          value={editingLecture.duration}
                          onChange={(e) => setEditingLecture({ ...editingLecture, duration: e.target.value })}
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                          ترتيب الحصة في المنصة (Session Order)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={editingLecture.sessionOrder || 1}
                          onChange={(e) => setEditingLecture({ ...editingLecture, sessionOrder: Number(e.target.value) })}
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        رابط الفيديو (Cloudinary URL أو YouTube Embed) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingLecture.videoUrl}
                        onChange={(e) => setEditingLecture({ ...editingLecture, videoUrl: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        الكويز الإجباري المرتبط
                      </label>
                      <select
                        value={editingLecture.quizId || ''}
                        onChange={(e) => setEditingLecture({ ...editingLecture, quizId: e.target.value || undefined })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      >
                        <option value="">بدون كويز إجباري</option>
                        {quizzes.map((q) => (
                          <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="editIsFree"
                        checked={editingLecture.isFreePreview || false}
                        onChange={(e) => setEditingLecture({ ...editingLecture, isFreePreview: e.target.checked })}
                        className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                      />
                      <label htmlFor="editIsFree" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        محاضرة تجريبية مجانية لجميع الزوار
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        وصف المحاضرة
                      </label>
                      <textarea
                        rows={3}
                        value={editingLecture.description}
                        onChange={(e) => setEditingLecture({ ...editingLecture, description: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingLecture(null)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm cursor-pointer"
                      >
                        حفظ التعديلات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
            TAB 3: FILES & HANDOUTS MANAGEMENT (CLOUDINARY POWERED)
        ======================================================== */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600">
                    <Cloud className="w-5 h-5" />
                  </span>
                  <h2 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                    رفع وإدارة المذكرات عبر Cloudinary ☁️
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  ارفع ملازم الشرح والشيتات من جهازك مباشرة إلى كلاودنري مع متابعة المساحة الحقيقية المتبقية.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono">
                  {attachments.length} ملفات منشورة
                </span>
              </div>
            </div>

            {/* REAL-TIME CLOUDINARY STORAGE QUOTA MONITOR CARD */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white border border-teal-800/50 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-teal-300 font-mono">سعة تخزين كلاودنري السحابية (Cloudinary Live Storage)</span>
                  </div>
                  <h3 className="text-xl font-bold font-kufi">
                    المساحة المتبقية: <span className="text-amber-300 font-mono">{remainingGB} GB</span> من إجمالي {CLOUDINARY_TOTAL_QUOTA_GB} GB
                  </h3>
                </div>

                <div className="text-left sm:text-right font-mono">
                  <div className="text-xs text-slate-400">المستهلك الفعلي:</div>
                  <div className="text-lg font-bold text-teal-300">
                    {totalUsedGB >= 1 ? `${totalUsedGB} GB` : `${totalUsedMB.toFixed(1)} MB`}
                    <span className="text-xs text-slate-400 font-normal mr-1.5">({usedPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Visual Storage Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usedPercentage > 85 ? 'bg-rose-500' : usedPercentage > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(3, usedPercentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>0 GB</span>
                  <span>المستخدم: {totalUsedGB} GB ({lectures.length} فيديو + {attachments.length} ملزمة)</span>
                  <span>الحد الأقصى المجاني: {CLOUDINARY_TOTAL_QUOTA_GB} GB</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-teal-200 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>تحديث لايف: يمكنك حذف أي مذكرة أو ملف فائض لتفريغ المساحة فوراً بدون إعادة تحميل الصفحة!</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">حساب: {cloudName}</span>
              </div>
            </div>

            {/* Inline Notifications */}
            {fileFormSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{fileFormSuccess}</span>
              </div>
            )}

            {fileFormError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-sm font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{fileFormError}</span>
              </div>
            )}

            {/* DIRECT CLOUDINARY DEVICE FILE UPLOADER */}
            <form onSubmit={handleCreateAttachment} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-teal-200/80 dark:border-slate-700 space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <span>رفع مذكرة أو ملزمة جديدة من جهازك إلى كلاودنري 📂</span>
              </h3>

              {/* Direct File Picker Dropzone */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 text-center space-y-3 relative">
                <input
                  type="file"
                  id="handoutFileInput"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectHandoutFile(f);
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <label
                    htmlFor="handoutFileInput"
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer transition-colors inline-block shadow-sm"
                  >
                    اختر ملف المذكرة من الجهاز (PDF, Word, صور)
                  </label>
                  <p className="text-xs text-slate-500 mt-2">
                    يتم رفع الملف مباشرة إلى حساب Cloudinary الخاص بك وحساب حجمه الدقيق
                  </p>
                </div>

                {/* Live Progress Bar for Handout Upload */}
                {uploadingHandout && (
                  <div className="max-w-md mx-auto space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono text-teal-700 dark:text-teal-300">
                      <span>جاري الرفع إلى كلاودنري...</span>
                      <span>{handoutProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-200"
                        style={{ width: `${handoutProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {handoutFile && !uploadingHandout && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold font-mono">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>تم تحديد: {handoutFile.name} ({fileSize})</span>
                  </div>
                )}
              </div>

              {/* File Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">عنوان المذكرة *</label>
                  <input
                    type="text"
                    required
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="مثال: مذكرة الكيمياء العضوية الشاملة"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الصف الدراسي</label>
                  <select
                    value={fileGrade}
                    onChange={(e) => setFileGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="first">الصف الأول الثانوي</option>
                    <option value="second">الصف الثاني الثانوي</option>
                    <option value="third">الصف الثالث الثانوي</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الباب أو الوحدة</label>
                  <input
                    type="text"
                    value={fileChapter}
                    onChange={(e) => setFileChapter(e.target.value)}
                    placeholder="مثال: الباب الأول: العناصر الانتقالية"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 font-mono">
                  الحجم المسجل: <span className="font-bold text-teal-600">{fileSize}</span>
                </div>

                <button
                  type="submit"
                  disabled={uploadingHandout}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Cloud className="w-4 h-4" />
                  <span>تأكيد ونشر المذكرة في مكتبة الطلاب</span>
                </button>
              </div>
            </form>

            {/* List of attachments with Space Reclamation Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-kufi">
                  المذكرات والملفات المنشورة حالياً ({attachments.length}):
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  احذف أي ملف لتفريغ المساحة فوراً
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attachments.map((file) => (
                  <div key={file.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 transition-all flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="text-teal-600 font-semibold">{file.gradeLabel}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">{file.fileSize}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.downloadUrl && file.downloadUrl !== '#' && (
                        <button
                          onClick={() => window.open(file.downloadUrl, '_blank')}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition-colors cursor-pointer"
                          title="معاينة الملف"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {deleteConfirmFileId === file.id ? (
                        <div className="flex items-center gap-1.5 p-1 bg-rose-50 dark:bg-rose-950/80 rounded-xl border border-rose-300 dark:border-rose-800">
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1">تفريغ المساحة؟</span>
                          <button
                            onClick={() => {
                              onDeleteAttachment(file.id);
                              setDeleteConfirmFileId(null);
                              setFileFormSuccess('تم حذف الملف وتفريغ المساحة السحابية بنجاح! 🗑️');
                              setTimeout(() => setFileFormSuccess(null), 3000);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            تأكيد
                          </button>
                          <button
                            onClick={() => setDeleteConfirmFileId(null)}
                            className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmFileId(file.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
                          title="حذف المذكرة لتفريغ مساحة التخزين"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف وتفريغ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {attachments.length === 0 && (
                  <div className="md:col-span-2 py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    لا توجد مذكرات مرفوعة حالياً. مساحتك السحابية جاهزة بالكامل (25 GB متاحة).
                  </div>
                )}
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
                        setCopiedUrlSuccess(true);
                        setTimeout(() => setCopiedUrlSuccess(false), 2500);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      {copiedUrlSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرابط</span>
                        </>
                      )}
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
                onClick={() => setCustomizerSubTab('footer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  customizerSubTab === 'footer' ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>الفوتر والروابط والنبذة 🔗</span>
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
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      <input
                        type="text"
                        value={siteForm.profileImageUrl}
                        onChange={(e) => setSiteForm({ ...siteForm, profileImageUrl: e.target.value })}
                        placeholder="https://res.cloudinary.com/... أو /images/teacher_mohamed_mostafa_1794141316649.jpg"
                        className="flex-1 p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onSaveSiteConfig({ ...siteConfig, profileImageUrl: siteForm.profileImageUrl });
                          setAdminNotice({ type: 'success', message: 'تم حفظ وتثبيت رابط صورة الأستاذ على السيرفر لجميع المتصفحات فورياً! ☁️' });
                        }}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs font-kufi flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>تثبيت الرابط للسيرفر الآن</span>
                      </button>
                    </div>
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
                        e.currentTarget.src = '/images/teacher_mohamed_mostafa_1794141316649.jpg';
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

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        رابط حساب المبرمج / البورتفوليو (Developer URL)
                      </label>
                      <input
                        type="text"
                        value={siteForm.developerUrl}
                        onChange={(e) => setSiteForm({ ...siteForm, developerUrl: e.target.value })}
                        placeholder="https://github.com/mazenmohamed"
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB: FOOTER CONTENT, BIO & QUICK LINKS */}
              {customizerSubTab === 'footer' && (
                <div className="space-y-6">
                  {/* Bio in Footer */}
                  <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
                    <label className="text-xs font-bold text-teal-900 dark:text-teal-200 font-kufi flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>نبذة الأستاذ في الفوتر (Footer Bio)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={siteForm.footerBio || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, footerBio: e.target.value })}
                      placeholder="اكتب النبذة التي تظهر لجميع الزوار في أسفل الموقع..."
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500">
                      هذا النص يظهر في أول عمود بالفوتر أسفل اسم الأستاذ مباشرة.
                    </p>
                  </div>

                  {/* Quick Links Manager */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 dark:text-white font-kufi flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-teal-600" />
                        <span>روابط المنصة السريعة في الفوتر</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {(siteForm.footerQuickLinks || []).length} روابط
                      </span>
                    </div>

                    {/* Existing Links List */}
                    <div className="space-y-2">
                      {(siteForm.footerQuickLinks || []).map((link) => (
                        <div key={link.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{link.title}</span>
                            <span className="text-slate-400 font-mono text-[10px] truncate dir-ltr">({link.url})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickLink(link.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                            title="حذف هذا الرابط"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Link */}
                    <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-2">
                      <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300">إضافة رابط فوتر جديد:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newQuickLinkTitle}
                          onChange={(e) => setNewQuickLinkTitle(e.target.value)}
                          placeholder="عنوان الرابط (مثال: شروط الخدمة)"
                          className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={newQuickLinkUrl}
                          onChange={(e) => setNewQuickLinkUrl(e.target.value)}
                          placeholder="الرابط (مثال: #terms أو https://...)"
                          className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddQuickLink}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة الرابط للفوتر</span>
                      </button>
                    </div>
                  </div>

                  {/* Designer & Developer Quick Settings */}
                  <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-3">
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 font-kufi flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-600" />
                      <span>حقوق المصمم والمبرمج في أسفل الفوتر (Mazen Mohamed @mazenmohamed)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اسم المبرمج</label>
                        <input
                          type="text"
                          value={siteForm.developerName}
                          onChange={(e) => setSiteForm({ ...siteForm, developerName: e.target.value })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اليوزر / المعرف</label>
                        <input
                          type="text"
                          value={siteForm.developerHandle}
                          onChange={(e) => setSiteForm({ ...siteForm, developerHandle: e.target.value })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono dir-ltr text-right"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رابط الحساب / البورتفوليو</label>
                        <input
                          type="text"
                          value={siteForm.developerUrl}
                          onChange={(e) => setSiteForm({ ...siteForm, developerUrl: e.target.value })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 font-mono dir-ltr text-right"
                        />
                      </div>
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

        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-kufi text-base text-slate-900 dark:text-white">
                  تأكيد تصفير وإفراغ جميع البيانات
                </h3>
                <p className="text-xs text-slate-500">
                  سيتم حذف وتصفير قوائم المحاضرات والامتحانات والملفات لتبدأ المنصة نظيفة تماماً.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1 font-mono">
              <div>• عدد المحاضرات: {lectures.length}</div>
              <div>• عدد الامتحانات: {quizzes.length}</div>
              <div>• عدد المذكرات: {attachments.length}</div>
              <div>• عدد الطلاب: {students.length}</div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onResetAllData?.();
                  setResetConfirmOpen(false);
                  setAdminNotice({ type: 'success', message: 'تم تصفير وإفراغ جميع بيانات المنصة بنجاح! المنصة الآن جاهزة لإضافة بيانات حقيقية.' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                نعم، صفر كل البيانات الآن
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
