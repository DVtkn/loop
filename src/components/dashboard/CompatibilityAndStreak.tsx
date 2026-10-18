import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Flame, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';
import { formatRussianPlural } from './PartnerStatusCard.tsx';

interface CompatibilityAndStreakProps {
  hasCompatibilityData: boolean;
  compatibilityPercent: number;
  compatibilityStatus: string;
  streakDaysCount: number;
  onOpenPassport: () => void;
  onOpenTests: () => void;
}

export const CompatibilityAndStreak: React.FC<CompatibilityAndStreakProps> = ({
  hasCompatibilityData,
  compatibilityPercent,
  compatibilityStatus,
  streakDaysCount,
  onOpenPassport,
  onOpenTests,
}) => {
  return (
    <section id="block-2-compatibility-and-streak" className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {/* Превью совместимости */}
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('light');
          if (hasCompatibilityData) {
            onOpenPassport();
          } else {
            onOpenTests();
          }
        }}
        className="p-3.5 sm:p-4 rounded-[24px] bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/40 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex items-center justify-between gap-2 transition-all cursor-pointer text-left group select-none"
        title={hasCompatibilityData ? 'Перейти в Паспорт пары' : 'Пройти первый тест для расчёта совместимости'}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight flex items-center gap-1">
              <span>{hasCompatibilityData ? `${compatibilityPercent}%` : null}</span>
              <span className="text-[10px] text-[var(--text-3)] font-normal hidden sm:inline">
                {hasCompatibilityData ? '• Паспорт' : '• Тесты'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-2)] font-medium leading-snug mt-0.5 whitespace-nowrap">
              {hasCompatibilityData ? compatibilityStatus : 'Пройти тест'}
            </div>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
      </motion.button>

      {/* Стрик активности пары */}
      <motion.div
        whileHover={{ y: -1 }}
        className="p-3.5 sm:p-4 rounded-[24px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] flex items-center gap-2.5 transition-all text-left select-none"
      >
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
            streakDaysCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-400'
          }`}
        >
          <Flame
            className={`w-4 h-4 ${
              streakDaysCount > 0 ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'
            }`}
          />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight flex items-center gap-1">
            <span>
              {streakDaysCount > 0
                ? `${streakDaysCount} ${formatRussianPlural(streakDaysCount, 'день', 'дня', 'дней')}`
                : '0 дней'}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-2)] font-medium leading-snug mt-0.5 whitespace-nowrap">
            {streakDaysCount > 0 ? 'подряд на связи' : 'Начните серию сегодня'}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
