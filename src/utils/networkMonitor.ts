// Real-time network speed, server latency (RTT), and connectivity monitor

export type NetworkQualityLevel = 'good' | 'slow' | 'offline';

export interface NetworkAlertDetail {
  level: NetworkQualityLevel;
  message: string;
  speedMbps?: number;
  rttMs?: number;
  context?: 'general' | 'upload' | 'auth' | 'save';
}

export const NETWORK_ALERT_EVENT = 'mm-network-alert';
export const HIGH_LATENCY_MS = 1000;

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
  context: NetworkAlertDetail['context'] = 'general',
  options?: { silent?: boolean }
): Promise<NetworkAlertDetail> {
  const silent = Boolean(options?.silent);

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const detail: NetworkAlertDetail = {
      level: 'offline',
      message: 'انقطع الاتصال بالإنترنت — تأكد من الشبكة للمتابعة.',
      context,
    };
    if (!silent) emitNetworkAlert(detail);
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

    if (rttMs >= HIGH_LATENCY_MS || quick.level === 'slow') {
      const detail: NetworkAlertDetail = {
        level: 'slow',
        rttMs,
        message:
          context === 'upload'
            ? 'زمن الاستجابة مرتفع والإنترنت ضعيف حالياً — جاري متابعة الرفع تدريجياً، لا تغلق الصفحة.'
            : context === 'auth'
            ? 'زمن التأخير (Latency) مرتفع — قد تتأخر نافذة تسجيل الدخول، يُرجى الانتظار أو إعادة المحاولة.'
            : 'جودة الإنترنت منخفضة (زمن التأخير مرتفع) — قد يتأخر تحميل أو حفظ البيانات.',
        context,
      };
      if (!silent) emitNetworkAlert(detail);
      return detail;
    }

    const goodDetail: NetworkAlertDetail = {
      level: 'good',
      rttMs,
      message: '',
      context,
    };
    if (!silent) emitNetworkAlert(goodDetail);
    return goodDetail;
  } catch {
    clearTimeout(timeout);
    const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
    const detail: NetworkAlertDetail = {
      level: offlineNow ? 'offline' : 'slow',
      rttMs: offlineNow ? undefined : 5500,
      message: offlineNow
        ? 'انقطع الاتصال بالإنترنت — تحقق من الواي فاي أو بيانات الهاتف.'
        : 'اتصال الإنترنت ضعيف أو انتهت مهلة استجابة السيرفر.',
      context,
    };
    if (!silent) emitNetworkAlert(detail);
    return detail;
  }
}
