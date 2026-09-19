import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Gamepad2, Plus, LogIn, AlertCircle } from "lucide-react";
import { getPetStateApi, performPetActionApi } from "../api/pet.api.ts";
import { CouplePetState, PetActionType } from "../types.ts";
import { TamagotchiDevice } from "./TamagotchiDevice.tsx";
import { triggerHaptic } from "../utils/haptics.ts";

interface PetCardProps {
  isPaired: boolean;
}

function getToken(): string | null {
  try {
    const token = localStorage.getItem("loop_auth_token");
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
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

export const PetCard: React.FC<PetCardProps> = ({ isPaired }) => {
  const token = getToken();
  const [petState, setPetState] = useState<CouplePetState | null>(null);
  const [showDevice, setShowDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const loadPetState = async () => {
    if (!token) {
      setNeedsAuth(true);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setNeedsAuth(false);
      const state = await getPetStateApi(token);
      setPetState(state);
    } catch (e: any) {
      const msg = e.message || "Ошибка загрузки питомца";
      // Handle session expired (401)
      if (msg.includes("Сессия истекла") || msg.includes("401") || msg.includes("токен недействителен")) {
        setNeedsAuth(true);
        setError(null);
      }
      // If user is not paired in DB but frontend thinks they are
      else if (msg.includes("не состоите в паре") || msg.includes("403")) {
        setError(null);
        setPetState(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load on mount if paired
  useEffect(() => {
    if (isPaired) {
      loadPetState();
    } else {
      setPetState(null);
      setNeedsAuth(false);
    }
  }, [isPaired, token]);

  const handleAction = async (action: PetActionType) => {
    if (!token) { setNeedsAuth(true); return; }
    try {
      triggerHaptic("light");
      const result = await performPetActionApi(action, token);
      setPetState(result.state || petState);
      if (result.levelUp) {
        setTimeout(() => {
          alert(`🎉 Уровень повышен! ${petState?.name} теперь ${result.state?.level} уровня!`);
        }, 500);
      }
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("Сессия истекла") || msg.includes("401") || msg.includes("токен недействителен")) {
        setNeedsAuth(true);
      } else {
        triggerHaptic("heavy");
      }
    }
  };

  // Show auth required state
  if (!isPaired || needsAuth || !token) {
    return (
      <section className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--divider)] shadow-xs flex flex-col gap-3 transition-all hover:border-[var(--accent)]/40 cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Тамагочи союза</div>
            <div className="text-xs sm:text-sm text-[var(--text-2)] font-medium">
              {needsAuth ? "Сессия истекла — войдите заново" : "Создайте пару, чтобы завести питомца"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { window.location.href = "/"; }}
          className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/20 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>{needsAuth ? "Войти снова" : "Войти"}</span>
        </button>
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 p-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>
    );
  }

  if (error && !petState) {
    return (
      <section className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Тамагочи союза</div>
            <div className="text-xs text-[var(--text-3)]">{error}</div>
          </div>
          <button
            onClick={loadPetState}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            Повторить
          </button>
        </div>
      </section>
    );
  }

  if (!isPaired) {
    return (
      <section className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--divider)] shadow-xs flex items-center justify-between gap-3 transition-all hover:border-[var(--accent)]/40 cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Тамагочи союза</div>
            <div className="text-xs sm:text-sm text-[var(--text-2)] font-medium">Создайте пару, чтобы завести питомца</div>
          </div>
        </div>
      </section>
    );
  }

  if (error && !petState) {
    return (
      <section className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Тамагочи союза</div>
            <div className="text-xs text-[var(--text-3)]">{error}</div>
          </div>
          <button
            onClick={loadPetState}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            Повторить
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs flex flex-col gap-3 transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)] cursor-pointer group select-none"
        onClick={() => setShowDevice(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐾</span>
            <span className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Тамагочи союза</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Аркада
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-3)]">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>{petState?.level || 1}</span>
          </div>
        </div>

        {/* Pet Info */}
        {petState ? (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#0d1b0d] border border-[#1a3a1a] flex items-center justify-center shrink-0 text-3xl">
              {getMoodEmoji(petState.mood)}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text)]">{petState.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-mono">
                  Lv.{petState.level}
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-3)]">{getMoodLabel(petState.mood)}</div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-3xl animate-pulse">
              🐾
            </div>
            <div className="text-xs text-[var(--text-3)]">Загрузка питомца...</div>
          </div>
        ) : null}

        {/* Stats */}
        {petState && (
          <div className="space-y-1.5">
            <StatBar label="Сытость" value={petState.hunger} />
            <StatBar label="Энергия" value={petState.energy} />
            <StatBar label="Радость" value={petState.joy} />
          </div>
        )}

        {/* Button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowDevice(true); }}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold hover:from-amber-500/20 hover:to-rose-500/20 transition-all group-hover:shadow-sm"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Запустить игру Тамагочи</span>
          <Plus className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* Tamagotchi Device Modal */}
      <AnimatePresence>
        {showDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDevice(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            {petState && (
              <TamagotchiDevice
                isOpen={showDevice}
                onClose={() => setShowDevice(false)}
                petState={petState}
                onAction={handleAction}
                isLoading={loading}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

function StatBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 60 ? "bg-emerald-400" : value >= 30 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--text-2)] w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-[var(--text-3)] w-6 text-right">{value}%</span>
    </div>
  );
}
