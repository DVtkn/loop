import React, { useState } from 'react';
import { Quote, CheckCircle2, ChevronRight, X, Sparkles, Pencil, Heart } from 'lucide-react';

interface DailyQuestionTeaserProps {
  currentDailyQuestion: string;
  questionAnswer?: string | null;
  onAnswerSubmit: (answer: string) => void;
}

export const DailyQuestionTeaser: React.FC<DailyQuestionTeaserProps> = ({
  currentDailyQuestion,
  questionAnswer,
  onAnswerSubmit,
}) => {
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [isEditingQuestionAnswer, setIsEditingQuestionAnswer] = useState<boolean>(false);
  const [userQuestionAnswer, setUserQuestionAnswer] = useState<string>('');

  const handleOpen = () => {
    setUserQuestionAnswer(questionAnswer || '');
    setIsEditingQuestionAnswer(false);
    setShowQuestionModal(true);
  };

  const handleClose = () => {
    setShowQuestionModal(false);
    setIsEditingQuestionAnswer(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestionAnswer.trim()) return;
    onAnswerSubmit(userQuestionAnswer.trim());
    handleClose();
  };

  return (
    <>
      <section
        id="block-daily-question"
        onClick={handleOpen}
        className="p-5 sm:p-6 rounded-[32px] bg-linear-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/30 to-amber-50/30 dark:from-[var(--surface-solid)] dark:via-[var(--surface-blush)]/20 dark:to-zinc-900/40 border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-col gap-3.5 transition-all cursor-pointer group select-none relative overflow-hidden"
      >
        {/* Soft Background Warm Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header Badge */}
        <div className="flex items-center justify-between z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-solid)]/90 backdrop-blur-xs text-[var(--accent)] font-bold text-xs shadow-2xs border border-[var(--accent)]/15">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Главный ритуал дня</span>
          </div>

          {questionAnswer ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Вы ответили</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <span>🔒</span>
              <span>Ответ скрыт</span>
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="z-10 space-y-1.5">
          <p className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight leading-snug">
            «{currentDailyQuestion}»
          </p>

          {questionAnswer ? (
            <div className="text-xs text-[var(--text-2)] bg-[var(--surface-solid)]/80 p-2.5 rounded-2xl border border-[var(--divider)]/50 line-clamp-2 italic">
              Ваш ответ: «{questionAnswer}»
            </div>
          ) : (
            <p className="text-xs text-[var(--text-2)] flex items-center gap-1 font-medium">
              <span>💡</span>
              <span>Узнайте, что думает любимый человек</span>
            </p>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-1 z-10">
          <div className="w-full py-2.5 px-4 rounded-2xl bg-[var(--surface-solid)] group-hover:bg-[var(--accent)] text-[var(--text)] group-hover:text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs border border-[var(--divider)] group-hover:border-[var(--accent)] transition-all">
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[var(--accent)] group-hover:text-white transition-colors" />
              <span>{questionAnswer ? 'Посмотреть ответы пары' : 'Ответить и открыть секрет'}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </section>

      {/* Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center">
          <div onClick={handleClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn" />

          <div className="relative z-10 w-full max-w-lg bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 border border-[var(--divider)] shadow-2xl space-y-4 max-h-[90vh] flex flex-col pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] animate-slideUp">
            <div className="w-10 h-1 rounded-full bg-[var(--divider)] mx-auto sm:hidden mb-1 shrink-0" />

            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center">
                  <Quote className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text)] leading-tight">Вопрос дня</h3>
                  <p className="text-xs text-[var(--text-2)]">Для душевного сближения и диалога</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Question Text Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)]">
              <div className="text-[11px] font-bold text-[var(--accent)] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Сегодняшний вопрос</span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-[var(--text)] leading-relaxed italic">
                «{currentDailyQuestion}»
              </p>
            </div>

            {/* Answer Display or Form */}
            {questionAnswer && !isEditingQuestionAnswer ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ваш ответ сохранён:</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-3)] font-medium">Виден партнёру</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text)] leading-relaxed pt-1">«{questionAnswer}»</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserQuestionAnswer(questionAnswer);
                      setIsEditingQuestionAnswer(true);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-[var(--accent)]" />
                    <span>Изменить ответ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                  >
                    Готово
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <textarea
                  value={userQuestionAnswer}
                  onChange={(e) => setUserQuestionAnswer(e.target.value)}
                  placeholder="Напишите искренний ответ для вашего партнёра..."
                  rows={4}
                  autoFocus
                  className="w-full p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
                <div className="flex gap-2 pt-1 border-t border-[var(--divider)]">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] font-semibold text-sm transition-all active:scale-98 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!userQuestionAnswer.trim()}
                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Поделиться с партнёром</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
