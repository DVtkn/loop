import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import {
  Heart,
  X,
  Sparkles,
  Check,
  ShieldCheck,
  HeartHandshake,
  Lock,
  Flame,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Zap,
} from 'lucide-react';
import { Question } from '../../types.ts';
import { triggerHaptic } from '../../utils/haptics.ts';
import { play8BitAudio } from '../../utils/audio8Bit.ts';
import { TradeOffQuestion } from './TradeOffQuestion.tsx';

interface GamifiedQuestionCardProps {
  question: Question;
  selectedVal: any;
  partnerName?: string;
  partnerAnswer?: any;
  onAnswer: (val: any, rawPayload?: any) => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalQuestions: number;
  userAnswers: Record<string, any>;
}

export const GamifiedQuestionCard: React.FC<GamifiedQuestionCardProps> = ({
  question: q,
  selectedVal,
  partnerName = 'Партнёр',
  partnerAnswer,
  onAnswer,
  onNext,
  onPrev,
  currentIndex,
  totalQuestions,
  userAnswers,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacityRight = useTransform(x, [30, 120], [0, 1]);
  const opacityLeft = useTransform(x, [-30, -120], [0, 1]);

  const [predictedPartnerVal, setPredictedPartnerVal] = useState<any>(null);
  const [showPredictionResult, setShowPredictionResult] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const isBinaryOrTernary = q.options && q.options.length <= 3;
  const currentTradeOffMaxPoints = q?.tradeOffMaxPoints || q?.totalPoints || 10;

  const handleSelectOption = (val: any, rawPayload?: any, autoAdvance = true) => {
    triggerHaptic('light');
    play8BitAudio('pop');
    onAnswer(val, rawPayload);

    if (autoAdvance && q.type !== 'trade_off') {
      setTimeout(() => {
        onNext();
      }, 340);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    setIsSwiping(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (q.options && q.options.length === 2) {
      if (offset > 100 || velocity > 400) {
        // Swiped right -> Option 2 or positive
        triggerHaptic('success');
        play8BitAudio('swipe');
        const rightOpt = q.options[q.options.length - 1];
        handleSelectOption(rightOpt.value, undefined, true);
      } else if (offset < -100 || velocity < -400) {
        // Swiped left -> Option 1 or negative
        triggerHaptic('selection');
        play8BitAudio('swipe');
        const leftOpt = q.options[0];
        handleSelectOption(leftOpt.value, undefined, true);
      }
    }
  };

  const handlePredictPartner = (val: any) => {
    triggerHaptic('medium');
    setPredictedPartnerVal(val);
    setShowPredictionResult(true);

    if (partnerAnswer !== undefined && partnerAnswer !== null) {
      const isCorrect = String(val) === String(partnerAnswer);
      if (isCorrect) {
        triggerHaptic('success');
        play8BitAudio('sparkle');
      }
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Background stacked card deck illusion */}
      <div className="absolute -bottom-2 w-[92%] h-24 bg-[var(--surface-3)]/60 rounded-3xl -z-10 shadow-xs scale-95 blur-[0.5px]" />
      <div className="absolute -bottom-4 w-[84%] h-20 bg-[var(--surface-3)]/30 rounded-3xl -z-20 shadow-2xs scale-90 blur-[1px]" />

      {/* Main Interactive Card */}
      <motion.div
        drag={isBinaryOrTernary ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={handleDragEnd}
        style={{ x, rotate }}
        className="w-full bg-[var(--surface-solid)] border border-[var(--divider)] rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[380px] transition-shadow duration-300 hover:shadow-2xl"
      >
        {/* Swipe Visual Badges (Right / Left) */}
        {isBinaryOrTernary && (
          <>
            <motion.div
              style={{ opacity: opacityRight }}
              className="absolute top-6 right-6 z-20 pointer-events-none px-4 py-1.5 rounded-2xl bg-emerald-500 text-white font-black text-sm tracking-wide uppercase border-2 border-white shadow-lg rotate-12 flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>ТОЧНО ДА</span>
            </motion.div>

            <motion.div
              style={{ opacity: opacityLeft }}
              className="absolute top-6 left-6 z-20 pointer-events-none px-4 py-1.5 rounded-2xl bg-rose-500 text-white font-black text-sm tracking-wide uppercase border-2 border-white shadow-lg -rotate-12 flex items-center gap-1.5"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>СКОРЕЕ НЕТ</span>
            </motion.div>
          </>
        )}

        {/* Card Header & Badges */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center text-xs font-black">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-semibold text-[var(--text-3)]">
                из {totalQuestions}
              </span>
            </div>

            {q.type === 'ipsative' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Оба варианта важны</span>
              </span>
            )}

            {q.type === 'forced_vulnerability' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Честность</span>
              </span>
            )}

            {isBinaryOrTernary && (
              <span className="text-[11px] font-medium text-[var(--text-3)] hidden sm:inline-flex items-center gap-1">
                <span>Свайпай</span>
                <span className="text-[var(--accent)] font-bold">⇄</span>
              </span>
            )}
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text)] leading-snug tracking-tight">
            {q.text}
          </h2>

          {q.isPrivate && (
            <div className="p-3 bg-[var(--surface-blush)] border border-[var(--accent)]/20 rounded-2xl text-[var(--accent)] text-xs flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Личный ответ: партнёр увидит только общий балл синергии.</span>
            </div>
          )}
        </div>

        {/* Middle: Interactive Options */}
        <div className="my-6">
          {/* TradeOff Allocation Type */}
          {q.type === 'trade_off' && q.tradeOffItems && (
            <TradeOffQuestion
              items={q.tradeOffItems}
              maxPoints={currentTradeOffMaxPoints}
              allocations={
                typeof selectedVal === 'object' && selectedVal !== null
                  ? selectedVal
                  : (userAnswers as any)[`__meta_${q.id}`]?.rawPayload || {}
              }
              onChange={(allocations) => {
                triggerHaptic('selection');
                onAnswer(allocations, allocations);
              }}
            />
          )}

          {/* Scale 1-5 with Vibrant Expressive Pills */}
          {q.type === 'scale' && (
            <div className="space-y-2.5">
              {q.options.map((opt, idx) => {
                const isSelected = selectedVal === opt.value;
                const emojiRating = ['❄️', '🌧️', '⛅', '☀️', '🔥'][idx] || '✨';

                return (
                  <motion.button
                    key={opt.label}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                      isSelected
                        ? 'border-[var(--accent)] bg-linear-to-r from-[var(--surface-blush)] to-[var(--surface-2)] font-bold text-[var(--text)] shadow-md ring-2 ring-[var(--accent)]/25'
                        : 'border-[var(--divider)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] hover:border-[var(--text-3)] text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="text-base sm:text-lg shrink-0 transform group-hover:scale-110 transition-transform">
                        {emojiRating}
                      </span>
                      <span className="text-xs sm:text-sm font-medium group-hover:font-semibold leading-relaxed">
                        {opt.label}
                      </span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white scale-110 shadow-xs'
                          : 'border-[var(--divider)] group-hover:border-[var(--text-3)]'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[var(--divider)]" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Single / Ipsative / Vulnerability Question Types */}
          {(q.type === 'single' || q.type === 'ipsative' || q.type === 'forced_vulnerability') && (
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt, idx) => {
                const isSelected = selectedVal === opt.value;
                const optLetter = String.fromCharCode(65 + idx); // A, B, C, D

                return (
                  <motion.button
                    key={opt.label}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer group ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--surface-blush)] font-bold text-[var(--text)] shadow-sm ring-2 ring-[var(--accent)]/25'
                        : 'border-[var(--divider)] bg-[var(--surface-2)] hover:bg-[var(--surface-subtle)] hover:border-[var(--text-3)] text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-xs'
                          : 'border-[var(--divider)] bg-[var(--surface-3)] text-[var(--text-2)] group-hover:border-[var(--text-3)]'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : optLetter}
                    </div>

                    <div className="flex-1">
                      <span className="text-xs sm:text-sm leading-relaxed block font-medium">
                        {opt.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Footer: Quick Gesture Shortcuts for 2-3 Options */}
        {isBinaryOrTernary && q.options.length === 2 && (
          <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-center gap-6 text-xs text-[var(--text-3)] font-medium">
            <button
              type="button"
              onClick={() => handleSelectOption(q.options[0].value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-rose-500 font-bold"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{q.options[0].label}</span>
            </button>
            <span className="text-[var(--divider)]">•</span>
            <button
              type="button"
              onClick={() => handleSelectOption(q.options[1].value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-emerald-500 font-bold"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{q.options[1].label}</span>
            </button>
          </div>
        )}

        {/* Partner Prediction Mini-Quest (Gamification) */}
        {partnerAnswer !== undefined && partnerAnswer !== null && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Мини-игра: Угадай выбор {partnerName}</span>
              </span>
              <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white">
                +50 XP
              </span>
            </div>

            {!showPredictionResult ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {q.options.map((opt) => (
                  <button
                    key={`predict-${opt.label}`}
                    type="button"
                    onClick={() => handlePredictPartner(opt.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-amber-400/40 bg-[var(--surface-solid)] hover:bg-amber-100 dark:hover:bg-amber-950/40 text-[var(--text)] transition-colors cursor-pointer"
                  >
                    {opt.label.slice(0, 22)}...
                  </button>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs pt-1 font-semibold flex items-center gap-2"
              >
                {String(predictedPartnerVal) === String(partnerAnswer) ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                    Бинго! Вы идеально чувствуете друг друга (+50 XP) 🎉
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    💡 Интересно! {partnerName} выбрал(а) другой ответ. Будет что обсудить вечером!
                  </span>
                )}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
