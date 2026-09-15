import {
  CoupleProfile,
  PulseEntry,
  Challenge,
  TestCategory,
  SmallCraving,
  FlowerPreference,
  WishlistItem,
  Venue,
  DateInvite,
  MoodHistoryItem,
  Achievement,
  Gender,
} from '../types';

export function createFreshCoupleProfile(
  partner1Name: string = 'Партнёр 1',
  partner2Name: string = 'Партнёр 2',
  startDate: string = '',
  city: string = 'Москва',
  gender1?: Gender,
  gender2?: Gender,
  partner1Login?: string,
  partner2Login?: string
): CoupleProfile {
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const cleanLogin1 = partner1Login ? partner1Login.toLowerCase().replace(/^@/, '').trim() : '';
  const cleanLogin2 = partner2Login ? partner2Login.toLowerCase().replace(/^@/, '').trim() : '';

  return {
    id: 'c-' + Date.now(),
    status: 'ACTIVE',
    linkCode: `LOOP-${randomCode}`,
    startDate: startDate || '',
    city: city || 'Москва',
    level: 1,
    levelName: 'Первый шаг',
    testsCompletedCount: 0,
    partner1: {
      id: 'partner1',
      name: partner1Name.trim() || 'Партнёр 1',
      avatar: gender1 === 'male' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      email: '',
      login: cleanLogin1 || ('p1_' + Math.random().toString(36).substring(7)),
      gender: gender1,
      birthDate: '',
      loveLanguage: 'Пройдите тест',
      attachmentStyle: 'Пройдите тест ECR',
      currentMood: undefined,
    },
    partner2: {
      id: 'partner2',
      name: partner2Name.trim() || 'Партнёр 2',
      avatar: gender2 === 'male' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      email: '',
      login: cleanLogin2 || ('p2_' + Math.random().toString(36).substring(7)),
      gender: gender2,
      birthDate: '',
      loveLanguage: 'Пройдите тест',
      attachmentStyle: 'Пройдите тест ECR',
      currentMood: undefined,
    },
  };
}

export function getFreshTests(): TestCategory[] {
  return initialTests.map((t) => ({
    ...t,
    partner1Done: false,
    partner2Done: false,
    isCompletedByMe: false,
    isCompletedByPartner: false,
    myAnswersCount: 0,
    partnerAnswersCount: 0,
    partner1Answers: undefined,
    partner2Answers: undefined,
    completedAt: undefined,
  }));
}

export function getFreshChallenges(): Challenge[] {
  return initialChallenges.map((c) => ({
    ...c,
    partner1Completed: false,
    partner2Completed: false,
    completedAt: undefined,
  }));
}

export const initialCoupleProfile: CoupleProfile = {
  id: 'c-7729',
  status: 'ACTIVE',
  linkCode: 'TOGETHER-7492',
  startDate: '',
  city: 'Москва',
  level: 1,
  levelName: 'Первый шаг',
  testsCompletedCount: 0,
  partner1: {
    id: 'partner1',
    name: 'Партнёр 1',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: '',
    login: '',
    birthDate: '',
    loveLanguage: 'Пройдите тест',
    attachmentStyle: 'Пройдите тест',
    currentMood: undefined,
  },
  partner2: {
    id: 'partner2',
    name: 'Партнёр 2',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    email: '',
    login: '',
    birthDate: '',
    loveLanguage: 'Пройдите тест',
    attachmentStyle: 'Пройдите тест',
    currentMood: undefined,
  },
};

export const initialPulseHistory: PulseEntry[] = [];

export const initialChallenges: Challenge[] = [
  {
    id: 'ch-1',
    title: '20 минут «Бесшумного свидания»',
    description: 'Выпейте вместе чай или вино без телефонов и ноутбуков, глядя друг другу в глаза и делясь 3 благодарностями за неделю.',
    category: 'intimacy',
    week: 34,
    partner1Completed: false,
    partner2Completed: false,
    rewardPoints: 50,
  },
  {
    id: 'ch-2',
    title: 'Практика «Мягкого старта» по Готтману',
    description: 'Если возникнет просьба или недовольство, начните фразу со слов: «Мне важно...» или «Я чувствую...», избегая обвинительного «Ты всегда...».',
    category: 'gottman',
    week: 34,
    partner1Completed: false,
    partner2Completed: false,
    rewardPoints: 75,
  },
  {
    id: 'ch-3',
    title: 'Микро-сюрприз на языке любви партнёра',
    description: 'Сделайте маленькое действие, которое попадает в главный язык любви вашего партнёра (записка с комплиментом или неожиданный кофе).',
    category: 'communication',
    week: 33,
    partner1Completed: false,
    partner2Completed: false,
    rewardPoints: 50,
  },
];

