import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, ArrowLeft, ArrowRight, ShieldCheck, HeartHandshake, X, Sparkles } from 'lucide-react';
import { TestCategory, Question } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';
import { TradeOffQuestion } from './TradeOffQuestion.tsx';
import { triggerHaptic } from '../../utils/haptics.ts';

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

  const handleChoice = (val: any, rawPayload?: any) => {
    triggerHaptic('light');
    const elapsed = Date.now() - questionStartTimeRef.current;
    toggleCountRef.current += 1;

    onSelectOption(q.id, val, {
      reactionTimeMs: elapsed,
      toggleCount: toggleCountRef.current,
      targetType: 'self',
      rawPayload,
    });
  };

  const handleTradeOffChange = (allocations: Record<string, number>) => {
    triggerHaptic('selection');
    const elapsed = Date.now() - questionStartTimeRef.current;
    toggleCountRef.current += 1;

    onSelectOption(q.id, allocations, {
      reactionTimeMs: elapsed,
      toggleCount: toggleCountRef.current,
      targetType: 'self',
      rawPayload: allocations,
    });
  };

  // Check if current question is answerable / answered
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
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-[var(--surface)] rounded-[32px] max-w-xl w-full shadow-2xl border border-[var(--divider)] overflow-hidden flex flex-col max-h-[92vh] relative"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--divider)] bg-[var(--surface)]/90 backdrop-blur-sm relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-bold flex items-center gap-1">
                  <span>{meta.categoryIcon}</span>
                  <span>{meta.categoryLabel}</span>
                </span>
                <span className="text-xs font-semibold text-[var(--text-3)] hidden sm:inline">
                  • {meta.emotionalTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-2)]">
                  {currentQuestionIndex + 1} / {totalQuestions}
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

            {/* Progress and Motivation Streak */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-3)] font-medium">
                <span className="flex items-center gap-1 text-[var(--accent)] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  {motivationText}
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-linear-to-r from-[var(--accent)] to-rose-400 h-full rounded-full"
                  initial={{ width: `${((currentQuestionIndex) / totalQuestions) * 100}%` }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Question Content Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Methodological badge */}
                {q.type === 'ipsative' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Вынужденный выбор: оба варианта ценны</span>
                  </div>
                )}

                {q.type === 'forced_vulnerability' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Эмоциональная честность</span>
                  </div>
                )}

                <h2 className="text-base sm:text-xl font-extrabold text-[var(--text)] leading-snug tracking-tight">
                  {q.text}
                </h2>

                {q.isPrivate && (
                  <div className="p-3 bg-[var(--surface-blush)] border border-[var(--accent)]/20 rounded-2xl text-[var(--accent)] text-xs flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Конфиденциальный вопрос: партнёр увидит только общий балл совместимости.</span>
                  </div>
                )}

                {/* Trade-off Matrix Question Type */}
                {q.type === 'trade_off' && q.tradeOffItems && (
                  <TradeOffQuestion
                    items={q.tradeOffItems}
                    maxPoints={currentTradeOffMaxPoints}
                    allocations={
                      typeof selectedVal === 'object' && selectedVal !== null
                        ? selectedVal
                        : (userAnswers as any)[`__meta_${q.id}`]?.rawPayload || {}
                    }
                    onChange={handleTradeOffChange}
                  />
                )}

                {/* Scale Question Type */}
                {q.type === 'scale' && (
                  <div className="space-y-2.5">
                    {q.options.map((opt) => {
                      const isSelected = selectedVal === opt.value;
                      return (
                        <motion.button
                          key={opt.label}
                          type="button"
                          whileTap={{ scale: 0.985 }}
                          onClick={() => handleChoice(opt.value)}
                          className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-blush)] font-bold text-[var(--text)] shadow-sm ring-1 ring-[var(--accent)]/30'
                              : 'border-[var(--divider)] bg-[var(--surface-2)] hover:border-[var(--text-3)] text-[var(--text-2)] hover:text-[var(--text)]'
                          }`}
                        >
                          <span className="pr-3 leading-relaxed">{opt.label}</span>
                          <span
                            className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-white scale-110 shadow-xs'
                                : 'border-[var(--divider)] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Single / Ipsative / Forced Vulnerability Question Types */}
                {(q.type === 'single' || q.type === 'ipsative' || q.type === 'forced_vulnerability') && (
                  <div className="space-y-3">
                    {q.options.map((opt) => {
                      const isSelected = selectedVal === opt.value;
                      return (
                        <motion.button
                          key={opt.label}
                          type="button"
                          whileTap={{ scale: 0.985 }}
                          onClick={() => handleChoice(opt.value)}
                          className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-blush)] font-bold text-[var(--text)] shadow-sm ring-1 ring-[var(--accent)]/30'
                              : 'border-[var(--divider)] bg-[var(--surface-2)] hover:bg-[var(--surface)] hover:border-[var(--text-3)] text-[var(--text-2)] hover:text-[var(--text)]'
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-white scale-105 shadow-2xs'
                                : 'border-[var(--divider)]'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                            )}
                          </div>
                          <span className="leading-relaxed flex-1">{opt.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-[var(--divider)] bg-[var(--surface)] flex items-center justify-between">
            <button
              type="button"
              onClick={onPrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] cursor-pointer transition-colors hidden sm:inline"
              >
                Отложить
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onNextQuestion}
                disabled={!isAnswered}
                className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-linear-to-r from-[var(--accent)] to-rose-500 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>
                  {currentQuestionIndex === activeTest.questions.length - 1
                    ? 'Завершить (+150 XP) 🎉'
                    : 'Далее'}
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

