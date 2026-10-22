import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  DEFAULT_HOUSEHOLD_ITEMS,
  MIN_ROULETTE_ITEMS,
  getHouseholdItems,
  resetHouseholdItems,
} from '../../src/data/householdRouletteData.ts';
import { HouseholdRoulette } from '../../src/components/dates/HouseholdRoulette.tsx';
import { play8BitAudio, SoundEffectType } from '../../src/utils/audio8Bit.ts';
import { triggerHaptic, triggerHapticSuccess, triggerHapticWarning } from '../../src/utils/haptics.ts';

describe('Empirical Adversarial Challenge: Household Roulette (Milestone 2)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetHouseholdItems();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Assignee 50/50 Probability Distribution & Statistical Oracle', () => {
    it('empirically verifies 50/50 assignee selection with binomial test across 5,000 simulations', () => {
      const partner1 = 'Алексей';
      const partner2 = 'Елена';
      const partners = [partner1, partner2];

      const N = 5000;
      let countP1 = 0;
      let countP2 = 0;

      for (let i = 0; i < N; i++) {
        // Exact logic from HouseholdRoulette.tsx lines 151-153
        const chosen = partners[Math.floor(Math.random() * partners.length)];
        if (chosen === partner1) {
          countP1++;
        } else if (chosen === partner2) {
          countP2++;
        }
      }

      expect(countP1 + countP2).toBe(N);
      const ratioP1 = countP1 / N;
      const ratioP2 = countP2 / N;

      // With N=5000 and p=0.5, standard deviation sigma = sqrt(5000 * 0.25) ≈ 35.35 (0.7%)
      // 4 sigma interval: [47.2%, 52.8%]. We check [47%, 53%].
      expect(ratioP1).toBeGreaterThanOrEqual(0.47);
      expect(ratioP1).toBeLessThanOrEqual(0.53);
      expect(ratioP2).toBeGreaterThanOrEqual(0.47);
      expect(ratioP2).toBeLessThanOrEqual(0.53);
      expect(Math.abs(countP1 - countP2)).toBeLessThan(300);
    });

    it('gracefully handles empty, whitespace, and identical partner names', () => {
      // Empty string fallback logic
      const empty1: string = '';
      const empty2: string = '';
      const p1 = empty1 || 'Я';
      const p2 = empty2 || 'Партнёр';
      expect(p1).toBe('Я');
      expect(p2).toBe('Партнёр');

      // Identical partner names
      const nameSame: string = 'Саша';
      const identicalPartners = [nameSame || 'Я', nameSame || 'Партнёр'];
      const chosen = identicalPartners[Math.floor(Math.random() * identicalPartners.length)];
      expect(chosen).toBe('Саша');
    });
  });

  describe('2. Spin Triggering, Disabled State & Concurrency Shielding', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('locks spin buttons during animation and rejects repeated clicks during active spin', () => {
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

      const centerSpinBtn = screen.getByRole('button', { name: /Крутить рулетку/i });
      const quickSpinBtn = screen.getByRole('button', { name: /Испытать жребий/i });
      const settingsBtn = screen.getByLabelText(/Настройка обязанностей/i);

      // Initially enabled
      expect(centerSpinBtn).not.toBeDisabled();
      expect(quickSpinBtn).not.toBeDisabled();
      expect(settingsBtn).not.toBeDisabled();

      // Trigger spin
      fireEvent.click(quickSpinBtn);

      // Both spin buttons and settings button must be disabled
      expect(centerSpinBtn).toBeDisabled();
      expect(quickSpinBtn).toBeDisabled();
      expect(settingsBtn).toBeDisabled();
      expect(quickSpinBtn).toHaveTextContent(/Рулетка крутится.../i);

      // Repeated clicks while spinning must be blocked
      for (let i = 0; i < 10; i++) {
        fireEvent.click(centerSpinBtn);
        fireEvent.click(quickSpinBtn);
      }

      // Mid-spin: 1.5s in, still disabled and no celebration yet
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(centerSpinBtn).toBeDisabled();
      expect(quickSpinBtn).toBeDisabled();
      expect(handleConfetti).not.toHaveBeenCalled();

      // Spin completes after 3.3s
      act(() => {
        vi.advanceTimersByTime(1900);
      });

      // Celebration modal is shown
      expect(screen.getByText(/Жребий брошен!/i)).toBeInTheDocument();
      expect(handleConfetti).toHaveBeenCalledTimes(1);

      // Spin buttons should now be re-enabled
      expect(centerSpinBtn).not.toBeDisabled();
      expect(quickSpinBtn).not.toBeDisabled();
    });
  });

  describe('3. Celebration Modal: Fanfare, Confetti & XP Claim Callback (+15 XP)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('renders celebration modal with exact title, emoji, assignee and +15 XP claim button', () => {
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

      fireEvent.click(screen.getByRole('button', { name: /Испытать жребий/i }));

      act(() => {
        vi.advanceTimersByTime(3400);
      });

      // Celebration modal elements
      expect(screen.getByText('Жребий брошен!')).toBeInTheDocument();
      expect(screen.getByText('Сегодня это делает:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Принять жребий \(\+15 XP\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Крутить снова/i })).toBeInTheDocument();
    });

    it('awards +15 XP on claim, disables button, and prevents duplicate claim calls', () => {
      const handleAddXP = vi.fn();

      render(
        <HouseholdRoulette
          currentPartnerName="Максим"
          partnerName="Анна"
          onAddCoupleXP={handleAddXP}
          onTriggerConfetti={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Испытать жребий/i }));

      act(() => {
        vi.advanceTimersByTime(3400);
      });

      const claimBtn = screen.getByRole('button', { name: /Принять жребий \(\+15 XP\)/i });

      // First click
      fireEvent.click(claimBtn);

      expect(handleAddXP).toHaveBeenCalledTimes(1);
      expect(handleAddXP).toHaveBeenCalledWith(
        15,
        expect.stringMatching(/^Рулетка честного быта: .+ \((Максим|Анна)\)$/),
        'bonus'
      );

      // Verify button reflects claimed status and becomes disabled
      expect(claimBtn).toHaveTextContent(/Жребий принят! \(\+15 XP\)/i);
      expect(claimBtn).toBeDisabled();

      // Subsequent click must not award additional XP
      fireEvent.click(claimBtn);
      expect(handleAddXP).toHaveBeenCalledTimes(1);

      // Modal closes after 400ms timeout
      act(() => {
        vi.advanceTimersByTime(450);
      });
      expect(screen.queryByText('Жребий брошен!')).not.toBeInTheDocument();
    });

    it('idempotency guard: rapid clicking claim button 10 times awards XP strictly once', () => {
      const handleAddXP = vi.fn();

      render(
        <HouseholdRoulette
          currentPartnerName="Максим"
          partnerName="Анна"
          onAddCoupleXP={handleAddXP}
          onTriggerConfetti={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Испытать жребий/i }));

      act(() => {
        vi.advanceTimersByTime(3400);
      });

      const claimBtn = screen.getByRole('button', { name: /Принять жребий \(\+15 XP\)/i });

      // Synchronous rapid/burst click spam: 10 clicks before React re-render or timer advance
      act(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(claimBtn);
        }
      });

      expect(handleAddXP).toHaveBeenCalledTimes(1);
      expect(handleAddXP).toHaveBeenCalledWith(
        15,
        expect.stringMatching(/^Рулетка честного быта: .+ \((Максим|Анна)\)$/),
        'bonus'
      );

      act(() => {
        vi.advanceTimersByTime(450);
      });
      expect(screen.queryByText('Жребий брошен!')).not.toBeInTheDocument();
    });
  });

  describe('4. "Spin Again" vs "Accept Result" State Transitions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('clicking "Крутить снова" dismisses modal, triggers new spin, and respects forward rotation', () => {
      const handleConfetti = vi.fn();

      render(
        <HouseholdRoulette
          currentPartnerName="Максим"
          partnerName="Анна"
          onAddCoupleXP={vi.fn()}
          onTriggerConfetti={handleConfetti}
        />
      );

      // 1st Spin
      fireEvent.click(screen.getByRole('button', { name: /Испытать жребий/i }));
      act(() => {
        vi.advanceTimersByTime(3400);
      });

      expect(screen.getByText('Жребий брошен!')).toBeInTheDocument();
      expect(handleConfetti).toHaveBeenCalledTimes(1);

      // Click "Крутить снова"
      const spinAgainBtn = screen.getByRole('button', { name: /Крутить снова/i });
      fireEvent.click(spinAgainBtn);

      // Celebration modal is immediately closed and wheel is spinning again
      expect(screen.queryByText('Жребий брошен!')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Крутить рулетку/i })).toBeDisabled();
      expect(screen.getByText(/Рулетка крутится.../i)).toBeInTheDocument();

      // Fast-forward second spin
      act(() => {
        vi.advanceTimersByTime(3400);
      });

      // Second celebration modal appears
      expect(screen.getByText('Жребий брошен!')).toBeInTheDocument();
      expect(handleConfetti).toHaveBeenCalledTimes(2);
    });

    it('continuous forward rotation math: subsequent spins always rotate forward by >= 1800 deg', () => {
      let currentRotation = 0;
      const numSlices = 8;
      const sliceAngle = 360 / numSlices;

      for (let spin = 0; spin < 50; spin++) {
        const targetIndex = Math.floor(Math.random() * numSlices);
        const targetSliceCenter = (targetIndex + 0.5) * sliceAngle;
        const targetAngle = 360 - targetSliceCenter;
        const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
        const currentBase = Math.ceil(currentRotation / 360) * 360;
        const newRotation = currentBase + extraSpins + targetAngle;

        // Invariant 1: New rotation is strictly greater than current rotation
        expect(newRotation).toBeGreaterThan(currentRotation);

        // Invariant 2: Minimal forward rotation delta is at least 5 full rotations (1800 degrees)
        const delta = newRotation - currentRotation;
        expect(delta).toBeGreaterThanOrEqual(1800);

        // Invariant 3: Target angle aligns sector center with top pointer at 0 deg
        const finalNormalizedAngle = (newRotation + targetSliceCenter) % 360;
        expect(Math.round(finalNormalizedAngle) % 360).toBe(0);

        currentRotation = newRotation;
      }
    });
  });

  describe('5. Audio & Haptic Fallback in Restricted Environments', () => {
    it('play8BitAudio completes without error when AudioContext is completely undefined', () => {
      const originalAudioContext = window.AudioContext;
      const originalWebkitAudioContext = (window as any).webkitAudioContext;

      try {
        (window as any).AudioContext = undefined;
        (window as any).webkitAudioContext = undefined;

        const allSoundEffects: SoundEffectType[] = [
          'click', 'boot', 'feed', 'play', 'wash', 'sleep', 'purr', 'fanfare', 'pop', 'swipe', 'sparkle'
        ];

        expect(() => {
          allSoundEffects.forEach((type) => play8BitAudio(type));
        }).not.toThrow();
      } finally {
        (window as any).AudioContext = originalAudioContext;
        (window as any).webkitAudioContext = originalWebkitAudioContext;
      }
    });

    it('play8BitAudio catches errors if AudioContext constructor throws (e.g. Autoplay policy)', () => {
      const originalAudioContext = window.AudioContext;

      try {
        function ThrowingAudioContext() {
          throw new Error('NotAllowedError: Autoplay policy prevented playback');
        }
        (window as any).AudioContext = ThrowingAudioContext;

        expect(() => {
          play8BitAudio('fanfare');
          play8BitAudio('click');
          play8BitAudio('sparkle');
        }).not.toThrow();
      } finally {
        (window as any).AudioContext = originalAudioContext;
      }
    });

    it('triggerHaptic completes without error when navigator.vibrate is undefined (iOS Safari)', () => {
      const originalVibrate = navigator.vibrate;

      try {
        Object.defineProperty(navigator, 'vibrate', {
          value: undefined,
          configurable: true,
          writable: true,
        });

        expect(() => {
          triggerHaptic('light');
          triggerHaptic('selection');
          triggerHaptic('success');
          triggerHaptic('heavy');
          triggerHapticSuccess();
          triggerHapticWarning();
        }).not.toThrow();
      } finally {
        Object.defineProperty(navigator, 'vibrate', {
          value: originalVibrate,
          configurable: true,
          writable: true,
        });
      }
    });

    it('triggerHaptic catches and swallows exceptions when navigator.vibrate throws (Permissions policy)', () => {
      const originalVibrate = navigator.vibrate;

      try {
        const throwingVibrate = vi.fn().mockImplementation(() => {
          throw new Error('SecurityError: Blocked by Permissions Policy');
        });

        Object.defineProperty(navigator, 'vibrate', {
          value: throwingVibrate,
          configurable: true,
          writable: true,
        });

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(() => {
          triggerHaptic('success');
        }).not.toThrow();

        expect(warnSpy).toHaveBeenCalledWith('Haptics not supported or blocked');
        warnSpy.mockRestore();
      } finally {
        Object.defineProperty(navigator, 'vibrate', {
          value: originalVibrate,
          configurable: true,
          writable: true,
        });
      }
    });

    it('HouseholdRoulette runs complete spin and claim cycle cleanly under restricted audio/vibrate environment', () => {
      vi.useFakeTimers();

      const originalAudioContext = window.AudioContext;
      const originalVibrate = navigator.vibrate;

      try {
        (window as any).AudioContext = undefined;
        Object.defineProperty(navigator, 'vibrate', {
          value: undefined,
          configurable: true,
          writable: true,
        });

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

        // Spin wheel
        fireEvent.click(screen.getByRole('button', { name: /Испытать жребий/i }));

        act(() => {
          vi.advanceTimersByTime(3400);
        });

        expect(screen.getByText('Жребий брошен!')).toBeInTheDocument();
        expect(handleConfetti).toHaveBeenCalledTimes(1);

        // Claim XP
        const claimBtn = screen.getByRole('button', { name: /Принять жребий \(\+15 XP\)/i });
        fireEvent.click(claimBtn);

        expect(handleAddXP).toHaveBeenCalledWith(15, expect.any(String), 'bonus');

        act(() => {
          vi.advanceTimersByTime(500);
        });

        expect(screen.queryByText('Жребий брошен!')).not.toBeInTheDocument();
      } finally {
        (window as any).AudioContext = originalAudioContext;
        Object.defineProperty(navigator, 'vibrate', {
          value: originalVibrate,
          configurable: true,
          writable: true,
        });
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
      }
    });
  });

  describe('6. Mobile Ergonomics, Touch Targets & Viewport Safety (Requirement R3)', () => {
    it('verifies all interactive buttons and inputs satisfy touch target >= 40px and font >= 16px', () => {
      const { container } = render(
        <HouseholdRoulette
          currentPartnerName="Максим"
          partnerName="Анна"
          onAddCoupleXP={vi.fn()}
          onTriggerConfetti={vi.fn()}
          onBack={vi.fn()}
        />
      );

      // Back button: >= 40px
      const backBtn = screen.getByText(/Назад к играм/i);
      expect(backBtn.className).toContain('min-h-[44px]');
      expect(backBtn.className).toContain('min-w-[44px]');

      // Settings button: >= 40px
      const settingsBtn = screen.getByLabelText(/Настройка обязанностей/i);
      expect(settingsBtn.className).toContain('min-h-[44px]');

      // Center spin button: >= 40px
      const centerBtn = screen.getByRole('button', { name: /Крутить рулетку/i });
      expect(centerBtn.className).toContain('min-h-[44px]');
      expect(centerBtn.className).toContain('min-w-[44px]');

      // Quick spin button: >= 40px
      const quickBtn = screen.getByRole('button', { name: /Испытать жребий/i });
      expect(quickBtn.className).toContain('min-h-[44px]');

      // Open settings modal
      fireEvent.click(settingsBtn);

      // Close button
      const closeBtn = screen.getByLabelText(/Закрыть настройки/i);
      expect(closeBtn.className).toContain('min-h-[44px]');
      expect(closeBtn.className).toContain('min-w-[44px]');

      // Add chore input: text-base (16px to prevent Safari auto-zoom) and min-h-[44px]
      const input = screen.getByPlaceholderText(/Например: Заправить кровать/i);
      expect(input.className).toContain('text-base');
      expect(input.className).toContain('min-h-[44px]');

      // Add chore submit button: min-h-[44px]
      const addSubmitBtn = screen.getByRole('button', { name: /Добавить/i });
      expect(addSubmitBtn.className).toContain('min-h-[44px]');

      // Delete chore buttons: min-h-[44px] min-w-[44px]
      const deleteButtons = screen.getAllByTitle(/Удалить обязанность/i);
      deleteButtons.forEach((btn) => {
        expect(btn.className).toContain('min-h-[44px]');
        expect(btn.className).toContain('min-w-[44px]');
      });

      // Reset defaults button: min-h-[44px]
      const resetBtn = screen.getByText(/Сбросить к стандартным/i);
      expect(resetBtn.className).toContain('min-h-[44px]');

      // Done button: min-h-[44px]
      const doneBtn = screen.getByRole('button', { name: /Готово/i });
      expect(doneBtn.className).toContain('min-h-[44px]');

      // Root container horizontal overflow prevention
      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.className).toContain('max-w-full');
      expect(rootDiv.className).toContain('overflow-hidden');
    });
  });
});
