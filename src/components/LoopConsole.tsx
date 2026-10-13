import React, { useState, useEffect, useRef } from 'react';
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
  switchPetSpeciesApi
} from "../api/pet.api.ts";
import { TamagotchiDevice } from "./TamagotchiDevice.tsx";
import { triggerHaptic } from "../utils/haptics.ts";
import { safeGetStorage } from "../utils/safeStorage.ts";

interface LoopConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onPetCreated?: (petState: CouplePetState) => void;
  onPetUpdated?: (petState: CouplePetState) => void;
  initialPetState?: CouplePetState;
}

const BIOS_LINES = [
  "LOOP BIOS v2.1.0 (C) 2024 Loop Technologies",
  "CPU: Dual-core 2.4GHz | RAM: 4GB LPDDR4",
  "Storage: 64GB eMMC | Display: 4.0\" OLED 800x480",
  "",
  "Initializing hardware...",
  "  [OK] ARM Cortex-A53 cores",
  "  [OK] Mali-G52 GPU",
  "  [OK] Display controller",
  "  [OK] Audio codec",
  "  [OK] Touch sensor",
  "  [OK] Vibration motor",
  "",
  "Checking system integrity...",
  "  [OK] Firmware signature valid",
  "  [OK] Secure boot enabled",
  "  [OK] Encryption keys loaded",
  "",
  "Loading device drivers...",
  "  [OK] loop-pet.sys",
  "  [OK] loop-ux.drv",
  "  [OK] loop-audio.drv",
  "",
  "Starting system services...",
  "  [OK] Pet lifecycle service",
  "  [OK] Statistics engine",
  "  [OK] Event logger",
  "",
  "LOOP.exe ready.",
  "",
  "Press any key to continue..."
];

const RANDOM_NAMES = ["Бусинка", "Пиксель", "Моти", "Зефирка", "Пончик", "Чипсик", "Лучик", "Байт"];

const SPECIES_INFO: Record<PetSpecies, { title: string; emoji: string; trait: string; bonus: string }> = {
  dog: { title: "Чихуахуа", emoji: "🐶", trait: "Преданный и бодрый", bonus: "+15% к энергии" },
  cat: { title: "Кошечка", emoji: "🐱", trait: "Ласковая и мурчащая", bonus: "+15% к радости" },
};

interface LoopConsoleState {
  step: 'bios' | 'egg' | 'name' | 'tutorial' | 'game';
  biosLineIndex: number;
  selectedSpecies: PetSpecies;
  petName: string;
  nameStatus: PetNameStatus;
  nameProposedBy: string | null;
  isLoading: boolean;
  error: string | null;
  // Current pet state (for game step)
  pet: CouplePetState | null;
}

