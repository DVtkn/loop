import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Gamepad2, Plus, LogIn, AlertCircle, Sparkles } from "lucide-react";
import { 
  getPetStateApi, 
  birthPetApi, 
  performPetActionApi 
} from "../api/pet.api.ts";
import { CouplePetState, PetActionType, PetSpecies } from "../types.ts";
import { TamagotchiDevice } from "./TamagotchiDevice.tsx";
import { LoopConsole } from "./LoopConsole.tsx";
import { triggerHaptic } from "../utils/haptics.ts";
import { safeGetStorage } from "../utils/safeStorage.ts";

interface PetCardProps {
  isPaired: boolean;
}

function getToken(): string | null {
  try {
    const token = safeGetStorage<string | null>("loop_auth_token", null);
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

const SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: "🐕",
  cat: "🐱",
};

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

function getStatColor(value: number): string {
  if (value >= 70) return "bg-emerald-400";
  if (value >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

export const PetCard: React.FC<PetCardProps> = ({ isPaired }) => {
  const token = getToken();
  const [petState, setPetState] = useState<CouplePetState | null>(null);
  const [showDevice, setShowDevice] = useState(false);
  const [showGameConsole, setShowGameConsole] = useState(false);
  const [gameConsolePetState, setGameConsolePetState] = useState<CouplePetState | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<"species" | "name">("species");
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>("dog");
  const [petName, setPetName] = useState("Бусинка");

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
      setShowGameConsole(false); // Hide game console when reloading state
      setGameConsolePetState(null);
      const state = await getPetStateApi(token);
      setPetState(state);
      if (state.isOnboardingCompleted === false) {
        setShowOnboarding(true);
      }
    } catch (e: any) {
      const msg = e.message || "Ошибка загрузки питомца";
      if (msg.includes("Сессия истекла") || msg.includes("401") || msg.includes("токен недействителен")) {
        setNeedsAuth(true);
        setError(null);
      } else if (msg.includes("не состоите в паре") || msg.includes("403")) {
        setError(null);
        setPetState(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConsole = () => {
    if (petState && petState.isOnboardingCompleted) {
      setShowGameConsole(true);
      setGameConsolePetState(petState);
    } else {
      setShowDevice(true);
    }
  };

  // Load on mount if paired
  useEffect(() => {
    if (isPaired) {
      loadPetState();
    } else {
      setPetState(null);
      setNeedsAuth(false);
      setShowOnboarding(false);
    }
  }, [isPaired, token]);

  const handleBirth = async () => {
    if (!token) { setNeedsAuth(true); return; }
    try {
      setLoading(true);
      const result = await birthPetApi({ species: selectedSpecies, name: petName }, token);
      setPetState(result);
      setShowOnboarding(false);
      setShowDevice(true);
      triggerHaptic("success");
    } catch (e: any) {
      setError(e.message || "Ошибка создания питомца");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: PetActionType) => {
    if (!token) { setNeedsAuth(true); return; }
    try {
      triggerHaptic("light");
      const result = await performPetActionApi(action, token);
      setPetState(result.state || petState);
      if (result.levelUp || result.leveledUp) {
        triggerHaptic("success");
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

  // Onboarding modal
  if (showOnboarding) {
    return (
      <>
        <section className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐾</span>
            <span className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Тамагочи союза</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Аркада
            </span>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl mb-2">{SPECIES_EMOJI[selectedSpecies]}</div>
            <h3 className="font-bold text-lg text-[var(--text)] mb-1">Оживи питомца пары</h3>
            <p className="text-sm text-[var(--text-2)] mb-4">Получи +50 XP союза за рождение питомца!</p>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-[var(--text-2)] mb-2">Выбери питомца</label>
                <div className="flex justify-center gap-3">
                  {(["dog", "cat"] as PetSpecies[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSpecies(s)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedSpecies === s 
                          ? "border-amber-400 bg-amber-400/10" 
                          : "border-[var(--divider)] hover:border-[var(--accent)]/40"
                      }`}
                    >
                      <span className="text-3xl block">{SPECIES_EMOJI[s]}</span>
                      <span className="text-xs font-medium text-[var(--text-2)]">
                        {s === "dog" ? "Чихуахуа" : "Кошечка"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-[var(--text-2)] mb-2">Имя питомца</label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value.slice(0, 20))}
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text)] placeholder-[var(--text-3)] text-sm focus:border-[var(--accent)] focus:outline-none"
                  placeholder="Бусинка"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleBirth}
              disabled={loading || !petName.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Рождение..." : "Запустить консоль LOOP.exe 🎮"}
            </button>
          </div>
        </section>
      </>
    );
  }

  // No pet state loaded yet
  if (!petState && loading) {
    return (
      <section className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 animate-pulse">
            <span className="text-2xl">🐾</span>
          </div>
          <div className="text-xs text-[var(--text-3)]">Загрузка питомца...</div>
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
            <span className="text-lg">{petState ? SPECIES_EMOJI[petState.species] : "🐾"}</span>
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
              {getMoodEmoji(petState.mood || 'happy')}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text)]">{petState.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-mono">
                  Lv.{petState.level}
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-3)]">{getMoodLabel(petState.mood || 'happy')}</div>
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

        {/* Stats - 4 bars */}
        {petState && (
          <div className="space-y-1.5">
            <StatBar label="Сытость" value={petState.hunger} color={getStatColor(petState.hunger)} />
            <StatBar label="Радость" value={petState.joy} color={getStatColor(petState.joy)} />
            <StatBar label="Энергия" value={petState.energy} color={getStatColor(petState.energy)} />
            <StatBar label="Чистота" value={petState.cleanliness} color={getStatColor(petState.cleanliness)} />
          </div>
        )}

        {/* XP Bar */}
        {petState && petState.xpForNextLevel && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-2)] w-12 shrink-0">XP</span>
            <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (petState.xpProgress || 0) / petState.xpForNextLevel * 100)}%` }} 
              />
            </div>
            <span className="text-[10px] text-amber-400 w-8 text-right">
              {petState.xpProgress}/{petState.xpForNextLevel}
            </span>
          </div>
        )}

        {/* Button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpenConsole(e); }}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-600 dark:text-amber-400 text-sm font-bold hover:from-amber-500/20 hover:to-rose-500/20 transition-all group-hover:shadow-sm"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Запустить игру Тамагочи</span>
          <Plus className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

{/* Onboarding Console Modal */}
        {showDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDevice(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            {petState ? (
              <LoopConsole
                isOpen={showDevice}
                onClose={() => setShowDevice(false)}
                initialPetState={{
                  name: petState.name,
                  hunger: petState.hunger,
                  energy: petState.energy,
                  joy: petState.joy,
                  level: petState.level,
                  experience: petState.experience,
                  mood: petState.mood,
                }}
                onPetCreated={(updatedPetState) => {
                  setPetState(updatedPetState);
                  setShowDevice(false);
                  // Show game console after pet is created
                  setShowGameConsole(true);
                  setGameConsolePetState(updatedPetState);
                }}
              />
            ) : (
              <LoopConsole
                isOpen={showDevice}
                onClose={() => setShowDevice(false)}
                onPetCreated={(petState) => {
                  setPetState(petState);
                  setShowDevice(false);
                  // Show game console after pet is created
                  setShowGameConsole(true);
                  setGameConsolePetState(petState);
                }}
              />
            )}
          </motion.div>
        )}
        
        {/* Game Console Modal */}
        {showGameConsole && gameConsolePetState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowGameConsole(false);
              setGameConsolePetState(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <TamagotchiDevice
              isOpen={showGameConsole}
              onClose={() => {
                setShowGameConsole(false);
                setGameConsolePetState(null);
              }}
              petState={{
                name: gameConsolePetState.name,
                hunger: gameConsolePetState.hunger,
                energy: gameConsolePetState.energy,
                joy: gameConsolePetState.joy,
                level: gameConsolePetState.level,
                experience: gameConsolePetState.experience,
                mood: gameConsolePetState.mood,
              }}
              onAction={async (action: PetActionType) => {
                if (!token) return;
                try {
                  setGameLoading(true);
                  const result = await performPetActionApi(action, token);
                  // Update the game console state with the result
                  setGameConsolePetState(result.state || gameConsolePetState);
                  // Also update the main pet state
                  setPetState(result.state || petState);
                } catch (e: any) {
                  console.error("Game action error:", e);
                } finally {
                  setGameLoading(false);
                }
              }}
              isLoading={gameLoading}
            />
          </motion.div>
        )}
    </>
  );
};

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--text-2)] w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-[var(--text-3)] w-6 text-right">{value}%</span>
    </div>
  );
}