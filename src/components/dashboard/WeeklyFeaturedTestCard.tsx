import React from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, Sparkles, ChevronRight, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { TestCategory, PartnerId } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface WeeklyFeaturedTestCardProps {
  tests: TestCategory[];
  currentPartnerId: PartnerId;
  partnerName: string;
  onOpenTest: (test: TestCategory) => void;
  onOpenAllTests: () => void;
  onOpenPassport: () => void;
}

export const WeeklyFeaturedTestCard: React.FC<WeeklyFeaturedTestCardProps> = ({
  tests,
  currentPartnerId,
  partnerName,
  onOpenTest,
  onOpenAllTests,
  onOpenPassport,
}) => {
  // Helper to check completion for current user and partner
  const getIsMyDone = (t: TestCategory) => {
    if (t.isCompletedByMe !== undefined) return !!t.isCompletedByMe;
    return currentPartnerId === 'partner1' ? !!t.partner1Done : !!t.partner2Done;
  };

  const getIsPartnerDone = (t: TestCategory) => {
    if (t.isCompletedByPartner !== undefined) return !!t.isCompletedByPartner;
    return currentPartnerId === 'partner1' ? !!t.partner2Done : !!t.partner1Done;
  };

  // Find the first test where either I or my partner haven't finished
  const activeTest = tests.find((t) => !(getIsMyDone(t) && getIsPartnerDone(t))) || tests[0];

  if (!activeTest) return null;

  const myDone = getIsMyDone(activeTest);
  const partnerDone = getIsPartnerDone(activeTest);
  const bothDone = myDone && partnerDone;

  const totalQuestions = activeTest.questionsCount || activeTest.questions?.length || 6;
  const estimatedMin = activeTest.estimatedMinutes || 5;

  const handleClick = () => {
    triggerHaptic('selection');
    if (bothDone) {
      onOpenPassport();
    } else {
      onOpenTest(activeTest);
    }
  };

  return (
    <section
      id="block-weekly-featured-test"
      onClick={handleClick}
      className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-br from-[var(--surface-solid)] via-purple-500/6 to-rose-500/10 dark:from-[var(--surface-solid)] dark:via-purple-950/20 dark:to-rose-950/20 border border-purple-500/15 hover:border-purple-500/40 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-col gap-3.5 transition-all cursor-pointer group select-none relative overflow-hidden"
    >
      {/* Background Soft Purple-Rose Ambient Glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-purple-500/15 via-rose-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/12 text-purple-600 dark:text-purple-400 font-black text-xs shadow-2xs border border-purple-500/25">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Тест недели для двоих</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--text-3)] font-bold bg-[var(--surface-2)] px-2.5 py-0.5 rounded-full border border-[var(--divider)]">
          <Clock className="w-3 h-3 text-purple-500" />
          <span>~{estimatedMin} мин</span>
        </div>
      </div>

      {/* Test Title & Description */}
      <div className="z-10 space-y-1">
        <h3 className="text-base sm:text-lg font-black text-[var(--text)] tracking-tight leading-snug group-hover:text-[var(--accent)] transition-colors">
          {activeTest.title}
        </h3>
        <p className="text-xs text-[var(--text-2)] line-clamp-1 leading-relaxed font-medium">
          {activeTest.subtitle || activeTest.description}
        </p>
      </div>

      {/* Couple Dual Status Bar */}
      <div className="z-10 p-3 rounded-2xl bg-[var(--surface-solid)]/80 backdrop-blur-xs border border-[var(--divider)]/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          {/* My Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--text)]">Вы:</span>
            {myDone ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>Готово</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Не пройдено
              </span>
            )}
          </div>

          {/* Partner Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--text)]">{partnerName}:</span>
            {partnerDone ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>Готово</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                Ожидает
              </span>
            )}
          </div>
        </div>

        {/* Motivational Status Text */}
        <div className="text-[11px] text-[var(--text-2)] font-medium pt-0.5 flex items-center justify-between">
          {bothDone ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span>🎉 Оба завершили! Результаты синхронизированы</span>
            </span>
          ) : partnerDone && !myDone ? (
            <span className="text-[var(--accent)] font-semibold flex items-center gap-1">
              <span>🔥 {partnerName} уже ждёт ваш ответ (+50 XP)</span>
            </span>
          ) : myDone && !partnerDone ? (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              Вы ответили! Ждём завершения от {partnerName}
            </span>
          ) : (
            <span>Пройдите тест вместе, чтобы открыть карту близости</span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAllTests();
            }}
            className="text-[var(--accent)] hover:underline font-bold text-[10px] shrink-0 cursor-pointer"
          >
            Все тесты ({tests.length})
          </button>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-0.5 z-10">
        <div className="w-full py-3 px-4 rounded-2xl bg-[var(--surface-solid)] group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 text-[var(--text)] group-hover:text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-2xs group-hover:shadow-md border border-[var(--divider)] group-hover:border-transparent transition-all">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 group-hover:text-white transition-colors" />
            <span>
              {bothDone
                ? 'Посмотреть радар совместимости'
                : !myDone
                ? 'Пройти тест прямо сейчас'
                : `Напомнить ${partnerName}`}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </section>
  );
};
