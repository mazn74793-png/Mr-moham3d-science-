import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, X, Activity } from 'lucide-react';
import {
  HIGH_LATENCY_MS,
  NETWORK_ALERT_EVENT,
  NetworkAlertDetail,
  getQuickNetworkStatus,
  probeNetworkQuality,
} from '../utils/networkMonitor';

const PROBE_INTERVAL_MS = 30000;
const DISMISS_COOLDOWN_MS = 30000;
const MODERATE_LATENCY_MS = 750;

export const NetworkStatusMonitor: React.FC = () => {
  const [alert, setAlert] = useState<NetworkAlertDetail | null>(null);
  const [checking, setChecking] = useState(false);
  const dismissedAtRef = useRef<number>(0);
  const consecutiveModerateRef = useRef<number>(0);

  const runServerLatencyCheck = useCallback(async (forceVisibleAlert = false) => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible' && !forceVisibleAlert) {
      return;
    }

    setChecking(true);
    try {
      const result = await probeNetworkQuality('general', { silent: true });

      if (result.level === 'offline') {
        consecutiveModerateRef.current = 0;
        setAlert({
          level: 'offline',
          message: 'انقطع الاتصال بالإنترنت — لن يتم حفظ التعديلات أو إتمام تسجيل الدخول حتى تعود الشبكة.',
          context: 'general',
        });
        return;
      }

      const rtt = result.rttMs ?? 0;
      const isHighLatency = rtt >= HIGH_LATENCY_MS || result.level === 'slow';
      const isModerateRepeated =
        rtt >= MODERATE_LATENCY_MS && ++consecutiveModerateRef.current >= 2;

      if (rtt < MODERATE_LATENCY_MS) {
        consecutiveModerateRef.current = 0;
      }

      if (isHighLatency || isModerateRepeated) {
        if (!forceVisibleAlert && Date.now() - dismissedAtRef.current < DISMISS_COOLDOWN_MS) {
          return;
        }
        setAlert({
          level: 'slow',
          rttMs: rtt,
          message:
            result.message ||
            'زمن التأخير (Latency) مرتفع حالياً — قد تتأخر عمليات تسجيل الدخول أو رفع الملفات.',
          context: 'general',
        });
      } else if (rtt < 650) {
        // Clear stale general/auth latency warnings once server latency returns to healthy
        setAlert((prev) => (prev && prev.context !== 'upload' ? null : prev));
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleAlertEvent = (e: Event) => {
      const detail = (e as CustomEvent<NetworkAlertDetail>).detail;
      if (!detail) return;
      if (detail.level === 'good') {
        setAlert((prev) => (prev?.context === detail.context || prev?.level === 'offline' ? null : prev));
        return;
      }
      if (detail.level === 'slow' && Date.now() - dismissedAtRef.current < DISMISS_COOLDOWN_MS) {
        return;
      }
      setAlert(detail);
    };

    const handleOffline = () => {
      consecutiveModerateRef.current = 0;
      setAlert({
        level: 'offline',
        message: 'انقطع الاتصال بالإنترنت — لن يتم حفظ التعديلات أو رفع الملفات حتى تعود الشبكة.',
        context: 'general',
      });
    };

    const handleOnline = () => {
      runServerLatencyCheck(false);
    };

    const handleConnectionChange = () => {
      const quick = getQuickNetworkStatus();
      if (quick.level === 'offline') {
        handleOffline();
      } else {
        runServerLatencyCheck(false);
      }
    };

    window.addEventListener(NETWORK_ALERT_EVENT, handleAlertEvent);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const nav = navigator as any;
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    conn?.addEventListener?.('change', handleConnectionChange);

    // Initial latency check + periodic server latency monitoring every 30s
    const initialTimer = window.setTimeout(() => {
      runServerLatencyCheck(false);
    }, 2500);

    const intervalId = window.setInterval(() => {
      runServerLatencyCheck(false);
    }, PROBE_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      window.removeEventListener(NETWORK_ALERT_EVENT, handleAlertEvent);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      conn?.removeEventListener?.('change', handleConnectionChange);
    };
  }, [runServerLatencyCheck]);

  useEffect(() => {
    if (!alert) return;
    const autoHideTimer = window.setTimeout(() => {
      setAlert(null);
    }, 2000);
    return () => window.clearTimeout(autoHideTimer);
  }, [alert]);

  if (!alert || alert.level === 'good') return null;

  const isOffline = alert.level === 'offline';

  return (
    <div
      role="status"
      dir="rtl"
      className={`fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-[130] px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start justify-between gap-3 animate-fade-in ${
        isOffline
          ? 'bg-rose-950/95 border-rose-500/60 text-rose-50'
          : 'bg-amber-950/95 border-amber-500/60 text-amber-50'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {isOffline ? (
          <WifiOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold leading-snug font-kufi">
              {isOffline ? 'انقطاع الاتصال · Internet Offline' : 'جودة الإنترنت · Internet Quality'}
            </span>
            {alert.rttMs !== undefined && alert.rttMs > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/15 text-[10px] font-mono dir-ltr">
                <Activity className="w-3 h-3" />
                {alert.rttMs} ms
              </span>
            )}
            {alert.speedMbps !== undefined && alert.speedMbps > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-[10px] font-mono dir-ltr">
                {alert.speedMbps.toFixed(1)} Mbps
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed font-sans">{alert.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => runServerLatencyCheck(true)}
          disabled={checking}
          title="إعادة فحص جودة الإنترنت"
          aria-label="إعادة فحص جودة الإنترنت"
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => {
            dismissedAtRef.current = Date.now();
            setAlert(null);
          }}
          aria-label="إغلاق تنبيه جودة الإنترنت"
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
