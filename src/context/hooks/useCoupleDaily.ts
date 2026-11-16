import { useState, useEffect, useRef } from 'react';
import { TimeCapsule, DailyCoupleQuiz, DeepTalkCard, PartnerId, CoupleProfile, UserAccount } from '../../types.ts';
import { DAILY_QUIZ_QUESTIONS, DEEP_TALK_CARDS } from '../../data/gamificationData.ts';
import { safeGetStorage, safeSetStorage, getUserStorageKey } from '../../utils/safeStorage.ts';

function buildDefaultQuiz(): DailyCoupleQuiz {
  const defaultQ = DAILY_QUIZ_QUESTIONS[0];
  return {
    id: defaultQ.id,
    question: defaultQ.question,
    options: [
      { key: 'me', label: 'Я' },
      { key: 'partner', label: 'Партнёр' },
      { key: 'both', label: 'Оба одинаково' },
    ],
    category: defaultQ.category,
  };
}

function loadSavedQuiz(storageKey: string): DailyCoupleQuiz {
  const defaultQ = DAILY_QUIZ_QUESTIONS[0];
  const saved = safeGetStorage<Partial<DailyCoupleQuiz> | null>(storageKey, null);
  if (!saved) return buildDefaultQuiz();
  return {
    id: saved.id || defaultQ.id,
    question: saved.question || defaultQ.question,
    options:
      saved.options && saved.options.length > 0
        ? saved.options
        : [
            { key: 'me', label: 'Я' },
            { key: 'partner', label: 'Партнёр' },
            { key: 'both', label: 'Оба одинаково' },
          ],
    category: saved.category || defaultQ.category,
    partner1Answer: saved.partner1Answer,
    partner2Answer: saved.partner2Answer,
    isMatch: saved.isMatch,
  };
}

function filterFeed(feed: FeedItem[]): FeedItem[] {
  return Array.isArray(feed)
    ? feed.filter(
        (item) =>
          item.id !== 'f1' &&
          item.id !== 'f2' &&
          item.id !== 'f3' &&
          !item.title?.includes('Добро пожаловать') &&
          !item.subtitle?.includes('Серия ответов 12 дней')
      )
    : [];
}

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

export interface UseCoupleDailyProps {
  currentUser: UserAccount | null;
  coupleProfile: CoupleProfile;
  currentPartnerId: PartnerId;
  triggerConfetti: () => void;
}

export interface UseCoupleDailyReturn {
  timeCapsules: TimeCapsule[];
  setTimeCapsules: React.Dispatch<React.SetStateAction<TimeCapsule[]>>;
  addTimeCapsule: (title: string, content: string, unlockDate: string, category: TimeCapsule['category']) => void;
  openTimeCapsule: (id: string) => void;
  dailyQuiz: DailyCoupleQuiz;
  setDailyQuiz: React.Dispatch<React.SetStateAction<DailyCoupleQuiz>>;
  submitDailyQuizAnswer: (choice: 'me' | 'partner' | 'both') => void;
  deepCards: DeepTalkCard[];
  questionAnswer: string | null;
  setQuestionAnswer: React.Dispatch<React.SetStateAction<string | null>>;
  answerQuestionOfDay: (ans: string) => void;
  feedItems: FeedItem[];
  setFeedItems: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  addFeedItem: (item: Omit<FeedItem, 'id' | 'timeAgo'>) => void;
  clearFeed: () => void;
}

