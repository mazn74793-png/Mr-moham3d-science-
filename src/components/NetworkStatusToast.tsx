import React, { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle, X } from 'lucide-react';
import {
  NETWORK_ALERT_EVENT,
  NetworkAlertDetail,
  getQuickNetworkStatus,
  probeNetworkQuality,
} from '../utils/networkMonitor';

export const NetworkStatusToast: React.FC = () => {
  const [alert, setAlert] = useState<NetworkAlertDetail | null>(null);
  const [dismissedAt, setDismissedAt] = useState<number>(0);

  useEffect(() => {
    const handleAlertEvent = (e: Event) => {
      const detail = (e as CustomEvent<NetworkAlertDetail>).detail;
      if (!detail) return;
      if (detail.level === 'good') {
        setAlert((prev) => (prev?.level === 'offline' ? null : prev));
        return;
      }
      // Allow offline alerts immediately; throttle repeated slow alerts after dismissal for 25s
      if (detail.level === 'slow' && Date.now() - dismissedAt < 25000) {
        return;
      }
      setAlert(detail);
    };

    const handleOffline = () => {
      setAlert({
        level: 'offline',
        message: 'انقطع الاتصال بالإنترنت — لن يتم حفظ التعديلات أو رفع الملفات حتى تعود الشبكة.',
        context: 'general',
      });
    };

    const handleOnline = () => {
      setAlert(null);
      probeNetworkQuality('general').then((res) => {
        if (res.level === 'good') setAlert(null);
      });
    };

    const handleConnectionChange = () => {
      const quick = getQuickNetworkStatus();
      if (quick.level === 'offline') {
        handleOffline();
      } else if (quick.level === 'slow') {
        probeNetworkQuality('general');
      } else {
        setAlert(null);
      }
    };

    window.addEventListener(NETWORK_ALERT_EVENT, handleAlertEvent);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const nav = navigator as any;
    const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    conn?.addEventListener?.('change', handleConnectionChange);

    // Lightweight initial real check (silent when connection is healthy)
    const initialQuick = getQuickNetworkStatus();
    if (initialQuick.level !== 'good') {
      probeNetworkQuality('general');
    }

    return () => {
      window.removeEventListener(NETWORK_ALERT_EVENT, handleAlertEvent);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      conn?.removeEventListener?.('change', handleConnectionChange);
    };
  }, [dismissedAt]);

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
        <div className="space-y-0.5 min-w-0">
          <div className="text-xs sm:text-sm font-bold leading-snug font-kufi">
            {isOffline ? 'لا يوجد اتصال بالإنترنت' : 'تنبيه: شبكة الإنترنت ضعيفة'}
          </div>
          <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed font-sans">
            {alert.message}
            {alert.speedMbps !== undefined && alert.speedMbps > 0 && (
              <span className="inline-block mr-1 font-mono font-bold dir-ltr">
                ({alert.speedMbps.toFixed(2)} Mbps)
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setDismissedAt(Date.now());
          setAlert(null);
        }}
        aria-label="إغلاق إشعار الشبكة"
        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