export const initialTests: TestCategory[] = [
  // S1: Стили привязанности
  {
    id: 'TEST-S1',
    slug: 'attachment-style',
    title: 'Стили привязанности (ECR)',
    subtitle: 'Как вы строите близость и реагируете на дистанцию',
    methodology: 'scientific',
    categoryKey: 'attachment',
    levelRequired: 1,
    estimatedMinutes: 5,
    questionsCount: 6,
    description: 'Определяет паттерны эмоциональной безопасности и автономии по методике Джона Боулби. Помогает понять ваши реакции на дистанцию и точки уязвимости.',
    scientificBasis: 'Методика Experiences in Close Relationships (ECR-R) & Теория Боулби',
    iconName: 'ShieldHeart',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s1-1',
        text: 'Когда партнёр возвращается домой уставшим и погружён в свои мысли, почти не разговаривая:',
        type: 'single',
        options: [
          { label: 'Мне важно сразу уточнить, всё ли в порядке между нами, чтобы успокоиться', value: 'anxiety_check', categoryScores: { anxiety: 5, security: 2 }, scaleId: 'c_closeness' },
          { label: 'Даю партнёру тихое пространство для отдыха и спокойно занимаюсь своими делами', value: 'secure_space', categoryScores: { security: 5, avoidance: 1 }, scaleId: 'a_autonomy' },
          { label: 'Чувствую лёгкий холод и тоже эмоционально отстраняюсь, ожидая его инициативы', value: 'avoidant_pullback', categoryScores: { avoidance: 5, anxiety: 2 }, scaleId: 'e_safety' },
          { label: 'Предлагаю практическую заботу: налить чай или приготовить ужин без лишних вопросов', value: 'practical_care', categoryScores: { security: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s1-2',
        text: 'Когда я переживаю сильный стресс или уязвимость из-за личных трудностей:',
        type: 'single',
        options: [
          { label: 'Мне важнее всего сразу выговориться партнёру и получить тёплое сочувствие', value: 'need_empathy', categoryScores: { security: 5, anxiety: 3 }, scaleId: 'c_closeness' },
          { label: 'Сначала проживаю эмоции наедине с собой, чтобы не перегружать любимого человека', value: 'need_solitude', categoryScores: { avoidance: 4, security: 3 }, scaleId: 'a_autonomy' },
          { label: 'Хочу вместе структурировать ситуацию и найти пошаговый план решения', value: 'rational_plan', categoryScores: { security: 4 }, scaleId: 'r_repair' },
          { label: 'Мне непросто открыться первым(ой), поэтому жду деликатного вопроса от партнёра', value: 'wait_for_invite', categoryScores: { anxiety: 4, avoidance: 3 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s1-3',
        text: 'Во время эмоционального разногласия, когда накал чувств начинает расти:',
        type: 'single',
        options: [
          { label: 'Мне необходимо взять паузу на 15–20 минут в тишине, чтобы остыть и собраться с мыслями', value: 'need_timeout', categoryScores: { avoidance: 4, security: 4 }, scaleId: 'a_autonomy' },
          { label: 'Мне трудно переносить паузу — хочется договорить и вернуть душевный контакт сразу', value: 'immediate_contact', categoryScores: { anxiety: 5, security: 2 }, scaleId: 'c_closeness' },
          { label: 'Предлагаю снизить тон и по пунктам разобрать, в чём именно наши разногласия', value: 'calm_analysis', categoryScores: { security: 5 }, scaleId: 'r_repair' },
          { label: 'Стараюсь обнять партнёра или сказать что-то тёплое, чтобы снять остроту момента', value: 'warm_soothing', categoryScores: { security: 4, anxiety: 2 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s1-4',
        text: 'Если предстоит провести несколько дней в разлуке или без регулярной связи:',
        type: 'single',
        options: [
          { label: 'Чувствую спокойствие и уверенность, зная, что мысленно мы рядом', value: 'inner_calm', categoryScores: { security: 5 }, scaleId: 'e_safety' },
          { label: 'Ценю возможность полностью погрузиться в свои дела, проекты и хобби', value: 'enjoy_autonomy', categoryScores: { avoidance: 3, security: 4 }, scaleId: 'a_autonomy' },
          { label: 'Мне важно получать хотя бы короткие тёплые весточки утром и перед сном', value: 'daily_pings', categoryScores: { anxiety: 4, security: 3 }, scaleId: 'c_closeness' },
          { label: 'С увлечением планирую сценарий нашей встречи и совместных выходных по возвращении', value: 'plan_reunion', categoryScores: { security: 4 }, scaleId: 'v_future' },
        ],
      },
      {
        id: 'q-s1-5',
        text: 'Когда партнёр проявляет инициативу и подробно планирует наше совместное время:',
        type: 'single',
        options: [
          { label: 'С радостью принимаю инициативу, для меня ценны общее время и вовлечённость', value: 'welcome_closeness', categoryScores: { security: 4, anxiety: 2 }, scaleId: 'c_closeness' },
          { label: 'Обязательно прошу оставить в графике несколько свободных часов только для себя', value: 'need_private_space', categoryScores: { avoidance: 4, security: 4 }, scaleId: 'a_autonomy' },
          { label: 'Вместе корректирую маршрут, распределяя активности так, чтобы каждому было комфортно', value: 'shared_planning', categoryScores: { security: 5 }, scaleId: 'r_repair' },
          { label: 'Главное, чтобы программа была спокойной и не создавала чувства спешки', value: 'gentle_pace', categoryScores: { security: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s1-6',
        text: 'Что в первую очередь создаёт для вас ощущение надёжного фундамента в союзе?',
        type: 'single',
        options: [
          { label: 'Знание, что при любых жизненных штормах мы остаёмся одной сплочённой командой', value: 'team_bond', categoryScores: { security: 5 }, scaleId: 'e_safety' },
          { label: 'Взаимное уважение к личному ритму, границам и интересам каждого', value: 'mutual_respect', categoryScores: { security: 5, avoidance: 2 }, scaleId: 'a_autonomy' },
          { label: 'Ежедневная нежность, искренний интерес к чувствам друг друга и тактильность', value: 'daily_warmth', categoryScores: { security: 5, anxiety: 2 }, scaleId: 'c_closeness' },
          { label: 'Понятные общие жизненные ориентиры, финансовая стабильность и планы', value: 'shared_horizons', categoryScores: { security: 5 }, scaleId: 'v_future' },
        ],
      },
    ],
  },

  // S2: Пять языков любви
  {
    id: 'TEST-S2',
    slug: 'five-love-languages',
    title: 'Пять языков любви',
    subtitle: 'Как вы понимаете и дарите любовь',
    methodology: 'scientific',
    categoryKey: 'intimacy',
    levelRequired: 1,
    estimatedMinutes: 6,
    questionsCount: 6,
    description: 'Диагностика по Гэри Чепмену: Слова поддержки, Качественное время, Подарки, Акты заботы, Физические прикосновения.',
    scientificBasis: 'Концепция пяти языков любви Гэри Чепмена',
    iconName: 'HeartHandshake',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s2-1',
        text: 'После напряжённого рабочего дня наибольшее облегчение приносит:',
        type: 'single',
        options: [
          { label: 'Искренние слова поддержки: «Ты отлично справился(лась), я горжусь тобой»', value: 'words', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: 'Свежезаваренный чай, вкусный ужин или решение бытовой мелочи за меня', value: 'acts', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
          { label: 'Крепкие долгие объятия и физическое тепло без лишних слов', value: 'touch', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: 'Возможность неспешно посидеть вдвоём и поговорить обо всём без телефонов', value: 'time', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: 'Маленький любимый десерт или приятный неожиданный сюрприз', value: 'gifts', categoryScores: { gifts: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s2-2',
        text: 'Какое проявление в поведении партнёра ранит сильнее всего?',
        type: 'single',
        options: [
          { label: 'Резкие, критические или обесценивающие слова', value: 'words_hurt', categoryScores: { words: 5 }, scaleId: 'r_repair' },
          { label: 'Постоянное зависание в телефоне во время нашего совместного времени', value: 'time_hurt', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: 'Физическая отстранённость и отсутствие ласковых прикосновений', value: 'touch_hurt', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: 'Забытые бытовые обещания и равнодушие к моим просьбам о помощи', value: 'acts_hurt', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
          { label: 'Игнорирование памятных для нашей пары дат и важных моментов', value: 'gifts_hurt', categoryScores: { gifts: 5 }, scaleId: 'v_future' },
        ],
      },
      {
        id: 'q-s2-3',
        text: 'Идеальное проявление внимания для меня — это:',
        type: 'single',
        options: [
          { label: 'Билеты на долгожданное совместное событие или совместная поездка', value: 'time', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: 'Вещь, которую я давно хотел(а) и о которой невзначай упомянул(а)', value: 'gifts', categoryScores: { gifts: 5 }, scaleId: 'c_closeness' },
          { label: 'Трогательное письмо или искреннее признание в чувствах', value: 'words', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: 'Сеанс расслабляющего массажа или вечер в спа вдвоём', value: 'touch', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: 'Полная организация сложного бытового вопроса, снявшая с меня груз', value: 'acts', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s2-4',
        text: 'Когда любимый человек спонтанно проявляет нежность в разгар обычного дня:',
        type: 'single',
        options: [
          { label: 'Мягкое прикосновение к плечу или руке мгновенно дарит чувство тепла и защиты', value: 'touch_flow', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: 'Короткое сообщение «Думаю о тебе» окрыляет и заряжает энергией на весь день', value: 'words_flow', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: 'Привезённый без повода любимый кофе или свежие фрукты показывают настоящую чуткость', value: 'gifts_flow', categoryScores: { gifts: 4, acts: 4 }, scaleId: 'e_safety' },
          { label: 'Предложение отложить дела на 15 минут и просто попить чай вдвоём наполняет близостью', value: 'time_flow', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s2-5',
        text: 'Какое действие партнёра вызывает самое глубокое чувство признательности?',
        type: 'single',
        options: [
          { label: 'Когда он(а) берёт на себя рутинную обязанность, видя мою сильную усталость', value: 'acts_hero', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
          { label: 'Когда он(а) внимательно слушает меня, не перебивая и искренне сопереживая', value: 'time_hero', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: 'Когда он(а) вслух отмечает мои сильные стороны перед важным для меня событием', value: 'words_hero', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: 'Когда он(а) бережно обнимает в момент растерянности, давая ощущение опоры', value: 'touch_hero', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s2-6',
        text: 'Распределите ровно 10 баллов между языками заботы по степени их ценности для вас:',
        type: 'trade_off',
        totalPoints: 10,
        options: [],
        tradeOffItems: [
          { id: 'words', label: 'Слова поддержки и признания', scaleId: 'c_closeness' },
          { id: 'time', label: 'Качественное совместное время', scaleId: 'c_closeness' },
          { id: 'acts', label: 'Практическая помощь и забота', scaleId: 'e_safety' },
          { id: 'touch', label: 'Нежность и тактильный контакт', scaleId: 'c_closeness' },
        ],
      },
    ],
  },

  // S3: Четыре всадника Готтмана
  {
    id: 'TEST-S3',
    slug: 'gottman-four-horsemen',
    title: 'Четыре всадника Готтмана',
    subtitle: 'Паттерны коммуникации в разногласиях',
    methodology: 'scientific',
    categoryKey: 'conflicts',
    levelRequired: 2,
    estimatedMinutes: 7,
    questionsCount: 5,
    description: 'Анализирует динамику диалога в моменты напряжения: управление эмоциями, бережный тайм-аут и конструктивные шаги к согласию.',
    scientificBasis: 'Исследования Джона Готтмана (Gottman Institute)',
    iconName: 'Flame',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s3-1',
        text: 'Когда привычное бытовое действие партнёра вызывает у меня нарастающее раздражение:',
        type: 'single',
        options: [
          { label: 'Мягко описываю конкретную ситуацию и своё чувство: «Мне непросто, когда...»', value: 'soft_startup', categoryScores: { softness: 5, responsibility: 4 }, scaleId: 'r_repair' },
          { label: 'Держу в себе до последнего, но в момент усталости могу высказать накопившиеся эмоции', value: 'bottle_up', categoryScores: { criticism: 4, softness: 1 }, scaleId: 'e_safety' },
          { label: 'Молча исправляю ситуацию сам(а), стараясь не провоцировать лишний разговор', value: 'silent_fix', categoryScores: { avoidance: 3, softness: 3 }, scaleId: 'a_autonomy' },
          { label: 'Предлагаю установить прозрачное совместное правило, чтобы этот вопрос не повторялся', value: 'structural_rule', categoryScores: { responsibility: 5 }, scaleId: 'r_repair' },
        ],
      },
      {
        id: 'q-s3-2',
        text: 'Когда партнёр делится тем, что его задел мой поступок или неосторожная фраза:',
        type: 'single',
        options: [
          { label: 'Сначала подробно объясняю свою логику и объективные обстоятельства, почему так вышло', value: 'defensiveness', categoryScores: { defensiveness: 4, responsibility: 2 }, scaleId: 'a_autonomy' },
          { label: 'Фокусируюсь на чувствах партнёра и уточняю, что именно ранило сильнее всего', value: 'empathy_validation', categoryScores: { responsibility: 5, respect: 5 }, scaleId: 'r_repair' },
          { label: 'Беру короткую паузу, чтобы переварить услышанное и не реагировать на первой волне эмоций', value: 'calm_pause', categoryScores: { stonewalling: 2, responsibility: 4 }, scaleId: 'e_safety' },
          { label: 'Стараюсь сразу обнять или разрядить обстановку доброй улыбкой', value: 'warm_deescalate', categoryScores: { softness: 4, respect: 4 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s3-3',
        text: 'Если во время сложного разговора эмоции накаляются и пульс учащается:',
        type: 'single',
        options: [
          { label: 'Предлагаю сделать 20-минутную паузу на воду и договориться о точном времени возвращения', value: 'gottman_break', categoryScores: { responsibility: 5, respect: 5 }, scaleId: 'r_repair' },
          { label: 'Стремлюсь продолжать беседу, чтобы не оставлять повисшей недосказанности', value: 'push_forward', categoryScores: { anxiety: 4, softness: 2 }, scaleId: 'c_closeness' },
          { label: 'Умолкаю и внутренне отстраняюсь, пережидая пик напряжения', value: 'stonewall_shield', categoryScores: { stonewalling: 4, avoidance: 4 }, scaleId: 'a_autonomy' },
          { label: 'Перевожу фокус на поиск конкретного компромисса: «Что мы можем решить прямо сейчас?»', value: 'pragmatic_action', categoryScores: { responsibility: 4 }, scaleId: 'r_repair' },
        ],
      },
      {
        id: 'q-s3-4',
        text: 'Если в пылу спора случайно звучит колкая ирония или упрёк:',
        type: 'single',
        options: [
          { label: 'Спокойно обозначаю границу: «Давай говорить без иронии, мне важен наш диалог»', value: 'clear_boundaries', categoryScores: { respect: 5, responsibility: 5 }, scaleId: 'r_repair' },
          { label: 'Отвечаю схожей колкостью в попытке показать абсурдность тона', value: 'mirror_snark', categoryScores: { contempt: 4, respect: 1 }, scaleId: 'a_autonomy' },
          { label: 'Замыкаюсь в себе и прерываю общение на несколько часов', value: 'shut_down', categoryScores: { stonewalling: 4, avoidance: 3 }, scaleId: 'e_safety' },
          { label: 'Пропускаю резкий тон мимо ушей, стараясь услышать суть боли партнёра', value: 'hear_core_pain', categoryScores: { respect: 4, softness: 4 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s3-5',
        text: 'После того как эмоциональное разногласие утихло, наиболее естественный шаг для меня:',
        type: 'single',
        options: [
          { label: 'Подойти первым(ой) и обнять со словами: «Мне жаль, что мы повздорили, ты мне очень дорог(а)»', value: 'repair_embrace', categoryScores: { respect: 5, responsibility: 5 }, scaleId: 'r_repair' },
          { label: 'Побыть наедине с собой некоторое время, чтобы полностью восстановить душевный ресурс', value: 'solitary_reset', categoryScores: { responsibility: 3, avoidance: 3 }, scaleId: 'a_autonomy' },
          { label: 'Ожидать первого шага от партнёра как подтверждения того, что обида ушла', value: 'await_partner_step', categoryScores: { defensiveness: 3, anxiety: 3 }, scaleId: 'e_safety' },
          { label: 'Спокойно проанализировать вместе, что стало искрой, чтобы беречь друг друга впредь', value: 'debrief_together', categoryScores: { responsibility: 5 }, scaleId: 'r_repair' },
        ],
      },
    ],
  },

  // C1: Наш идеальный день (Креативный)
  {
    id: 'TEST-C1',
    slug: 'ideal-day',
    title: 'Наш идеальный день',
    subtitle: 'Синхронизация биоритмов, отдыха и желаний',
    methodology: 'creative',
    categoryKey: 'lifestyle',
    levelRequired: 2,
    estimatedMinutes: 4,
    questionsCount: 4,
    description: 'Моделирование идеального совместного выходного: пробуждение, тип завтрака, дневная активность и вечерняя атмосфера.',
    scientificBasis: 'Lifestyle Compatibility Framework',
    iconName: 'Sparkles',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-c1-1',
        text: 'Идеальное утро выходного дня:',
        type: 'single',
        options: [
          { label: 'Проснуться в 08:30, бодрая прогулка или зарядка, ароматный кофе', value: 'active', categoryScores: { energetic: 5 }, scaleId: 'e_safety' },
          { label: 'Нежиться в кровати до полудня, обниматься и никуда не спешить', value: 'cozy', categoryScores: { cozy: 5 }, scaleId: 'c_closeness' },
          { label: 'Собраться и отправиться на вкусный завтрак в уютное городское кафе', value: 'gastro', categoryScores: { social: 5 }, scaleId: 'c_closeness' },
          { label: 'Завтрак на свежем воздухе за городом под звуки природы', value: 'nature', categoryScores: { nature: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-c1-2',
        text: 'Дневное совместное занятие мечты:',
        type: 'single',
        options: [
          { label: 'Прогулка по галереям, книжным дворикам и атмосферным улочкам', value: 'culture', categoryScores: { culture: 5 }, scaleId: 'c_closeness' },
          { label: 'Велопрогулка, поход или активный отдых на свежем воздухе', value: 'sport', categoryScores: { nature: 5 }, scaleId: 'e_safety' },
          { label: 'Совместный кулинарный шедевр дома и просмотр душевного фильма', value: 'home', categoryScores: { cozy: 5 }, scaleId: 'c_closeness' },
          { label: 'Спа-комплекс, массаж и глубокое расслабление без мыслей о делах', value: 'wellness', categoryScores: { social: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-c1-3',
        text: 'Идеальное завершение дня вдвоём:',
        type: 'single',
        options: [
          { label: 'Ужин при свечах с бокалом вина и неспешными разговорами по душам', value: 'romantic', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: 'Уютный вечер с настольными играми или встреча с близкими друзьями', value: 'friends', categoryScores: { social: 5 }, scaleId: 'e_safety' },
          { label: 'Тёплая ванна с эфирными маслами и расслабляющая музыка в полумраке', value: 'relax', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-c1-4',
        text: 'Какое соотношение совместного времени и автономии наиболее комфортно для вас в выходные?',
        type: 'single',
        options: [
          { label: 'Большую часть времени вместе — ценю каждую общую минуту', value: 'all_together', categoryScores: { closeness: 5 }, scaleId: 'c_closeness' },
          { label: 'Гармоничный баланс: 70% времени вдвоём, 30% на личные дела и чтение', value: 'balanced', categoryScores: { balance: 5 }, scaleId: 'a_autonomy' },
          { label: 'Равные доли: половина дня для совместных впечатлений, половина — для личной перезагрузки', value: 'independent', categoryScores: { autonomy: 5 }, scaleId: 'a_autonomy' },
        ],
      },
    ],
  },

  // S4: Треугольник любви Стернберга
  {
    id: 'TEST-S4',
    slug: 'sternberg-love-triangle',
    title: 'Треугольник любви Стернберга',
    subtitle: 'Баланс страсти, эмоциональной близости и обязательств',
    methodology: 'scientific',
    categoryKey: 'intimacy',
    levelRequired: 3,
    estimatedMinutes: 5,
    questionsCount: 5,
    description: 'Определяет пропорции трёх фундаментальных компонентов союза по Роберту Стернбергу: душевная близость, романтическое влечение и преданность общим целям.',
    scientificBasis: 'Triangular Theory of Love (Robert Sternberg)',
    iconName: 'Compass',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s4-1',
        text: 'Когда мы остаёмся вдвоём в спокойной обстановке, наша эмоциональная связь ярче всего ощущается в том, что:',
        type: 'single',
        options: [
          { label: 'Мы можем искренне говорить на любые темы и делиться сокровенными переживаниями', value: 'deep_dialogue', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: 'Нам удивительно уютно молчать рядом, чувствуя полное взаимное принятие', value: 'peaceful_silence', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: 'Мы с воодушевлением обсуждаем общие мечты, проекты и планы на будущее', value: 'shared_vision', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
          { label: 'Нас объединяет радость совместного творчества, прогулок и новых впечатлений', value: 'dynamic_discovery', categoryScores: { intimacy: 4 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s4-2',
        text: 'Романтическая и чувственная грань наших отношений в настоящий период лучше всего описывается как:',
        type: 'single',
        options: [
          { label: 'Яркое физическое притяжение, игривый флирт и романтический трепет', value: 'vibrant_passion', categoryScores: { passion: 5 }, scaleId: 'c_closeness' },
          { label: 'Глубокая чувственная нежность, доверие телу партнёра и бережный комфорт', value: 'gentle_sensuality', categoryScores: { passion: 4, intimacy: 5 }, scaleId: 'c_closeness' },
          { label: 'Период обновления: мы ищем новые совместные источники вдохновения и романтики', value: 'refresh_phase', categoryScores: { passion: 3, commitment: 4 }, scaleId: 'c_closeness' },
          { label: 'Уютный гармоничный ритм, где романтика естественно вплетена в ежедневную заботу', value: 'cozy_care_rhythm', categoryScores: { commitment: 5, intimacy: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s4-3',
        text: 'Мой внутренний взгляд на долгосрочную перспективу нашего союза:',
        type: 'single',
        options: [
          { label: 'Твёрдая решимость проходить любые жизненные этапы рука об руку и беречь наш союз', value: 'solid_commitment', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
          { label: 'Фокусируюсь на сегодняшней глубине контакта, доверяя органичному развитию отношений', value: 'trust_in_flow', categoryScores: { intimacy: 4, commitment: 4 }, scaleId: 'e_safety' },
          { label: 'Стремлюсь созидать надёжный семейный тыл, уютный дом и материальную стабильность', value: 'build_safe_haven', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
          { label: 'Для меня важнее всего совместное развитие, где каждый вдохновляет другого на рост', value: 'mutual_growth', categoryScores: { commitment: 4, intimacy: 4 }, scaleId: 'a_autonomy' },
        ],
      },
      {
        id: 'q-s4-4',
        text: 'Какую грань отношений вам хотелось бы бережно обогатить в ближайшие месяцы?',
        type: 'single',
        options: [
          { label: 'Спонтанность, романтические сюрпризы и свежие эмоции', value: 'passion_boost', categoryScores: { passion: 5 }, scaleId: 'c_closeness' },
          { label: 'Неспешные душевные разговоры о чувствах без бытовой суеты', value: 'intimacy_boost', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: 'Синхронизацию стратегических жизненных целей и совместного уклада', value: 'commitment_boost', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
        ],
      },
      {
        id: 'q-s4-5',
        text: 'Распределите 10 баллов между тремя основами вашего союза, отражая их текущий приоритет:',
        type: 'trade_off',
        totalPoints: 10,
        options: [],
        tradeOffItems: [
          { id: 'intimacy', label: 'Душевная близость и искренность', scaleId: 'c_closeness' },
          { id: 'passion', label: 'Страсть, влечение и романтика', scaleId: 'c_closeness' },
          { id: 'commitment', label: 'Надёжность, долгосрочные цели и тыл', scaleId: 'v_future' },
        ],
      },
    ],
  },

  // D1: Семейные сценарии
  {
    id: 'TEST-D1',
    slug: 'family-scripts',
    title: 'Семейные сценарии и роли',
    subtitle: 'Установки из детства и родительские модели отношений',
    methodology: 'deep',
    categoryKey: 'values',
    levelRequired: 4,
    estimatedMinutes: 8,
    questionsCount: 5,
    description: 'Исследует привычки выражения чувств, распределения ролей и решения вопросов, унаследованные из родительского опыта.',
    scientificBasis: 'Семейная системная психотерапия (Боуэн, Сатир)',
    iconName: 'GitBranch',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-d1-1',
        text: 'Как в вашей родительской семье обычно выражались сильные эмоции и несогласие?',
        type: 'single',
        options: [
          { label: 'Эмоционально и вслух, но разногласия быстро сходили на нет', value: 'expressive', categoryScores: { expressive: 5 }, scaleId: 'r_repair' },
          { label: 'Молчанием и временной дистанцией, пока обстановка не успокоится', value: 'silent', categoryScores: { avoidance: 4 }, scaleId: 'e_safety' },
          { label: 'Спокойным диалогом и поиском логического решения за общим столом', value: 'calm', categoryScores: { rational: 5 }, scaleId: 'r_repair' },
          { label: 'Сложные темы сглаживались заботой, стараясь не нарушать внешний покой', value: 'suppressed', categoryScores: { soothing: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-2',
        text: 'Какая модель ведения семейного бюджета была наиболее привычной в детстве?',
        type: 'single',
        options: [
          { label: 'Единый общий бюджет, где все крупные траты обсуждались вместе', value: 'common', categoryScores: { shared: 5 }, scaleId: 'v_future' },
          { label: 'Один из родителей полностью брал на себя финансовую ответственность', value: 'one_leader', categoryScores: { leader: 5 }, scaleId: 'v_future' },
          { label: 'Раздельные средства и высокая степень личной финансовой автономии', value: 'split', categoryScores: { autonomy: 5 }, scaleId: 'a_autonomy' },
          { label: 'Бережное планирование с приоритетом накоплений и подушки безопасности', value: 'savings', categoryScores: { security: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-3',
        text: 'В моменты неожиданного стресса, какую реакцию вы чаще всего замечаете за собой?',
        type: 'single',
        options: [
          { label: 'Осознанно действую иначе, чем родители: говорю о чувствах мягко и без давления', value: 'conscious_shift', categoryScores: { repair: 5 }, scaleId: 'r_repair' },
          { label: 'Ловлю себя на желании замкнуться и переждать бурю в тишине', value: 'solitary_coping', categoryScores: { avoidance: 4 }, scaleId: 'a_autonomy' },
          { label: 'Стремлюсь немедленно всё проговорить и разложить по полочкам', value: 'urgent_clarify', categoryScores: { anxiety: 3, repair: 4 }, scaleId: 'r_repair' },
          { label: 'Стараюсь разрядить напряжение практической заботой или готовкой', value: 'action_care', categoryScores: { care: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-4',
        text: 'Какую главную ценность вы стремитесь бережно развивать в вашей собственной паре?',
        type: 'single',
        options: [
          { label: 'Тёплые семейные традиции, уютные совместные ужины и праздники', value: 'traditions', categoryScores: { traditions: 5 }, scaleId: 'v_future' },
          { label: 'Взаимную поддержку в профессиональных целях, проектах и мечтах', value: 'growth_support', categoryScores: { support: 5 }, scaleId: 'v_future' },
          { label: 'Безусловное уважение к личному пространству и свободе самовыражения', value: 'personal_space', categoryScores: { space: 5 }, scaleId: 'a_autonomy' },
          { label: 'Юмор, лёгкость в решении бытовых мелочей и взаимное тепло', value: 'lightness', categoryScores: { ease: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-5',
        text: 'Распределите 10 баллов приоритетов жизненной энергии в вашей паре:',
        type: 'trade_off',
        totalPoints: 10,
        options: [],
        tradeOffItems: [
          { id: 'safety', label: 'Безопасность и эмоциональное спокойствие', scaleId: 'e_safety' },
          { id: 'autonomy', label: 'Личное пространство и самореализация', scaleId: 'a_autonomy' },
          { id: 'closeness', label: 'Теплота, романтика и время вместе', scaleId: 'c_closeness' },
          { id: 'future', label: 'Долгосрочные цели, дом и семья', scaleId: 'v_future' },
        ],
      },
    ],
  },

  // D2: Стили разрешения конфликтов (Томас-Килманн)
  {
    id: 'TEST-D2',
    slug: 'conflict-resolution-styles',
    title: 'Стили разрешения конфликтов',
    subtitle: 'Как вы ведёте себя в острых ситуациях',
    methodology: 'deep',
    categoryKey: 'conflicts',
    levelRequired: 3,
    estimatedMinutes: 6,
    questionsCount: 5,
    description: 'Определяет вашу стратегию в конфликте: поиск синергии, компромисс, осознанная пауза или уступка ради мира.',
    scientificBasis: 'Инструмент Томаса-Килманна (TKI)',
    iconName: 'Swords',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-d2-1',
        text: 'Когда возникает принципиальное разногласие, моя первая естественная реакция:',
        type: 'single',
        options: [
          { label: 'Последовательно аргументировать свою позицию, опираясь на факты и логику', value: 'competing', categoryScores: { assertiveness: 5, cooperativeness: 2 }, scaleId: 'a_autonomy' },
          { label: 'Досконально обсудить ситуацию, чтобы найти решение, идеально устраивающее обоих', value: 'collaborating', categoryScores: { assertiveness: 5, cooperativeness: 5 }, scaleId: 'r_repair' },
          { label: 'Предложить разумный компромисс, где каждый делает шаг навстречу', value: 'compromising', categoryScores: { assertiveness: 3, cooperativeness: 4 }, scaleId: 'r_repair' },
          { label: 'Предложить отложить разговор на время, чтобы эмоции улеглись', value: 'avoiding', categoryScores: { assertiveness: 2, cooperativeness: 2 }, scaleId: 'a_autonomy' },
          { label: 'Уступить партнёру, если для него этот вопрос явно важнее и чувствительнее', value: 'accommodating', categoryScores: { assertiveness: 1, cooperativeness: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d2-2',
        text: 'В принципиальном споре, касающемся важных жизненных решений, для меня важнее всего:',
        type: 'single',
        options: [
          { label: 'Найти решение, при котором оба партнёра получат желаемое без ущемления интересов', value: 'synergy_first', categoryScores: { assertiveness: 4, cooperativeness: 5 }, scaleId: 'r_repair' },
          { label: 'Сохранить мир и эмоциональное тепло в паре, даже если придётся скорректировать ожидания', value: 'peace_priority', categoryScores: { assertiveness: 1, cooperativeness: 5 }, scaleId: 'e_safety' },
          { label: 'Добиться справедливого баланса 50/50, где уступки взаимны и прозрачны', value: 'fair_split', categoryScores: { assertiveness: 3, cooperativeness: 3 }, scaleId: 'r_repair' },
          { label: 'Убедиться, что принятое решение логически обоснованно и практично', value: 'logic_clarity', categoryScores: { assertiveness: 5, cooperativeness: 2 }, scaleId: 'a_autonomy' },
        ],
      },
      {
        id: 'q-d2-3',
        text: 'Если партнёр предлагает вариант, который вам не по душе, но вы чувствуете сильную усталость:',
        type: 'single',
        options: [
          { label: 'Предложу бережно отложить обсуждение до утра или выходных, когда будут силы', value: 'pause_until_rested', categoryScores: { cooperativeness: 4, assertiveness: 3 }, scaleId: 'a_autonomy' },
          { label: 'Предложу быстрый компромисс: «Давай сделаем ключевую часть по-твоему, а деталь скорректируем»', value: 'quick_compromise', categoryScores: { assertiveness: 3, cooperativeness: 4 }, scaleId: 'r_repair' },
          { label: 'Соглашусь с партнёром, чтобы не затягивать спор в состоянии переутомления', value: 'gentle_concession', categoryScores: { cooperativeness: 5, assertiveness: 1 }, scaleId: 'e_safety' },
          { label: 'Найду в себе ресурс спокойно объяснить, почему этот вариант вызывает сомнения', value: 'clear_explanation', categoryScores: { assertiveness: 5, cooperativeness: 3 }, scaleId: 'r_repair' },
        ],
      },
      {
        id: 'q-d2-4',
        text: 'Когда в воздухе ощущается скрытое напряжение (разговора ещё не было, но чувствуется холод):',
        type: 'single',
        options: [
          { label: 'Предпочитаю мягко и прямо спросить: «Я чувствую напряжение между нами, давай поговорим»', value: 'direct_openness', categoryScores: { assertiveness: 5, cooperativeness: 4 }, scaleId: 'r_repair' },
          { label: 'Даю обоим время спокойно подумать и собраться с мыслями перед разговором', value: 'thoughtful_pause', categoryScores: { avoidance: 3, cooperativeness: 3 }, scaleId: 'a_autonomy' },
          { label: 'Создаю тёплую и уютную обстановку, чтобы партнёру было легко открыться самому', value: 'nurture_safety', categoryScores: { cooperativeness: 5, assertiveness: 2 }, scaleId: 'e_safety' },
          { label: 'Предлагаю совместное действие или прогулку, чтобы перезагрузить эмоциональный фон', value: 'action_deescalation', categoryScores: { cooperativeness: 4, avoidance: 2 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-d2-5',
        text: 'В конструктивном разрешении разногласий главное для нашей пары — это:',
        type: 'single',
        options: [
          { label: 'Беречь чувства и достоинство друг друга, избегая колкостей и критики', value: 'care_and_dignity', categoryScores: { cooperativeness: 5 }, scaleId: 'r_repair' },
          { label: 'Уметь вовремя услышать зерно правды в словах партнёра и сделать шаг навстречу', value: 'mutual_understanding', categoryScores: { collaborating: 5 }, scaleId: 'r_repair' },
          { label: 'Опираться на факты и совместно вырабатывать конкретные договорённости', value: 'fact_agreements', categoryScores: { competing: 2, collaborating: 4 }, scaleId: 'v_future' },
        ],
      },
    ],
  },

  // PT: Профиль личности (Big Five)
  {
    id: 'TEST-PT',
    slug: 'personality-type-big5',
    title: 'Профиль личности (Big Five)',
    subtitle: 'Ориентация, честность, устойчивость, открытость, доброжелательность',
    methodology: 'scientific',
    categoryKey: 'lifestyle',
    levelRequired: 1,
    estimatedMinutes: 4,
    questionsCount: 8,
    description: 'Определяет тип личности по пяти измерениям: экстраверсия, доброжелательность, добросовестность, устойчивость, открытость опыту.',
    scientificBasis: 'Модель «Большая пятёрка» (Big Five, Costa & McCrae)',
    iconName: 'Fingerprint',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-pt-1',
        text: 'После насыщенного вечера в компании вы:',
        type: 'single',
        options: [
          { label: 'Чувствую прилив энергии и хочу продолжения общения', value: 'extravert', categoryScores: { extraversion: 5 }, scaleId: 's23' },
          { label: 'Рад(а) встрече, но мечтаю скорее оказаться дома в тишине', value: 'introvert', categoryScores: { introversion: 5 }, scaleId: 's23' },
          { label: 'Держусь в стороне, наблюдаю, но к концу вечера включаюсь', value: 'observer_warms', categoryScores: { extraversion: 3, conscientiousness: 3 }, scaleId: 's23' },
          { label: 'Контролирую обстановку: слежу, чтобы всем было комфортно', value: 'host_control', categoryScores: { conscientiousness: 4, agreeableness: 3 }, scaleId: 's21' },
        ],
      },
      {
        id: 'q-pt-2',
        text: 'Когда планируете отпуск со своим бюджетом, вы скорее:',
        type: 'single',
        options: [
          { label: 'Составлю подробный график дней и бронирования заранее', value: 'structured', categoryScores: { conscientiousness: 5 }, scaleId: 's21' },
          { label: 'Забронирую только билеты, а весь план родится на месте', value: 'spontaneous', categoryScores: { openness: 4, conscientiousness: 1 }, scaleId: 's21' },
          { label: 'Поручу детали партнёру или агентству — главное результат', value: 'delegating', categoryScores: { agreeableness: 4 }, scaleId: 'a_autonomy' },
          { label: 'Соберу три разных сценария и выберу по настроению', value: 'options_open', categoryScores: { openness: 4 }, scaleId: 's24' },
        ],
      },
      {
        id: 'q-pt-3',
        text: 'Перед лицом неожиданной проблемы, которую нельзя отложить, ваша внутренняя реакция:',
        type: 'forced_vulnerability',
        options: [
          { label: 'Тревожное напряжение — мысли хаотично ускоряются', value: 'neurotic_reaction', categoryScores: { neuroticism: 4 }, scaleId: 's1' },
          { label: 'Холодная сосредоточенность — включается «режим решения»', value: 'stable_focus', categoryScores: { stability: 5 }, scaleId: 's12' },
          { label: 'Интерес к задаче как к головоломке, которую предстоит разгадать', value: 'curious_problem', categoryScores: { openness: 4, stability: 3 }, scaleId: 's24' },
          { label: 'Желание сразу позвать кого-то доверенного обсудить', value: 'social_support', categoryScores: { extraversion: 3, agreeableness: 3 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-pt-4',
        text: 'На вашем рабочем столе (реальном или цифровом) обычно:',
        type: 'single',
        options: [
          { label: 'Каждый предмет и файл имеет своё постоянное логическое место', value: 'order_architect', categoryScores: { conscientiousness: 5 }, scaleId: 's21' },
          { label: 'Творческий беспорядок, в котором ориентируюсь только я', value: 'creative_chaos', categoryScores: { openness: 4, conscientiousness: 1 }, scaleId: 's21' },
          { label: 'Недельные плато порядка, между которыми случаются завалы', value: 'cyclic_order', categoryScores: { conscientiousness: 3 }, scaleId: 's21' },
        ],
      },
      {
        id: 'q-pt-5',
        text: 'В дискуссии, где собеседник явно неправ, но искренне убеждён в своей правоте:',
        type: 'single',
        options: [
          { label: 'Спокойно изложу факты и свою позицию, не настаивая на признании', value: 'calm_assertive', categoryScores: { agreeableness: 3, stability: 4 }, scaleId: 'r_repair' },
          { label: 'Постараюсь понять, что стоит за его(её) убеждением', value: 'empathic_probe', categoryScores: { agreeableness: 5 }, scaleId: 'c_closeness' },
          { label: 'Корректно, но прямо покажу логическое противоречие', value: 'direct_logic', categoryScores: { agreeableness: 2, conscientiousness: 4 }, scaleId: 'r_repair' },
          { label: 'Не буду спорить открыто, но запомню и выведу позже', value: 'strategic_patience', categoryScores: { conscientiousness: 4 }, scaleId: 'a_autonomy' },
        ],
      },
      {
        id: 'q-pt-6',
        text: 'Какую роль вы чаще всего занимаете в новых коллективах?',
        type: 'single',
        options: [
          { label: 'Инициатор идей, генератор нестандартных решений', value: 'generator', categoryScores: { openness: 5 }, scaleId: 's24' },
          { label: 'Связующее звено: знакомлюсь со всеми и создаю общий настрой', value: 'connector', categoryScores: { extraversion: 5 }, scaleId: 's23' },
          { label: 'Тихий оплот: отвечаю за точность и соблюдение договорённостей', value: 'quiet_anchor', categoryScores: { conscientiousness: 5 }, scaleId: 's21' },
          { label: 'Наблюдатель на дистанции: вхожу в контакт медленно, но надолго', value: 'deep_observer', categoryScores: { stability: 3, introversion: 4 }, scaleId: 's23' },
        ],
      },
      {
        id: 'q-pt-7',
        text: 'Верный сценарий «идеального вечера» после месяца плотной работы:',
        type: 'single',
        options: [
          { label: 'Новое место, новые люди, незапланированные открытия', value: 'novelty_craving', categoryScores: { openness: 4, extraversion: 3 }, scaleId: 's23' },
          { label: 'Привычные ритуалы в родном пространстве: любимая еда, сериал, покой', value: 'ritual_home', categoryScores: { tradition: 4, stability: 3 }, scaleId: 'e_safety' },
          { label: 'Глубокий разговор с близким человеком без телефонов', value: 'deep_bond', categoryScores: { intimacy: 4 }, scaleId: 'c_closeness' },
          { label: 'Выполнить накопившиеся личные дела, чтобы с чистой совестью отдохнуть', value: 'duty_first', categoryScores: { conscientiousness: 4 }, scaleId: 's21' },
        ],
      },
      {
        id: 'q-pt-8',
        text: 'Распределите 10 баллов между гранями, наиболее выраженными в вашей личности:',
        type: 'trade_off',
        totalPoints: 10,
        options: [],
        tradeOffItems: [
          { id: 'energy', label: 'Заряд от общения и активности', scaleId: 's23' },
          { id: 'order', label: 'Порядок, планы и самодисциплина', scaleId: 's21' },
          { id: 'novelty', label: 'Любопытство к новым идеям', scaleId: 's24' },
          { id: 'harmony', label: 'Мягкость и забота о чувствах', scaleId: 'c_closeness' },
        ],
      },
    ],
  },
];

export const initialSmallCravings: SmallCraving[] = [];

export const initialFlowerPreferences: Record<string, FlowerPreference> = {
  partner1: {
    favoriteFlowers: [],
    dislikedFlowers: [],
    colorPreferences: [],
    careNotes: '',
    idealBouquetDescription: '',
  },
  partner2: {
    favoriteFlowers: [],
    dislikedFlowers: [],
    colorPreferences: [],
    careNotes: '',
    idealBouquetDescription: '',
  },
};

export const initialWishlist: WishlistItem[] = [];

export const initialVenues: Venue[] = [];

export const initialDateInvites: DateInvite[] = [];

export const initialMoodHistory: MoodHistoryItem[] = [];

export const initialAchievements: Achievement[] = [
  {
    id: 'ach-1',
    code: 'ACH-01',
    title: '«Первый шаг»',
    description: 'Оба партнёра успешно завершили свой первый тест совместимости.',
    icon: 'Sparkles',
    unlocked: false,
  },
  {
    id: 'ach-2',
    code: 'ACH-02',
    title: '«Синхронизация»',
    description: 'Совпадение взглядов ≥ 80% в тесте жизненных ценностей и идеального дня.',
    icon: 'Zap',
    unlocked: false,
  },
  {
    id: 'ach-3',
    code: 'ACH-03',
    title: '«Антидот Готтмана»',
    description: 'Успешное применение техники мягкого старта при решении спорного вопроса.',
    icon: 'ShieldCheck',
    unlocked: false,
  },
  {
    id: 'ach-4',
    code: 'ACH-04',
    title: '«Коллекционер глубин»',
    description: 'Пройдено более 5 психологических опросников разной глубины.',
    icon: 'Award',
    unlocked: false,
  },
  {
    id: 'ach-5',
    code: 'ACH-05',
    title: '«Хранители заботы»',
    description: 'Исполнено 10 маленьких желаний и хотелок любимого человека.',
    icon: 'Heart',
    unlocked: false,
  },
  {
    id: 'ach-6',
    code: 'ACH-06',
    title: '«Идеальное свидание»',
    description: 'Запланировано и проведено 5 свиданий через встроенный визард.',
    icon: 'MapPin',
    unlocked: false,
  },
];
