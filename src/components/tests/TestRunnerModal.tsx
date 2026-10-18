import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, X, Sparkles, Zap, Flame } from 'lucide-react';
import { TestCategory, Question } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';
import { GamifiedQuestionCard } from './GamifiedQuestionCard.tsx';
import { triggerHaptic } from '../../utils/haptics.ts';
import { play8BitAudio } from '../../utils/audio8Bit.ts';

interface AnswerMetadata {
  reactionTimeMs?: number;
  toggleCount?: number;
  targetType?: string;
  rawPayload?: any;
}

interface TestRunnerModalProps {
  activeTest: TestCategory | null;
  currentQuestionIndex: number;
  userAnswers: Record<string, any>;
  partnerName?: string;
  partnerAnswers?: Record<string, any>;
  onSelectOption: (questionId: string, value: any, metadata?: AnswerMetadata) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onClose: () => void;
}

const MOTIVATION_STEPS = [
  'Начало пути ✨',
  'Отличный темп 🔥',
  'В самое яблочко 🎯',
  'Половина пройдена 💫',
  'Узнаём друг друга лучше ❤️',
  'Почти у цели 🌟',
  'Финальный штрих 🎉',
];

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  activeTest,
  currentQuestionIndex,
  userAnswers,
  partnerName = 'Партнёр',
  partnerAnswers,
  onSelectOption,
  onNextQuestion,
  onPrevQuestion,
  onClose,
}) => {
  const q: Question | undefined = activeTest?.questions[currentQuestionIndex];

  // Latency & toggle telemetry tracking
  const questionStartTimeRef = useRef<number>(Date.now());
  const toggleCountRef = useRef<number>(0);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    toggleCountRef.current = 0;
  }, [currentQuestionIndex, q?.id]);

  if (!activeTest || !q) return null;

  const selectedVal = userAnswers[q.id];
  const meta = getTestMeta(activeTest);
  const totalQuestions = activeTest.questions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const motivationText =
    currentQuestionIndex === totalQuestions - 1
      ? 'Финальный штрих 🎉'
      : MOTIVATION_STEPS[currentQuestionIndex % MOTIVATION_STEPS.length];

  const partnerAnswerForThisQ = partnerAnswers ? partnerAnswers[q.id] : undefined;

  const handleChoice = (val: any, rawPayload?: any) => {
    const elapsed = Date.now() - questionStartTimeRef.current;
    toggleCountRef.current += 1;

    onSelectOption(q.id, val, {
      reactionTimeMs: elapsed,
      toggleCount: toggleCountRef.current,
      targetType: 'self',
      rawPayload,
    });
  };

  // Check if current question is answered
  let isAnswered = false;
  const currentTradeOffMaxPoints = q?.tradeOffMaxPoints || q?.totalPoints || 10;

  if (q?.type === 'trade_off') {
    const raw =
      typeof selectedVal === 'object' && selectedVal !== null
        ? selectedVal
        : (userAnswers as any)[`__meta_${q.id}`]?.rawPayload;

    if (typeof raw === 'object' && raw !== null) {
      const sum = Object.values(raw).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
      isAnswered = sum === currentTradeOffMaxPoints;
    } else {
      isAnswered = selectedVal === 1;
    }
  } else {
    isAnswered = selectedVal !== undefined && selectedVal !== null && selectedVal !== '';
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[var(--surface-solid)] rounded-[36px] max-w-xl w-full shadow-2xl border border-[var(--divider)] overflow-hidden flex flex-col max-h-[94vh] relative"
        >
          {/* Top Stories-style Segmented Progress Bar */}
          <div className="pt-4 px-5 sm:px-7 pb-2 flex gap-1.5 items-center">
            {activeTest.questions.map((_, idx) => {
              const isPast = idx < currentQuestionIndex;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <div
                  key={`progress-segment-${idx}`}
                  className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--surface-3)] relative"
                >
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={false}
                    animate={{
                      width: isPast ? '100%' : isCurrent ? '100%' : '0%',
                      opacity: isPast ? 0.7 : isCurrent ? 1 : 0,
                    }}
                    transition={{ duration: isCurrent ? 0.35 : 0.2 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Header Bar */}
          <div className="px-5 sm:px-7 py-2.5 flex items-center justify-between border-b border-[var(--divider)]/50">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                <span>{meta.categoryIcon}</span>
                <span>{meta.emotionalTitle}</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{motivationText}</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-blush)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-all cursor-pointer"
                title="Отложить тест"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gamified Card Content Body */}
          <div className="p-4 sm:p-7 overflow-y-auto flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full"
              >
                <GamifiedQuestionCard
                  question={q}
                  selectedVal={selectedVal}
                  partnerName={partnerName}
                  partnerAnswer={partnerAnswerForThisQ}
                  onAnswer={handleChoice}
                  onNext={onNextQuestion}
                  onPrev={onPrevQuestion}
                  currentIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  userAnswers={userAnswers}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-[var(--divider)] bg-[var(--surface)]/90 backdrop-blur-md flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onPrevQuestion();
              }}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer transition-colors hidden sm:inline"
              >
                Отложить
              </button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  triggerHaptic('selection');
                  onNextQuestion();
                }}
                disabled={!isAnswered}
                className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white bg-linear-to-r from-[var(--accent)] to-rose-500 hover:brightness-105 disabled:opacity-30 disabled:cursor-not-allowed shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>
                  {currentQuestionIndex === activeTest.questions.length - 1
                    ? 'Завершить (+150 XP) 🎉'
                    : 'Следующий вопрос'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
