import React, { useEffect } from 'react';
import { Heart, X, Send } from 'lucide-react';

interface QuickActionModalProps {
  activeQuickAction: string | null;
  quickActionText: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  activeQuickAction,
  quickActionText,
  onChangeText,
  onClose,
  onSubmit,
}) => {
  useEffect(() => {
    if (!activeQuickAction) onChangeText('');
  }, [activeQuickAction, onChangeText]);
  const handleClose = () => {
    onChangeText('');
    onClose();
  };
  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
    onChangeText('');
  };
  if (!activeQuickAction) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center">
      <div onClick={handleClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn" />

      <div className="relative z-10 w-full max-w-lg bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 border border-[var(--divider)] shadow-2xl space-y-0 max-h-[90vh] flex flex-col pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] animate-slideUp">
        <div className="w-10 h-1 rounded-full bg-[var(--divider)] mx-auto sm:hidden mb-3 shrink-0" />

        <div className="flex items-center justify-between shrink-0 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center">
              <Heart className="w-5 h-5 fill-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text)] leading-tight">
                {activeQuickAction === 'felt'
                  ? 'Я почувствовал(а)'
                  : activeQuickAction === 'appreciated'
                  ? 'Я ценю и благодарю'
                  : 'Хочу рассказать'}
              </h3>
              <p className="text-xs text-[var(--text-2)]">
                {activeQuickAction === 'felt'
                  ? 'Бережно опишите эмоцию без критики'
                  : 'Отправьте тёплый знак внимания'}
              </p>
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-3.5">
          <textarea
            value={quickActionText}
            onChange={(e) => onChangeText(e.target.value)}
            rows={3}
            placeholder={
              activeQuickAction === 'felt'
                ? 'Например: Мне было очень тепло, когда ты обнял(а) меня утром...'
                : activeQuickAction === 'appreciated'
                ? 'Например: Спасибо за твою заботу и вкусный завтрак сегодня!'
                : 'Например: Давай сегодня вечером вместе посмотрим фильм...'
            }
            className="w-full p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-none"
            autoFocus
          />

          <div className="flex items-center gap-2 pt-2 border-t border-[var(--divider)] shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!quickActionText.trim()}
              className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Отправить в ленту пары</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
