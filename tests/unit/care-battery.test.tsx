import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CARE_MODE_PRESETS,
  CARE_MODE_PRESETS_MAP,
  getBatteryTier,
  getContextualCareSuggestion,
  findCarePresetByKey,
} from '../../src/utils/careBatteryEngine.ts';
import { MoodPickerModal } from '../../src/components/dashboard/MoodPickerModal.tsx';
import { PartnerStatusCard } from '../../src/components/dashboard/PartnerStatusCard.tsx';
import { PartnerDetailModal } from '../../src/components/dashboard/PartnerDetailModal.tsx';

describe('Care Battery Engine (Requirement R1)', () => {
  it('defines 4 canonical care mode presets with icons and energy defaults', () => {
    expect(CARE_MODE_PRESETS).toHaveLength(4);

    expect(CARE_MODE_PRESETS_MAP.full_energy.label).toBe('Полон(на) энергии');
    expect(CARE_MODE_PRESETS_MAP.full_energy.defaultEnergy).toBe(95);
    expect(CARE_MODE_PRESETS_MAP.full_energy.icon).toBe('⚡');

    expect(CARE_MODE_PRESETS_MAP.adventure.label).toBe('Готов(а) к приключениям');
    expect(CARE_MODE_PRESETS_MAP.adventure.defaultEnergy).toBe(80);
    expect(CARE_MODE_PRESETS_MAP.adventure.icon).toBe('🚀');

    expect(CARE_MODE_PRESETS_MAP.low_battery.label).toBe('Низкий заряд / Тихий вечер');
    expect(CARE_MODE_PRESETS_MAP.low_battery.defaultEnergy).toBe(25);
    expect(CARE_MODE_PRESETS_MAP.low_battery.icon).toBe('🪫');

    expect(CARE_MODE_PRESETS_MAP.need_hugs.label).toBe('Нужны обнимашки / Без лишних вопросов');
    expect(CARE_MODE_PRESETS_MAP.need_hugs.defaultEnergy).toBe(15);
    expect(CARE_MODE_PRESETS_MAP.need_hugs.icon).toBe('🫂');
  });

  it('correctly maps energy percentages to color tiers and classes', () => {
    // Emerald tier (>= 70)
    const high = getBatteryTier(85);
    expect(high.tier).toBe('emerald');
    expect(high.color).toBe('#10B981');
    expect(high.textClass).toBe('text-emerald-500');
    expect(high.bgClass).toBe('bg-emerald-500/15');
    expect(high.borderClass).toBe('border-emerald-500/30');

    // Amber tier (40 - 69)
    const mid = getBatteryTier(55);
    expect(mid.tier).toBe('amber');
    expect(mid.color).toBe('#F59E0B');
    expect(mid.textClass).toBe('text-amber-500');
    expect(mid.bgClass).toBe('bg-amber-500/15');
    expect(mid.borderClass).toBe('border-amber-500/30');

    // Rose tier (< 40)
    const low = getBatteryTier(20);
    expect(low.tier).toBe('rose');
    expect(low.color).toBe('#F43F5E');
    expect(low.textClass).toBe('text-rose-500');
    expect(low.bgClass).toBe('bg-rose-500/15');
    expect(low.borderClass).toBe('border-rose-500/30');

    // Boundaries
    expect(getBatteryTier(70).tier).toBe('emerald');
    expect(getBatteryTier(69).tier).toBe('amber');
    expect(getBatteryTier(40).tier).toBe('amber');
    expect(getBatteryTier(39).tier).toBe('rose');
    expect(getBatteryTier(0).tier).toBe('rose');
    expect(getBatteryTier(100).tier).toBe('emerald');
  });

  it('generates dynamic contextual care suggestions based on energy & mode', () => {
    // 1. Need hugs / Extreme low
    const hugs = getContextualCareSuggestion(15, 'need_hugs', 'Анна');
    expect(hugs.tier).toBe('rose');
    expect(hugs.actionIcon).toBe('🫂');
    expect(hugs.actionLabel).toContain('объятия');
    expect(hugs.headline).toContain('Анна');

    // 2. Low battery
    const low = getContextualCareSuggestion(30, 'low_battery', 'Максим');
    expect(low.tier).toBe('rose');
    expect(low.actionIcon).toBe('🍵');
    expect(low.actionLabel).toContain('тихий вечер');

    // 3. Adventure
    const adv = getContextualCareSuggestion(85, 'adventure', 'Анна');
    expect(adv.tier).toBe('emerald');
    expect(adv.actionIcon).toBe('🚀');
    expect(adv.actionLabel).toContain('свидание');

    // 4. Full energy
    const full = getContextualCareSuggestion(95, 'full_energy', 'Максим');
    expect(full.tier).toBe('emerald');
    expect(full.actionIcon).toBe('⚡');

    // 5. Moderate / Balanced
    const balanced = getContextualCareSuggestion(55, undefined, 'Анна');
    expect(balanced.tier).toBe('amber');
    expect(balanced.actionIcon).toBe('☕');
  });

  it('finds preset by key or label correctly', () => {
    expect(findCarePresetByKey('full_energy')?.key).toBe('full_energy');
    expect(findCarePresetByKey('Нужны обнимашки / Без лишних вопросов')?.key).toBe('need_hugs');
    expect(findCarePresetByKey(null)).toBeUndefined();
  });
});

