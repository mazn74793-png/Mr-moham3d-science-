import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, Eye, Video, Sparkles } from 'lucide-react';
import { Lecture, UserProfile } from '../types';

interface SecureVideoPlayerProps {
  lecture: Lecture;
  currentUser: UserProfile | null;
  isWatched: boolean;
  onMarkWatched: (lectureId: string) => void;
  onTakeQuiz?: (quizId?: string) => void;
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  lecture,
  currentUser,
  isWatched,
  onMarkWatched,
  onTakeQuiz,
}) => {
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic moving watermark coordinates (updates every 5 seconds to drift smoothly across video)
  const [watermarkPos, setWatermarkPos] = useState<{ top: number; left: number }>({
    top: 25,
    left: 20,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate random positions staying within bounds (top: 15% to 75%, left: 10% to 70%)
      const nextTop = Math.floor(Math.random() * 60) + 15;
      const nextLeft = Math.floor(Math.random() * 60) + 10;
      setWatermarkPos({ top: nextTop, left: nextLeft });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Prevent right-click and keyboard capture attempts
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showNotice('🚫 تم تعطيل النقر الأيمن لحماية حقوق الفيديو.');
    return false;
  };

  const showNotice = (msg: string) => {
    setSecurityNotice(msg);
    setTimeout(() => {
      setSecurityNotice(null);
    }, 3500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Keycode 44 = PrintScreen, F12 = DevTools, Ctrl+Shift+I, Ctrl+U
      if (
        e.key === 'PrintScreen' ||
        e.keyCode === 44 ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        showNotice('🛡️ تنبيه أمني: تسجيل الشاشة أو تصوير المحتوى غير مصرح به.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract clean embed URL
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

  // Watermark text
  const studentDisplayName = currentUser?.name || 'طالب منصة القيصر';
  const studentDisplayPhone = currentUser?.phone || '010XXXXXXXX';
  const studentDisplayCode = currentUser?.id ? `ID: ${currentUser.id.slice(-6)}` : 'ID: 2026-CHEM';

  return (
    <div className="space-y-4">
      {/* Outer secure video canvas */}
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className="relative rounded-3xl overflow-hidden aspect-video bg-slate-950 shadow-2xl border-2 border-slate-800 select-none group"
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {/* Actual Video Iframe / Stream */}
        <iframe
          src={getEmbedUrl(lecture.videoUrl)}
          title={lecture.title}
          className="w-full h-full relative z-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Dynamic Animated Semi-Transparent Watermark Overlay */}
        <div
          className="absolute z-20 pointer-events-none select-none transition-all duration-1000 ease-in-out"
          style={{
            top: `${watermarkPos.top}%`,
            left: `${watermarkPos.left}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/40 backdrop-blur-[2px] border border-white/20 text-white/60 shadow-lg text-center font-mono">
            <div className="text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 text-amber-300/80">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{studentDisplayName}</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-teal-200/80 tracking-wider font-mono dir-ltr">
              {studentDisplayPhone} · {studentDisplayCode}
            </div>
          </div>
        </div>

        {/* Security protection watermark stamp in lower right corner */}
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none select-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] text-slate-400 font-mono">
          <Lock className="w-3 h-3 text-teal-400" />
          <span>حماية القيصر المشفرة · قيصر الكيمياء 2026</span>
        </div>

        {/* Transparent Click Guard Overlay to prevent browser context inspection */}
        <div 
          onContextMenu={handleContextMenu}
          className="absolute inset-0 pointer-events-none z-10" 
        />

        {/* Temporary Security Alert Banner */}
        {securityNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-red-600/90 text-white text-xs sm:text-sm font-bold shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{securityNotice}</span>
          </div>
        )}
      </div>

      {/* Video Progress & Sequential Prerequisite Completion Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-slate-50 dark:from-teal-950/40 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-kufi px-2.5 py-0.5 rounded-full bg-teal-600 text-white">
              الحصة {lecture.sessionOrder || 1}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-kufi">
              متابعة حضور وإنهاء الحصة
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
            {isWatched 
              ? 'أحسنت! تم تسجيل حضورك ومشاهدتك لهذه المحاضرة بنجاح.'
              : 'اضغط على زر التأكيد بعد إنهاء الشاهدة لتتمكن من خوض الكويز وفتح الحصة التالية.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mark as Watched button */}
          <button
            onClick={() => onMarkWatched(lecture.id)}
            disabled={isWatched}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isWatched
                ? 'bg-emerald-600 text-white cursor-default shadow-xs'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isWatched ? 'تمت المشاهدة والحضور بنجاح' : 'أتممت مشاهدة الحصة بالكامل ✅'}</span>
          </button>

          {/* Jump to Quiz button */}
          {lecture.quizId && (
            <button
              onClick={() => onTakeQuiz?.(lecture.quizId)}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-amber-900 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>حل كويز الحصة لفتح التالي</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
