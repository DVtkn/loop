import React, { useState, useMemo, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext.tsx';
import { NavigationTab } from '../types.ts';
import { PageLayout } from './ui/PageLayout.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { dispatchInAppNotification, getPushStatus, requestPushPermission } from '../utils/pushManager.ts';
import { calculateCoupleAnalysis } from '../utils/psychologyEngine.ts';
import { PartnerStatusCard, getPartnerStatusDetails } from './dashboard/PartnerStatusCard.tsx';
import { CompatibilityAndStreak } from './dashboard/CompatibilityAndStreak.tsx';
import { DailyQuestionTeaser } from './dashboard/DailyQuestionTeaser.tsx';
import { PartnerDetailModal } from './dashboard/PartnerDetailModal.tsx';
import { SetStartDateModal } from './dashboard/SetStartDateModal.tsx';
import { DailyHabitTracker } from './dashboard/DailyHabitTracker.tsx';
import { HugButtonWithMenu } from './dashboard/HugButtonWithMenu.tsx';
import { WeeklyFeaturedTestCard } from './dashboard/WeeklyFeaturedTestCard.tsx';
import { PetCard } from './PetCard.tsx';
import { PairEventsFeed } from './dashboard/PairEventsFeed.tsx';
import { ScheduleModal } from './ScheduleModal.tsx';

interface DashboardViewProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const {
    currentPartnerId,
    coupleProfile,
    updateCoupleProfile,
    questionAnswer,
    answerQuestionOfDay,
    feedItems,
    addFeedItem,
    tests,
    dateInvites,
    scheduleEvents,
    setUsSubTab,
    setDatesSubTab,
    currentUser,
    sendTouchAction,
    triggerConfetti,
    xpHistory,
    pulseHistory,
    moodHistory,
    loveTaps,
  } = useCouple();

  const currentPartner = currentPartnerId === 'partner1' ? coupleProfile?.partner1 : coupleProfile?.partner2;
  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile?.partner2 : coupleProfile?.partner1;
  const isPaired = !!currentUser?.partnerLogin;

  // Safe fallback to guarantee partner status always renders
  const safeOtherPartner = {
    id: otherPartner?.id || (currentPartnerId === 'partner1' ? 'partner2' : 'partner1'),
    name: otherPartner?.name || (isPaired ? (currentUser?.partnerLogin || 'Партнёр') : 'Партнёр не подключён'),
    avatar: otherPartner?.avatar || 'heart',
    login: otherPartner?.login || currentUser?.partnerLogin || '',
    gender: otherPartner?.gender,
    lastActiveAt: otherPartner?.lastActiveAt,
    loveLanguage: otherPartner?.loveLanguage || 'Не указан',
    attachmentStyle: otherPartner?.attachmentStyle || 'Не указан',
    currentMood: otherPartner?.currentMood || null,
  };

  const partnerName =
    safeOtherPartner.name && safeOtherPartner.name !== 'Партнёр не подключён' && safeOtherPartner.name !== 'Партнёр 1' && safeOtherPartner.name !== 'Партнёр 2'
      ? safeOtherPartner.name
      : currentUser?.partnerLogin || safeOtherPartner.login || (isPaired ? 'Партнёр' : 'Партнёр не подключён');

  const partnerStatusInfo = getPartnerStatusDetails({
    name: partnerName,
    lastActiveAt: safeOtherPartner.lastActiveAt,
    gender: safeOtherPartner.gender,
    login: safeOtherPartner.login,
  });

  // Calculate live compatibility score
  const coupleAnalysis = useMemo(() => {
    try {
      return calculateCoupleAnalysis(coupleProfile, pulseHistory || [], tests || []);
    } catch {
      return null;
    }
  }, [coupleProfile, pulseHistory, tests]);

  const hasCompatibilityData = !!(coupleAnalysis?.isCoupleReportReady && coupleAnalysis.compatibilityScore && coupleAnalysis.compatibilityScore > 0);
  const compatibilityPercent = hasCompatibilityData && coupleAnalysis?.compatibilityScore ? coupleAnalysis.compatibilityScore : 0;
  const compatibilityStatus = hasCompatibilityData
    ? compatibilityPercent >= 85
      ? 'Высокая'
      : compatibilityPercent >= 70
      ? 'Тёплая'
      : 'Развитие'
    : coupleAnalysis?.hasData
    ? 'Калибровка'
    : 'Пройти тест';

  // Calculate continuous activity streak (days in a row) based on real interactions
  const streakDaysCount = useMemo(() => {
    const datesWithActivity = new Set<string>();

    (xpHistory || []).forEach((e) => {
      const entryTime = e.timestamp || (e as any).createdAt || (e as any).date;
      if (entryTime) datesWithActivity.add(entryTime.split('T')[0]);
    });
    (pulseHistory || []).forEach((p) => {
      if (p.date) datesWithActivity.add(p.date.split('T')[0]);
    });
    (moodHistory || []).forEach((m) => {
      if (m.date) datesWithActivity.add(m.date.split('T')[0]);
    });
    (loveTaps || []).forEach((t) => {
      if (t.createdAt) datesWithActivity.add(t.createdAt.split('T')[0]);
    });
    (feedItems || []).forEach((f) => {
      const fTime = (f as any).createdAt || (f as any).timestamp;
      if (fTime) datesWithActivity.add(fTime.split('T')[0]);
    });
    (dateInvites || []).forEach((d) => {
      if (d.createdAt) datesWithActivity.add(d.createdAt.split('T')[0]);
    });

    if (datesWithActivity.size === 0) {
      return 0;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Если ни сегодня, ни вчера не было активности — серия прервана
    if (!datesWithActivity.has(todayStr) && !datesWithActivity.has(yesterdayStr)) {
      return 0;
    }

    let streak = 0;
    const cur = datesWithActivity.has(todayStr) ? new Date(now) : new Date(yesterday);
    while (true) {
      const dStr = cur.toISOString().split('T')[0];
      if (datesWithActivity.has(dStr)) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [xpHistory, pulseHistory, moodHistory, loveTaps, feedItems, dateInvites]);


  // Interaction feedback states
  const [quickHugSent, setQuickHugSent] = useState<boolean>(false);
  const [showPartnerDetailModal, setShowPartnerDetailModal] = useState<boolean>(false);
  const [showStartDateModal, setShowStartDateModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Subtle Web Push opt-in banner for couples
  const [showPushBanner, setShowPushBanner] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const dismissed = localStorage.getItem('loop_push_prompt_dismissed');
      const status = getPushStatus();
      return !dismissed && status.isSupported && status.permission === 'default';
    } catch {
      return false;
    }
  });

  const handleEnablePushBanner = async () => {
    try {
      const res = await requestPushPermission(currentUser?.id, coupleProfile?.id);
      if (res === 'granted') {
        triggerConfetti();
        triggerHaptic('success');
      }
    } finally {
      setShowPushBanner(false);
    }
  };

  const handleDismissPushBanner = () => {
    try {
      localStorage.setItem('loop_push_prompt_dismissed', 'true');
    } catch {}
    setShowPushBanner(false);
  };

  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayScheduleEvents = useMemo(() => {
    return (scheduleEvents || []).filter((ev) => !ev.deleted && ev.date === todayDateStr);
  }, [scheduleEvents, todayDateStr]);

  const scheduleSummary = useMemo(() => {
    if (todayScheduleEvents.length === 0) {
      return {
        badge: 'Свободно',
        badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
        title: 'Наши планы',
        subtitle: 'Вечер свободен у обоих ✨',
      };
    }

    const n = todayScheduleEvents.length;
    const mod10 = n % 10;
    const mod100 = n % 100;
    let plural = 'событий';
    if (mod100 < 11 || mod100 > 14) {
      if (mod10 === 1) plural = 'событие';
      else if (mod10 >= 2 && mod10 <= 4) plural = 'события';
    }

    const hasEvening = todayScheduleEvents.some((e) => {
      const startMin = e.startTime.split(':').map(Number);
      const endMin = (e.endTime || '').split(':').map(Number);
      return startMin[0] >= 18 || endMin[0] > 18;
    });

    return {
      badge: `${n} ${plural}`,
      badgeClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
      title: 'Наши планы',
      subtitle: hasEvening ? `Сегодня: ${n} ${plural}` : `Сегодня: ${n} ${plural} • Вечер свободен`,
    };
  }, [todayScheduleEvents]);

  const upcomingDate = useMemo(() => {
    return (dateInvites || []).find(
      (d) => !d.completed && !d.review && (d.status === 'CONFIRMED' || d.status === 'PROPOSED' || d.status === 'PENDING')
    );
  }, [dateInvites]);

  const dailyQuestions = [
    'Что сегодня заставило тебя искренне улыбнуться?',
    'Какое наше общее воспоминание согревает тебя больше всего?',
    'Если бы мы могли прямо сейчас оказаться в любой точке мира, куда бы мы поехали?',
    'Какой поступок партнёра за последнюю неделю вызвал у тебя благодарность?',
    'Какая песня лучше всего описывает наше настроение сегодня?',
    'Что нового о себе или обо мне ты понял(а) за последнее время?',
    'О чем приятном ты сегодня мечтал(а) в течение дня?',
    'Какой маленький знак заботы сделал бы твой вечер идеальным?',
    'Какое наше будущее событие ты ждёшь с наибольшим нетерпением?',
  ];
  const dayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const currentDailyQuestion = dailyQuestions[dayOfYear % dailyQuestions.length];

  const handleQuickHug = async (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('success');
    const res = await sendTouchAction('hug', {
      title: `${currentUser?.name || currentPartner?.name} обнял(а) вас ❤️`,
      subtitle: 'Крепкое и тёплое объятие',
    });
    if (!res.throttled) {
      setQuickHugSent(true);
      setTimeout(() => setQuickHugSent(false), 2800);
    }
  };

  const handleSendSpecificTap = async (tapType: string, customNote: string, label: string) => {
    triggerHaptic('success');
    await sendTouchAction(tapType, {
      customNote,
      title: `${currentUser?.name || currentPartner?.name}: ${label}`,
      subtitle: customNote,
    });
  };

  const handleAnswerSubmit = (answer: string) => {
    answerQuestionOfDay(answer);
    addFeedItem({
      author: currentPartnerId,
      type: 'heart',
      title: `${currentPartner?.name} ответил(а) на вопрос дня: «${answer}»`,
      subtitle: 'Вопрос дня',
    });
    triggerConfetti();
  };

  const hasPetCaredToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (xpHistory || []).some(
      (e) => (e.reason?.toLowerCase().includes('питомц') || e.reason?.toLowerCase().includes('кормл') || e.reason?.toLowerCase().includes('покормил')) && e.timestamp?.startsWith(todayStr)
    );
  }, [xpHistory]);

  const hasHugSentToday = quickHugSent || (loveTaps || []).some((t) => t.createdAt?.startsWith(new Date().toISOString().split('T')[0]));
  const hasQuestionAnsweredToday = !!questionAnswer;

  // Partner daily answer check from synced activity
  const partnerDailyAnswer = useMemo(() => {
    const item = (feedItems || []).find(
      (f) =>
        f.author !== currentPartnerId &&
        (f.title.includes('ответил(а) на вопрос') || f.title.includes('вопрос дня'))
    );
    return item ? item.subtitle : null;
  }, [feedItems, currentPartnerId]);

  const handleDailyQuestionReaction = (emoji: string) => {
    addFeedItem({
      author: currentPartnerId,
      type: 'heart',
      title: `${currentPartner?.name} поставил(а) ${emoji} на ответ дня`,
      subtitle: `«${currentDailyQuestion}»`,
    });
    triggerConfetti();
  };

  // 📳 Shake to Hug: встряхивание смартфона отправляет партнёру мгновенное объятие
  useEffect(() => {
    if (!isPaired) return;
    let lastX = 0, lastY = 0, lastZ = 0, lastTime = 0;
    const SHAKE_THRESHOLD = 32;
    let lastShakeTime = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      if (now - lastTime > 120) {
        const diffTime = now - lastTime;
        lastTime = now;
        const delta = Math.abs(acc.x + acc.y + acc.z - lastX - lastY - lastZ);
        const speed = (delta / diffTime) * 10000;

        if (speed > SHAKE_THRESHOLD && now - lastShakeTime > 4000) {
          lastShakeTime = now;
          handleQuickHug();
          dispatchInAppNotification({
            title: '📳 Жест встряхивания сработал!',
            body: `Вы встряхнули телефон и отправили тёплое объятие для ${partnerName} ❤️`,
            icon: 'heart',
          });
        }
        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [isPaired, handleQuickHug, partnerName]);

  return (
    <PageLayout hideHeader>
      <div className="space-y-4 sm:space-y-5 pb-8 sm:pb-12">
        {/* 1. Зона 1: Партнёр и мгновенная связь */}
        <PartnerStatusCard
          isPaired={isPaired}
          partnerName={partnerName}
          safeOtherPartner={safeOtherPartner}
          myPartner={currentPartner}
          streakDaysCount={streakDaysCount}
          partnerStatusInfo={partnerStatusInfo}
          coupleStartDate={coupleProfile?.startDate}
          onOpenDetails={() => setShowPartnerDetailModal(true)}
          onGoToProfile={() => setActiveTab('profile')}
          onSetStartDate={() => setShowStartDateModal(true)}
        />

        {/* Мягкий баннер включения системных push-уведомлений для пары */}
        {isPaired && showPushBanner && (
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-rose-50/90 to-pink-50/90 dark:from-rose-950/30 dark:to-pink-950/20 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 shadow-xs transition-all">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">Включите уведомления</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">Узнавайте, когда партнёр обнимает вас или пишет</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleEnablePushBanner}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500 text-white shadow-xs hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                Включить
              </button>
              <button
                type="button"
                onClick={handleDismissPushBanner}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Главная большая кнопка быстрого касания / объятия партнёра («Киллер-фича Loop») */}
        <HugButtonWithMenu
          partnerName={isPaired ? partnerName : 'половинки'}
          quickHugSent={quickHugSent}
          onSendHug={handleQuickHug}
          onSendSpecificTap={handleSendSpecificTap}
        />

        {/* Интерактивный мини-трекер ритуала пары (3/3 шага) */}
        <DailyHabitTracker
          hasHugSent={hasHugSentToday}
          hasQuestionAnswered={hasQuestionAnsweredToday}
          hasPetCared={hasPetCaredToday}
          streakDays={streakDaysCount}
          onSendHug={handleQuickHug}
          onOpenQuestion={() => {
            const el = document.getElementById('block-daily-question');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.click();
          }}
          onOpenPet={() => {
            const el = document.getElementById('block-living-pet');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />

        {/* 2. Зона 2: Главный ритуал дня (Вопрос дня для двоих) */}
        <DailyQuestionTeaser
          currentDailyQuestion={currentDailyQuestion}
          questionAnswer={questionAnswer}
          partnerAnswer={partnerDailyAnswer}
          partnerName={partnerName}
          onAnswerSubmit={handleAnswerSubmit}
          onSendReaction={handleDailyQuestionReaction}
        />

        {/* 3. Зона 3: Психологическое познание друг друга (Тест недели) */}
        <WeeklyFeaturedTestCard
          tests={tests || []}
          currentPartnerId={currentPartnerId}
          partnerName={partnerName}
          onOpenTest={() => setActiveTab('tests')}
          onOpenAllTests={() => setActiveTab('tests')}
          onOpenPassport={() => {
            setUsSubTab('passport');
            setActiveTab('us');
          }}
        />

        {/* 4. Зона 4: Живой тамагочи союза */}
        <div id="block-living-pet">
          <PetCard isPaired={isPaired} />
        </div>

        {/* 5. Зона 5: Аналитика и инструменты союза */}
        <CompatibilityAndStreak
          hasCompatibilityData={hasCompatibilityData}
          compatibilityPercent={compatibilityPercent}
          compatibilityStatus={compatibilityStatus}
          streakDaysCount={streakDaysCount}
          onOpenPassport={() => {
            setUsSubTab('passport');
            setActiveTab('us');
          }}
          onOpenTests={() => setActiveTab('tests')}
        />

        {/* 6. Зона 6: События пары и планы */}
        <PairEventsFeed
          isPaired={isPaired}
          feedItems={feedItems}
          questionAnswer={questionAnswer}
          scheduleSummary={scheduleSummary}
          upcomingDate={upcomingDate}
          onOpenSchedule={() => setShowScheduleModal(true)}
          onOpenDates={() => {
            setDatesSubTab?.('history');
            setActiveTab('dates');
          }}
        />
      </div>

      {/* Модальные окна */}
      <PartnerDetailModal
        isOpen={showPartnerDetailModal}
        onClose={() => setShowPartnerDetailModal(false)}
        partnerName={partnerName}
        safeOtherPartner={safeOtherPartner}
        partnerStatusInfo={partnerStatusInfo}
        coupleStartDate={coupleProfile?.startDate}
        onSetStartDate={() => setShowStartDateModal(true)}
        onSendSpecificTap={handleSendSpecificTap}
        onOpenChat={() => {
          setShowPartnerDetailModal(false);
          setActiveTab('chat');
        }}
      />

      <SetStartDateModal
        isOpen={showStartDateModal}
        onClose={() => setShowStartDateModal(false)}
        currentStartDate={coupleProfile?.startDate}
        onSave={(newStartDate) => updateCoupleProfile({ startDate: newStartDate })}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onOpenDateWheel={() => {
          setShowScheduleModal(false);
          setDatesSubTab?.('wheel');
          setActiveTab('dates');
        }}
      />
    </PageLayout>
  );
};