describe('MoodPickerModal Component', () => {
  it('renders interactive slider and 4 care presets, submitting chosen values', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <MoodPickerModal
        isOpen={true}
        onClose={handleClose}
        onSubmitMood={handleSubmit}
        initialEnergyLevel={50}
        initialCareMode="low_battery"
      />
    );

    // Shows battery section header
    expect(screen.getByText('Заряд энергии')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // 4 presets rendered
    expect(screen.getByText('Полон(на) энергии')).toBeInTheDocument();
    expect(screen.getByText('Готов(а) к приключениям')).toBeInTheDocument();
    expect(screen.getByText('Низкий заряд / Тихий вечер')).toBeInTheDocument();
    expect(screen.getByText('Нужны обнимашки / Без лишних вопросов')).toBeInTheDocument();

    // Click 'Полон(на) энергии' preset -> sets energy to 95
    fireEvent.click(screen.getByText('Полон(на) энергии'));
    expect(screen.getAllByText('95%').length).toBeGreaterThanOrEqual(1);

    // Submit form
    const submitBtn = screen.getByText('Сохранить заряд и состояние');
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const [key, label, note, energyLevel, careMode] = handleSubmit.mock.calls[0];
    expect(energyLevel).toBe(95);
    expect(careMode).toBe('full_energy');
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('PartnerStatusCard with Care Battery', () => {
  it('renders partner energy badge, care preset tag, and contextual advice banner', () => {
    const handleOpenDetails = vi.fn();
    const handleOpenMyStatus = vi.fn();

    const partnerData = {
      name: 'Анна',
      avatar: 'flower',
      lastActiveAt: new Date().toISOString(),
      currentMood: {
        emoji: 'calm',
        label: 'Тихий вечер',
        note: 'Устала после работы',
        updatedAt: new Date().toISOString(),
        energyLevel: 25,
        careMode: 'low_battery',
      },
    };

    render(
      <PartnerStatusCard
        isPaired={true}
        partnerName="Анна"
        safeOtherPartner={partnerData}
        myPartner={{ name: 'Максим', avatar: 'sparkles' }}
        partnerStatusInfo={{
          isOnline: true,
          statusText: 'В сети',
          badgeText: 'В сети',
        }}
        onOpenDetails={handleOpenDetails}
        onGoToProfile={vi.fn()}
        onOpenMyStatus={handleOpenMyStatus}
      />
    );

    // Partner name and 25% battery gauge
    expect(screen.getByText('Анна')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Низкий заряд')).toBeInTheDocument();

    // Contextual care suggestion banner
    expect(screen.getByText(/Совет заботы/i)).toBeInTheDocument();
    expect(screen.getByText(/режим энергосбережения/i)).toBeInTheDocument();

    // Open my status trigger
    const myStatusBtn = screen.getByTitle('Указать мой заряд и настроение');
    fireEvent.click(myStatusBtn);
    expect(handleOpenMyStatus).toHaveBeenCalledTimes(1);
  });
});

describe('PartnerDetailModal with Care Battery', () => {
  it('renders rich battery and care mode block with psychologist advice and action button', () => {
    const handleClose = vi.fn();
    const handleSendTap = vi.fn();

    const partnerData = {
      name: 'Анна',
      avatar: 'flower',
      lastActiveAt: new Date().toISOString(),
      currentMood: {
        emoji: 'hug',
        label: 'Хочу тепла',
        note: 'Был сложный день',
        updatedAt: new Date().toISOString(),
        energyLevel: 15,
        careMode: 'need_hugs',
      },
    };

    render(
      <PartnerDetailModal
        isOpen={true}
        onClose={handleClose}
        partnerName="Анна"
        safeOtherPartner={partnerData}
        partnerStatusInfo={{
          isOnline: true,
          statusText: 'В сети',
          badgeText: 'В сети',
        }}
        onSendSpecificTap={handleSendTap}
        onOpenChat={vi.fn()}
      />
    );

    // Check battery title and percentage
    expect(screen.getByText('Батарейка энергии и заботы')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();

    // Check care mode and psychologist advice
    expect(screen.getByText(/Режим заботы: Нужны обнимашки/i)).toBeInTheDocument();
    expect(screen.getByText(/Совет психолога: Анна нуждается в бережном тепле/i)).toBeInTheDocument();

    // Quick care reaction button
    const reactionBtn = screen.getByText('Отправить крепкие объятия');
    fireEvent.click(reactionBtn);
    expect(handleSendTap).toHaveBeenCalledTimes(1);
  });
});
