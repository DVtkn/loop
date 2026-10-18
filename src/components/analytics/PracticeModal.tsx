import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, CheckCircle2, Heart } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export interface PracticeInfo {
  id: string;
  title: string;
  duration: string;
  description: string;
  xp: number;
  dimensionTitle: string;
}

interface PracticeModalProps {
  practice: PracticeInfo | null;
  onClose: () => void;
  onComplete: (xp: number, title: string) => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  practice,
  onClose,
  onComplete,
}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (practice) {
      setIsCompleted(false);
      setIsTimerRunning(false);
      // parse minutes to seconds if applicable
      const match = practice.duration.match(/\d+/);
      const mins = match ? parseInt(match[0], 10) : 3;
      setSecondsLeft(mins * 60);
    }
  }, [practice]);

  useEffect(() => {
    if (!isTimerRunning || secondsLeft === null || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  if (!practice) return null;

  const handleFinish = () => {
    triggerHaptic('success');
    setIsCompleted(true);
    onComplete(practice.xp, practice.title);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[var(--surface-solid)] border border-[var(--divider)] rounded-[28px] p-6 shadow-2xl relative overflow-hidden space-y-5"
        >
          {/* Header Close */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[11px] border border-rose-500/20">
                  Микро-практика пары
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>+{practice.xp} XP</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-[var(--text)] tracking-tight">
                {practice.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-3)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description & Instruction */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)]/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
              <Heart className="w-3.5 h-3.5 fill-[var(--accent)]" />
              <span>Инструкция для двоих:</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed font-normal">
              {practice.description}
            </p>
          </div>

          {/* Optional Timer */}
          {secondsLeft !== null && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-[var(--text-2)]">Таймер сближения:</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-black text-[var(--text)]">
                  {formatTimer(secondsLeft)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--text)] hover:bg-rose-500/15 hover:text-rose-500 text-xs font-bold transition-all cursor-pointer"
                >
                  {isTimerRunning ? 'Пауза' : 'Старт'}
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div>
            {isCompleted ? (
              <div className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md animate-scaleIn">
                <CheckCircle2 className="w-5 h-5" />
                <span>Практика выполнена! +{practice.xp} XP</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-98 text-white font-black text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Завершить практику (+{practice.xp} XP)</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
