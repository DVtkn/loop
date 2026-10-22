import { describe, it, expect } from 'vitest';
import {
  CARE_MODE_PRESETS,
  CARE_MODE_PRESETS_MAP,
  getBatteryTier,
  getContextualCareSuggestion,
  findCarePresetByKey,
} from '../../src/utils/careBatteryEngine.ts';

describe('Empirical Adversarial Challenge: Care Battery Engine', () => {
  describe('1. Threshold and Boundary Value Testing', () => {
    it('verifies exact threshold boundaries: 0, 1, 39, 40, 69, 70, 99, 100', () => {
      // 0 (Lowest valid)
      const t0 = getBatteryTier(0);
      expect(t0.tier).toBe('rose');
      expect(t0.color).toBe('#F43F5E');
      expect(t0.label).toBe('Низкий заряд');
      expect(t0.icon).toBe('🪫');

      // 1 (Lower bound + 1)
      const t1 = getBatteryTier(1);
      expect(t1.tier).toBe('rose');
      expect(t1.color).toBe('#F43F5E');

      // 39 (Rose upper bound)
      const t39 = getBatteryTier(39);
      expect(t39.tier).toBe('rose');
      expect(t39.color).toBe('#F43F5E');

      // 40 (Amber lower bound)
      const t40 = getBatteryTier(40);
      expect(t40.tier).toBe('amber');
      expect(t40.color).toBe('#F59E0B');
      expect(t40.label).toBe('Ровный заряд');
      expect(t40.icon).toBe('🔋');

      // 69 (Amber upper bound)
      const t69 = getBatteryTier(69);
      expect(t69.tier).toBe('amber');
      expect(t69.color).toBe('#F59E0B');

      // 70 (Emerald lower bound)
      const t70 = getBatteryTier(70);
      expect(t70.tier).toBe('emerald');
      expect(t70.color).toBe('#10B981');
      expect(t70.label).toBe('Высокий заряд');
      expect(t70.icon).toBe('⚡');

      // 99 (Emerald upper bound - 1)
      const t99 = getBatteryTier(99);
      expect(t99.tier).toBe('emerald');
      expect(t99.color).toBe('#10B981');

      // 100 (Max valid)
      const t100 = getBatteryTier(100);
      expect(t100.tier).toBe('emerald');
      expect(t100.color).toBe('#10B981');
    });

    it('verifies exhaustive single-step transition across boundaries 38..41 and 68..71', () => {
      expect(getBatteryTier(38).tier).toBe('rose');
      expect(getBatteryTier(39).tier).toBe('rose');
      expect(getBatteryTier(40).tier).toBe('amber');
      expect(getBatteryTier(41).tier).toBe('amber');

      expect(getBatteryTier(68).tier).toBe('amber');
      expect(getBatteryTier(69).tier).toBe('amber');
      expect(getBatteryTier(70).tier).toBe('emerald');
      expect(getBatteryTier(71).tier).toBe('emerald');
    });

    it('confirms 100% mathematical tier alignment between getBatteryTier and getContextualCareSuggestion across all 0..100 integers', () => {
      for (let i = 0; i <= 100; i++) {
        const batteryTier = getBatteryTier(i).tier;
        const suggestionTier = getContextualCareSuggestion(i).tier;
        expect(suggestionTier).toBe(batteryTier);
      }
    });
  });

  describe('2. Out-of-bounds, Floating-Point, and Malformed Input Handling', () => {
    it('clamps negative numbers to 0 (rose tier)', () => {
      expect(getBatteryTier(-1).tier).toBe('rose');
      expect(getBatteryTier(-50).tier).toBe('rose');
      expect(getBatteryTier(-999999).tier).toBe('rose');
      expect(getBatteryTier(-Infinity).tier).toBe('rose');

      const negSugg = getContextualCareSuggestion(-10);
      expect(negSugg.tier).toBe('rose');
      expect(negSugg.actionIcon).toBe('🫂'); // Clamped to 0 < 20 => need hugs
    });

    it('clamps numbers exceeding 100 to 100 (emerald tier)', () => {
      expect(getBatteryTier(101).tier).toBe('emerald');
      expect(getBatteryTier(150).tier).toBe('emerald');
      expect(getBatteryTier(999999).tier).toBe('emerald');
      expect(getBatteryTier(Infinity).tier).toBe('emerald');

      const highSugg = getContextualCareSuggestion(200);
      expect(highSugg.tier).toBe('emerald');
      expect(highSugg.actionIcon).toBe('⚡'); // Clamped to 100 >= 90 => full energy
    });

    it('handles NaN and undefined with safe fallback to 50 (amber tier)', () => {
      expect(getBatteryTier(NaN).tier).toBe('amber');
      expect(getBatteryTier(undefined as unknown as number).tier).toBe('amber');

      const nanSugg = getContextualCareSuggestion(NaN);
      expect(nanSugg.tier).toBe('amber');
      expect(nanSugg.actionIcon).toBe('☕');

      const undefSugg = getContextualCareSuggestion(undefined as unknown as number);
      expect(undefSugg.tier).toBe('amber');
      expect(undefSugg.actionIcon).toBe('☕');
    });

    it('correctly rounds floating-point inputs near boundary thresholds', () => {
      // 39.4 rounds to 39 => rose
      expect(getBatteryTier(39.4).tier).toBe('rose');
      // 39.5 rounds to 40 => amber
      expect(getBatteryTier(39.5).tier).toBe('amber');

      // 69.4 rounds to 69 => amber
      expect(getBatteryTier(69.4).tier).toBe('amber');
      // 69.5 rounds to 70 => emerald
      expect(getBatteryTier(69.5).tier).toBe('emerald');

      // -0.4 rounds to 0 => rose
      expect(getBatteryTier(-0.4).tier).toBe('rose');
      // 100.4 rounds to 100 => emerald
      expect(getBatteryTier(100.4).tier).toBe('emerald');
    });
  });

  describe('3. Presets Mapping and Bidirectional Lookups', () => {
    it('maps all 4 presets accurately with keys, defaultEnergy, and icons', () => {
      const keys = ['full_energy', 'adventure', 'low_battery', 'need_hugs'] as const;

      expect(CARE_MODE_PRESETS).toHaveLength(4);

      for (const k of keys) {
        const preset = CARE_MODE_PRESETS_MAP[k];
        expect(preset).toBeDefined();
        expect(preset.key).toBe(k);
        expect(typeof preset.label).toBe('string');
        expect(preset.label.length).toBeGreaterThan(0);
        expect(typeof preset.description).toBe('string');
        expect(preset.defaultEnergy).toBeGreaterThanOrEqual(0);
        expect(preset.defaultEnergy).toBeLessThanOrEqual(100);
        expect(preset.icon).toBeTruthy();
      }

      expect(CARE_MODE_PRESETS_MAP.full_energy.defaultEnergy).toBe(95);
      expect(CARE_MODE_PRESETS_MAP.adventure.defaultEnergy).toBe(80);
      expect(CARE_MODE_PRESETS_MAP.low_battery.defaultEnergy).toBe(25);
      expect(CARE_MODE_PRESETS_MAP.need_hugs.defaultEnergy).toBe(15);
    });

    it('resolves preset by key and by human-readable label correctly', () => {
      expect(findCarePresetByKey('full_energy')?.key).toBe('full_energy');
      expect(findCarePresetByKey('adventure')?.key).toBe('adventure');
      expect(findCarePresetByKey('low_battery')?.key).toBe('low_battery');
      expect(findCarePresetByKey('need_hugs')?.key).toBe('need_hugs');

      expect(findCarePresetByKey('Полон(на) энергии')?.key).toBe('full_energy');
      expect(findCarePresetByKey('Готов(а) к приключениям')?.key).toBe('adventure');
      expect(findCarePresetByKey('Низкий заряд / Тихий вечер')?.key).toBe('low_battery');
      expect(findCarePresetByKey('Нужны обнимашки / Без лишних вопросов')?.key).toBe('need_hugs');

      expect(findCarePresetByKey(null)).toBeUndefined();
      expect(findCarePresetByKey(undefined)).toBeUndefined();
      expect(findCarePresetByKey('')).toBeUndefined();
      expect(findCarePresetByKey('non_existent_key')).toBeUndefined();
    });
  });

  describe('4. Contextual Care Suggestions Across All Tiers and Fallbacks', () => {
    it('generates tier-appropriate advice when careMode is undefined (energy-driven)', () => {
      // 0..19: need_hugs advice
      const s10 = getContextualCareSuggestion(10, undefined, 'Алиса');
      expect(s10.tier).toBe('rose');
      expect(s10.actionIcon).toBe('🫂');
      expect(s10.headline).toContain('Алиса');
      expect(s10.advice).toContain('горячий чай');

      // 20..39: low_battery advice
      const s35 = getContextualCareSuggestion(35, undefined, 'Алиса');
      expect(s35.tier).toBe('rose');
      expect(s35.actionIcon).toBe('🍵');
      expect(s35.advice).toContain('сериал');

      // 40..69: balanced/moderate advice
      const s50 = getContextualCareSuggestion(50, undefined, 'Алиса');
      expect(s50.tier).toBe('amber');
      expect(s50.actionIcon).toBe('☕');
      expect(s50.advice).toContain('спокойное состояние');

      // 70..89: adventure advice
      const s75 = getContextualCareSuggestion(75, undefined, 'Алиса');
      expect(s75.tier).toBe('emerald');
      expect(s75.actionIcon).toBe('🚀');
      expect(s75.advice).toContain('свидания');

      // 90..100: full_energy advice
      const s95 = getContextualCareSuggestion(95, undefined, 'Алиса');
      expect(s95.tier).toBe('emerald');
      expect(s95.actionIcon).toBe('⚡');
      expect(s95.advice).toContain('активный вечер');
    });

    it('honors explicit careMode preset regardless of numeric energy slider', () => {
      // User has 95% energy slider but explicitly chose 'need_hugs'
      const sHugsHighEnergy = getContextualCareSuggestion(95, 'need_hugs', 'Дмитрий');
      expect(sHugsHighEnergy.tier).toBe('rose');
      expect(sHugsHighEnergy.actionIcon).toBe('🫂');

      // User has 10% energy slider but explicitly chose 'adventure'
      const sAdvLowEnergy = getContextualCareSuggestion(10, 'adventure', 'Дмитрий');
      expect(sAdvLowEnergy.tier).toBe('emerald');
      expect(sAdvLowEnergy.actionIcon).toBe('🚀');
    });

    it('correctly handles partnerName edge cases (whitespace, empty, undefined)', () => {
      const sDefault = getContextualCareSuggestion(15);
      expect(sDefault.headline).toContain('Партнёр');

      const sEmpty = getContextualCareSuggestion(15, undefined, '');
      expect(sEmpty.headline).toContain('Партнёр');

      const sSpaces = getContextualCareSuggestion(15, undefined, '   ');
      expect(sSpaces.headline).toContain('Партнёр');

      const sTrimmed = getContextualCareSuggestion(15, undefined, '  Екатерина  ');
      expect(sTrimmed.headline).toContain('Екатерина');
      expect(sTrimmed.headline).not.toContain('  Екатерина  ');
    });

    it('empirically reveals behavior when careMode is null, empty string, or unrecognized string', () => {
      // In JS, if careMode is null or empty string or unrecognized string:
      // findCarePresetByKey(careMode) is undefined
      // modeKey evaluates to null, "", or the invalid string.
      // Since modeKey !== undefined, the energy-driven branches (clamped < 20, < 40, >= 90, >= 70) do not fire.
      // It falls back to 'amber' (balanced / moderate) regardless of energy level.
      const sWithNullMode = getContextualCareSuggestion(10, null as unknown as string, 'Анна');
      const sWithEmptyMode = getContextualCareSuggestion(10, '', 'Анна');
      const sWithInvalidMode = getContextualCareSuggestion(10, 'invalid_mode', 'Анна');

      expect(sWithNullMode.tier).toBe('amber');
      expect(sWithEmptyMode.tier).toBe('amber');
      expect(sWithInvalidMode.tier).toBe('amber');
    });
  });
});
