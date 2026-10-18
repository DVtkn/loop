import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  AppTheme,
  AppFont,
  AppScreen,
  UsSubTab,
  DatesSubTab,
  OwlMode,
  NavigationTab,
} from '../types.ts';
import {
  initialCoupleProfile,
  getFreshTests,
  getFreshChallenges,
  createFreshCoupleProfile,
} from '../data/questionBank.ts';
import { safeGetStorage, safeSetStorage } from '../utils/safeStorage.ts';

// Context Types
import type { FeedItem, CoupleContextType } from './types.ts';
export type { FeedItem, CoupleContextType };

// Modular domain sub-hooks
import { useCoupleAuth } from './hooks/useCoupleAuth.ts';
import { useCouplePairing } from './hooks/useCouplePairing.ts';
import { useCoupleXP } from './hooks/useCoupleXP.ts';
import { useCoupleTouches } from './hooks/useCoupleTouches.ts';
import { useCoupleDaily } from './hooks/useCoupleDaily.ts';
import { useCoupleDatesAndSchedule } from './hooks/useCoupleDatesAndSchedule.ts';
import { useCoupleSync } from './hooks/useCoupleSync.ts';
import { useCoupleChat } from './hooks/useCoupleChat.ts';
import { useCoupleAssessments } from './hooks/useCoupleAssessments.ts';
import { useCoupleProfile } from './hooks/useCoupleProfile.ts';
import { playNotificationSound, dispatchInAppNotification } from '../utils/pushManager.ts';

