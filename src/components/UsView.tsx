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
  Flame,
  Award,
  Flower2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { PhotoArchive } from './PhotoArchive';
import { TimeCapsuleSection } from './TimeCapsuleSection';
import { triggerHaptic } from '../utils/haptics';
import { PageLayout } from './ui/PageLayout';
import { ColoredAvatar } from './ColoredIcon';
import { calculateCoupleAnalysis } from '../utils/psychologyEngine';
import { PartnerCareCheatSheet } from './us/PartnerCareCheatSheet';
import { DEEP_TALK_CARDS } from '../data/gamificationData';

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
    flowerPreferences,
  } = useCouple();

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;
  const currentPartner = currentPartnerId === 'partner1' ? partner1 : partner2;
  const otherPartner = currentPartnerId === 'partner1' ? partner2 : partner1;
  const otherPartnerId = currentPartnerId === 'partner1' ? 'partner2' : 'partner1';

  const partnerFlowers = flowerPreferences?.[otherPartnerId]?.favoriteFlowers || [];

  const analysis = useMemo(() => {
    return calculateCoupleAnalysis(coupleProfile, pulseHistory, tests);
  }, [coupleProfile, pulseHistory, tests]);

  const completedTestsList = tests.filter((t) => t.partner1Done || t.partner2Done);
  const testsCompleted = completedTestsList.length;
  const totalDates = dateInvites.filter((i) => i.status === 'CONFIRMED').length;
  const feedCount = feedItems.length;
  const isPaired = !!currentUser?.partnerLogin;

  // Challenges stats
  const myCompletedChallenges = challenges.filter((c) =>
    currentPartnerId === 'partner1' ? c.partner1Completed : c.partner2Completed
  ).length;

  const partnerCompletedChallenges = challenges.filter((c) =>
    currentPartnerId === 'partner1' ? c.partner2Completed : c.partner1Completed
  ).length;

  // Safe days together & formatted text
  const validDays = Number.isFinite(daysTogether) && daysTogether > 0 ? daysTogether : 1;
  const displayTimeTogether = isPaired
    ? (!formattedTimeTogether || formattedTimeTogether.includes('NaN') ? `${validDays} дн. вместе` : formattedTimeTogether)
    : 'Подключите партнёра в профиле для синхронизации';

  // Next milestone calculation
  const nextMilestone = useMemo(() => {
    const d = validDays;
    if (d < 30) return { target: 30, text: '30 дней (первый месяц)', left: 30 - d };
    if (d < 50) return { target: 50, text: '50 дней вместе', left: 50 - d };
    if (d < 100) return { target: 100, text: '100 дней гармонии', left: 100 - d };
    if (d < 182) return { target: 182, text: 'Полгода союза', left: 182 - d };
    if (d < 365) return { target: 365, text: '1 Год любви', left: 365 - d };
    const nextHundreds = Math.ceil(d / 100) * 100;
    return { target: nextHundreds, text: `${nextHundreds} дней союза`, left: nextHundreds - d };
  }, [validDays]);

  // Daily deep talk teaser question
  const deepTalkTeaser = useMemo(() => {
    if (!DEEP_TALK_CARDS || DEEP_TALK_CARDS.length === 0) return null;
    const dayOfYear = Math.floor(Date.now() / 86400000);
    return DEEP_TALK_CARDS[dayOfYear % DEEP_TALK_CARDS.length];
  }, []);

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
        <div className="bg-[var(--surface-2)] p-1.5 rounded-2xl flex items-center gap-1.5 border border-[var(--divider)]/70 select-none shadow-2xs">
          <button
            type="button"
            onClick={() => handleSegmentChange('passport')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'passport'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Паспорт</span>
          </button>
          <button
            type="button"
            onClick={() => handleSegmentChange('challenges')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'challenges'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Испытания</span>
            {challenges.length > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'challenges' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-3)] text-[var(--text-2)]'
              }`}>
                {myCompletedChallenges}/{challenges.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSegmentChange('moments')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'moments'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Моменты</span>
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
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--accent)]/20 via-amber-400/12 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[11px] shadow-2xs mb-1">
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>История союза</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                    {isPaired ? `${currentPartner.name} & ${otherPartner.name}` : 'Вы и Партнёр'}
                  </h1>
                  <p className="text-xs text-[var(--text-2)] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Союз активен и синхронизирован</span>
                  </p>
                </div>

                {/* Overlapping Portraits with Glowing Ring & Heart Bridge */}
                <div className="relative flex items-center shrink-0">
                  <div className="flex items-center -space-x-3">
                    <div className="w-14 h-14 rounded-full ring-3 ring-[var(--surface-solid)] overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shadow-xs">
                      <ColoredAvatar avatar={currentPartner.avatar || 'sparkles'} name={currentPartner.name} size="md" />
                    </div>
                    <div className="w-14 h-14 rounded-full ring-3 ring-[var(--surface-solid)] overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shadow-xs">
                      <ColoredAvatar avatar={otherPartner.avatar || 'heart'} name={otherPartner.name} size="md" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white ring-2 ring-[var(--surface-solid)] shadow-xs">
                    <Heart className="w-3 h-3 fill-white" />
                  </div>
                </div>
              </div>

              {/* Dominant Metric */}
              <div className="pt-2 border-t border-[var(--divider)] relative z-10">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-5xl sm:text-6xl font-black gradient-text-love tracking-tight">
                    {validDays}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-[var(--accent)]">
                    {isPaired ? 'дней вместе' : 'день в Loop'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-1.5 flex-wrap">
                  <p className="text-xs sm:text-sm text-[var(--text-2)] font-semibold">
                    {displayTimeTogether}
                  </p>
                  {isPaired && nextMilestone && nextMilestone.left > 0 && (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/12 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      🎯 До {nextMilestone.text}: {nextMilestone.left} дн.
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary stats inline (Editorial typography) */}
              <div className="flex items-center gap-4 text-xs text-[var(--text-2)] font-semibold pt-3 border-t border-[var(--divider)] flex-wrap relative z-10">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span><strong className="text-[var(--text)] font-black">{testsCompleted}</strong> из {tests.length} исследований</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span><strong className="text-[var(--text)] font-black">{totalDates}</strong> свиданий</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  <span><strong className="text-[var(--text)] font-black">{feedCount}</strong> воспоминаний</span>
                </span>
              </div>
            </div>

            {/* 2. Couple Discovery Tests — Refined Discovery Block with Brief Preview Score */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] space-y-4 shadow-[var(--card-shadow)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/8 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text)]">
                        Исследования и совместимость
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {analysis.isCoupleReportReady && analysis.compatibilityScore ? (
                          <>
                            <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/12 px-2.5 py-0.5 rounded-full border border-rose-500/20 shadow-2xs">
                              {analysis.compatibilityScore}% Совместимость
                            </span>
                            <span className="text-xs text-[var(--text-2)] font-bold">
                              {analysis.archetypeTitle}
                            </span>
                          </>
                        ) : analysis.hasData ? (
                          <>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/12 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                              Калибровка союза
                            </span>
                            <span className="text-xs text-[var(--text-3)] font-medium">
                              {analysis.waitingFor ? `Ожидание: ${analysis.waitingFor}` : 'Ожидание партнёра'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/12 px-2.5 py-0.5 rounded-full border border-amber-500/20">
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

              {/* Progress bar of discovery */}
              <div className="space-y-1.5 relative z-10 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-2)]">
                  <span>Раскрыто граней союза</span>
                  <span className="font-bold text-[var(--text)]">{testsCompleted} из {tests.length}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] via-pink-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((testsCompleted / (tests.length || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between gap-3 flex-wrap relative z-10">
                <span className="text-xs font-medium text-[var(--text-3)]">
                  {testsCompleted === tests.length ? 'Все исследования пройдены 🎉' : `Осталось пройти: ${tests.length - testsCompleted}`}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab('report');
                    }}
                    className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text)] px-3 py-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    Аналитика союза →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab('tests');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-black hover:bg-[var(--accent-hover)] active:scale-95 transition-all cursor-pointer shadow-xs"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Card A: Книга заботы */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('care');
                }}
                className="p-5 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/50 flex flex-col justify-between gap-3 transition-all cursor-pointer text-left group shadow-[var(--card-shadow)] hover:shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3 w-full relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-[var(--text)] leading-tight">
                        Книга заботы
                      </div>
                      <div className="text-xs text-[var(--text-2)] mt-0.5 font-medium">
                        Вкусы, цветы, вишлист и радости
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>

                {/* Rich preview pill */}
                <div className="w-full pt-2 border-t border-[var(--divider)] flex items-center justify-between text-xs text-[var(--text-2)] relative z-10">
                  <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[11px]">
                    {partnerFlowers.length > 0 ? `🌸 ${partnerFlowers[0]}` : '💐 Цветы партнёра'}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-3)]">
                    {smallCravings.length} хотелок • {wishlist.length} желаний
                  </span>
                </div>
              </button>

              {/* Card B: Deep Talk карточки */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('deeptalk');
                }}
                className="p-5 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/50 flex flex-col justify-between gap-3 transition-all cursor-pointer text-left group shadow-[var(--card-shadow)] hover:shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/8 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3 w-full relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-[var(--text)] leading-tight">
                        Deep Talk карточки
                      </div>
                      <div className="text-xs text-[var(--text-2)] mt-0.5 font-medium">
                        Библиотека глубоких вопросов для двоих
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>

                {/* Rich preview question snippet */}
                <div className="w-full pt-2 border-t border-[var(--divider)] relative z-10">
                  <p className="text-[11px] text-[var(--text-2)] italic line-clamp-1">
                    {deepTalkTeaser ? `«${deepTalkTeaser.question}»` : '15+ тем для сближения вечерами'}
                  </p>
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
            
            {/* Week Progress Hero Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/30 to-amber-500/10 border border-[var(--card-border)] space-y-4 shadow-[var(--card-shadow)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/20 shadow-2xs">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Испытания недели</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-[var(--text)] tracking-tight">
                    Маленькие шаги к большой близости
                  </h2>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed font-medium">
                    За каждое выполненное задание начисляется +50 XP в копилку союза.
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-2xl sm:text-3xl font-black gradient-text-gold">
                    +{myCompletedChallenges * 50}
                  </span>
                  <span className="block text-[11px] font-bold text-[var(--text-3)]">
                    XP заработано
                  </span>
                </div>
              </div>

              {/* Weekly completion bar */}
              <div className="space-y-1.5 relative z-10 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-2)]">
                  <span>Прогресс недели: {myCompletedChallenges} из {challenges.length} готово</span>
                  <span className="font-black text-[var(--accent)]">
                    {Math.round((myCompletedChallenges / (challenges.length || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-[var(--accent)] transition-all duration-500 shadow-2xs"
                    style={{ width: `${Math.min(100, Math.round((myCompletedChallenges / (challenges.length || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Challenges list */}
            <div className="space-y-3">
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
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          myDone
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs scale-105'
                            : 'bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--divider)]'
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
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20">
                              ✓ {otherPartner.name || 'Партнёр'} выполнил(а)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full shrink-0 shadow-2xs ${
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
            <PhotoArchive />
          </div>
        )}

      </div>
    </PageLayout>
  );
};
