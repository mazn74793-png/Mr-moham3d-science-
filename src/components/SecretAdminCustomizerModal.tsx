import React, { useState } from 'react';
import { 
  X, Lock, ShieldCheck, KeyRound, Sparkles, Check, RefreshCcw, 
  Type, Palette, Image as ImageIcon, FileText, Phone, User, ExternalLink, Cloud
} from 'lucide-react';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '../types/siteConfig';
import { uploadMediaFile, UploadProgressInfo } from '../utils/uploader';
import { UploadProgressBar } from './UploadProgressBar';

interface SecretAdminCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (newConfig: SiteConfig) => void;
  cloudinaryConfig: { cloudName: string; uploadPreset: string };
}

export const SecretAdminCustomizerModal: React.FC<SecretAdminCustomizerModalProps> = ({
  isOpen,
  onClose,
  siteConfig,
  onSaveSiteConfig,
  cloudinaryConfig,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Editable config state
  const [activeTab, setActiveTab] = useState<'general' | 'images' | 'fonts-colors' | 'features' | 'contact' | 'credits'>('general');
  const [formData, setFormData] = useState<SiteConfig>(siteConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadMeta, setUploadMeta] = useState<UploadProgressInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    setFormData(siteConfig);
  }, [siteConfig]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '2825') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleFieldChange = (field: keyof SiteConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSiteConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_SITE_CONFIG);
    onSaveSiteConfig(DEFAULT_SITE_CONFIG);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Device file upload for teacher photo (Guarantees public permanent URL for all browsers & incognito)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError(null);
    setUploadingImage(true);
    setUploadProgress(1);
    setUploadMeta(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName: cloudinaryConfig.cloudName,
        uploadPreset: cloudinaryConfig.uploadPreset,
        resourceType: 'image',
        onProgress: (percent, info) => {
          setUploadProgress(percent);
          setUploadMeta(info);
        },
      });
      handleFieldChange('profileImageUrl', result.url);
      // Immediately push to server database so all other devices & incognito see it
      onSaveSiteConfig({ ...formData, profileImageUrl: result.url });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setUploadError(err?.message || 'فشل رفع الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      setUploadMeta(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-teal-200 dark:border-slate-800 text-right overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-teal-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg font-mono">
              ©
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-kufi">
                لوحة التخصيص والتحكم الشاملة بالموقع
              </h3>
              <p className="text-xs text-teal-300">
                رمز الحماية (2825) · تعديل النصوص، الصور، الخطوط، الألوان، والمميزات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: PIN CODE AUTHENTICATION (2825) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center space-y-6 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-bold font-kufi text-slate-900 dark:text-white">
                أدخل رمز المرور السري
              </h4>
              <p className="text-xs sm:text-sm text-slate-500">
                يرجى إدخال الرمز الخاص (2825) لفتح إعدادات تخصيص الموقع بالكامل.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="2825"
                className="w-full text-center text-3xl font-mono tracking-widest p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-teal-500 dark:text-white"
              />

              {pinError && (
                <div className="text-xs text-rose-500 font-bold">
                  رمز المرور غير صحيح! يرجى إدخال 2825
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 transition-all shadow-md shadow-teal-700/20"
              >
                تأكيد الدخول للوحة التخصيص
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: FULL SITE CUSTOMIZER INTERFACE */
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'general' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>الاسم والعناوين</span>
              </button>

              <button
                onClick={() => setActiveTab('images')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'images' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صورة المدرس</span>
              </button>

              <button
                onClick={() => setActiveTab('fonts-colors')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'fonts-colors' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>الخطوط والألوان</span>
              </button>

              <button
                onClick={() => setActiveTab('features')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'features' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>كروت المميزات (4)</span>
              </button>

              <button
                onClick={() => setActiveTab('contact')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'contact' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>التواصل والمقرات</span>
              </button>

              <button
                onClick={() => setActiveTab('credits')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'credits' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>حقوق المبرمج (Mazen)</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveAll} className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* TAB 1: GENERAL TEXTS */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اسم المدرس
                      </label>
                      <input
                        type="text"
                        value={formData.teacherName}
                        onChange={(e) => handleFieldChange('teacherName', e.target.value)}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اللقب / الشعار السريع
                      </label>
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => handleFieldChange('tagline', e.target.value)}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      شريط البادج في أعلى الهيرو
                    </label>
                    <input
                      type="text"
                      value={formData.heroBadge}
                      onChange={(e) => handleFieldChange('heroBadge', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      الوصف التعريفي في الهيرو
                    </label>
                    <textarea
                      rows={3}
                      value={formData.heroDescription}
                      onChange={(e) => handleFieldChange('heroDescription', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2">
                    <label className="text-xs font-bold text-teal-900 dark:text-teal-200 font-kufi flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-teal-600" />
                      <span>معرف عميل جوجل (Google OAuth Client ID) لتسجيل الدخول الفعلي:</span>
                    </label>
                    <input
                      type="text"
                      value={formData.googleClientId || ''}
                      onChange={(e) => handleFieldChange('googleClientId', e.target.value)}
                      placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-left"
                    />
                    <p className="text-[11px] text-slate-500">
                      الصق هنا الـ Client ID الذي أنشأته من Google Cloud Console لتفعيل نافذة اختيار حسابات جوجل الحقيقية فوراً لجميع الطلاب.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: TEACHER PROFILE IMAGE */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      رابط صورة الأستاذ الشخصية (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.profileImageUrl}
                      onChange={(e) => handleFieldChange('profileImageUrl', e.target.value)}
                      placeholder="https://... أو /images/..."
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr"
                    />
                  </div>

                  {/* Device upload button */}
                  <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 space-y-3">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-kufi flex items-center gap-1.5">
                      <Cloud className="w-4 h-4" />
                      <span>رفع صورة جديدة للأستاذ من جهازك مباشرة:</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingImage}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    />
                    {uploadingImage && (
                      <UploadProgressBar
                        label="جاري رفع وتحديث صورة الأستاذ..."
                        progress={uploadProgress}
                        meta={uploadMeta}
                      />
                    )}
                    {uploadError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 font-bold">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* Preview container */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#fafffb] dark:bg-slate-800/60">
                    <img
                      src={formData.profileImageUrl || '/images/teacher_placeholder.svg'}
                      alt="معاينة الصورة"
                      className="w-24 h-32 rounded-xl object-cover object-top border-2 border-amber-400 shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = '/images/teacher_placeholder.svg';
                      }}
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-bold font-kufi text-slate-900 dark:text-white">
                        معاينة صورة الأستاذ {formData.teacherName}
                      </div>
                      <div className="text-xs text-slate-500">
                        تظهر هذه الصورة في كارت الهيرو الرئيسي مع التدرج اللوني البرتقالي الفخم.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FONTS & COLORS */}
              {activeTab === 'fonts-colors' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        خط اسم المدرس والعناوين المزغرفة
                      </label>
                      <select
                        value={formData.calligraphyFont}
                        onChange={(e) => handleFieldChange('calligraphyFont', e.target.value as any)}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
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
                        value={formData.bodyFont}
                        onChange={(e) => handleFieldChange('bodyFont', e.target.value as any)}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      >
                        <option value="Cairo">خط كايرو (Cairo - افتراضي)</option>
                        <option value="Tajawal">خط تجوال (Tajawal)</option>
                        <option value="Almarai">خط المراعي (Almarai)</option>
                      </select>
                    </div>
                  </div>

                  {/* Color presets */}
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
                          onClick={() => handleFieldChange('primaryColor', c.color)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                            formData.primaryColor === c.color
                              ? 'border-slate-900 dark:border-white shadow-md'
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

              {/* TAB 4: FEATURES CARDS */}
              {activeTab === 'features' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-amber-600 font-kufi">كارت 1 (الجوائز والمكافآت)</div>
                    <input
                      type="text"
                      value={formData.feature1Title}
                      onChange={(e) => handleFieldChange('feature1Title', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={formData.feature1Desc}
                      onChange={(e) => handleFieldChange('feature1Desc', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 space-y-2">
                    <div className="font-bold text-xs text-teal-700 dark:text-teal-300 font-kufi">كارت 2 (شرح الكيمستري البارز)</div>
                    <input
                      type="text"
                      value={formData.feature2Title}
                      onChange={(e) => handleFieldChange('feature2Title', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={formData.feature2Desc}
                      onChange={(e) => handleFieldChange('feature2Desc', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-teal-600 font-kufi">كارت 3 (التقييمات الدورية)</div>
                    <input
                      type="text"
                      value={formData.feature3Title}
                      onChange={(e) => handleFieldChange('feature3Title', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={formData.feature3Desc}
                      onChange={(e) => handleFieldChange('feature3Desc', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-sky-600 font-kufi">كارت 4 (المتابعة المستمرة)</div>
                    <input
                      type="text"
                      value={formData.feature4Title}
                      onChange={(e) => handleFieldChange('feature4Title', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <textarea
                      rows={2}
                      value={formData.feature4Desc}
                      onChange={(e) => handleFieldChange('feature4Desc', e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: CONTACT & BRANCHES */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        رقم هاتف الدعم الأول
                      </label>
                      <input
                        type="text"
                        value={formData.phone1}
                        onChange={(e) => handleFieldChange('phone1', e.target.value)}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        رقم هاتف الدعم الثاني
                      </label>
                      <input
                        type="text"
                        value={formData.phone2}
                        onChange={(e) => handleFieldChange('phone2', e.target.value)}
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
                      value={formData.whatsappNumber}
                      onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
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
                      value={formData.centerBranches}
                      onChange={(e) => handleFieldChange('centerBranches', e.target.value)}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: DEVELOPER CREDITS (Mazen Mohamed) */}
              {activeTab === 'credits' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                    حقوق التصميم والبرمجة كما طلبت تظهر في الفوتر بوضوح: <strong>تصميم وبرمجة Mazen Mohamed</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اسم المصمم والمبرمج
                      </label>
                      <input
                        type="text"
                        value={formData.developerName}
                        onChange={(e) => handleFieldChange('developerName', e.target.value)}
                        placeholder="Mazen Mohamed"
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                        اليوزر أو الحساب
                      </label>
                      <input
                        type="text"
                        value={formData.developerHandle}
                        onChange={(e) => handleFieldChange('developerHandle', e.target.value)}
                        placeholder="@mazenmohamed"
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                      رابط صفحة المطور
                    </label>
                    <input
                      type="text"
                      value={formData.developerUrl}
                      onChange={(e) => handleFieldChange('developerUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1 font-mono dir-ltr"
                    />
                  </div>
                </div>
              )}

              {/* Action buttons footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>استعادة الإعدادات الأصلية</span>
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      تم الحفظ وتطبيق التغييرات فوراً!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ وتحديث الموقع بالكامل</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
