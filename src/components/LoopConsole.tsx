import React, { useState, useEffect, useRef } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="bg-[#0f0f23] p-4 rounded-[2.5rem]">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#00ff00]">LOOP.exe</h3>
            <p className="text-sm text-[#00ff00]/70">Retro Console</p>
          </div>
          <div className="mt-4">
            {state.step === 'bios' && (
              <div className="font-mono text-[#00ff00] text-[11px] leading-tight whitespace-pre">
                {BIOS_LINES.slice(0, state.biosLineIndex + 1).join('\n')}
                {state.biosLineIndex < BIOS_LINES.length - 1 && (
                  <span className="animate-blink">_</span>
                )}
              </div>
            )}
            {state.step === 'egg' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{state.selectedSpecies === 'dog' ? '🐶' : '🐱'}</div>
                  <h3 className="font-bold text-xl text-[#00ff00]">Выберите яйцо питомца</h3>
                  <p className="text-sm text-[#00ff00]/70 mb-4">Это определит вид вашего питомца на всю жизнь</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[#00ff00]/70 mb-1">Вид питомца</label>
                    <div className="flex justify-center gap-4">
                      {['dog', 'cat'].map(species => (
                        <button
                          key={species}
                          type="button"
                          onClick={() => handleSpeciesSelect(species as PetSpecies)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            state.selectedSpecies === species 
                              ? "border-[#00ff00] bg-[#00ff00]/10" 
                              : "border-[#00ff00]/20 hover:border-[#00ff00]/40"
                          }`}
                        >
                          <span className="text-3xl block">{species === 'dog' ? '🐶' : '🐱'}</span>
                          <span className="text-xs font-mono text-[#00ff00] block">
                            {species === 'dog' ? 'Собака' : 'Кошка'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, step: 'name' }))}
                      disabled={state.isLoading}
                      className={`w-full py-3 rounded-xl bg-gradient-to-r from-[#00ff00]/10 to-[#00ff00]/10 text-[#00ff00] text-sm font-bold hover:from-[#00ff00]/20 hover:to-[#00ff00]/20 transition-all disabled:opacity-50`}
                    >
                      {state.isLoading ? 'Выбор...' : 'Выбрать яйцо'}
                    </button>
                  </div>
</div>
               </div>
               )}
            {state.step === 'name' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{state.selectedSpecies === 'dog' ? '🐶' : '🐱'}</div>
                  <h3 className="font-bold text-xl text-[#00ff00]">Назовите своего питомца</h3>
                  <p className="text-sm text-[#00ff00]/70 mb-4">Это имя будет с вашим питомцем навсегда</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[#00ff00]/70 mb-1">Имя питомца</label>
                    <input
                      type="text"
                      ref={nameRef}
                      value={state.petName}
                      onChange={handleNameInput}
                      maxLength={20}
                      className="w-full px-4 py-3 rounded-xl bg-[#000000] border border-[#00ff00]/20 text-[#00ff00] placeholder-[#00ff00]/40 text-sm focus:border-[#00ff00] focus:outline-none"
                      placeholder="Бусинка"
                    />
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleBirth}
                    disabled={state.isLoading || !state.petName.trim()}
                    className={`w-full py-3 rounded-xl bg-gradient-to-r from-[#00ff00] to-[#ff00ff] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all`}
                  >
                    {state.isLoading ? 'Создание...' : 'Запустить LOOP.exe 🐾'}
                  </button>
                </div>
                
                {state.error && (
                  <div className="mt-3 text-sm text-[#ff0040] animate-pulse">
                    {state.error}
                  </div>
                )}
              </div>
            )}
            {state.step === 'tutorial' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{state.pet ? '🐾' : (state.selectedSpecies === 'dog' ? '🐶' : '🐱')}</div>
                  <h3 className="font-bold text-xl text-[#00ff00]">
                    {state.pet ? 'Добро пожаловать обратно!' : 'Добро пожаловать в LOOP.exe'}
                  </h3>
                  <p className="text-sm text-[#00ff00]/70 mb-4">
                    {state.pet ? 'Ваш питомец скучал по вам!' : 'Ваш виртуальный питомец ждет вас!'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-[#00ff00]/70 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[#00ff00]/50">▶</span>
                      <span>Кормите своего питомца, когда он голоден</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00ff00]/50">▶</span>
                      <span>Играйте с ним, чтобы повысить радость</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00ff00]/50">▶</span>
                      <span>Укладывайте спать, когда энергия на нуле</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00ff00]/50">▶</span>
                      <span>Ласкайте, чтобы повысить привязанность</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setState(prev => ({ ...prev, step: 'game' }));
                    }}
                    disabled={state.isLoading}
                    className={`w-full py-3 rounded-xl bg-gradient-to-r from-[#00ff00]/10 to-[#00ff00]/10 text-[#00ff00] text-sm font-bold hover:from-[#00ff00]/20 hover:to-[#00ff00]/20 transition-all`}
                  >
                    {state.pet ? 'Вернуться к питомцу' : 'Начать игру'}
                  </button>
                </div>
              </div>
            )}
            {state.step === 'game' && (
              <div className="space-y-4">
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
                    }}
                    onAction={handleAction}
                    isLoading={state.isLoading}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-2xl text-[#00ff00]/50">Загрузка...</div>
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