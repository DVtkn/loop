import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  Gift,
  CheckCircle2,
  Activity,
  Compass,
  Camera,
  ChevronRight,
  User,
  Calendar,
  Lock,
  MessageCircle,
  FileText,
  Clock,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { PhotoArchive } from './PhotoArchive';
import { TimeCapsuleSection } from './TimeCapsuleSection';
import { triggerHaptic } from '../utils/haptics';
import { PageLayout } from './ui/PageLayout';
import { ColoredAvatar } from './ColoredIcon';
import { calculateCoupleAnalysis } from '../utils/psychologyEngine';
import { PartnerCareCheatSheet } from './us/PartnerCareCheatSheet';

export const UsView: React.FC = () => {
  const {
    currentPartnerId,
    coupleProfile,
    daysTogether,
    formattedTimeTogether,
    tests,
    pulseHistory,
    usSubTab,
    setUsSubTab,
    setActiveTab,
    currentUser,
    dateInvites,
    feedItems,
    challenges,
    toggleChallenge,
    smallCravings,
    wishlist,
  } = useCouple();

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;
  const currentPartner = currentPartnerId === 'partner1' ? partner1 : partner2;
  const otherPartner = currentPartnerId === 'partner1' ? partner2 : partner1;

  const analysis = useMemo(() => {
    return calculateCoupleAnalysis(coupleProfile, pulseHistory, tests);
  }, [coupleProfile, pulseHistory, tests]);

  const completedTestsList = tests.filter((t) => t.partner1Done || t.partner2Done);
  const testsCompleted = completedTestsList.length;
  const totalDates = dateInvites.filter((i) => i.status === 'CONFIRMED').length;
  const feedCount = feedItems.length;
  const isPaired = !!currentUser?.partnerLogin;

  // 3 Unified Segments: 'passport' | 'challenges' | 'moments'
  const activeSubTab: 'passport' | 'challenges' | 'moments' =
    usSubTab === 'challenges'
      ? 'challenges'
      : usSubTab === 'moments' || usSubTab === 'photobook' || usSubTab === 'capsule'
      ? 'moments'
      : 'passport';

  const handleSegmentChange = (tab: 'passport' | 'challenges' | 'moments') => {
    triggerHaptic('selection');
    setUsSubTab(tab);
  };

  return (
    <PageLayout hideHeader>
      <div className="space-y-6 pb-6">
        
        {/* ============================================================ */}
        {/* TOP 3-SEGMENTED SWITCHER: Паспорт | Испытания | Моменты */}
        {/* ============================================================ */}
        <div className="bg-[var(--surface-2)] p-1.5 rounded-2xl flex items-center gap-1 border border-[var(--divider)]/60 select-none shadow-2xs">
          <button
            type="button"
            onClick={() => handleSegmentChange('passport')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'passport'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Паспорт
          </button>
          <button
            type="button"
            onClick={() => handleSegmentChange('challenges')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'challenges'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Испытания
          </button>
          <button
            type="button"
            onClick={() => handleSegmentChange('moments')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'moments'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Моменты
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ПАСПОРТ (СТАЖ + КРАТКИЙ СКОР СОВМЕСТИМОСТИ + КАРТОЧКИ) */}
        {/* ============================================================ */}
        {activeSubTab === 'passport' && (
          <div className="space-y-5">
            
            {/* 1. Core Editorial Hero: Days together & Couple presence */}
            <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/40 to-amber-500/10 dark:from-[var(--surface-solid)] dark:via-[var(--surface-blush)]/20 dark:to-purple-950/20 border border-[var(--card-border)] relative overflow-hidden space-y-5 shadow-[var(--card-shadow)]">
              {/* Luminous Ambient Background Glow */}
              <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-[var(--accent)]/18 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between gap-4 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[11px] shadow-2xs mb-2">
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>История союза</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                    {isPaired ? `${currentPartner.name} & ${otherPartner.name}` : 'Вы и Партнёр'}
                  </h1>
                </div>

                {/* Overlapping Portraits with Glowing Ring */}
                <div className="flex items-center -space-x-3 shrink-0">
                  <div className="w-13 h-13 rounded-full ring-3 ring-[var(--surface-solid)] overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shadow-xs">
                    <ColoredAvatar avatar={currentPartner.avatar || 'sparkles'} name={currentPartner.name} size="md" />
                  </div>
                  <div className="w-13 h-13 rounded-full ring-3 ring-[var(--surface-solid)] overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shadow-xs">
                    <ColoredAvatar avatar={otherPartner.avatar || 'heart'} name={otherPartner.name} size="md" />
                  </div>
                </div>
              </div>

              {/* Dominant Metric */}
              <div className="pt-2 border-t border-[var(--divider)] relative z-10">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-5xl sm:text-6xl font-black gradient-text-love tracking-tight">
                    {isPaired ? Math.max(1, daysTogether) : 1}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[var(--accent)]">
                    {isPaired ? 'дней вместе' : 'день в Loop'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-2)] mt-1 font-semibold">
                  {isPaired ? formattedTimeTogether : 'Подключите партнёра в профиле для синхронизации'}
                </p>
              </div>

              {/* Secondary stats inline (Editorial typography, not heavy cards) */}
              <div className="flex items-center gap-4 text-xs text-[var(--text-2)] font-semibold pt-3 border-t border-[var(--divider)] flex-wrap relative z-10">
                <span><strong className="text-[var(--text)] font-black">{testsCompleted}</strong> из {tests.length} исследований</span>
                <span>•</span>
                <span><strong className="text-[var(--text)] font-black">{totalDates}</strong> свиданий</span>
                <span>•</span>
                <span><strong className="text-[var(--text)] font-black">{feedCount}</strong> моментов</span>
              </div>
            </div>

            {/* 2. Couple Discovery Tests — Refined Discovery Block with Brief Preview Score (NO FULL RADAR) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] space-y-4 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 fill-rose-500/20" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text)]">
                        Исследования и совместимость
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {analysis.isCoupleReportReady && analysis.compatibilityScore ? (
                          <>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                              {analysis.compatibilityScore}% Совместимость
                            </span>
                            <span className="text-xs text-[var(--text-3)] font-medium max-w-[140px] sm:max-w-[200px]">
                              {analysis.archetypeTitle}
                            </span>
                          </>
                        ) : analysis.hasData ? (
                          <>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              Калибровка союза
                            </span>
                            <span className="text-xs text-[var(--text-3)] font-medium">
                              {analysis.waitingFor ? `Ожидание: ${analysis.waitingFor}` : 'Ожидание партнёра'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              Ожидает первого теста
                            </span>
                            <span className="text-xs text-[var(--text-3)] font-medium">
                              Пройдите для расчёта
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-2)] font-normal leading-relaxed pt-2">
                    Исследуйте языки любви, эмоциональную близость и точки гармонии через короткие совместные вопросы.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-medium text-[var(--text-3)]">
                  Пройдено: {testsCompleted} из {tests.length} тестов
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab('report');
                    }}
                    className="text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] px-3 py-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    Аналитика союза →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab('tests');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Исследовать</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Partner Care Cheat-Sheet (Психологическая памятка союза) */}
            <PartnerCareCheatSheet
              currentPartnerId={currentPartnerId}
              coupleProfile={coupleProfile}
              analysis={analysis}
              tests={tests}
            />

            {/* 4. Cards Grid: Книга заботы & Deep Talk карточки */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Card A: Книга заботы */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('care');
                }}
                className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] hover:border-[var(--accent)]/40 flex items-center justify-between gap-3 transition-all cursor-pointer text-left group shadow-2xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--text)] leading-tight">
                      Книга заботы
                    </div>
                    <div className="text-xs text-[var(--text-2)] mt-0.5">
                      Вкусы, цветы, вишлист и радости
                    </div>
                    <div className="text-[11px] font-medium text-[var(--text-3)] mt-1">
                      {smallCravings.length} радостей • {wishlist.length} желаний
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-2)] group-hover:text-[var(--accent)] shrink-0">
                  <span>Открыть</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Card B: Deep Talk карточки */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('deeptalk');
                }}
                className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] hover:border-[var(--accent)]/40 flex items-center justify-between gap-3 transition-all cursor-pointer text-left group shadow-2xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--text)] leading-tight">
                      Deep Talk карточки
                    </div>
                    <div className="text-xs text-[var(--text-2)] mt-0.5">
                      Библиотека глубоких вопросов для двоих
                    </div>
                    <div className="text-[11px] font-medium text-[var(--text-3)] mt-1">
                      15+ тем для сближения
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-2)] group-hover:text-[var(--accent)] shrink-0">
                  <span>Открыть</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ИСПЫТАНИЯ (СОВМЕСТНЫЕ ПРИВЫЧКИ И ЧЕЛЛЕНДЖИ НЕДЕЛИ) */}
        {/* ============================================================ */}
        {activeSubTab === 'challenges' && (
          <div className="space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] space-y-1 shadow-2xs">
              <h2 className="text-base font-bold text-[var(--text)]">
                Испытания и челленджи недели
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                Маленькие совместные шаги для укрепления близости. За каждое выполненное испытание начисляется +50 XP в копилку пары.
              </p>
            </div>

            <div className="space-y-2.5">
              {challenges.map((c) => {
                const myDone =
                  currentPartnerId === 'partner1'
                    ? c.partner1Completed
                    : c.partner2Completed;
                const partnerDone =
                  currentPartnerId === 'partner1'
                    ? c.partner2Completed
                    : c.partner1Completed;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      toggleChallenge(c.id);
                      triggerHaptic('success');
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-98 ${
                      myDone
                        ? 'bg-gradient-to-r from-emerald-500/12 via-emerald-500/8 to-teal-500/5 border-emerald-500/30 shadow-2xs'
                        : 'bg-[var(--surface-solid)] border-[var(--card-border)] hover:border-[var(--accent)]/40 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          myDone
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs scale-105'
                            : 'bg-[var(--surface-2)] text-[var(--text-3)]'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-bold ${
                            myDone
                              ? 'line-through text-[var(--text-2)]'
                              : 'text-[var(--text)]'
                          }`}
                        >
                          {c.title}
                        </div>
                        <div className="text-xs text-[var(--text-3)] flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{c.description || 'Совместное задание'}</span>
                          {partnerDone && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.2 rounded-full">
                              ✓ Партнёр выполнил
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full shrink-0 shadow-2xs ${
                        myDone
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {myDone ? 'Готово (+50 XP) 🎉' : '+50 XP ⭐'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: МОМЕНТЫ (= КАПСУЛА ВРЕМЕНИ + ФОТОЛЕНТА) */}
        {/* ============================================================ */}
        {activeSubTab === 'moments' && (
          <div className="space-y-6">
            {/* 1. Time Capsule Section */}
            <TimeCapsuleSection />

            {/* 2. Photo Archive & Shared Memories */}
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">
                    Фотоархив и воспоминания
                  </h2>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">
                    Ваши совместные фотографии и памятные даты
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('photo-upload-input');
                    if (input) input.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Добавить фото</span>
                </button>
              </div>

              <PhotoArchive />
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
};
