import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { apiFetch } from '../utils/api.ts';
import {
  PartnerId,
  CoupleProfile,
  PulseEntry,
  Challenge,
  TestCategory,
  SmallCraving,
  FlowerPreference,
  WishlistItem,
  Venue,
  DateInvite,
  XPEntry,
  MoodHistoryItem,
  AIMessage,
  Achievement,
  AppTheme,
  AppFont,
  AppScreen,
  UsSubTab,
  DatesSubTab,
  OwlMode,
  UserAccount,
  PairRequest,
  NavigationTab,
  LoveTap,
  TimeCapsule,
  DailyCoupleQuiz,
  DeepTalkCard,
  ChatMessage,
  TouchNotificationData,
  ScheduleEvent,
} from '../types.ts';
import {
  initialCoupleProfile,
  initialPulseHistory,
  initialChallenges,
  initialTests,
  initialMoodHistory,
  createFreshCoupleProfile,
  getFreshTests,
  getFreshChallenges,
} from '../data/questionBank.ts';
import { safeGetStorage, safeSetStorage } from '../utils/safeStorage.ts';
import { getCoupleLevelInfo } from '../utils/rankingEngine.ts';
import { dispatchInAppNotification, playNotificationSound } from '../utils/pushManager.ts';
import { getPartnerStatusDetails } from '../components/dashboard/PartnerStatusCard.tsx';

// Modular sub-hooks
import { useCoupleAuth } from './hooks/useCoupleAuth.ts';
import { useCouplePairing } from './hooks/useCouplePairing.ts';
import { useCoupleXP } from './hooks/useCoupleXP.ts';
import { useCoupleTouches } from './hooks/useCoupleTouches.ts';
import { useCoupleDaily } from './hooks/useCoupleDaily.ts';
import { useCoupleDatesAndSchedule } from './hooks/useCoupleDatesAndSchedule.ts';
import { useCoupleSync } from './hooks/useCoupleSync.ts';

export interface FeedItem {
  id: string;
  author: PartnerId | 'system';
  type: 'sparkle' | 'heart' | 'pin' | 'flame' | 'test' | 'photo';
  title: string;
  subtitle: string;
  timeAgo: string;
  icon?: string;
  imageUrl?: string;
}

