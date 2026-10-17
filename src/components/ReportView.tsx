import { apiFetch } from "../utils/api";
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Award,
  RefreshCw,
  BookOpen,
  ChevronRight,
  Heart,
  TrendingUp,
  Compass,
  Clock,
  BellRing,
  Check,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  calculateCoupleAnalysis,
  getDemoCoupleAnalysis,
  DeepCoupleAnalysis,
} from '../utils/psychologyEngine';
import { RelationshipRadar } from './RelationshipRadar';
import { RelationshipDynamics } from './RelationshipDynamics';
import { CoupleRatingWidget } from './CoupleRatingWidget';
import { PageLayout } from './ui/PageLayout';
import { triggerHaptic } from '../utils/haptics';

export interface ReportViewProps {
  onStartTest?: (testId: string) => void;
  hideHeader?: boolean;
  activeTab?: string;
  partnerProfile?: any;
  initialSegment?: 'radar' | 'strengths' | 'dynamics' | 'rating';
}

export const ReportView: React.FC<ReportViewProps> = ({
  onStartTest,
  hideHeader = false,
  activeTab,
  partnerProfile,
  initialSegment = 'radar',
}) => {
  const {
    coupleProfile: contextCoupleProfile,
    pulseHistory,
    tests,
    triggerConfetti,
    setActiveTab,
  } = useCouple();

  const coupleProfile = useMemo(() => {
    if (partnerProfile !== undefined) {
      return {
        ...contextCoupleProfile,
        partner2: partnerProfile || { name: 'Партнёр', gender: 'female' },
      };
    }
    return contextCoupleProfile;
  }, [contextCoupleProfile, partnerProfile]);

  const [activeSegment, setActiveSegment] = useState<'radar' | 'strengths' | 'dynamics' | 'rating'>(initialSegment);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiReportOverride, setAiReportOverride] = useState<Partial<DeepCoupleAnalysis> | null>(null);
  const [reminded, setReminded] = useState(false);

  const handleRemindPartner = () => {
    triggerHaptic('success');
    setReminded(true);
    setTimeout(() => setReminded(false), 3000);
  };

  // Live deep analysis based on psychology formulas
  const baseAnalysis = useMemo(() => {
    return calculateCoupleAnalysis(coupleProfile, pulseHistory, tests);
  }, [coupleProfile, pulseHistory, tests]);

  const analysis = useMemo(() => {
    if (aiReportOverride) {
      return { ...baseAnalysis, ...aiReportOverride };
    }
    return baseAnalysis;
  }, [baseAnalysis, aiReportOverride]);

  const handleStartTest = (testId: string = 'TEST-S1') => {
    if (onStartTest) {
      onStartTest(testId);
    } else {
      setActiveTab('tests');
    }
  };

  const handleRegenerateAIReport = async () => {
    triggerHaptic('selection');
    setIsGeneratingAI(true);
    try {
      const res = await apiFetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleData: {
            partner1: coupleProfile.partner1,
            partner2: coupleProfile.partner2,
            testsCompleted: analysis.completedTestsCount,
            pulse: pulseHistory[0],
          },
        }),
      });
      const data = await res.json();
      if (data.report && data.report.title) {
        setAiReportOverride({
          archetypeTitle: data.report.title,
          summary: data.report.summary || baseAnalysis.summary,
          strengths: data.report.strengths?.length
            ? data.report.strengths.map((s: string, idx: number) => ({
                title: `Суперсила ${idx + 1}`,
                description: s,
                icon: 'CheckCircle2',
                metricTag: 'Высокая синергия',
              }))
            : baseAnalysis.strengths,
        });
        triggerConfetti();
      }
    } catch (err) {
      console.warn('AI live report fallback to offline engine', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const SECTIONS = [
    { id: 'radar', label: 'Карта гармонии', icon: '✦' },
    { id: 'strengths', label: 'Суперсилы', icon: '♡' },
    { id: 'dynamics', label: 'Динамика', icon: '✧' },
    { id: 'rating', label: 'Рейтинг союза', icon: '★' },
  ];

  const content = (
    <div className="space-y-5 pt-1 pb-10 animate-fadeIn">
        
        {/* 1. Category Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {SECTIONS.map((sec) => {
            const isActive = activeSegment === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveSegment(sec.id as any);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--accent)]/30 font-bold shadow-2xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--divider)]'
                }`}
              >
                <span className="text-[11px] opacity-70">{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Archetype Callout (When BOTH partners completed tests and report is ready) */}
        {analysis.isCoupleReportReady && analysis.archetypeTitle ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-[var(--surface-blush)] via-[var(--surface)] to-[var(--surface-2)] border border-[var(--accent)]/30 space-y-3 shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-[11px] font-extrabold shadow-2xs">
                    {analysis.compatibilityScore ? `${analysis.compatibilityScore}% Гармония` : '100%'}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
                    Психологический архетип союза
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                  {analysis.archetypeTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleRegenerateAIReport}
                disabled={isGeneratingAI}
                className="p-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-blush)] text-[var(--accent)] border border-[var(--divider)] transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Обновить психологическую интерпретацию"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed font-medium">
              {analysis.summary}
            </p>
          </div>
        ) : (
          <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {analysis.hasData
                    ? `Калибровка союза • ${analysis.waitingFor ? `Ожидание: ${analysis.waitingFor}` : 'Ожидание партнёра'}`
                    : 'Исследования ещё не начаты'}
                </span>
              </div>
              <span className="text-xs font-semibold text-[var(--text-3)]">
                {analysis.completedTestsCount} из {analysis.totalTestsCount} тестов
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
              {analysis.summary}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartTest()}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <span>Пройти опросники</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Main Content Segments */}
        <div>
          {activeSegment === 'radar' && (
            <RelationshipRadar onStartTest={handleStartTest} activeTab={activeTab as any} />
          )}

          {activeSegment === 'dynamics' && (
            <>
              {!analysis.isCoupleReportReady ? (
                <div className="p-8 text-center rounded-3xl bg-[var(--surface)] border border-[var(--divider)] space-y-3 shadow-2xs animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto text-xl shadow-2xs">
                    ⏳
                  </div>
                  <h4 className="text-base font-semibold text-[var(--text)]">Динамика отношений формируется</h4>
                  <p className="text-xs text-[var(--text-3)] max-w-xs mx-auto leading-relaxed">
                    Динамика парных метрик формируется после совместного прохождения исследований. Ждём завершения тестов от {analysis.waitingFor || coupleProfile.partner2.name || 'партнёра'}.
                  </p>
                  <button
                    type="button"
                    onClick={handleRemindPartner}
                    disabled={reminded}
                    className={`mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                      reminded
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                    }`}
                  >
                    {reminded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Напоминание отправлено!</span>
                      </>
                    ) : (
                      <>
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Напомнить партнёру</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <RelationshipDynamics coupleId={coupleProfile.id} />
              )}
            </>
          )}

          {activeSegment === 'strengths' && (
            <div className="space-y-3 animate-fadeIn">
              {!analysis.isCoupleReportReady ? (
                <div className="p-8 text-center rounded-3xl bg-[var(--surface)] border border-[var(--divider)] space-y-3 shadow-2xs animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto text-xl shadow-2xs">
                    ⏳
                  </div>
                  <h4 className="text-base font-semibold text-[var(--text)]">Суперсилы формируются</h4>
                  <p className="text-xs text-[var(--text-3)] max-w-xs mx-auto leading-relaxed">
                    Суперсилы и точки синергии пары рассчитываются на основе совместных ответов. Ждём завершения тестов от {analysis.waitingFor || coupleProfile.partner2.name || 'партнёра'}.
                  </p>
                  <button
                    type="button"
                    onClick={handleRemindPartner}
                    disabled={reminded}
                    className={`mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                      reminded
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                    }`}
                  >
                    {reminded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Напоминание отправлено!</span>
                      </>
                    ) : (
                      <>
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Напомнить партнёру</span>
                      </>
                    )}
                  </button>
                </div>
              ) : analysis.strengths.length > 0 ? (
                <div className="space-y-3">
                  <div className="px-1 text-xs font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Точки наибольшей близости & Суперсилы союза</span>
                  </div>
                  {analysis.strengths.map((st, i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-5 bg-[var(--surface)] rounded-3xl border border-[var(--divider)] shadow-2xs space-y-2 hover:border-[var(--accent)]/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                          <h4 className="font-extrabold text-sm sm:text-base text-[var(--text)]">{st.title}</h4>
                        </div>
                        {st.metricTag && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] text-[11px] font-bold border border-[var(--accent)]/20 shrink-0">
                            {st.metricTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-2)] leading-relaxed pl-4.5">
                        {st.description}
                      </p>
                    </div>
                  ))}

                  {/* Bonus Couple Trivia Card */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/20 space-y-1.5 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <span>💡</span>
                      <span>Секрет гармонии вашей пары:</span>
                    </div>
                    <p className="text-xs text-[var(--text-2)] leading-relaxed pl-5">
                      Чем больше опросников вы завершаете вместе, тем точнее Loop находит ваши точки синергии. Различия в ответах — это ваш главный тандем: вы дополняете друг друга там, где это нужнее всего!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--divider)] space-y-2 shadow-2xs">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center mx-auto border border-[var(--accent)]/20">
                    <Heart className="w-5 h-5 fill-[var(--accent)]" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text)]">Суперсилы формируются</h4>
                  <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
                    Пройдите первые исследования вместе, чтобы Сова определила главные опоры и синергию вашего союза.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleStartTest('TEST-S1')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Пройти исследование</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSegment === 'rating' && (
            <CoupleRatingWidget />
          )}
        </div>
      </div>
    );

  if (hideHeader) {
    return content;
  }

  return (
    <PageLayout
      title="Аналитика союза"
      subtitle="Карта гармонии и профиль пары"
      onBack={() => setActiveTab('us')}
    >
      {content}
    </PageLayout>
  );
};
