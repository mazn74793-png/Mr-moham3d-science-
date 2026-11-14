// Real-time network speed & connectivity monitor (zero-false-positive RTT probe + throughput alerts)

export type NetworkQualityLevel = 'good' | 'slow' | 'offline';

export interface NetworkAlertDetail {
  level: NetworkQualityLevel;
  message: string;
  speedMbps?: number;
  rttMs?: number;
  context?: 'general' | 'upload' | 'auth' | 'save';
}

export const NETWORK_ALERT_EVENT = 'mm-network-alert';

export function emitNetworkAlert(detail: NetworkAlertDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<NetworkAlertDetail>(NETWORK_ALERT_EVENT, { detail }));
}

interface NavigatorConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function getConnection(): NavigatorConnection | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as any;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

export function getQuickNetworkStatus(): { level: NetworkQualityLevel; reason?: string } {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { level: 'offline', reason: 'لا يوجد اتصال بالإنترنت حالياً.' };
  }

  const conn = getConnection();
  if (conn) {
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
      return { level: 'slow', reason: 'شبكة الإنترنت بطيئة جداً (2G).' };
    }
    if (
      (conn.downlink !== undefined && conn.downlink > 0 && conn.downlink < 0.75) ||
      (conn.rtt !== undefined && conn.rtt > 900)
    ) {
      return { level: 'slow', reason: 'سرعة الإنترنت الحالية منخفضة.' };
    }
  }

  return { level: 'good' };
}

export async function probeNetworkQuality(
  context: NetworkAlertDetail['context'] = 'general'
): Promise<NetworkAlertDetail> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const detail: NetworkAlertDetail = {
      level: 'offline',
      message: 'انقطع الاتصال بالإنترنت — تأكد من الشبكة للمتابعة.',
      context,
    };
    emitNetworkAlert(detail);
    return detail;
  }

  const quick = getQuickNetworkStatus();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  const start = performance.now();

  try {
    const res = await fetch(`/favicon.svg?_net=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const rttMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return { level: quick.level, message: quick.reason || '', rttMs, context };
    }

    if (rttMs >= 1600 || quick.level === 'slow') {
      const detail: NetworkAlertDetail = {
        level: 'slow',
        rttMs,
        message:
          context === 'upload'
            ? 'الإنترنت ضعيف حالياً — قد يستغرق رفع الملفات والفيديوهات وقتاً أطول، لا تغلق الصفحة.'
            : context === 'auth'
            ? 'الإنترنت ضعيف حالياً — إذا تأخرت نافذة Google يمكنك استخدام الدخول في نفس الصفحة.'
            : 'سرعة الإنترنت لديك ضعيفة حالياً، قد يتأخر تحميل أو حفظ البيانات.',
        context,
      };
      emitNetworkAlert(detail);
      return detail;
    }

    return {
      level: 'good',
      rttMs,
      message: '',
      context,
    };
  } catch {
    clearTimeout(timeout);
    const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
    const detail: NetworkAlertDetail = {
      level: offlineNow ? 'offline' : 'slow',
      message: offlineNow
        ? 'انقطع الاتصال بالإنترنت — تحقق من الواي فاي أو بيانات الهاتف.'
        : 'اتصال الإنترنت ضعيف أو غير مستقر حالياً.',
      context,
    };
    emitNetworkAlert(detail);
    return detail;
  }
}
