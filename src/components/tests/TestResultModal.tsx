import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Flame, RotateCcw, Share2, Check, ArrowRight } from 'lucide-react';
import { TestCategory, UserPartner } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';
import { computePersonalTestInsight, computePairTestComparison } from '../../utils/testInsights.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface TestResultModalProps {
  test: TestCategory | null;
  partner1: UserPartner;
  partner2: UserPartner;
  currentPartnerId: string;
  onRetake: (test: TestCategory) => void;
  onClose: () => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  test,
  partner1,
  partner2,
  currentPartnerId,
  onRetake,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!test) return null;

  const meta = getTestMeta(test);
  const p1Answers = test.partner1Answers || {};
  const p2Answers = test.partner2Answers || {};

  const isP1 = currentPartnerId === 'partner1';
  const myAnswers = isP1 ? p1Answers : p2Answers;
  const otherAnswers = isP1 ? p2Answers : p1Answers;
  const me = isP1 ? partner1 : partner2;
  const other = isP1 ? partner2 : partner1;

  const hasMyAnswers = Object.keys(myAnswers).length > 0;
  const hasOtherAnswers = Object.keys(otherAnswers).length > 0;
  const bothDone = hasMyAnswers && hasOtherAnswers;

  const myInsight = computePersonalTestInsight(test, myAnswers);
  const otherInsight = hasOtherAnswers ? computePersonalTestInsight(test, otherAnswers) : null;

  const comparison = bothDone
    ? computePairTestComparison(test, myAnswers, otherAnswers, me.name, other.name)
    : null;

  const handleShare = () => {
    triggerHaptic('success');
    const title = comparison
      ? `Наш совместный результат в Loop: ${comparison.synergyScore}% совместимости в тесте «${meta.emotionalTitle}»!`
      : `Мой психологический архетип в тесте «${meta.emotionalTitle}»: ${myInsight.archetype} ${myInsight.archetypeEmoji}!`;

    if (navigator.share) {
      navigator.share({
        title: 'Результаты теста в Loop',
        text: title,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${title}\n${window.location.origin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-[var(--surface)] rounded-[32px] max-w-xl w-full shadow-2xl border border-[var(--divider)] my-auto overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--divider)] bg-[var(--surface)] flex items-center justify-between">
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-bold flex items-center gap-1">
                  <span>{meta.categoryIcon}</span>
                  <span>{meta.categoryLabel}</span>
                </span>
                <span className="text-xs text-[var(--text-3)] font-medium">
                  {meta.tagline}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text)] truncate">
                {meta.emotionalTitle}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-blush)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Поделиться результатом"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-blush)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
            {bothDone && comparison ? (
              <div className="space-y-6">
                {/* Couple Synergy Banner */}
                <div className="p-5 rounded-3xl bg-linear-to-br from-[var(--surface-blush)] to-[var(--surface)] border border-[var(--accent)]/30 space-y-3 shadow-sm text-center relative overflow-hidden">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent)] text-white text-xs font-extrabold shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{comparison.synergyScore}% Общая синергия</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-[var(--text)]">
                      {comparison.coupleBadgeEmoji} {comparison.coupleBadge}
                    </h4>
                    <p className="text-xs sm:text-sm text-[var(--text-2)] max-w-md mx-auto leading-relaxed">
                      {comparison.synergySummary}
                    </p>
                  </div>
                </div>

                {/* Two Partners Archetypes Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={me.avatar}
                        alt={me.name}
                        className="w-9 h-9 rounded-full object-cover border border-[var(--divider)] shadow-2xs"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-[var(--accent)]">Ты</span>
                        <h5 className="text-sm font-bold text-[var(--text)] leading-tight">{me.name}</h5>
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1">
                        <span>{myInsight.archetypeEmoji}</span>
                        <span>{myInsight.archetype}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{myInsight.topTrait}</p>
                    </div>
                  </div>

                  {otherInsight && (
                    <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="w-9 h-9 rounded-full object-cover border border-[var(--divider)] shadow-2xs"
                        />
                        <div>
                          <span className="text-[11px] font-bold text-[var(--accent)]">Партнёр</span>
                          <h5 className="text-sm font-bold text-[var(--text)] leading-tight">{other.name}</h5>
                        </div>
                      </div>
                      <div className="pt-1">
                        <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1">
                          <span>{otherInsight.archetypeEmoji}</span>
                          <span>{otherInsight.archetype}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-3)] mt-0.5">{otherInsight.topTrait}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Question-by-Question Comparison */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-xs font-bold text-[var(--text)]">
                      Разбор ответов по ситуациям ({comparison.matchesCount} из {comparison.totalQuestions} совпадений)
                    </h5>
                  </div>

                  <div className="space-y-3">
                    {comparison.questionComparisons.map((item, idx) => (
                      <div
                        key={item.questionId}
                        className={`p-4 rounded-2xl border transition-all text-left space-y-2.5 ${
                          item.isExactMatch
                            ? 'bg-[var(--surface-blush)]/40 border-[var(--accent)]/30'
                            : 'bg-[var(--surface-2)] border-[var(--divider)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text)] leading-snug">
                            {idx + 1}. {item.questionText}
                          </span>
                          <span
                            className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              item.isExactMatch
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {item.isExactMatch ? 'Совпадение' : 'Тандем'}
                          </span>
                        </div>

                        {/* Partner choices */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-[var(--accent)] shrink-0">{me.name}:</span>
                            <span className="text-[var(--text)]">{item.p1Label}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-[var(--text-3)] shrink-0">{other.name}:</span>
                            <span className="text-[var(--text-2)]">{item.p2Label}</span>
                          </div>
                        </div>

                        {/* Tip */}
                        <div className="pt-1.5 border-t border-[var(--divider)]/50 text-[11px] text-[var(--text-3)] font-medium">
                          {item.harmonyTip}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Only Me Done */
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center mx-auto border border-[var(--accent)]/20 shadow-md text-3xl">
                  {myInsight.archetypeEmoji}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Твой психологический архетип
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-[var(--text)]">
                    «{myInsight.archetype}»
                  </h4>
                  <p className="text-xs font-semibold text-[var(--text-3)]">
                    {myInsight.topTrait}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-left space-y-3">
                  <p className="text-xs sm:text-sm text-[var(--text)] font-medium leading-relaxed">
                    {myInsight.insight}
                  </p>
                  <div className="pt-2 border-t border-[var(--divider)] flex items-start gap-2 text-xs text-[var(--text-2)]">
                    <span className="text-base shrink-0">💡</span>
                    <div className="leading-relaxed">
                      <strong className="text-[var(--text)] font-semibold">Памятка для партнёра: </strong>
                      <span>{myInsight.partnerTip}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {other.name} пока не прошёл(ла) этот опросник. Как только он(а) ответит, здесь откроется полный сравнительный анализ ваших ответов.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-[var(--divider)] bg-[var(--surface)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetake(test);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Перепройти опросник</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Понятно
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
