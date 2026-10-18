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
    subtitle: 'Как мы держимся друг за друга и реагируем на дистанцию',
    methodology: 'scientific',
    categoryKey: 'attachment',
    levelRequired: 1,
    estimatedMinutes: 5,
    questionsCount: 6,
    description: 'Определяет ваш паттерн близости по методике Джона Боулби: что дарит чувство безопасности, а что включает тревогу или желание спрятаться.',
    scientificBasis: 'Experiences in Close Relationships (ECR-R) & Теория привязанности Боулби',
    iconName: 'ShieldHeart',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s1-1',
        text: 'Партнёр вернулся уставший, молча разулся и залип в телефон. Твоя реакция:',
        type: 'single',
        options: [
          { label: '🚨 «Всё хорошо?» — сразу иду на контакт и проверяю', value: 'anxiety_check', categoryScores: { anxiety: 5, security: 2 }, scaleId: 'c_closeness' },
          { label: '🧘 Спокойно даю тихое пространство и не трогаю', value: 'secure_space', categoryScores: { security: 5, avoidance: 1 }, scaleId: 'a_autonomy' },
          { label: '🚪 Тоже закрываюсь: пусть заговорит первым(ой)', value: 'avoidant_pullback', categoryScores: { avoidance: 5, anxiety: 2 }, scaleId: 'e_safety' },
          { label: '🍵 Молча заварю чай и принесу плед без лишних слов', value: 'practical_care', categoryScores: { security: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s1-2',
        text: 'На работе дикий аврал и стресс, силы на нуле. Как ты это проживаешь?',
        type: 'single',
        options: [
          { label: '🗣️ Нужно срочно выговориться и крепко обняться', value: 'need_empathy', categoryScores: { security: 5, anxiety: 3 }, scaleId: 'c_closeness' },
          { label: '🛋️ Уйду в свою «пещеру» переварить всё в тишине', value: 'need_solitude', categoryScores: { avoidance: 4, security: 3 }, scaleId: 'a_autonomy' },
          { label: '📋 Хочу вместе разложить всё по полочкам и плану', value: 'rational_plan', categoryScores: { security: 4 }, scaleId: 'r_repair' },
          { label: '🥺 Жду, когда партнёр сам заметит и бережно спросит', value: 'wait_for_invite', categoryScores: { anxiety: 4, avoidance: 3 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s1-3',
        text: 'Спор накаляется, голоса повышаются, обстановка на пределе:',
        type: 'single',
        options: [
          { label: '⏸️ Нужен тайм-аут 15 минут в тишине, чтобы остыть', value: 'need_timeout', categoryScores: { avoidance: 4, security: 4 }, scaleId: 'a_autonomy' },
          { label: '🫂 Миримся прямо сейчас, иначе я изведусь от тревоги', value: 'immediate_contact', categoryScores: { anxiety: 5, security: 2 }, scaleId: 'c_closeness' },
          { label: '🧠 Выдыхаем, снижаем тон и включаем логику', value: 'calm_analysis', categoryScores: { security: 5 }, scaleId: 'r_repair' },
          { label: '🕊️ Обнять или пошутить: тепло важнее правоты', value: 'warm_soothing', categoryScores: { security: 4, anxiety: 2 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s1-4',
        text: 'Предстоит разлука на пару дней без регулярной связи:',
        type: 'single',
        options: [
          { label: '⛵ Полный дзен: знаю, что мы любим друг друга', value: 'inner_calm', categoryScores: { security: 5 }, scaleId: 'e_safety' },
          { label: '🌿 Кайфую от времени на себя, сериалы и свои дела', value: 'enjoy_autonomy', categoryScores: { avoidance: 3, security: 4 }, scaleId: 'a_autonomy' },
          { label: '📱 Жду регулярные весточки: мемы и «спокойной ночи»', value: 'daily_pings', categoryScores: { anxiety: 4, security: 3 }, scaleId: 'c_closeness' },
          { label: '🎉 С предвкушением планирую долгожданную встречу', value: 'plan_reunion', categoryScores: { security: 4 }, scaleId: 'v_future' },
        ],
      },
      {
        id: 'q-s1-5',
        text: 'Партнёр с энтузиазмом распланировал все выходные наперёд:',
        type: 'single',
        options: [
          { label: '🥰 Обожаю инициативу — с радостью ныряю в планы!', value: 'welcome_closeness', categoryScores: { security: 4, anxiety: 2 }, scaleId: 'c_closeness' },
          { label: '🛑 Оставь мне пару часов тишины наедине с собой', value: 'need_private_space', categoryScores: { avoidance: 4, security: 4 }, scaleId: 'a_autonomy' },
          { label: '🧭 Сядем вместе и подкорректируем маршрут', value: 'shared_planning', categoryScores: { security: 5 }, scaleId: 'r_repair' },
          { label: '☕ Главное — неспешный ритм без суеты и гонки', value: 'gentle_pace', categoryScores: { security: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s1-6',
        text: 'Что даёт тебе железное чувство: «Мы — непобедимая команда»?',
        type: 'single',
        options: [
          { label: '🛡️ Мы стоим спина к спине против любой жизненной бури', value: 'team_bond', categoryScores: { security: 5 }, scaleId: 'e_safety' },
          { label: '🦅 Взаимное уважение к личной свободе и границам', value: 'mutual_respect', categoryScores: { security: 5, avoidance: 2 }, scaleId: 'a_autonomy' },
          { label: '❤️ Ежедневные объятия и живой интерес: «Как ты?»', value: 'daily_warmth', categoryScores: { security: 5, anxiety: 2 }, scaleId: 'c_closeness' },
          { label: '🏡 Общие долгосрочные цели, надёжный тыл и дом', value: 'shared_horizons', categoryScores: { security: 5 }, scaleId: 'v_future' },
        ],
      },
    ],
  },

  // S2: Пять языков любви
  {
    id: 'TEST-S2',
    slug: 'five-love-languages',
    title: 'Пять языков любви',
    subtitle: 'Как вы понимаете и выражаете нежность',
    methodology: 'scientific',
    categoryKey: 'intimacy',
    levelRequired: 1,
    estimatedMinutes: 5,
    questionsCount: 6,
    description: 'Определяет ваш персональный код любви по Гэри Чепмену: через какие именно действия ваше сердце тает быстрее всего.',
    scientificBasis: 'Концепция пяти языков любви Гэри Чепмена',
    iconName: 'HeartHandshake',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s2-1',
        text: 'После тяжёлого дня, что быстрее всего вернёт тебя к жизни?',
        type: 'single',
        options: [
          { label: '💬 Слова: «Ты молодец, я так горжусь тобой!»', value: 'words', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: '🍲 Горячий ужин и забота без единого вопроса', value: 'acts', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
          { label: '🫂 Крепкие объятия под пледом в тишине', value: 'touch', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: '☕ Отложить телефоны и поговорить по душам', value: 'time', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: '🎁 Любимый десерт или кофе без повода', value: 'gifts', categoryScores: { gifts: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s2-2',
        text: 'Какое поведение со стороны партнёра ранит тебя больнее всего?',
        type: 'single',
        options: [
          { label: '🗡️ Едкий сарказм, критика или холодные слова', value: 'words_hurt', categoryScores: { words: 5 }, scaleId: 'r_repair' },
          { label: '📱 Скролл телефона и скука во время свидания', value: 'time_hurt', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: '🧊 Физический холод и уклонение от объятий', value: 'touch_hurt', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: '🧹 Забытые бытовые просьбы и обещания', value: 'acts_hurt', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
          { label: '📅 Забытая важная дата или подарок «на отвали»', value: 'gifts_hurt', categoryScores: { gifts: 5 }, scaleId: 'v_future' },
        ],
      },
      {
        id: 'q-s2-3',
        text: 'Спонтанный жест внимания мечты от любимого человека:',
        type: 'single',
        options: [
          { label: '🎟️ Спонтанная поездка на уикенд или концерт', value: 'time', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: '🎁 Та самая вещь, которую я случайно упомянул(а)', value: 'gifts', categoryScores: { gifts: 5 }, scaleId: 'c_closeness' },
          { label: '💌 Трогательная записка в кармане куртки', value: 'words', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: '💆 Расслабляющий массаж при свечах после работы', value: 'touch', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: '✨ Он(а) молча решил(а) ту самую бесячую проблему', value: 'acts', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s2-4',
        text: 'В обычный будний день мурашки нежности бегут от:',
        type: 'single',
        options: [
          { label: '✨ Нежного касания шеи или ладони на ходу', value: 'touch_flow', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
          { label: '💌 Смски: «Думаю о тебе и жду вечер»', value: 'words_flow', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: '☕ Неожиданного кофе с любимой выпечкой', value: 'gifts_flow', categoryScores: { gifts: 4, acts: 4 }, scaleId: 'e_safety' },
          { label: '🛋️ Слов: «Давай просто посидим 15 минут в обнимку»', value: 'time_flow', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s2-5',
        text: 'Какой поступок партнёра вызывает мысль: «Как же мне повезло!»?',
        type: 'single',
        options: [
          { label: '🦸 Взял(а) на себя весь быт, когда нет сил', value: 'acts_hero', categoryScores: { acts: 5 }, scaleId: 'e_safety' },
          { label: '👂 Выслушал(а) без перебиваний и осуждения', value: 'time_hero', categoryScores: { time: 5 }, scaleId: 'c_closeness' },
          { label: '🌟 С гордостью сказал(а), как верит в меня', value: 'words_hero', categoryScores: { words: 5 }, scaleId: 'c_closeness' },
          { label: '🫂 Прижал(а) к груди в момент растерянности', value: 'touch_hero', categoryScores: { touch: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s2-6',
        text: 'Распредели 10 баллов между языками любви по степени их важности для тебя:',
        type: 'trade_off',
        totalPoints: 10,
        options: [],
        tradeOffItems: [
          { id: 'words', label: 'Слова признания и нежные комплименты', scaleId: 'c_closeness' },
          { id: 'time', label: 'Качественное время только вдвоём', scaleId: 'c_closeness' },
          { id: 'acts', label: 'Забота на деле и помощь в быту', scaleId: 'e_safety' },
          { id: 'touch', label: 'Тактильность, объятия и поцелуи', scaleId: 'c_closeness' },
        ],
      },
    ],
  },

  // S3: Четыре всадника Готтмана
  {
    id: 'TEST-S3',
    slug: 'gottman-four-horsemen',
    title: 'Четыре всадника Готтмана',
    subtitle: 'Как мы ругаемся, защищаемся и миримся',
    methodology: 'scientific',
    categoryKey: 'conflicts',
    levelRequired: 2,
    estimatedMinutes: 6,
    questionsCount: 5,
    description: 'Анализирует динамику диалога в моменты напряжения: поиск антидотов к критике, сарказму и глухой защите по методике Джона Готтмана.',
    scientificBasis: 'Исследования Института Готтмана (The Gottman Institute)',
    iconName: 'Flame',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s3-1',
        text: 'Партнёр снова сделал то, что тебя бесит (посуда, вещи, опоздание):',
        type: 'single',
        options: [
          { label: '🌸 Мягко попрошу: «Помоги мне, пожалуйста»', value: 'soft_startup', categoryScores: { softness: 5, responsibility: 4 }, scaleId: 'r_repair' },
          { label: '🌋 Коплю в себе, пока однажды не взорвусь', value: 'bottle_up', categoryScores: { criticism: 4, softness: 1 }, scaleId: 'e_safety' },
          { label: '🙄 Молча уберу, но буду вздыхать полчаса', value: 'silent_fix', categoryScores: { avoidance: 3, softness: 3 }, scaleId: 'a_autonomy' },
          { label: '📋 Предложу чётко распределить обязанности', value: 'structural_rule', categoryScores: { responsibility: 5 }, scaleId: 'r_repair' },
        ],
      },
      {
        id: 'q-s3-2',
        text: 'Партнёр говорит: «Меня очень обидело то, что ты вчера сказал(а)»:',
        type: 'single',
        options: [
          { label: '🛡️ «Ты всё перекрутил(а), я не это имел(а) в виду!»', value: 'defensiveness', categoryScores: { defensiveness: 4, responsibility: 2 }, scaleId: 'a_autonomy' },
          { label: '❤️ «Прости. Что именно тебя задело?»', value: 'empathy_validation', categoryScores: { responsibility: 5, respect: 5 }, scaleId: 'r_repair' },
          { label: '⏸️ Возьму паузу подышать, чтобы не ляпнуть лишнего', value: 'calm_pause', categoryScores: { stonewalling: 2, responsibility: 4 }, scaleId: 'e_safety' },
          { label: '🫂 Сразу обниму: «Я не хотел(а) сделать больно»', value: 'warm_deescalate', categoryScores: { softness: 4, respect: 4 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s3-3',
        text: 'Спор выходит из-под контроля: пульс зашкаливает, слова резкие:',
        type: 'single',
        options: [
          { label: '🛑 «Стоп! Тайм-аут 20 минут, нужно остыть»', value: 'gottman_break', categoryScores: { responsibility: 5, respect: 5 }, scaleId: 'r_repair' },
          { label: '🔥 Буду спорить до конца, пока не выясним всё', value: 'push_forward', categoryScores: { anxiety: 4, softness: 2 }, scaleId: 'c_closeness' },
          { label: '🗿 Глухая стена: замыкаюсь и молчу в стену', value: 'stonewall_shield', categoryScores: { stonewalling: 4, avoidance: 4 }, scaleId: 'a_autonomy' },
          { label: '🤝 «Выдыхаем: что мы можем сделать прямо сейчас?»', value: 'pragmatic_action', categoryScores: { responsibility: 4 }, scaleId: 'r_repair' },
        ],
      },
      {
        id: 'q-s3-4',
        text: 'В запале ссоры неожиданно прозвучала ядовитая колкость:',
        type: 'single',
        options: [
          { label: '✋ «Стоп, давай без язвительности, мы же любим друг друга»', value: 'clear_boundaries', categoryScores: { respect: 5, responsibility: 5 }, scaleId: 'r_repair' },
          { label: '⚡ Отвечу ещё более едкой шпилькой в ответ', value: 'mirror_snark', categoryScores: { contempt: 4, respect: 1 }, scaleId: 'a_autonomy' },
          { label: '🚪 Обижусь и уйду в глухую молчанку на сутки', value: 'shut_down', categoryScores: { stonewalling: 4, avoidance: 3 }, scaleId: 'e_safety' },
          { label: '👂 Пропущу мимо ушей: за этим стоит усталость или боль', value: 'hear_core_pain', categoryScores: { respect: 4, softness: 4 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s3-5',
        text: 'Буря утихла, повисла неловкая пауза. Твой шаг к миру:',
        type: 'single',
        options: [
          { label: '🫂 Обниму: «Ты мне дороже любого спора»', value: 'repair_embrace', categoryScores: { respect: 5, responsibility: 5 }, scaleId: 'r_repair' },
          { label: '🧘 Побуду в тишине 30 минут, чтобы остыть', value: 'solitary_reset', categoryScores: { responsibility: 3, avoidance: 3 }, scaleId: 'a_autonomy' },
          { label: '⏳ Буду ждать первого шага от партнёра', value: 'await_partner_step', categoryScores: { defensiveness: 3, anxiety: 3 }, scaleId: 'e_safety' },
          { label: '☕ Заварю чай: «Из-за какой ерунды мы завелись?»', value: 'debrief_together', categoryScores: { responsibility: 5 }, scaleId: 'r_repair' },
        ],
      },
    ],
  },

  // C1: Наш идеальный день (Креативный)
  {
    id: 'TEST-C1',
    slug: 'ideal-day',
    title: 'Наш идеальный день',
    subtitle: 'Синхронизация биоритмов, отдыха и гедонизма',
    methodology: 'creative',
    categoryKey: 'lifestyle',
    levelRequired: 2,
    estimatedMinutes: 4,
    questionsCount: 4,
    description: 'Моделирование совместного выходного мечты: ленивое пробуждение, гастрономические слабости, дневной движ и уютный вечер.',
    scientificBasis: 'Lifestyle & Circadian Compatibility Framework',
    iconName: 'Sparkles',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-c1-1',
        text: 'Идеальное утро субботы для тебя:',
        type: 'single',
        options: [
          { label: '🏃‍♂️ Проснуться в 8:30, бодрый душ, свежий кофе и утренняя пробежка или прогулка', value: 'active', categoryScores: { energetic: 5 }, scaleId: 'e_safety' },
          { label: '🛌 Валяться в обнимку до полудня, ленивые потягушки и завтрак прямо в постели', value: 'cozy', categoryScores: { cozy: 5 }, scaleId: 'c_closeness' },
          { label: '🥐 Неспешно собраться и пойти на сырники с капучино в любимое городское кафе', value: 'gastro', categoryScores: { social: 5 }, scaleId: 'c_closeness' },
          { label: '🌲 За городом: кофе на веранде, пение птиц и запах свежего утреннего воздуха', value: 'nature', categoryScores: { nature: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-c1-2',
        text: 'Дневное совместное занятие мечты:',
        type: 'single',
        options: [
          { label: '🎨 Гулять по атмосферным улочкам, книжным дворикам и необычным выставкам', value: 'culture', categoryScores: { culture: 5 }, scaleId: 'c_closeness' },
          { label: '🚴 Велосипеды, сапы, поход в горы или активный отдых на свежем воздухе', value: 'sport', categoryScores: { nature: 5 }, scaleId: 'e_safety' },
          { label: '🍝 Совместный кулинарный шедевр под музыку и бокал вина, а потом любимый фильм', value: 'home', categoryScores: { cozy: 5 }, scaleId: 'c_closeness' },
          { label: '🧖 Спа, термальный бассейн и расслабляющий массаж для двоих без мыслей о делах', value: 'wellness', categoryScores: { social: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-c1-3',
        text: 'Идеальное завершение дня вдвоём:',
        type: 'single',
        options: [
          { label: '🕯️ Ужин при свечах, бокал вина и разговоры по душам до глубокой ночи', value: 'romantic', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: '🎲 Вечер с настолками, пицца и хохот в компании близких друзей', value: 'friends', categoryScores: { social: 5 }, scaleId: 'e_safety' },
          { label: '🛁 Тёплая ванна с эфирными маслами, полумрак и расслабляющий плейлист', value: 'relax', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-c1-4',
        text: 'Твой комфортный баланс «вместе» и «личное время» на выходных:',
        type: 'single',
        options: [
          { label: '👩‍❤️‍👨 Все 48 часов вместе! Не могу насытиться тобой и ценю каждую общую минуту', value: 'all_together', categoryScores: { closeness: 5 }, scaleId: 'c_closeness' },
          { label: '⚖️ Золотая середина: 70% времени вдвоём, 30% — на свои книги, игры или хобби', value: 'balanced', categoryScores: { balance: 5 }, scaleId: 'a_autonomy' },
          { label: '🕊️ Равноправие: полдня кайфуем вдвоём, полдня каждый предоставлен себе', value: 'independent', categoryScores: { autonomy: 5 }, scaleId: 'a_autonomy' },
        ],
      },
    ],
  },

  // S4: Треугольник любви Стернберга
  {
    id: 'TEST-S4',
    slug: 'sternberg-love-triangle',
    title: 'Треугольник любви Стернберга',
    subtitle: 'Баланс страсти, дружбы и надёжности',
    methodology: 'scientific',
    categoryKey: 'intimacy',
    levelRequired: 3,
    estimatedMinutes: 5,
    questionsCount: 5,
    description: 'Определяет пропорции трёх китов любви по Роберту Стернбергу: эмоциональная интимность, физическое притяжение и осознанные обязательства.',
    scientificBasis: 'Triangular Theory of Love (Robert Sternberg)',
    iconName: 'Compass',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-s4-1',
        text: 'Когда мы остаёмся вдвоём дома вечером, наша душевная связь ярче всего ощущается в том, что:',
        type: 'single',
        options: [
          { label: '💬 Мы можем говорить обо всём на свете: от глупых мемов до сокровенных переживаний', value: 'deep_dialogue', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: '🤫 Нам удивительно уютно молчать рядом, чувствуя абсолютное взаимное принятие', value: 'peaceful_silence', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: '🚀 Мы с воодушевлением обсуждаем общие мечты, будущий дом и смелые проекты', value: 'shared_vision', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
          { label: '🌟 Нас объединяет радость совместного юмора, прогулок и новых открытий', value: 'dynamic_discovery', categoryScores: { intimacy: 4 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-s4-2',
        text: 'Романтическая и чувственная грань наших отношений прямо сейчас:',
        type: 'single',
        options: [
          { label: '🔥 Яркий огонь: флирт, искры, спонтанные поцелуи и романтический трепет', value: 'vibrant_passion', categoryScores: { passion: 5 }, scaleId: 'c_closeness' },
          { label: '🌸 Глубокая нежность, доверие телу партнёра и бережный тактильный комфорт', value: 'gentle_sensuality', categoryScores: { passion: 4, intimacy: 5 }, scaleId: 'c_closeness' },
          { label: '✨ Период перезагрузки: хочется встряхнуть рутину и устроить дерзкое свидание', value: 'refresh_phase', categoryScores: { passion: 3, commitment: 4 }, scaleId: 'c_closeness' },
          { label: '☕ Уютный ритм, где романтика естественно вплетена в ежедневную тёплую заботу', value: 'cozy_care_rhythm', categoryScores: { commitment: 5, intimacy: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-s4-3',
        text: 'Твой внутренний взгляд на долгосрочную перспективу нашего союза:',
        type: 'single',
        options: [
          { label: '⚓ Твёрдая решимость проходить любые жизненные штормы рука об руку до конца', value: 'solid_commitment', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
          { label: '🌊 Живу моментом и доверяю органичному развитию наших чувств здесь и сейчас', value: 'trust_in_flow', categoryScores: { intimacy: 4, commitment: 4 }, scaleId: 'e_safety' },
          { label: '🏰 Строю надёжный семейный тыл, уютный дом и материальную стабильность', value: 'build_safe_haven', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
          { label: '🌱 Для меня важнее всего совместный рост, где каждый вдохновляет другого на успех', value: 'mutual_growth', categoryScores: { commitment: 4, intimacy: 4 }, scaleId: 'a_autonomy' },
        ],
      },
      {
        id: 'q-s4-4',
        text: 'Какую грань отношений тебе больше всего хотелось бы обогатить в ближайшие месяцы?',
        type: 'single',
        options: [
          { label: '⚡ Спонтанность, романтические сюрпризы и свежие бурные эмоции', value: 'passion_boost', categoryScores: { passion: 5 }, scaleId: 'c_closeness' },
          { label: '💬 Неспешные душевные разговоры о сокровенном без бытовой суеты', value: 'intimacy_boost', categoryScores: { intimacy: 5 }, scaleId: 'c_closeness' },
          { label: '🎯 Синхронизацию долгосрочных жизненных целей, бюджета и семейного уклада', value: 'commitment_boost', categoryScores: { commitment: 5 }, scaleId: 'v_future' },
        ],
      },
      {
        id: 'q-s4-5',
        text: 'Распредели 10 баллов между тремя основами любви по их ценности для тебя:',
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
    subtitle: 'Бабушкин сервиз, бюджет и наши собственные правила',
    methodology: 'deep',
    categoryKey: 'values',
    levelRequired: 4,
    estimatedMinutes: 6,
    questionsCount: 5,
    description: 'Исследует привычки выражения чувств, распределения бюджета и решения споров, унаследованные из родительского опыта.',
    scientificBasis: 'Семейная системная психотерапия (Боуэн, Сатир)',
    iconName: 'GitBranch',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-d1-1',
        text: 'Как в семьях твоих родителей обычно выражали сильные эмоции и несогласие?',
        type: 'single',
        options: [
          { label: '💥 Итальянские страсти: громко и эмоционально, но через 10 минут уже обнимались', value: 'expressive', categoryScores: { expressive: 5 }, scaleId: 'r_repair' },
          { label: '🧊 Холодная война: затяжное молчание и хлопанье дверями, пока само не уляжется', value: 'silent', categoryScores: { avoidance: 4 }, scaleId: 'e_safety' },
          { label: '☕ Спокойный диалог и поиск логического компромисса за общим столом', value: 'calm', categoryScores: { rational: 5 }, scaleId: 'r_repair' },
          { label: '🤫 Заметали под ковёр: делали вид, что всё отлично, лишь бы не нарушать внешний покой', value: 'suppressed', categoryScores: { soothing: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-2',
        text: 'Какая модель ведения семейного бюджета была наиболее привычной в детстве?',
        type: 'single',
        options: [
          { label: '🧺 Единый общий котёл: все доходы складывались вместе и крупные траты решались сообща', value: 'common', categoryScores: { shared: 5 }, scaleId: 'v_future' },
          { label: '👑 Один главный добытчик полностью брал на себя финансовую ответственность', value: 'one_leader', categoryScores: { leader: 5 }, scaleId: 'v_future' },
          { label: '💳 Раздельные кошельки: каждый сам за себя, скидываясь на базовые счета', value: 'split', categoryScores: { autonomy: 5 }, scaleId: 'a_autonomy' },
          { label: '🏦 Тотальная бережливость: приоритет накоплений и подушки безопасности «на чёрный день»', value: 'savings', categoryScores: { security: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-3',
        text: 'В моменты неожиданного стресса какую реакцию ты чаще всего замечаешь за собой?',
        type: 'single',
        options: [
          { label: '🌱 Осознанно поступаю иначе, чем родители: говорю прямо, спокойно и без драмы', value: 'conscious_shift', categoryScores: { repair: 5 }, scaleId: 'r_repair' },
          { label: '🚪 Хочется залезть под одеяло, спрятаться от мира и переждать бурю в тишине', value: 'solitary_coping', categoryScores: { avoidance: 4 }, scaleId: 'a_autonomy' },
          { label: '🚨 Включается тревога: стремлюсь немедленно всё проговорить и разложить по полкам', value: 'urgent_clarify', categoryScores: { anxiety: 3, repair: 4 }, scaleId: 'r_repair' },
          { label: '🍳 Начинаю судорожно убираться, готовить или решать практические бытовые вопросы', value: 'action_care', categoryScores: { care: 4 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-4',
        text: 'Какую главную атмосферу ты стремишься бережно создавать в нашем собственном союзе?',
        type: 'single',
        options: [
          { label: '🕯️ Тёплые семейные традиции: уютные совместные ужины, праздники и свой мирок', value: 'traditions', categoryScores: { traditions: 5 }, scaleId: 'v_future' },
          { label: '🚀 Трамплин для взлёта: верим друг в друга, поддерживаем в проектах и мечтах', value: 'growth_support', categoryScores: { support: 5 }, scaleId: 'v_future' },
          { label: '🕊️ Пространство свободы: уважаем личные границы и не душим друг друга нравоучениями', value: 'personal_space', categoryScores: { space: 5 }, scaleId: 'a_autonomy' },
          { label: '😄 Юмор и лёгкость: смеяться над бытовыми пустяками и не делать драм на пустом месте', value: 'lightness', categoryScores: { ease: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d1-5',
        text: 'Распредели 10 баллов приоритетов жизненной энергии в вашей паре:',
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
    subtitle: 'Как вы ведёте себя в острых разногласиях',
    methodology: 'deep',
    categoryKey: 'conflicts',
    levelRequired: 3,
    estimatedMinutes: 6,
    questionsCount: 5,
    description: 'Определяет вашу стратегию в конфликте по модели Томаса-Килманна: поиск синергии, компромисс, осознанная пауза или уступка ради мира.',
    scientificBasis: 'Инструмент Томаса-Килманна (TKI)',
    iconName: 'Swords',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-d2-1',
        text: 'Когда возникает принципиальный спор (куда ехать в отпуск или как потратить крупную сумму):',
        type: 'single',
        options: [
          { label: '📊 Железно аргументировать свою позицию, опираясь на факты и логику до победного', value: 'competing', categoryScores: { assertiveness: 5, cooperativeness: 2 }, scaleId: 'a_autonomy' },
          { label: '🤝 Сесть и досконально искать вариант «win-win», который устроит обоих на 100%', value: 'collaborating', categoryScores: { assertiveness: 5, cooperativeness: 5 }, scaleId: 'r_repair' },
          { label: '⚖️ Предложить честный компромисс 50/50: каждый делает шаг навстречу', value: 'compromising', categoryScores: { assertiveness: 3, cooperativeness: 4 }, scaleId: 'r_repair' },
          { label: '🚪 «Давай пока отложим разговор: утро вечера мудренее, пусть эмоции улягутся»', value: 'avoiding', categoryScores: { assertiveness: 2, cooperativeness: 2 }, scaleId: 'a_autonomy' },
          { label: '🕊️ Легко уступлю: если для партнёра этот вопрос явно важнее и чувствительнее, мне не жалко', value: 'accommodating', categoryScores: { assertiveness: 1, cooperativeness: 5 }, scaleId: 'e_safety' },
        ],
      },
      {
        id: 'q-d2-2',
        text: 'В принципиальном споре, касающемся важных жизненных решений, для тебя важнее всего:',
        type: 'single',
        options: [
          { label: '🌟 Найти решение, при котором оба партнёра получат желаемое без ущемления интересов', value: 'synergy_first', categoryScores: { assertiveness: 4, cooperativeness: 5 }, scaleId: 'r_repair' },
          { label: '❤️ Сохранить мир и эмоциональное тепло в паре, даже если придётся скорректировать ожидания', value: 'peace_priority', categoryScores: { assertiveness: 1, cooperativeness: 5 }, scaleId: 'e_safety' },
          { label: '⚖️ Добиться справедливого баланса 50/50, где уступки взаимны и прозрачны', value: 'fair_split', categoryScores: { assertiveness: 3, cooperativeness: 3 }, scaleId: 'r_repair' },
          { label: '🧠 Здравый смысл: чтобы принятое решение было логически обоснованным и практичным', value: 'logic_clarity', categoryScores: { assertiveness: 5, cooperativeness: 2 }, scaleId: 'a_autonomy' },
        ],
      },
      {
        id: 'q-d2-3',
        text: 'Партнёр предлагает вариант, который тебе не по душе, но ты валишься с ног от усталости:',
        type: 'single',
        options: [
          { label: '😴 «Я сейчас не в силах соображать. Давай перенесём на завтра, когда я высплюсь»', value: 'pause_until_rested', categoryScores: { cooperativeness: 4, assertiveness: 3 }, scaleId: 'a_autonomy' },
          { label: '⚡ Быстрый экспресс-вариант: «Давай сделаем ключевую часть по-твоему, а деталь скорректируем»', value: 'quick_compromise', categoryScores: { assertiveness: 3, cooperativeness: 4 }, scaleId: 'r_repair' },
          { label: '🏳️ Соглашусь с партнёром, чтобы не затягивать спор в состоянии переутомления', value: 'gentle_concession', categoryScores: { cooperativeness: 5, assertiveness: 1 }, scaleId: 'e_safety' },
          { label: '💡 Найду в себе ресурс спокойно и чётко объяснить, почему этот вариант вызывает сомнения', value: 'clear_explanation', categoryScores: { assertiveness: 5, cooperativeness: 3 }, scaleId: 'r_repair' },
        ],
      },
      {
        id: 'q-d2-4',
        text: 'В комнате чувствуется скрытый холодок (разговора ещё не было, но чувствуется напряжение):',
        type: 'single',
        options: [
          { label: '💬 Подойду и открыто спрошу: «Я чувствую напряжение между нами. Давай поговорим начистоту»', value: 'direct_openness', categoryScores: { assertiveness: 5, cooperativeness: 4 }, scaleId: 'r_repair' },
          { label: '⏳ Даю обоим время спокойно подумать и собраться с мыслями перед разговором', value: 'thoughtful_pause', categoryScores: { avoidance: 3, cooperativeness: 3 }, scaleId: 'a_autonomy' },
          { label: '🍵 Создаю уютную атмосферу (чай, вкусняшка, тёплый плед), чтобы партнёру было легко открыться', value: 'nurture_safety', categoryScores: { cooperativeness: 5, assertiveness: 2 }, scaleId: 'e_safety' },
          { label: '🚶 Предлагаю пойти прогуляться или развеяться, чтобы перезагрузить эмоциональный фон', value: 'action_deescalation', categoryScores: { cooperativeness: 4, avoidance: 2 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-d2-5',
        text: 'В конструктивном разрешении разногласий главное для нашей пары — это:',
        type: 'single',
        options: [
          { label: '🛡️ Беречь чувства и достоинство друг друга, избегая колкостей, сарказма и критики', value: 'care_and_dignity', categoryScores: { cooperativeness: 5 }, scaleId: 'r_repair' },
          { label: '❤️ Уметь вовремя услышать зерно боли в словах партнёра и первым сделать шаг навстречу', value: 'mutual_understanding', categoryScores: { collaborating: 5 }, scaleId: 'r_repair' },
          { label: '📝 Чёткие выводы на будущее: договорились, зафиксировали и больше не попрекаем', value: 'fact_agreements', categoryScores: { competing: 2, collaborating: 4 }, scaleId: 'v_future' },
        ],
      },
    ],
  },

  // PT: Профиль личности (Big Five)
  {
    id: 'TEST-PT',
    slug: 'personality-type-big5',
    title: 'Профиль личности (Big Five)',
    subtitle: 'Анатомия наших характеров и темперамента',
    methodology: 'scientific',
    categoryKey: 'lifestyle',
    levelRequired: 1,
    estimatedMinutes: 5,
    questionsCount: 8,
    description: 'Определяет тип личности по модели «Большой пятёрки»: экстраверсия, доброжелательность, дисциплина, эмоциональная стабильность и открытость новому опыту.',
    scientificBasis: 'Модель «Большая пятёрка» (Big Five, Costa & McCrae)',
    iconName: 'Fingerprint',
    partner1Done: false,
    partner2Done: false,
    questions: [
      {
        id: 'q-pt-1',
        text: 'После шумного вечера на вечеринке или в большой компании твоё состояние:',
        type: 'single',
        options: [
          { label: '⚡ Заряжен(а) на 100%! Хочу продолжения банкета, танцев и общения до утра', value: 'extravert', categoryScores: { extraversion: 5 }, scaleId: 's23' },
          { label: '🔋 Отлично пообщался(лась), но лучший момент — сесть в такси и ехать в тишине домой', value: 'introvert', categoryScores: { introversion: 5 }, scaleId: 's23' },
          { label: '👀 Сначала сижу на диване и присматриваюсь, а к концу вечера разогреваюсь', value: 'observer_warms', categoryScores: { extraversion: 3, conscientiousness: 3 }, scaleId: 's23' },
          { label: '🎩 Включаю режим заботливого хоста: слежу, чтобы всем было комфортно и весело', value: 'host_control', categoryScores: { conscientiousness: 4, agreeableness: 3 }, scaleId: 's21' },
        ],
      },
      {
        id: 'q-pt-2',
        text: 'Спонтанный отпуск через 2 дня: твоя реакция при сборах:',
        type: 'single',
        options: [
          { label: '📋 Мне нужен чёткий тайминг: брони отелей, билеты и список вещей по пунктам', value: 'structured', categoryScores: { conscientiousness: 5 }, scaleId: 's21' },
          { label: '🎒 Огонь! Бросаем вещи в рюкзак за 10 минут, всё решим на месте!', value: 'spontaneous', categoryScores: { openness: 4, conscientiousness: 1 }, scaleId: 's21' },
          { label: '🗺️ Полностью доверю детали партнёру — главное, чтобы мы поехали вместе', value: 'delegating', categoryScores: { agreeableness: 4 }, scaleId: 'a_autonomy' },
          { label: '💡 Набросаю 3 разных гибких сценария под настроение и погоду', value: 'options_open', categoryScores: { openness: 4 }, scaleId: 's24' },
        ],
      },
      {
        id: 'q-pt-3',
        text: 'Неожиданный форс-мажор (отменили рейс, затопили соседи): твоя внутренняя реакция:',
        type: 'forced_vulnerability',
        options: [
          { label: '😰 Внутри всё сжимается от тревоги, пульс скачет, мысли хаотично ускоряются', value: 'neurotic_reaction', categoryScores: { neuroticism: 4 }, scaleId: 's1' },
          { label: '🤖 Включается хладнокровный робот: отключаю эмоции и чётко решаю проблемы по одной', value: 'stable_focus', categoryScores: { stability: 5 }, scaleId: 's12' },
          { label: '🧩 Воспринимаю как квест и головоломку: ну-ка, посмотрим, как мы выкрутимся!', value: 'curious_problem', categoryScores: { openness: 4, stability: 3 }, scaleId: 's24' },
          { label: '📞 Срочно звоню партнёру или другу: мне жизненно важно разделить эти переживания', value: 'social_support', categoryScores: { extraversion: 3, agreeableness: 3 }, scaleId: 'c_closeness' },
        ],
      },
      {
        id: 'q-pt-4',
        text: 'Твой рабочий стол (физический стол в комнате или экран ноутбука):',
        type: 'single',
        options: [
          { label: '📐 Идеальный порядок: файлы по папкам с датами, каждая вещь на своём месте', value: 'order_architect', categoryScores: { conscientiousness: 5 }, scaleId: 's21' },
          { label: '🌪️ Творческий хаос: 73 открытые вкладки, но я волшебным образом всё помню', value: 'creative_chaos', categoryScores: { openness: 4, conscientiousness: 1 }, scaleId: 's21' },
          { label: '🌊 Волнообразно: раз в месяц генеральная уборка, а между ними — нарастающий хаос', value: 'cyclic_order', categoryScores: { conscientiousness: 3 }, scaleId: 's21' },
        ],
      },
      {
        id: 'q-pt-5',
        text: 'В дискуссии собеседник упорно несёт явную ерунду, но искренне в неё верит:',
        type: 'single',
        options: [
          { label: '🧘 Спокойно изложу факты один раз и отойду в сторону: спорить с пеной у рта не стану', value: 'calm_assertive', categoryScores: { agreeableness: 3, stability: 4 }, scaleId: 'r_repair' },
          { label: '🤔 Постараюсь понять, что стоит за его логикой: откуда у него эта точка зрения?', value: 'empathic_probe', categoryScores: { agreeableness: 5 }, scaleId: 'c_closeness' },
          { label: '⚔️ Корректно, но безжалостно разнесу аргументы железной логикой и фактами', value: 'direct_logic', categoryScores: { agreeableness: 2, conscientiousness: 4 }, scaleId: 'r_repair' },
          { label: '😏 Промолчу с лёгкой улыбкой, сделав свои выводы на будущее', value: 'strategic_patience', categoryScores: { conscientiousness: 4 }, scaleId: 'a_autonomy' },
        ],
      },
      {
        id: 'q-pt-6',
        text: 'Какую роль ты чаще всего занимаешь в новом коллективе или компании?',
        type: 'single',
        options: [
          { label: '💡 Генератор идей: подкидываю смелые мысли, нестандартные темы и шутки', value: 'generator', categoryScores: { openness: 5 }, scaleId: 's24' },
          { label: '🤗 Тёплый клей: со всеми поговорю, всех подружу и создам душевный общий настрой', value: 'connector', categoryScores: { extraversion: 5 }, scaleId: 's23' },
          { label: '⚓ Спокойный оплот: молчаливый эксперт, на которого можно положиться на 100%', value: 'quiet_anchor', categoryScores: { conscientiousness: 5 }, scaleId: 's21' },
          { label: '🧐 Вдумчивый наблюдатель: сближаюсь медленно, но искренне и надолго', value: 'deep_observer', categoryScores: { stability: 3, introversion: 4 }, scaleId: 's23' },
        ],
      },
      {
        id: 'q-pt-7',
        text: 'После безумного месяца дедлайнов твой идеальный вечер перезагрузки — это:',
        type: 'single',
        options: [
          { label: '🚀 Рвануть в незнакомое атмосферное место за свежими яркими впечатлениями', value: 'novelty_craving', categoryScores: { openness: 4, extraversion: 3 }, scaleId: 's23' },
          { label: '🛋️ Домашний бункер: тёплый плед, любимая пицца, сериал и полная тишина', value: 'ritual_home', categoryScores: { tradition: 4, stability: 3 }, scaleId: 'e_safety' },
          { label: '🍷 Глубокий неспешный вечер только с любимым человеком за вином и разговорами', value: 'deep_bond', categoryScores: { intimacy: 4 }, scaleId: 'c_closeness' },
          { label: '✅ Закрыть все мелкие висящие дела, чтобы наконец выдохнуть с чистой совестью', value: 'duty_first', categoryScores: { conscientiousness: 4 }, scaleId: 's21' },
        ],
      },
      {
        id: 'q-pt-8',
        text: 'Распредели 10 баллов между четырьмя гранями своей личности:',
        type: 'trade_off',
        totalPoints: 10,
        options: [],
        tradeOffItems: [
          { id: 'energy', label: 'Заряд от общения, драйва и людей', scaleId: 's23' },
          { id: 'order', label: 'Порядок, структура и самодисциплина', scaleId: 's21' },
          { id: 'novelty', label: 'Любопытство к новому и гибкость', scaleId: 's24' },
          { id: 'harmony', label: 'Мягкость, теплота и забота о других', scaleId: 'c_closeness' },
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
