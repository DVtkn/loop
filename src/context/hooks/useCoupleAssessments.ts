import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api.ts';
import {
  UserAccount,
  PartnerId,
  CoupleProfile,
  TestCategory,
  PulseEntry,
  Challenge,
  MoodHistoryItem,
} from '../../types.ts';
import { safeGetStorage, safeSetStorage, getUserStorageKey } from '../../utils/safeStorage.ts';
import {
  getFreshTests,
  initialChallenges,
} from '../../data/questionBank.ts';

interface UseCoupleAssessmentsParams {
  currentUser: UserAccount | null;
  currentPartnerId: PartnerId;
  coupleProfile: CoupleProfile;
  setCoupleProfile: React.Dispatch<React.SetStateAction<CoupleProfile>>;
  updateUserProfile: (fields: Partial<UserAccount>) => Promise<void>;
  addCoupleXP: (points: number, reason: string, category?: any) => void;
  triggerConfetti: () => void;
  refreshTestsStatus: () => Promise<void>;
}

export function useCoupleAssessments({
  currentUser,
  currentPartnerId,
  setCoupleProfile,
  updateUserProfile,
  addCoupleXP,
  triggerConfetti,
  refreshTestsStatus,
}: UseCoupleAssessmentsParams) {
  const getUserTestsStorageKey = useCallback((login?: string | null) => {
    if (!login) return 'together_tests_guest';
    return `together_tests_${login.toLowerCase().trim().replace(/^@/, '')}`;
  }, []);

  const userLogin = currentUser?.login;
  const testsKey = getUserTestsStorageKey(userLogin);
  const pulseKey = getUserStorageKey('together_pulse_history', userLogin);
  const challengesKey = getUserStorageKey('together_challenges', userLogin);
  const moodKey = getUserStorageKey('together_mood_history', userLogin);
  const loadedLoginRef = useRef<string | undefined | null>(userLogin);

  const [tests, setTests] = useState<TestCategory[]>(() => {
    const initialTestsKey = getUserTestsStorageKey(
      safeGetStorage<UserAccount | null>('together_current_user', null)?.login
    );
    const data = safeGetStorage<TestCategory[]>(initialTestsKey, []);
    return Array.isArray(data) && data.length > 0 ? data : getFreshTests();
  });

  const [pulseHistory, setPulseHistory] = useState<PulseEntry[]>(() => {
    const data = safeGetStorage<PulseEntry[]>(getUserStorageKey('together_pulse_history', userLogin), []);
    return Array.isArray(data) ? data.filter((p) => !['p-1', 'p-2', 'p-3', 'p-4'].includes(p.id)) : [];
  });

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const data = safeGetStorage<Challenge[]>(getUserStorageKey('together_challenges', userLogin), initialChallenges);
    return Array.isArray(data) ? data : initialChallenges;
  });

  const [moodHistory, setMoodHistory] = useState<MoodHistoryItem[]>(() => {
    const data = safeGetStorage<MoodHistoryItem[]>(getUserStorageKey('together_mood_history', userLogin), []);
    return Array.isArray(data)
      ? data.filter(
          (m) =>
            !['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-7', 'm-8', 'm-9', 'm-10', 'm-11', 'm-12', 'm-13', 'm-14'].includes(
              m.id
            )
        )
      : [];
  });

  const refreshTestsStatusRef = useRef(refreshTestsStatus);
  useEffect(() => {
    refreshTestsStatusRef.current = refreshTestsStatus;
  }, [refreshTestsStatus]);

  // Reload user-isolated assessment state on user change before persisting
  useEffect(() => {
    if (loadedLoginRef.current === userLogin) return;
    loadedLoginRef.current = userLogin;

    if (userLogin) {
      const userTests = safeGetStorage<TestCategory[]>(testsKey, []);
      setTests(Array.isArray(userTests) && userTests.length > 0 ? userTests : getFreshTests());

      const userPulse = safeGetStorage<PulseEntry[]>(pulseKey, []);
      setPulseHistory(Array.isArray(userPulse) ? userPulse : []);

      const userChallenges = safeGetStorage<Challenge[]>(challengesKey, initialChallenges);
      setChallenges(Array.isArray(userChallenges) ? userChallenges : initialChallenges);

      const userMood = safeGetStorage<MoodHistoryItem[]>(moodKey, []);
      setMoodHistory(Array.isArray(userMood) ? userMood : []);

      refreshTestsStatusRef.current?.();
    } else {
      setTests(getFreshTests());
      setPulseHistory([]);
      setChallenges(initialChallenges);
      setMoodHistory([]);
    }
  }, [userLogin, testsKey, pulseKey, challengesKey, moodKey]);

  // Storage persistence effects (only when current user state matches loaded user)
  useEffect(() => {
    if (loadedLoginRef.current !== userLogin) return;
    safeSetStorage(pulseKey, pulseHistory);
  }, [pulseHistory, pulseKey, userLogin]);

  useEffect(() => {
    if (loadedLoginRef.current !== userLogin) return;
    safeSetStorage(challengesKey, challenges);
  }, [challenges, challengesKey, userLogin]);

  useEffect(() => {
    if (loadedLoginRef.current !== userLogin) return;
    safeSetStorage(testsKey, tests);
  }, [tests, testsKey, userLogin]);

  useEffect(() => {
    if (loadedLoginRef.current !== userLogin) return;
    safeSetStorage(moodKey, moodHistory);
  }, [moodHistory, moodKey, userLogin]);

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
    [currentPartnerId, currentUser, tests, addCoupleXP, triggerConfetti, refreshTestsStatus, setCoupleProfile]
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
      safeSetStorage(getUserStorageKey('together_couple_profile', currentUser?.login), updated);
      return updated;
    });
  }, [currentUser?.login, getUserTestsStorageKey, setCoupleProfile]);

  const addMoodStatus = useCallback(
    (
      emoji: string,
      label: string,
      severity: number,
      note?: string,
      energyLevel?: number,
      careMode?: string
    ) => {
      const cleanNote = (note || '').trim();
      const clampedEnergy =
        typeof energyLevel === 'number' && !isNaN(energyLevel)
          ? Math.max(0, Math.min(100, Math.round(energyLevel)))
          : undefined;
      const cleanCareMode = careMode?.trim() || undefined;

      const newMood = {
        emoji,
        label,
        note: cleanNote,
        updatedAt: new Date().toISOString(),
        ...(clampedEnergy !== undefined ? { energyLevel: clampedEnergy } : {}),
        ...(cleanCareMode ? { careMode: cleanCareMode } : {}),
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
        ...(clampedEnergy !== undefined ? { energyLevel: clampedEnergy } : {}),
        ...(cleanCareMode ? { careMode: cleanCareMode } : {}),
      };
      setMoodHistory((prev) => {
        const updated = [newMoodEntry, ...prev.slice(0, 49)];
        safeSetStorage(moodKey, updated);
        return updated;
      });

      addCoupleXP(15, `Отметка настроения: ${label}`, 'mood');
    },
    [currentPartnerId, currentUser, updateUserProfile, setCoupleProfile, addCoupleXP, moodKey]
  );

  return {
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
    getUserTestsStorageKey,
  };
}