export const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export const CoupleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme & Navigation UI states
  const [theme, setThemeState] = useState<AppTheme>(() => safeGetStorage('together_theme', 'aurora'));
  const [font, setFontState] = useState<AppFont>(() => safeGetStorage('together_font', 'inter'));
  const [screen, setScreenState] = useState<AppScreen>(() => safeGetStorage('together_screen', 'app'));
  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => safeGetStorage('together_active_tab', 'home'));
  const [usSubTab, setUsSubTab] = useState<UsSubTab>('passport');
  const [datesSubTab, setDatesSubTab] = useState<DatesSubTab>('wheel');
  const [owlMode, setOwlModeState] = useState<OwlMode>(() => safeGetStorage('together_owl_mode', 'together'));

  const setOwlMode = useCallback((m: OwlMode) => {
    setOwlModeState(m);
    safeSetStorage('together_owl_mode', m);
  }, []);

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    safeSetStorage('together_active_tab', tab);
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    safeSetStorage('together_theme', t);
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', t);
        document.documentElement.classList.toggle('dark', t === 'night');
      }
    } catch {}
  }, []);

  const setFont = useCallback((f: AppFont) => {
    setFontState(f);
    safeSetStorage('together_font', f);
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-font', f);
        document.body.setAttribute('data-font', f);
      }
    } catch {}
  }, []);

  const setScreen = useCallback((s: AppScreen) => {
    setScreenState(s);
    safeSetStorage('together_screen', s);
  }, []);

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'night');
      }
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-font', font);
        document.body.setAttribute('data-font', font);
      }
    } catch {}
  }, [font]);

  const fetchCoupleDataRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const refreshTestsStatusRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // 1. Gamification XP Hook
  const { coupleXP, setCoupleXP, xpHistory, setXpHistory, coupleLevelInfo, achievements, addCoupleXP, triggerConfetti } =
    useCoupleXP('partner1');

  // 2. Auth Sub-hook
  const {
    accountsDb,
    setAccountsDb,
    currentUser,
    setCurrentUserState,
    setCurrentUser,
    allUsers,
    isOnboarded,
    setIsOnboarded,
    authRegister,
    authLogin,
    authResetPassword,
    authLogout,
    switchAccount,
    updateCoupleStartDate,
    updateUserProfile,
    changePassword,
  } = useCoupleAuth(
    triggerConfetti,
    () => {},
    (safeUser) => {
      setTests(getFreshTests());
      setPulseHistory([]);
      setChallenges(getFreshChallenges());
      setCoupleProfile(
        createFreshCoupleProfile(
          safeUser.name,
          'Партнёр не подключён',
          new Date().toISOString().split('T')[0],
          'Москва',
          safeUser.gender,
          undefined,
          safeUser.login,
          safeUser.partnerLogin || undefined
        )
      );
    },
    () => {
      setTests(getFreshTests());
      setPulseHistory([]);
      setChallenges(getFreshChallenges());
      setCoupleProfile(initialCoupleProfile);
    }
  );

  // 3. Profile & Relationship Sub-hook
  const {
    coupleProfile,
    setCoupleProfile,
    currentPartnerId,
    setCurrentPartnerId,
    partnerStatusDetails,
    isPartnerOnline,
    updateCoupleProfile,
    getDaysTogether,
    getFormattedTimeTogether,
    daysTogether,
    formattedTimeTogether,
    createNewCouple,
    joinCoupleByCode,
    loadDemoCouple,
    resetCoupleData,
    updatePartnerNames,
  } = useCoupleProfile({
    currentUser,
    accountsDb,
    setIsOnboarded,
    triggerConfetti,
    setTests: (t) => setTests(t),
    setChallenges: (c) => setChallenges(c),
    setPulseHistory: (p) => setPulseHistory(p),
    setDateInvites: (d) => setDateInvites(d),
    setWishlist: (w) => setWishlist(w),
    setSmallCravings: (sc) => setSmallCravings(sc),
    setQuestionAnswer: (qa) => setQuestionAnswer(qa),
    setMoodHistory: (m) => setMoodHistory(m),
  });

  // 4. Daily Activities Sub-hook
  const {
    timeCapsules,
    setTimeCapsules,
    addTimeCapsule,
    openTimeCapsule,
    dailyQuiz,
    submitDailyQuizAnswer,
    deepCards,
    questionAnswer,
    setQuestionAnswer,
    answerQuestionOfDay,
    feedItems,
    addFeedItem,
    clearFeed,
  } = useCoupleDaily({
    currentUser,
    coupleProfile,
    currentPartnerId,
    triggerConfetti,
  });

  // 5. Dates & Schedule Sub-hook
  const {
    venues,
    setVenues,
    addVenue,
    deleteVenue,
    selectedCity,
    setSelectedCity,
    dateInvites,
    setDateInvites,
    createDateInvite,
    acceptDateInvite,
    completeAndReviewDate,
    confirmDatePlan,
    scheduleEvents,
    setScheduleEvents,
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    wishlist,
    setWishlist,
    addWishlistItem,
    toggleSecretReserve,
    deleteWishlistItem,
    smallCravings,
    setSmallCravings,
    addSmallCraving,
    toggleCraving,
    flowerPreferences,
    setFlowerPreferences,
    updateFlowerPreferences,
  } = useCoupleDatesAndSchedule({
    currentPartnerId,
    triggerConfetti,
    addCoupleXP,
    addFeedItem,
  });

  // 6. Pairing Sub-hook
  const {
    setPairRequests,
    incomingRequests,
    outgoingRequests,
    sendPairRequestByLogin,
    acceptPairRequest,
    rejectPairRequest,
    disconnectPair,
  } = useCouplePairing({
    currentUser,
    setCurrentUser,
    accountsDb,
    setAccountsDb,
    triggerConfetti,
    addFeedItem,
    fetchCoupleDataRef,
  });

  // 7. Touches Sub-hook
  const {
    activePartnerTouch,
    dismissPartnerTouch,
    handleIncomingTouch,
    sendTouchAction,
    loveTaps,
    sendLoveTap,
    lastHandledTouchIdsRef,
  } = useCoupleTouches({
    currentUser,
    coupleProfile,
    currentPartnerId,
    addFeedItem,
    addCoupleXP,
    triggerConfetti,
    playNotificationSound,
    dispatchInAppNotification,
  });

  // 8. Assessments & Tests Sub-hook
  const {
    tests,
    setTests,
    pulseHistory,
    setPulseHistory,
    challenges,
    setChallenges,
    moodHistory,
    setMoodHistory,
    addPulseCheckin,
    toggleChallenge,
    submitTestAnswers,
    resetTests,
    addMoodStatus,
  } = useCoupleAssessments({
    currentUser,
    currentPartnerId,
    coupleProfile,
    setCoupleProfile,
    updateUserProfile,
    addCoupleXP,
    triggerConfetti,
    refreshTestsStatus: useCallback(async () => {
      await refreshTestsStatusRef.current?.();
    }, []),
  });

  // 9. Chat & AI Messages Sub-hook
  const {
    partnerMessages,
    setPartnerMessages,
    aiMessages,
    isAITyping,
    unreadChatCount,
    setUnreadChatCount,
    clearUnreadChatCount,
    fetchPartnerMessages,
    sendAIMessage,
    sendPartnerMessage,
  } = useCoupleChat({
    currentUser,
    currentPartnerId,
    coupleProfile,
    pulseHistory,
    activeTab,
    getDaysTogether,
    getFormattedTimeTogether,
  });

  // 10. Realtime & Cloud Sync Sub-hook
  const { refreshTestsStatus } = useCoupleSync({
    currentUser,
    setCurrentUserState,
    currentPartnerId,
    coupleProfile,
    setCoupleProfile,
    tests,
    setTests,
    pulseHistory,
    setPulseHistory,
    challenges,
    setChallenges,
    smallCravings,
    setSmallCravings,
    flowerPreferences,
    setFlowerPreferences,
    wishlist,
    setWishlist,
    venues,
    setVenues,
    dateInvites,
    setDateInvites,
    scheduleEvents,
    setScheduleEvents,
    moodHistory,
    setMoodHistory,
    achievements,
    coupleXP,
    setCoupleXP,
    xpHistory,
    setXpHistory,
    timeCapsules,
    setTimeCapsules,
    loveTaps,
    dailyQuiz,
    accountsDb,
    setAccountsDb,
    setPairRequests,
    setPartnerMessages,
    setUnreadChatCount,
    handleIncomingTouch,
    lastHandledTouchIdsRef,
    triggerConfetti,
    fetchCoupleDataRef,
  });

  refreshTestsStatusRef.current = refreshTestsStatus;

  const contextValue: CoupleContextType = useMemo(
    () => ({
      theme,
      setTheme,
      font,
      setFont,
      screen,
      setScreen,
      isOnboarded,
      setIsOnboarded,
      activeTab,
      setActiveTab,
      currentUser,
      accountsDb,
      allUsers,
      authLogin,
      authRegister,
      authResetPassword,
      authLogout,
      switchAccount,
      updateUserProfile,
      updateCoupleStartDate,
      changePassword,
      incomingRequests,
      outgoingRequests,
      sendPairRequestByLogin,
      acceptPairRequest,
      rejectPairRequest,
      disconnectPair,
      createNewCouple,
      joinCoupleByCode,
      loadDemoCouple,
      resetCoupleData,
      updatePartnerNames,
      usSubTab,
      setUsSubTab,
      datesSubTab,
      setDatesSubTab,
      owlMode,
      setOwlMode,
      activePartnerTouch,
      dismissPartnerTouch,
      sendTouchAction,
      loveTaps,
      sendLoveTap,
      timeCapsules,
      addTimeCapsule,
      openTimeCapsule,
      dailyQuiz,
      submitDailyQuizAnswer,
      deepCards,
      questionAnswer,
      answerQuestionOfDay,
      feedItems,
      addFeedItem,
      clearFeed,
      currentPartnerId,
      setCurrentPartnerId,
      coupleProfile,
      updateCoupleProfile,
      pulseHistory,
      addPulseCheckin,
      challenges,
      toggleChallenge,
      tests,
      refreshTestsStatus,
      submitTestAnswers,
      resetTests,
      smallCravings,
      addCraving: addSmallCraving,
      toggleCraving,
      flowerPreferences,
      updateFlowerPreferences,
      wishlist,
      addWishlistItem,
      toggleSecretReserve,
      deleteWishlistItem,
      venues,
      addVenue,
      deleteVenue,
      selectedCity,
      setSelectedCity,
      dateInvites,
      createDateInvite,
      acceptDateInvite,
      completeAndReviewDate,
      confirmDatePlan,
      scheduleEvents,
      addScheduleEvent,
      updateScheduleEvent,
      deleteScheduleEvent,
      coupleXP,
      xpHistory,
      addCoupleXP,
      coupleLevelInfo,
      moodHistory,
      addMoodStatus,
      aiMessages,
      sendAIMessage,
      partnerMessages,
      sendPartnerMessage,
      fetchPartnerMessages,
      isAITyping,
      unreadChatCount,
      clearUnreadChatCount,
      achievements,
      triggerConfetti,
      daysTogether,
      formattedTimeTogether,
      isPartnerOnline,
      partnerStatusDetails,
    }),
    [
      theme,
      setTheme,
      font,
      setFont,
      screen,
      setScreen,
      isOnboarded,
      setIsOnboarded,
      activeTab,
      setActiveTab,
      currentUser,
      accountsDb,
      allUsers,
      authLogin,
      authRegister,
      authResetPassword,
      authLogout,
      switchAccount,
      updateUserProfile,
      updateCoupleStartDate,
      changePassword,
      incomingRequests,
      outgoingRequests,
      sendPairRequestByLogin,
      acceptPairRequest,
      rejectPairRequest,
      disconnectPair,
      createNewCouple,
      joinCoupleByCode,
      loadDemoCouple,
      resetCoupleData,
      updatePartnerNames,
      usSubTab,
      setUsSubTab,
      datesSubTab,
      setDatesSubTab,
      owlMode,
      setOwlMode,
      activePartnerTouch,
      dismissPartnerTouch,
      sendTouchAction,
      loveTaps,
      sendLoveTap,
      timeCapsules,
      addTimeCapsule,
      openTimeCapsule,
      dailyQuiz,
      submitDailyQuizAnswer,
      deepCards,
      questionAnswer,
      answerQuestionOfDay,
      feedItems,
      addFeedItem,
      clearFeed,
      currentPartnerId,
      setCurrentPartnerId,
      coupleProfile,
      updateCoupleProfile,
      pulseHistory,
      addPulseCheckin,
      challenges,
      toggleChallenge,
      tests,
      refreshTestsStatus,
      submitTestAnswers,
      resetTests,
      smallCravings,
      addSmallCraving,
      toggleCraving,
      flowerPreferences,
      updateFlowerPreferences,
      wishlist,
      addWishlistItem,
      toggleSecretReserve,
      deleteWishlistItem,
      venues,
      addVenue,
      deleteVenue,
      selectedCity,
      setSelectedCity,
      dateInvites,
      createDateInvite,
      acceptDateInvite,
      completeAndReviewDate,
      confirmDatePlan,
      scheduleEvents,
      addScheduleEvent,
      updateScheduleEvent,
      deleteScheduleEvent,
      coupleXP,
      xpHistory,
      addCoupleXP,
      coupleLevelInfo,
      moodHistory,
      addMoodStatus,
      aiMessages,
      sendAIMessage,
      partnerMessages,
      sendPartnerMessage,
      fetchPartnerMessages,
      isAITyping,
      unreadChatCount,
      clearUnreadChatCount,
      achievements,
      triggerConfetti,
      daysTogether,
      formattedTimeTogether,
      isPartnerOnline,
      partnerStatusDetails,
    ]
  );

  return (
    <CoupleContext.Provider value={contextValue}>
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = (): CoupleContextType => {
  const context = useContext(CoupleContext);
  if (!context) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
};
