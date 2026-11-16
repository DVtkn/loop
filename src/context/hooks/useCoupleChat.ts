import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../utils/api.ts';
import {
  UserAccount,
  PartnerId,
  CoupleProfile,
  AIMessage,
  ChatMessage,
  NavigationTab,
  PulseEntry,
} from '../../types.ts';
import { safeGetStorage, safeSetStorage, getUserStorageKey } from '../../utils/safeStorage.ts';

interface UseCoupleChatParams {
  currentUser: UserAccount | null;
  currentPartnerId: PartnerId;
  coupleProfile: CoupleProfile;
  pulseHistory: PulseEntry[];
  activeTab: NavigationTab;
  getDaysTogether: () => number;
  getFormattedTimeTogether: () => string;
}

const DEFAULT_AI_WELCOME: AIMessage[] = [
  {
    id: 'ai-init-1',
    role: 'model',
    content: `Здравствуйте! Я Сова — ваш персональный ИИ-психолог Loop.\n\nЯ помогу вам бережно разбирать любые ситуации, находить гармонию, понимать стили привязанности и языки любви в вашей паре.\n\nО чём вы хотели бы поговорить сегодня?`,
    timestamp: new Date().toISOString(),
  },
];

export function useCoupleChat({
  currentUser,
  currentPartnerId,
  coupleProfile,
  pulseHistory,
  activeTab,
  getDaysTogether,
  getFormattedTimeTogether,
}: UseCoupleChatParams) {
  const [partnerMessages, setPartnerMessages] = useState<ChatMessage[]>(() => {
    return safeGetStorage<ChatMessage[]>(getUserStorageKey('together_partner_messages', currentUser?.login), []);
  });

  const [aiMessages, setAIMessages] = useState<AIMessage[]>(() => {
    return safeGetStorage(getUserStorageKey('together_ai_messages', currentUser?.login), DEFAULT_AI_WELCOME);
  });

  const [isAITyping, setIsAITyping] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(() =>
    safeGetStorage(getUserStorageKey('together_unread_chat', currentUser?.login), 0)
  );

  // Reload isolated chat histories when user changes or logs out
  useEffect(() => {
    const login = currentUser?.login;
    if (!login) {
      setPartnerMessages([]);
      setAIMessages(DEFAULT_AI_WELCOME);
      setUnreadChatCount(0);
      return;
    }

    const cleanLogin = login.toLowerCase().trim().replace(/^@/, '');
    const savedPartner = safeGetStorage<ChatMessage[]>(getUserStorageKey('together_partner_messages', cleanLogin), []);
    setPartnerMessages(Array.isArray(savedPartner) ? savedPartner : []);

    const savedAi = safeGetStorage<AIMessage[]>(getUserStorageKey('together_ai_messages', cleanLogin), DEFAULT_AI_WELCOME);
    setAIMessages(Array.isArray(savedAi) && savedAi.length > 0 ? savedAi : DEFAULT_AI_WELCOME);

    setUnreadChatCount(safeGetStorage(getUserStorageKey('together_unread_chat', cleanLogin), 0));

    // Hydrate solo AI messages from server database
    apiFetch(`/api/ai/messages/${encodeURIComponent(cleanLogin)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          const mapped: AIMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            role: m.senderLogin === 'ai_owl' || m.senderLogin === 'ai' || m.role === 'ai' ? 'model' : 'user',
            content: m.content,
            timestamp: m.createdAt || new Date().toISOString(),
          }));
          setAIMessages(mapped);
          safeSetStorage(getUserStorageKey('together_ai_messages', cleanLogin), mapped);
        }
      })
      .catch(() => {});
  }, [currentUser?.login]);

  const clearUnreadChatCount = useCallback(() => {
    setUnreadChatCount(0);
    safeSetStorage(getUserStorageKey('together_unread_chat', currentUser?.login), 0);
  }, [currentUser?.login]);

  useEffect(() => {
    if (activeTab === 'chat' || activeTab === 'owl') {
      setUnreadChatCount(0);
      safeSetStorage(getUserStorageKey('together_unread_chat', currentUser?.login), 0);
    }
  }, [activeTab, currentUser?.login]);

  useEffect(() => {
    if (!currentUser?.login) return;
    safeSetStorage(getUserStorageKey('together_ai_messages', currentUser.login), aiMessages);
  }, [aiMessages, currentUser?.login]);

  const fetchPartnerMessages = useCallback(async () => {
    if (!currentUser) return;
    const cleanMyLogin = currentUser.login.toLowerCase().trim().replace(/^@/, '');
    const cleanPartnerLogin = currentUser.partnerLogin
      ? currentUser.partnerLogin.toLowerCase().trim().replace(/^@/, '')
      : null;
    const coupleId = cleanPartnerLogin
      ? [cleanMyLogin, cleanPartnerLogin].sort().join('_')
      : cleanMyLogin;

    try {
      const msgsRes = await apiFetch(`/api/chat/messages?mode=together&coupleId=${encodeURIComponent(coupleId)}`);
      if (msgsRes.ok) {
        const msgsData = await msgsRes.json();
        if (Array.isArray(msgsData.messages)) {
          setPartnerMessages(msgsData.messages);
          safeSetStorage(getUserStorageKey('together_partner_messages', cleanMyLogin), msgsData.messages);
        }
      }
    } catch {
      // safe fallback
    }
  }, [currentUser]);

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
      console.error('[AI Chat Error]:', err);
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

  const sendPartnerMessage = async (text: string, _isAi?: boolean) => {
    if (!currentUser) return;
    const cleanMyLogin = currentUser.login.toLowerCase().trim().replace(/^@/, '');
    const partnerLogin = currentUser.partnerLogin;
    const cleanPartnerLogin = partnerLogin ? partnerLogin.toLowerCase().trim().replace(/^@/, '') : '';
    const targetCoupleId = cleanPartnerLogin
      ? [cleanMyLogin, cleanPartnerLogin].sort().join('_')
      : cleanMyLogin;

    const myRole: 'partner1' | 'partner2' = currentPartnerId === 'partner1' ? 'partner1' : 'partner2';
    const tempId = crypto.randomUUID();
    const msg: ChatMessage = {
      id: tempId,
      coupleId: targetCoupleId,
      senderLogin: cleanMyLogin,
      role: myRole,
      content: text,
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    const storageKey = getUserStorageKey('together_partner_messages', cleanMyLogin);
    setPartnerMessages((prev) => {
      const next = [...prev, msg];
      safeSetStorage(storageKey, next);
      return next;
    });

    try {
      const res = await apiFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: targetCoupleId,
          senderLogin: cleanMyLogin,
          role: myRole,
          content: text,
          mode: 'together',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPartnerMessages((prev) => {
          let next = data?.message
            ? prev.map((m) => (m.id === tempId ? data.message : m))
            : prev;
          if (data?.aiMessage && !next.some((m) => m.id === data.aiMessage.id)) {
            next = [...next, data.aiMessage];
          }
          safeSetStorage(storageKey, next);
          return next;
        });
      }
    } catch (err) {
      console.error('Ошибка отправки сообщения партнёру', err);
    }
  };

  return {
    partnerMessages,
    setPartnerMessages,
    aiMessages,
    setAIMessages,
    isAITyping,
    unreadChatCount,
    setUnreadChatCount,
    clearUnreadChatCount,
    fetchPartnerMessages,
    sendAIMessage,
    sendPartnerMessage,
  };
}
