import React from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Sparkles, Check, Flame } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface DailyHabitTrackerProps {
  hasHugSent: boolean;
  hasQuestionAnswered: boolean;
  hasPetCared: boolean;
  streakDays: number;
  onOpenQuestion: () => void;
  onOpenPet: () => void;
  onSendHug: () => void;
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({
  hasHugSent,
  hasQuestionAnswered,
  hasPetCared,
  streakDays,
  onOpenQuestion,
  onOpenPet,
  onSendHug,
}) => {
  const completedCount = (hasHugSent ? 1 : 0) + (hasQuestionAnswered ? 1 : 0) + (hasPetCared ? 1 : 0);
  const isAllCompleted = completedCount === 3;
  const progressPercent = Math.round((completedCount / 3) * 100);

  const habits = [
    {
      id: 'hug',
      label: 'Касание',
      done: hasHugSent,
      icon: Heart,
      action: onSendHug,
      color: 'text-rose-500',
      bgDone: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'question',
      label: 'Вопрос',
      done: hasQuestionAnswered,
      icon: MessageCircle,
      action: onOpenQuestion,
      color: 'text-amber-500',
      bgDone: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'pet',
      label: 'Питомец',
      done: hasPetCared,
      icon: Sparkles,
      action: onOpenPet,
      color: 'text-emerald-500',
      bgDone: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <section
      id="block-daily-habit-tracker"
      className="p-3.5 sm:p-4 rounded-[28px] bg-linear-to-r from-[var(--surface-solid)] via-[var(--surface-blush)]/25 to-amber-50/20 dark:from-[var(--surface-solid)] dark:via-zinc-900 dark:to-zinc-900 border border-[var(--card-border)] shadow-[var(--card-shadow)] flex flex-col gap-3 select-none relative overflow-hidden"
    >
      {/* Top Header: Title & Progress Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center text-xs font-bold shadow-2xs">
            ✨
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight flex items-center gap-1.5">
              <span>Ритуал дня</span>
              <span className="text-[11px] font-semibold text-[var(--text-3)]">
                ({completedCount}/3)
              </span>
            </h4>
          </div>
        </div>

        {/* Right side: Streak and Progress Bar */}
        <div className="flex items-center gap-2.5">
          {isAllCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/25 animate-pulse">
              <span>🎉 Закрыто 100%</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-16 sm:w-20 h-2 rounded-full bg-[var(--surface-2)] border border-[var(--divider)] overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[var(--accent)] to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {streakDays > 0 && (
            <div className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{streakDays}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Interactive Habit Pills */}
      <div className="grid grid-cols-3 gap-2">
        {habits.map((h) => {
          const Icon = h.icon;
          return (
            <motion.button
              key={h.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic('light');
                h.action();
              }}
              className={`min-h-[42px] py-2 px-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                h.done
                  ? h.bgDone
                  : 'bg-[var(--surface-solid)]/80 hover:bg-[var(--surface-2)] border-[var(--divider)] text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                {h.done ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${h.color}`} />
                )}
              </div>
              <span className="truncate">{h.label}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
