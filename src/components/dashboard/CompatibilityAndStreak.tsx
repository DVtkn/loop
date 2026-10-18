import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, ChevronRight, X, Heart, Award, ShieldCheck, Zap } from 'lucide-react';
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
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);

  // Dynamic Flame Tier calculation
  const getStreakTier = (days: number) => {
    if (days >= 30) return { label: 'Корона союза 👑', next: 100, color: 'text-amber-500', bg: 'bg-amber-500/15', fill: 'fill-amber-500' };
    if (days >= 7) return { label: 'Яркое пламя 🔥', next: 30, color: 'text-orange-500', bg: 'bg-orange-500/15', fill: 'fill-orange-500' };
    if (days >= 3) return { label: 'Тёплый огонёк ✨', next: 7, color: 'text-amber-500', bg: 'bg-amber-500/10', fill: 'fill-amber-500' };
    if (days >= 1) return { label: 'Первая искра 🌟', next: 3, color: 'text-rose-500', bg: 'bg-rose-500/10', fill: 'fill-rose-500' };
    return { label: 'Начните сегодня 🌱', next: 1, color: 'text-zinc-400', bg: 'bg-zinc-500/10', fill: 'text-zinc-400' };
  };

  const currentTier = getStreakTier(streakDaysCount);

  return (
    <>
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
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('selection');
            setShowStreakModal(true);
          }}
          className="p-3.5 sm:p-4 rounded-[24px] bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-amber-500/40 shadow-[var(--card-shadow)] flex items-center justify-between gap-2 transition-all text-left select-none cursor-pointer group"
          title="Узнать о стрике пары"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${currentTier.bg} ${currentTier.color}`}
            >
              <Flame className={`w-4 h-4 ${streakDaysCount > 0 ? 'fill-current' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[var(--text)] leading-tight flex items-center gap-1">
                <span>
                  {streakDaysCount > 0
                    ? `${streakDaysCount} ${formatRussianPlural(streakDaysCount, 'день', 'дня', 'дней')}`
                    : '0 дней'}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-2)] font-medium leading-snug mt-0.5 whitespace-nowrap truncate">
                {currentTier.label}
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-3)] group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </motion.button>
      </section>

      {/* Streak Info Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center">
          <div
            onClick={() => setShowStreakModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
          />

          <div className="relative z-10 w-full max-w-md bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 border border-[var(--divider)] shadow-2xl space-y-4 animate-slideUp pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))]">
            <div className="w-10 h-1 rounded-full bg-[var(--divider)] mx-auto sm:hidden mb-1 shrink-0" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl ${currentTier.bg} ${currentTier.color} flex items-center justify-center`}>
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">Огонь союза (Стрик)</h3>
                  <p className="text-xs text-[var(--text-2)]">Дни непрерывной близости пары</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStreakModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Streak Counter Hero */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 text-center space-y-1">
              <div className="text-3xl font-black text-[var(--text)] tracking-tight">
                {streakDaysCount} {formatRussianPlural(streakDaysCount, 'день', 'дня', 'дней')}
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {currentTier.label}
              </div>
              <p className="text-xs text-[var(--text-2)] pt-1 max-w-xs mx-auto">
                {streakDaysCount > 0
                  ? 'Вы поддерживаете огонёк ваших отношений активными касаниями каждый день!'
                  : 'Отправьте касание, ответьте на вопрос дня или покормите питомца, чтобы зажечь первую искру!'}
              </p>
            </div>

            {/* Rules and Milestones */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[var(--text-2)]">
                  Стрик защищён, пока <strong>хотя бы один из вас</strong> совершает действие в Loop раз в 24 часа.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[var(--text-2)]">
                  Каждый день стрика даёт бонусные <strong>+15 XP</strong> на развитие питомца и ранга союза.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStreakModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Понятно, сохраняем стрик! 🔥
            </button>
          </div>
        </div>
      )}
    </>
  );
};
