import { useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch } from '../../utils/api.ts';
import { TouchNotificationData, LoveTap, UserAccount, CoupleProfile, PartnerId } from '../../types.ts';
import { safeGetStorage, safeSetStorage, getUserStorageKey } from '../../utils/safeStorage.ts';

export interface UseCoupleTouchesProps {
  currentUser: UserAccount | null;
  coupleProfile: CoupleProfile;
  currentPartnerId: PartnerId;
  addFeedItem: (item: { author: PartnerId; type: 'flame' | 'heart' | 'sparkle'; title: string; subtitle: string }) => void;
  addCoupleXP: (points: number, reason: string, category: 'tap') => void;
  triggerConfetti: () => void;
  playNotificationSound: () => void;
  dispatchInAppNotification: (notif: { title: string; body: string; icon?: string }) => void;
}

export interface UseCoupleTouchesReturn {
  activePartnerTouch: TouchNotificationData | null;
  setActivePartnerTouch: React.Dispatch<React.SetStateAction<TouchNotificationData | null>>;
  dismissPartnerTouch: () => void;
  handleIncomingTouch: (touchData: TouchNotificationData) => void;
  sendTouchAction: (
    actionType: string,
    options?: {
      title?: string;
      customNote?: string;
      subtitle?: string;
      icon?: string;
      iconBg?: string;
      iconColor?: string;
    }
  ) => Promise<{ success: boolean; throttled?: boolean; message?: string }>;
  loveTaps: LoveTap[];
  sendLoveTap: (tapType: LoveTap['tapType'], customNote?: string) => void;
  lastHandledTouchIdsRef: React.MutableRefObject<Set<string>>;
}

