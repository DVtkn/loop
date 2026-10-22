import React from 'react';
import { ChevronRight, UserPlus, CalendarHeart } from 'lucide-react';
import { ColoredAvatar } from '../ColoredIcon.tsx';
import {
  getBatteryTier,
  getContextualCareSuggestion,
  findCarePresetByKey,
} from '../../utils/careBatteryEngine.ts';

export function formatRussianPlural(n: number, one: string, two: string, five: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return two;
  return five;
}

export function isMoodRecent(updatedAt?: string): boolean {
  if (!updatedAt) return false;
  try {
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const isSameDay = d.toDateString() === now.toDateString();
    const isWithin24Hours = now.getTime() - d.getTime() < 24 * 3600 * 1000;
    return isSameDay || isWithin24Hours;
  } catch {
    return false;
  }
}

export function formatDaysTogetherDetailed(startDateStr?: string): string | null {
  if (!startDateStr || !startDateStr.trim()) {
    return null;
  }
  try {
    const start = new Date(startDateStr);
    const now = new Date();
    if (isNaN(start.getTime())) return null;
    if (now < start) return '1 день вместе';

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

    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} ${formatRussianPlural(years, 'год', 'года', 'лет')}`);
    }
    if (months > 0) {
      parts.push(`${months} ${formatRussianPlural(months, 'месяц', 'месяца', 'месяцев')}`);
    }
    if (days > 0 || parts.length === 0) {
      parts.push(`${days} ${formatRussianPlural(days, 'день', 'дня', 'дней')}`);
    }

    return `${parts.join(' ')} вместе`;
  } catch {
    return null;
  }
}

export function getPartnerStatusDetails(partner: {
  name?: string;
  lastActiveAt?: string;
  gender?: string;
  login?: string;
}): {
  isOnline: boolean;
  statusText: string;
  badgeText: string;
} {
  if (!partner.lastActiveAt) {
    return {
      isOnline: false,
      statusText: 'Не в сети',
      badgeText: 'Офлайн',
    };
  }

  try {
    const last = new Date(partner.lastActiveAt);
    const now = new Date();
    if (isNaN(last.getTime())) {
      return {
        isOnline: false,
        statusText: 'Не в сети',
        badgeText: 'Офлайн',
      };
    }
    const diffMs = Math.max(0, now.getTime() - last.getTime());
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const isFemale = partner.gender === 'female';

    // В сети, если последняя активность была в течение 3 минут (180 секунд)
    if (diffSecs <= 180) {
      return {
        isOnline: true,
        statusText: 'В сети',
        badgeText: 'В сети',
      };
    }

    if (diffMins < 60) {
      const displayMins = Math.max(1, diffMins);
      return {
        isOnline: false,
        statusText: `${isFemale ? 'Была' : 'Был'} ${displayMins} ${formatRussianPlural(displayMins, 'минуту', 'минуты', 'минут')} назад`,
        badgeText: `${displayMins}м назад`,
      };
    }

    const isToday = last.toDateString() === now.toDateString();
    const time = last.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return {
        isOnline: false,
        statusText: `${isFemale ? 'Была' : 'Был'} сегодня в ${time}`,
        badgeText: time,
      };
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (last.toDateString() === yesterday.toDateString()) {
      return {
        isOnline: false,
        statusText: `${isFemale ? 'Была' : 'Был'} вчера в ${time}`,
        badgeText: 'Вчера',
      };
    }

    return {
      isOnline: false,
      statusText: `${isFemale ? 'Была' : 'Был'} ${last.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`,
      badgeText: 'Офлайн',
    };
  } catch {
    return {
      isOnline: false,
      statusText: 'Не в сети',
      badgeText: 'Офлайн',
    };
  }
}

interface PartnerStatusCardProps {
  isPaired: boolean;
  partnerName: string;
  safeOtherPartner: any;
  myPartner?: any;
  streakDaysCount?: number;
  partnerStatusInfo: {
    isOnline: boolean;
    statusText: string;
    badgeText: string;
  };
  coupleStartDate?: string;
  onOpenDetails: () => void;
  onGoToProfile: () => void;
  onSetStartDate?: () => void;
  onOpenMyStatus?: () => void;
}

export const PartnerStatusCard: React.FC<PartnerStatusCardProps> = ({
  isPaired,
  partnerName,
  safeOtherPartner,
  myPartner,
  streakDaysCount = 0,
  partnerStatusInfo,
  coupleStartDate,
  onOpenDetails,
  onGoToProfile,
  onSetStartDate,
  onOpenMyStatus,
}) => {
  if (!isPaired) {
    return (
      <section
        id="block-1-partner-status-empty"
        onClick={onGoToProfile}
        className="p-4 sm:p-5 rounded-[28px] bg-[var(--surface-solid)] border border-dashed border-[var(--divider)] shadow-xs flex items-center justify-between gap-3 transition-all hover:border-[var(--accent)]/50 hover:shadow-md cursor-pointer group select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">Пригласить половинку</div>
            <div className="text-xs sm:text-sm text-[var(--text-2)] font-medium">
              Свяжите аккаунты для совместных тестов и вопросов дня
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5 shrink-0" />
      </section>
    );
  }

  const formattedDays = formatDaysTogetherDetailed(coupleStartDate);
  const isPartnerMoodRecent = isMoodRecent(safeOtherPartner?.currentMood?.updatedAt);
  const isPartnerMoodSet = !!(safeOtherPartner?.currentMood?.label && isPartnerMoodRecent);
  const partnerEnergy =
    isPartnerMoodRecent && typeof safeOtherPartner?.currentMood?.energyLevel === 'number'
      ? safeOtherPartner.currentMood.energyLevel
      : undefined;
  const partnerCarePreset =
    isPartnerMoodRecent && safeOtherPartner?.currentMood?.careMode
      ? findCarePresetByKey(safeOtherPartner.currentMood.careMode)
      : undefined;

  const partnerBatteryTier = partnerEnergy !== undefined ? getBatteryTier(partnerEnergy) : null;
  const careSuggestion =
    partnerEnergy !== undefined
      ? getContextualCareSuggestion(
          partnerEnergy,
          safeOtherPartner?.currentMood?.careMode,
          partnerName
        )
      : null;

  const isMyMoodRecent = isMoodRecent(myPartner?.currentMood?.updatedAt);
  const myEnergy =
    isMyMoodRecent && typeof myPartner?.currentMood?.energyLevel === 'number'
      ? myPartner.currentMood.energyLevel
      : undefined;
  const myBatteryTier = myEnergy !== undefined ? getBatteryTier(myEnergy) : null;
  const myName = myPartner?.name || 'Я';

  return (
    <section
      id="block-1-partner-status"
      onClick={onOpenDetails}
      className="p-4 sm:p-5 rounded-[28px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-col justify-between transition-all cursor-pointer group select-none relative overflow-hidden"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/6 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3.5 w-full z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Couple Joy: Twin Connected Avatars with Pulse Link */}
          <div className="flex items-center shrink-0 relative">
            {/* My Avatar (clickable to set my status) */}
            <div
              className="relative z-10 cursor-pointer"
              onClick={(e) => {
                if (onOpenMyStatus) {
                  e.stopPropagation();
                  onOpenMyStatus();
                }
              }}
              title="Нажмите, чтобы настроить свой заряд и настроение"
            >
              <ColoredAvatar avatar={myPartner?.avatar || 'heart'} name={myName} size="md" />
              {myBatteryTier && (
                <span
                  className={`absolute -top-1 -left-1 px-1 py-0.2 rounded-full text-[9px] font-black border ring-1 ring-[var(--surface-solid)] ${myBatteryTier.badgeClass}`}
                >
                  {myBatteryTier.icon}
                </span>
              )}
            </div>

            {/* Connected Love Bridge Icon */}
            <div className="relative -mx-2 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-solid)] shadow-xs border border-[var(--accent)]/20">
              <span className="text-[11px] leading-none animate-pulse">💖</span>
            </div>

            {/* Partner Avatar with Online Indicator */}
            <div className="relative z-10">
              <ColoredAvatar avatar={safeOtherPartner.avatar || 'heart'} name={partnerName} size="md" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-[var(--surface-solid)] ${
                  partnerStatusInfo.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                }`}
              />
            </div>
          </div>

          {/* Partner Info & Together Timer */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Line 1: Partner Name + Online Status */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-[var(--text)] leading-tight">{partnerName}</span>
              <span className="text-[var(--text-3)] text-xs font-normal">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${partnerStatusInfo.isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                />
                <span className={partnerStatusInfo.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-2)]'}>
                  {partnerStatusInfo.statusText}
                </span>
              </span>
            </div>

            {/* Line 2: Partner Energy Battery Gauge / Mood / Days */}
            <div className="text-xs text-[var(--text-2)] flex items-center gap-1.5 flex-wrap">
              {partnerBatteryTier && partnerEnergy !== undefined ? (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${partnerBatteryTier.badgeClass}`}
                >
                  <span>{partnerBatteryTier.icon}</span>
                  <span>{partnerEnergy}%</span>
                  <span className="opacity-75 font-medium">{partnerBatteryTier.label}</span>
                </span>
              ) : null}

              {partnerCarePreset ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-2)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--divider)]">
                  <span>{partnerCarePreset.icon}</span>
                  <span>{partnerCarePreset.label}</span>
                </span>
              ) : null}

              {isPartnerMoodSet ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text)] font-medium bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--divider)]">
                  <span>{safeOtherPartner.currentMood.emoji || '✨'}</span>
                  <span className="text-[var(--accent)] font-semibold">{safeOtherPartner.currentMood.label}</span>
                </span>
              ) : null}

              {formattedDays ? (
                <span className="text-[11px] sm:text-xs text-[var(--text-2)] font-medium">
                  {formattedDays}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStartDate?.();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline font-medium cursor-pointer"
                >
                  <CalendarHeart className="w-3 h-3" />
                  <span>Дата начала</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick My Status + Streak Flame badge or Arrow */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {onOpenMyStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMyStatus();
              }}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-2)] hover:text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-2.5 py-1.5 rounded-xl border border-[var(--divider)] transition-all cursor-pointer active:scale-95"
              title="Указать мой заряд и настроение"
            >
              <span>{myEnergy !== undefined ? myBatteryTier?.icon : '🔋'}</span>
              <span>{myEnergy !== undefined ? `${myEnergy}%` : 'Мой заряд'}</span>
            </button>
          )}

          {streakDaysCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 shadow-2xs">
              <span>🔥</span>
              <span>{streakDaysCount} дн.</span>
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:bg-[var(--surface-blush)] flex items-center justify-center transition-all">
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Contextual Care Advice Banner */}
      {careSuggestion && (
        <div
          className={`w-full mt-2.5 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2.5 text-xs border transition-all z-10 ${
            careSuggestion.tier === 'rose'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-200'
              : careSuggestion.tier === 'amber'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{careSuggestion.actionIcon}</span>
            <div className="min-w-0">
              <span className="font-bold mr-1.5">Совет заботы: {careSuggestion.headline}.</span>
              <span className="opacity-90">{careSuggestion.advice}</span>
            </div>
          </div>
          <span className="text-[11px] font-bold shrink-0 opacity-90 hidden sm:inline-flex items-center gap-1">
            <span>{careSuggestion.actionLabel}</span>
            <span>→</span>
          </span>
        </div>
      )}

      {/* Mobile-only My Status Trigger row if not set */}
      {onOpenMyStatus && myEnergy === undefined && (
        <div className="flex md:hidden items-center justify-between pt-2 mt-2 border-t border-[var(--divider)]/60 text-xs text-[var(--text-2)] z-10">
          <span className="text-[11px]">Поделитесь своим уровнем энергии:</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMyStatus();
            }}
            className="text-[11px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>🔋 Указать мой заряд</span>
            <span>→</span>
          </button>
        </div>
      )}
    </section>
  );
};

