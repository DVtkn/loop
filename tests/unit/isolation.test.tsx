import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { TestCard, resolveTestStatus } from '../../src/components/tests/TestCard.tsx';
import { ReportView } from '../../src/components/ReportView.tsx';
import { CoupleContext, CoupleContextType } from '../../src/context/CoupleContext.tsx';
import { initialCoupleProfile, getFreshTests } from '../../src/data/questionBank.ts';
import { TestCategory } from '../../src/types.ts';

// Mock Recharts and Canvas to avoid jsdom drawing errors
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Radar: () => <div />,
  Tooltip: () => <div />,
}));

const freshTests = getFreshTests();

const mockBaseContext: Partial<CoupleContextType> = {
  theme: 'aurora',
  setTheme: vi.fn(),
  font: 'inter',
  setFont: vi.fn(),
  screen: 'app',
  setScreen: vi.fn(),
  isOnboarded: true,
  setIsOnboarded: vi.fn(),
  currentUser: {
    id: 'user-dmitry',
    login: 'dmitry',
    name: 'Dmitry',
    gender: 'male',
    partnerLogin: 'anna',
    createdAt: new Date().toISOString(),
    avatarEmoji: '✨',
  },
  coupleProfile: {
    ...initialCoupleProfile,
    partner1: { ...initialCoupleProfile.partner1, name: 'Dmitry', gender: 'male' },
    partner2: { ...initialCoupleProfile.partner2, name: 'Anna', gender: 'female' },
  },
  pulseHistory: [],
  tests: freshTests.map((t) => ({
    ...t,
    partner1Done: true,
    partner2Done: false,
    isCompletedByMe: false,
    isCompletedByPartner: true,
  })),
  challenges: [],
  smallCravings: [],
  moodHistory: [],
  dateInvites: [],
  loveTaps: [],
  dailyQuiz: {
    id: 'quiz-1',
    question: 'Тестовый вопрос',
    options: [
      { key: 'partner', label: 'Вариант 1' },
      { key: 'me', label: 'Вариант 2' },
    ],
    partner1Answer: undefined,
    partner2Answer: undefined,
    isMatch: false,
    category: 'Привычки',
  },
  triggerConfetti: vi.fn(),
  setActiveTab: vi.fn(),
  currentPartnerId: 'partner2',
};

describe('Cross-Account Isolation Tests', () => {
  it('1. TestCard Badge Isolation: should show "Пройти исследование" and NOT show "Вы прошли" when only partner completed', () => {
    const mockTest: TestCategory = {
      ...freshTests[0],
      id: 'TEST-S1',
      title: 'Стили привязанности',
      partner1Done: true,
      partner2Done: false,
      isCompletedByMe: false,
      isCompletedByPartner: true,
    };

    const status = resolveTestStatus(mockTest, 'Anna');

    render(
      <TestCard
        test={mockTest}
        status={status}
        onClick={vi.fn()}
      />
    );

    // 1. Should display action button to take test
    expect(screen.getByText(/Пройти исследование/i)).toBeInTheDocument();

    // 2. Must STRICTLY NOT display "Вы прошли"
    expect(screen.queryByText(/Вы прошли/i)).not.toBeInTheDocument();
  });

  it('2. Analytics Tab Isolation: should show "Нет данных" for partner tab when partner has not completed tests and omit joint metrics', () => {
    render(
      <CoupleContext.Provider value={mockBaseContext as CoupleContextType}>
        <ReportView
          activeTab="partner"
          partnerProfile={null}
        />
      </CoupleContext.Provider>
    );

    // 1. Must render "Нет данных" in partner tab
    expect(screen.getByText(/Нет данных/i)).toBeInTheDocument();

    // 2. Joint radar elements and synergy zones MUST NOT be present
    expect(screen.queryByText(/Зона синергии/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Точки взаимной синергии/i)).not.toBeInTheDocument();
  });
});

