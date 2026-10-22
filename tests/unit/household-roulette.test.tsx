import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  DEFAULT_HOUSEHOLD_ITEMS,
  MIN_ROULETTE_ITEMS,
  HOUSEHOLD_ROULETTE_STORAGE_KEY,
  getHouseholdItems,
  saveHouseholdItems,
  addHouseholdItem,
  deleteHouseholdItem,
  resetHouseholdItems,
} from '../../src/data/householdRouletteData.ts';
import { HouseholdRoulette } from '../../src/components/dates/HouseholdRoulette.tsx';
import { GamesView } from '../../src/components/dates/GamesView.tsx';

// Mock Web Audio and Haptics to keep test environment clean
vi.mock('../../src/utils/audio8Bit.ts', () => ({
  play8BitAudio: vi.fn(),
}));

vi.mock('../../src/utils/haptics.ts', () => ({
  triggerHaptic: vi.fn(),
  triggerHapticSuccess: vi.fn(),
  triggerHapticWarning: vi.fn(),
}));

vi.mock('../../src/context/CoupleContext', () => ({
  useCouple: () => ({
    activeTab: 'dates',
  }),
}));

describe('Household Roulette Data & Persistence (Requirement R2)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetHouseholdItems();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. Loads 8 canonical default chores with valid IDs, emojis and colors', () => {
    const items = getHouseholdItems();
    expect(items).toHaveLength(8);

    const defaultTitles = items.map((i) => i.title);
    expect(defaultTitles).toContain('Кто выбирает фильм на вечер? 🎬');
    expect(defaultTitles).toContain('Кто готовит утренний кофе? ☕');
    expect(defaultTitles).toContain('Кто выгуливает питомца? 🐾');
    expect(defaultTitles).toContain('Кто моет посуду / загружает посудомойку? 🫧');
    expect(defaultTitles).toContain('Кто выбирает и заказывает ужин? 🍕');
    expect(defaultTitles).toContain('Массаж 10 минут перед сном 💆');
    expect(defaultTitles).toContain('Чур я отдыхаю — делает партнёр! 👑');
    expect(defaultTitles).toContain('Совместная уборка под музыку 🎵');

    items.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.emoji).toBeTruthy();
      expect(item.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(item.isDefault).toBe(true);
    });
  });

  it('2. Adds a custom chore and persists in safeStorage', () => {
    const updated = addHouseholdItem({
      title: 'Полить все комнатные растения 🪴',
      emoji: '🪴',
      color: '#10B981',
      category: 'daily',
    });

    expect(updated).toHaveLength(9);
    const added = updated.find((i) => i.title === 'Полить все комнатные растения 🪴');
    expect(added).toBeDefined();
    expect(added?.emoji).toBe('🪴');
    expect(added?.isDefault).toBe(false);

    // Verify persistence across read
    const fromStorage = getHouseholdItems();
    expect(fromStorage).toHaveLength(9);
    expect(fromStorage.some((i) => i.title === 'Полить все комнатные растения 🪴')).toBe(true);
  });

  it('3. Deletes a chore by ID and enforces the minimum 3 items constraint', () => {
    let items = getHouseholdItems();
    expect(items.length).toBe(8);

    // Delete one item
    items = deleteHouseholdItem('coffee');
    expect(items.length).toBe(7);
    expect(items.some((i) => i.id === 'coffee')).toBe(false);

    // Keep deleting until 3 items remain
    items = deleteHouseholdItem('movie');
    items = deleteHouseholdItem('pet');
    items = deleteHouseholdItem('dishes');
    items = deleteHouseholdItem('dinner');
    expect(items.length).toBe(3);

    // Attempting to delete when only 3 items remain should be prevented by the guard
    const remainingId = items[0].id;
    const guarded = deleteHouseholdItem(remainingId);
    expect(guarded.length).toBe(MIN_ROULETTE_ITEMS);
    expect(guarded.some((i) => i.id === remainingId)).toBe(true);
  });

  it('4. Resets chores back to default 8 items', () => {
    deleteHouseholdItem('coffee');
    deleteHouseholdItem('movie');
    expect(getHouseholdItems().length).toBe(6);

    const restored = resetHouseholdItems();
    expect(restored.length).toBe(8);
    expect(getHouseholdItems().length).toBe(8);
  });
});

