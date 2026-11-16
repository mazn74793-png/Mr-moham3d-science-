import React, { useState } from 'react';
import {
  Bell,
  Pin,
  Sparkles,
  Megaphone,
  Award,
  Video,
  Flame,
  Trophy,
  CheckCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import {
  PlatformNotification,
  NotificationCategory,
  NotificationCtaTab,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface NotificationsTabProps {
  notifications: PlatformNotification[];
  readNotificationIds: string[];
  gradeTitle: string;
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onNavigateTab: (tab: NotificationCtaTab) => void;
}

const CATEGORY_STYLE: Record<
  NotificationCategory,
  {
    labelEn: string;
    labelAr: string;
    badgeCls: string;
    accentBorder: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  announcement: {
    labelEn: 'Announcement',
    labelAr: 'إعلان المنصة',
    badgeCls:
      'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    accentBorder: 'border-s-4 border-s-teal-500',
    icon: Megaphone,
  },
  lecture: {
    labelEn: 'New Lecture',
    labelAr: 'محاضرة جديدة',
    badgeCls:
      'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    accentBorder: 'border-s-4 border-s-sky-500',
    icon: Video,
  },
  exam: {
    labelEn: 'Exam Alert',
    labelAr: 'تنبيه امتحان',
    badgeCls:
      'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    accentBorder: 'border-s-4 border-s-amber-500',
    icon: Award,
  },
  urgent: {
    labelEn: 'Important Notice',
    labelAr: 'تنويه هام',
    badgeCls:
      'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    accentBorder: 'border-s-4 border-s-rose-500',
    icon: Flame,
  },
  congrats: {
    labelEn: 'Inspiration & Honor',
    labelAr: 'كلمة تشجيع وتكريم',
    badgeCls:
      'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    accentBorder: 'border-s-4 border-s-emerald-500',
    icon: Trophy,
  },
};

export const StudentNotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  readNotificationIds,
  gradeTitle,
  onMarkAllRead,
  onMarkOneRead,
  onNavigateTab,
}) => {
  const { lang, isRtl } = useLanguage();
  const isEn = lang === 'en';
  const [filterCat, setFilterCat] = useState<'all' | NotificationCategory>('all');

  const unreadCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;
  const visibleItems =
    filterCat === 'all' ? notifications : notifications.filter((n) => n.category === filterCat);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6 animate-fade-in">
      {/* Header Editorial Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white border border-teal-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{gradeTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-kufi">
            {isEn
              ? 'Announcements & Educator Messages'
              : 'الإشعارات والتنبيهات الدراسية'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Important exam alerts, newly uploaded sessions, and inspiring study notes directly from your teacher.'
              : 'تابع أحدث التنبيهات التعليمية، مواعيد الامتحانات، والمحاضرات الجديدة مباشرة من معلمك أولاً بأول.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                {isEn
                  ? `Mark ${unreadCount} as read`
                  : `تحديد الكل كمقروء (${unreadCount})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Strip */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
              filterCat === 'all'
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isEn ? `All (${notifications.length})` : `الكل (${notifications.length})`}
          </button>
          {(Object.keys(CATEGORY_STYLE) as NotificationCategory[]).map((cat) => {
            const count = notifications.filter((n) => n.category === cat).length;
            if (count === 0) return null;
            const info = CATEGORY_STYLE[cat];
            const Icon = info.icon;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterCat === cat
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>
                  {isEn ? info.labelEn : info.labelAr} ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feed Cards */}
      {visibleItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'You are all caught up!' : 'لا توجد إشعارات جديدة حالياً'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isEn
              ? 'New announcements, exam dates, and encouraging updates from your educator will appear here as soon as they are published.'
              : 'عندما ينشر معلمك أي تنبيه جديد أو موعد امتحان أو رسالة تحفيزية ستجدها هنا فوراً.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => {
            const style = CATEGORY_STYLE[item.category] || CATEGORY_STYLE.announcement;
            const Icon = style.icon;
            const isUnread = !readNotificationIds.includes(item.id);
            return (
              <article
                key={item.id}
                onMouseEnter={() => {
                  if (isUnread) onMarkOneRead(item.id);
                }}
                onClick={() => {
                  if (isUnread) onMarkOneRead(item.id);
                }}
                className={`rounded-3xl p-5 sm:p-7 bg-white dark:bg-slate-900 border transition-all shadow-xs space-y-4 ${
                  style.accentBorder
                } ${
                  isUnread
                    ? 'border-teal-400/70 dark:border-teal-700 ring-1 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${style.badgeCls}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{isEn ? style.labelEn : style.labelAr}</span>
                    </span>

                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                        <Pin className="w-3 h-3" />
                        <span>{isEn ? 'Pinned' : 'مثبت'}</span>
                      </span>
                    )}

                    {isUnread && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-600 text-white text-[10px] font-bold">
                        {isEn ? 'New' : 'جديد'}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.dateAdded}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {item.message}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {isEn ? `From: ${item.authorName}` : `بقلم: ${item.authorName}`}
                  </span>

                  {item.ctaTab && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkOneRead(item.id);
                        onNavigateTab(item.ctaTab!);
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>
                        {item.ctaLabel?.trim() ||
                          (isEn ? 'Open Section' : 'الانتقال للقسم')}
                      </span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
