import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartnerStatusCard, isMoodRecent } from '../../src/components/dashboard/PartnerStatusCard.tsx';
import { PartnerDetailModal, formatMoodTime, getMoodBriefDescription } from '../../src/components/dashboard/PartnerDetailModal.tsx';
import { MoodPickerModal } from '../../src/components/dashboard/MoodPickerModal.tsx';
import { getContextualCareSuggestion, getBatteryTier } from '../../src/utils/careBatteryEngine.ts';

describe('Adversarial Test Suite: Milestone 1 UI Components', () => {
  const defaultStatusInfo = {
    isOnline: true,
    statusText: 'В сети',
    badgeText: 'В сети',
  };

  describe('isMoodRecent Helper Robustness', () => {
    it('returns false for undefined, null, or empty string', () => {
      expect(isMoodRecent(undefined)).toBe(false);
      expect(isMoodRecent('')).toBe(false);
      expect(isMoodRecent('invalid-date')).toBe(false);
    });

    it('returns true for timestamps within today or 24 hours', () => {
      const now = new Date();
      expect(isMoodRecent(now.toISOString())).toBe(true);

      const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
      expect(isMoodRecent(oneHourAgo.toISOString())).toBe(true);

      const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 3600 * 1000);
      // If 23 hours ago is either today or < 24h
      expect(isMoodRecent(twentyThreeHoursAgo.toISOString())).toBe(true);
    });

    it('returns false for timestamps older than 24 hours on different calendar day', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000);
      expect(isMoodRecent(threeDaysAgo.toISOString())).toBe(false);

      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 3600 * 1000);
      // 25 hours ago is > 24 hours
      // Check toDateString vs now
      const isSameDay = twentyFiveHoursAgo.toDateString() === new Date().toDateString();
      if (!isSameDay) {
        expect(isMoodRecent(twentyFiveHoursAgo.toISOString())).toBe(false);
      }
    });
  });

  describe('1. PartnerStatusCard Edge Conditions', () => {
    it('handles null/undefined currentMood gracefully without throwing', () => {
      const handleOpenDetails = vi.fn();
      const handleOpenMyStatus = vi.fn();

      render(
        <PartnerStatusCard
          isPaired={true}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            lastActiveAt: new Date().toISOString(),
            currentMood: undefined,
          }}
          myPartner={{ name: 'Михаил', avatar: 'heart' }}
          partnerStatusInfo={defaultStatusInfo}
          onOpenDetails={handleOpenDetails}
          onGoToProfile={vi.fn()}
          onOpenMyStatus={handleOpenMyStatus}
        />
      );

      expect(screen.getByText('Екатерина')).toBeInTheDocument();
      // Battery gauge should NOT be rendered
      expect(screen.queryByText(/Высокий заряд|Ровный заряд|Низкий заряд/)).not.toBeInTheDocument();
      // Contextual care suggestion banner should NOT be rendered
      expect(screen.queryByText(/Совет заботы/i)).not.toBeInTheDocument();
    });

    it('handles currentMood when energyLevel is omitted / undefined', () => {
      render(
        <PartnerStatusCard
          isPaired={true}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            lastActiveAt: new Date().toISOString(),
            currentMood: {
              emoji: 'calm',
              label: 'Спокойствие',
              updatedAt: new Date().toISOString(),
              // no energyLevel or careMode
            },
          }}
          myPartner={{ name: 'Михаил', avatar: 'heart' }}
          partnerStatusInfo={defaultStatusInfo}
          onOpenDetails={vi.fn()}
          onGoToProfile={vi.fn()}
        />
      );

      // Mood label must be visible
      expect(screen.getByText('Спокойствие')).toBeInTheDocument();
      // Battery gauge should NOT be rendered
      expect(screen.queryByText(/Высокий заряд|Ровный заряд|Низкий заряд/)).not.toBeInTheDocument();
      // Contextual care suggestion banner should NOT be rendered
      expect(screen.queryByText(/Совет заботы/i)).not.toBeInTheDocument();
    });

    it('treats stale currentMood (> 24 hours) as inactive and hides battery', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();

      render(
        <PartnerStatusCard
          isPaired={true}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            lastActiveAt: new Date().toISOString(),
            currentMood: {
              emoji: 'tired',
              label: 'Усталость',
              energyLevel: 20,
              careMode: 'low_battery',
              updatedAt: fourDaysAgo,
            },
          }}
          myPartner={{ name: 'Михаил', avatar: 'heart' }}
          partnerStatusInfo={defaultStatusInfo}
          onOpenDetails={vi.fn()}
          onGoToProfile={vi.fn()}
        />
      );

      // Even though energyLevel was 20, because updatedAt is 4 days ago, it should NOT render stale battery info
      expect(screen.queryByText('20%')).not.toBeInTheDocument();
      expect(screen.queryByText(/Низкий заряд/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Совет заботы/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Усталость')).not.toBeInTheDocument();
    });

    it('invokes onOpenMyStatus without propagating to card onOpenDetails', () => {
      const handleOpenDetails = vi.fn();
      const handleOpenMyStatus = vi.fn();

      render(
        <PartnerStatusCard
          isPaired={true}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            lastActiveAt: new Date().toISOString(),
            currentMood: {
              emoji: 'calm',
              label: 'Спокойствие',
              energyLevel: 85,
              careMode: 'adventure',
              updatedAt: new Date().toISOString(),
            },
          }}
          myPartner={{ name: 'Михаил', avatar: 'heart' }}
          partnerStatusInfo={defaultStatusInfo}
          onOpenDetails={handleOpenDetails}
          onGoToProfile={vi.fn()}
          onOpenMyStatus={handleOpenMyStatus}
        />
      );

      // 1. Click My Avatar
      const myAvatar = screen.getByTitle('Нажмите, чтобы настроить свой заряд и настроение');
      fireEvent.click(myAvatar);

      expect(handleOpenMyStatus).toHaveBeenCalledTimes(1);
      expect(handleOpenDetails).not.toHaveBeenCalled();

      // 2. Click desktop quick button
      const desktopBtn = screen.getByTitle('Указать мой заряд и настроение');
      fireEvent.click(desktopBtn);

      expect(handleOpenMyStatus).toHaveBeenCalledTimes(2);
      expect(handleOpenDetails).not.toHaveBeenCalled();

      // 3. Click the card body (should trigger onOpenDetails)
      const partnerNameElem = screen.getByText('Екатерина');
      fireEvent.click(partnerNameElem);

      expect(handleOpenDetails).toHaveBeenCalledTimes(1);
    });

    it('renders mobile-only trigger when myEnergy is undefined and onOpenMyStatus is provided', () => {
      const handleOpenMyStatus = vi.fn();
      const handleOpenDetails = vi.fn();

      render(
        <PartnerStatusCard
          isPaired={true}
          partnerName="Екатерина"
          safeOtherPartner={{ avatar: 'flower' }}
          myPartner={{ name: 'Михаил', avatar: 'heart' /* no mood */ }}
          partnerStatusInfo={defaultStatusInfo}
          onOpenDetails={handleOpenDetails}
          onGoToProfile={vi.fn()}
          onOpenMyStatus={handleOpenMyStatus}
        />
      );

      const mobileBtn = screen.getByText(/Указать мой заряд/);
      fireEvent.click(mobileBtn);

      expect(handleOpenMyStatus).toHaveBeenCalledTimes(1);
      expect(handleOpenDetails).not.toHaveBeenCalled();
    });

    it('renders unpaired invitation when isPaired is false and handles click', () => {
      const handleGoToProfile = vi.fn();

      render(
        <PartnerStatusCard
          isPaired={false}
          partnerName="Партнёр"
          safeOtherPartner={{}}
          partnerStatusInfo={defaultStatusInfo}
          onOpenDetails={vi.fn()}
          onGoToProfile={handleGoToProfile}
        />
      );

      expect(screen.getByText('Пригласить половинку')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Пригласить половинку'));
      expect(handleGoToProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. PartnerDetailModal Edge Conditions', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <PartnerDetailModal
          isOpen={false}
          onClose={vi.fn()}
          partnerName="Екатерина"
          safeOtherPartner={{}}
          partnerStatusInfo={defaultStatusInfo}
          onSendSpecificTap={vi.fn()}
          onOpenChat={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('displays fallback state when currentMood is undefined / null', () => {
      const handleSendTap = vi.fn();

      render(
        <PartnerDetailModal
          isOpen={true}
          onClose={vi.fn()}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            login: 'katya',
            currentMood: undefined,
          }}
          partnerStatusInfo={defaultStatusInfo}
          onSendSpecificTap={handleSendTap}
          onOpenChat={vi.fn()}
        />
      );

      // Check fallback block
      expect(screen.getByText('Заряд и настроение не указаны')).toBeInTheDocument();
      expect(screen.getByText('Партнёр ещё не отмечал состояние сегодня')).toBeInTheDocument();

      // Click "Спросить о состоянии" button
      const askBtn = screen.getByText('Спросить о состоянии');
      fireEvent.click(askBtn);

      expect(handleSendTap).toHaveBeenCalledWith(
        'thinking',
        'Как твоё настроение и заряд сегодня? 💭',
        'Спросить о состоянии'
      );
    });

    it('renders mood section with psychologist interpretation when currentMood has no energyLevel', () => {
      render(
        <PartnerDetailModal
          isOpen={true}
          onClose={vi.fn()}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            currentMood: {
              emoji: 'calm',
              label: 'Спокойствие',
              note: 'Читаю интересную книгу',
              updatedAt: new Date().toISOString(),
              // no energyLevel or careMode
            },
          }}
          partnerStatusInfo={defaultStatusInfo}
          onSendSpecificTap={vi.fn()}
          onOpenChat={vi.fn()}
        />
      );

      // Mood badge and label
      expect(screen.getByText('Спокойствие')).toBeInTheDocument();
      expect(screen.getByText(/Читаю интересную книгу/)).toBeInTheDocument();

      // Psychologist view should appear when no battery tier is present
      expect(screen.getByText('Взгляд психолога Совы')).toBeInTheDocument();
      expect(screen.getByText(/В гармонии и душевном равновесии/)).toBeInTheDocument();

      // Battery section should NOT appear
      expect(screen.queryByText('Батарейка энергии и заботы')).not.toBeInTheDocument();
    });

    it('renders full battery, care mode, psychologist advice, and quick care action when battery is provided', () => {
      const handleSendTap = vi.fn();

      render(
        <PartnerDetailModal
          isOpen={true}
          onClose={vi.fn()}
          partnerName="Екатерина"
          safeOtherPartner={{
            avatar: 'flower',
            currentMood: {
              emoji: 'hug',
              label: 'Хочу тепла',
              energyLevel: 15,
              careMode: 'need_hugs',
              updatedAt: new Date().toISOString(),
            },
          }}
          partnerStatusInfo={defaultStatusInfo}
          onSendSpecificTap={handleSendTap}
          onOpenChat={vi.fn()}
        />
      );

      expect(screen.getByText('Батарейка энергии и заботы')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText(/Режим заботы: Нужны обнимашки/)).toBeInTheDocument();
      expect(screen.getByText(/Совет психолога: Екатерина нуждается в бережном тепле/)).toBeInTheDocument();

      // Click care reaction button
      const careBtn = screen.getByText('Отправить крепкие объятия');
      fireEvent.click(careBtn);

      expect(handleSendTap).toHaveBeenCalledWith(
        'care',
        expect.stringContaining('Отправляю тебе тепло и заботу! 🍵'),
        'Отправить крепкие объятия'
      );
    });

    it('triggers quick attention buttons (Думаю о тебе, Скучаю, Горжусь тобой, Ценю тебя)', () => {
      const handleSendTap = vi.fn();

      render(
        <PartnerDetailModal
          isOpen={true}
          onClose={vi.fn()}
          partnerName="Екатерина"
          safeOtherPartner={{ avatar: 'flower' }}
          partnerStatusInfo={defaultStatusInfo}
          onSendSpecificTap={handleSendTap}
          onOpenChat={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Думаю о тебе'));
      expect(handleSendTap).toHaveBeenCalledWith('thinking', 'Думаю о тебе прямо сейчас ✨', 'Думаю о тебе');

      fireEvent.click(screen.getByText('Скучаю'));
      expect(handleSendTap).toHaveBeenCalledWith('miss', 'Очень скучаю по тебе 💌', 'Скучаю');

      fireEvent.click(screen.getByText('Горжусь тобой'));
      expect(handleSendTap).toHaveBeenCalledWith('proud', 'Горжусь тобой и твоими успехами! 🌟', 'Горжусь тобой');

      fireEvent.click(screen.getByText('Ценю тебя'));
      expect(handleSendTap).toHaveBeenCalledWith('grateful', 'Спасибо тебе за то, что ты есть! ❤️', 'Ценю тебя');
    });

    it('triggers onOpenChat and onClose from chat button', () => {
      const handleClose = vi.fn();
      const handleOpenChat = vi.fn();

      render(
        <PartnerDetailModal
          isOpen={true}
          onClose={handleClose}
          partnerName="Екатерина"
          safeOtherPartner={{ avatar: 'flower' }}
          partnerStatusInfo={defaultStatusInfo}
          onSendSpecificTap={vi.fn()}
          onOpenChat={handleOpenChat}
        />
      );

      fireEvent.click(screen.getByText('Написать в чат'));
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleOpenChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. MoodPickerModal Edge Conditions & Mobile Ergonomics', () => {
    it('disables submit button and prevents submission when custom label is empty', () => {
      const handleSubmit = vi.fn();
      const handleClose = vi.fn();

      render(
        <MoodPickerModal
          isOpen={true}
          onClose={handleClose}
          onSubmitMood={handleSubmit}
          initialMoodLabel=""
        />
      );

      const submitBtn = screen.getByText('Сохранить заряд и состояние').closest('button');
      expect(submitBtn).toBeDisabled();

      // Attempt to submit
      fireEvent.click(submitBtn!);
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('interacts with slider and selects care presets', () => {
      const handleSubmit = vi.fn();
      const handleClose = vi.fn();

      render(
        <MoodPickerModal
          isOpen={true}
          onClose={handleClose}
          onSubmitMood={handleSubmit}
          initialEnergyLevel={30}
          initialCareMode="low_battery"
          initialMoodLabel="Устал"
        />
      );

      // Initial state check
      expect(screen.getByText('30%')).toBeInTheDocument();

      // Change preset to adventure
      const advPreset = screen.getByText('Готов(а) к приключениям');
      fireEvent.click(advPreset);

      // Adventure sets energy to 80
      expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);

      // Submit
      const submitBtn = screen.getByText('Сохранить заряд и состояние');
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledWith(
        'fun',
        'К приключениям',
        '',
        80,
        'adventure'
      );
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('allows slider dragging to 0% and 100% boundary limits', () => {
      const handleSubmit = vi.fn();

      render(
        <MoodPickerModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmitMood={handleSubmit}
          initialMoodLabel="Экстрим тест"
        />
      );

      const slider = screen.getByLabelText('Уровень энергии');

      // Drag to 0
      fireEvent.change(slider, { target: { value: '0' } });
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Низкий заряд')).toBeInTheDocument();

      // Drag to 100
      fireEvent.change(slider, { target: { value: '100' } });
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Высокий заряд')).toBeInTheDocument();

      // Submit with 100%
      fireEvent.click(screen.getByText('Сохранить заряд и состояние'));
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.any(String),
        'Экстрим тест',
        '',
        100,
        expect.any(String)
      );
    });
  });

  describe('4. Care Mode Fallback / Engine Edge Cases', () => {
    it('analyzes care suggestion behavior when careMode is null / empty string', () => {
      // Documenting engine behavior:
      // When careMode is undefined, level < 20 yields 'need_hugs'
      const undefMode = getContextualCareSuggestion(10, undefined, 'Анна');
      expect(undefMode.tier).toBe('rose');
      expect(undefMode.actionIcon).toBe('🫂');

      // When careMode is unrecognized string e.g. "random_custom_string", preset is undefined.
      // modeKey evaluates to "random_custom_string".
      // It falls through to balanced amber recommendation:
      const customMode = getContextualCareSuggestion(10, 'random_custom_string', 'Анна');
      expect(customMode.tier).toBe('amber');
    });
  });
});
