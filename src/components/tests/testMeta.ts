import { TestCategory } from '../../types.ts';

export interface TestEditorialMeta {
  emotionalTitle: string;
  categoryLabel: string;
  categoryKey: 'closeness' | 'communication' | 'values' | 'intimacy';
  categoryIcon: string;
  tagline: string;
  discoveryText: string;
  estimatedMinutes: number;
}

export const TEST_META_MAP: Record<string, TestEditorialMeta> = {
  'TEST-S2': {
    emotionalTitle: 'Твой персональный код любви',
    categoryLabel: 'Близость',
    categoryKey: 'closeness',
    categoryIcon: '💌',
    tagline: '5 языков любви · Гэри Чепмен',
    discoveryText: 'Кофе в постель, крепкие объятия или слова гордости: через что твоё сердце тает быстрее всего.',
    estimatedMinutes: 5,
  },
  'TEST-S1': {
    emotionalTitle: 'Как мы держимся друг за друга',
    categoryLabel: 'Близость',
    categoryKey: 'closeness',
    categoryIcon: '🛡️',
    tagline: 'Стили привязанности (ECR) · Джон Боулби',
    discoveryText: 'Что спасает тебя в стрессе: долгие объятия, 20 минут тишины или чашка чая без лишних вопросов.',
    estimatedMinutes: 5,
  },
  'TEST-S3': {
    emotionalTitle: 'Как мы ругаемся и миримся',
    categoryLabel: 'Общение',
    categoryKey: 'communication',
    categoryIcon: '🔥',
    tagline: 'Анатомия конфликтов · Институт Готтмана',
    discoveryText: 'Узнайте свои секретные антидоты к спорам, как экологично брать паузу и мириться за 15 минут.',
    estimatedMinutes: 6,
  },
  'TEST-C1': {
    emotionalTitle: 'Наш идеальный совместный день',
    categoryLabel: 'Ценности',
    categoryKey: 'values',
    categoryIcon: '✨',
    tagline: 'Синхронизация биоритмов & гедонизма',
    discoveryText: 'Валяться в кровати до полудня или бежать на сырники: смоделируйте ваш идеальный совместный уикенд.',
    estimatedMinutes: 4,
  },
  'TEST-S4': {
    emotionalTitle: 'Химия, дружба и надёжность',
    categoryLabel: 'Интимность',
    categoryKey: 'intimacy',
    categoryIcon: '💎',
    tagline: 'Треугольник любви · Роберт Стернберг',
    discoveryText: 'Живой баланс душевной искренности, романтической искры и уверенности в общем завтрашнем дне.',
    estimatedMinutes: 5,
  },
  'TEST-D1': {
    emotionalTitle: 'Бабушкин сервиз & наши правила',
    categoryLabel: 'Ценности',
    categoryKey: 'values',
    categoryIcon: '🏡',
    tagline: 'Семейные сценарии и родительские модели',
    discoveryText: 'Итальянские страсти, молчанка или диалог: как привычки из детства влияют на ваш уютный дом.',
    estimatedMinutes: 6,
  },
  'TEST-D2': {
    emotionalTitle: 'Спор из-за цвета обоев',
    categoryLabel: 'Общение',
    categoryKey: 'communication',
    categoryIcon: '⚔️',
    tagline: 'Стратегии выхода из споров · Томас-Килманн',
    discoveryText: 'Стоять на своём до победного, искать идеальный win-win или легко уступить ради мира в доме.',
    estimatedMinutes: 6,
  },
  'TEST-PT': {
    emotionalTitle: 'Анатомия наших характеров',
    categoryLabel: 'Ценности',
    categoryKey: 'values',
    categoryIcon: '🧩',
    tagline: 'Большая пятёрка личностных черт (Big Five)',
    discoveryText: 'Творческий хаос или списки по полочкам, жажда шумных тусовок или уютный домашний кокон.',
    estimatedMinutes: 5,
  },
};

export const CATEGORIES = [
  { id: 'all', label: 'Все', icon: '✦' },
  { id: 'closeness', label: 'Близость', icon: '♡' },
  { id: 'communication', label: 'Общение', icon: '✧' },
  { id: 'values', label: 'Ценности', icon: '★' },
  { id: 'intimacy', label: 'Интимность', icon: '♥' },
];

export const getTestMeta = (test: TestCategory): TestEditorialMeta => {
  return (
    TEST_META_MAP[test.id] || {
      emotionalTitle: test.title,
      categoryLabel: test.methodology === 'scientific' ? 'Близость' : 'Ценности',
      categoryKey: test.methodology === 'scientific' ? 'closeness' : 'values',
      categoryIcon: '✦',
      tagline: `${test.subtitle || test.title} · ${test.estimatedMinutes || 5} мин`,
      discoveryText: test.description || 'Пройдите тест вместе, чтобы лучше понимать друг друга.',
      estimatedMinutes: test.estimatedMinutes || 5,
    }
  );
};