export function useCoupleDaily({
  currentUser,
  coupleProfile,
  currentPartnerId,
  triggerConfetti,
}: UseCoupleDailyProps): UseCoupleDailyReturn {
  const userLogin = currentUser?.login;
  const capsulesKey = getUserStorageKey('together_time_capsules', userLogin);
  const quizKey = getUserStorageKey('together_daily_quiz', userLogin);
  const qAnswerKey = getUserStorageKey('together_q_answer', userLogin);
  const feedKey = getUserStorageKey('together_feed', userLogin);
  const loadedLoginRef = useRef<string | undefined | null>(userLogin);

  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>(() => {
    return safeGetStorage(capsulesKey, []);
  });

  const [dailyQuiz, setDailyQuiz] = useState<DailyCoupleQuiz>(() => {
    return loadSavedQuiz(quizKey);
  });

  const deepCards = DEEP_TALK_CARDS;

  const [questionAnswer, setQuestionAnswer] = useState<string | null>(() => {
    return safeGetStorage(qAnswerKey, null);
  });

  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => {
    return filterFeed(safeGetStorage<FeedItem[]>(feedKey, []));
  });

  useEffect(() => {
    if (loadedLoginRef.current === userLogin) return;
    loadedLoginRef.current = userLogin;

    if (!userLogin) {
      setTimeCapsules([]);
      setDailyQuiz(buildDefaultQuiz());
      setQuestionAnswer(null);
      setFeedItems([]);
      return;
    }

    setTimeCapsules(safeGetStorage(capsulesKey, []));
    setDailyQuiz(loadSavedQuiz(quizKey));
    setQuestionAnswer(safeGetStorage(qAnswerKey, null));
    setFeedItems(filterFeed(safeGetStorage<FeedItem[]>(feedKey, [])));
  }, [userLogin, capsulesKey, quizKey, qAnswerKey, feedKey]);

  const addFeedItem = (item: Omit<FeedItem, 'id' | 'timeAgo'>) => {
    const newItem: FeedItem = {
      ...item,
      id: 'feed-' + Date.now(),
      timeAgo: 'только что',
    };
    setFeedItems((prev) => {
      const updated = [newItem, ...prev.slice(0, 19)];
      safeSetStorage(feedKey, updated);
      return updated;
    });
  };

  const clearFeed = () => {
    setFeedItems([]);
    safeSetStorage(feedKey, []);
  };

  const answerQuestionOfDay = (ans: string) => {
    setQuestionAnswer(ans);
    safeSetStorage(qAnswerKey, ans);
    addFeedItem({
      author: currentPartnerId,
      type: 'heart',
      title: `${
        currentPartnerId === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name
      } ответил(а) на вопрос дня`,
      subtitle: ans.length > 40 ? ans.slice(0, 40) + '...' : ans,
    });
  };

  const addTimeCapsule = (title: string, content: string, unlockDate: string, category: TimeCapsule['category']) => {
    const senderName =
      currentUser?.name || (currentPartnerId === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name);
    const senderLogin = currentUser?.login || (currentPartnerId === 'partner1' ? 'partner1' : 'partner2');

    const newCapsule: TimeCapsule = {
      id: `tc-${Date.now()}`,
      title,
      content,
      authorLogin: senderLogin,
      authorName: senderName,
      unlockDate,
      isOpened: false,
      category,
      createdAt: new Date().toISOString(),
    };

    setTimeCapsules((prev) => {
      const updated = [newCapsule, ...prev];
      safeSetStorage(capsulesKey, updated);
      return updated;
    });

    addFeedItem({
      author: currentPartnerId,
      type: 'sparkle',
      title: `${senderName} запечатал(а) Капсулу Времени`,
      subtitle: `«${title}» — откроется ${unlockDate}`,
    });

    triggerConfetti();
  };

  const openTimeCapsule = (id: string) => {
    setTimeCapsules((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, isOpened: true, openedAt: new Date().toISOString() } : c
      );
      safeSetStorage(capsulesKey, updated);
      return updated;
    });
    triggerConfetti();
  };

  const submitDailyQuizAnswer = (choice: 'me' | 'partner' | 'both') => {
    const isPartner1 = currentPartnerId === 'partner1';
    setDailyQuiz((prev) => {
      const p1 = isPartner1 ? choice : prev.partner1Answer;
      const p2 = !isPartner1 ? choice : prev.partner2Answer;

      let isMatch = false;
      if (p1 && p2) {
        if (p1 === 'both' && p2 === 'both') isMatch = true;
        else if (p1 === 'me' && p2 === 'partner') isMatch = true;
        else if (p1 === 'partner' && p2 === 'me') isMatch = true;
      }

      const updated: DailyCoupleQuiz = {
        ...prev,
        partner1Answer: p1,
        partner2Answer: p2,
        isMatch,
      };

      safeSetStorage(quizKey, updated);
      return updated;
    });

    addFeedItem({
      author: currentPartnerId,
      type: 'sparkle',
      title: `Ответ в игре «Кто из нас...»`,
      subtitle: `Вопрос: ${dailyQuiz.question}`,
    });
    triggerConfetti();
  };

  return {
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
  };
}
