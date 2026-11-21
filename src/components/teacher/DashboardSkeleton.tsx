import React from 'react';
import type { TeacherDashboardTab } from '../TeacherDashboard';

export const StudentListSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
      aria-busy="true"
      aria-label="جاري تحميل قائمة الطلاب"
    >
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 grid grid-cols-6 sm:grid-cols-9 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse"
          />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="px-4 py-3.5 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1 max-w-[220px]">
                <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
              </div>
            </div>
            <div className="hidden sm:block h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="hidden md:block h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="hidden lg:block h-2.5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-14 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="h-7 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeacherTabSkeleton: React.FC<{ tab?: TeacherDashboardTab }> = ({ tab = 'overview' }) => {
  if (tab === 'all-students') {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-14 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between animate-pulse"
            >
              <div className="space-y-2 flex-1">
                <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800/70" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            </div>
          ))}
        </div>
        <div className="h-44 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
            ))}
          </div>
        </div>
        <StudentListSkeleton rows={7} />
      </div>
    );
  }

  if (tab === 'overview') {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-36 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between gap-4 animate-pulse">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-36 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-64 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-80 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
          <div className="hidden sm:flex gap-2">
            <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-2.5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-7 w-14 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3 animate-pulse"
            >
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-busy="true">
      <div className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2.5 flex-1">
          <div className="h-3.5 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-60 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-80 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/70" />
            <div className="flex items-center gap-2 pt-2">
              <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-20 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardLayoutSkeleton: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-[#fafffb] dark:bg-slate-950 w-full max-w-full overflow-x-hidden"
      aria-busy="true"
      aria-label="جاري تجهيز لوحة التحكم"
    >
      {/* Top Header Skeleton */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800" />
          <div className="h-5 w-48 rounded bg-slate-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-800" />
          <div className="h-9 w-24 rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Body Grid Skeleton: Sidebar + Main */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        <aside className="hidden lg:block w-72 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 animate-pulse">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-32 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <TeacherTabSkeleton tab="overview" />
        </main>
      </div>
    </div>
  );
};
