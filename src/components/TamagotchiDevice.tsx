import React from 'react';
import { LoopConsole } from './LoopConsole.tsx';
import { PetActionType } from '../types.ts';

export interface TamagotchiDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  petState?: any;
  onAction?: (action: PetActionType) => Promise<void>;
  isLoading?: boolean;
}

/**
 * TamagotchiDevice provides backward compatibility wrapper around LoopConsole retro handheld console.
 */
export const TamagotchiDevice: React.FC<TamagotchiDeviceProps> = ({
  isOpen,
  onClose,
  petState,
}) => {
  if (!isOpen) return null;

  return (
    <LoopConsole
      isOpen={isOpen}
      onClose={onClose}
      initialPetState={petState}
    />
  );
};
