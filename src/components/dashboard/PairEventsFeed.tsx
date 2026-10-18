import React from 'react';
import { Activity, Heart, CheckCircle2, Sparkles, Calendar, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface FeedItem {
  id?: string;
  author?: string;
  type?: string;
  title: string;
  subtitle?: string;
  timeAgo?: string;
}

interface UpcomingDate {
  status?: string;
  chosenDate?: string;
  chosenTime?: string;
  chosenLocation?: string;
  invitationNote?: string;
}

interface PairEventsFeedProps {
  isPaired: boolean;
  feedItems: FeedItem[];
  questionAnswer?: string | null;
  scheduleSummary: {
    badge: string;
    badgeClass: string;
    title: string;
    subtitle: string;
  };
  upcomingDate?: UpcomingDate;
  onOpenSchedule: () => void;
  onOpenDates: () => void;
}

export const PairEventsFeed: React.FC<PairEventsFeedProps> = ({
  isPaired,
  feedItems,
  questionAnswer,
  scheduleSummary,
  upcomingDate,
  onOpenSchedule,
  onOpenDates,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Feed / Recent Event */}
      <section className="space-y-2">
        <div className="p-4 sm:p-5 rounded-[28px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-[var(--text-2)]">
                {isPaired ? 'События пары сегодня' : 'События сегодня'}
              </h4>
            </div>
            <span className="text-[11px] text-[var(--text-3)] font-medium">
              {feedItems.length > 0 ? feedItems[0].timeAgo || 'Недавно' : 'Сегодня'}
            </span>
          </div>

          {feedItems.length > 0 ? (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--divider)]/40">
              <div className="w-8 h-8 rounded-xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 fill-[var(--accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--text)] leading-snug">{feedItems[0].title}</p>
                <p className="text-[11px] text-[var(--text-2)] mt-0.5 line-clamp-2">{feedItems[0].subtitle}</p>
              </div>
            </div>
          ) : questionAnswer ? (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--divider)]/40">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--text)] leading-snug">Ответ на вопрос дня сохранён</p>
                <p className="text-[11px] text-[var(--text-2)] mt-0.5 line-clamp-2 italic">«{questionAnswer}»</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[var(--surface-2)]/40 border border-[var(--divider)]/40 text-[var(--text-2)]">
              <Sparkles className="w-4 h-4 text-[var(--text-3)] shrink-0" />
              <span className="text-xs font-normal">Сегодня пока без общих событий</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Our Plans / Schedule Synchronization */}
      <section
        onClick={() => {
          triggerHaptic('light');
          onOpenSchedule();
        }}
        className="p-4 rounded-[28px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:border-sky-500/40 flex items-center justify-between gap-3 transition-all cursor-pointer group select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight">{scheduleSummary.title}</h4>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${scheduleSummary.badgeClass}`}>
                {scheduleSummary.badge}
              </span>
            </div>
            <p className="text-xs text-[var(--text-2)] mt-0.5 line-clamp-1">{scheduleSummary.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-2)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors shrink-0">
          <span className="hidden sm:inline">Открыть</span>
          <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </section>

      {/* 3. Next Planned Date (if any) */}
      {upcomingDate && (
        <section
          onClick={onOpenDates}
          className="p-4 rounded-[28px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:border-[var(--accent)]/40 flex items-center justify-between gap-3 transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight">Ближайшее свидание</h4>
                <span className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">
                  {upcomingDate.status === 'CONFIRMED' ? 'Подтверждено' : 'Запланировано'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)] mt-0.5">
                {upcomingDate.chosenDate
                  ? `${upcomingDate.chosenDate}${upcomingDate.chosenTime ? ` в ${upcomingDate.chosenTime}` : ''} • `
                  : ''}
                {upcomingDate.chosenLocation || upcomingDate.invitationNote || 'Особенный вечер для двоих'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-2)] group-hover:text-[var(--accent)] transition-colors shrink-0">
            <span className="hidden sm:inline">Открыть</span>
            <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5" />
          </div>
        </section>
      )}
    </div>
  );
};
