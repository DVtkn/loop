import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, Sparkles, ChevronRight } from 'lucide-react';
import { isIOSDevice, isStandaloneApp, safeGetStorage, safeSetStorage } from '../utils/safeStorage.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface IOSInstallPromptProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const IOSInstallPrompt: React.FC<IOSInstallPromptProps> = ({ forceOpen = false, onClose }) => {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showFullModal, setShowFullModal] = useState<boolean>(forceOpen);

  useEffect(() => {
    try {
      setIsIOS(isIOSDevice());
      setIsStandalone(isStandaloneApp());
      const wasDismissed = safeGetStorage('together_ios_prompt_dismissed', false);
      if (wasDismissed && !forceOpen) {
        setDismissed(true);
      }
    } catch {
      // safe fallback
    }
  }, [forceOpen]);

  useEffect(() => {
    if (forceOpen) setShowFullModal(true);
  }, [forceOpen]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowFullModal(false);
    safeSetStorage('together_ios_prompt_dismissed', true);
    if (onClose) onClose();
  };

  const isVisible = forceOpen || (isIOS && !isStandalone && !dismissed);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Subtle, Elegant Strip (Flo & Couple Joy aesthetic, non-intrusive) */}
      {!showFullModal && (
        <aside aria-label="Установка приложения" className="w-full bg-[var(--surface-blush)]/80 backdrop-blur-md border-b border-[var(--accent)]/15 px-3 py-1.5 sm:px-4 sm:py-2 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowFullModal(true);
              }}
              className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[var(--text)] leading-tight">
                  Добавьте на экран «Домой»
                </span>
                <span className="text-[10px] bg-rose-500/15 text-[var(--accent)] px-1.5 py-0.2 rounded-full font-semibold">
                  PWA
                </span>
                <span className="text-[11px] text-[var(--text-2)] hidden sm:inline">
                  Полноэкранный режим без Safari
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setShowFullModal(true);
                }}
                className="text-xs font-bold text-[var(--accent)] hover:underline px-2.5 py-1.5 min-h-[36px] flex items-center cursor-pointer"
              >
                Инструкция
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors shrink-0 cursor-pointer p-1 active:scale-95"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Detailed Step-by-Step Bottom Sheet Modal (Only when explicitly opened) */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center">
          <div
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
          />

          <div className="relative z-10 w-full max-w-md bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 border border-[var(--divider)] shadow-2xl space-y-4 animate-slideUp pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))]">
            <div className="w-10 h-1 rounded-full bg-[var(--divider)] mx-auto sm:hidden mb-1 shrink-0" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[var(--text)] flex items-center gap-1.5">
                    <span>Добавьте на экран «Домой»</span>
                  </h4>
                  <p className="text-xs text-[var(--text-2)]">
                    Работает на весь экран без рамок Safari
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Step Instruction */}
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-3 text-xs">
              <div className="flex items-center gap-3 text-[var(--text)]">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-solid)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-[var(--accent)]/20">
                  1
                </span>
                <span>
                  Нажмите кнопку <strong className="font-bold">«Поделиться»</strong> внизу экрана Safari{' '}
                  <Share className="w-3.5 h-3.5 inline-block text-[var(--accent)] -mt-0.5 ml-0.5" />
                </span>
              </div>

              <div className="flex items-center gap-3 text-[var(--text)]">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-solid)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-[var(--accent)]/20">
                  2
                </span>
                <span>
                  Прокрутите вниз и выберите <strong className="font-bold">«На экран „Домой“»</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline-block text-[var(--accent)] -mt-0.5 ml-0.5" />
                </span>
              </div>

              <div className="flex items-center gap-3 text-[var(--text)]">
                <span className="w-6 h-6 rounded-full bg-[var(--surface-solid)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-[var(--accent)]/20">
                  3
                </span>
                <span>
                  Нажмите <strong className="text-[var(--accent)] font-bold">«Добавить»</strong> в правом верхнем углу
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl bg-[var(--accent)] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