export interface CoupleContextType {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  font: AppFont;
  setFont: (f: AppFont) => void;
  screen: AppScreen;
  setScreen: (s: AppScreen) => void;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  // Auth & Account
  currentUser: UserAccount | null;
  accountsDb: Record<string, UserAccount & { password?: string }>;
  allUsers: UserAccount[];
  authLogin: (login: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  authRegister: (
    login: string,
    pass: string,
    name?: string,
    gender?: 'male' | 'female',
    avatarEmoji?: string
  ) => Promise<{ success: boolean; error?: string }>;
  authResetPassword: (login: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  authLogout: () => void;
  switchAccount: (login: string) => void;
  updateUserProfile: (fields: Partial<UserAccount>) => Promise<void>;
  updateCoupleStartDate: (date: string) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  // Pairing by Login
  incomingRequests: PairRequest[];
  outgoingRequests: PairRequest[];
  sendPairRequestByLogin: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  acceptPairRequest: (partnerLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  rejectPairRequest: (partnerLogin: string) => Promise<void>;
  disconnectPair: () => Promise<void>;
  // Direct helpers
  createNewCouple: (partner1Name: string, partner2Name: string, startDate?: string) => void;
  joinCoupleByCode: (linkCode: string, myName: string) => void;
  loadDemoCouple: () => void;
  resetCoupleData: () => void;
  updatePartnerNames: (p1Name: string, p2Name: string, startDate: string) => void;
  // Tab Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  usSubTab: UsSubTab;
  setUsSubTab: (t: UsSubTab) => void;
  datesSubTab: DatesSubTab;
  setDatesSubTab: (t: DatesSubTab) => void;
  owlMode: OwlMode;
  setOwlMode: (m: OwlMode) => void;
  // Gamification & Features
  activePartnerTouch: TouchNotificationData | null;
  dismissPartnerTouch: () => void;
  sendTouchAction: (
    actionType: string,
    options?: {
      customNote?: string;
      title?: string;
      subtitle?: string;
      icon?: string;
      iconBg?: string;
      iconColor?: string;
    }
  ) => Promise<{ success: boolean; throttled?: boolean; message?: string }>;
  loveTaps: LoveTap[];
  sendLoveTap: (tapType: LoveTap['tapType'], customNote?: string) => void;
  timeCapsules: TimeCapsule[];
  addTimeCapsule: (title: string, content: string, unlockDate: string, category: TimeCapsule['category']) => void;
  openTimeCapsule: (id: string) => void;
  dailyQuiz: DailyCoupleQuiz;
  submitDailyQuizAnswer: (choice: 'me' | 'partner' | 'both') => void;
  deepCards: DeepTalkCard[];
  questionAnswer: string | null;
  answerQuestionOfDay: (ans: string) => void;
  feedItems: FeedItem[];
  addFeedItem: (item: Omit<FeedItem, 'id' | 'timeAgo'>) => void;
  clearFeed: () => void;
  currentPartnerId: PartnerId;
  setCurrentPartnerId: (id: PartnerId) => void;
  coupleProfile: CoupleProfile;
  updateCoupleProfile: (updates: Partial<CoupleProfile>) => void;
  pulseHistory: PulseEntry[];
  addPulseCheckin: (closeness: number, constructiveness: number, comment: string) => void;
  challenges: Challenge[];
  toggleChallenge: (id: string) => void;
  tests: TestCategory[];
  refreshTestsStatus: () => Promise<void>;
  submitTestAnswers: (
    testId: string,
    answers: Record<string, any>,
    metrics?: Record<string, { reactionTimeMs?: number; toggleCount?: number; targetType?: string; rawPayload?: any }>
  ) => void;
  resetTests: () => void;
  smallCravings: SmallCraving[];
  addCraving: (title: string, category: SmallCraving['category']) => void;
  toggleCraving: (id: string) => void;
  flowerPreferences: Record<string, FlowerPreference>;
  updateFlowerPreferences: (partnerId: PartnerId, prefs: Partial<FlowerPreference>) => void;
  wishlist: WishlistItem[];
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'addedBy' | 'isSecretReserved'>) => void;
  toggleSecretReserve: (id: string) => void;
  deleteWishlistItem: (id: string) => void;
  venues: Venue[];
  addVenue: (venue: Omit<Venue, 'id' | 'createdAt' | 'addedBy'>) => void;
  deleteVenue: (id: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  dateInvites: DateInvite[];
  createDateInvite: (
    note: string,
    venueId?: string,
    locationName?: string,
    chosenDate?: string,
    chosenTime?: string
  ) => void;
  acceptDateInvite: (
    inviteId: string,
    date: string,
    time: string,
    location: string,
    link?: string,
    saveToVenues?: boolean
  ) => void;
  completeAndReviewDate: (inviteId: string, rating: number, impressions: string, photos: string[]) => void;
  confirmDatePlan: (inviteId: string, location: string, dateStr: string) => void;
  scheduleEvents: ScheduleEvent[];
  addScheduleEvent: (event: Omit<ScheduleEvent, 'id' | 'createdAt'>) => Promise<void>;
  updateScheduleEvent: (id: string, updates: Partial<ScheduleEvent>) => Promise<void>;
  deleteScheduleEvent: (id: string) => Promise<void>;
  coupleXP: number;
  xpHistory: XPEntry[];
  addCoupleXP: (points: number, reason: string, category?: XPEntry['category']) => void;
  coupleLevelInfo: ReturnType<typeof getCoupleLevelInfo>;
  moodHistory: MoodHistoryItem[];
  addMoodStatus: (emoji: string, label: string, severity: number, note?: string) => void;
  aiMessages: AIMessage[];
  sendAIMessage: (text: string) => Promise<void>;
  partnerMessages: ChatMessage[];
  sendPartnerMessage: (text: string, isAi?: boolean) => Promise<void>;
  fetchPartnerMessages: () => Promise<void>;
  isAITyping: boolean;
  unreadChatCount: number;
  clearUnreadChatCount: () => void;
  achievements: Achievement[];
  triggerConfetti: () => void;
  daysTogether: number;
  formattedTimeTogether: string;
  isPartnerOnline: boolean;
  partnerStatusDetails: {
    isOnline: boolean;
    statusText: string;
    badgeText: string;
  };
}

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
    } catch {
      // safe
    }
  }, []);

  const setFont = useCallback((f: AppFont) => {
    setFontState(f);
    safeSetStorage('together_font', f);
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-font', f);
        document.body.setAttribute('data-font', f);
      }
    } catch {
      // safe
    }
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
    } catch {
      // safe
    }
  }, [theme]);

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-font', font);
        document.body.setAttribute('data-font', font);
      }
    } catch {
      // safe
    }
  }, [font]);

  // Couple core profile
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(() => {
    return safeGetStorage('together_couple_profile', initialCoupleProfile);
  });

  // Storage key helper for per-user isolation
  const getUserTestsStorageKey = useCallback((login?: string | null) => {
    if (!login) return 'together_tests_guest';
    return `together_tests_${login.toLowerCase().trim().replace(/^@/, '')}`;
  }, []);

  // Tests, Challenges, Pulse, Mood
  const [tests, setTests] = useState<TestCategory[]>(() => {
    const savedUser = safeGetStorage<UserAccount | null>('together_current_user', null);
    const userLogin = savedUser?.login ? savedUser.login.toLowerCase().trim().replace(/^@/, '') : null;
    const key = userLogin ? `together_tests_${userLogin}` : 'together_tests_guest';
    const data = safeGetStorage<TestCategory[]>(key, []);
    return Array.isArray(data) && data.length > 0 ? data : getFreshTests();
  });

  const [pulseHistory, setPulseHistory] = useState<PulseEntry[]>(() => {
    const data = safeGetStorage<PulseEntry[]>('together_pulse_history', []);
    return Array.isArray(data) ? data.filter((p) => !['p-1', 'p-2', 'p-3', 'p-4'].includes(p.id)) : [];
  });

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const data = safeGetStorage<Challenge[]>('together_challenges', initialChallenges);
    return Array.isArray(data) ? data : initialChallenges;
  });

  const [moodHistory, setMoodHistory] = useState<MoodHistoryItem[]>(() => {
    const data = safeGetStorage<MoodHistoryItem[]>('together_mood_history', []);
    return Array.isArray(data)
      ? data.filter(
          (m) =>
            !['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-7', 'm-8', 'm-9', 'm-10', 'm-11', 'm-12', 'm-13', 'm-14'].includes(
              m.id
            )
        )
      : [];
  });

  // Chat & AI Messages
  const [partnerMessages, setPartnerMessages] = useState<ChatMessage[]>(() => {
    return safeGetStorage<ChatMessage[]>('together_partner_messages', []);
  });
  const [aiMessages, setAIMessages] = useState<AIMessage[]>(() => {
    const fallbackMessages: AIMessage[] = [
      {
        id: 'ai-init-1',
        role: 'model',
        content: `Здравствуйте! Я Сова — ваш персональный ИИ-психолог Loop.\n\nЯ помогу вам бережно разбирать любые ситуации, находить гармонию, понимать стили привязанности и языки любви в вашей паре.\n\nО чём вы хотели бы поговорить сегодня?`,
        timestamp: new Date().toISOString(),
      },
    ];
    return safeGetStorage('together_ai_messages', fallbackMessages);
  });
  const [isAITyping, setIsAITyping] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(() => safeGetStorage('together_unread_chat', 0));

  const clearUnreadChatCount = useCallback(() => {
    setUnreadChatCount(0);
    safeSetStorage('together_unread_chat', 0);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' || activeTab === 'owl') {
      setUnreadChatCount(0);
      safeSetStorage('together_unread_chat', 0);
    }
  }, [activeTab]);

  const fetchCoupleDataRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Gamification: XP Sub-hook
  const { coupleXP, setCoupleXP, xpHistory, setXpHistory, coupleLevelInfo, achievements, setAchievements, addCoupleXP, triggerConfetti } =
    useCoupleXP('partner1');

  // Sub-hook: Auth
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
    () => {}, // setPairRequests placeholder, populated below
    (safeUser) => {
      setTests(getFreshTests());
      setPulseHistory([]);
      setChallenges(getFreshChallenges());
      setAIMessages([
        {
          id: 'ai-init-new',
          role: 'model',
          content: `Приветствую вас, ${safeUser.name}! Я Сова — ваш персональный ИИ-психолог в Loop.\n\nЯ помогу вам понимать эмоции, проходить тесты на привязанность и находить гармонию в отношениях. О чём вы хотели бы поговорить сегодня?`,
          timestamp: new Date().toISOString(),
        },
      ]);
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
      // onLogout: Reset all cached session state
      setTests(getFreshTests());
      setPulseHistory([]);
      setChallenges(getFreshChallenges());
      setPartnerMessages([]);
      setCoupleProfile(initialCoupleProfile);
    }
  );

  const fetchPartnerMessages = useCallback(async () => {
    if (!currentUser) return;
    const cleanMyLogin = currentUser.login.toLowerCase().trim().replace(/^@/, '');
    const cleanPartnerLogin = currentUser.partnerLogin
      ? currentUser.partnerLogin.toLowerCase().trim().replace(/^@/, '')
      : null;
    const coupleId = cleanPartnerLogin ? [cleanMyLogin, cleanPartnerLogin].sort().join('_') : cleanMyLogin;

    try {
      const msgsRes = await apiFetch(`/api/chat/messages?mode=together&coupleId=${encodeURIComponent(coupleId)}`);
      if (msgsRes.ok) {
        const msgsData = await msgsRes.json();
        if (Array.isArray(msgsData.messages)) {
          setPartnerMessages(msgsData.messages);
          safeSetStorage('together_partner_messages', msgsData.messages);
        }
      }
    } catch {
      // safe fallback
    }
  }, [currentUser]);

  // Determine current partner ID dynamically
  const currentPartnerId = useMemo<PartnerId>(() => {
    if (!currentUser || !coupleProfile) return 'partner1';
    const p2Login = coupleProfile.partner2?.login?.toLowerCase().replace(/^@/, '');
    const myLogin = currentUser.login?.toLowerCase().replace(/^@/, '');
    if (p2Login && myLogin === p2Login) return 'partner2';
    return 'partner1';
  }, [currentUser, coupleProfile]);

  const otherPartner = useMemo(() => {
    return currentPartnerId === 'partner1' ? coupleProfile?.partner2 : coupleProfile?.partner1;
  }, [currentPartnerId, coupleProfile]);

  const partnerStatusDetails = useMemo(() => {
    const isPaired = !!currentUser?.partnerLogin;
    const safeOther = otherPartner || {
      id: currentPartnerId === 'partner1' ? 'partner2' : 'partner1',
      name: isPaired ? (currentUser?.partnerLogin || 'Партнёр') : 'Партнёр не подключён',
      avatar: 'heart',
      login: currentUser?.partnerLogin || '',
      gender: 'unknown' as any,
      lastActiveAt: new Date().toISOString(),
    };
    const partnerName =
      safeOther.name && safeOther.name !== 'Партнёр не подключён' && safeOther.name !== 'Партнёр 1' && safeOther.name !== 'Партнёр 2'
        ? safeOther.name
        : currentUser?.partnerLogin || safeOther.login || (isPaired ? 'Партнёр' : 'Партнёр не подключён');

    return getPartnerStatusDetails({
      name: partnerName,
      lastActiveAt: safeOther.lastActiveAt,
      gender: safeOther.gender,
      login: safeOther.login,
    });
  }, [otherPartner, currentPartnerId, currentUser]);

  const isPartnerOnline = partnerStatusDetails.isOnline;

  const setCurrentPartnerId = useCallback((_id: PartnerId) => {
    // No-op in real backend mode
  }, []);

  // Sub-hook: Daily Activities
  const {
    timeCapsules,
    setTimeCapsules,
    addTimeCapsule,
    openTimeCapsule,
    dailyQuiz,
    setDailyQuiz,
    submitDailyQuizAnswer,
    deepCards,
    questionAnswer,
    setQuestionAnswer,
    answerQuestionOfDay,
    feedItems,
    setFeedItems,
    addFeedItem,
    clearFeed,
  } = useCoupleDaily({
    currentUser,
    coupleProfile,
    currentPartnerId,
    triggerConfetti,
  });

  // Sub-hook: Dates & Schedule
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

  // Sub-hook: Pairing
  const {
    pairRequests,
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

  // Sub-hook: Touches
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

  // Synchronization with currentUser in accountsDb
  useEffect(() => {
    if (!currentUser) return;
    const cleanLogin = currentUser.login.toLowerCase();
    const userInDb = accountsDb[cleanLogin];
    if (!userInDb) return;

    const partnerLogin = userInDb.partnerLogin || currentUser.partnerLogin;
    const partnerInDb = partnerLogin ? accountsDb[partnerLogin.toLowerCase()] : null;

    setCoupleProfile((prev) => ({
      ...prev,
      status: partnerLogin ? 'ACTIVE' : 'PENDING',
      startDate: userInDb.startDate || currentUser.startDate || prev.startDate,
      city: userInDb.city || currentUser.city || prev.city,
      partner1: {
        ...prev.partner1,
        id: 'partner1',
        name: userInDb.name || currentUser.name,
        login: userInDb.login || currentUser.login,
        gender: userInDb.gender || currentUser.gender,
        avatar: userInDb.avatarEmoji || currentUser.avatarEmoji || 'sparkles',
        loveLanguage: userInDb.loveLanguage || currentUser.loveLanguage || 'Пройдите тест',
        attachmentStyle: userInDb.attachmentStyle || currentUser.attachmentStyle || 'Пройдите тест',
        currentMood: userInDb.currentMood || currentUser.currentMood || prev.partner1.currentMood,
        lastActiveAt: userInDb.lastActiveAt || currentUser.lastActiveAt,
      },
      partner2: partnerInDb
        ? {
            ...prev.partner2,
            id: 'partner2',
            name: partnerInDb.name,
            login: partnerInDb.login,
            gender: partnerInDb.gender,
            avatar: partnerInDb.avatarEmoji,
            loveLanguage: partnerInDb.loveLanguage || 'Пройдите тест',
            attachmentStyle: partnerInDb.attachmentStyle || 'Пройдите тест',
            currentMood: partnerInDb.currentMood || prev.partner2.currentMood,
            lastActiveAt: partnerInDb.lastActiveAt,
          }
        : partnerLogin
        ? {
            ...prev.partner2,
            id: 'partner2',
            name: partnerLogin,
            login: partnerLogin,
            gender: undefined,
            avatar: 'sparkles',
            loveLanguage: 'Пройдите тест',
            attachmentStyle: 'Пройдите тест',
          }
        : {
            ...prev.partner2,
            id: 'partner2',
            name: 'Партнёр не подключён',
            login: '',
            avatar: 'user',
            loveLanguage: 'Ожидание',
            attachmentStyle: 'Ожидание',
          },
    }));
  }, [currentUser, accountsDb]);

  // Sub-hook: Full Cloud & Realtime Synchronization (SSE, Heartbeat, Polling, Debounced Sync)
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

  // Load user-isolated tests on user change
  useEffect(() => {
    if (currentUser?.login) {
      const key = getUserTestsStorageKey(currentUser.login);
      const userTests = safeGetStorage<TestCategory[]>(key, []);
      if (Array.isArray(userTests) && userTests.length > 0) {
        setTests(userTests);
      } else {
        setTests(getFreshTests());
      }
      refreshTestsStatus();
    } else {
      setTests(getFreshTests());
    }
  }, [currentUser?.login, refreshTestsStatus, getUserTestsStorageKey]);

  // Local storage effects
  useEffect(() => {
    safeSetStorage('together_couple_profile', coupleProfile);
  }, [coupleProfile]);
  useEffect(() => {
    safeSetStorage('together_pulse_history', pulseHistory);
  }, [pulseHistory]);
  useEffect(() => {
    safeSetStorage('together_challenges', challenges);
  }, [challenges]);
  useEffect(() => {
    const key = getUserTestsStorageKey(currentUser?.login);
    safeSetStorage(key, tests);
  }, [tests, currentUser?.login, getUserTestsStorageKey]);
  useEffect(() => {
    safeSetStorage('together_mood_history', moodHistory);
  }, [moodHistory]);
  useEffect(() => {
    safeSetStorage('together_ai_messages', aiMessages);
  }, [aiMessages]);

  const updateCoupleProfile = useCallback((updates: Partial<CoupleProfile>) => {
    setCoupleProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const addPulseCheckin = useCallback(
    (closeness: number, constructiveness: number, comment: string) => {
      const newEntry: PulseEntry = {
        id: `p-${Date.now()}`,
        week: 34,
        year: 2026,
        date: new Date().toISOString().split('T')[0],
        closeness,
        constructiveness,
        comment,
        author: currentPartnerId,
      };
      setPulseHistory((prev) => [newEntry, ...prev]);
      triggerConfetti();
    },
    [currentPartnerId, triggerConfetti]
  );

  const toggleChallenge = useCallback(
    (id: string) => {
      setChallenges((prev) =>
        prev.map((ch) => {
          if (ch.id !== id) return ch;
          const p1Done = currentPartnerId === 'partner1' ? !ch.partner1Completed : ch.partner1Completed;
          const p2Done = currentPartnerId === 'partner2' ? !ch.partner2Completed : ch.partner2Completed;
          const bothDone = p1Done && p2Done;
          if (bothDone && (!ch.partner1Completed || !ch.partner2Completed)) {
            addCoupleXP(60, `Выполнено испытание: ${ch.title}`, 'challenge');
            triggerConfetti();
          }
          return {
            ...ch,
            partner1Completed: p1Done,
            partner2Completed: p2Done,
            completedAt: bothDone ? new Date().toISOString() : undefined,
          };
        })
      );
    },
    [currentPartnerId, addCoupleXP, triggerConfetti]
  );

  const submitTestAnswers = useCallback(
    (
      testId: string,
      answers: Record<string, any>,
      metrics?: Record<string, { reactionTimeMs?: number; toggleCount?: number; targetType?: string; rawPayload?: any }>
    ) => {
      let testTitle = 'Тест совместимости';
      setTests((prev) =>
        prev.map((t) => {
          if (t.id !== testId) return t;
          testTitle = t.title;
          const isP1 = currentPartnerId === 'partner1';
          const p1Done = isP1 ? true : t.partner1Done;
          const p2Done = isP1 ? t.partner2Done : true;
          return {
            ...t,
            isCompletedByMe: true,
            partner1Done: p1Done,
            partner2Done: p2Done,
            partner1Answers: isP1 ? answers : t.partner1Answers,
            partner2Answers: isP1 ? t.partner2Answers : answers,
            completedAt: new Date().toISOString(),
          };
        })
      );

      // Async atomic sync to server API (single /submit call with full payloads)
      if (currentUser?.login) {
        const test = tests.find((t) => t.id === testId);
        const payloadAnswers = Object.entries(answers).map(([qId, val]) => {
          const meta = metrics?.[qId] || {};
          const q = test?.questions?.find((qq: any) => qq.id === qId);
          const opt = q?.options?.find((o: any) => o.value === val);
          const rawPayload =
            meta.rawPayload ?? (typeof val === 'object' && val !== null ? val : null);
          return {
            questionId: qId,
            value: typeof val === 'object' && val !== null ? '1' : String(val),
            scaleId: q?.tradeOffItems ? null : (opt?.scaleId ?? null),
            reactionTimeMs: meta.reactionTimeMs ?? null,
            toggleCount: meta.toggleCount ?? 0,
            targetType: meta.targetType ?? 'self',
            rawPayload,
          };
        });

        apiFetch('/api/tests/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId, answers: payloadAnswers }),
        })
          .then((r) => {
            if (!r.ok) throw new Error(`submit failed: HTTP ${r.status}`);
            return r.json();
          })
          .catch((err) => console.error('[tests] submit error:', err))
          .finally(() => {
            setTimeout(() => {
              refreshTestsStatus();
            }, 300);
          });
      }

      addCoupleXP(100, `Пройден тест «${testTitle}»`, 'test');

      setCoupleProfile((prev) => {
        const completedCount = prev.testsCompletedCount + 1;
        let newLevel = prev.level;
        let newLevelName = prev.levelName;
        if (completedCount >= 8) {
          newLevel = 4;
          newLevelName = 'Мастерство';
        } else if (completedCount >= 5) {
          newLevel = 3;
          newLevelName = 'Глубина';
        } else if (completedCount >= 3) {
          newLevel = 2;
          newLevelName = 'Понимание';
        }
        return {
          ...prev,
          testsCompletedCount: completedCount,
          level: newLevel,
          levelName: newLevelName,
        };
      });

      triggerConfetti();
    },
    [currentPartnerId, currentUser, addCoupleXP, triggerConfetti, refreshTestsStatus]
  );

  const resetTests = useCallback(() => {
    const fresh = getFreshTests();
    setTests(fresh);
    const key = getUserTestsStorageKey(currentUser?.login);
    safeSetStorage(key, fresh);
    setCoupleProfile((prev) => {
      const updated = {
        ...prev,
        testsCompletedCount: 0,
        partner1: {
          ...prev.partner1,
          loveLanguage: 'Пройдите тест',
          attachmentStyle: 'Пройдите тест',
        },
        partner2: {
          ...prev.partner2,
          loveLanguage: 'Пройдите тест',
          attachmentStyle: 'Пройдите тест',
        },
      };
      safeSetStorage('together_couple_profile', updated);
      return updated;
    });
  }, [currentUser?.login, getUserTestsStorageKey]);

  const addMoodStatus = useCallback(
    (emoji: string, label: string, severity: number, note?: string) => {
      const cleanNote = (note || '').trim();
      const newMood = {
        emoji,
        label,
        note: cleanNote,
        updatedAt: new Date().toISOString(),
      };

      if (currentUser) {
        updateUserProfile({
          currentMood: newMood,
          lastActiveAt: new Date().toISOString(),
        });
      }

      setCoupleProfile((prev) => {
        const isP1 = currentPartnerId === 'partner1';
        return {
          ...prev,
          partner1: isP1 ? { ...prev.partner1, currentMood: newMood } : prev.partner1,
          partner2: !isP1 ? { ...prev.partner2, currentMood: newMood } : prev.partner2,
        };
      });

      const newMoodEntry: MoodHistoryItem = {
        id: `m-${Date.now()}`,
        partnerId: currentPartnerId,
        date: new Date().toISOString(),
        emoji,
        label,
        score: severity,
        note: cleanNote,
      };
      setMoodHistory((prev) => {
        const updated = [newMoodEntry, ...prev.slice(0, 49)];
        safeSetStorage('together_mood_history', updated);
        return updated;
      });

      addCoupleXP(15, `Отметка настроения: ${label}`, 'mood');
    },
    [currentPartnerId, currentUser, updateUserProfile, addCoupleXP]
  );

  const sendAIMessage = async (text: string) => {
    if (!text.trim()) return;

    const currentPartner = currentPartnerId === 'partner1' ? coupleProfile.partner1 : coupleProfile.partner2;
    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      authorName: currentPartner.name,
    };

    const newHistory = [...aiMessages, userMsg];
    setAIMessages(newHistory);
    setIsAITyping(true);

    try {
      const payload = {
        messages: newHistory.slice(-15).map((m) => ({ role: m.role, content: m.content })),
        coupleContext: {
          daysTogether: getDaysTogether(),
          formattedTimeTogether: getFormattedTimeTogether(),
          compatibilityScore: 89,
          user1: coupleProfile.partner1,
          user2: coupleProfile.partner2,
          pulse: pulseHistory[0] || { closeness: 9, constructiveness: 8 },
        },
        currentPartner,
        userLogin: currentUser?.login,
      };

      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ИИ временно недоступен');
      }

      const aiReply: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      setAIMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('[OpenRouter Gemma Error]:', err);
      const fallbackReply: AIMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'model',
        content: err.message || 'ИИ временно недоступен. Попробуйте позже.',
        timestamp: new Date().toISOString(),
      };
      setAIMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsAITyping(false);
    }
  };

  const sendPartnerMessage = async (text: string, isAi: boolean = false) => {
    if (!currentUser) return;
    const cleanMyLogin = currentUser.login.toLowerCase().replace(/^@/, '');
    const partnerLogin = currentUser.partnerLogin;
    const cleanPartnerLogin = partnerLogin ? partnerLogin.toLowerCase().replace(/^@/, '') : '';
    const targetCoupleId = cleanPartnerLogin
      ? [cleanMyLogin, cleanPartnerLogin].sort().join('_')
      : cleanMyLogin;

    const tempId = crypto.randomUUID();
    const msg: ChatMessage = {
      id: tempId,
      coupleId: targetCoupleId,
      senderLogin: isAi ? 'ai' : currentUser.login,
      role: isAi ? 'ai' : currentPartnerId === 'partner1' ? 'partner1' : 'partner2',
      content: text,
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    setPartnerMessages((prev) => {
      const next = [...prev, msg];
      safeSetStorage('together_partner_messages', next);
      return next;
    });

    try {
      const res = await apiFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: targetCoupleId,
          senderLogin: isAi ? 'ai' : cleanMyLogin,
          role: isAi ? 'ai' : currentPartnerId === 'partner1' ? 'partner1' : 'partner2',
          content: text,
          mode: 'together',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.message) {
          setPartnerMessages((prev) => {
            const next = prev.map((m) => (m.id === tempId ? data.message : m));
            safeSetStorage('together_partner_messages', next);
            return next;
          });
        }
      }

      if (!isAi && text.toLowerCase().includes('сов')) {
        setTimeout(() => {
          sendPartnerMessage('Я здесь! Слышу вас. Как я могу помочь?', true);
        }, 1200);
      }
    } catch (err) {
      console.error('Ошибка отправки сообщения партнёру', err);
    }
  };

  const getDaysTogether = useCallback(() => {
    try {
      const start = new Date(coupleProfile.startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 482;
    }
  }, [coupleProfile.startDate]);

  const getFormattedTimeTogether = useCallback(() => {
    try {
      const start = new Date(coupleProfile.startDate);
      const now = new Date();
      if (now < start) return '0 дней';

      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      let days = now.getDate() - start.getDate();

      if (days < 0) {
        months -= 1;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const pluralize = (n: number, forms: [string, string, string]) => {
        const m10 = n % 10;
        const m100 = n % 100;
        if (m10 === 1 && m100 !== 11) return forms[0];
        if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
        return forms[2];
      };

      const parts = [];
      if (years > 0) parts.push(years + ' ' + pluralize(years, ['год', 'года', 'лет']));
      if (months > 0) parts.push(months + ' ' + pluralize(months, ['месяц', 'месяца', 'месяцев']));
      if (days > 0 || parts.length === 0) parts.push(days + ' ' + pluralize(days, ['день', 'дня', 'дней']));

      return parts.join(' ');
    } catch {
      return getDaysTogether() + ' дней';
    }
  }, [coupleProfile.startDate, getDaysTogether]);

  const daysTogether = useMemo(() => getDaysTogether(), [getDaysTogether]);
  const formattedTimeTogether = useMemo(() => getFormattedTimeTogether(), [getFormattedTimeTogether]);

  // Legacy direct helpers
  const createNewCouple = useCallback(
    (partner1Name: string, partner2Name: string, startDate?: string) => {
      const p1 = partner1Name.trim() || 'Партнёр 1';
      const p2 = partner2Name.trim() || 'Партнёр 2';
      const date = startDate || new Date().toISOString().split('T')[0];

      const freshProfile = createFreshCoupleProfile(p1, p2, date);
      setCoupleProfile(freshProfile);
      safeSetStorage('together_couple_profile', freshProfile);

      setTests(getFreshTests());
      setChallenges(getFreshChallenges());
      setPulseHistory([]);
      setDateInvites([]);
      setWishlist([]);
      setSmallCravings([]);
      setQuestionAnswer(null);

      setIsOnboarded(true);
      triggerConfetti();
    },
    [setDateInvites, setIsOnboarded, setQuestionAnswer, setSmallCravings, setWishlist, triggerConfetti]
  );

  const joinCoupleByCode = useCallback(
    (linkCode: string, myName: string) => {
      const trimmedName = myName.trim() || 'Партнёр 2';
      setCoupleProfile((prev) => {
        const updated: CoupleProfile = {
          ...prev,
          linkCode: linkCode || prev.linkCode,
          partner2: {
            ...prev.partner2,
            name: trimmedName,
          },
        };
        safeSetStorage('together_couple_profile', updated);
        return updated;
      });

      setIsOnboarded(true);
      triggerConfetti();
    },
    [setIsOnboarded, triggerConfetti]
  );

  const loadDemoCouple = useCallback(() => {
    setCoupleProfile(initialCoupleProfile);
    setPulseHistory(initialPulseHistory);
    setChallenges(initialChallenges);
    setTests(initialTests);
    setMoodHistory(initialMoodHistory);
    setIsOnboarded(true);
    triggerConfetti();
  }, [setIsOnboarded, triggerConfetti]);

  const resetCoupleData = useCallback(() => {
    setIsOnboarded(false);
  }, [setIsOnboarded]);

  const updatePartnerNames = useCallback((p1Name: string, p2Name: string, startDate: string) => {
    setCoupleProfile((prev) => {
      const updated: CoupleProfile = {
        ...prev,
        startDate: startDate || prev.startDate,
        partner1: {
          ...prev.partner1,
          name: p1Name.trim() || prev.partner1.name,
        },
        partner2: {
          ...prev.partner2,
          name: p2Name.trim() || prev.partner2.name,
        },
      };
      safeSetStorage('together_couple_profile', updated);
      return updated;
    });
  }, []);

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
