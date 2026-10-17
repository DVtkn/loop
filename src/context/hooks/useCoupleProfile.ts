import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  UserAccount,
  PartnerId,
  CoupleProfile,
} from '../../types.ts';
import {
  initialCoupleProfile,
  initialPulseHistory,
  initialChallenges,
  initialTests,
  initialMoodHistory,
  createFreshCoupleProfile,
  getFreshTests,
  getFreshChallenges,
} from '../../data/questionBank.ts';
import { safeGetStorage, safeSetStorage } from '../../utils/safeStorage.ts';
import { getPartnerStatusDetails } from '../../components/dashboard/PartnerStatusCard.tsx';

interface UseCoupleProfileParams {
  currentUser: UserAccount | null;
  accountsDb: Record<string, UserAccount & { password?: string }>;
  setIsOnboarded: (val: boolean) => void;
  triggerConfetti: () => void;
  setTests: (tests: any) => void;
  setChallenges: (challenges: any) => void;
  setPulseHistory: (pulse: any) => void;
  setDateInvites: (invites: any) => void;
  setWishlist: (wishlist: any) => void;
  setSmallCravings: (cravings: any) => void;
  setQuestionAnswer: (ans: string | null) => void;
  setMoodHistory: (mood: any) => void;
}

export function useCoupleProfile({
  currentUser,
  accountsDb,
  setIsOnboarded,
  triggerConfetti,
  setTests,
  setChallenges,
  setPulseHistory,
  setDateInvites,
  setWishlist,
  setSmallCravings,
  setQuestionAnswer,
  setMoodHistory,
}: UseCoupleProfileParams) {
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(() => {
    return safeGetStorage('together_couple_profile', initialCoupleProfile);
  });

  useEffect(() => {
    safeSetStorage('together_couple_profile', coupleProfile);
  }, [coupleProfile]);

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

  const updateCoupleProfile = useCallback((updates: Partial<CoupleProfile>) => {
    setCoupleProfile((prev) => ({ ...prev, ...updates }));
  }, []);

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
    [setDateInvites, setIsOnboarded, setQuestionAnswer, setSmallCravings, setWishlist, triggerConfetti, setTests, setChallenges, setPulseHistory]
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
  }, [setIsOnboarded, triggerConfetti, setChallenges, setMoodHistory, setPulseHistory, setTests]);

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

  return {
    coupleProfile,
    setCoupleProfile,
    currentPartnerId,
    setCurrentPartnerId,
    otherPartner,
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
  };
}
