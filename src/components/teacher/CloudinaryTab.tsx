import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, RefreshCw, Upload, Copy, Check, AlertCircle } from 'lucide-react';
import { CloudinaryConfig } from '../../types';
import { uploadMediaFile, UploadProgressInfo } from '../../utils/uploader';
import { UploadProgressBar } from '../UploadProgressBar';
import { InlineMediaPreview, detectMediaKind, MediaKind } from '../MediaPreview';

interface CloudinaryTabProps {
  cloudinaryConfig: CloudinaryConfig;
  onSaveCloudinaryConfig: (config: CloudinaryConfig) => Promise<boolean> | boolean | void;
  onImageUploadedThumbnail?: (url: string) => void;
}

export const CloudinaryTab: React.FC<CloudinaryTabProps> = ({
  cloudinaryConfig,
  onSaveCloudinaryConfig,
  onImageUploadedThumbnail,
}) => {
  const [cloudName, setCloudName] = useState(cloudinaryConfig.cloudName || 'chemistry-egypt');
  const [uploadPreset, setUploadPreset] = useState(
    cloudinaryConfig.uploadPreset || 'chemistry_uploads'
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileUploadMeta, setFileUploadMeta] = useState<UploadProgressInfo | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedKind, setUploadedKind] = useState<MediaKind>('image');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [copiedUrlSuccess, setCopiedUrlSuccess] = useState(false);

  useEffect(() => {
    setCloudName(cloudinaryConfig.cloudName || 'chemistry-egypt');
    setUploadPreset(cloudinaryConfig.uploadPreset || 'chemistry_uploads');
  }, [cloudinaryConfig]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await onSaveCloudinaryConfig({ cloudName, uploadPreset });
    if (saved !== false) {
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  const handleDeviceFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    const kind: MediaKind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : /\.(doc|docx|ppt|pptx)$/i.test(file.name)
      ? 'doc'
      : 'pdf';
    setUploadedKind(kind);

    setUploadingFile(true);
    setFileUploadProgress(0);
    setFileUploadMeta(null);
    setUploadedFileName(file.name);
    setUploadNotice(null);

    try {
      const result = await uploadMediaFile(file, {
        cloudName,
        uploadPreset,
        resourceType: kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'auto',
        onProgress: (percent, info) => {
          setFileUploadProgress(percent);
          setFileUploadMeta(info);
        },
      });
      setUploadedUrl(result.url);
      if (kind === 'image' && onImageUploadedThumbnail) {
        onImageUploadedThumbnail(result.url);
      }
      setUploadNotice(
        result.source === 'cloudinary'
          ? 'تم رفع الملف إلى Cloudinary وحفظ الرابط بنجاح ☁️'
          : 'تم رفع الملف وحفظه بنجاح ☁️'
      );
    } catch (err: any) {
      setUploadNotice(err?.message || 'حدث خطأ أثناء رفع الملف');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
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
          ارفع الصور والفيديوهات والمذكرات مباشرة مع معاينة فورية وروابط قابلة للنسخ.
        </p>
      </div>

      <form
        onSubmit={handleSaveConfig}
        className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4"
      >
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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

      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-kufi">
          رفع سريع ومعاينة أي ملف (صورة / فيديو / PDF):
        </h3>

        <div className="border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-3xl p-8 text-center bg-[#fafffb] dark:bg-slate-900/60 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition-colors relative">
          <input
            type="file"
            accept="image/*,video/*,application/pdf,.doc,.docx"
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
                {uploadingFile ? 'جاري رفع الملف...' : 'اضغط لاختيار صورة أو فيديو أو مذكرة'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                يدعم الصور (مع ضغط فائق السرعة) والفيديوهات وملفات PDF مع معاينة مباشرة
              </div>
            </div>
          </div>
        </div>

        {uploadingFile && (
          <UploadProgressBar
            label="جاري الرفع..."
            progress={fileUploadProgress}
            meta={fileUploadMeta}
            fileName={uploadedFileName}
          />
        )}

        {(uploadedUrl || localPreview) && (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 space-y-3">
            {uploadedUrl && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-kufi flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    تم رفع الملف بنجاح!
                  </span>
                  <button
                    type="button"
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
              </>
            )}

            <InlineMediaPreview
              url={uploadedUrl || localPreview || ''}
              title={uploadedFileName || 'معاينة الملف'}
              kind={detectMediaKind(uploadedUrl || '', uploadedKind)}
            />
          </div>
        )}

        {uploadNotice && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
