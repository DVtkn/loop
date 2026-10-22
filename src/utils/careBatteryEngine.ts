import {
  CareModePresetKey,
  CareModePreset,
  ContextualCareSuggestion,
} from '../types.ts';

export interface BatteryTierInfo {
  tier: 'emerald' | 'amber' | 'rose';
  color: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  barClass: string;
  gradientClass: string;
  label: string;
  icon: string;
}

export const CARE_MODE_PRESETS: CareModePreset[] = [
  {
    key: 'full_energy',
    label: 'Полон(на) энергии',
    defaultEnergy: 95,
    icon: '⚡',
    description: 'Заряд на максимуме: готовность сворачивать горы, творить и делить драйв!',
  },
  {
    key: 'adventure',
    label: 'Готов(а) к приключениям',
    defaultEnergy: 80,
    icon: '🚀',
    description: 'Игривый настрой, спонтанные идеи и открытость к ярким совместным планам.',
  },
  {
    key: 'low_battery',
    label: 'Низкий заряд / Тихий вечер',
    defaultEnergy: 25,
    icon: '🪫',
    description: 'Батарейка на исходе: нужен покой, плед, тёплый чай и отсутствие суеты.',
  },
  {
    key: 'need_hugs',
    label: 'Нужны обнимашки / Без лишних вопросов',
    defaultEnergy: 15,
    icon: '🫂',
    description: 'Уязвимость и эмоциональная усталость: просто побудьте рядом и крепко обнимите.',
  },
];

export const CARE_MODE_PRESETS_MAP: Record<CareModePresetKey, CareModePreset> = {
  full_energy: CARE_MODE_PRESETS[0],
  adventure: CARE_MODE_PRESETS[1],
  low_battery: CARE_MODE_PRESETS[2],
  need_hugs: CARE_MODE_PRESETS[3],
};

export function findCarePresetByKey(key?: string | null): CareModePreset | undefined {
  if (!key) return undefined;
  return CARE_MODE_PRESETS.find((p) => p.key === key || p.label === key);
}

export function getBatteryTier(level: number): BatteryTierInfo {
  const clamped = Math.max(0, Math.min(100, Math.round(isNaN(level) ? 50 : level)));

  if (clamped >= 70) {
    return {
      tier: 'emerald',
      color: '#10B981',
      textClass: 'text-emerald-500',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/30',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      barClass: 'bg-emerald-500',
      gradientClass: 'from-emerald-500 to-teal-400',
      label: 'Высокий заряд',
      icon: '⚡',
    };
  }

  if (clamped >= 40) {
    return {
      tier: 'amber',
      color: '#F59E0B',
      textClass: 'text-amber-500',
      bgClass: 'bg-amber-500/15',
      borderClass: 'border-amber-500/30',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      barClass: 'bg-amber-500',
      gradientClass: 'from-amber-500 to-yellow-400',
      label: 'Ровный заряд',
      icon: '🔋',
    };
  }

  return {
    tier: 'rose',
    color: '#F43F5E',
    textClass: 'text-rose-500',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/30',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barClass: 'bg-rose-500',
    gradientClass: 'from-rose-500 to-pink-500',
    label: 'Низкий заряд',
    icon: '🪫',
  };
}

export function getContextualCareSuggestion(
  level: number,
  careMode?: string,
  partnerName?: string
): ContextualCareSuggestion {
  const clamped = Math.max(0, Math.min(100, Math.round(isNaN(level) ? 50 : level)));
  const name = partnerName?.trim() || 'Партнёр';
  const preset = findCarePresetByKey(careMode);
  const modeKey = preset?.key || careMode;

  // 1. Extreme low / need hugs
  if (modeKey === 'need_hugs' || (modeKey === undefined && clamped < 20)) {
    return {
      headline: `${name} нуждается в бережном тепле`,
      advice:
        'Слова сейчас излишни. Заварите горячий чай, укутайте в плед, обнимите молча и снимите бытовую нагрузку на вечер.',
      actionLabel: 'Отправить крепкие объятия',
      actionIcon: '🫂',
      tier: 'rose',
    };
  }

  // 2. Low battery
  if (modeKey === 'low_battery' || (modeKey === undefined && clamped < 40)) {
    return {
      headline: `У ${name === 'Партнёр' ? 'партнёра' : name} режим энергосбережения`,
      advice:
        'Батарейка на исходе после насыщенного дня. Включите уютный сериал, зажгите свечи или дайте полчаса тишины для восстановления.',
      actionLabel: 'Предложить тихий вечер',
      actionIcon: '🍵',
      tier: 'rose',
    };
  }

  // 3. Full energy (95%)
  if (modeKey === 'full_energy' || (modeKey === undefined && clamped >= 90)) {
    return {
      headline: `${name} полон(на) сил и вдохновения`,
      advice:
        'Отличное время поделиться смелыми планами, устроить активный вечер или вместе заняться любимым хобби.',
      actionLabel: 'Поддержать драйв',
      actionIcon: '⚡',
      tier: 'emerald',
    };
  }

  // 4. Ready for adventure (80%)
  if (modeKey === 'adventure' || (modeKey === undefined && clamped >= 70)) {
    return {
      headline: `${name} на пике энергии и жаждет впечатлений!`,
      advice:
        'Идеальный момент для яркого свидания, спонтанной прогулки по городу, совместной игры или нового ресторанчика.',
      actionLabel: 'Позвать на свидание',
      actionIcon: '🚀',
      tier: 'emerald',
    };
  }

  // 5. Balanced / Moderate
  return {
    headline: 'Комфортный и стабильный ритм',
    advice: `У ${name === 'Партнёр' ? 'партнёра' : name} ровное, спокойное состояние. Прекрасное время для душевного разговора за ужином или лёгкой вечерней прогулки.`,
    actionLabel: 'Предложить тёплый ужин',
    actionIcon: '☕',
    tier: 'amber',
  };
}
