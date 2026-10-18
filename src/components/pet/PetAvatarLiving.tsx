import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetSpecies, CouplePetState } from '../../types.ts';
import {
  PET_SPECIES_DETAILS,
  SLEEP_IMAGE,
  SLEEP_IMAGE_FALLBACK,
  getPetVisualStatus,
  PetVisualStatus,
} from '../../data/petData.ts';
import { play8BitAudio, SoundEffectType } from '../../utils/audio8Bit.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

interface PetAvatarLivingProps {
  pet: CouplePetState;
  size?: 'sm' | 'md' | 'lg' | 'console';
  isBouncing?: boolean;
  onTap?: () => void;
  showNeedBadge?: boolean;
  interactive?: boolean;
  className?: string;
}

export const PetAvatarLiving: React.FC<PetAvatarLivingProps> = ({
  pet,
  size = 'md',
  isBouncing = false,
  onTap,
  showNeedBadge = true,
  interactive = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [tapEmotes, setTapEmotes] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);
  const [localBounce, setLocalBounce] = useState(false);

  const status: PetVisualStatus = getPetVisualStatus(pet);
  const speciesMeta = PET_SPECIES_DETAILS[pet.species];

  // Size configurations
  const sizeMap = {
    sm: {
      container: 'w-24 h-24',
      petBox: 'w-20 h-20 rounded-2xl',
      badgeText: 'text-[9px]',
      thoughtScale: 'scale-75',
      flyScale: 'scale-75',
    },
    md: {
      container: 'w-32 h-32 sm:w-36 sm:h-36',
      petBox: 'w-28 h-28 sm:w-32 sm:h-32 rounded-3xl',
      badgeText: 'text-[10px]',
      thoughtScale: 'scale-90',
      flyScale: 'scale-90',
    },
    lg: {
      container: 'w-40 h-40 sm:w-44 sm:h-44',
      petBox: 'w-36 h-36 sm:w-40 sm:h-40 rounded-3xl',
      badgeText: 'text-xs',
      thoughtScale: 'scale-100',
      flyScale: 'scale-100',
    },
    console: {
      container: 'w-32 h-32 sm:w-36 sm:h-36',
      petBox: 'w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-[#16192E]',
      badgeText: 'text-[8.5px]',
      thoughtScale: 'scale-85',
      flyScale: 'scale-85',
    },
  }[size];

  const handlePetClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    triggerHaptic('medium');
    setLocalBounce(true);
    setTimeout(() => setLocalBounce(false), 500);

    // Audio based on state
    if (status.isDirty) {
      play8BitAudio('wash');
    } else if (status.isDeeplySleepy) {
      play8BitAudio('sleep');
    } else if (status.isHungry) {
      play8BitAudio('feed');
    } else {
      play8BitAudio(pet.species === 'cat' ? 'purr' : 'play');
    }

    // Reaction particles
    const reactionPool = status.isDirty
      ? ['🫧', '🧼', '🐾', '💧']
      : status.isDeeplySleepy
      ? ['💤', '🥱', '🌙', '⭐']
      : status.isHungry
      ? ['🥩', '🐟', '🍓', '🥺']
      : status.isSad
      ? ['🎾', '❤️', '🥺', '🐾']
      : ['💖', '✨', '🐾', '🥰', '💕'];

    const chosenEmoji = reactionPool[Math.floor(Math.random() * reactionPool.length)];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 12;
    const y = e.clientY - rect.top - 12;

    const newId = Date.now() + Math.random();
    setTapEmotes((prev) => [...prev.slice(-3), { id: newId, emoji: chosenEmoji, x, y }]);
    setTimeout(() => {
      setTapEmotes((prev) => prev.filter((item) => item.id !== newId));
    }, 900);

    if (onTap) {
      onTap();
    }
  };

  // Determine pet image source
  const useSleepImage = status.isDeeplySleepy;
  const imageSrc = useSleepImage
    ? SLEEP_IMAGE
    : speciesMeta?.image || '/assets/tamagotchi/dog-happy.png';
  const imageFallback = useSleepImage
    ? SLEEP_IMAGE_FALLBACK
    : speciesMeta?.imageFallback || '';

  // Determine breathing/living animation class
  const getLivingAnimClass = () => {
    if (localBounce || isBouncing) return 'scale-105 -rotate-2';
    if (status.isStarving) return 'animate-pet-shiver';
    if (status.isDeeplySleepy) return 'animate-pet-drowsy';
    if (status.isLoved) return 'animate-pet-wiggle';
    return 'animate-pet-breathe';
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Dynamic Status / Need Badge */}
      {showNeedBadge && (
        <motion.div
          key={status.badgeText}
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`mb-1.5 px-2.5 py-0.5 rounded-full border shadow-2xs font-bold inline-flex items-center gap-1 ${sizeMap.badgeText} ${status.badgeClass}`}
        >
          <span>{status.badgeEmoji}</span>
          <span className="tracking-tight">{status.badgeText}</span>
        </motion.div>
      )}

      {/* Main Pet Stage Area */}
      <div
        onClick={handlePetClick}
        className={`relative ${sizeMap.container} flex items-center justify-center cursor-pointer group`}
        title={interactive ? 'Тапните, чтобы погладить и проверить самочувствие!' : undefined}
      >
        {/* Ambient Mood Glow */}
        <div
          className={`absolute inset-0 rounded-full filter blur-xl opacity-60 pointer-events-none transition-colors duration-700 ${
            status.isDirty
              ? 'bg-amber-800/25'
              : status.isSleepy
              ? 'bg-indigo-500/30'
              : status.isHungry
              ? 'bg-rose-500/25'
              : status.isSad
              ? 'bg-sky-500/25'
              : 'bg-amber-300/30'
          }`}
        />

        {/* Pet Frame / Sprite Box */}
        <div
          className={`relative z-10 ${sizeMap.petBox} overflow-hidden bg-white/95 dark:bg-zinc-800/90 shadow-md flex items-center justify-center p-1.5 transition-transform duration-200 border border-[var(--divider)] ${getLivingAnimClass()}`}
        >
          {/* Main Pet Image */}
          {!imgError ? (
            <img
              src={imageSrc}
              onError={(e) => {
                if (imageFallback) {
                  (e.target as HTMLImageElement).src = imageFallback;
                } else {
                  setImgError(true);
                }
              }}
              alt={pet.name}
              className={`w-full h-full object-contain select-none pointer-events-none transition-all duration-300 ${
                status.isVeryDirty
                  ? 'brightness-90 contrast-95 sepia-[0.35] saturate-[0.8]'
                  : status.isDirty
                  ? 'sepia-[0.22] saturate-[0.88] brightness-95'
                  : status.isSparkling
                  ? 'brightness-105 contrast-102'
                  : ''
              }`}
            />
          ) : (
            <span className="text-4xl">{pet.species === 'cat' ? '🐱' : '🐶'}</span>
          )}

          {/* =========================================================================
              LAYER: DIRTY / MUD SPLATTERS (SVG Overlays)
              ========================================================================= */}
          {status.isDirty && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Mud spot on ear/forehead */}
                <path
                  d="M 28 22 C 34 19, 42 24, 38 31 C 35 37, 26 36, 24 30 C 22 25, 24 23, 28 22 Z"
                  fill="#543310"
                  opacity={status.isVeryDirty ? '0.85' : '0.65'}
                />
                <circle cx="43" cy="23" r="2.2" fill="#6F4E37" opacity="0.8" />
                <circle cx="21" cy="34" r="1.6" fill="#4A2E1B" opacity="0.75" />

                {/* Mud smudge on right cheek */}
                <path
                  d="M 68 45 C 75 42, 82 48, 79 55 C 76 60, 69 58, 66 53 C 64 48, 65 46, 68 45 Z"
                  fill="#6B4226"
                  opacity={status.isVeryDirty ? '0.82' : '0.6'}
                />
                <circle cx="83" cy="52" r="2" fill="#543310" opacity="0.75" />
                <circle cx="64" cy="59" r="1.4" fill="#6B4226" opacity="0.7" />

                {/* Mud splatter on paw/chest */}
                <path
                  d="M 45 74 C 52 70, 60 76, 56 83 C 51 88, 41 85, 42 78 C 43 74, 44 75, 45 74 Z"
                  fill="#4A2E1B"
                  opacity={status.isVeryDirty ? '0.88' : '0.7'}
                />
                <circle cx="36" cy="80" r="2.5" fill="#5C3A21" opacity="0.8" />
                <circle cx="62" cy="82" r="1.8" fill="#543310" opacity="0.8" />

                {status.isVeryDirty && (
                  <>
                    {/* Extra mud patch on nose/chin */}
                    <path
                      d="M 48 56 C 54 53, 58 58, 54 62 C 50 65, 45 62, 48 56 Z"
                      fill="#3D2314"
                      opacity="0.85"
                    />
                    <circle cx="58" cy="58" r="1.8" fill="#4A2E1B" opacity="0.8" />
                  </>
                )}
              </svg>
            </div>
          )}

          {/* =========================================================================
              LAYER: DROWSY / SLEEPY EYELIDS (if not already using full sleep image)
              ========================================================================= */}
          {status.isSleepy && !useSleepImage && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full opacity-75">
                {/* Left droopy eyelid curve */}
                <path
                  d="M 33 46 Q 40 52 47 47"
                  stroke="#2D1B14"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right droopy eyelid curve */}
                <path
                  d="M 53 47 Q 60 52 67 46"
                  stroke="#2D1B14"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          )}

          {/* =========================================================================
              LAYER: BLUSHING CHEEKS (Happy & Thriving)
              ========================================================================= */}
          {(status.isLoved || status.isSparkling) && !status.isDirty && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <ellipse cx="32" cy="56" rx="6" ry="3.5" fill="#FF5E74" opacity="0.4" className="filter blur-2xs" />
                <ellipse cx="68" cy="56" rx="6" ry="3.5" fill="#FF5E74" opacity="0.4" className="filter blur-2xs" />
              </svg>
            </div>
          )}

          {/* =========================================================================
              LAYER: SAD TEARDROP (Bored / Low Joy)
              ========================================================================= */}
          {status.isSad && (
            <div className="absolute top-[48%] left-[28%] pointer-events-none z-25">
              <span className="text-sm inline-block animate-pet-tear">💧</span>
            </div>
          )}

          {/* =========================================================================
              LAYER: SPARKLING SHINE GLINTS (Clean & Fresh)
              ========================================================================= */}
          {status.isSparkling && !status.isDirty && (
            <div className="absolute inset-0 pointer-events-none z-25">
              <span className="absolute top-2 right-3 text-amber-400 text-xs animate-ping">✨</span>
              <span className="absolute bottom-3 left-3 text-yellow-300 text-[10px] animate-pulse">✦</span>
              <span className="absolute top-6 left-2 text-cyan-300 text-[9px]">✨</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            LAYER: OUTSIDE PARTICLES & STATUS DECORATIONS
            ========================================================================= */}

        {/* 1. Stink Steam & Buzzing Flies (Dirty) */}
        {status.isVeryDirty && (
          <>
            {/* Waving stink steam rising */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none z-30">
              <span className="text-xs text-lime-500 animate-pet-steam">♨️</span>
              <span className="text-[10px] text-lime-400 animate-pet-steam" style={{ animationDelay: '0.6s' }}>♨️</span>
            </div>

            {/* Orbiting flies */}
            <div className={`absolute inset-0 pointer-events-none z-30 ${sizeMap.flyScale}`}>
              <div className="absolute top-1/4 left-1/4 animate-pet-fly-1">
                <span className="text-xs filter drop-shadow">🪰</span>
              </div>
              <div className="absolute bottom-1/3 right-1/4 animate-pet-fly-2">
                <span className="text-[11px] filter drop-shadow">🪰</span>
              </div>
            </div>
          </>
        )}

        {/* 2. Floating Zzz (Sleepy) */}
        {status.isSleepy && (
          <div className="absolute -top-3 -right-2 flex flex-col items-end pointer-events-none z-30 font-pixel">
            <span className="text-[8px] text-indigo-400 animate-pet-zzz" style={{ animationDelay: '0s' }}>z</span>
            <span className="text-[10px] text-indigo-300 animate-pet-zzz" style={{ animationDelay: '0.8s' }}>Z</span>
            <span className="text-[12px] text-cyan-300 animate-pet-zzz drop-shadow-[0_0_4px_#38BDF8]" style={{ animationDelay: '1.6s' }}>Zzz</span>
          </div>
        )}

        {/* 3. Thought Dream Bubble of Food (Hungry) */}
        {status.isHungry && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -top-4 -right-3 z-30 pointer-events-none ${sizeMap.thoughtScale}`}
          >
            <div className="relative bg-white dark:bg-zinc-800 border-[1.5px] border-[#16192E] rounded-2xl px-2 py-1 shadow-[2px_2px_0px_#16192E] flex items-center gap-1 animate-bounce">
              <span className="text-base animate-pulse">
                {pet.species === 'cat' ? '🐟' : '🥩'}
              </span>
              <span className="text-[7.5px] font-black text-[#16192E] dark:text-zinc-100 uppercase">
                {status.isStarving ? 'Еды!' : 'Кушать'}
              </span>
              {/* Little dream origin bubbles */}
              <div className="absolute -bottom-1 left-2 w-1.5 h-1.5 bg-white dark:bg-zinc-800 border border-[#16192E] rounded-full" />
              <div className="absolute -bottom-2.5 left-0.5 w-1 h-1 bg-white dark:bg-zinc-800 border border-[#16192E] rounded-full" />
            </div>
          </motion.div>
        )}

        {/* Empty Bowl icon at paws when hungry */}
        {status.isHungry && (
          <div className="absolute -bottom-1 -left-2 z-25 pointer-events-none bg-white dark:bg-zinc-800 border border-[#16192E] rounded-full p-0.5 shadow-xs">
            <span className="text-xs">🥣</span>
          </div>
        )}

        {/* 4. Tap reaction emotes */}
        <AnimatePresence>
          {tapEmotes.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 1, scale: 0.6, y: 0 }}
              animate={{ opacity: 0, scale: 1.4, y: -42 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ left: t.x, top: t.y }}
              className="absolute pointer-events-none z-40 text-xl font-bold select-none drop-shadow-md"
            >
              {t.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Subtle floor shadow */}
      <div className="w-20 h-1.5 bg-[#16192E]/10 dark:bg-black/30 rounded-full mx-auto mt-1 blur-2xs pointer-events-none" />
    </div>
  );
};