describe('Household Roulette Component (Requirement R2 UI & Spin)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    resetHouseholdItems();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('1. Renders the roulette wheel with spin button and default items', () => {
    render(
      <HouseholdRoulette
        currentPartnerName="Максим"
        partnerName="Анна"
        onAddCoupleXP={vi.fn()}
        onTriggerConfetti={vi.fn()}
      />
    );

    expect(screen.getByText('Рулетка честного быта')).toBeInTheDocument();
    expect(screen.getByText(/Честный жребий/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Крутить рулетку/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Испытать жребий/i })).toBeInTheDocument();
  });

  it('2. Opens chore management settings, adds a new chore, and renders updated wheel', () => {
    render(
      <HouseholdRoulette
        currentPartnerName="Максим"
        partnerName="Анна"
        onAddCoupleXP={vi.fn()}
        onTriggerConfetti={vi.fn()}
      />
    );

    // Open settings drawer
    const settingsBtn = screen.getByLabelText(/Настройка обязанностей/i);
    fireEvent.click(settingsBtn);

    expect(screen.getByText(/Настройка обязанностей/i)).toBeInTheDocument();
    expect(screen.getByText(/8 активных дел в рулетке/i)).toBeInTheDocument();

    // Type a new custom chore
    const input = screen.getByPlaceholderText(/Например: Заправить кровать/i);
    fireEvent.change(input, { target: { value: 'Помыть кофемашину ☕' } });

    // Submit form
    const addBtn = screen.getByRole('button', { name: /Добавить/i });
    fireEvent.click(addBtn);

    // Verify it appears in settings list
    expect(screen.getByText('Помыть кофемашину ☕')).toBeInTheDocument();
    expect(screen.getByText(/9 активных дел в рулетке/i)).toBeInTheDocument();

    // Close settings modal
    const closeBtn = screen.getByLabelText(/Закрыть настройки/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Настройка обязанностей/i)).not.toBeInTheDocument();
  });

  it('3. Disables deletion when reaching minimum 3 chores', () => {
    render(
      <HouseholdRoulette
        currentPartnerName="Максим"
        partnerName="Анна"
        onAddCoupleXP={vi.fn()}
        onTriggerConfetti={vi.fn()}
      />
    );

    // Open settings
    fireEvent.click(screen.getByLabelText(/Настройка обязанностей/i));

    // Delete 5 items so only 3 remain
    for (let i = 0; i < 5; i++) {
      const deleteButtons = screen.getAllByTitle(/Удалить обязанность/i);
      fireEvent.click(deleteButtons[0]);
    }

    expect(screen.getByText(/3 активных дел в рулетке/i)).toBeInTheDocument();

    // The remaining delete buttons must now be disabled
    const disabledButtons = screen.getAllByTitle(/Минимум 3 обязанности/i);
    expect(disabledButtons.length).toBe(3);
    disabledButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('4. Triggers spin animation, selects winner and assignee, and awards +15 XP on claim', () => {
    const handleAddXP = vi.fn();
    const handleConfetti = vi.fn();

    render(
      <HouseholdRoulette
        currentPartnerName="Максим"
        partnerName="Анна"
        onAddCoupleXP={handleAddXP}
        onTriggerConfetti={handleConfetti}
      />
    );

    const spinBtn = screen.getByRole('button', { name: /Испытать жребий/i });
    fireEvent.click(spinBtn);

    // During spin, button is disabled
    expect(spinBtn).toBeDisabled();

    // Fast-forward past spin duration (3.3s)
    act(() => {
      vi.advanceTimersByTime(3400);
    });

    // Celebration modal must be shown
    expect(screen.getByText(/Жребий брошен!/i)).toBeInTheDocument();
    expect(screen.getByText(/Сегодня это делает:/i)).toBeInTheDocument();
    expect(handleConfetti).toHaveBeenCalled();

    // Claim XP button
    const claimBtn = screen.getByRole('button', { name: /Принять жребий \(\+15 XP\)/i });
    expect(claimBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(claimBtn);
      vi.advanceTimersByTime(500);
    });

    expect(handleAddXP).toHaveBeenCalledTimes(1);
    expect(handleAddXP).toHaveBeenCalledWith(
      15,
      expect.stringMatching(/Рулетка честного быта:/),
      'bonus'
    );
  });
});

describe('GamesView Integration (Requirement R2 Navigation)', () => {
  it('1. Displays 5 game formats in catalog including «Рулетка честного быта»', () => {
    render(
      <GamesView
        currentPartnerName="Максим"
        partnerName="Анна"
        onBack={vi.fn()}
        onAddCoupleXP={vi.fn()}
        onTriggerConfetti={vi.fn()}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Форматов игр')).toBeInTheDocument();
    expect(screen.getByText('Рулетка честного быта')).toBeInTheDocument();
    expect(screen.getByText('Новинка')).toBeInTheDocument();
  });

  it('2. Launches Household Roulette when tapping its game card', () => {
    render(
      <GamesView
        currentPartnerName="Максим"
        partnerName="Анна"
        onBack={vi.fn()}
        onAddCoupleXP={vi.fn()}
        onTriggerConfetti={vi.fn()}
      />
    );

    const rouletteCard = screen.getByText('Рулетка честного быта');
    fireEvent.click(rouletteCard);

    // Should switch to Household Roulette view
    expect(screen.getByRole('button', { name: /Испытать жребий/i })).toBeInTheDocument();
    expect(screen.getByText(/Честный жребий домашних дел и заботы/i)).toBeInTheDocument();
  });

  it('3. Renders Household Roulette directly if initialGame="household_roulette"', () => {
    render(
      <GamesView
        currentPartnerName="Максим"
        partnerName="Анна"
        onBack={vi.fn()}
        onAddCoupleXP={vi.fn()}
        onTriggerConfetti={vi.fn()}
        initialGame="household_roulette"
      />
    );

    expect(screen.getByRole('button', { name: /Испытать жребий/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Рулетка честного быта/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Честный жребий домашних дел и заботы/i)).toBeInTheDocument();
  });
});
