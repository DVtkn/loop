import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CouplePetState,
  PetActionType,
  PetSpecies,
  PetNameStatus
} from "../types.ts";
import {
  getPetStateApi,
  birthPetApi,
  performPetActionApi,
  proposePetNameApi,
  confirmPetNameApi,
} from "../api/pet.api.ts";
import { triggerHaptic } from "../utils/haptics.ts";
import { safeGetStorage, safeSetStorage } from "../utils/safeStorage.ts";

interface LoopConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onPetCreated?: (petState: CouplePetState) => void;
  onPetUpdated?: (petState: CouplePetState) => void;
  initialPetState?: CouplePetState;
}

// 8-Bit Web Audio Synthesizer for authentic retro arcade experience
function play8BitAudio(type: 'boot' | 'click' | 'feed' | 'play' | 'wash' | 'sleep' | 'purr' | 'fanfare') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'boot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'feed') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(587.33, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'play') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.15);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'wash') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(700, now + 0.1);
      osc.frequency.linearRampToValueAtTime(400, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'sleep') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.18);
      osc.frequency.linearRampToValueAtTime(329.63, now + 0.35);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'purr') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.setValueAtTime(520, now + 0.07);
      osc.frequency.setValueAtTime(700, now + 0.14);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'fanfare') {
      osc.type = 'square';
      [440, 554, 659, 880].forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + i * 0.08);
      });
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // Ignore audio context autoplay limitations
  }
}

const RANDOM_NAMES = ["Бусинка", "Пиксель", "Моти", "Зефирка", "Пончик", "Чипсик", "Лучик", "Байт", "Тоффи", "Пуговка"];

const PET_SPECIES_DETAILS: Record<PetSpecies, {
  title: string;
  badge: string;
  trait: string;
  bonus: string;
  eggGradient: string;
  image: string;
  imageFallback: string;
}> = {
  dog: {
    title: "ЧИХУАХУА",
    badge: "Преданный & Бодрый",
    trait: "Преданный и жизнерадостный щенок",
    bonus: "+15% к энергии от совместных свиданий",
    eggGradient: "from-[#FFE394] via-[#FFAEBD] to-[#FF8FA3]",
    image: "/assets/tamagotchi/dog-happy.jpg",
    imageFallback: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHetbq7FldgIT8gIsFWK6AJ0BDWnZvOpSOXdZ2GeFJDc_H5tUpe0CwR9RPrg5j9DoS-_NgbHa-CRGmI4vACoSVqE74QsKVM4b9KLQrqprLG6kpLPhrZrvZ7MAXxsE4L7Vv8uMV3cJjIhZ7T8I60itzbhmeE0Mhdt5i2ZNdmrTY7cnpnb5_-EIy2n9F9NlgOcTvRcatnrQQAS0I76grcjNGUguiH68TM-DKSNnKnTCnatw_yvGPR5oBvg",
  },
  cat: {
    title: "КОШЕЧКА",
    badge: "Ласковая & Мурчащая",
    trait: "Мягкая, уютная и ласковая кошка",
    bonus: "+15% к радости от совместных касаний",
    eggGradient: "from-[#C4B5FD] via-[#A7F3D0] to-[#6EE7B7]",
    image: "/assets/tamagotchi/cat-happy.jpg",
    imageFallback: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9CUkEIg3KYo7vRkIl9aNFKuI_YylFZnPxuGLbMAU-BE59Kn_O4dgg8Rsrz3WChhz-g6hi9_pyt-RMlb_46D_naW5P9IeY8hDmoIyfR_B59a4ZvX4yM8h_23rlS3HtP6nf7rQ2LXNKRrnOKo3iW6A1F47utWuwzlhyX0dMGHjpYzFPvf9A02B6rn-OgXHyJpfokvVeaIES7OIEBDXwlEZjZ_UUdEo6iNF6IODjsAHHGBFLoqgI2yMMVg",
  },
};

const SLEEP_IMAGE = "/assets/tamagotchi/dog-sleep.jpg";
const SLEEP_IMAGE_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuAYQBzgEj8bxvPylrR-g0Wxlq_lQprKeW-lB9TW_KxP55ElP5RK4F9TKNj7CFawvCwbkKXRMVCpN4hkTotd4-LpgiBhoufpQpk2ondK1giu_dFAWgKjr73oopIucQGlNQHqRBP3xh4QZCppS0rnRp32N5LznWmwZVezLu2a4HkniAz8E3RIwQ9ZpL6sRvK-UE2IDxDLBGld-m7dEHky0YSw5_GzBVOtgjjwiFe8u8Mts2yNLdptP3OkCQ";

const MOOD_BUBBLES: Record<string, string> = {
  happy: "Тяв! Люблю вас! 💖",
  sleepy: "Клюю носом... 💤",
  hungry: "Кушать! 🍓",
  playful: "Поиграем? 🎾",
  loved: "Муррр~ +5❤️",
  dirty: "Буль-буль! Чистота! 🧼",
};

const FUNNY_PET_QUOTES: Record<PetSpecies, string[]> = {
  dog: [
    "Тяв! Где вкусняшка? Я видел колбаску! 🥩",
    "Ты лучший человек во вселенной! (после холодильника) 💖",
    "Почеши пузико! Срочно! 🐾",
    "Я не толстый, это кость пушистая! 🧁",
    "Тыгыдык в 3 часа ночи? Я всегда готов! ⚡",
    "Хвост виляет быстрее скорости света! 🐕✨",
    "Гав! Дай пять лапкой! 🐾",
    "Мячик — смысл всей моей собачьей жизни! 🎾",
    "Я здесь главный охранник ваших сердечек! 🛡️❤️",
  ],
  cat: [
    "Мур-мяу! Уровень милоты: 1000% 🌸",
    "Человек, ты опоздал с кормом на 0.5 секунды! 🐟",
    "Кусь! Это я так выражаю безумную любовь! ❤️",
    "Я здесь божество, а ты мой слуга с паштетом 👑",
    "Муррр~ лапками делаю массаж 🐾",
    "Тыгыдык-тыгыдык по всей квартире! ⚡",
    "Картонная коробка в 10 раз лучше лежанки! 📦",
    "Почеши за ушком и я включу мурчащий моторчик 🐱",
    "Смотрю в пустую стену с очень умным видом 👁️",
  ],
};

interface FloatingHeart {
  id: number;
  emoji: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

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

