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
  PictureInPicture2,
  Gauge,
} from 'lucide-react';
import { Lecture, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  optimizeVideoStreamUrl,
  isCloudinaryVideoUrl,
  getVideoPosterUrl,
  prefetchVideoStream,
  parseDurationStringToSeconds,
  VideoQualityMode,
} from '../utils/mediaOptimizer';

interface SecureVideoPlayerProps {
  lecture: Lecture;
  currentUser: UserProfile | null;
  isWatched: boolean;
  onMarkWatched: (lectureId: string) => void;
  onTakeQuiz?: (quizId?: string) => void;
  onRegisterTimeGetter?: (getter: () => number) => void;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

const QUALITY_OPTIONS: Array<{
  id: VideoQualityMode;
  labelAr: string;
  labelEn: string;
  shortLabelAr: string;
  shortLabelEn: string;
}> = [
  { id: 'fast', labelAr: 'أصلي سريع', labelEn: 'Fast Original', shortLabelAr: 'سريع', shortLabelEn: 'Fast' },
  { id: 'eco', labelAr: 'توفير البيانات', labelEn: 'Data Saver', shortLabelAr: 'توفير', shortLabelEn: 'Eco' },
  { id: 'hd', labelAr: 'جودة عالية HD', labelEn: 'High Quality HD', shortLabelAr: 'HD', shortLabelEn: 'HD' },
];

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

/**
 * Resolves full accurate video duration even when streams report Infinity, NaN,
 * or update duration lazily after initial metadata.
 */
function resolveElementDuration(vid: HTMLVideoElement): number {
  const raw = vid.duration;
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  try {
    if (vid.seekable && vid.seekable.length > 0) {
      const end = vid.seekable.end(vid.seekable.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
  } catch {
    // ignore seekable read errors
  }
  return 0;
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  lecture,
  currentUser,
  isWatched,
  onMarkWatched,
  onTakeQuiz,
  onRegisterTimeGetter,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const lastSavedPosRef = useRef<number>(0);
  const restoredForLectureRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastSeekCommitRef = useRef<number>(0);

  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fallbackToRaw, setFallbackToRaw] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoQuality, setVideoQuality] = useState<VideoQualityMode>(() => {
    const saved = localStorage.getItem('mm_video_quality') as VideoQualityMode | null;
    return saved === 'eco' || saved === 'hd' ? saved : 'fast';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Smooth drag-scrub & hover preview state
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ pct: number; time: number } | null>(null);

  const canOptimizeCloudinary = isCloudinaryVideoUrl(lecture.videoUrl);
  const resolvedVideoSrc =
    fallbackToRaw || !canOptimizeCloudinary
      ? lecture.videoUrl
      : optimizeVideoStreamUrl(lecture.videoUrl, videoQuality);
  const posterUrl = getVideoPosterUrl(lecture.videoUrl, lecture.thumbnailUrl);
  const expectedLectureSeconds = parseDurationStringToSeconds(lecture.duration);

  useEffect(() => {
    onRegisterTimeGetter?.(() => videoRef.current?.currentTime || 0);
  }, [onRegisterTimeGetter, lecture.id]);

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

  // Reset player state when switching lectures & pre-warm the stream
  useEffect(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setHasError(false);
    setFallbackToRaw(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedPercent(0);
    setShowControls(true);
    setIsDragging(false);
    setDragTime(null);
    setHoverInfo(null);
    isDraggingRef.current = false;
    restoredForLectureRef.current = null;
    lastSavedPosRef.current = 0;

    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
    prefetchVideoStream(lecture.videoUrl, videoQuality);
  }, [lecture.id, lecture.videoUrl, videoQuality]);

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

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (isDraggingRef.current) return;
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

  const syncDurationFromVideo = useCallback(
    (v: HTMLVideoElement) => {
      const resolved = resolveElementDuration(v);
      if (resolved <= 0) return;

      // Guard against transformed streams that truncate large videos to ~1s
      if (
        !fallbackToRaw &&
        canOptimizeCloudinary &&
        resolvedVideoSrc !== lecture.videoUrl &&
        resolved < 3 &&
        expectedLectureSeconds > 10
      ) {
        setFallbackToRaw(true);
        return;
      }

      setDuration((prev) => (Math.abs(prev - resolved) > 0.25 ? resolved : prev));
    },
    [fallbackToRaw, canOptimizeCloudinary, resolvedVideoSrc, lecture.videoUrl, expectedLectureSeconds]
  );

  // Determine whether video is direct stream or iframe embed
  const isDirectVideo = Boolean(
    lecture.videoUrl &&
      (lecture.videoUrl.includes('cloudinary.com') ||
        lecture.videoUrl.includes('/uploads/') ||
        lecture.videoUrl.match(/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i) ||
        lecture.videoUrl.startsWith('blob:') ||
        lecture.videoUrl.startsWith('data:video'))
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
    showNotice(
      isEn
        ? 'Context menu disabled to protect lecture content.'
        : 'تم تعطيل قائمة الخيارات لحماية محتوى المحاضرة.'
    );
    return false;
  };

  const togglePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    setShowControls(true);
    if (vid.paused) {
      vid.play().catch(() => {
        showNotice(isEn ? 'Tap again to start playback.' : 'اضغط مرة أخرى لبدء تشغيل الفيديو.');
      });
      scheduleHideControls();
    } else {
      vid.pause();
    }
  }, [isEn, scheduleHideControls, showNotice]);

