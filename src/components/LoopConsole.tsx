import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CouplePetState,
  PetActionType,
  PetSpecies,
} from '../types.ts';
import {
  birthPetApi,
  performPetActionApi,
} from '../api/pet.api.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import { safeGetStorage, safeSetStorage } from '../utils/safeStorage.ts';
import { play8BitAudio, SoundEffectType } from '../utils/audio8Bit.ts';
import {
  RANDOM_PET_NAMES,
  FUNNY_PET_QUOTES,
} from '../data/petData.ts';

// Console modular components
import { ConsoleBezel } from './console/ConsoleBezel.tsx';
import { ConsoleControls } from './console/ConsoleControls.tsx';
import { BiosScreen } from './console/screens/BiosScreen.tsx';
import { EggScreen } from './console/screens/EggScreen.tsx';
import { NameScreen } from './console/screens/NameScreen.tsx';
import { PauseMenuModal } from './console/screens/PauseMenuModal.tsx';
import { GameplayScreen } from './console/screens/GameplayScreen.tsx';

interface LoopConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onPetCreated?: (petState: CouplePetState) => void;
  onPetUpdated?: (petState: CouplePetState) => void;
  initialPetState?: CouplePetState;
}

interface FloatingHeart {
  id: number;
  emoji: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const QUICK_ACTIONS: Array<{
  type: PetActionType;
  emoji: string;
  label: string;
  xp: string;
  color: string;
}> = [
  { type: 'feed', emoji: '🍓', label: 'Покормить', xp: '+15 XP 🐟', color: 'text-[#BA0029]' },
  { type: 'play', emoji: '🎾', label: 'Поиграть', xp: '+20 XP ⚡', color: 'text-[#22C55E]' },
  { type: 'wash', emoji: '🧼', label: 'Ванна & Мыло', xp: '+15 XP 🫧', color: 'text-[#00BCD4]' },
  { type: 'sleep', emoji: '🌙', label: 'Уложить спать', xp: '+25 XP 💤', color: 'text-[#725C00]' },
];

export const LoopConsole: React.FC<LoopConsoleProps> = ({
  isOpen,
  onClose,
  onPetCreated,
  onPetUpdated,
  initialPetState,
}) => {
  const [step, setStep] = useState<'bios' | 'egg' | 'name' | 'game'>(
    initialPetState && initialPetState.isOnboardingCompleted ? 'game' : 'bios'
  );
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>(
    initialPetState ? initialPetState.species : 'dog'
  );
  const [petName, setPetName] = useState<string>(
    initialPetState ? initialPetState.name : 'Бусинка'
  );
  const [pet, setPet] = useState<CouplePetState | null>(initialPetState ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return safeGetStorage<boolean>('loop_pet_sound_enabled', true);
  });

  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<PetActionType>('feed');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showPurrBadge, setShowPurrBadge] = useState(false);
  const [currentFunnyQuote, setCurrentFunnyQuote] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const getToken = useCallback((): string | null => {
    try {
      const token = safeGetStorage<string | null>('loop_auth_token', null);
      return token && token.trim() ? token.trim() : null;
    } catch {
      return null;
    }
  }, []);

  const playChime = useCallback((type: SoundEffectType) => {
    if (soundEnabled) {
      play8BitAudio(type);
    }
    triggerHaptic('light');
  }, [soundEnabled]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialPetState && initialPetState.isOnboardingCompleted) {
      setPet(initialPetState);
      setStep('game');
    } else {
      const savedLocal = safeGetStorage<CouplePetState | null>('loop_local_pet', null);
      if (savedLocal && savedLocal.isOnboardingCompleted) {
        setPet(savedLocal);
        setStep('game');
      } else {
        setStep('bios');
        playChime('boot');
      }
    }
  }, [isOpen, initialPetState, playChime]);

  useEffect(() => {
    if (initialPetState) {
      setPet(initialPetState);
    }
  }, [initialPetState]);

  const triggerHeartBurst = () => {
    playChime(pet?.species === 'cat' ? 'purr' : 'play');
    setShowPurrBadge(true);
    setIsBouncing(true);
    setTimeout(() => {
      setShowPurrBadge(false);
      setIsBouncing(false);
    }, 850);

    if (pet) {
      const pool = FUNNY_PET_QUOTES[pet.species] || FUNNY_PET_QUOTES.dog;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setCurrentFunnyQuote(pick);
    }

    const heartEmojis = ['💖', '💕', '✨', '⭐', '❤️', '🍓', '🐾', '🎀', '🐟'];
    const originX = 140;
    const originY = 140;

    const newHearts: FloatingHeart[] = Array.from({ length: 8 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() * 0.4 - 0.2);
      const dist = Math.random() * 70 + 40;
      return {
        id: Date.now() + i,
        emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
        x: originX,
        y: originY,
        targetX: Math.cos(angle) * dist,
        targetY: Math.sin(angle) * dist - 20,
      };
    });

    setFloatingHearts(newHearts);
    setTimeout(() => setFloatingHearts([]), 900);

    if (step === 'game' && pet && !isLoading) {
      handleAction('hug');
    }
  };

  const handleAction = async (action: PetActionType) => {
    if (!pet || isLoading) return;
    const token = getToken();

    setIsLoading(true);
    setError(null);

    if (action === 'feed') playChime('feed');
    else if (action === 'play') playChime('play');
    else if (action === 'wash') playChime('wash');
    else if (action === 'sleep') playChime('sleep');
    else if (action === 'hug') playChime('purr');

    const expGain = action === 'sleep' ? 25 : action === 'play' ? 20 : action === 'hug' ? 10 : 15;
    const nextExp = (pet.experience || 0) + expGain;
    const nextLevel = nextExp >= 100 ? (pet.level || 1) + 1 : (pet.level || 1);
    const updatedLocalPet: CouplePetState = {
      ...pet,
      hunger: action === 'feed' ? Math.min(100, (pet.hunger || 50) + 25) : pet.hunger,
      joy: action === 'play' || action === 'hug' ? Math.min(100, (pet.joy || 50) + 20) : pet.joy,
      cleanliness: action === 'wash' ? 100 : pet.cleanliness,
      energy: action === 'sleep' ? 100 : pet.energy,
      mood: action === 'sleep' ? 'sleepy' : 'happy',
      experience: nextExp % 100,
      level: nextLevel,
      updatedAt: new Date().toISOString(),
    };

    const feedbackMap: Record<PetActionType, string> = {
      feed: `✨ ВКУСНО! +${expGain} XP НАЧИСЛЕНО!`,
      play: `🎾 ВЕСЕЛО! +${expGain} XP НАЧИСЛЕНО!`,
      wash: `🫧 ЧИСТОТА! +${expGain} XP НАЧИСЛЕНО!`,
      sleep: `💤 СЛАДКИХ СНОВ! +${expGain} XP НАЧИСЛЕНО!`,
      hug: `💖 ОБНИМАШКИ! +${expGain} XP НАЧИСЛЕНО!`,
    };

    try {
      if (token) {
        const res = await performPetActionApi(action, token);
        if (res.state) {
          setPet(res.state);
          safeSetStorage('loop_local_pet', res.state);
          if (onPetUpdated) onPetUpdated(res.state);
        }
        if (res.levelUp) playChime('fanfare');
      } else {
        setPet(updatedLocalPet);
        safeSetStorage('loop_local_pet', updatedLocalPet);
        if (onPetUpdated) onPetUpdated(updatedLocalPet);
        if (nextLevel > (pet.level || 1)) playChime('fanfare');
      }

      setActionFeedback(feedbackMap[action] || 'УСПЕХ!');
      setTimeout(() => setActionFeedback(null), 2000);
    } catch {
      setPet(updatedLocalPet);
      safeSetStorage('loop_local_pet', updatedLocalPet);
      if (onPetUpdated) onPetUpdated(updatedLocalPet);
      if (nextLevel > (pet.level || 1)) playChime('fanfare');
      setActionFeedback(feedbackMap[action] || 'УСПЕХ!');
      setTimeout(() => setActionFeedback(null), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBirth = async () => {
    if (isLoading) return;
    const token = getToken();
    const trimmed = petName.trim() || 'Бусинка';
    setIsLoading(true);
    setError(null);
    playChime('fanfare');

    const now = new Date().toISOString();
    const localPet: CouplePetState = {
      id: 'pet-' + Date.now(),
      coupleId: 'local-couple',
      pairKey: 'local_pair',
      name: trimmed,
      nameStatus: 'confirmed',
      species: selectedSpecies,
      hunger: 90,
      joy: 95,
      energy: 85,
      cleanliness: 90,
      mood: 'happy',
      level: 1,
      experience: 25,
      weightKg: '1.2',
      synergy: 100,
      isOnboardingCompleted: true,
      lastFedAt: now,
      lastPlayedAt: now,
      lastRestedAt: now,
      lastWashedAt: now,
      lastInteractionAt: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (token) {
        const result = await birthPetApi({ species: selectedSpecies, name: trimmed }, token);
        setPet(result);
        safeSetStorage('loop_local_pet', result);
        if (onPetCreated) onPetCreated(result);
      } else {
        setPet(localPet);
        safeSetStorage('loop_local_pet', localPet);
        if (onPetCreated) onPetCreated(localPet);
      }
      setStep('game');
    } catch {
      setPet(localPet);
      safeSetStorage('loop_local_pet', localPet);
      if (onPetCreated) onPetCreated(localPet);
      setStep('game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonA = () => {
    playChime('click');
    if (step === 'bios') {
      if (pet && pet.isOnboardingCompleted) {
        setStep('game');
      } else {
        setStep('egg');
      }
    } else if (step === 'egg') {
      setStep('name');
    } else if (step === 'name') {
      handleBirth();
    } else if (step === 'game') {
      if (isPauseMenuOpen) {
        setIsPauseMenuOpen(false);
      } else {
        handleAction(selectedQuickAction);
      }
    }
  };

  const handleButtonB = () => {
    playChime('click');
    if (step === 'bios') {
      onClose();
    } else if (step === 'egg') {
      setStep('bios');
    } else if (step === 'name') {
      setStep('egg');
    } else if (step === 'game') {
      setIsPauseMenuOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        playChime('click');
        setSelectedQuickAction('feed');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        playChime('click');
        if (step === 'egg') setSelectedSpecies('cat');
        else setSelectedQuickAction('play');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playChime('click');
        if (step === 'egg') setSelectedSpecies('dog');
        else setSelectedQuickAction('wash');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playChime('click');
        setSelectedQuickAction('sleep');
      } else if (e.key.toLowerCase() === 'a' || e.key === 'Enter') {
        e.preventDefault();
        handleButtonA();
      } else if (e.key.toLowerCase() === 'b' || e.key === 'Escape') {
        e.preventDefault();
        handleButtonB();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleRandomName = () => {
    playChime('click');
    const pool = RANDOM_PET_NAMES.filter((n) => n !== petName);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_PET_NAMES[0];
    setPetName(pick);
    if (nameInputRef.current) nameInputRef.current.value = pick;
  };

  const toggleSound = () => {
    playChime('click');
    setSoundEnabled((prev) => {
      const next = !prev;
      safeSetStorage('loop_pet_sound_enabled', next);
      return next;
    });
  };

  if (!isOpen) return null;

  const isNightOrSleepy = Boolean(pet && (pet.mood === 'sleepy' || pet.energy < 20));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[395px] h-[calc(100dvh-16px)] max-h-[810px] bg-[#FFBAC8] border-[3.5px] border-[#16192E] rounded-[40px] flex flex-col justify-between p-3 box-border overflow-hidden relative shadow-[0_12px_0_#16192E,0_20px_25px_-5px_rgba(0,0,0,0.3)]">
        {/* Top Bezel with Speakers and LED */}
        <ConsoleBezel isNightOrSleepy={isNightOrSleepy} onClose={onClose} />

        {/* Recessed LCD Screen */}
        <div
          className={`w-full flex-1 rounded-[24px] border-[3px] border-[#16192E] p-2.5 flex flex-col justify-between overflow-hidden shadow-[inset_0_4px_14px_rgba(0,0,0,0.85)] relative box-border mb-2.5 transition-colors duration-500 ${
            step === 'bios'
              ? 'bg-[#0b1510] text-[#34D399]'
              : isNightOrSleepy && step === 'game'
              ? 'bg-[#0B132B] text-[#38E5FF]'
              : 'bg-[#EEF8E8] text-[#111C2D]'
          }`}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(#111C2D 1px, transparent 1px)',
              backgroundSize: '6px 6px',
            }}
          />

          {step === 'bios' && <BiosScreen pet={pet} onButtonA={handleButtonA} />}

          {step === 'egg' && (
            <EggScreen
              selectedSpecies={selectedSpecies}
              onSelectSpecies={(sp) => {
                playChime('click');
                setSelectedSpecies(sp);
              }}
              onConfirm={() => {
                playChime('click');
                setStep('name');
              }}
            />
          )}

          {step === 'name' && (
            <NameScreen
              selectedSpecies={selectedSpecies}
              petName={petName}
              setPetName={setPetName}
              nameInputRef={nameInputRef}
              onRandomName={handleRandomName}
              onSubmitBirth={handleBirth}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'game' && pet && (
            <div className="relative z-10 flex flex-col justify-between h-full">
              {isPauseMenuOpen ? (
                <PauseMenuModal
                  pet={pet}
                  soundEnabled={soundEnabled}
                  onToggleSound={toggleSound}
                  onCloseConsole={onClose}
                  onResumeGame={() => {
                    playChime('click');
                    setIsPauseMenuOpen(false);
                  }}
                />
              ) : (
                <GameplayScreen
                  pet={pet}
                  isNightOrSleepy={isNightOrSleepy}
                  selectedQuickAction={selectedQuickAction}
                  onSelectQuickAction={(act) => {
                    playChime('click');
                    setSelectedQuickAction(act);
                  }}
                  onPerformAction={handleAction}
                  onTapPet={triggerHeartBurst}
                  onOpenPauseMenu={() => {
                    playChime('click');
                    setIsPauseMenuOpen(true);
                  }}
                  actionFeedback={actionFeedback}
                  currentFunnyQuote={currentFunnyQuote}
                  isBouncing={isBouncing}
                  showPurrBadge={showPurrBadge}
                  floatingHearts={floatingHearts}
                  isLoading={isLoading}
                  quickActions={QUICK_ACTIONS}
                />
              )}
            </div>
          )}
        </div>

        {/* Mechanical Arcade Controls */}
        <ConsoleControls
          step={step}
          onButtonA={handleButtonA}
          onButtonB={handleButtonB}
          onDpadUp={() => {
            playChime('click');
            setSelectedQuickAction('feed');
          }}
          onDpadDown={() => {
            playChime('click');
            setSelectedQuickAction('sleep');
          }}
          onDpadLeft={() => {
            playChime('click');
            if (step === 'egg') setSelectedSpecies('dog');
            else setSelectedQuickAction('wash');
          }}
          onDpadRight={() => {
            playChime('click');
            if (step === 'egg') setSelectedSpecies('cat');
            else setSelectedQuickAction('play');
          }}
          onToggleSound={toggleSound}
          onTogglePause={() => {
            playChime('click');
            setIsPauseMenuOpen((p) => !p);
          }}
        />
      </div>
    </div>
  );
};