  // Sound & Vibration preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return safeGetStorage<boolean>('loop_pet_sound_enabled', true);
  });

  // Gameplay local state
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<PetActionType>('feed');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showPurrBadge, setShowPurrBadge] = useState(false);
  const [currentFunnyQuote, setCurrentFunnyQuote] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);

  // BIOS Terminal Animation Line Count
  const [biosPhase, setBiosPhase] = useState<number>(0);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const getToken = useCallback((): string | null => {
    try {
      const token = safeGetStorage<string | null>('loop_auth_token', null);
      return token && token.trim() ? token.trim() : null;
    } catch {
      return null;
    }
  }, []);

  const playChime = useCallback((type: 'boot' | 'click' | 'feed' | 'play' | 'wash' | 'sleep' | 'purr' | 'fanfare') => {
    if (soundEnabled) {
      play8BitAudio(type);
    }
    triggerHaptic('light');
  }, [soundEnabled]);

  // Handle Initial Boot & BIOS
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
        setBiosPhase(0);
        playChime('boot');

        const t1 = setTimeout(() => setBiosPhase(1), 300);
        const t2 = setTimeout(() => setBiosPhase(2), 700);
        const t3 = setTimeout(() => setBiosPhase(3), 1100);
        const t4 = setTimeout(() => setBiosPhase(4), 1500);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    }
  }, [isOpen, initialPetState, playChime]);

  // Sync pet state updates from outside
  useEffect(() => {
    if (initialPetState) {
      setPet(initialPetState);
    }
  }, [initialPetState]);

  // Heart burst & funny quote animation on pet tap
  const triggerHeartBurst = (e?: React.MouseEvent) => {
    playChime(pet?.species === 'cat' ? 'purr' : 'play');
    setShowPurrBadge(true);
    setIsBouncing(true);
    setTimeout(() => {
      setShowPurrBadge(false);
      setIsBouncing(false);
    }, 850);

    // Randomize a funny quote
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

    // Also execute hug action if in game
    if (step === 'game' && pet && !isLoading) {
      handleAction('hug');
    }
  };

  // Perform Pet Action API
  // Perform Pet Action API with local/offline fallback
  const handleAction = async (action: PetActionType) => {
    if (!pet || isLoading) return;
    const token = getToken();

    setIsLoading(true);
    setError(null);

    // Audio chime by action type
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
        if (res.levelUp) {
          playChime('fanfare');
        }
      } else {
        setPet(updatedLocalPet);
        safeSetStorage('loop_local_pet', updatedLocalPet);
        if (onPetUpdated) onPetUpdated(updatedLocalPet);
        if (nextLevel > (pet.level || 1)) {
          playChime('fanfare');
        }
      }

      setActionFeedback(feedbackMap[action] || "УСПЕХ!");
      setTimeout(() => setActionFeedback(null), 2000);
    } catch {
      // Graceful offline fallback
      setPet(updatedLocalPet);
      safeSetStorage('loop_local_pet', updatedLocalPet);
      if (onPetUpdated) onPetUpdated(updatedLocalPet);
      if (nextLevel > (pet.level || 1)) {
        playChime('fanfare');
      }
      setActionFeedback(feedbackMap[action] || "УСПЕХ!");
      setTimeout(() => setActionFeedback(null), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Birth Pet
  const handleBirth = async () => {
    if (isLoading) return;
    const token = getToken();

    const trimmed = petName.trim() || 'Бусинка';
    setIsLoading(true);
    setError(null);
    playChime('fanfare');

    const now = new Date().toISOString();
    const localPet: CouplePetState = {
      id: "pet-" + Date.now(),
      coupleId: "local-couple",
      pairKey: "local_pair",
      name: trimmed,
      nameStatus: "confirmed",
      species: selectedSpecies,
      hunger: 90,
      joy: 95,
      energy: 85,
      cleanliness: 90,
      mood: "happy",
      level: 1,
      experience: 25,
      weightKg: "1.2",
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
      // Graceful fallback to local pet creation
      setPet(localPet);
      safeSetStorage('loop_local_pet', localPet);
      if (onPetCreated) onPetCreated(localPet);
      setStep('game');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard Gamepad listener (A = Enter/Space, B = Esc/B, D-Pad = Arrows)
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

  // Physical Button A Click
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

  // Physical Button B Click
  const handleButtonB = () => {
    playChime('click');
    if (step === 'bios') {
      onClose();
    } else if (step === 'egg') {
      setStep('bios');
    } else if (step === 'name') {
      setStep('egg');
    } else if (step === 'game') {
      setIsPauseMenuOpen(prev => !prev);
    }
  };

  const handleRandomName = () => {
    playChime('click');
    const pool = RANDOM_NAMES.filter((n) => n !== petName);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_NAMES[0];
    setPetName(pick);
    if (nameInputRef.current) nameInputRef.current.value = pick;
  };

  const toggleSound = () => {
    playChime('click');
    setSoundEnabled(prev => {
      const next = !prev;
      safeSetStorage('loop_pet_sound_enabled', next);
      return next;
    });
  };

  if (!isOpen) return null;

  // Determine current display mode for step === 'game'
  const isNightOrSleepy = Boolean(
    pet && (pet.mood === 'sleepy' || pet.energy < 20)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Handheld Device Chassis (Strict Standard: rounded-40px, border-3.5px, pastel pink shell) */}
      <div
        className="w-full max-w-[395px] h-[calc(100dvh-16px)] max-h-[810px] bg-[#FFBAC8] border-[3.5px] border-[#16192E] rounded-[40px] flex flex-col justify-between p-3 box-border overflow-hidden relative shadow-[0_12px_0_#16192E,0_20px_25px_-5px_rgba(0,0,0,0.3)]"
      >
        {/* ===================== TOP BEZEL ===================== */}
        <div className="w-full flex items-center justify-between px-2 pt-0.5 pb-2 shrink-0">
          {/* Left Speaker Dots */}
          <div className="flex gap-1.5 opacity-85">
            <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block"></span>
            <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block"></span>
            <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block"></span>
          </div>

          {/* Center LINK OK LED Pill Indicator */}
          <div className="bg-[#16192E] px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-[#16192E]">
            <span className="w-2 h-2 rounded-full bg-[#32FF98] shadow-[0_0_8px_#32FF98] animate-pulse"></span>
            <span className="font-pixel text-[8.5px] tracking-wider text-[#32FF98] uppercase">
              {isNightOrSleepy ? "LINK OK (SLEEP)" : "LINK OK • DUO"}
            </span>
          </div>

          {/* Right Speaker Dots + Close X shortcut */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 opacity-85">
              <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block"></span>
              <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block"></span>
            </div>
            <button
              onClick={onClose}
              title="Закрыть консоль"
              className="w-5 h-5 rounded-full bg-[#16192E] text-white/80 hover:text-white flex items-center justify-center text-[10px] font-bold border border-[#374151] active:scale-90 transition-transform ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===================== MAIN RECESSED LCD SCREEN ===================== */}
        <div
          className={`w-full flex-1 rounded-[24px] border-[3px] border-[#16192E] p-2.5 flex flex-col justify-between overflow-hidden shadow-[inset_0_4px_14px_rgba(0,0,0,0.85)] relative box-border mb-2.5 transition-colors duration-500 ${
            step === 'bios'
              ? 'bg-[#0b1510] text-[#34D399]'
              : isNightOrSleepy && step === 'game'
              ? 'bg-[#0B132B] text-[#38E5FF]'
              : 'bg-[#EEF8E8] text-[#111C2D]'
          }`}
        >
          {/* Scanlines / Retro Dot-Matrix Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: "radial-gradient(#111C2D 1px, transparent 1px)",
              backgroundSize: "6px 6px",
            }}
          />

          {/* ----------------- SCREEN 1: BIOS BOOT-UP ----------------- */}
          {step === 'bios' && (
            <div className="relative z-10 flex flex-col justify-between h-full text-[#34D399] font-mono">
              <div className="flex justify-between items-center text-[10px] border-b border-[#34D399]/20 pb-1">
                <span className="tracking-wider">SYS.BOOT // 2025</span>
                <span>BATTERY: 100% [||||]</span>
              </div>

              <div className="my-auto space-y-2.5 p-1">
                <div className="flex items-center gap-2 text-[#6EE7B7]">
                  <span className="text-lg animate-pulse">👾</span>
                  <h1 className="font-pixel text-[12px] tracking-wider font-bold">LOOP-DOS v1.0</h1>
                </div>

                <div className="bg-[#050D0A]/90 p-3 rounded-xl border border-[#34D399]/30 text-[10px] space-y-1.5 shadow-inner">
                  <div className="flex justify-between">
                    <span>&gt; ROM CHECK:</span>
                    <span className="text-[#34D399] font-bold bg-[#064E3B]/60 px-1 rounded">OK [PASS]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; CO-OP CHANNEL:</span>
                    <span className="text-[#34D399] font-bold bg-[#064E3B]/60 px-1 rounded">SECURE 256-BIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>&gt; PARTNER SYNC:</span>
                    <span className="text-[#34D399] font-bold bg-[#064E3B]/60 px-1 rounded">READY (ОНЛАЙН)</span>
                  </div>
                  <div className="flex justify-between text-[#6EE7B7]/70 text-[9px] pt-1 border-t border-[#34D399]/20">
                    <span>&gt; MEMORY BUFFER:</span>
                    <span>{pet ? "1 PET ACTIVE" : "0 PETS DETECTED"}</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={handleButtonA}
                    className="inline-block px-4 py-2 rounded-lg bg-[#064E3B]/80 border border-[#34D399]/70 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse hover:bg-[#064E3B] cursor-pointer"
                  >
                    <span className="font-pixel text-[10.5px] text-[#A7F3D0] tracking-wider font-bold">
                      [ НАЖМИТЕ КНОПКУ (A) ]
                    </span>
                  </button>
                  <p className="text-[8.5px] text-[#6EE7B7]/60 mt-2 font-pixel">✨ 8-BIT BOOT CHIME &amp; HAPTIC ENGAGED</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] text-[#34D399]/70 border-t border-[#34D399]/20 pt-1">
                <span>STATUS: READY</span>
                <span className="animate-pulse">CO-OP SYSTEM &gt;&gt;</span>
              </div>
            </div>
          )}

          {/* ----------------- SCREEN 2: INCUBATOR (PET SELECTION) ----------------- */}
          {step === 'egg' && (
            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* LCD Top Status */}
              <div className="flex justify-between items-center text-[10px] font-vt tracking-wider border-b border-[#111C2D]/15 pb-1">
                <span className="text-emerald-800 font-bold">SYS.INCUBATOR // V1.0</span>
                <span className="text-[#BA0029] font-black text-[9px]">CO-OP SYNC: OK</span>
                <span className="text-emerald-800 font-bold">BATTERY: 100%</span>
              </div>

              {/* Title Banner */}
              <div className="text-center my-0.5">
                <div className="inline-block bg-[#16192E] border border-[#111C2D] px-2 py-0.5 rounded shadow-sm">
                  <h2 className="font-pixel text-[9px] text-[#32FF98] tracking-wide uppercase">
                    🥚 ИНКУБАТОР: ВЫБЕРИТЕ ХРАНИТЕЛЯ
                  </h2>
                </div>
                <p className="text-[10px] font-bold text-[#111C2D]/70 mt-0.5">
                  Выбор общего питомца пары на весь игровой цикл
                </p>
              </div>

              {/* Side-by-Side Pet Eggs */}
              <div className="grid grid-cols-2 gap-2 my-auto">
                {/* 1. Чихуахуа */}
                <div
                  onClick={() => { playChime('click'); setSelectedSpecies('dog'); }}
                  className={`relative rounded-xl p-2 flex flex-col items-center justify-between transition-all cursor-pointer ${
                    selectedSpecies === 'dog'
                      ? 'bg-white border-2 border-[#BA0029] shadow-[0_0_12px_rgba(186,0,41,0.25)] ring-1 ring-[#BA0029]'
                      : 'bg-white/60 border border-[#111C2D]/30 opacity-75 hover:opacity-100'
                  }`}
                >
                  {selectedSpecies === 'dog' && (
                    <div className="absolute -top-2.5 bg-[#BA0029] text-white font-pixel text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      ► ВЫБРАНО
                    </div>
                  )}
                  {/* Floating Egg with Pup Preview */}
                  <div className="w-16 h-20 bg-gradient-to-b from-[#FFE394] via-[#FFAEBD] to-[#FF8FA3] rounded-[50%_50%_46%_46%_/_60%_60%_40%_40%] border-2 border-[#16192E] p-1 flex items-center justify-center relative shadow-sm my-1 animate-bounce" style={{ animationDuration: '2.5s' }}>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#16192E] bg-white flex items-center justify-center p-0.5 shadow-inner">
                      <img
                        src={PET_SPECIES_DETAILS.dog.image}
                        onError={(e) => { (e.target as HTMLImageElement).src = PET_SPECIES_DETAILS.dog.imageFallback; }}
                        alt="Чихуахуа"
                        className="w-full h-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                  </div>
                  <div className="text-center w-full mt-1">
                    <div className="font-pixel text-[9px] font-bold text-[#BA0029]">ЧИХУАХУА</div>
                    <div className="bg-[#FFE3E8] border border-[#BA0029]/30 rounded px-1 py-0.5 mt-1 text-[8.5px] font-extrabold text-[#BA0029]">
                      ✨ +15% к энергии
                    </div>
                    <div className="font-pixel text-[6.5px] text-[#111C2D]/70 mt-1 uppercase">Преданный &amp; Бодрый</div>
                  </div>
                </div>

                {/* 2. Кошечка */}
                <div
                  onClick={() => { playChime('click'); setSelectedSpecies('cat'); }}
                  className={`relative rounded-xl p-2 flex flex-col items-center justify-between transition-all cursor-pointer ${
                    selectedSpecies === 'cat'
                      ? 'bg-white border-2 border-[#BA0029] shadow-[0_0_12px_rgba(186,0,41,0.25)] ring-1 ring-[#BA0029]'
                      : 'bg-white/60 border border-[#111C2D]/30 opacity-75 hover:opacity-100'
                  }`}
                >
                  {selectedSpecies === 'cat' && (
                    <div className="absolute -top-2.5 bg-[#BA0029] text-white font-pixel text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      ► ВЫБРАНО
                    </div>
                  )}
                  {/* Floating Egg with Cat Preview */}
                  <div className="w-16 h-20 bg-gradient-to-b from-[#C4B5FD] via-[#A7F3D0] to-[#6EE7B7] rounded-[50%_50%_46%_46%_/_60%_60%_40%_40%] border-2 border-[#16192E] p-1 flex items-center justify-center relative shadow-sm my-1 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#16192E] bg-white flex items-center justify-center p-0.5 shadow-inner">
                      <img
                        src={PET_SPECIES_DETAILS.cat.image}
                        onError={(e) => { (e.target as HTMLImageElement).src = PET_SPECIES_DETAILS.cat.imageFallback; }}
                        alt="Кошечка"
                        className="w-full h-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                  </div>
                  <div className="text-center w-full mt-1">
                    <div className="font-pixel text-[9px] font-bold text-emerald-800">КОШЕЧКА</div>
                    <div className="bg-[#E8F5E9] border border-emerald-600/30 rounded px-1 py-0.5 mt-1 text-[8.5px] font-extrabold text-emerald-800">
                      ✨ +15% к радости
                    </div>
                    <div className="font-pixel text-[6.5px] text-[#111C2D]/70 mt-1 uppercase">Ласковая &amp; Мурчащая</div>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => { playChime('click'); setStep('name'); }}
                  className="w-full bg-[#16192E] text-[#FFD700] border-2 border-[#16192E] rounded-xl py-2 px-2 shadow-[0_3px_0_#0D111F] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-transform"
                >
                  <span className="font-pixel text-[8.5px] uppercase tracking-wide">
                    [ НАЖМИТЕ (A) ЧТОБЫ СОГЛАСОВАТЬ ]
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ----------------- SCREEN 3: BIRTH CERTIFICATE & PASSPORT ----------------- */}
          {step === 'name' && (
            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Top LCD Status */}
              <div className="flex justify-between items-center text-[10px] font-vt border-b border-[#111C2D]/15 pb-1">
                <span className="text-emerald-800 font-bold">SYS.HATCH // V1.0</span>
                <span className="text-[#BA0029] font-black text-[9px]">CO-OP SYNC: OK</span>
                <span className="text-emerald-800 font-bold">PWR: 100%</span>
              </div>

              {/* Title */}
              <div className="text-center my-0.5">
                <div className="inline-block bg-[#16192E] px-2.5 py-0.5 rounded shadow-sm">
                  <h2 className="font-pixel text-[9px] text-[#32FF98] uppercase">
                    ✨ РОЖДЕНИЕ: НОВЫЙ ДРУГ ВЫЛУПИЛСЯ!
                  </h2>
                </div>
                <p className="text-[10px] font-bold text-[#111C2D]/70 mt-0.5">
                  Свидетельство о рождении питомца пары
                </p>
              </div>

              {/* Cracked Egg Avatar Stage */}
              <div className="relative flex flex-col items-center justify-center my-auto py-1">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute w-28 h-28 rounded-full bg-[#FFD600]/30 filter blur-md animate-pulse"></div>
                  <div className="w-26 h-26 rounded-3xl overflow-hidden border-3 border-[#16192E] bg-white shadow-[0_4px_0_#16192E] flex items-center justify-center p-1 relative z-10">
                    <img
                      src={PET_SPECIES_DETAILS[selectedSpecies].image}
                      onError={(e) => { (e.target as HTMLImageElement).src = PET_SPECIES_DETAILS[selectedSpecies].imageFallback; }}
                      alt={selectedSpecies}
                      className="w-full h-full object-contain filter drop-shadow animate-pet-wiggle"
                    />
                  </div>
                  {/* Floating sparkles */}
                  <span className="absolute -top-1 left-2 text-base animate-bounce z-20">✦</span>
                  <span className="absolute top-0 right-2 text-base animate-pulse z-20">✨</span>
                  <span className="absolute bottom-1 right-1 text-base animate-ping z-20">💖</span>
                </div>
                <div className="mt-1 flex items-center gap-1 bg-[#16192E] text-[#FFD700] px-3 py-0.5 rounded-full font-pixel text-[8px]">
                  <span>★</span>
                  <span>НОВЫЙ ХРАНИТЕЛЬ АКТИВИРОВАН</span>
                  <span>★</span>
                </div>
              </div>

              {/* Birth Certificate Form Card */}
              <div className="bg-white/95 border border-[#111C2D]/30 rounded-xl p-2.5 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#111C2D]/15 pb-1">
                  <span className="font-pixel text-[8px] font-bold text-[#BA0029] flex items-center gap-1">
                    📜 СВИДЕТЕЛЬСТВО О РОЖДЕНИИ #001
                  </span>
                  <span className="font-pixel text-[7px] bg-[#16192E] text-white px-1.5 py-0.5 rounded">
                    ПАРА: СОЮЗ
                  </span>
                </div>

                {/* Name Input Row + Dice Randomizer */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="flex-1 bg-[#EEF8E8] border border-[#111C2D] rounded-lg px-2 py-1 flex items-center justify-between shadow-inner">
                    <span className="font-pixel text-[8.5px] text-[#111C2D]/70 mr-1">ИМЯ: [</span>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value.slice(0, 20))}
                      maxLength={20}
                      className="bg-transparent font-pixel text-[10px] text-[#BA0029] tracking-wider uppercase focus:outline-none w-full font-black text-center"
                      placeholder="Бусинка"
                    />
                    <span className="font-pixel text-[8.5px] text-[#111C2D]/70">]</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRandomName}
                    title="Случайное имя"
                    className="bg-[#FFE600] active:translate-y-0.5 text-[#111C2D] border border-[#111C2D] rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-[0_2px_0_#111C2D] cursor-pointer shrink-0 font-pixel text-[8px] font-bold"
                  >
                    <span>🎲</span>
                    <span>РАНДОМ</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-[8.5px] text-[#111C2D]/80 border-t border-[#111C2D]/10">
                  <span className="truncate">● Синхронизация: подтвердит имя в приложении</span>
                  <span className="font-pixel text-[7px] bg-[#BA0029] text-white px-1 rounded shrink-0">
                    {PET_SPECIES_DETAILS[selectedSpecies].badge}
                  </span>
                </div>
              </div>

              {/* Confirmation Action Button */}
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={handleBirth}
                  disabled={isLoading || !petName.trim()}
                  className="w-full bg-[#16192E] text-[#FFD700] border-2 border-[#16192E] rounded-xl py-2 px-2 shadow-[0_3px_0_#0D111F] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-transform disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-sm">✨</span>
                  <span className="font-pixel text-[8.5px] uppercase tracking-tight">
                    {isLoading ? "ОФОРМЛЯЕМ..." : "ВЫДАТЬ ПАСПОРТ & В КОМНАТУ (ЖМИ А)"}
                  </span>
                  <span className="bg-[#FFD700] text-[#16192E] font-pixel text-[7px] px-1 py-0.5 rounded font-black">
                    [+50 XP]
                  </span>
                </button>
              </div>

              {error && (
                <div className="text-center font-bold text-xs text-[#BA0029] bg-rose-50 p-1 rounded mt-1">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ----------------- SCREEN 4 & 5 & 6: GAMEPLAY / PAUSE / SLEEP ----------------- */}
          {step === 'game' && pet && (
            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* PAUSE / SETTINGS MODAL OVERLAY (SCREEN 5) */}
              {isPauseMenuOpen ? (
                <div className="flex flex-col justify-between h-full space-y-2">
                  {/* Pause Header */}
                  <div className="w-full flex items-center justify-between bg-[#111C2D] text-white px-2.5 py-1.5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-[#FFD600] animate-spin" style={{ animationDuration: '3s' }}>⚙️</span>
                      <span className="font-pixel text-[9px] tracking-wider text-[#FFD600]">
                        [ PAUSE // МЕНЮ СОЮЗА (B) ]
                      </span>
                    </div>
                    <span className="font-pixel text-[7.5px] bg-[#BA0029] px-1.5 py-0.5 rounded text-white">
                      АКТИВНО
                    </span>
                  </div>

                  {/* Menu Items Grid */}
                  <div className="my-auto space-y-2">
                    {/* Item 1: Sound & Haptics Toggle */}
                    <div
                      onClick={toggleSound}
                      className="bg-white/95 rounded-xl p-2.5 border border-[#111C2D] shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{soundEnabled ? "🔊" : "🔇"}</span>
                        <div>
                          <div className="font-bold text-[11px] text-[#111C2D]">ЗВУК &amp; ВИБРО</div>
                          <div className="text-[9px] text-[#111C2D]/60 font-medium">8-бит щелчки и виброотклик</div>
                        </div>
                      </div>
                      <div className={`font-pixel text-[8px] px-2 py-0.5 rounded font-black ${
                        soundEnabled ? "bg-[#22C55E] text-[#111C2D]" : "bg-zinc-200 text-zinc-600"
                      }`}>
                        {soundEnabled ? "ВКЛ" : "ВЫКЛ"}
                      </div>
                    </div>

                    {/* Item 2: Co-op Partner Sync Status */}
                    <div className="bg-white/95 rounded-xl p-2.5 border border-[#111C2D] shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔄</span>
                        <div>
                          <div className="font-bold text-[11px] text-[#111C2D]">СИНХРОНИЗАЦИЯ ПАРЫ</div>
                          <div className="text-[9px] text-[#111C2D]/60 font-medium">98% связь • Онлайн союза OK</div>
                        </div>
                      </div>
                      <span className="font-pixel text-[7.5px] bg-[#E8F5E9] text-emerald-800 border border-emerald-600/30 px-1.5 py-0.5 rounded font-bold">
                        ТАЙМИНГ OK
                      </span>
                    </div>

                    {/* Item 3: Pet Name */}
                    <div className="bg-white/95 rounded-xl p-2.5 border border-[#111C2D] shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏷️</span>
                        <div>
                          <div className="font-bold text-[11px] text-[#111C2D]">ИМЯ ПИТОМЦА</div>
                          <div className="text-[9px] text-[#111C2D]/60 font-medium">Статус: Подтверждено парой</div>
                        </div>
                      </div>
                      <span className="font-pixel text-[8px] bg-[#FFE600] text-[#111C2D] border border-[#111C2D] px-2 py-0.5 rounded font-black">
                        {pet.name}
                      </span>
                    </div>

                    {/* Item 4: Exit to Lobby Dashboard */}
                    <div
                      onClick={onClose}
                      className="bg-[#FFF0F2] rounded-xl p-2.5 border border-[#BA0029] shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🚪</span>
                        <div>
                          <div className="font-bold text-[11px] text-[#BA0029]">ВЫХОД В ЛОББИ</div>
                          <div className="text-[9px] text-[#111C2D]/60 font-medium">Вернуться в главный дашборд</div>
                        </div>
                      </div>
                      <span className="font-pixel text-[8px] text-[#BA0029]">ВЫХОД ▶</span>
                    </div>
                  </div>

                  {/* Return to Game Banner Button */}
                  <button
                    type="button"
                    onClick={() => { playChime('click'); setIsPauseMenuOpen(false); }}
                    className="w-full bg-[#111C2D] text-[#38E5FF] border-2 border-[#111C2D] rounded-xl py-2 px-3 shadow-[0_3px_0_#0D111F] flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform"
                  >
                    <span className="font-pixel text-[9px] uppercase tracking-wide">
                      [ B ] ВЕРНУТЬСЯ В ИГРУ С ПИТОМЦЕМ
                    </span>
                  </button>
                </div>
              ) : isNightOrSleepy ? (
                /* ----------------- SCREEN 6: NIGHT / SLEEP MODE ----------------- */
                <div className="flex flex-col justify-between h-full space-y-1">
                  {/* Night Top Ticker */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300 border-b border-cyan-500/20 pb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-300">🌙</span>
                      <span>НОЧНОЙ РЕЖИМ • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <span className="text-emerald-400">CO-OP СПЯТ</span>
                      <span className="bg-[#111C2D] text-cyan-300 px-1 rounded text-[8px]">
                        ЭНРГ: {pet.energy}%
                      </span>
                    </div>
                  </div>

                  {/* 4 Need Gauges (Sleep Mode) */}
                  <div className="grid grid-cols-4 gap-1.5 my-0.5">
                    <div className="bg-[#131F42] border border-cyan-500/30 rounded p-1 text-center">
                      <div className="text-[7.5px] font-bold text-yellow-300 flex justify-between">
                        <span>СЫТ</span><span>{pet.hunger}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pet.hunger}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-[#131F42] border border-cyan-500/30 rounded p-1 text-center">
                      <div className="text-[7.5px] font-bold text-cyan-300 flex justify-between">
                        <span>РАД</span><span>{pet.joy}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pet.joy}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-[#131F42] border border-cyan-500/30 rounded p-1 text-center">
                      <div className="text-[7.5px] font-bold text-sky-300 flex justify-between animate-pulse">
                        <span>СОН</span><span>{pet.energy}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-sky-400 rounded-full animate-pulse" style={{ width: `${pet.energy}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-[#131F42] border border-cyan-500/30 rounded p-1 text-center">
                      <div className="text-[7.5px] font-bold text-emerald-300 flex justify-between">
                        <span>ЧИСТ</span><span>{pet.cleanliness}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pet.cleanliness}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Sleep Warning Tag */}
                  <div className="self-center px-2 py-0.5 rounded-full bg-[#1A264F] border border-cyan-400/40 text-[9px] font-bold text-cyan-200 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>⚠️ {pet.name.toUpperCase()} КЛЮЁТ НОСОМ • УЛОЖИТЕ МАЛЫША</span>
                  </div>

                  {/* Sleeping Pet Stage with Cloud Pillow & Floating Zzz */}
                  <div className="relative flex-1 flex flex-col items-center justify-center min-h-0 my-0.5">
                    {/* Sky Decors */}
                    <div className="absolute top-1 left-3 text-yellow-300 text-xl animate-bounce">🌙</div>
                    <div className="absolute top-2 right-6 text-yellow-200 text-xs animate-ping">✦</div>
                    <div className="absolute bottom-2 left-5 text-cyan-300 text-xs">✨</div>

                    {/* Floating Zzz */}
                    <div className="absolute top-1 right-8 flex flex-col items-end text-cyan-300 font-pixel text-xs animate-pulse">
                      <span className="text-[8px] opacity-40">z</span>
                      <span className="text-[10px] opacity-70">Z</span>
                      <span className="text-[12px] opacity-90 drop-shadow-[0_0_6px_#06B6D4]">Z</span>
                    </div>

                    {/* Cloud Pillow + Sleeping Pet Sprite */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-cyan-400/70 shadow-[0_0_24px_rgba(6,182,212,0.5)] bg-[#131F42] flex items-center justify-center p-1">
                        <img
                          src={SLEEP_IMAGE}
                          onError={(e) => { (e.target as HTMLImageElement).src = SLEEP_IMAGE_FALLBACK; }}
                          alt="Спящий питомец"
                          className="w-full h-full object-contain filter drop-shadow-md animate-pulse"
                          style={{ animationDuration: '3.5s' }}
                        />
                      </div>
                      <div className="absolute -bottom-1.5 bg-[#A855F7] text-white font-pixel text-[8px] px-3 py-0.5 rounded-full border border-white/30 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        💤 СЛАДКО СПИТ
                      </div>
                    </div>
                  </div>

                  {/* Sleep Prompt Card */}
                  <div className="rounded-xl bg-[#131F42] border border-cyan-500/40 p-2 text-center">
                    <div className="text-[9.5px] font-bold text-yellow-300">
                      🌙 ТИХИЙ ЧАС И ВОССТАНОВЛЕНИЕ ЭНЕРГИИ
                    </div>
                    <div className="text-[8px] text-cyan-200 mt-0.5">
                      Сон восполняет силы и дарит спокойствие союзу
                    </div>
                  </div>

                  {/* Sleep / Wake Action Button */}
                  <button
                    type="button"
                    onClick={() => handleAction('sleep')}
                    disabled={isLoading}
                    className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#16192E] rounded-xl py-2 px-3 shadow-[0_3px_0_#111C2D] flex items-center justify-between active:translate-y-0.5 transition-transform cursor-pointer"
                  >
                    <span className="font-pixel text-[8.5px] uppercase">
                      🌙 УЛОЖИТЬ СПАТЬ (ЖМИ А)
                    </span>
                    <span className="bg-[#FFE600] text-[#111C2D] font-pixel text-[7.5px] px-1.5 py-0.5 rounded font-black">
                      +25 XP 💤
                    </span>
                  </button>
                </div>
              ) : (
                /* ----------------- SCREEN 4: DAY ACTIVE GAMEPLAY ----------------- */
                <div className="flex flex-col justify-between h-full space-y-1">
                  {/* 1. Top LCD Status Row */}
                  <div className="flex items-center justify-between pb-1 border-b border-[#111C2D]/15 text-[9px] font-bold text-[#111C2D]">
                    <div className="flex items-center gap-1">
                      <span>🔥 СТРИК 42 ДНЯ</span>
                      <span className="text-[#111C2D]/40">•</span>
                      <span>1.2 КГ</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-emerald-800">CO-OP: OK</span>
                      <span className="bg-[#111C2D] text-[#32FF98] px-1.5 py-0.2 rounded font-pixel text-[7.5px]">
                        PWR: 99%
                      </span>
                    </div>
                  </div>

                  {/* 2. Four Vital Stat Bars */}
                  <div className="grid grid-cols-4 gap-1.5 my-0.5">
                    {/* СЫТОСТЬ */}
                    <div className="bg-white/95 border border-[#111C2D] rounded-lg p-1 text-center shadow-xs">
                      <div className="flex items-center justify-between text-[7.5px] font-black text-[#111C2D] mb-0.5">
                        <span>🍓 СЫТ</span>
                        <span className="text-[#BA0029]">{pet.hunger}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#111C2D]/15 rounded-full overflow-hidden">
                        <div className="h-full bg-[#BA0029] rounded-full transition-all duration-500" style={{ width: `${pet.hunger}%` }}></div>
                      </div>
                    </div>

                    {/* РАДОСТЬ */}
                    <div className="bg-white/95 border border-[#111C2D] rounded-lg p-1 text-center shadow-xs">
                      <div className="flex items-center justify-between text-[7.5px] font-black text-[#111C2D] mb-0.5">
                        <span>⚡ РАД</span>
                        <span className="text-amber-500">{pet.joy}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#111C2D]/15 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFD600] rounded-full transition-all duration-500" style={{ width: `${pet.joy}%` }}></div>
                      </div>
                    </div>

                    {/* ЭНЕРГИЯ */}
                    <div className="bg-white/95 border border-[#111C2D] rounded-lg p-1 text-center shadow-xs">
                      <div className="flex items-center justify-between text-[7.5px] font-black text-[#111C2D] mb-0.5">
                        <span>💤 ЭНРГ</span>
                        <span className="text-cyan-600">{pet.energy}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#111C2D]/15 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00BCD4] rounded-full transition-all duration-500" style={{ width: `${pet.energy}%` }}></div>
                      </div>
                    </div>

                    {/* ЧИСТОТА */}
                    <div className="bg-white/95 border border-[#111C2D] rounded-lg p-1 text-center shadow-xs">
                      <div className="flex items-center justify-between text-[7.5px] font-black text-[#111C2D] mb-0.5">
                        <span>🧼 ЧИСТ</span>
                        <span className="text-emerald-600">{pet.cleanliness}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#111C2D]/15 rounded-full overflow-hidden">
                        <div className="h-full bg-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${pet.cleanliness}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Central Pet Display & Interactive Stage (Large, Cute & Funny) */}
                  <div
                    onClick={triggerHeartBurst}
                    className="relative flex-1 flex flex-col items-center justify-center my-0.5 cursor-pointer select-none"
                    title="Тапните по питомцу, чтобы погладить!"
                  >
                    {/* Floating Thought Bubble Above Pet (Funny & Dynamic) */}
                    <div className="mb-1 flex items-center justify-center max-w-[280px]">
                      <div className="bg-white border-[1.5px] border-[#16192E] rounded-full px-3 py-1 text-[9.5px] font-bold shadow-[2px_2px_0px_#16192E] inline-flex items-center gap-1.5 animate-bounce text-center">
                        <span className="text-xs">{pet.species === 'cat' ? '🐱' : '🐶'}</span>
                        <span className="text-[#16192E] font-black tracking-tight leading-tight">
                          {currentFunnyQuote || (MOOD_BUBBLES[pet.mood] || "Тяв! Люблю вас! 💖")}
                        </span>
                        <span className="text-xs">✨</span>
                      </div>
                    </div>

                    {/* Prominent Pet Avatar Stage */}
                    <div className="relative flex items-center justify-center">
                      {/* Soft pulsating warm halo */}
                      <div className="absolute w-32 h-32 rounded-full bg-[#FFD600]/30 filter blur-md animate-pulse pointer-events-none" />

                      {/* Rotating retro aura ring */}
                      <div
                        className="w-36 h-36 rounded-full border-2 border-dashed border-[#FFD600] animate-spin absolute pointer-events-none opacity-80"
                        style={{ animationDuration: '24s' }}
                      />

                      {/* Freestanding Cute Pet Avatar */}
                      <div
                        className={`relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-white/95 border-3 border-[#16192E] shadow-[0_6px_0_#16192E] flex items-center justify-center p-1.5 transition-transform duration-200 ${
                          isBouncing ? 'scale-110 -rotate-3' : 'active:scale-95'
                        }`}
                      >
                        <img
                          src={PET_SPECIES_DETAILS[pet.species].image}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PET_SPECIES_DETAILS[pet.species].imageFallback;
                          }}
                          alt={pet.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(22,25,46,0.25)] select-none animate-pet-wiggle"
                        />
                      </div>

                      {/* Purr / Waggle Badge on Tap */}
                      {showPurrBadge && (
                        <div className="absolute -right-3 top-0 bg-[#FFE600] text-[#16192E] border-2 border-[#16192E] px-2 py-0.5 rounded-full font-pixel text-[8px] font-black shadow-[2px_2px_0px_#16192E] z-30 animate-pulse">
                          {pet.species === 'cat' ? "МУРРР~ +5❤️" : "ГАВ-ГАВ! +5❤️"}
                        </div>
                      )}

                      {/* Floating Hearts Eruption */}
                      {floatingHearts.map((h) => (
                        <span
                          key={h.id}
                          className="absolute pointer-events-none text-lg z-30 transition-all duration-700 ease-out select-none"
                          style={{
                            left: `${h.x}px`,
                            top: `${h.y}px`,
                            transform: `translate(${h.targetX}px, ${h.targetY}px) scale(1.3)`,
                            opacity: 0,
                          }}
                        >
                          {h.emoji}
                        </span>
                      ))}
                    </div>

                    {/* Cute Ground Shadow */}
                    <div className="w-24 h-2 bg-[#16192E]/15 rounded-full mx-auto mt-1 blur-2xs" />

                    {/* Pet Status Badge Below */}
                    <div className="mt-1 flex items-center gap-1 bg-white/95 border-[1.5px] border-[#16192E] rounded-full px-2.5 py-0.5 shadow-xs">
                      <span className="text-[9.5px] font-black text-[#111C2D]">
                        {pet.species === 'cat' ? "Кошечка" : "Чихуахуа"} {pet.name} • Lv.{pet.level} 🐾
                      </span>
                      <span className="bg-[#FFE600] text-[#111C2D] text-[7.5px] font-black px-1.5 py-0.2 rounded-full border border-[#111C2D]">
                        x2 БОНУС
                      </span>
                    </div>

                    <div className="text-[8px] text-[#16192E]/60 font-bold mt-0.5 flex items-center gap-1">
                      <span>👆</span>
                      <span>Тапни по {pet.name}, чтобы погладить и развеселить!</span>
                    </div>
                  </div>

                  {/* 4. Duo Synergy Progress */}
                  <div className="bg-white/95 border-[1.5px] border-[#111C2D] rounded-xl p-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-[8.5px] font-black text-[#111C2D] mb-0.5">
                      <span className="text-[#BA0029] flex items-center gap-1">♡ СИНЕРГИЯ ДУО</span>
                      <span className="text-[#725C00]">РОСТ 2X БЫСТРЕЕ ⚡</span>
                    </div>
                    <div className="w-full h-2 bg-[#111C2D]/15 rounded-full overflow-hidden border border-[#111C2D]/20 relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#BA0029] via-[#FFD600] to-[#22C55E] rounded-full transition-all duration-500"
                        style={{ width: `${pet.synergy ?? 95}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[7.5px] text-[#111C2D]/80 font-bold mt-0.5 px-0.5">
                      <span>Аура пары: Радужное сияние</span>
                      <span className="font-black text-[#111C2D]">{pet.synergy ?? 95}% Резонанс</span>
                    </div>
                  </div>

                  {/* 5. Quick Actions Care Menu (2x2 Grid) */}
                  <div className="bg-white/95 rounded-xl p-1.5 border-[1.5px] border-[#111C2D] shadow-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between border-b border-[#111C2D]/15 pb-0.5">
                      <span className="font-pixel text-[8px] font-bold text-[#111C2D]">🎮 БЫСТРЫЕ ДЕЙСТВИЯ</span>
                      <button
                        type="button"
                        onClick={() => { playChime('click'); setIsPauseMenuOpen(true); }}
                        className="bg-[#00BCD4] text-[#111C2D] text-[7px] font-black px-1.5 py-0.2 rounded border border-[#111C2D] cursor-pointer"
                      >
                        МЕНЮ (B)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Card 1: Покормить */}
                      <div
                        onClick={() => { playChime('click'); setSelectedQuickAction('feed'); }}
                        className={`rounded-lg p-1 flex items-center gap-1.5 cursor-pointer transition-all ${
                          selectedQuickAction === 'feed'
                            ? 'bg-[#FEF08A] border-2 border-[#FB083C] shadow-[1px_1px_0px_#111C2D]'
                            : 'bg-white/90 border border-[#111C2D] shadow-xs'
                        }`}
                      >
                        <span className="text-sm">🍓</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[8.5px] font-black text-[#111C2D] leading-none">Покормить</span>
                            {selectedQuickAction === 'feed' && (
                              <span className="bg-[#BA0029] text-white text-[6px] font-black px-1 rounded">ЖМИ А</span>
                            )}
                          </div>
                          <span className="text-[6.5px] text-[#BA0029] font-black mt-0.5">+15 XP 🐟</span>
                        </div>
                      </div>

                      {/* Card 2: Поиграть */}
                      <div
                        onClick={() => { playChime('click'); setSelectedQuickAction('play'); }}
                        className={`rounded-lg p-1 flex items-center gap-1.5 cursor-pointer transition-all ${
                          selectedQuickAction === 'play'
                            ? 'bg-[#FEF08A] border-2 border-[#FB083C] shadow-[1px_1px_0px_#111C2D]'
                            : 'bg-white/90 border border-[#111C2D] shadow-xs'
                        }`}
                      >
                        <span className="text-sm">🎾</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[8.5px] font-black text-[#111C2D] leading-none">Поиграть</span>
                            {selectedQuickAction === 'play' && (
                              <span className="bg-[#BA0029] text-white text-[6px] font-black px-1 rounded">ЖМИ А</span>
                            )}
                          </div>
                          <span className="text-[6.5px] text-[#22C55E] font-black mt-0.5">+20 XP ⚡</span>
                        </div>
                      </div>

                      {/* Card 3: Ванна & Мыло */}
                      <div
                        onClick={() => { playChime('click'); setSelectedQuickAction('wash'); }}
                        className={`rounded-lg p-1 flex items-center gap-1.5 cursor-pointer transition-all ${
                          selectedQuickAction === 'wash'
                            ? 'bg-[#FEF08A] border-2 border-[#FB083C] shadow-[1px_1px_0px_#111C2D]'
                            : 'bg-white/90 border border-[#111C2D] shadow-xs'
                        }`}
                      >
                        <span className="text-sm">🧼</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[8.5px] font-black text-[#111C2D] leading-none">Ванна &amp; Мыло</span>
                            {selectedQuickAction === 'wash' && (
                              <span className="bg-[#BA0029] text-white text-[6px] font-black px-1 rounded">ЖМИ А</span>
                            )}
                          </div>
                          <span className="text-[6.5px] text-[#00BCD4] font-black mt-0.5">+15 XP 🫧</span>
                        </div>
                      </div>

                      {/* Card 4: Уложить спать */}
                      <div
                        onClick={() => { playChime('click'); setSelectedQuickAction('sleep'); }}
                        className={`rounded-lg p-1 flex items-center gap-1.5 cursor-pointer transition-all ${
                          selectedQuickAction === 'sleep'
                            ? 'bg-[#FEF08A] border-2 border-[#FB083C] shadow-[1px_1px_0px_#111C2D]'
                            : 'bg-white/90 border border-[#111C2D] shadow-xs'
                        }`}
                      >
                        <span className="text-sm">🌙</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[8.5px] font-black text-[#111C2D] leading-none">Уложить спать</span>
                            {selectedQuickAction === 'sleep' && (
                              <span className="bg-[#BA0029] text-white text-[6px] font-black px-1 rounded">ЖМИ А</span>
                            )}
                          </div>
                          <span className="text-[6.5px] text-[#725C00] font-black mt-0.5">+25 XP 💤</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Primary Action Banner Button */}
                  <button
                    type="button"
                    onClick={() => handleAction(selectedQuickAction)}
                    disabled={isLoading}
                    className="w-full bg-[#BA0029] hover:bg-[#E90036] active:scale-[0.98] border-[2.5px] border-[#111C2D] rounded-xl py-2 px-3 flex items-center justify-between shadow-[0_3px_0_#111C2D] text-white transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-black tracking-wide">
                      <span>🍽</span>
                      <span className="truncate">
                        {actionFeedback || `ПОКОРМИТЬ ${pet.name.toUpperCase()} (ЖМИ А)`}
                      </span>
                    </span>
                    <span className="bg-[#FFD600] text-[#111C2D] font-black text-[9px] px-2 py-0.5 rounded-full border border-[#111C2D] shadow-xs shrink-0">
                      +15 XP
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================== LOWER MECHANICAL CONTROLS ===================== */}
        <div className="w-full flex flex-col justify-end shrink-0 pt-1">
          <div className="flex items-center justify-between px-1">
            {/* Left: Classic D-Pad Cross */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 relative flex items-center justify-center">
                {/* Mold Base */}
                <div className="absolute w-7 h-20 bg-[#16192E] rounded-md shadow-[1px_2px_0_rgba(0,0,0,0.3)]"></div>
                <div className="absolute w-20 h-7 bg-[#16192E] rounded-md shadow-[1px_2px_0_rgba(0,0,0,0.3)]"></div>

                {/* D-Pad Buttons */}
                <button
                  type="button"
                  aria-label="Up"
                  onClick={() => { playChime('click'); setSelectedQuickAction('feed'); }}
                  className="absolute top-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-t-sm flex items-center justify-center text-white active:translate-y-0.5 cursor-pointer"
                >
                  <span className="text-[12px] font-bold">▲</span>
                </button>
                <button
                  type="button"
                  aria-label="Down"
                  onClick={() => { playChime('click'); setSelectedQuickAction('sleep'); }}
                  className="absolute bottom-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-b-sm flex items-center justify-center text-white active:-translate-y-0.5 cursor-pointer"
                >
                  <span className="text-[12px] font-bold">▼</span>
                </button>
                <button
                  type="button"
                  aria-label="Left"
                  onClick={() => {
                    playChime('click');
                    if (step === 'egg') setSelectedSpecies('dog');
                    else setSelectedQuickAction('wash');
                  }}
                  className="absolute left-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-l-sm flex items-center justify-center text-white active:translate-x-0.5 cursor-pointer"
                >
                  <span className="text-[12px] font-bold">◀</span>
                </button>
                <button
                  type="button"
                  aria-label="Right"
                  onClick={() => {
                    playChime('click');
                    if (step === 'egg') setSelectedSpecies('cat');
                    else setSelectedQuickAction('play');
                  }}
                  className="absolute right-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-r-sm flex items-center justify-center text-white active:-translate-x-0.5 cursor-pointer"
                >
                  <span className="text-[12px] font-bold">▶</span>
                </button>
                {/* Center Pivot */}
                <div className="w-5 h-5 bg-[#181D29] rounded-full z-10 pointer-events-none"></div>
              </div>
              <span className="text-[7.5px] font-pixel text-[#16192E]/80 mt-1 uppercase tracking-tight">D-PAD</span>
            </div>

            {/* Center: Slanted Rubber Oval Buttons */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => { playChime('click'); toggleSound(); }}
                    className="w-8 h-3.5 bg-[#16192E] rounded-full transform -rotate-12 border border-[#16192E]/40 active:translate-y-0.5 shadow-sm cursor-pointer"
                  ></button>
                  <span className="text-[7px] font-pixel text-[#16192E] uppercase mt-1">ЗВУК</span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => { playChime('click'); setIsPauseMenuOpen(p => !p); }}
                    className="w-8 h-3.5 bg-[#16192E] rounded-full transform -rotate-12 border border-[#16192E]/40 active:translate-y-0.5 shadow-sm cursor-pointer"
                  ></button>
                  <span className="text-[7px] font-pixel text-[#16192E] uppercase mt-1">START</span>
                </div>
              </div>
              <div className="text-center mt-0.5">
                <span className="font-pixel text-[7.5px] text-[#16192E] tracking-wide block">★ RETRO CO-OP ★</span>
                <span className="text-[7px] font-bold text-[#16192E]/70 block">A: ДЕЙСТВИЕ • B: МЕНЮ</span>
              </div>
            </div>

            {/* Right: Round Arcade Action Buttons (B & A) */}
            <div className="flex items-center gap-2.5">
              {/* Button B */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  id="btnB"
                  onClick={handleButtonB}
                  className="w-12 h-12 rounded-full bg-[#00BCD4] border-[3px] border-[#16192E] font-black text-lg text-white shadow-[0_3px_0_#16192E] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
                >
                  B
                </button>
                <span className="text-[7.5px] font-pixel text-[#16192E] mt-1 uppercase">МЕНЮ</span>
              </div>

              {/* Button A */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  id="btnA"
                  onClick={handleButtonA}
                  className="w-12 h-12 rounded-full bg-[#FFD600] border-[3px] border-[#16192E] font-black text-lg text-[#16192E] shadow-[0_3px_0_#16192E] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
                >
                  A
                </button>
                <span className="text-[7.5px] font-pixel text-[#BA0029] mt-1 uppercase">ДЕЙСТВИЕ</span>
              </div>
            </div>
          </div>

          {/* Bottom Brand Imprint */}
          <div className="mt-1 flex items-center justify-center gap-1 text-[#BA0029]/70">
            <span className="text-[8px] font-pixel tracking-widest uppercase">LOOP.EXE CO-OP SYSTEM</span>
            <span className="text-[8px]">♡</span>
          </div>
        </div>
      </div>
    </div>
  );
};
