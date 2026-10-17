import { useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../utils/api.ts';
import {
  UserAccount,
  PartnerId,
  CoupleProfile,
  TestCategory,
  PulseEntry,
  Challenge,
  SmallCraving,
  FlowerPreference,
  WishlistItem,
  Venue,
  DateInvite,
  ScheduleEvent,
  MoodHistoryItem,
  Achievement,
  XPEntry,
  TimeCapsule,
  LoveTap,
  DailyCoupleQuiz,
  ChatMessage,
  TouchNotificationData,
  PairRequest,
} from '../../types.ts';
import { safeSetStorage } from '../../utils/safeStorage.ts';
import { dispatchInAppNotification, playNotificationSound } from '../../utils/pushManager.ts';

interface UseCoupleSyncParams {
  currentUser: UserAccount | null;
  setCurrentUserState: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  currentPartnerId: PartnerId;
  coupleProfile: CoupleProfile;
  setCoupleProfile: React.Dispatch<React.SetStateAction<CoupleProfile>>;
  tests: TestCategory[];
  setTests: React.Dispatch<React.SetStateAction<TestCategory[]>>;
  pulseHistory: PulseEntry[];
  setPulseHistory: React.Dispatch<React.SetStateAction<PulseEntry[]>>;
  challenges: Challenge[];
  setChallenges: React.Dispatch<React.SetStateAction<Challenge[]>>;
  smallCravings: SmallCraving[];
  setSmallCravings: React.Dispatch<React.SetStateAction<SmallCraving[]>>;
  flowerPreferences: Record<string, FlowerPreference>;
  setFlowerPreferences: React.Dispatch<React.SetStateAction<Record<string, FlowerPreference>>>;
  wishlist: WishlistItem[];
  setWishlist: React.Dispatch<React.SetStateAction<WishlistItem[]>>;
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
  dateInvites: DateInvite[];
  setDateInvites: React.Dispatch<React.SetStateAction<DateInvite[]>>;
  scheduleEvents: ScheduleEvent[];
  setScheduleEvents: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  moodHistory: MoodHistoryItem[];
  setMoodHistory: React.Dispatch<React.SetStateAction<MoodHistoryItem[]>>;
  achievements: Achievement[];
  coupleXP: number;
  setCoupleXP: React.Dispatch<React.SetStateAction<number>>;
  xpHistory: XPEntry[];
  setXpHistory: React.Dispatch<React.SetStateAction<XPEntry[]>>;
  timeCapsules: TimeCapsule[];
  setTimeCapsules: React.Dispatch<React.SetStateAction<TimeCapsule[]>>;
  loveTaps: LoveTap[];
  dailyQuiz: DailyCoupleQuiz;
  accountsDb: Record<string, UserAccount & { password?: string }>;
  setAccountsDb: React.Dispatch<React.SetStateAction<Record<string, UserAccount & { password?: string }>>>;
  setPairRequests: React.Dispatch<React.SetStateAction<PairRequest[]>>;
  setPartnerMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setUnreadChatCount: React.Dispatch<React.SetStateAction<number>>;
  handleIncomingTouch: (data: TouchNotificationData) => void;
  lastHandledTouchIdsRef: React.MutableRefObject<Set<string>>;
  triggerConfetti: () => void;
  fetchCoupleDataRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
}

export function useCoupleSync(params: UseCoupleSyncParams) {
  const {
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
    setAccountsDb,
    setPairRequests,
    setPartnerMessages,
    setUnreadChatCount,
    handleIncomingTouch,
    lastHandledTouchIdsRef,
    triggerConfetti,
  } = params;

  const internalFetchRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const fetchCoupleDataRef = params.fetchCoupleDataRef || internalFetchRef;
  const isInitialRemoteLoadDone = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Refresh tests status from server
  const refreshTestsStatus = useCallback(async () => {
    if (!currentUser?.login) return;
    try {
      const res = await apiFetch('/api/tests/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.statuses)) {
          const statusMap = new Map(data.statuses.map((s: any) => [s.testId, s]));
          setTests((prev) =>
            prev.map((t) => {
              const s: any = statusMap.get(t.id);
              if (!s) return t;
              const isP1 = currentPartnerId === 'partner1';
              return {
                ...t,
                isCompletedByMe: s.isCompletedByMe,
                isCompletedByPartner: s.isCompletedByPartner,
                myAnswersCount: s.myAnswersCount,
                partnerAnswersCount: s.partnerAnswersCount,
                partner1Done: isP1 ? s.isCompletedByMe : s.isCompletedByPartner,
                partner2Done: isP1 ? s.isCompletedByPartner : s.isCompletedByMe,
              };
            })
          );
        }
      }
    } catch {
      // offline resilience
    }
  }, [currentUser?.login, currentPartnerId, setTests]);

  // 2. Fetch full couple snapshot from remote
  const fetchCoupleDataFromRemote = useCallback(async () => {
    if (!currentUser) return;
    const cleanLogin = currentUser.login.toLowerCase().trim().replace(/^@/, '');
    const partner = currentUser.partnerLogin ? currentUser.partnerLogin.toLowerCase().trim().replace(/^@/, '') : null;
    const coupleKey = partner ? [cleanLogin, partner].sort().join('_') : cleanLogin;

    try {
      const res = await apiFetch(`/api/couple/data/${coupleKey}`);
      if (res.ok) {
        const { data } = await res.json();
        if (data && typeof data === 'object') {
          if (data.coupleProfile) setCoupleProfile((prev) => ({ ...prev, ...data.coupleProfile }));
          if (Array.isArray(data.pulseHistory)) setPulseHistory(data.pulseHistory);
          if (Array.isArray(data.challenges)) setChallenges(data.challenges);
          if (Array.isArray(data.smallCravings)) setSmallCravings(data.smallCravings);
          if (data.flowerPreferences) setFlowerPreferences((prev) => ({ ...prev, ...data.flowerPreferences }));
          if (Array.isArray(data.wishlist)) setWishlist(data.wishlist);
          if (Array.isArray(data.venues)) setVenues(data.venues);
          if (Array.isArray(data.dateInvites)) setDateInvites(data.dateInvites);
          if (Array.isArray(data.scheduleEvents)) setScheduleEvents(data.scheduleEvents);
          if (Array.isArray(data.moodHistory)) setMoodHistory(data.moodHistory);
          if (data.coupleXP !== undefined) setCoupleXP((prev) => Math.max(prev, Number(data.coupleXP) || 0));
          if (Array.isArray(data.xpHistory)) setXpHistory(data.xpHistory);
          if (Array.isArray(data.timeCapsules)) setTimeCapsules(data.timeCapsules);
        }
      }
      await refreshTestsStatus();
    } catch {
      // offline resilience
    }
  }, [
    currentUser,
    setCoupleProfile,
    setPulseHistory,
    setChallenges,
    setSmallCravings,
    setFlowerPreferences,
    setWishlist,
    setVenues,
    setDateInvites,
    setScheduleEvents,
    setMoodHistory,
    setCoupleXP,
    setXpHistory,
    setTimeCapsules,
    refreshTestsStatus,
  ]);

  fetchCoupleDataRef.current = fetchCoupleDataFromRemote;

  useEffect(() => {
    if (!currentUser) return;
    fetchCoupleDataFromRemote().then(() => {
      isInitialRemoteLoadDone.current = true;
    });
  }, [currentUser?.login, currentUser?.partnerLogin, fetchCoupleDataFromRemote]);

  // 3. Periodic server polling sync (every 5 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const syncWithServer = async () => {
      try {
        const cleanLogin = currentUser.login.toLowerCase();

        const statusRes = await apiFetch(`/api/pair/status/${cleanLogin}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.user) {
            if (statusData.user.partnerLogin !== currentUser.partnerLogin) {
              const prevPartner = currentUser.partnerLogin;
              setCurrentUserState(statusData.user);
              safeSetStorage('together_current_user', statusData.user);
              if (statusData.user.partnerLogin && !prevPartner) {
                dispatchInAppNotification({
                  title: 'Вы теперь в паре!',
                  body: `Вы успешно объединились с @${statusData.user.partnerLogin}`,
                  icon: 'heart',
                });
                triggerConfetti();
                setTimeout(() => {
                  fetchCoupleDataRef.current?.();
                }, 500);
              }
            }
          }
          if (statusData.partner) {
            setAccountsDb((prev) => {
              const pLogin = statusData.partner.login.toLowerCase();
              if (JSON.stringify(prev[pLogin]) !== JSON.stringify(statusData.partner)) {
                const updated = { ...prev, [pLogin]: statusData.partner };
                safeSetStorage('together_accounts_registry', updated);
                return updated;
              }
              return prev;
            });
          }
          const incoming = statusData.incomingRequests || statusData.incoming || [];
          const outgoing = statusData.outgoingRequests || statusData.outgoing || [];
          const combined = [...incoming, ...outgoing];

          setPairRequests((prev) => {
            const currentPendingIds = prev.map((r) => r.id).sort().join(',');
            const newPendingIds = combined.map((r: any) => r.id).sort().join(',');

            const prevIncomingIds = new Set(prev.filter((r) => r.toLogin.toLowerCase() === cleanLogin).map((r) => r.id));
            incoming.forEach((inReq: PairRequest) => {
              if (!prevIncomingIds.has(inReq.id)) {
                dispatchInAppNotification({
                  title: 'Запрос на объединение в пару',
                  body: `@${inReq.fromLogin} (${inReq.fromName}) приглашает вас стать парой в Loop`,
                  icon: 'heart',
                });
                playNotificationSound();
              }
            });

            if (currentPendingIds !== newPendingIds) {
              safeSetStorage('together_pair_requests', combined);
              return combined;
            }
            return prev;
          });

          // Partner chat messages
          if (statusData.user && statusData.user.partnerLogin) {
            const l1 = String(statusData.user.login).toLowerCase().replace(/^@/, '');
            const l2 = String(statusData.user.partnerLogin).toLowerCase().replace(/^@/, '');
            const coupleId = [l1, l2].sort().join('_');
            const msgsRes = await apiFetch(`/api/chat/messages/${coupleId}`);
            if (msgsRes.ok) {
              const msgsData = await msgsRes.json();
              setPartnerMessages((prev) => {
                if (msgsData.messages && JSON.stringify(prev) !== JSON.stringify(msgsData.messages)) {
                  if (prev.length > 0 && msgsData.messages.length > prev.length) {
                    const lastMsg = msgsData.messages[msgsData.messages.length - 1];
                    if (lastMsg.senderLogin !== cleanLogin) {
                      dispatchInAppNotification({
                        title: lastMsg.senderLogin === 'ai' ? 'Сова' : `@${lastMsg.senderLogin}`,
                        body: lastMsg.content,
                        icon: lastMsg.senderLogin === 'ai' ? 'bot' : 'chat',
                      });
                      playNotificationSound();
                      setUnreadChatCount((c) => c + 1);
                    }
                  }
                  return msgsData.messages;
                }
                return prev;
              });
            }
          }
        }

        // Recent touches polling
        const touchesRes = await apiFetch(`/api/couple/touches/${cleanLogin}`);
        if (touchesRes.ok) {
          const touchesData = await touchesRes.json();
          if (Array.isArray(touchesData.touches)) {
            touchesData.touches.forEach((t: TouchNotificationData) => {
              if (t.targetLogin === cleanLogin && !lastHandledTouchIdsRef.current.has(t.id)) {
                const touchAgeMs = Date.now() - new Date(t.createdAt).getTime();
                if (touchAgeMs < 60000) {
                  handleIncomingTouch(t);
                } else {
                  lastHandledTouchIdsRef.current.add(t.id);
                }
              }
            });
          }
        }
      } catch {
        // Safe silence for offline
      }
    };

    let intervalId: any;

    const schedulePoll = () => {
      clearInterval(intervalId);
      // Foreground: poll every 6s. Background / hidden tab: poll every 60s to prevent serverless invocation storm.
      const isHidden = typeof document !== 'undefined' && document.hidden;
      const delay = isHidden ? 60000 : 6000;
      intervalId = setInterval(syncWithServer, delay);
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        // User just opened / focused the app: trigger immediate fresh sync
        syncWithServer();
      }
      schedulePoll();
    };

    syncWithServer();
    schedulePoll();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [
    currentUser?.login,
    currentUser?.partnerLogin,
    handleIncomingTouch,
    setCurrentUserState,
    setAccountsDb,
    setPairRequests,
    setPartnerMessages,
    setUnreadChatCount,
    triggerConfetti,
    lastHandledTouchIdsRef,
  ]);

  // 4. Online heartbeat (every 25 seconds when tab active)
  useEffect(() => {
    if (!currentUser?.login) return;
    const cleanLogin = currentUser.login.toLowerCase().replace(/^@/, '');

    const sendHeartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const res = await apiFetch('/api/couple/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: cleanLogin }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.partnerLastActiveAt) {
            setCoupleProfile((prev) => {
              const targetKey = currentPartnerId === 'partner1' ? 'partner2' : 'partner1';
              if (prev[targetKey]?.lastActiveAt === data.partnerLastActiveAt) return prev;
              return {
                ...prev,
                [targetKey]: {
                  ...prev[targetKey],
                  lastActiveAt: data.partnerLastActiveAt,
                },
              };
            });
          }
        }
      } catch {
        // quiet fallback
      }
    };

    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(hbInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.login, currentPartnerId, setCoupleProfile]);

  // 5. Realtime SSE with Smart Polling fallback
  useEffect(() => {
    if (!currentUser?.login) return;
    const cleanLogin = currentUser.login.toLowerCase().replace(/^@/, '');
    let eventSource: EventSource | null = null;
    let isSubscribed = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let lastPollEventId: string | undefined = undefined;
    let lastPollTimestamp: string = new Date(Date.now() - 45000).toISOString();

    const applyEvent = (type: string, data: any) => {
      if (!isSubscribed || !data) return;

      if (type === 'touch') {
        if (data.senderLogin !== cleanLogin && !lastHandledTouchIdsRef.current.has(data.id)) {
          handleIncomingTouch(data);
        }
      } else if (type === 'chat_message' || type === 'new_message') {
        const newMsg = data?.message || data;
        if (newMsg && newMsg.id) {
          setPartnerMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const next = [...prev, newMsg];
            safeSetStorage('together_partner_messages', next);
            return next;
          });
          if (newMsg.senderLogin !== cleanLogin) {
            dispatchInAppNotification({
              title: newMsg.senderLogin === 'ai' ? 'Сова' : `@${newMsg.senderLogin}`,
              body: newMsg.content,
              icon: newMsg.senderLogin === 'ai' ? 'bot' : 'chat',
            });
            playNotificationSound();
            setUnreadChatCount((c) => c + 1);
          }
        }
      } else if (type === 'schedule_updated' || type === 'couple_updated') {
        fetchCoupleDataRef.current?.();
      }
    };

    const executeSmartPoll = async () => {
      if (!isSubscribed) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const queryParams = new URLSearchParams({
          login: cleanLogin,
          since: lastPollTimestamp,
        });
        if (lastPollEventId) {
          queryParams.set('lastEventId', lastPollEventId);
        }
        const res = await apiFetch(`/api/couple/events-poll?${queryParams.toString()}`);
        if (res.ok) {
          const pollData = await res.json();
          if (pollData.serverTime) {
            lastPollTimestamp = pollData.serverTime;
          }

          if (Array.isArray(pollData.events) && pollData.events.length > 0) {
            for (const ev of pollData.events) {
              lastPollEventId = ev.id;
              applyEvent(ev.type, ev.data);
            }
          }

          if (pollData.partnerLastActiveAt) {
            setCoupleProfile((prev) => {
              const targetKey = currentPartnerId === 'partner1' ? 'partner2' : 'partner1';
              if (prev[targetKey]?.lastActiveAt === pollData.partnerLastActiveAt) return prev;
              return {
                ...prev,
                [targetKey]: {
                  ...prev[targetKey],
                  lastActiveAt: pollData.partnerLastActiveAt,
                },
              };
            });
          }
        }
      } catch {
        // quiet fallback
      }
    };

    const startSmartPolling = () => {
      if (pollInterval) return;
      executeSmartPoll();
      pollInterval = setInterval(executeSmartPoll, 2500);
    };

    try {
      eventSource = new EventSource(`/api/couple/events-stream/${cleanLogin}`);
      eventSource.addEventListener('touch', (event: MessageEvent) => {
        try { applyEvent('touch', JSON.parse(event.data)); } catch {}
      });
      eventSource.addEventListener('chat_message', (event: MessageEvent) => {
        try { applyEvent('chat_message', JSON.parse(event.data)); } catch {}
      });
      eventSource.addEventListener('new_message', (event: MessageEvent) => {
        try { applyEvent('new_message', JSON.parse(event.data)); } catch {}
      });
      eventSource.addEventListener('schedule_updated', () => {
        applyEvent('schedule_updated', {});
      });
      eventSource.addEventListener('couple_updated', () => {
        applyEvent('couple_updated', {});
      });
      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startSmartPolling();
      };
    } catch {
      startSmartPolling();
    }

    executeSmartPoll();

    const handleTabActive = () => {
      if (document.visibilityState === 'visible') {
        executeSmartPoll();
      }
    };
    document.addEventListener('visibilitychange', handleTabActive);

    return () => {
      isSubscribed = false;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleTabActive);
    };
  }, [
    currentUser?.login,
    currentPartnerId,
    handleIncomingTouch,
    lastHandledTouchIdsRef,
    setCoupleProfile,
    setPartnerMessages,
    setUnreadChatCount,
  ]);

  // 6. Debounced sync to database
  useEffect(() => {
    if (!currentUser || !isInitialRemoteLoadDone.current) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      const cleanLogin = currentUser.login.toLowerCase().trim().replace(/^@/, '');
      const partner = currentUser.partnerLogin ? currentUser.partnerLogin.toLowerCase().trim().replace(/^@/, '') : null;
      const coupleKey = partner ? [cleanLogin, partner].sort().join('_') : cleanLogin;

      try {
        await apiFetch('/api/couple/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login1: cleanLogin,
            login2: partner,
            coupleId: coupleKey,
            payload: {
              coupleProfile,
              tests,
              pulseHistory,
              challenges,
              smallCravings,
              flowerPreferences,
              wishlist,
              venues,
              dateInvites,
              scheduleEvents,
              moodHistory,
              achievements,
              coupleXP,
              xpHistory,
              timeCapsules,
              loveTaps,
              dailyQuiz,
            },
          }),
        });
      } catch {
        // Safe offline
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [
    currentUser?.login,
    currentUser?.partnerLogin,
    currentUser,
    coupleProfile,
    tests,
    pulseHistory,
    challenges,
    smallCravings,
    flowerPreferences,
    wishlist,
    venues,
    dateInvites,
    scheduleEvents,
    moodHistory,
    achievements,
    coupleXP,
    xpHistory,
    timeCapsules,
    loveTaps,
    dailyQuiz,
  ]);

  return {
    fetchCoupleDataRef,
    refreshTestsStatus,
    fetchCoupleDataFromRemote,
  };
}
