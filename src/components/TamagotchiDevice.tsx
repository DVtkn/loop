import React from "react";
import { LoopConsole } from "./LoopConsole.tsx";
import { CouplePetState, PetActionType, PetSpecies } from "../types.ts";

export interface GameEvent {
  type: "feed" | "sleep" | "score" | "play" | "error";
  title: string;
  description?: string;
  timestamp: number;
}

export interface TamagotchiState {
  name: string;
  hunger: number;
  energy: number;
  joy: number;
  cleanliness?: number;
  level: number;
  experience: number;
  mood: string;
  synergy?: number;
  species?: PetSpecies;
}

export const MOOD_EMOJI: Record<string, string> = {
  happy: "😺",
  sleepy: "😴",
  hungry: "😋",
  playful: "🎮",
  loved: "❤️",
  dirty: "🧼",
};

export const MOOD_LABEL: Record<string, string> = {
  happy: "Счастлив",
  sleepy: "Хочет спать",
  hungry: "Голодный",
  playful: "Игрив",
  loved: "Ласковый",
  dirty: "Грязнуля",
};

export const MOOD_BUBBLE: Record<string, string> = {
  happy: "Тяв! Люблю вас!💖",
  sleepy: "Клюю носом...💤",
  hungry: "Кушать!💖",
  playful: "Поиграем?🎾",
  loved: "Муррр~ +5❤️",
  dirty: "Буль-буль! Чистота!🧼",
};

export function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[mood] || "😺";
}

export function getMoodLabel(mood: string): string {
  return MOOD_LABEL[mood] || mood;
}

export function getMoodBubble(mood: string): string {
  return MOOD_BUBBLE[mood] || "Привет!🐾";
}

export interface TamagotchiDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  petState?: TamagotchiState;
  onAction?: (action: PetActionType) => Promise<void>;
  isLoading?: boolean;
}

/**
 * TamagotchiDevice provides compatibility wrapper around the unified LOOP.exe retro handheld console.
 * Strictly adheres to the retro console standard (pink shell, LCD dot-matrix, tactile D-Pad & A/B buttons).
 */
export const TamagotchiDevice: React.FC<TamagotchiDeviceProps> = ({
  isOpen,
  onClose,
  petState,
  onAction,
}) => {
  if (!isOpen) return null;

  const now = new Date().toISOString();
  const adaptedPetState: CouplePetState | undefined = petState
    ? {
        id: "local-pet",
        coupleId: "local-couple",
        pairKey: "local_pair",
        name: petState.name,
        nameStatus: "confirmed",
        species: petState.species ?? "dog",
        hunger: petState.hunger,
        energy: petState.energy,
        joy: petState.joy,
        cleanliness: petState.cleanliness ?? 85,
        level: petState.level,
        experience: petState.experience,
        weightKg: "1.2",
        mood: (petState.mood as CouplePetState["mood"]) || "happy",
        synergy: petState.synergy ?? 100,
        isOnboardingCompleted: true,
        lastFedAt: now,
        lastPlayedAt: now,
        lastRestedAt: now,
        lastWashedAt: now,
        lastInteractionAt: now,
        createdAt: now,
        updatedAt: now,
      }
    : undefined;

  return (
    <LoopConsole
      isOpen={isOpen}
      onClose={onClose}
      initialPetState={adaptedPetState}
      onPetUpdated={(updated) => {
        if (onAction) {
          // Trigger any parent listeners if registered
        }
      }}
    />
  );
};