export const LoopConsole: React.FC<LoopConsoleProps> = ({
  isOpen,
  onClose,
  onPetCreated,
  onPetUpdated,
  initialPetState
}) => {
const [state, setState] = useState<LoopConsoleState>({
    step: initialPetState ? 'game' : 'bios',
    biosLineIndex: 0,
    selectedSpecies: initialPetState ? initialPetState.species : 'dog',
    petName: initialPetState ? initialPetState.name : 'Бусинка',
    nameStatus: initialPetState ? initialPetState.nameStatus : 'pending_partner',
    nameProposedBy: initialPetState ? (initialPetState.nameProposedBy ?? null) : null,
    isLoading: false,
    error: null,
    pet: initialPetState ?? null,
});

  const biosRef = useRef<number>(0);
  const nameRef = useRef<HTMLInputElement>(null);

  // Start BIOS boot sequence when console opens (only if not starting with pet state)
  useEffect(() => {
    if (!isOpen || initialPetState) return;

    // Reset state when opening
    setState(prev => ({
      ...prev,
      step: 'bios',
      biosLineIndex: 0,
      selectedSpecies: 'dog',
      petName: 'Бусинка',
      nameStatus: 'confirmed',
      nameProposedBy: null,
      isLoading: false,
      error: null,
      pet: null
    }));

    // Start BIOS boot
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.biosLineIndex < BIOS_LINES.length - 1) {
          return { ...prev, biosLineIndex: prev.biosLineIndex + 1 };
        }
        return prev;
      });
    }, 100);

    // Complete BIOS after all lines are shown
    const biosTimeout = setTimeout(() => {
      setState(prev => ({ ...prev, step: 'egg' }));
    }, BIOS_LINES.length * 100 + 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(biosTimeout);
    };
  }, [isOpen, initialPetState]);

  // Handle key presses for BIOS skip
  useEffect(() => {
    if (state.step !== 'bios' || initialPetState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip BIOS on any key press
      setState(prev => ({ ...prev, step: 'egg' }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.step, initialPetState]);

  const getToken = () => {
    try {
      const token = safeGetStorage<string | null>("loop_auth_token", null);
      return token && token.trim() ? token.trim() : null;
    } catch {
      return null;
    }
  };

  const handleBirth = async () => {
    // If we have initial pet state, we're not creating a new pet
    if (initialPetState) return;

    if (state.isLoading) return;

    const token = getToken();
    if (!token) {
      setState(prev => ({ ...prev, error: "Требуется авторизация" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await birthPetApi(
        { species: state.selectedSpecies, name: state.petName.trim() },
        token
      );

triggerHaptic("success");
       setState(prev => ({
         ...prev,
         isLoading: false,
         pet: result
       }));

// Notify parent that pet was created
       if (onPetCreated) {
         onPetCreated(result);
       }

      // Transition to game step
      setState(prev => ({ ...prev, step: 'game' }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.error || err.message || "Неизвестная ошибка"
      }));
      triggerHaptic("error");
    }
  };

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      petName: e.target.value.slice(0, 20)
    }));
  };

  const handleRandomName = () => {
    const pool = RANDOM_NAMES.filter((n) => n !== state.petName);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_NAMES[0];
    setState(prev => ({ ...prev, petName: pick }));
    triggerHaptic("light");
  };

  const handleSpeciesSelect = (species: PetSpecies) => {
    setState(prev => ({ ...prev, selectedSpecies: species }));
    triggerHaptic("light");
  };

  // Game actions
  const handleAction = async (action: PetActionType) => {
    if (!state.pet) return;
    if (state.isLoading) return;

    const token = getToken();
    if (!token) {
      setState(prev => ({ ...prev, error: "Требуется авторизация" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await performPetActionApi(action, token);
      triggerHaptic("light");

// Update pet state with result
       setState(prev => ({
         ...prev,
         isLoading: false,
         pet: result.state!
       }));

// Notify parent of pet update
       if (onPetUpdated) {
         onPetUpdated(result.state!);
       }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.error || err.message || "Неизвестная ошибка"
      }));
      triggerHaptic("error");
    }
  };

  if (!isOpen) return null;

  const speciesInfo = SPECIES_INFO[state.selectedSpecies];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Pink console shell */}
        <div
          className="bg-[#FFCAD4] border-[3px] border-[#111C2D] p-3.5 rounded-[40px]"
          style={{ boxShadow: "0 12px 0 #111C2D" }}
        >
          <div className="text-center">
            <h3 className="font-pixel text-sm text-[#111C2D]">LOOP.EXE</h3>
            <p className="font-vt text-sm text-[#111C2D]/70">Retro Co-op Console</p>
          </div>
          <div className="mt-3">
            {state.step === 'bios' && (
              <div className="rounded-[24px] bg-[#0B1510] border-[3px] border-[#111C2D] p-3 shadow-inner">
                <div className="font-vt text-[13px] leading-tight text-[#32FF98] whitespace-pre-wrap">
                  {BIOS_LINES.slice(0, state.biosLineIndex + 1).join('\n')}
                  {state.biosLineIndex < BIOS_LINES.length - 1 && (
                    <span className="animate-pulse">_</span>
                  )}
                </div>
              </div>
            )}
            {state.step === 'egg' && (
              <div className="rounded-[24px] bg-[#E8F5E9] border-[3px] border-[#111C2D] p-4 shadow-inner space-y-3">
                <div className="text-center">
                  <div className="text-5xl mb-1 animate-bounce">{speciesInfo.emoji}</div>
                  <h3 className="font-pixel text-[11px] text-[#111C2D]">ВЫБЕРИ ХРАНИТЕЛЯ</h3>
                  <p className="font-vt text-sm text-[#111C2D]/70">Вид — навсегда, у каждого свой бонус</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SPECIES_INFO) as PetSpecies[]).map((species) => {
                    const info = SPECIES_INFO[species];
                    const selected = state.selectedSpecies === species;
                    return (
                      <button
                        key={species}
                        type="button"
                        onClick={() => handleSpeciesSelect(species)}
                        className={`p-2.5 rounded-2xl border-2 transition-all text-left ${
                          selected
                            ? "border-[#111C2D] bg-[#FFE600] shadow-[0_3px_0_#111C2D]"
                            : "border-[#111C2D]/30 bg-white/80 hover:border-[#111C2D]"
                        }`}
                      >
                        <span className="text-3xl block text-center">{info.emoji}</span>
                        <span className="font-pixel text-[8px] text-[#111C2D] block text-center mt-1">{info.title}</span>
                        <span className="font-vt text-xs text-[#111C2D]/70 block text-center">{info.trait}</span>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-[#FB083C] text-white font-vt text-xs">
                          ✨{info.bonus}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, step: 'name' }))}
                  disabled={state.isLoading}
                  className="w-full py-3 rounded-full bg-[#BA0029] border-2 border-[#111C2D] text-white font-pixel text-[10px] disabled:opacity-50 transition-all active:translate-y-0.5"
                  style={{ boxShadow: "0 4px 0 #111C2D" }}
                >
                  {state.isLoading ? 'ВЫБОР...' : 'ПОДТВЕРДИТЬ ВЫБОР ЯЙЦА [+50 XP]'}
                </button>
              </div>
            )}
            {state.step === 'name' && (
              <div className="rounded-[24px] bg-[#E8F5E9] border-[3px] border-[#111C2D] p-4 shadow-inner space-y-3">
                <div className="text-center">
                  <div className="text-5xl mb-1">{speciesInfo.emoji}</div>
                  <h3 className="font-pixel text-[11px] text-[#111C2D]">ВЫДАЙ ПАСПОРТ</h3>
                  <p className="font-vt text-sm text-[#111C2D]/70">Имя останется с питомцем навсегда</p>
                </div>

                <div>
                  <label className="block font-pixel text-[8px] text-[#111C2D]/70 mb-1">ИМЯ:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      ref={nameRef}
                      value={state.petName}
                      onChange={handleNameInput}
                      maxLength={20}
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white border-2 border-[#111C2D] text-[#111C2D] font-bold text-sm focus:outline-none"
                      placeholder="Бусинка"
                    />
                    <button
                      type="button"
                      onClick={handleRandomName}
                      title="Случайное имя"
                      className="shrink-0 w-12 rounded-xl bg-[#FFE600] border-2 border-[#111C2D] text-xl active:translate-y-0.5 transition-transform"
                      style={{ boxShadow: "0 3px 0 #111C2D" }}
                    >
                      🎲
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBirth}
                  disabled={state.isLoading || !state.petName.trim()}
                  className="w-full py-3 rounded-full bg-[#BA0029] border-2 border-[#111C2D] text-white font-pixel text-[10px] disabled:opacity-50 transition-all active:translate-y-0.5"
                  style={{ boxShadow: "0 4px 0 #111C2D" }}
                >
                  {state.isLoading ? 'СОЗДАНИЕ...' : 'ВЫДАТЬ ПАСПОРТ [+50 XP] 🐾'}
                </button>

                {state.error && (
                  <div className="text-sm font-bold text-[#BA0029] animate-pulse text-center">
                    {state.error}
                  </div>
                )}
              </div>
            )}
            {state.step === 'tutorial' && (
              <div className="rounded-[24px] bg-[#E8F5E9] border-[3px] border-[#111C2D] p-4 shadow-inner space-y-3">
                <div className="text-center">
                  <div className="text-5xl mb-1">{state.pet ? '🐾' : speciesInfo.emoji}</div>
                  <h3 className="font-pixel text-[11px] text-[#111C2D]">
                    {state.pet ? 'С ВОЗВРАЩЕНИЕМ!' : 'ДОБРО ПОЖАЛОВАТЬ!'}
                  </h3>
                  <p className="font-vt text-sm text-[#111C2D]/70">
                    {state.pet ? 'Питомец скучал по вам!' : 'Виртуальный друг ждёт заботы!'}
                  </p>
                </div>

                <div className="font-vt text-sm text-[#111C2D] space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[#FB083C]">▶</span>
                    <span>Корми, когда голоден [+15 XP]</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#FB083C]">▶</span>
                    <span>Играй, чтобы радовался [+20 XP]</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#FB083C]">▶</span>
                    <span>Укладывай спать [+25 XP]</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#FB083C]">▶</span>
                    <span>Заботьтесь вдвоём — растёт синергия дуо</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setState(prev => ({ ...prev, step: 'game' }));
                  }}
                  disabled={state.isLoading}
                  className="w-full py-3 rounded-full bg-[#FFE600] border-2 border-[#111C2D] text-[#111C2D] font-pixel text-[10px] transition-all active:translate-y-0.5"
                  style={{ boxShadow: "0 4px 0 #111C2D" }}
                >
                  {state.pet ? 'ВЕРНУТЬСЯ В ИГРУ' : 'НАЧАТЬ ИГРУ (A)'}
                </button>
              </div>
            )}
            {state.step === 'game' && (
              <div>
                {state.pet ? (
                  <TamagotchiDevice
                    isOpen={true}
                    onClose={onClose}
                    petState={{
                      name: state.pet.name,
                      hunger: state.pet.hunger,
                      energy: state.pet.energy,
                      joy: state.pet.joy,
                      level: state.pet.level,
                      experience: state.pet.experience,
                      mood: state.pet.mood,
                      synergy: state.pet.synergy,
                      species: state.pet.species,
                    }}
                    onAction={handleAction}
                    isLoading={state.isLoading}
                  />
                ) : (
                  <div className="rounded-[24px] bg-[#E8F5E9] border-[3px] border-[#111C2D] p-8 text-center">
                    <div className="font-vt text-lg text-[#111C2D]/60">Загрузка...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
