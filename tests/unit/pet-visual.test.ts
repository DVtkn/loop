import { describe, it, expect } from 'vitest';
import { getPetVisualStatus, STATE_PET_QUOTES } from '../../src/data/petData.ts';
import { PetSpecies } from '../../src/types.ts';

describe('Pet Living Visual State Engine', () => {
  it('correctly identifies dirty state when cleanliness is critically low', () => {
    const pet = {
      cleanliness: 15,
      energy: 80,
      hunger: 80,
      joy: 80,
      species: 'dog' as PetSpecies,
    };
    const status = getPetVisualStatus(pet, false);

    expect(status.stateType).toBe('dirty');
    expect(status.isDirty).toBe(true);
    expect(status.isVeryDirty).toBe(true);
    expect(status.primaryAction).toBe('wash');
    expect(status.urgency).toBe('critical');
    expect(status.badgeEmoji).toBe('🧼');
    expect(status.speech).toContain('грязи');
  });

  it('correctly identifies sleepy state when energy is low', () => {
    const pet = {
      cleanliness: 80,
      energy: 20,
      hunger: 80,
      joy: 80,
      species: 'cat' as PetSpecies,
    };
    const status = getPetVisualStatus(pet, false);

    expect(status.stateType).toBe('sleepy');
    expect(status.isSleepy).toBe(true);
    expect(status.isDeeplySleepy).toBe(true);
    expect(status.primaryAction).toBe('sleep');
    expect(status.badgeEmoji).toBe('💤');
    expect(status.speech).toContain('Глазки слипаются');
  });

  it('correctly identifies hungry state when hunger is low', () => {
    const pet = {
      cleanliness: 70,
      energy: 70,
      hunger: 18,
      joy: 70,
      species: 'dog' as PetSpecies,
    };
    const status = getPetVisualStatus(pet, false);

    expect(status.stateType).toBe('hungry');
    expect(status.isHungry).toBe(true);
    expect(status.isStarving).toBe(true);
    expect(status.primaryAction).toBe('feed');
    expect(status.badgeEmoji).toBe('🍓');
  });

  it('correctly identifies sad state when joy is low', () => {
    const pet = {
      cleanliness: 70,
      energy: 70,
      hunger: 70,
      joy: 20,
      species: 'cat' as PetSpecies,
    };
    const status = getPetVisualStatus(pet, false);

    expect(status.stateType).toBe('sad');
    expect(status.isSad).toBe(true);
    expect(status.primaryAction).toBe('play');
    expect(status.badgeEmoji).toBe('🥺');
  });

  it('correctly identifies thriving/sparkling state when all stats are high', () => {
    const pet = {
      cleanliness: 95,
      energy: 90,
      hunger: 90,
      joy: 95,
      species: 'dog' as PetSpecies,
    };
    const status = getPetVisualStatus(pet, false);

    expect(status.stateType).toBe('sparkling');
    expect(status.isSparkling).toBe(true);
    expect(status.isLoved).toBe(true);
    expect(status.primaryAction).toBe(null);
    expect(status.urgency).toBe('thriving');
    expect(status.badgeEmoji).toBe('✨');
  });

  it('provides rich quotes for both dog and cat across all emotional states', () => {
    const states = ['dirty', 'sleepy', 'hungry', 'sad', 'sparkling', 'happy'] as const;
    states.forEach((state) => {
      expect(STATE_PET_QUOTES.dog[state].length).toBeGreaterThanOrEqual(3);
      expect(STATE_PET_QUOTES.cat[state].length).toBeGreaterThanOrEqual(3);
    });
  });
});
