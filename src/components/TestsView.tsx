import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronRight, Activity } from 'lucide-react';
import { useCouple } from '../context/CoupleContext.tsx';
import { TestCategory } from '../types.ts';
import { PageLayout } from './ui/PageLayout.tsx';
import { ReportView } from './ReportView.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { calculateCoupleAnalysis } from '../utils/psychologyEngine.ts';
import { CATEGORIES, getTestMeta } from './tests/testMeta.ts';
import { TestCard } from './tests/TestCard.tsx';
import { TestFeaturedCard } from './tests/TestFeaturedCard.tsx';
import { TestRunnerModal } from './tests/TestRunnerModal.tsx';
import { TestCompletedModal } from './tests/TestCompletedModal.tsx';
import { TestResultModal } from './tests/TestResultModal.tsx';
import { apiFetch } from '../utils/api.ts';

export const TestsView: React.FC<{ initialMode?: 'catalog' | 'report' }> = ({
  initialMode = 'catalog',
}) => {
  const {
    currentPartnerId,
    coupleProfile,
    tests,
    pulseHistory,
    submitTestAnswers,
    triggerConfetti,
    setActiveTab,
    currentUser,
    refreshTestsStatus,
  } = useCouple();

  useEffect(() => {
    refreshTestsStatus?.();
  }, [refreshTestsStatus]);

  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;
  const isPaired = !!currentUser?.partnerLogin;

  const analysis = useMemo(() => {
    return calculateCoupleAnalysis(coupleProfile, pulseHistory, tests);
  }, [coupleProfile, pulseHistory, tests]);

  const [subMode, setSubMode] = useState<'catalog' | 'report'>(initialMode);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTest, setActiveTest] = useState<TestCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [answerMetrics, setAnswerMetrics] = useState<Record<string, any>>({});
  const [testJustFinished, setTestJustFinished] = useState<TestCategory | null>(null);
  const [viewingResultTest, setViewingResultTest] = useState<TestCategory | null>(null);

  const getIsMyDone = useCallback((t: TestCategory) => {
    if (t.isCompletedByMe !== undefined) return !!t.isCompletedByMe;
    return currentPartnerId === 'partner1' ? t.partner1Done : t.partner2Done;
  }, [currentPartnerId]);

  const getIsPartnerDone = useCallback((t: TestCategory) => {
    if (t.isCompletedByPartner !== undefined) return !!t.isCompletedByPartner;
    return currentPartnerId === 'partner1' ? t.partner2Done : t.partner1Done;
  }, [currentPartnerId]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (activeCategory === 'all') return true;
      const meta = getTestMeta(t);
      return meta.categoryKey === activeCategory;
    });
  }, [tests, activeCategory]);

  const featuredTest = useMemo(() => {
    const firstUncompleted = tests.find((t) => !getIsMyDone(t));
    return firstUncompleted || null;
  }, [tests, getIsMyDone]);

  const handleStartTest = async (test: TestCategory) => {
    triggerHaptic('selection');
    setActiveTest(test);
    setTestJustFinished(null);

    let startIndex = 0;
    let initialAnswers = {};

    try {
      const res = await apiFetch(`/api/tests/draft/${test.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          initialAnswers = data.draft.answers || {};
          startIndex = data.draft.currentQuestionIndex || 0;
        }
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }

    setCurrentQuestionIndex(startIndex);
    setUserAnswers(initialAnswers);
    setAnswerMetrics({});
  };

  const handleDeferTest = async () => {
    if (!activeTest) {
      setActiveTest(null);
      return;
    }
    try {
      await apiFetch('/api/tests/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: activeTest.id,
          currentQuestionIndex,
          answers: userAnswers
        })
      });
      alert('Прогресс сохранён. Вы можете продолжить с любого устройства.');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
    setActiveTest(null);
  };

  const handleSelectOption = (questionId: string, value: any, metadata?: any) => {
    triggerHaptic('light');
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    if (metadata) {
      setAnswerMetrics((prev) => ({
        ...prev,
        [questionId]: metadata,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (!activeTest) return;
    if (currentQuestionIndex < activeTest.questions.length - 1) {
      triggerHaptic('selection');
      setCurrentQuestionIndex((prev) => prev + 1);
      
      // Auto-save draft in background
      apiFetch('/api/tests/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: activeTest.id,
          currentQuestionIndex: currentQuestionIndex + 1,
          answers: userAnswers
        })
      }).catch(() => {});
    } else {
      triggerHaptic('success');
      submitTestAnswers(activeTest.id, userAnswers, answerMetrics);
      setTestJustFinished(activeTest);
      setActiveTest(null);
      triggerConfetti();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      triggerHaptic('light');
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const getTestCompletionStatus = (test: TestCategory) => {
    const myDone = getIsMyDone(test);
    const partnerDone = getIsPartnerDone(test);

    if (myDone && partnerDone) {
      return {
        state: 'BOTH_DONE',
        label: 'Оба завершили',
        sublabel: 'Смотреть инсайты',
        isComplete: true,
        actionText: 'Результаты →',
      };
    }
    if (myDone && !partnerDone) {
      return {
        state: 'WAITING_PARTNER',
        label: 'Вы прошли',
        sublabel: isPaired ? `Ждём ${otherPartner.name}` : 'Ждём партнёра',
        isComplete: false,
        actionText: 'Ответы →',
      };
    }
    if (!myDone && partnerDone) {
      const passedVerb = otherPartner.gender === 'male' ? 'уже прошёл' : otherPartner.gender === 'female' ? 'уже прошла' : 'уже прошёл(ла)';
      return {
        state: 'PARTNER_READY',
        label: isPaired ? `${otherPartner.name} ${passedVerb}` : 'Партнёр прошёл',
        sublabel: 'Пройдите для сравнения',
        isComplete: false,
        actionText: 'Пройти →',
      };
    }
    return {
      state: 'NOT_STARTED',
      label: 'Ещё не проходили',
      sublabel: `${test.estimatedMinutes || 5} минут`,
      isComplete: false,
      actionText: 'Пройти →',
    };
  };

  return (
    <PageLayout
      title={subMode === 'report' ? 'Аналитика союза' : 'Исследования пары'}
      subtitle={
        subMode === 'report'
          ? 'Карта гармонии и профиль пары'
          : 'Психологические опросники и карта союза'
      }
      onBack={
        subMode === 'report'
          ? () => setSubMode('catalog')
          : () => setActiveTab('us')
      }
    >
      <div className="space-y-5 pb-8">
        {/* Flo-style Top Segmented Switcher */}
        <div className="bg-[var(--surface-2)] p-1 rounded-2xl flex items-center gap-1 border border-[var(--divider)]/40 select-none max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setSubMode('catalog');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subMode === 'catalog'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <span>Опросники ({tests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setSubMode('report');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subMode === 'report'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <span>📊 Аналитика союза</span>
          </button>
        </div>

        {subMode === 'report' ? (
          <ReportView
            hideHeader
            onStartTest={(testId) => {
              setSubMode('catalog');
              const target = tests.find((x) => x.id === testId);
              if (target) handleStartTest(target);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Radar Banner Teaser */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                setSubMode('report');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] hover:border-[var(--accent)]/40 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    Аналитика союза: {analysis.isCoupleReportReady && analysis.compatibilityScore ? `${analysis.compatibilityScore}%` : 'Калибровка'}
                  </div>
                  <div className="text-xs text-[var(--text-2)] mt-0.5">
                    {analysis.isCoupleReportReady && analysis.compatibilityScore
                      ? 'Карта 6 сфер, суперсилы и разбор союза'
                      : analysis.hasData
                      ? 'Ожидание прохождения тестов партнёром'
                      : 'Пройдите опросники, чтобы открыть аналитику'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] shrink-0">
                <span>Смотреть</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Editorial Header */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-bold text-[var(--accent)]">Исследования пары</div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                Узнайте друг друга глубже
              </h1>
              <p className="text-sm text-[var(--text-2)] font-normal leading-relaxed pt-0.5 max-w-lg">
                Короткие вопросы для двоих — чтобы понять скрытые потребности, языки заботы и точки душевного сближения.
              </p>
            </div>

            {/* Category Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveCategory(cat.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/30 font-bold shadow-2xs'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--divider)]'
                    }`}
                  >
                    <span className="text-[11px] opacity-70">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Featured Test Spotlight */}
            {activeCategory === 'all' && (
              featuredTest ? (
                <TestFeaturedCard featuredTest={featuredTest} onStartTest={handleStartTest} />
              ) : (
                <div 
                  onClick={() => setSubMode('report')}
                  className="bg-[var(--surface-blush)] border border-[var(--accent)]/30 p-6 rounded-3xl cursor-pointer hover:border-[var(--accent)]/60 transition-all text-center flex flex-col items-center justify-center space-y-3 shadow-2xs"
                >
                  <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-1 shadow-sm">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h3 className="text-[var(--text)] font-extrabold text-xl tracking-tight">Все исследования пройдены 🎉</h3>
                  <p className="text-[var(--text-2)] text-sm max-w-sm mx-auto leading-relaxed">
                    Вы завершили все доступные опросники. Посмотрите обновлённую аналитику союза и ваши точки синергии.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[var(--surface)] font-bold text-sm bg-[var(--accent)] px-5 py-2.5 rounded-2xl hover:bg-[var(--accent-2)] transition-colors shadow-md">
                    Перейти к аналитике союза <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )
            )}

            {/* Tests List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-[var(--text-2)]">
                  Все исследования ({filteredTests.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Аналитика союза</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredTests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onClick={() => {
                      if (getIsMyDone(test)) {
                        triggerHaptic('selection');
                        setViewingResultTest(test);
                      } else {
                        handleStartTest(test);
                      }
                    }}
                    status={getTestCompletionStatus(test)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Runner Modal */}
      <TestRunnerModal
        activeTest={activeTest}
        currentQuestionIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        partnerName={otherPartner?.name || 'Партнёр'}
        partnerAnswers={currentPartnerId === 'partner1' ? activeTest?.partner2Answers : activeTest?.partner1Answers}
        onSelectOption={handleSelectOption}
        onNextQuestion={handleNextQuestion}
        onPrevQuestion={handlePrevQuestion}
        onClose={handleDeferTest}
      />

      {/* Test Completed Modal */}
      <TestCompletedModal
        test={testJustFinished}
        userAnswers={userAnswers}
        partnerAnswers={currentPartnerId === 'partner1' ? testJustFinished?.partner2Answers : testJustFinished?.partner1Answers}
        isPaired={isPaired}
        partnerName={otherPartner.name}
        onViewReport={() => {
          setTestJustFinished(null);
          setSubMode('report');
        }}
        onViewTestResult={() => {
          const target = testJustFinished;
          setTestJustFinished(null);
          setViewingResultTest(target);
        }}
        onClose={() => setTestJustFinished(null)}
      />

      {/* Test Result & Pair Comparison Modal */}
      <TestResultModal
        test={viewingResultTest}
        partner1={coupleProfile.partner1}
        partner2={coupleProfile.partner2}
        currentPartnerId={currentPartnerId}
        onRetake={(test) => {
          setViewingResultTest(null);
          handleStartTest(test);
        }}
        onClose={() => setViewingResultTest(null)}
      />
    </PageLayout>
  );
};
