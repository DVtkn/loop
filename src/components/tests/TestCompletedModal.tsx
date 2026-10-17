import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Share2, Check, Flame, MessageCircleHeart } from 'lucide-react';
import { TestCategory } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';
import { computePersonalTestInsight, computePairTestComparison } from '../../utils/testInsights.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface TestCompletedModalProps {
  test: TestCategory | null;
  userAnswers?: Record<string, any>;
  partnerAnswers?: Record<string, any>;
  isPaired: boolean;
  partnerName: string;
  onViewReport: () => void;
  onViewTestResult?: () => void;
  onClose: () => void;
}

export const TestCompletedModal: React.FC<TestCompletedModalProps> = ({
  test,
  userAnswers = {},
  partnerAnswers,
  isPaired,
  partnerName,
  onViewReport,
  onViewTestResult,
  onClose,
}) => {
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!test) return null;

  const meta = getTestMeta(test);
  const effectiveAnswers =
    Object.keys(userAnswers).length > 0
      ? userAnswers
      : test.partner1Answers || test.partner2Answers || {};

  const insight = computePersonalTestInsight(test, effectiveAnswers);

  const hasPartnerAnswers =
    partnerAnswers && Object.keys(partnerAnswers).length > 0
      ? true
      : !!(test.partner1Answers && test.partner2Answers);

  const comparison = hasPartnerAnswers
    ? computePairTestComparison(
        test,
        effectiveAnswers,
        partnerAnswers || test.partner2Answers || test.partner1Answers || {},
        'Ты',
        partnerName || 'Партнёр'
      )
    : null;

  const handleShareInvite = () => {
    triggerHaptic('success');
    const shareText = `Я только что прошёл(ла) исследование «${meta.emotionalTitle}» в Loop! Мой архетип: ${insight.archetype} ${insight.archetypeEmoji}. Пройди тоже, чтобы сравнить наши результаты! 💕`;

    if (navigator.share) {
      navigator.share({
        title: 'Исследование пары в Loop',
        text: shareText,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="bg-[var(--surface)] rounded-[32px] max-w-lg w-full p-6 sm:p-7 text-center space-y-5 shadow-2xl border border-[var(--divider)] my-auto relative overflow-hidden"
        >
          {/* Confetti Glow Background Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-linear-to-b from-[var(--accent)]/15 to-transparent blur-2xl pointer-events-none" />

          {/* XP Badge & Category Pill */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{insight.xpEarned} XP союза</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--divider)] text-xs font-semibold">
              {meta.categoryIcon} {meta.categoryLabel}
            </span>
          </div>

          {/* Top Emoji & Archetype Title */}
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center mx-auto border border-[var(--accent)]/20 shadow-md text-3xl">
              {insight.archetypeEmoji}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Твой персональный психологический архетип
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                «{insight.archetype}»
              </h3>
              <p className="text-xs font-semibold text-[var(--text-3)]">
                {insight.topTrait}
              </p>
            </div>
          </div>

          {/* Personal Insight Card */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-left space-y-2.5 shadow-2xs">
            <div className="text-xs text-[var(--text)] font-medium leading-relaxed">
              {insight.insight}
            </div>

            {/* Partner Cheat Sheet */}
            <div className="pt-2 border-t border-[var(--divider)] flex items-start gap-2.5 text-xs text-[var(--text-2)]">
              <span className="text-base shrink-0">💡</span>
              <div className="leading-relaxed">
                <strong className="text-[var(--text)] font-semibold">Памятка для любимого человека: </strong>
                <span>{insight.partnerTip}</span>
              </div>
            </div>
          </div>

          {/* Pair Synergy Status */}
          {comparison ? (
            <div className="p-4 rounded-2xl bg-linear-to-br from-[var(--surface-blush)] to-[var(--surface)] border border-[var(--accent)]/30 text-left space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-[var(--accent)]" />
                  <span>{partnerName} тоже прошёл(ла)!</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-xs font-extrabold shadow-2xs">
                  {comparison.synergyScore}% Синергия
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                {comparison.synergySummary}
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-[var(--surface-2)]/60 border border-dashed border-[var(--divider)] rounded-2xl text-xs text-[var(--text-2)] font-medium flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <MessageCircleHeart className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span>
                  {isPaired
                    ? `Ждём ответы от ${partnerName}, чтобы открыть совместное наложение.`
                    : 'Свяжите аккаунты с партнёром, чтобы увидеть совместную карту.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleShareInvite}
                className="shrink-0 text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Позвать</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            {comparison && onViewTestResult ? (
              <button
                type="button"
                onClick={onViewTestResult}
                className="w-full py-3.5 bg-linear-to-r from-[var(--accent)] to-rose-500 hover:brightness-105 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Смотреть совместный разбор пары</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onViewReport}
                className="w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Перейти к общей аналитике союза</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-transparent text-[var(--text-2)] hover:text-[var(--text)] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Вернуться к опросникам
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

