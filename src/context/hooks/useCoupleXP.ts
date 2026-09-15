import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { XPEntry, Achievement, PartnerId } from '../../types.ts';
import { initialAchievements } from '../../data/questionBank.ts';
import { getCoupleLevelInfo } from '../../utils/rankingEngine.ts';
import { safeGetStorage, safeSetStorage } from '../../utils/safeStorage.ts';

export interface UseCoupleXPReturn {
  coupleXP: number;
  setCoupleXP: React.Dispatch<React.SetStateAction<number>>;
  xpHistory: XPEntry[];
  setXpHistory: React.Dispatch<React.SetStateAction<XPEntry[]>>;
  coupleLevelInfo: ReturnType<typeof getCoupleLevelInfo>;
  achievements: Achievement[];
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  addCoupleXP: (points: number, reason: string, category?: XPEntry['category']) => void;
  triggerConfetti: () => void;
}

export function useCoupleXP(currentPartnerId: PartnerId): UseCoupleXPReturn {
  const [coupleXP, setCoupleXP] = useState<number>(() => {
    return safeGetStorage('together_couple_xp', 0);
  });

  const [xpHistory, setXpHistory] = useState<XPEntry[]>(() => {
    return safeGetStorage('together_xp_history', []);
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const data = safeGetStorage<Achievement[]>('together_achievements', initialAchievements);
    return Array.isArray(data) ? data : initialAchievements;
  });

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#F43F5E', '#FB7185', '#FDA4AF', '#F472B6'],
      });
    } catch {
      // ignore
    }
  }, []);

  const coupleLevelInfo = getCoupleLevelInfo(coupleXP);

  const addCoupleXP = useCallback(
    (points: number, reason: string, category: XPEntry['category'] = 'bonus') => {
      setCoupleXP((prev) => {
        const next = Math.max(0, prev + points);
        safeSetStorage('together_couple_xp', next);
        return next;
      });
      const entry: XPEntry = {
        id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        points,
        reason,
        category,
        timestamp: new Date().toISOString(),
        partnerId: currentPartnerId,
      };
      setXpHistory((prev) => {
        const updated = [entry, ...prev.slice(0, 49)];
        safeSetStorage('together_xp_history', updated);
        return updated;
      });
    },
    [currentPartnerId]
  );

  return {
    coupleXP,
    setCoupleXP,
    xpHistory,
    setXpHistory,
    coupleLevelInfo,
    achievements,
    setAchievements,
    addCoupleXP,
    triggerConfetti,
  };
}
