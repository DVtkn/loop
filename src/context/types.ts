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
  CareModePresetKey,
  CareModePreset,
  CurrentMoodWithBattery,
  ContextualCareSuggestion,
} from '../types.ts';
import { getCoupleLevelInfo } from '../utils/rankingEngine.ts';

export type {
  CareModePresetKey,
  CareModePreset,
  CurrentMoodWithBattery,
  ContextualCareSuggestion,
};

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
  addMoodStatus: (
    emoji: string,
    label: string,
    severity: number,
    note?: string,
    energyLevel?: number,
    careMode?: string
  ) => void;
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
