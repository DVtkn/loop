import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Flame,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  PartyPopper,
  Zap,
  ArrowRight,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { TestCategory } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';
import { computePersonalTestInsight, computePairTestComparison } from '../../utils/testInsights.ts';
import { triggerHaptic } from '../../utils/haptics.ts';
import { play8BitAudio } from '../../utils/audio8Bit.ts';

interface TestStoriesModalProps {
  test: TestCategory | null;
  userAnswers?: Record<string, any>;
  partnerAnswers?: Record<string, any>;
  isPaired: boolean;
  partnerName: string;
  onViewReport: () => void;
  onViewTestResult?: () => void;
  onClose: () => void;
}

export const TestStoriesModal: React.FC<TestStoriesModalProps> = ({
  test,
  userAnswers = {},
  partnerAnswers,
  isPaired,
  partnerName = 'Партнёр',
  onViewReport,
  onViewTestResult,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  const totalSlides = comparison ? 4 : 3;

  const handleNextSlide = () => {
    triggerHaptic('light');
    play8BitAudio('pop');
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevSlide = () => {
    triggerHaptic('light');
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleShare = () => {
    triggerHaptic('success');
    play8BitAudio('sparkle');
    const shareText = `Наш результат в исследовании «${meta.emotionalTitle}» в Loop! Архетип: ${insight.archetype} ${insight.archetypeEmoji} 💕`;

    if (navigator.share) {
      navigator.share({
        title: 'Результаты пары в Loop',
        text: shareText,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  // Sound fanfare on open
  useEffect(() => {
    play8BitAudio('fanfare');
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-5 select-none">
        {/* Story Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md h-[92vh] max-h-[780px] bg-linear-to-b from-stone-900 via-zinc-900 to-black text-white rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between"
        >
          {/* Top Ambient Glow Gradient */}
          <div className="absolute top-0 left-0 right-0 h-48 bg-linear-to-b from-[var(--accent)]/25 to-transparent blur-3xl pointer-events-none" />

          {/* Stories Progress Bars Header */}
          <div className="pt-4 px-5 z-20 space-y-3">
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <div
                  key={`story-bar-${idx}`}
                  className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 relative"
                >
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={false}
                    animate={{
                      width: idx < currentSlide ? '100%' : idx === currentSlide ? '100%' : '0%',
                      opacity: idx <= currentSlide ? 1 : 0,
                    }}
                    transition={{ duration: idx === currentSlide ? 0.3 : 0.15 }}
                  />
                </div>
              ))}
            </div>

            {/* Header Info */}
            <div className="flex items-center justify-between text-xs text-white/80">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  {meta.categoryIcon}
                </span>
                <span className="font-bold tracking-tight text-white/90">
                  {meta.emotionalTitle}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invisible Touch Tap Zones for Story Navigation */}
          <div className="absolute inset-y-16 inset-x-0 flex z-10">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={handlePrevSlide}
              title="Предыдущий слайд"
            />
            <div
              className="w-2/3 h-full cursor-pointer"
              onClick={handleNextSlide}
              title="Следующий слайд"
            />
          </div>

          {/* Slide Content Body */}
          <div className="px-6 py-4 flex-1 flex flex-col justify-center items-center text-center relative z-20 pointer-events-none">
            <AnimatePresence mode="wait">
              {/* SLIDE 0: Personal Archetype Badge */}
              {currentSlide === 0 && (
                <motion.div
                  key="slide-archetype"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -15 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-6 w-full max-w-sm pointer-events-auto"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+{insight.xpEarned} XP союза начислено</span>
                  </div>

                  {/* Big Glowing Archetype Orb */}
                  <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-[var(--accent)] to-amber-400 opacity-60 blur-xl animate-pulse" />
                    <div className="relative w-24 h-24 rounded-3xl bg-linear-to-b from-white/20 to-white/5 border border-white/30 backdrop-blur-lg flex items-center justify-center text-5xl shadow-2xl">
                      {insight.archetypeEmoji}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">
                      Твой психологический архетип
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      «{insight.archetype}»
                    </h2>
                    <p className="text-xs font-semibold text-white/70">
                      {insight.topTrait}
                    </p>
                  </div>

                  <div className="p-4 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md text-left text-xs leading-relaxed text-white/90 shadow-md">
                    {insight.insight}
                  </div>
                </motion.div>
              )}

              {/* SLIDE 1: Partner Cheat Sheet */}
              {currentSlide === 1 && (
                <motion.div
                  key="slide-cheatsheet"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -15 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5 w-full max-w-sm pointer-events-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl shadow-md">
                    💡
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                      Секретный ключ к сердцу
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Памятка для {partnerName}
                    </h2>
                    <p className="text-xs text-white/60">
                      Как лучше всего проявлять любовь и поддержку
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-linear-to-b from-white/15 to-white/5 border border-white/20 backdrop-blur-md text-left text-sm leading-relaxed text-white/95 shadow-xl space-y-3">
                    <p>{insight.partnerTip}</p>
                    <div className="pt-3 border-t border-white/10 text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{partnerName} увидит эту подсказку в своём отчёте</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 2: Pair Synergy & 100% Matches (if partner answers exist) */}
              {currentSlide === 2 && comparison && (
                <motion.div
                  key="slide-synergy"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -15 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5 w-full max-w-sm pointer-events-auto"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-rose-500/30 to-amber-500/30 text-rose-300 border border-rose-500/40 text-xs font-black shadow-md">
                    <PartyPopper className="w-3.5 h-3.5 text-rose-400" />
                    <span>Синхронизация ответов союза</span>
                  </div>

                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-40 blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-2xl bg-linear-to-b from-white/20 to-white/5 border border-white/30 backdrop-blur-lg flex items-center justify-center text-4xl shadow-xl">
                      {comparison.coupleBadgeEmoji}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-rose-400 via-pink-400 to-amber-300">
                      {comparison.synergyScore}% Совпадение
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      «{comparison.coupleBadge}»
                    </h3>
                  </div>

                  <div className="p-4 rounded-3xl bg-white/10 border border-white/15 text-left text-xs leading-relaxed text-white/90 shadow-md space-y-2">
                    <p className="font-medium">{comparison.synergySummary}</p>
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 pt-1 border-t border-white/10">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{comparison.matchesCount} из {comparison.totalQuestions} ответов совпали на 100%!</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 2 (Fallback if partner hasn't answered yet) */}
              {currentSlide === 2 && !comparison && (
                <motion.div
                  key="slide-waiting"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -15 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5 w-full max-w-sm pointer-events-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-3xl shadow-md">
                    💌
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Ты сделал(а) первый шаг!
                    </h2>
                    <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                      {isPaired
                        ? `Теперь очередь ${partnerName}! Как только ${partnerName} ответит, вам откроется совместный радар и суперсилы союза.`
                        : 'Пригласите партнёра в Loop, чтобы открыть совместную синергию и сравнить ответы!'}
                    </p>
                  </div>

                  <div className="p-4 rounded-3xl bg-white/10 border border-white/15 text-left text-xs text-white/90 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Ответы запечатаны</span>
                    </div>
                    <p className="text-white/70 leading-relaxed">
                      Партнёр не увидит твоих выборов до тех пор, пока не завершит тест сам. Это исключает предвзятость!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* FINAL SLIDE: Action & Share Card */}
              {currentSlide === totalSlides - 1 && (
                <motion.div
                  key="slide-final"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -15 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5 w-full max-w-sm pointer-events-auto"
                >
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-3xl shadow-md">
                    🎉
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Готово на сегодня!
                    </h2>
                    <p className="text-xs text-white/70">
                      Исследование завершено и сохранено в дневник отношений
                    </p>
                  </div>

                  {/* Shareable Aesthetic Preview Card */}
                  <div className="p-4 rounded-3xl bg-linear-to-br from-white/15 to-white/5 border border-white/20 text-left space-y-2 shadow-xl">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>Loop • {meta.emotionalTitle}</span>
                      <span className="font-bold text-emerald-400">Синхронизировано</span>
                    </div>
                    <div className="text-lg font-black text-white">
                      {insight.archetypeEmoji} «{insight.archetype}»
                    </div>
                    <p className="text-xs text-white/80 line-clamp-2">
                      {insight.topTrait}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white text-stone-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-white/90 active:scale-98 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copiedInvite ? 'Ссылка скопирована! 💕' : 'Поделиться с любимым(ой)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewReport();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Открыть всю аналитику союза</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls & Slide Navigation Buttons */}
          <div className="p-5 z-20 flex items-center justify-between border-t border-white/10">
            <button
              type="button"
              onClick={handlePrevSlide}
              disabled={currentSlide === 0}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white disabled:opacity-20 cursor-pointer transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>

            <span className="text-[11px] font-bold text-white/40">
              {currentSlide + 1} из {totalSlides}
            </span>

            <button
              type="button"
              onClick={handleNextSlide}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{currentSlide === totalSlides - 1 ? 'Завершить' : 'Далее'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
