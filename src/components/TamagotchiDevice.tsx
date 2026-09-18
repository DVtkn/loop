import React from "react";
import { PetActionType } from "../types.ts";

export interface GameEvent {
  type: "feed" | "sleep" | "score" | "play" | "error";
  title: string;
  description?: string;
  timestamp: number;
}

interface TamagotchiState {
  name: string;
  hunger: number;
  energy: number;
  joy: number;
  level: number;
  exp: number;
  mood: string;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: "😺",
  sleepy: "😴",
  hungry: "😋",
  playful: "🎮",
  loved: "❤️",
};

const MOOD_LABEL: Record<string, string> = {
  happy: "Счастлив",
  sleepy: "Хочет спать",
  hungry: "Голодный",
  playful: "Игрив",
  loved: "Ласковый",
};

function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[mood] || "😺";
}

function getMoodLabel(mood: string): string {
  return MOOD_LABEL[mood] || mood;
}

function getBarColor(value: number): string {
  if (value >= 60) return "bg-emerald-400";
  if (value >= 30) return "bg-amber-400";
  return "bg-rose-400";
}

interface TamagotchiDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  petState: TamagotchiState;
  onAction: (action: PetActionType) => Promise<void>;
  isLoading?: boolean;
}

export const TamagotchiDevice: React.FC<TamagotchiDeviceProps> = ({
  isOpen,
  onClose,
  petState,
  onAction,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const bars = [
    { label: "Сытость", value: petState.hunger, key: "hunger" as const },
    { label: "Энергия", value: petState.energy, key: "energy" as const },
    { label: "Радость", value: petState.joy, key: "joy" as const },
  ];

  const handleAction = async (action: PetActionType) => {
    if (isLoading) return;
    await onAction(action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Device */}
      <div
        className="relative z-10 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Y2K device shell */}
        <div className="rounded-[2.5rem] p-1 bg-gradient-to-br from-[#ff6b9d] via-[#c44dff] to-[#6b8aff] shadow-2xl">
          <div className="rounded-[2rem] bg-[#1a0a2e] p-5 space-y-4">
            {/* Screen bezel */}
            <div className="rounded-xl bg-[#0d1b0d] border-2 border-[#1a3a1a] p-3 shadow-inner">
              {/* CRT screen */}
              <div className="rounded-lg bg-[#0a1a0a] border border-[#1a4a1a] overflow-hidden relative">
                {/* Scanline overlay */}
                <div className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
                  }}
                />
                {/* Screen content */}
                <div className="p-4 space-y-3 relative z-0">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#33ff33] opacity-60">LOOP-PET v1.0</span>
                    <span className="text-[10px] font-mono text-[#33ff33] opacity-60">{petState.level}.{String(petState.exp).padStart(2, "0")}</span>
                  </div>

                  {/* Pet avatar */}
                  <div className="flex flex-col items-center py-2">
                    <div className="text-6xl mb-1 animate-bounce">{getMoodEmoji(petState.mood)}</div>
                    <div className="text-[#33ff33] font-mono text-sm font-bold">{petState.name}</div>
                    <div className="text-[#33ff33] opacity-60 font-mono text-[10px]">{getMoodLabel(petState.mood)}</div>
                  </div>

                  {/* Status bars */}
                  <div className="space-y-1.5">
                    {bars.map((bar) => (
                      <div key={bar.key} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-[#33ff33] w-12 shrink-0">{bar.label}</span>
                        <div className="flex-1 h-2 bg-[#0a2a0a] rounded-full overflow-hidden border border-[#1a3a1a]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(bar.value)}`}
                            style={{ width: `${bar.value}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#33ff33] w-6 text-right">{bar.value}%</span>
                      </div>
                    ))}
                  </div>

                  {/* XP bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-[#33ff33] w-12 shrink-0">XP</span>
                    <div className="flex-1 h-1.5 bg-[#0a2a0a] rounded-full overflow-hidden border border-[#1a3a1a]">
                      <div
                        className="h-full bg-[#c44dff] rounded-full transition-all duration-500"
                        style={{ width: `${petState.exp}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-[#c44dff] w-6 text-right">{petState.exp}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Physical buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <ActionButton
                label="🍖 Покормить"
                onClick={() => handleAction("feed")}
                loading={isLoading}
                color="bg-amber-500/20 hover:bg-amber-500/30"
                textColor="text-amber-400"
              />
              <ActionButton
                label="🎮 Поиграть"
                onClick={() => handleAction("play")}
                loading={isLoading}
                color="bg-sky-500/20 hover:bg-sky-500/30"
                textColor="text-sky-400"
              />
              <ActionButton
                label="💤 Спать"
                onClick={() => handleAction("sleep")}
                loading={isLoading}
                color="bg-indigo-500/20 hover:bg-indigo-500/30"
                textColor="text-indigo-400"
              />
              <ActionButton
                label="🤗 Ласка"
                onClick={() => handleAction("pet")}
                loading={isLoading}
                color="bg-rose-500/20 hover:bg-rose-500/30"
                textColor="text-rose-400"
              />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-mono text-[#33ff33]/60 hover:text-[#33ff33] transition-colors"
            >
              [ Закрыть ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  color: string;
  textColor: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, loading, color, textColor }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`py-3 rounded-xl border border-white/10 ${color} ${textColor} font-mono text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {loading ? "..." : label}
  </button>
);
