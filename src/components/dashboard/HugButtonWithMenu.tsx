import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Mail, Flame, ThumbsUp, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface HugButtonWithMenuProps {
  partnerName: string;
  quickHugSent: boolean;
  onSendHug: (e?: React.MouseEvent | React.PointerEvent) => Promise<void>;
  onSendSpecificTap: (tapType: string, customNote: string, label: string) => Promise<void>;
}

export const HugButtonWithMenu: React.FC<HugButtonWithMenuProps> = ({
  partnerName,
  quickHugSent,
  onSendHug,
  onSendSpecificTap,
}) => {
  // Onboarding hint for long-press gesture discovery (shown once for 3s, saved to localStorage)
  const [showLongPressHint, setShowLongPressHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('loop_seen_hug_longpress_hint') !== 'true';
    } catch {
      return false;
    }
  });

  const [isFirstVisitPulse, setIsFirstVisitPulse] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('loop_seen_hug_longpress_hint') !== 'true';
    } catch {
      return false;
    }
  });

  const dismissLongPressHint = () => {
    setShowLongPressHint(false);
    setIsFirstVisitPulse(false);
    try {
      localStorage.setItem('loop_seen_hug_longpress_hint', 'true');
    } catch {}
  };

  useEffect(() => {
    if (!showLongPressHint) return;

    try {
      localStorage.setItem('loop_seen_hug_longpress_hint', 'true');
    } catch {}

    const hideTooltipTimer = setTimeout(() => {
      setShowLongPressHint(false);
    }, 3000);

    const pulseTimer = setTimeout(() => {
      setIsFirstVisitPulse(false);
    }, 1200);

    return () => {
      clearTimeout(hideTooltipTimer);
      clearTimeout(pulseTimer);
    };
  }, [showLongPressHint]);

  // Emotional signals for long-press contextual menu
  const EMOTIONAL_SIGNALS = [
    {
      id: 'hug',
      label: 'Обнять',
      icon: Heart,
      bg: 'bg-rose-500/15 dark:bg-rose-500/25',
      color: 'text-rose-500 dark:text-rose-400',
      action: () => onSendHug(),
    },
    {
      id: 'thinking',
      label: 'Думаю о тебе',
      icon: Sparkles,
      bg: 'bg-amber-500/15 dark:bg-amber-500/25',
      color: 'text-amber-500 dark:text-amber-400',
      action: () => onSendSpecificTap('thinking', 'Думаю о тебе прямо сейчас ✨', 'Думаю о тебе'),
    },
    {
      id: 'miss',
      label: 'Скучаю',
      icon: Mail,
      bg: 'bg-pink-500/15 dark:bg-pink-500/25',
      color: 'text-pink-500 dark:text-pink-400',
      action: () => onSendSpecificTap('miss', 'Очень скучаю по тебе 💌', 'Скучаю'),
    },
    {
      id: 'kiss',
      label: 'Поцелуй',
      icon: Flame,
      bg: 'bg-red-500/15 dark:bg-red-500/25',
      color: 'text-red-500 dark:text-red-400',
      action: () => onSendSpecificTap('kiss', 'Отправлен нежный поцелуй 💋', 'Поцелуй'),
    },
    {
      id: 'grateful',
      label: 'Ценю тебя',
      icon: ThumbsUp,
      bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
      color: 'text-emerald-600 dark:text-emerald-400',
      action: () => onSendSpecificTap('grateful', 'Спасибо тебе за то, что ты есть! ❤️', 'Ценю тебя'),
    },
  ];

  const [showRadialMenu, setShowRadialMenu] = useState<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dismissLongPressHint();
    isLongPressTriggeredRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      triggerHaptic('light');
      setShowRadialMenu(true);
    }, 380);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPosRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
    if ((dx > 15 || dy > 15) && !isLongPressTriggeredRef.current) {
      clearLongPress();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearLongPress();
    dismissLongPressHint();
    if (!isLongPressTriggeredRef.current) {
      onSendHug(e);
    }
    pointerStartPosRef.current = null;
  };

  const handlePointerCancel = () => {
    clearLongPress();
    pointerStartPosRef.current = null;
  };

  const handleSelectSignal = (sig: (typeof EMOTIONAL_SIGNALS)[0]) => {
    setShowRadialMenu(false);
    dismissLongPressHint();
    triggerHaptic('success');
    sig.action();
  };

  return (
    <section id="block-4-hug-cta" className="relative">
      {/* Long-Press Context Menu (iOS Reactions Style) */}
      <AnimatePresence>
        {showRadialMenu && (
          <>
            <div
              id="hug-menu-backdrop"
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-2xs animate-fadeIn"
              onClick={() => setShowRadialMenu(false)}
            />

            <motion.div
              id="hug-longpress-menu"
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 z-50 p-2 sm:p-2.5 rounded-3xl bg-[var(--surface-solid)] border border-[var(--divider)] shadow-2xl flex items-center justify-center gap-1.5 sm:gap-2 max-w-[calc(100vw-24px)] select-none"
            >
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 rotate-45 bg-[var(--surface-solid)] border-r border-b border-[var(--divider)]" />

              {EMOTIONAL_SIGNALS.map((sig) => {
                const Icon = sig.icon;
                return (
                  <button
                    key={sig.id}
                    id={`signal-btn-${sig.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSignal(sig);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-[var(--surface-2)] active:scale-90 transition-all cursor-pointer group shrink-0 min-w-[58px] sm:min-w-[64px]"
                  >
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${sig.bg} ${sig.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text)] whitespace-nowrap text-center leading-none">
                      {sig.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        id="main-hug-cta"
        animate={isFirstVisitPulse ? { scale: [1, 1.03, 1, 1.03, 1] } : { scale: 1 }}
        transition={
          isFirstVisitPulse
            ? { duration: 1.2, times: [0, 0.25, 0.5, 0.75, 1], ease: 'easeInOut' }
            : { type: 'spring', stiffness: 400, damping: 25 }
        }
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.96 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onClick={(e) => {
          if (isLongPressTriggeredRef.current) {
            e.preventDefault();
            return;
          }
          if (e.detail === 0) {
            onSendHug(e);
            dismissLongPressHint();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowRadialMenu(true);
          dismissLongPressHint();
          triggerHaptic('light');
        }}
        className={`w-full py-4 sm:py-4.5 px-6 rounded-full flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden transition-all duration-300 select-none ${
          quickHugSent ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : 'hug-btn-primary'
        }`}
        title="Тап — обнять. Удержание (~380мс) или три точки — выбор знака внимания"
      >
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner shrink-0 text-white transition-all ${
              quickHugSent ? 'bg-white/25' : 'bg-white/20 animate-heartbeat'
            }`}
          >
            {quickHugSent ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Heart className="w-5 h-5 fill-white text-white" />}
          </div>
          <div className="text-left min-w-0">
            <div className="text-base font-bold tracking-tight text-white leading-tight truncate">
              {quickHugSent ? 'Объятие доставлено!' : `Обнять ${partnerName}`}
            </div>
            <div className="text-xs font-medium text-white/80 leading-tight mt-0.5 truncate">
              {quickHugSent
                ? 'Партнёр чувствует ваше тепло ❤️'
                : 'Мгновенное нежное касание'}
            </div>
          </div>
        </div>

        {quickHugSent ? (
          <div className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Доставлено</span>
          </div>
        ) : (
          <div
            id="hug-options-trigger"
            role="button"
            tabIndex={0}
            title="Выбрать другой знак внимания"
            aria-label="Выбрать другой знак внимания"
            onClick={(e) => {
              e.stopPropagation();
              dismissLongPressHint();
              triggerHaptic('light');
              setShowRadialMenu(true);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                dismissLongPressHint();
                triggerHaptic('light');
                setShowRadialMenu(true);
              }
            }}
            className="relative z-20 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 text-white transition-all cursor-pointer shrink-0 backdrop-blur-xs shadow-2xs group/more"
          >
            <MoreHorizontal className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white group-hover/more:scale-110 transition-transform" />
          </div>
        )}
      </motion.button>

      {/* Quick Emotional Touch Pills (1-tap micro gestures for mobile) */}
      <div className="grid grid-cols-3 gap-2 mt-2 select-none">
        <button
          type="button"
          onClick={() => handleSelectSignal(EMOTIONAL_SIGNALS.find(s => s.id === 'miss') || EMOTIONAL_SIGNALS[2])}
          className="touch-pill-action py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <Mail className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span className="truncate">Скучаю</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectSignal(EMOTIONAL_SIGNALS.find(s => s.id === 'kiss') || EMOTIONAL_SIGNALS[3])}
          className="touch-pill-action py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">Поцелуй</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectSignal(EMOTIONAL_SIGNALS.find(s => s.id === 'thinking') || EMOTIONAL_SIGNALS[1])}
          className="touch-pill-action py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">Думаю</span>
        </button>
      </div>

      {/* Onboarding hint */}
      <AnimatePresence>
        {showLongPressHint && !showRadialMenu && (
          <motion.div
            id="hug-longpress-tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-2xl bg-[var(--surface-solid)] border border-[var(--divider)] shadow-xl flex items-center gap-2 text-xs font-semibold text-[var(--text)] whitespace-nowrap select-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0 animate-pulse" />
            <span>Зажмите, чтобы выбрать другой знак внимания</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissLongPressHint();
              }}
              className="ml-1 text-[var(--text-3)] hover:text-[var(--text)] p-0.5 rounded-full transition-colors cursor-pointer"
              title="Понятно"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
