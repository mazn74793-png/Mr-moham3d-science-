import { UserProfile } from '../types';
import { SiteConfig } from '../types/siteConfig';

export function normalizeWhatsAppDigits(raw?: string | null): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '201002345678';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('20')) return digits;
  if (digits.startsWith('0')) return `2${digits}`;
  if (digits.length === 10 && digits.startsWith('1')) return `20${digits}`;
  return digits;
}

export function buildWhatsAppSupportUrl(
  siteConfig?: SiteConfig | null,
  customMessage?: string
): string {
  const target = normalizeWhatsAppDigits(
    siteConfig?.whatsappNumber || siteConfig?.phone1 || '01002345678'
  );
  if (!customMessage || !customMessage.trim()) {
    return `https://wa.me/${target}`;
  }
  return `https://wa.me/${target}?text=${encodeURIComponent(customMessage)}`;
}

export function isStudentApproved(
  user: UserProfile | null | undefined,
  siteConfig?: SiteConfig | null
): boolean {
  if (!user) return false;
  if (user.role === 'teacher') return true;
  if (user.isBlocked) return false;
  if (user.approvalStatus === 'rejected') return false;
  if (siteConfig?.featureFlags?.requireStudentApproval === false) return true;
  if (user.approvalStatus === 'approved') return true;
  if (user.approvalStatus === 'pending') return false;
  // Backward compatibility: legacy student accounts created before approval gating had profileCompleted=true and no approvalStatus field
  return Boolean(user.profileCompleted);
}
