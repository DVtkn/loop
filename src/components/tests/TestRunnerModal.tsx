import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, ArrowLeft, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { TestCategory, Question } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';
import { TradeOffQuestion } from './TradeOffQuestion.tsx';

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

  // Latency & toggle telemetry tracking (хуки — до раннего возврата, чтобы не нарушать порядок)
  const questionStartTimeRef = useRef<number>(Date.now());
  const toggleCountRef = useRef<number>(0);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    toggleCountRef.current = 0;
  }, [currentQuestionIndex, q?.id]);

  if (!activeTest || !q) return null;

  const selectedVal = userAnswers[q.id];
  const meta = getTestMeta(activeTest);

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

  const handleTradeOffChange = (allocations: Record<string, number>) => {
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
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-[var(--surface)] rounded-[28px] max-w-xl w-full shadow-2xl border border-[var(--divider)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--divider)] bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[var(--accent)]">{meta.emotionalTitle}</span>
              <span className="text-xs font-semibold text-[var(--text-2)]">
                Вопрос {currentQuestionIndex + 1} из {activeTest.questions.length}
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[var(--accent)] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / activeTest.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
            {q && (
              <div className="space-y-5">
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

                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] leading-relaxed">
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
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = selectedVal === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleChoice(opt.value)}
                          className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-blush)] font-bold text-[var(--text)] shadow-2xs'
                              : 'border-[var(--divider)] bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ml-2 ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                : 'border-[var(--divider)] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Single / Ipsative / Forced Vulnerability Question Types */}
                {(q.type === 'single' || q.type === 'ipsative' || q.type === 'forced_vulnerability') && (
                  <div className="space-y-2.5">
                    {q.options.map((opt) => {
                      const isSelected = selectedVal === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleChoice(opt.value)}
                          className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-blush)] font-bold text-[var(--text)] shadow-2xs'
                              : 'border-[var(--divider)] bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]'
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[var(--accent)]' : 'border-[var(--divider)]'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                          </div>
                          <span className="leading-relaxed">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-[var(--divider)] bg-[var(--surface)] flex items-center justify-between">
            <button
              type="button"
              onClick={onPrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] cursor-pointer"
              >
                Отложить
              </button>
              <button
                type="button"
                onClick={onNextQuestion}
                disabled={!isAnswered}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>
                  {currentQuestionIndex === activeTest.questions.length - 1
                    ? 'Завершить (+150 XP)'
                    : 'Далее'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
