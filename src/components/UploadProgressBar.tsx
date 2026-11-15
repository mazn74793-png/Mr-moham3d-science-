import React from 'react';
import { RefreshCw } from 'lucide-react';
import { UploadProgressInfo } from '../utils/uploader';

interface UploadProgressBarProps {
  label: string;
  progress: number;
  meta?: UploadProgressInfo | null;
  fileName?: string;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  label,
  progress,
  meta,
  fileName,
}) => {
  const clamped = Math.min(100, Math.max(2, progress));

  return (
    <div className="space-y-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 shadow-xs text-right">
      <div className="flex items-center justify-between gap-2 text-xs font-bold font-mono">
        <span className="text-teal-700 dark:text-teal-300 flex items-center gap-1.5 truncate font-sans">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {meta?.speedMbps !== undefined && meta.speedMbps > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md dir-ltr bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {meta.speedMbps.toFixed(1)} Mbps
            </span>
          )}
          {meta && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {meta.loadedMB} / {meta.totalMB} MB
            </span>
          )}
          <span className="text-teal-600 dark:text-teal-400 font-extrabold">{progress}%</span>
        </div>
      </div>

      {fileName && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono dir-ltr text-left">
          {fileName}
        </div>
      )}

      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-teal-500 to-emerald-400"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