export function useCoupleTouches({
  currentUser,
  coupleProfile,
  currentPartnerId,
  addFeedItem,
  addCoupleXP,
  triggerConfetti,
  playNotificationSound,
  dispatchInAppNotification,
}: UseCoupleTouchesProps): UseCoupleTouchesReturn {
  const userLogin = currentUser?.login;
  const loveTapsKey = getUserStorageKey('together_love_taps', userLogin);
  const loadedLoginRef = useRef<string | undefined | null>(userLogin);

  const [activePartnerTouch, setActivePartnerTouch] = useState<TouchNotificationData | null>(null);
  const [loveTaps, setLoveTaps] = useState<LoveTap[]>(() => {
    return safeGetStorage(loveTapsKey, []);
  });

  const lastHandledTouchIdsRef = useRef<Set<string>>(new Set());
  const lastTouchTimestampsRef = useRef<Record<string, number>>({});
  const touchAutoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loadedLoginRef.current === userLogin) return;
    loadedLoginRef.current = userLogin;

    setActivePartnerTouch(null);
    lastHandledTouchIdsRef.current.clear();
    lastTouchTimestampsRef.current = {};
    if (touchAutoDismissTimerRef.current) {
      clearTimeout(touchAutoDismissTimerRef.current);
      touchAutoDismissTimerRef.current = null;
    }

    if (!userLogin) {
      setLoveTaps([]);
    } else {
      const saved = safeGetStorage<LoveTap[]>(loveTapsKey, []);
      setLoveTaps(Array.isArray(saved) ? saved : []);
    }
  }, [userLogin, loveTapsKey]);

  const dismissPartnerTouch = useCallback(() => {
    setActivePartnerTouch(null);
    if (touchAutoDismissTimerRef.current) {
      clearTimeout(touchAutoDismissTimerRef.current);
      touchAutoDismissTimerRef.current = null;
    }
  }, []);

  const handleIncomingTouch = useCallback(
    (touchData: TouchNotificationData) => {
      if (!touchData || !touchData.id) return;
      if (lastHandledTouchIdsRef.current.has(touchData.id)) return;
      lastHandledTouchIdsRef.current.add(touchData.id);

      setActivePartnerTouch(touchData);
      playNotificationSound();

      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 150]);
        }
      } catch {
        // ignore
      }

      dispatchInAppNotification({
        title: touchData.title || `${touchData.senderName} послал(а) вам знак внимания`,
        body: touchData.subtitle || touchData.customNote || 'Нажмите, чтобы ответить взаимностью',
        icon: 'heart',
      });

      if (touchAutoDismissTimerRef.current) {
        clearTimeout(touchAutoDismissTimerRef.current);
      }
      touchAutoDismissTimerRef.current = setTimeout(() => {
        setActivePartnerTouch(null);
      }, 7000);
    },
    [playNotificationSound, dispatchInAppNotification]
  );

  const sendTouchAction = async (
    actionType: string,
    options?: {
      title?: string;
      customNote?: string;
      subtitle?: string;
      icon?: string;
      iconBg?: string;
      iconColor?: string;
    }
  ): Promise<{ success: boolean; throttled?: boolean; message?: string }> => {
    const senderName =
      currentUser?.name || (currentPartnerId === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name);
    const senderLogin = (
      currentUser?.login || (currentPartnerId === 'partner1' ? coupleProfile.partner1.login : coupleProfile.partner2.login) || ''
    )
      .toLowerCase()
      .replace(/^@/, '');

    const targetLogin = (
      currentUser?.partnerLogin || (currentPartnerId === 'partner1' ? coupleProfile.partner2.login : coupleProfile.partner1.login) || ''
    )
      .toLowerCase()
      .replace(/^@/, '');

    const now = Date.now();
    const lastTime = lastTouchTimestampsRef.current[actionType] || 0;
    if (now - lastTime < 10000) {
      return { success: false, throttled: true, message: 'Действие уже отправлено недавно' };
    }
    lastTouchTimestampsRef.current[actionType] = now;

    let defaultTitle = `${senderName} обратил(а) на вас внимание`;
    let defaultSubtitle = 'Быстрое внимание';
    let defaultIcon = 'heart';
    let defaultIconBg = 'bg-rose-500/10';
    let defaultIconColor = 'text-rose-500';

    if (actionType === 'hug') {
      defaultTitle = `${senderName} обнял(а) вас`;
      defaultSubtitle = 'Крепкое и тёплое объятие ❤️';
      defaultIcon = 'heart';
      defaultIconBg = 'bg-rose-500/15';
      defaultIconColor = 'text-rose-500';
    } else if (actionType === 'thinking') {
      defaultTitle = `${senderName} думает о вас`;
      defaultSubtitle = 'Нежный знак заботы ✨';
      defaultIcon = 'sparkles';
      defaultIconBg = 'bg-amber-500/15';
      defaultIconColor = 'text-amber-500';
    } else if (actionType === 'miss') {
      defaultTitle = `${senderName} скучает по вам`;
      defaultSubtitle = 'Очень скучает прямо сейчас 💌';
      defaultIcon = 'heart';
      defaultIconBg = 'bg-pink-500/15';
      defaultIconColor = 'text-pink-500';
    } else if (actionType === 'kiss') {
      defaultTitle = `${senderName} отправил(а) нежный поцелуй`;
      defaultSubtitle = 'Нежный поцелуй 💋';
      defaultIcon = 'flame';
      defaultIconBg = 'bg-red-500/15';
      defaultIconColor = 'text-red-500';
    } else if (actionType === 'appreciated' || actionType === 'grateful') {
      defaultTitle = `${senderName} благодарит вас`;
      defaultSubtitle = 'За вашу любовь и заботу 🌿';
      defaultIcon = 'thumbs-up';
      defaultIconBg = 'bg-emerald-500/15';
      defaultIconColor = 'text-emerald-500';
    } else if (actionType === 'support') {
      defaultTitle = `${senderName} нуждается в поддержке`;
      defaultSubtitle = 'Тёплое дружеское плечо 🫂';
      defaultIcon = 'lifebuoy';
      defaultIconBg = 'bg-indigo-500/15';
      defaultIconColor = 'text-indigo-500';
    }

    const finalTitle = options?.title || defaultTitle;
    const finalSubtitle = options?.customNote || options?.subtitle || defaultSubtitle;
    const finalIcon = options?.icon || defaultIcon;
    const finalIconBg = options?.iconBg || defaultIconBg;
    const finalIconColor = options?.iconColor || defaultIconColor;

    addFeedItem({
      author: currentPartnerId,
      type: actionType === 'kiss' ? 'flame' : 'heart',
      title: finalTitle,
      subtitle: finalSubtitle,
    });

    addCoupleXP(5, `Быстрое внимание: ${finalTitle}`, 'tap');
    triggerConfetti();

    try {
      const res = await apiFetch('/api/couple/touch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderLogin,
          senderName,
          targetLogin: targetLogin || 'partner2',
          actionType,
          title: finalTitle,
          subtitle: finalSubtitle,
          icon: finalIcon,
          iconBg: finalIconBg,
          iconColor: finalIconColor,
          customNote: options?.customNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.throttled) {
          return { success: false, throttled: true, message: data.message };
        }
      }
    } catch {
      // offline fallback
    }

    return { success: true, throttled: false };
  };

  const sendLoveTap = (tapType: LoveTap['tapType'], customNote?: string) => {
    const tapConfig: Record<LoveTap['tapType'], { label: string; emoji: string; title: string }> = {
      thinking: { label: 'Думаю о тебе', emoji: 'lightbulb', title: 'думает о вас прямо сейчас' },
      miss: { label: 'Скучаю', emoji: 'clock', title: 'очень скучает по вам' },
      support: { label: 'Нужна поддержка', emoji: 'lifebuoy', title: 'нуждается в вашей поддержке' },
      proud: { label: 'Горжусь тобой', emoji: 'award', title: 'гордится вашими успехами' },
      grateful: { label: 'Ценю тебя', emoji: 'heart', title: 'чувствует огромную благодарность к вам' },
      talk: { label: 'Хочу поговорить', emoji: 'message', title: 'хочет услышать ваш голос' },
    };

    const config = tapConfig[tapType] || tapConfig.thinking;
    const senderName =
      currentUser?.name || (currentPartnerId === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name);
    const senderLogin = currentUser?.login || (currentPartnerId === 'partner1' ? coupleProfile.partner1.login : coupleProfile.partner2.login) || '';

    const newTap: LoveTap = {
      id: `tap-${Date.now()}`,
      senderLogin,
      senderName,
      tapType,
      tapLabel: config.label,
      emoji: config.emoji,
      note: customNote,
      createdAt: new Date().toISOString(),
    };

    setLoveTaps((prev) => {
      const updated = [newTap, ...prev.slice(0, 29)];
      safeSetStorage(loveTapsKey, updated);
      return updated;
    });

    sendTouchAction(tapType, {
      title: `${senderName} ${config.title}`,
      subtitle: customNote || config.label,
      customNote,
    });
  };

  return {
    activePartnerTouch,
    setActivePartnerTouch,
    dismissPartnerTouch,
    handleIncomingTouch,
    sendTouchAction,
    loveTaps,
    sendLoveTap,
    lastHandledTouchIdsRef,
  };
}
