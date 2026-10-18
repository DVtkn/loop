import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Quote,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
  Pencil,
  Heart,
  Lock,
  Unlock,
  Clock,
  Send,
  Flame,
  Laugh,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface DailyQuestionTeaserProps {
  currentDailyQuestion: string;
  questionAnswer?: string | null;
  partnerAnswer?: string | null;
  partnerName?: string;
  onAnswerSubmit: (answer: string) => void;
  onSendReaction?: (reaction: string) => void;
  currentReaction?: string | null;
}

const REACTION_EMOJIS = ['❤️', '🔥', '🥺', '😂', '👏', '✨'];

export const DailyQuestionTeaser: React.FC<DailyQuestionTeaserProps> = ({
  currentDailyQuestion,
  questionAnswer,
  partnerAnswer,
  partnerName = 'Партнёр',
  onAnswerSubmit,
  onSendReaction,
  currentReaction,
}) => {
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [isEditingQuestionAnswer, setIsEditingQuestionAnswer] = useState<boolean>(false);
  const [userQuestionAnswer, setUserQuestionAnswer] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(currentReaction || null);

  const hasMyAnswer = !!questionAnswer;
  const hasPartnerAnswer = !!partnerAnswer;
  const bothAnswered = hasMyAnswer && hasPartnerAnswer;

  const handleOpen = () => {
    triggerHaptic('selection');
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
    triggerHaptic('medium');
    onAnswerSubmit(userQuestionAnswer.trim());
    setIsEditingQuestionAnswer(false);
  };

  const handleEmojiClick = (emoji: string) => {
    triggerHaptic('selection');
    setSelectedEmoji(emoji);
    if (onSendReaction) {
      onSendReaction(emoji);
    }
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

          {bothAnswered ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              <Unlock className="w-3.5 h-3.5" />
              <span>Оба ответили 🎉</span>
            </span>
          ) : hasMyAnswer ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Вы ответили</span>
            </span>
          ) : hasPartnerAnswer ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/25 animate-pulse">
              <Lock className="w-3.5 h-3.5" />
              <span>{partnerName} ответил(а)!</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Ответ скрыт</span>
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="z-10 space-y-1.5">
          <p className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight leading-snug">
            «{currentDailyQuestion}»
          </p>

          {bothAnswered ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 p-2.5 rounded-2xl border border-purple-500/20">
              <span>🔓</span>
              <span>Ответы раскрыты! Нажмите, чтобы прочитать и обсудить.</span>
            </div>
          ) : hasMyAnswer ? (
            <div className="text-xs text-[var(--text-2)] bg-[var(--surface-solid)]/80 p-2.5 rounded-2xl border border-[var(--divider)]/50 space-y-1">
              <div className="line-clamp-1 italic">Ваш ответ: «{questionAnswer}»</div>
              <div className="text-[11px] text-[var(--text-3)] flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Ожидаем ответ {partnerName} для взаимного открытия</span>
              </div>
            </div>
          ) : hasPartnerAnswer ? (
            <div className="p-3 rounded-2xl bg-linear-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 space-y-1 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Ответ {partnerName} заблокирован</span>
              </div>
              <p className="text-xs text-[var(--text-2)]">
                Напишите свой ответ, чтобы мгновенно снять замок и прочитать ответ партнёра!
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-2)] flex items-center gap-1 font-medium">
              <span>💡</span>
              <span>Узнайте, что думает любимый человек сегодня</span>
            </p>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="pt-1 z-10">
          <div className="w-full py-2.5 px-4 rounded-2xl bg-[var(--surface-solid)] group-hover:bg-[var(--accent)] text-[var(--text)] group-hover:text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs border border-[var(--divider)] group-hover:border-[var(--accent)] transition-all">
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[var(--accent)] group-hover:text-white transition-colors" />
              <span>
                {bothAnswered
                  ? 'Посмотреть ответы пары'
                  : hasMyAnswer
                  ? 'Мой ответ (ждём партнёра)'
                  : hasPartnerAnswer
                  ? `Разблокировать ответ ${partnerName}`
                  : 'Ответить и открыть секрет'}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </section>

      {/* Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center">
          <div onClick={handleClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn" />

          <div className="relative z-10 w-full max-w-lg bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 border border-[var(--divider)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] animate-slideUp">
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

            {/* PARTNER ANSWER TEASER (IF PARTNER ANSWERED BUT I HAVEN'T) */}
            {!hasMyAnswer && hasPartnerAnswer && (
              <div className="p-4 rounded-2xl bg-linear-to-br from-rose-500/10 via-purple-500/10 to-transparent border border-rose-500/20 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-sm font-bold text-[var(--text)]">
                  {partnerName} уже поделился(лась) ответом!
                </div>
                <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto">
                  Напишите свой ответ в поле ниже, чтобы разблокировать признание любимого человека.
                </p>
              </div>
            )}

            {/* BOTH ANSWERED OR MY ANSWER */}
            {hasMyAnswer && !isEditingQuestionAnswer ? (
              <div className="space-y-4">
                
                {/* 1. My Answer */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ваш ответ:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUserQuestionAnswer(questionAnswer || '');
                        setIsEditingQuestionAnswer(true);
                      }}
                      className="text-xs text-[var(--text-3)] hover:text-[var(--text)] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Изменить</span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-[var(--text)] leading-relaxed pt-1">
                    «{questionAnswer}»
                  </p>
                </div>

                {/* 2. Partner Answer (Unlocked vs Pending) */}
                {bothAnswered ? (
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 fill-purple-500/20" />
                        <span>Ответ {partnerName}:</span>
                      </span>
                      <span className="text-[11px] font-semibold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        Раскрыто 🎉
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text)] leading-relaxed">
                      «{partnerAnswer}»
                    </p>

                    {/* Quick Reactions Bar */}
                    <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--text-3)]">
                        Реакция:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-transform active:scale-125 cursor-pointer ${
                              selectedEmoji === emoji
                                ? 'bg-purple-500/20 scale-110 shadow-xs'
                                : 'hover:bg-[var(--surface-3)]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text)]">
                        Ожидаем ответ от {partnerName}
                      </div>
                      <div className="text-[11px] text-[var(--text-2)] mt-0.5">
                        Как только {partnerName} ответит, ответы откроются обоим одновременно!
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  Закрыть
                </button>
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
                  {hasMyAnswer && (
                    <button
                      type="button"
                      onClick={() => setIsEditingQuestionAnswer(false)}
                      className="px-4 py-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] font-semibold text-sm transition-all active:scale-98 cursor-pointer"
                    >
                      Отмена
                    </button>
                  )}
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
