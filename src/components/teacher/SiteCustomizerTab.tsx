import React, { useState, useEffect } from 'react';
import {
  Palette, Check, RefreshCcw, Type, Image as ImageIcon, Sparkles, Phone, Link as LinkIcon,
  User, Cloud, Trash2, Plus, CheckCircle, AlertCircle
} from 'lucide-react';
import { CloudinaryConfig } from '../../types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '../../types/siteConfig';
import { uploadMediaFile, UploadProgressInfo } from '../../utils/uploader';
import { UploadProgressBar } from '../UploadProgressBar';
import { InlineMediaPreview } from '../MediaPreview';

interface SiteCustomizerTabProps {
  siteConfig: SiteConfig;
  siteForm: SiteConfig;
  setSiteForm: React.Dispatch<React.SetStateAction<SiteConfig>>;
  cloudinaryConfig: CloudinaryConfig;
  onSaveSiteConfig: (newConfig: SiteConfig) => Promise<boolean> | boolean | void;
}

export const SiteCustomizerTab: React.FC<SiteCustomizerTabProps> = ({
  siteConfig,
  siteForm,
  setSiteForm,
  cloudinaryConfig,
  onSaveSiteConfig,
}) => {
  const [customizerSubTab, setCustomizerSubTab] = useState<
    'general' | 'images' | 'fonts-colors' | 'features' | 'contact' | 'footer' | 'credits'
  >('general');

  const [siteSaveSuccess, setSiteSaveSuccess] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [uploadingTeacherPhoto, setUploadingTeacherPhoto] = useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const [teacherPhotoProgress, setTeacherPhotoProgress] = useState(0);
  const [teacherPhotoMeta, setTeacherPhotoMeta] = useState<UploadProgressInfo | null>(null);

  const [newQuickLinkTitle, setNewQuickLinkTitle] = useState('');
  const [newQuickLinkUrl, setNewQuickLinkUrl] = useState('');

  useEffect(() => {
    return () => {
      if (localPhotoPreview) URL.revokeObjectURL(localPhotoPreview);
    };
  }, [localPhotoPreview]);

  const handleSaveSiteConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      const saved = await onSaveSiteConfig(siteForm);
      if (saved === false) {
        setSiteSaveSuccess(false);
        setNotice({
          type: 'error',
          message: 'تعذر حفظ التعديلات على السحابة. يرجى التحقق من اتصال الحساب وصلاحيات الإدارة.',
        });
        return;
      }
      setSiteSaveSuccess(true);
      setTimeout(() => setSiteSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSiteDefaults = async () => {
    const saved = await onSaveSiteConfig(DEFAULT_SITE_CONFIG);
    if (saved === false) return;
    setSiteForm(DEFAULT_SITE_CONFIG);
    setSiteSaveSuccess(true);
    setTimeout(() => setSiteSaveSuccess(false), 2500);
  };

  const handleTeacherPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (localPhotoPreview) URL.revokeObjectURL(localPhotoPreview);
    const preview = URL.createObjectURL(file);
    setLocalPhotoPreview(preview);
    setUploadingTeacherPhoto(true);
    setTeacherPhotoProgress(0);
    setTeacherPhotoMeta(null);
    setNotice(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName: cloudinaryConfig.cloudName || 'chemistry-egypt',
        uploadPreset: cloudinaryConfig.uploadPreset || 'chemistry_uploads',
        resourceType: 'image',
        onProgress: (percent, info) => {
          setTeacherPhotoProgress(percent);
          setTeacherPhotoMeta(info);
        },
      });
      const updatedConfig: SiteConfig = { ...siteConfig, ...siteForm, profileImageUrl: result.url };
      const saved = await onSaveSiteConfig(updatedConfig);
      if (saved === false) {
        setNotice({ type: 'error', message: 'تم رفع الصورة ولكن تعذر حفظ التعديل في السحابة.' });
      } else {
        setSiteForm(updatedConfig);
        setNotice({
          type: 'success',
          message: 'تم رفع وتثبيت صورة الأستاذ وحفظها بنجاح لجميع الزوار! ☁️',
        });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'فشل رفع الصورة' });
    } finally {
      setUploadingTeacherPhoto(false);
      URL.revokeObjectURL(preview);
      setLocalPhotoPreview(null);
    }
  };

  const handleAddQuickLink = async () => {
    if (!newQuickLinkTitle.trim() || !newQuickLinkUrl.trim()) return;
    const currentLinks = siteForm.footerQuickLinks || [];
    const newLink = {
      id: `link-${Date.now()}`,
      title: newQuickLinkTitle.trim(),
      url: newQuickLinkUrl.trim(),
    };
    const updatedConfig: SiteConfig = {
      ...siteForm,
      footerQuickLinks: [...currentLinks, newLink],
    };
    const saved = await onSaveSiteConfig(updatedConfig);
    if (saved !== false) {
      setSiteForm(updatedConfig);
      setNewQuickLinkTitle('');
      setNewQuickLinkUrl('');
    }
  };

  const handleRemoveQuickLink = async (idToRemove: string) => {
    const currentLinks = siteForm.footerQuickLinks || [];
    const updatedConfig: SiteConfig = {
      ...siteForm,
      footerQuickLinks: currentLinks.filter((l) => l.id !== idToRemove),
    };
    const saved = await onSaveSiteConfig(updatedConfig);
    if (saved !== false) {
      setSiteForm(updatedConfig);
    }
  };

  return (
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
            تحكم مباشر وفوري في كل نصوص وصور وألوان المنصة والفوتر!
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

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Customizer Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setCustomizerSubTab('general')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'general'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>الاسم والعناوين</span>
        </button>

        <button
          type="button"
          onClick={() => setCustomizerSubTab('images')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'images'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>صورة الأستاذ</span>
        </button>

        <button
          type="button"
          onClick={() => setCustomizerSubTab('fonts-colors')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'fonts-colors'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>الخطوط والألوان</span>
        </button>

        <button
          type="button"
          onClick={() => setCustomizerSubTab('features')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'features'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>كروت المميزات (4)</span>
        </button>

        <button
          type="button"
          onClick={() => setCustomizerSubTab('contact')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'contact'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>التواصل والمقرات</span>
        </button>

        <button
          type="button"
          onClick={() => setCustomizerSubTab('footer')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'footer'
              ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>الفوتر والروابط والنبذة 🔗</span>
        </button>

        <button
          type="button"
          onClick={() => setCustomizerSubTab('credits')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            customizerSubTab === 'credits'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>حقوق المبرمج (Mazen)</span>
        </button>
      </div>

      <form onSubmit={handleSaveSiteConfigSubmit} className="space-y-6 pt-2">
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
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono dir-ltr"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const saved = await onSaveSiteConfig({
                      ...siteConfig,
                      ...siteForm,
                      profileImageUrl: siteForm.profileImageUrl,
                    });
                    if (saved === false) {
                      setNotice({
                        type: 'error',
                        message: 'تعذر حفظ رابط الصورة في السحابة، يرجى التحقق من الاتصال والصلاحيات.',
                      });
                    } else {
                      setNotice({
                        type: 'success',
                        message: 'تم حفظ وتثبيت رابط صورة الأستاذ في السحابة لجميع المستخدمين فورياً! ☁️',
                      });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs font-kufi flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتثبيت للجميع الآن</span>
                </button>
                {siteForm.profileImageUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      const nextCfg = { ...siteForm, profileImageUrl: '' };
                      const saved = await onSaveSiteConfig({
                        ...siteConfig,
                        ...nextCfg,
                      });
                      if (saved === false) {
                        setNotice({ type: 'error', message: 'تعذر مسح الصورة من السحابة.' });
                      } else {
                        setSiteForm(nextCfg);
                        setNotice({
                          type: 'success',
                          message: 'تم مسح صورة الأستاذ القديمة من المنصة بالكامل.',
                        });
                      }
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs font-kufi flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>مسح الصورة</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 space-y-3">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-kufi flex items-center gap-1.5">
                <Cloud className="w-4 h-4" />
                <span>رفع صورة جديدة للأستاذ من جهازك مباشرة:</span>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleTeacherPhotoUpload}
                disabled={uploadingTeacherPhoto}
                className="text-xs text-slate-600 dark:text-slate-300"
              />
              {uploadingTeacherPhoto && (
                <div className="pt-2">
                  <UploadProgressBar
                    label="جاري ضغط ورفع صورة الأستاذ..."
                    progress={teacherPhotoProgress}
                    meta={teacherPhotoMeta}
                  />
                </div>
              )}
            </div>

            {(localPhotoPreview || siteForm.profileImageUrl) && (
              <InlineMediaPreview
                url={localPhotoPreview || siteForm.profileImageUrl}
                title={`معاينة صورة الأستاذ ${siteForm.teacherName}`}
                kind="image"
                compact
              />
            )}
          </div>
        )}

        {customizerSubTab === 'fonts-colors' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-kufi">
                  خط اسم المدرس والعناوين المزغرفة
                </label>
                <select
                  value={siteForm.calligraphyFont}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, calligraphyFont: e.target.value as any })
                  }
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
              <div className="font-bold text-xs text-teal-700 dark:text-teal-300 font-kufi">
                كارت 2 (شرح الكيمستري البارز)
              </div>
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

        {customizerSubTab === 'footer' && (
          <div className="space-y-6">
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
            </div>

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

              <div className="space-y-2">
                {(siteForm.footerQuickLinks || []).map((link) => (
                  <div
                    key={link.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{link.title}</span>
                      <span className="text-slate-400 font-mono text-[10px] truncate dir-ltr">
                        ({link.url})
                      </span>
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

              <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                  إضافة رابط فوتر جديد:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newQuickLinkTitle}
                    onChange={(e) => setNewQuickLinkTitle(e.target.value)}
                    placeholder="عنوان الرابط"
                    className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={newQuickLinkUrl}
                    onChange={(e) => setNewQuickLinkUrl(e.target.value)}
                    placeholder="الرابط (#section أو https://...)"
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
          </div>
        )}

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
                  رابط حساب المبرمج / البورتفوليو
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

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="submit"
            disabled={saving || uploadingTeacherPhoto}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-md shadow-teal-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ وتحديث الموقع فوراً'}</span>
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
  );
};
