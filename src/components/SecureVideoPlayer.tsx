import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Award,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Lecture, UserProfile } from '../types';

interface SecureVideoPlayerProps {
  lecture: Lecture;
  currentUser: UserProfile | null;
  isWatched: boolean;
  onMarkWatched: (lectureId: string) => void;
  onTakeQuiz?: (quizId?: string) => void;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  lecture,
  currentUser,
  isWatched,
  onMarkWatched,
  onTakeQuiz,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Subtle drifting watermark coordinates
  const [watermarkPos, setWatermarkPos] = useState<{ top: number; left: number }>({
    top: 22,
    left: 24,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextTop = Math.floor(Math.random() * 56) + 18;
      const nextLeft = Math.floor(Math.random() * 54) + 16;
      setWatermarkPos({ top: nextTop, left: nextLeft });
    }, 6000);
    return () => window.clearInterval(interval);
  }, []);

  // Reset player state when switching lectures
  useEffect(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedPercent(0);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [lecture.id, lecture.videoUrl]);

  // Listen for native fullscreen exit (Esc key / swipe down)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const showNotice = useCallback((msg: string) => {
    setSecurityNotice(msg);
    window.setTimeout(() => setSecurityNotice(null), 3200);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        e.keyCode === 44 ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        showNotice('تصوير أو حفظ محتوى المحاضرة غير مصرح به.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotice]);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  // Determine whether video is direct stream (Cloudinary / server uploads / mp4 / webm / mkv) or iframe embed
  const isDirectVideo = Boolean(
    lecture.videoUrl && (
      lecture.videoUrl.includes('cloudinary.com') ||
      lecture.videoUrl.includes('/uploads/') ||
      lecture.videoUrl.match(/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i) ||
      lecture.videoUrl.startsWith('blob:') ||
      lecture.videoUrl.startsWith('data:video')
    )
  );

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) {
      return url.includes('?') ? `${url}&rel=0&modestbranding=1` : `${url}?rel=0&modestbranding=1`;
    }
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${vidId}?rel=0&modestbranding=1`;
    }
    if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${vidId}?rel=0&modestbranding=1`;
    }
    return url;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showNotice('تم تعطيل قائمة الخيارات لحماية محتوى المحاضرة.');
    return false;
  };

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setShowControls(true);
    if (vid.paused) {
      vid.play().catch(() => {
        showNotice('اضغط مرة أخرى لبدء تشغيل الفيديو.');
      });
      scheduleHideControls();
    } else {
      vid.pause();
    }
  };

  const skipSeconds = (delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    const next = Math.min(vid.duration || Infinity, Math.max(0, vid.currentTime + delta));
    vid.currentTime = next;
    setCurrentTime(next);
    setShowControls(true);
    scheduleHideControls();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    const target = Number(e.target.value);
    if (!vid || Number.isNaN(target)) return;
    vid.currentTime = target;
    setCurrentTime(target);
    scheduleHideControls();
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
    scheduleHideControls();
  };

  const cyclePlaybackSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const nextSpeed = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    scheduleHideControls();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const vid = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
      return;
    }

    if (container?.requestFullscreen) {
      try {
        await container.requestFullscreen();
        return;
      } catch {
        // iOS Safari fallback below
      }
    }

    if (vid?.webkitEnterFullscreen) {
      try {
        vid.webkitEnterFullscreen();
      } catch {
        // ignore
      }
    }
  };

  const handleSurfaceTap = () => {
    if (!isDirectVideo) return;
    if (!showControls) {
      setShowControls(true);
      scheduleHideControls();
    } else if (isPlaying) {
      setShowControls(false);
    } else {
      togglePlayPause();
    }
  };

  const handleRetryVideo = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setHasError(false);
    setIsBuffering(true);
    vid.load();
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const studentDisplayName = currentUser?.name || 'طالب المنصة';
  const studentDisplayPhone = currentUser?.phone || '';
  const studentDisplayCode = currentUser?.id ? currentUser.id.slice(-6) : '2026';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Theater Video Container - Edge-to-edge on mobile, crisp framed stage on desktop */}
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onMouseMove={() => {
          if (isDirectVideo) {
            setShowControls(true);
            if (isPlaying) scheduleHideControls();
          }
        }}
        className="relative -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden aspect-video bg-slate-950 shadow-lg select-none group"
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {isDirectVideo ? (
          <>
            <video
              ref={videoRef}
              key={lecture.videoUrl}
              src={lecture.videoUrl}
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onClick={handleSurfaceTap}
              onPlay={() => {
                setIsPlaying(true);
                setIsBuffering(false);
                scheduleHideControls();
              }}
              onPause={() => {
                setIsPlaying(false);
                setShowControls(true);
              }}
              onWaiting={() => setIsBuffering(true)}
              onCanPlay={() => setIsBuffering(false)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setDuration(v.duration || 0);
                v.playbackRate = playbackRate;
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setCurrentTime(v.currentTime || 0);
                if (v.buffered.length > 0 && v.duration > 0) {
                  const end = v.buffered.end(v.buffered.length - 1);
                  setBufferedPercent(Math.min(100, (end / v.duration) * 100));
                }
              }}
              onError={() => {
                setIsBuffering(false);
                setHasError(true);
              }}
              onEnded={() => {
                setIsPlaying(false);
                setShowControls(true);
                onMarkWatched(lecture.id);
              }}
              className="w-full h-full object-contain bg-black relative z-0 cursor-pointer"
            />

            {/* Error State */}
            {hasError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center space-y-3">
                <AlertTriangle className="w-9 h-9 text-amber-400" />
                <p className="text-sm font-bold text-white">تعذر تحميل الفيديو حالياً</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  تأكد من استقرار اتصال الإنترنت أو أعد المحاولة.
                </p>
                <button
                  type="button"
                  onClick={handleRetryVideo}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة تحميل الفيديو</span>
                </button>
              </div>
            )}

            {/* Buffering Spinner */}
            {isBuffering && !hasError && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-950/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                </div>
              </div>
            )}

            {/* Custom Modern Controls Overlay */}
            {!hasError && (
              <div
                className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-200 ${
                  showControls || !isPlaying
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Top Scrim Bar: Lecture title & subtle security badge */}
                <div
                  onClick={handleSurfaceTap}
                  className="bg-gradient-to-b from-black/75 via-black/30 to-transparent px-3 sm:px-4 pt-2.5 sm:pt-3 pb-6 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 text-right">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {lecture.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/75 font-mono shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span className="hidden xs:inline">بث محمي</span>
                  </div>
                </div>

                {/* Center Transport Controls (-10s | Play/Pause | +10s) */}
                <div
                  onClick={(e) => {
                    if (e.target === e.currentTarget) handleSurfaceTap();
                  }}
                  className="flex items-center justify-center gap-5 sm:gap-8"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      skipSeconds(-10);
                    }}
                    aria-label="ترجيع 10 ثوانٍ"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/75 text-white flex flex-col items-center justify-center backdrop-blur-xs transition-transform active:scale-90 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] font-mono tabular-nums leading-none mt-0.5">10</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الفيديو'}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      skipSeconds(10);
                    }}
                    aria-label="تقديم 10 ثوانٍ"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/75 text-white flex flex-col items-center justify-center backdrop-blur-xs transition-transform active:scale-90 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] font-mono tabular-nums leading-none mt-0.5">10</span>
                  </button>
                </div>

                {/* Bottom Scrim Bar: Scrub Track + Time + Speed + Mute + Fullscreen */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 sm:px-4 pt-6 pb-2.5 sm:pb-3 space-y-1.5"
                >
                  {/* Interactive Scrub Track (LTR locked so left=start, right=end) */}
                  <div className="relative h-6 flex items-center" dir="ltr">
                    <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-white/35 rounded-full"
                        style={{ width: `${bufferedPercent}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-teal-400 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-teal-400 shadow-md pointer-events-none -translate-x-1/2"
                      style={{ left: `${progressPct}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.5}
                      value={currentTime}
                      onChange={handleSeek}
                      aria-label="شريط تقديم الفيديو"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Action Controls Row */}
                  <div className="flex items-center justify-between gap-2" dir="ltr">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        aria-label={isPlaying ? 'إيقاف' : 'تشغيل'}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      <span className="text-[11px] sm:text-xs font-mono tabular-nums text-white/90 px-1">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        type="button"
                        onClick={cyclePlaybackSpeed}
                        aria-label="تغيير سرعة التشغيل"
                        className="min-h-[36px] px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-mono tabular-nums font-bold transition-colors cursor-pointer"
                      >
                        {playbackRate}x
                      </button>

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
                      >
                        {isFullscreen ? (
                          <Minimize className="w-4 h-4" />
                        ) : (
                          <Maximize className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <iframe
            src={getEmbedUrl(lecture.videoUrl)}
            title={lecture.title}
            className="w-full h-full relative z-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {/* Minimal Non-Intrusive Drifting Watermark (unboxed, clean legibility protection) */}
        <div
          className="absolute z-10 pointer-events-none select-none transition-all duration-1000 ease-in-out text-center font-mono"
          style={{
            top: `${watermarkPos.top}%`,
            left: `${watermarkPos.left}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="text-[10px] sm:text-xs font-bold text-white/30 drop-shadow">
            {studentDisplayName}
          </div>
          <div className="text-[9px] text-white/25 tabular-nums dir-ltr">
            {studentDisplayPhone ? `${studentDisplayPhone} · ` : ''}#{studentDisplayCode}
          </div>
        </div>

        {/* Security Alert Banner */}
        {securityNotice && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-xl bg-rose-600/95 text-white text-xs font-bold shadow-lg flex items-center gap-2 whitespace-nowrap">
            <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            <span>{securityNotice}</span>
          </div>
        )}
      </div>

      {/* Compact Completion & Next Step Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {isWatched
            ? 'تم تسجيل حضورك في هذه الحصة ويمكنك المتابعة للحصة التالية.'
            : 'أكمل مشاهدة الحصة واضغط تأكيد الحضور لفتح الكويز والحصة التالية.'}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onMarkWatched(lecture.id)}
            disabled={isWatched}
            className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              isWatched
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">
              {isWatched ? 'تم تسجيل الحضور' : 'تأكيد إتمام الحصة'}
            </span>
          </button>

          {lecture.quizId && (
            <button
              type="button"
              onClick={() => onTakeQuiz?.(lecture.quizId)}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">حل كويز الحصة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
