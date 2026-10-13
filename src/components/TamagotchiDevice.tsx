import React from "react";
import { PetActionType, PetSpecies } from "../types.ts";

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
  experience: number;
  mood: string;
  synergy?: number;
  species?: PetSpecies;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: "😺",
  sleepy: "😴",
  hungry: "😋",
  playful: "🎮",
  loved: "❤️",
  dirty: "🧼",
};

const MOOD_LABEL: Record<string, string> = {
  happy: "Счастлив",
  sleepy: "Хочет спать",
  hungry: "Голодный",
  playful: "Игрив",
  loved: "Ласковый",
  dirty: "Грязнуля",
};

const MOOD_BUBBLE: Record<string, string> = {
  happy: "Тяв! Люблю вас!💖",
  sleepy: "Клюю носом...💤",
  hungry: "Кушать!💖",
  playful: "Поиграем?🎾",
  loved: "Муррр~ +5❤️",
  dirty: "Буль-буль! Чистота!🧼",
};

function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[mood] || "😺";
}

function getMoodLabel(mood: string): string {
  return MOOD_LABEL[mood] || mood;
}

function getMoodBubble(mood: string): string {
  return MOOD_BUBBLE[mood] || "Привет!🐾";
}

const BAR_COLORS: Record<string, string> = {
  hunger: "bg-[#BA0029]",
  energy: "bg-[#00BCD4]",
  joy: "bg-[#EAB308]",
};

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
    { label: "Сыт", value: petState.hunger, key: "hunger" as const },
    { label: "Рад", value: petState.joy, key: "joy" as const },
    { label: "Энрг", value: petState.energy, key: "energy" as const },
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
        {/* Pink console shell */}
        <div
          className="rounded-[40px] p-3.5 bg-[#FFCAD4] border-[3px] border-[#111C2D]"
          style={{ boxShadow: "0 12px 0 #111C2D" }}
        >
          {/* Link LED pill */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1.5 bg-[#111C2D] rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="font-pixel text-[8px] text-white tracking-wider">LINK OK•DUO</span>
            </div>
          </div>

          {/* LCD screen */}
          <div className="rounded-[24px] bg-[#E8F5E9] border-[3px] border-[#111C2D] p-3 shadow-inner relative overflow-hidden">
            {/* Dot-matrix texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: "radial-gradient(#111C2D 1px, transparent 1px)", backgroundSize: "6px 6px" }}
            />
            <div className="relative space-y-2.5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[8px] text-[#111C2D]">LOOP.EXE</span>
                <span className="font-vt text-sm text-[#111C2D]/70">Lv.{petState.level} · {petState.experience}XP</span>
              </div>

              {/* Mood bubble */}
              <div className="flex justify-center">
                <div className="bg-white border-2 border-[#111C2D] rounded-2xl rounded-bl-sm px-3 py-1 shadow-[2px_2px_0_#111C2D]">
                  <span className="text-xs font-bold text-[#111C2D]">{getMoodBubble(petState.mood)}</span>
                </div>
              </div>

              {/* Pet avatar */}
              <div className="flex flex-col items-center">
                <div className="text-6xl animate-bounce">{getMoodEmoji(petState.mood)}</div>
                <div className="font-pixel text-[11px] text-[#111C2D] mt-1">{petState.name}</div>
                <div className="font-vt text-sm text-[#111C2D]/70">{getMoodLabel(petState.mood)}</div>
              </div>

              {/* Status bars */}
              <div className="grid grid-cols-3 gap-1.5">
                {bars.map((bar) => (
                  <div key={bar.key} className="bg-white/90 border-[1.5px] border-[#111C2D] rounded-lg p-1">
                    <div className="font-pixel text-[7px] text-[#111C2D] text-center">{bar.label}</div>
                    <div className="h-2 rounded-full bg-[#111C2D]/10 overflow-hidden mt-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[bar.key]}`}
                        style={{ width: `${Math.max(0, Math.min(100, bar.value))}%` }}
                      />
                    </div>
                    <div className="font-vt text-xs text-center text-[#111C2D] leading-none">{Math.round(bar.value)}%</div>
                  </div>
                ))}
              </div>

              {/* Synergy */}
              {petState.synergy !== undefined && (
                <div className="bg-white/90 border-[1.5px] border-[#111C2D] rounded-lg p-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-[7px] text-[#111C2D]">СИНЕРГИЯ ДУО</span>
                    <span className="font-vt text-xs text-[#111C2D]">{petState.synergy}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#111C2D]/10 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FB083C] via-[#FFD600] to-[#22C55E] transition-all duration-500"
                      style={{ width: `${petState.synergy}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Physical buttons 2x2 */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <ConsoleActionButton label="🍖 КОРМ" xp="+15 XP" onClick={() => handleAction("feed")} loading={isLoading} bg="bg-[#FFE600]" />
            <ConsoleActionButton label="🎾 ИГРА" xp="+20 XP" onClick={() => handleAction("play")} loading={isLoading} bg="bg-[#06B6D4]" />
            <ConsoleActionButton label="💤 СПАТЬ" xp="+25 XP" onClick={() => handleAction("sleep")} loading={isLoading} bg="bg-[#A855F7]" light />
            <ConsoleActionButton label="🤗 ЛАСКА" xp="+10 XP" onClick={() => handleAction("hug")} loading={isLoading} bg="bg-[#FB083C]" light />
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2.5 py-2 rounded-full bg-[#111C2D] text-white font-pixel text-[9px] tracking-wider active:translate-y-0.5 transition-transform"
          >
            [ B ] НАЗАД
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConsoleActionButtonProps {
  label: string;
  xp: string;
  onClick: () => void;
  loading?: boolean;
  bg: string;
  light?: boolean;
}

const ConsoleActionButton: React.FC<ConsoleActionButtonProps> = ({ label, xp, onClick, loading, bg, light }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`relative py-2.5 rounded-2xl border-2 border-[#111C2D] ${bg} ${light ? "text-white" : "text-[#111C2D]"} font-pixel text-[9px] transition-all active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed`}
    style={{ boxShadow: "0 3px 0 #111C2D" }}
  >
    {loading ? "..." : label}
    <span className={`absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full border border-[#111C2D] bg-white font-vt text-[10px] leading-none ${light ? "text-[#111C2D]" : "text-[#111C2D]"}`}>
      {xp}
    </span>
  </button>
);
