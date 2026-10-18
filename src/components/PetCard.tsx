import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Gamepad2, Plus, Sparkles, Utensils, Smile, Moon, Bath } from 'lucide-react';
import { getPetStateApi, performPetActionApi } from '../api/pet.api.ts';
import { CouplePetState, PetActionType, PetSpecies } from '../types.ts';
import { LoopConsole } from './LoopConsole.tsx';
import { PetAvatarLiving } from './pet/PetAvatarLiving.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { play8BitAudio } from '../utils/audio8Bit.ts';
import { dispatchInAppNotification } from '../utils/pushManager.ts';
import { safeGetStorage } from '../utils/safeStorage.ts';
import {
  PET_SPECIES_DETAILS,
  STATE_PET_QUOTES,
  getPetVisualStatus,
  PetVisualStatus,
} from '../data/petData.ts';

interface PetCardProps {
  isPaired: boolean;
}

function getToken(): string | null {
  try {
    const token = safeGetStorage<string | null>('loop_auth_token', null);
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

function getStatColor(value: number): string {
  if (value >= 70) return 'bg-emerald-400';
  if (value >= 40) return 'bg-amber-400';
  return 'bg-rose-400';
}

export const PetCard: React.FC<PetCardProps> = ({ isPaired }) => {
  const token = getToken();
  const [petState, setPetState] = useState<CouplePetState | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const [floatingHeart, setFloatingHeart] = useState<{ id: number; text: string } | null>(null);

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
      const msg = e.message || 'Ошибка загрузки питомца';
      if (msg.includes('Сессия истекла') || msg.includes('401') || msg.includes('токен недействителен')) {
        setNeedsAuth(true);
        setError(null);
      } else if (msg.includes('не состоите в паре') || msg.includes('403')) {
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
    triggerHaptic('light');
    play8BitAudio('boot');
    setShowConsole(true);
  };

  // Quick care actions directly from dashboard
  const handleQuickAction = async (action: PetActionType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || quickActionLoading || !petState) return;

    try {
      setQuickActionLoading(true);
      triggerHaptic('medium');
      if (action === 'feed') play8BitAudio('feed');
      else if (action === 'play') play8BitAudio('play');
      else if (action === 'wash') play8BitAudio('wash');
      else if (action === 'sleep') play8BitAudio('sleep');
      else play8BitAudio('purr');

      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 600);

      const res = await performPetActionApi(action, token);
      if (res.state) {
        setPetState(res.state);
      }

      const rewardText =
        action === 'feed'
          ? '+15 XP 🍓'
          : action === 'play'
          ? '+20 XP ⚡'
          : action === 'wash'
          ? '+15 XP 🧼'
          : action === 'sleep'
          ? '+25 XP 💤'
          : '+10 XP ❤️';
      setFloatingHeart({ id: Date.now(), text: rewardText });
      setTimeout(() => setFloatingHeart(null), 1400);
    } catch (err) {
      console.error('Quick action failed:', err);
    } finally {
      setQuickActionLoading(false);
    }
  };

  const handleTapPet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('selection');
    play8BitAudio(petState?.species === 'cat' ? 'purr' : 'play');
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    const species = petState?.species || 'dog';
    const isNight = new Date().getHours() >= 23 || new Date().getHours() < 7;
    const currentStatus = petState ? getPetVisualStatus(petState, isNight) : null;
    const pool = currentStatus
      ? STATE_PET_QUOTES[species]?.[currentStatus.stateType] || STATE_PET_QUOTES[species]?.happy || []
      : [];
    setQuoteIndex((prev) => (prev + 1) % Math.max(1, pool.length));

    setFloatingHeart({ id: Date.now(), text: '💖 мур!' });
    setTimeout(() => setFloatingHeart(null), 1200);
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

  const careNotifiedRef = useRef<string | null>(null);

  // Daily notification check
  useEffect(() => {
    if (!petState || !petState.isOnboardingCompleted) return;
    const lowStat = (['hunger', 'joy', 'energy', 'cleanliness'] as const).some(
      (k) => petState[k] < 30
    );
    if (!lowStat) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `${petState.id}:${day}`;
    if (careNotifiedRef.current === key) return;
    careNotifiedRef.current = key;
    dispatchInAppNotification({
      title: `${petState.name} скучает 🐾`,
      body: 'Питомцу союза нужен уход — загляни в LOOP.exe',
      icon: 'pet',
    });
  }, [petState]);

  // Fallback state when not paired or needs auth
  if (!isPaired || needsAuth || !token) {
    return (
      <>
        <section
          onClick={handleOpenConsole}
          className="p-5 sm:p-6 rounded-[32px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-col gap-4 transition-all cursor-pointer group select-none relative overflow-hidden"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-3xl shadow-xs group-hover:scale-105 transition-transform">
              🥚
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[var(--text)] leading-tight">
                  Питомец союза
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/20">
                  Совместный друг
                </span>
              </div>
              <div className="text-xs text-[var(--text-2)] font-medium leading-relaxed">
                Вырастите общего щенка или котёнка: заботьтесь каждый день и копите совместные бонусы
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenConsole();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[var(--surface-blush)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white text-xs sm:text-sm font-bold active:scale-98 transition-all shadow-xs border border-[var(--accent)]/20"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Выбрать и оживить питомца</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </section>

        {showConsole && (
          <LoopConsole
            isOpen={showConsole}
            onClose={() => setShowConsole(false)}
            initialPetState={petState && petState.isOnboardingCompleted ? petState : undefined}
            onPetCreated={(newPet) => setPetState(newPet)}
            onPetUpdated={(updatedPet) => setPetState(updatedPet)}
          />
        )}
      </>
    );
  }

  const hasPet = petState !== null && petState.isOnboardingCompleted;
  const species = petState?.species || 'dog';
  const speciesMeta = PET_SPECIES_DETAILS[species];
  const isNight = new Date().getHours() >= 23 || new Date().getHours() < 7;
  const isSleepy = petState?.mood === 'sleepy' || isNight;

  const currentSpeech =
    petState?.hunger && petState.hunger < 35
      ? MOOD_BUBBLES.hungry
      : petState?.joy && petState.joy < 35
      ? MOOD_BUBBLES.playful
      : isSleepy
      ? MOOD_BUBBLES.sleepy
      : (FUNNY_PET_QUOTES[species] && FUNNY_PET_QUOTES[species][quoteIndex]) || MOOD_BUBBLES.happy;

  return (
    <>
      <section
        onClick={handleOpenConsole}
        className="p-5 sm:p-6 rounded-[32px] bg-linear-to-b from-[var(--surface-solid)] to-[var(--surface-2)]/30 border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-col gap-4 transition-all cursor-pointer group select-none relative overflow-hidden"
      >
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[var(--accent)]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{species === 'dog' ? '🐕' : '🐱'}</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg text-[var(--text)] tracking-tight">
                {hasPet ? petState.name : 'Тамагочи пары'}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/20 shadow-2xs">
                Lv. {hasPet ? petState.level : 1}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              <span>{hasPet ? petState.experience : 0} XP</span>
            </span>
          </div>
        </div>

        {/* Living Pet Center Area */}
        {hasPet ? (
          <div className="flex flex-col sm:flex-row items-center gap-5 my-1 z-10">
            {/* Pet Sprite Character with Floating Speech Bubble */}
            <div className="relative flex flex-col items-center">
              {/* Floating Heart Effect */}
              <AnimatePresence>
                {floatingHeart && (
                  <motion.div
                    key={floatingHeart.id}
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -36, scale: 1.15 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute -top-6 font-black text-xs px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-lg z-30 pointer-events-none whitespace-nowrap"
                  >
                    {floatingHeart.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Speech Bubble */}
              <motion.div
                key={currentSpeech}
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mb-2 px-3 py-1.5 rounded-2xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--divider)] shadow-xs text-xs font-semibold max-w-[210px] text-center leading-snug"
              >
                {currentSpeech}
              </motion.div>

              {/* Character Avatar / Sprite */}
              <motion.div
                animate={isBouncing ? { y: [-6, 0, -4, 0], scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
                onClick={handleTapPet}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-linear-to-b from-amber-100/60 to-rose-100/40 dark:from-zinc-800 dark:to-zinc-900 border-2 border-[var(--divider)] flex items-center justify-center p-2 shadow-md relative group/sprite hover:scale-103 transition-transform cursor-pointer"
                title="Погладить питомца"
              >
                {!imgError ? (
                  <img
                    src={isSleepy ? SLEEP_IMAGE : speciesMeta?.image || '/assets/tamagotchi/dog-happy.png'}
                    alt={petState.name}
                    className="w-full h-full object-contain rounded-2xl select-none"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-4xl">{species === 'dog' ? '🐶' : '🐱'}</span>
                )}
              </motion.div>
            </div>

            {/* Right side: Stats & Quick Care Actions */}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1.5 bg-[var(--surface-2)]/60 p-3 rounded-2xl border border-[var(--divider)]/60">
                <StatBar label="Сытость" value={petState.hunger} color={getStatColor(petState.hunger)} />
                <StatBar label="Радость" value={petState.joy} color={getStatColor(petState.joy)} />
                <StatBar label="Энергия" value={petState.energy} color={getStatColor(petState.energy)} />
                <StatBar label="Чистота" value={petState.cleanliness} color={getStatColor(petState.cleanliness)} />
              </div>

              {/* Quick Action Pills */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={(e) => handleQuickAction('feed', e)}
                  disabled={quickActionLoading}
                  className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20 active:scale-96"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Покормить</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleQuickAction('play', e)}
                  disabled={quickActionLoading}
                  className="py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/20 active:scale-96"
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Поиграть</span>
                </button>

                <button
                  type="button"
                  onClick={handleTapPet}
                  className="py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-500/20 active:scale-96"
                >
                  <Heart className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                  <span>Погладить</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Onboarding State */
          <div className="flex items-center gap-4 my-2 z-10">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-4xl shadow-sm shrink-0">
              🥚
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-base text-[var(--text)]">Оживите виртуального питомца союза</h3>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                Выберите яйцо щенка или котёнка, придумайте имя и ухаживайте вместе в консоли 90-х
              </p>
            </div>
          </div>
        )}

        {/* Bottom Console Launcher Pill */}
        <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between text-xs text-[var(--text-2)] z-10">
          <span className="font-semibold flex items-center gap-1.5 text-[var(--text-3)]">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Ретро-консоль LOOP.exe</span>
          </span>

          <span className="text-[var(--accent)] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
            <span>Открыть аркаду</span>
            <span>→</span>
          </span>
        </div>
      </section>

      {/* Retro Loop Console Modal */}
      {showConsole && (
        <LoopConsole
          isOpen={showConsole}
          onClose={() => setShowConsole(false)}
          initialPetState={petState && petState.isOnboardingCompleted ? petState : undefined}
          onPetCreated={(newPet) => setPetState(newPet)}
          onPetUpdated={(updatedPet) => setPetState(updatedPet)}
        />
      )}
    </>
  );
};

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-[var(--text-2)] w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-[11px] font-bold text-[var(--text-3)] w-7 text-right">{value}%</span>
    </div>
  );
}