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
import { safeGetStorage, safeSetStorage } from '../../utils/safeStorage.ts';

interface UseCoupleChatParams {
  currentUser: UserAccount | null;
  currentPartnerId: PartnerId;
  coupleProfile: CoupleProfile;
  pulseHistory: PulseEntry[];
  activeTab: NavigationTab;
  getDaysTogether: () => number;
  getFormattedTimeTogether: () => string;
}

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
  const [unreadChatCount, setUnreadChatCount] = useState<number>(() =>
    safeGetStorage('together_unread_chat', 0)
  );

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

  useEffect(() => {
    safeSetStorage('together_ai_messages', aiMessages);
  }, [aiMessages]);

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
          safeSetStorage('together_partner_messages', msgsData.messages);
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
