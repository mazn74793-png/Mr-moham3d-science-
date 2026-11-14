import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { SiteConfig } from '../../types/siteConfig';

interface CoAdminsTabProps {
  siteForm: SiteConfig;
  setSiteForm: React.Dispatch<React.SetStateAction<SiteConfig>>;
  onSaveSiteConfig: (config: SiteConfig) => Promise<boolean> | boolean | void;
}

export const CoAdminsTab: React.FC<CoAdminsTabProps> = ({
  siteForm,
  setSiteForm,
  onSaveSiteConfig,
}) => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminNotice, setAdminNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleteAdminConfirmEmail, setDeleteAdminConfirmEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddCoAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminNotice(null);
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setAdminNotice({ type: 'error', message: 'يرجى إدخال بريد إلكتروني صحيح.' });
      return;
    }
    const currentAdmins = siteForm.adminEmails || ['mizoo2y2@gmail.com'];
    if (currentAdmins.some((em) => em.toLowerCase().trim() === email)) {
      setAdminNotice({ type: 'error', message: 'هذا البريد مسجل كمدير ومسؤول بالفعل!' });
      return;
    }
    const updatedAdmins = [...currentAdmins, email];
    const updatedConfig: SiteConfig = { ...siteForm, adminEmails: updatedAdmins };

    setSaving(true);
    try {
      const saved = await onSaveSiteConfig(updatedConfig);
      if (saved === false) {
        setAdminNotice({
          type: 'error',
          message: 'تعذر حفظ صلاحيات المشرف في السحابة، يرجى التحقق من الاتصال والصلاحيات.',
        });
        return;
      }
      setSiteForm(updatedConfig);
      setNewAdminEmail('');
      setAdminNotice({
        type: 'success',
        message: `تمت إضافة المشرف والمدير المساعد (${email}) بنجاح وبكامل الصلاحيات! 🛡️`,
      });
      setTimeout(() => setAdminNotice(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCoAdmin = async (emailToRemove: string) => {
    if (emailToRemove === 'mizoo2y2@gmail.com') return;
    const currentAdmins = siteForm.adminEmails || ['mizoo2y2@gmail.com'];
    const updatedAdmins = currentAdmins.filter((em) => em !== emailToRemove);
    const updatedConfig: SiteConfig = { ...siteForm, adminEmails: updatedAdmins };

    const saved = await onSaveSiteConfig(updatedConfig);
    setDeleteAdminConfirmEmail(null);
    if (saved === false) {
      setAdminNotice({
        type: 'error',
        message: 'تعذر تحديث قائمة المشرفين في قاعدة البيانات.',
      });
      return;
    }
    setSiteForm(updatedConfig);
    setAdminNotice({
      type: 'success',
      message: `تم حذف المدير المساعد (${emailToRemove}) بنجاح.`,
    });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const adminList = siteForm.adminEmails || ['mizoo2y2@gmail.com'];

  return (
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
            أضف بريد Google لأي مساعد أو مشرف ليحصل على كامل الصلاحيات (الرفع والحذف والتعديل) من أول تسجيل دخول مباشرة.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-300 font-mono self-start sm:self-auto">
          {adminList.length} مدراء نشطون
        </div>
      </div>

      {adminNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
            adminNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {adminNotice.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{adminNotice.message}</span>
        </div>
      )}

      <form
        onSubmit={handleAddCoAdmin}
        className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
      >
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
            placeholder="assistant@gmail.com"
            className="w-full sm:flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono dir-ltr text-right"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 active:scale-98 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'منح صلاحيات الإدارة كاملة'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          عند تسجيل دخول هذا البريد بحساب Google، يفتح له النظام لوحة التحكم بكامل الصلاحيات فوراً في خطوة واحدة بدون أي طلب تسجيل دخول إضافي.
        </p>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-kufi">
          قائمة المدراء والمشرفين المسجلين في النظام:
        </h3>

        <div className="space-y-2">
          <div className="p-4 rounded-2xl border-2 border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                👑
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2 flex-wrap">
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

          {adminList
            .filter((email) => email !== 'mizoo2y2@gmail.com')
            .map((email) => (
              <div
                key={email}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
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

          {adminList.filter((e) => e !== 'mizoo2y2@gmail.com').length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              لم تتم إضافة أي مدراء مساعدين بعد. أدخل بريد مساعدك في الحقل أعلاه لمنحه صلاحيات كاملة.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