  const skipSeconds = useCallback(
    (delta: number) => {
      const vid = videoRef.current;
      if (!vid) return;
      const totalDur = resolveElementDuration(vid) || duration;
      const maxTime = totalDur > 0 ? totalDur : Infinity;
      const next = Math.min(maxTime, Math.max(0, vid.currentTime + delta));
      vid.currentTime = next;
      setCurrentTime(next);
      setShowControls(true);
      scheduleHideControls();
    },
    [duration, scheduleHideControls]
  );

  const effectiveDuration = duration > 0 ? duration : Math.max(currentTime, 0);

  const computeScrubFromClientX = useCallback(
    (clientX: number) => {
      const track = scrubTrackRef.current;
      if (!track || effectiveDuration <= 0) {
        return { pct: 0, time: 0 };
      }
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
      return {
        pct: ratio * 100,
        time: ratio * effectiveDuration,
      };
    },
    [effectiveDuration]
  );

  const handleScrubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (effectiveDuration <= 0) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if synthetic event
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }

    const { time } = computeScrubFromClientX(e.clientX);
    setDragTime(time);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      lastSeekCommitRef.current = performance.now();
    }
  };

  const handleScrubPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (effectiveDuration <= 0) return;
    const { pct, time } = computeScrubFromClientX(e.clientX);
    setHoverInfo({ pct, time });

    if (!isDraggingRef.current) return;
    e.stopPropagation();
    setDragTime(time);
    setCurrentTime(time);

    const now = performance.now();
    if (videoRef.current && now - lastSeekCommitRef.current >= 65) {
      videoRef.current.currentTime = time;
      lastSeekCommitRef.current = now;
    }
  };

  const finalizeScrubDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const { time } = computeScrubFromClientX(e.clientX);
    const finalTime = dragTime !== null ? time : currentTime;
    if (videoRef.current && effectiveDuration > 0) {
      videoRef.current.currentTime = finalTime;
    }
    setCurrentTime(finalTime);
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragTime(null);
    scheduleHideControls();
  };

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const cyclePlaybackSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const nextSpeed = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    scheduleHideControls();
  };

  const cycleVideoQuality = () => {
    if (!canOptimizeCloudinary) return;
    const vid = videoRef.current;
    const resumeTime = vid?.currentTime || 0;
    const wasPlaying = vid ? !vid.paused : false;
    const idx = QUALITY_OPTIONS.findIndex((q) => q.id === videoQuality);
    const nextQuality = QUALITY_OPTIONS[(idx + 1) % QUALITY_OPTIONS.length].id;

    try {
      sessionStorage.setItem(`mm_vid_pos_${lecture.id}`, String(Math.floor(resumeTime)));
      localStorage.setItem('mm_video_quality', nextQuality);
    } catch {}

    setFallbackToRaw(false);
    setVideoQuality(nextQuality);
    restoredForLectureRef.current = null;
    if (wasPlaying) {
      window.setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, 150);
    }
  };

  const togglePictureInPicture = async () => {
    const vid = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<any> }) | null;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (vid.requestPictureInPicture) {
        await vid.requestPictureInPicture();
      }
    } catch {
      // ignore unsupported PiP gesture restrictions
    }
  };

  const toggleFullscreen = useCallback(async () => {
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
  }, []);

  // Combined protection & convenient playback keyboard shortcuts
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
        showNotice(
          isEn
            ? 'Screen capture or saving lecture content is not permitted.'
            : 'تصوير أو حفظ محتوى المحاضرة غير مصرح به.'
        );
        return;
      }

      if (!isDirectVideo) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirectVideo, isEn, showNotice, skipSeconds, toggleFullscreen, toggleMute, togglePlayPause]);

  const handleSurfaceTap = () => {
    if (!isDirectVideo || isDraggingRef.current) return;
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

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;
  const progressPct =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100)) : 0;
  const matchedQuality = QUALITY_OPTIONS.find((q) => q.id === videoQuality);
  const currentQualityLabel = isEn
    ? matchedQuality?.shortLabelEn || 'Fast'
    : matchedQuality?.shortLabelAr || 'سريع';
  const supportsPiP =
    typeof document !== 'undefined' && Boolean((document as any).pictureInPictureEnabled);

  const studentDisplayName = currentUser?.name || (isEn ? 'Platform Student' : 'طالب المنصة');
  const studentDisplayPhone = currentUser?.phone || '';
  const studentDisplayCode = currentUser?.id ? currentUser.id.slice(-6) : '2026';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Theater Video Container */}
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
              key={resolvedVideoSrc}
              src={resolvedVideoSrc}
              poster={posterUrl}
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onClick={handleSurfaceTap}
              onPlay={() => {
                setIsPlaying(true);
                setIsBuffering(false);
                scheduleHideControls();
              }}
              onPause={(e) => {
                setIsPlaying(false);
                setShowControls(true);
                const t = Math.floor(e.currentTarget.currentTime || 0);
                try {
                  if (t > 4) sessionStorage.setItem(`mm_vid_pos_${lecture.id}`, String(t));
                } catch {}
              }}
              onWaiting={() => setIsBuffering(true)}
              onCanPlay={(e) => {
                setIsBuffering(false);
                syncDurationFromVideo(e.currentTarget);
              }}
              onLoadedData={(e) => syncDurationFromVideo(e.currentTarget)}
              onDurationChange={(e) => syncDurationFromVideo(e.currentTarget)}
              onProgress={(e) => syncDurationFromVideo(e.currentTarget)}
              onSeeked={(e) => syncDurationFromVideo(e.currentTarget)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                syncDurationFromVideo(v);
                const dur = resolveElementDuration(v);
                v.playbackRate = playbackRate;

                if (restoredForLectureRef.current !== lecture.id) {
                  restoredForLectureRef.current = lecture.id;
                  try {
                    const savedPos = Number(sessionStorage.getItem(`mm_vid_pos_${lecture.id}`) || '0');
                    if (savedPos > 5 && (!dur || savedPos < dur - 5)) {
                      v.currentTime = savedPos;
                      setCurrentTime(savedPos);
                    }
                  } catch {}
                }
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                syncDurationFromVideo(v);
                const dur = resolveElementDuration(v) || duration;
                const nowSec = v.currentTime || 0;

                // Never let playback updates overwrite user's active scrub drag
                if (!isDraggingRef.current) {
                  setCurrentTime(nowSec);
                }

                if (v.buffered.length > 0 && dur > 0) {
                  const end = v.buffered.end(v.buffered.length - 1);
                  setBufferedPercent(Math.min(100, (end / dur) * 100));
                }
                if (!isDraggingRef.current && Math.abs(nowSec - lastSavedPosRef.current) >= 4) {
                  lastSavedPosRef.current = nowSec;
                  try {
                    if (nowSec > 5) {
                      sessionStorage.setItem(`mm_vid_pos_${lecture.id}`, String(Math.floor(nowSec)));
                    }
                  } catch {}
                }
              }}
              onError={() => {
                if (!fallbackToRaw && canOptimizeCloudinary && resolvedVideoSrc !== lecture.videoUrl) {
                  setFallbackToRaw(true);
                  setHasError(false);
                  return;
                }
                setIsBuffering(false);
                setHasError(true);
              }}
              onEnded={() => {
                setIsPlaying(false);
                setShowControls(true);
                try {
                  sessionStorage.removeItem(`mm_vid_pos_${lecture.id}`);
                } catch {}
                onMarkWatched(lecture.id);
              }}
              className="w-full h-full object-contain bg-black relative z-0 cursor-pointer"
            />

            {/* Error State */}
            {hasError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center space-y-3">
                <AlertTriangle className="w-9 h-9 text-amber-400" />
                <p className="text-sm font-bold text-white">
                  {isEn ? 'Unable to load video right now' : 'تعذر تحميل الفيديو حالياً'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  {isEn
                    ? 'Please retry loading the session stream.'
                    : 'يرجى المحاولة مرة أخرى لتشغيل المحاضرة.'}
                </p>
                <button
                  type="button"
                  onClick={handleRetryVideo}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isEn ? 'Retry Video' : 'إعادة تحميل الفيديو'}</span>
                </button>
              </div>
            )}

            {/* Buffering Spinner */}
            {isBuffering && !hasError && !isDragging && (
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
                  showControls || !isPlaying || isDragging
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Top Scrim Bar */}
                <div
                  onClick={handleSurfaceTap}
                  className="bg-gradient-to-b from-black/75 via-black/30 to-transparent px-3 sm:px-4 pt-2.5 sm:pt-3 pb-6 flex items-center justify-between gap-2"
                >
                  <div className={`min-w-0 ${isEn ? 'text-left' : 'text-right'}`}>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {lecture.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/75 font-mono shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span className="hidden xs:inline">
                      {isEn ? 'Protected Stream' : 'بث سريع محمي'}
                    </span>
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
                    aria-label={isEn ? 'Rewind 10 seconds' : 'ترجيع 10 ثوانٍ'}
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
                    aria-label={isPlaying ? (isEn ? 'Pause' : 'إيقاف مؤقت') : isEn ? 'Play video' : 'تشغيل الفيديو'}
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
                    aria-label={isEn ? 'Forward 10 seconds' : 'تقديم 10 ثوانٍ'}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/75 text-white flex flex-col items-center justify-center backdrop-blur-xs transition-transform active:scale-90 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] font-mono tabular-nums leading-none mt-0.5">10</span>
                  </button>
                </div>

                {/* Bottom Scrim Bar: Interactive Pointer-Capture Scrub Track + Controls */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 sm:px-4 pt-6 pb-2.5 sm:pb-3 space-y-1.5"
                >
                  {/* Custom Smooth Drag Scrub Track (LTR locked so left=start, right=end) */}
                  <div
                    ref={scrubTrackRef}
                    dir="ltr"
                    role="slider"
                    tabIndex={0}
                    aria-label={isEn ? 'Video scrub bar' : 'شريط تقديم وترجيع الفيديو'}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(effectiveDuration)}
                    aria-valuenow={Math.round(displayTime)}
                    onPointerDown={handleScrubPointerDown}
                    onPointerMove={handleScrubPointerMove}
                    onPointerUp={finalizeScrubDrag}
                    onPointerCancel={finalizeScrubDrag}
                    onPointerLeave={() => {
                      if (!isDraggingRef.current) setHoverInfo(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        skipSeconds(5);
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        skipSeconds(-5);
                      }
                    }}
                    className="relative h-8 flex items-center cursor-pointer touch-none select-none group/scrub focus:outline-none"
                  >
                    {/* Live Floating Timestamp Preview Tooltip during Drag or Hover */}
                    {(isDragging || hoverInfo) && effectiveDuration > 0 && (
                      <div
                        className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900/95 border border-white/15 text-white text-[11px] font-mono tabular-nums font-bold shadow-lg pointer-events-none whitespace-nowrap"
                        style={{
                          left: `${Math.min(
                            94,
                            Math.max(6, isDragging ? progressPct : hoverInfo?.pct ?? progressPct)
                          )}%`,
                        }}
                      >
                        {formatTime(isDragging ? displayTime : hoverInfo?.time ?? displayTime)}
                      </div>
                    )}

                    {/* Track Bar */}
                    <div
                      className={`w-full rounded-full overflow-hidden relative transition-all ${
                        isDragging ? 'h-2.5 bg-white/30' : 'h-1.5 group-hover/scrub:h-2 bg-white/25'
                      }`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-white/35 rounded-full"
                        style={{ width: `${bufferedPercent}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-teal-400 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Draggable Thumb */}
                    <div
                      className={`absolute rounded-full bg-teal-400 ring-2 ring-white shadow-md pointer-events-none -translate-x-1/2 transition-transform ${
                        isDragging
                          ? 'w-5 h-5 scale-110'
                          : 'w-3.5 h-3.5 group-hover/scrub:w-4 group-hover/scrub:h-4'
                      }`}
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>

                  {/* Action Controls Row */}
                  <div className="flex items-center justify-between gap-2" dir="ltr">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        aria-label={isPlaying ? (isEn ? 'Pause' : 'إيقاف') : isEn ? 'Play' : 'تشغيل'}
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
                        aria-label={isMuted ? (isEn ? 'Unmute' : 'تشغيل الصوت') : isEn ? 'Mute' : 'كتم الصوت'}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      <span className="text-[11px] sm:text-xs font-mono tabular-nums text-white/95 px-1">
                        {formatTime(displayTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {canOptimizeCloudinary && (
                        <button
                          type="button"
                          onClick={cycleVideoQuality}
                          aria-label={isEn ? 'Switch stream quality' : 'تغيير جودة البث'}
                          title={
                            isEn
                              ? 'Switch stream quality (Fast / Eco / HD)'
                              : 'تبديل جودة الفيديو (سريع / توفير / HD)'
                          }
                          className="min-h-[36px] px-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Gauge className="w-3.5 h-3.5 text-teal-300" />
                          <span>{currentQualityLabel}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={cyclePlaybackSpeed}
                        aria-label={isEn ? 'Playback speed' : 'تغيير سرعة التشغيل'}
                        className="min-h-[36px] px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-mono tabular-nums font-bold transition-colors cursor-pointer"
                      >
                        {playbackRate}x
                      </button>

                      {supportsPiP && (
                        <button
                          type="button"
                          onClick={togglePictureInPicture}
                          aria-label={isEn ? 'Floating window' : 'نافذة عائمة'}
                          title={isEn ? 'Picture in Picture' : 'تشغيل في نافذة مصغرة'}
                          className="hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
                        >
                          <PictureInPicture2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={
                          isFullscreen
                            ? isEn
                              ? 'Exit fullscreen'
                              : 'إنهاء ملء الشاشة'
                            : isEn
                            ? 'Fullscreen'
                            : 'ملء الشاشة'
                        }
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

        {/* Minimal Non-Intrusive Drifting Watermark */}
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
            ? isEn
              ? 'Session attendance recorded — you can continue to the next lecture.'
              : 'تم تسجيل حضورك في هذه الحصة ويمكنك المتابعة للحصة التالية.'
            : isEn
            ? 'Finish watching and confirm completion to unlock the quiz and next session.'
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
              {isWatched
                ? isEn
                  ? 'Attendance Recorded'
                  : 'تم تسجيل الحضور'
                : isEn
                ? 'Mark Session Complete'
                : 'تأكيد إتمام الحصة'}
            </span>
          </button>

          {lecture.quizId && (
            <button
              type="button"
              onClick={() => onTakeQuiz?.(lecture.quizId)}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                {isEn ? 'Take Session Quiz' : 'حل كويز الحصة'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
