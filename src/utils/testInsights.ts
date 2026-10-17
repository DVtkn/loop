import { TestCategory } from '../types.ts';

export interface PersonalTestInsight {
  archetype: string;
  archetypeEmoji: string;
  topTrait: string;
  insight: string;
  partnerTip: string;
  xpEarned: number;
}

export interface PairTestComparison {
  synergyScore: number;
  coupleBadge: string;
  coupleBadgeEmoji: string;
  synergySummary: string;
  matchesCount: number;
  totalQuestions: number;
  differencesInsight: string;
  questionComparisons: {
    questionId: string;
    questionText: string;
    p1Label: string;
    p2Label: string;
    isExactMatch: boolean;
    harmonyTip: string;
  }[];
}

export function computePersonalTestInsight(
  test: TestCategory,
  answers: Record<string, any>
): PersonalTestInsight {
  const testId = test.id;
  const rawAnswersStr = JSON.stringify(answers);

  if (testId === 'TEST-S2' || test.slug === 'five-love-languages') {
    // 5 языков любви
    let words = 0;
    let time = 0;
    let acts = 0;
    let touch = 0;
    let gifts = 0;

    Object.values(answers).forEach((val) => {
      if (typeof val === 'object' && val !== null) {
        words += Number(val.words || 0);
        time += Number(val.time || 0);
        acts += Number(val.acts || 0);
        touch += Number(val.touch || 0);
      } else {
        const s = String(val);
        if (s.includes('words')) words += 5;
        if (s.includes('time')) time += 5;
        if (s.includes('acts')) acts += 5;
        if (s.includes('touch')) touch += 5;
        if (s.includes('gifts')) gifts += 5;
      }
    });

    const scores = [
      { key: 'time', label: 'Качественное время', score: time, emoji: '⏳' },
      { key: 'touch', label: 'Прикосновения & Тепло', score: touch, emoji: '🫂' },
      { key: 'words', label: 'Слова признания & Поддержка', score: words, emoji: '💬' },
      { key: 'acts', label: 'Забота на деле', score: acts, emoji: '🛠️' },
      { key: 'gifts', label: 'Внимание & Сюрпризы', score: gifts, emoji: '🎁' },
    ].sort((a, b) => b.score - a.score);

    const top = scores[0];

    const MAP: Record<string, { arch: string; ins: string; tip: string }> = {
      time: {
        arch: 'Хранитель душевного присутствия',
        ins: 'Для тебя любовь — это неделимое внимание без экранов телефонов, когда вы смотрите друг другу в глаза.',
        tip: 'Чтобы подарить тебе счастье, достаточно отложить дела на 20 минут и просто попить чай вдвоём.',
      },
      touch: {
        arch: 'Океан тактильности & нежности',
        ins: 'Физическое тепло, объятия и нежные касания — твой самый надёжный проводник чувства безопасности.',
        tip: 'В моменты усталости обними крепко и молча под пледом: прикосновения лечат твоё сердце лучше любых слов.',
      },
      words: {
        arch: 'Вдохновитель & Чуткий собеседник',
        ins: 'Искренние слова гордости, комплименты и признания окрыляют тебя и заряжают энергией на весь день.',
        tip: 'Не стесняйся говорить вслух: «Я так горжусь тобой, ты потрясающий(ая)» — это то, что наполняет твой сосуд.',
      },
      acts: {
        arch: 'Мастер искренней заботы на деле',
        ins: 'Поступки звучат для тебя громче тысячи красивых фраз: сваренный кофе или решённая бытовая проблема.',
        tip: 'Маленькая помощь в быту или снятый груз забот — для тебя лучшее доказательство настоящей любви.',
      },
      gifts: {
        arch: 'Эстет трогательного внимания',
        ins: 'Для тебя важен не ценник, а сам факт: «Я шёл(ла) мимо, вспомнил(а) о тебе и принёс(ла) твой любимый десерт».',
        tip: 'Неожиданная маленькая приятность без повода вызывает в твоей душе настоящую бурю нежности.',
      },
    };

    const chosen = MAP[top.key] || MAP.time;

    return {
      archetype: chosen.arch,
      archetypeEmoji: top.emoji,
      topTrait: `Главный язык: ${top.label}`,
      insight: chosen.ins,
      partnerTip: chosen.tip,
      xpEarned: 150,
    };
  }

  if (testId === 'TEST-S1' || test.slug === 'attachment-style') {
    // Стили привязанности
    let anxiety = 0;
    let avoidance = 0;
    let security = 0;

    Object.values(answers).forEach((val) => {
      const s = String(val);
      if (s.includes('anxiety') || s.includes('immediate') || s.includes('daily_pings')) anxiety += 4;
      if (s.includes('avoid') || s.includes('solitude') || s.includes('private')) avoidance += 4;
      if (s.includes('secure') || s.includes('calm') || s.includes('team') || s.includes('care')) security += 4;
    });

    if (security >= anxiety && security >= avoidance) {
      return {
        archetype: 'Надёжная гавань союза',
        archetypeEmoji: '🛡️',
        topTrait: 'Надёжный стиль привязанности (ECR)',
        insight: 'Ты умеешь давать любимому человеку свободу и при этом оставаться тёплой несокрушимой опорой в любые штормы.',
        partnerTip: 'Ты даришь партнёру чувство безопасности. Главное — не забывать озвучивать свои собственные потребности.',
        xpEarned: 150,
      };
    } else if (anxiety > avoidance) {
      return {
        archetype: 'Чуткое горячее сердце',
        archetypeEmoji: '❤️',
        topTrait: 'Чуткий стиль с жаждой сонастройки',
        insight: 'Ты глубоко чувствуешь любое изменение эмоционального фона и стремишься сразу вернуть душевный контакт.',
        partnerTip: 'Короткая нежная смска или теплое объятие при встрече моментально растворяют любые твои тревоги.',
        xpEarned: 150,
      };
    } else {
      return {
        archetype: 'Мудрый хранитель автономии',
        archetypeEmoji: '🦅',
        topTrait: 'Автономный стиль с ценностью границ',
        insight: 'Ты бережно защищаешь своё личное пространство, чтобы восстановить ресурс и вернуться к партнёру с полной любовью.',
        partnerTip: 'Когда ты уходишь в тишину — это не холод, а способ перезарядиться. Дайте 15 минут, и ты вернёшься с улыбкой.',
        xpEarned: 150,
      };
    }
  }

  if (testId === 'TEST-S3' || test.slug === 'gottman-four-horsemen') {
    // Готтман
    if (rawAnswersStr.includes('soft_startup') || rawAnswersStr.includes('empathy')) {
      return {
        archetype: 'Мастер мягкого старта',
        archetypeEmoji: '✨',
        topTrait: 'Антидот Готтмана: Мягкий диалог',
        insight: 'Твоя суперсила — способность говорить о боли и недовольстве без ядовитых стрел, сохраняя уважение к любимому.',
        partnerTip: 'Объятия и юмор — твой лучший мостик к миру. С тобой легко выходить даже из горячих споров.',
        xpEarned: 150,
      };
    } else {
      return {
        archetype: 'Осознанный миротворец',
        archetypeEmoji: '🕊️',
        topTrait: 'Конструктивная деэскалация',
        insight: 'Ты понимаешь ценность паузы и тайм-аута: лучше вовремя выпить стакан воды, чем разрушать близость на эмоциях.',
        partnerTip: 'В пылу спора предложи 20-минутный тайм-аут: после него разговор пойдёт в 10 раз теплее.',
        xpEarned: 150,
      };
    }
  }

  if (testId === 'TEST-C1' || test.slug === 'ideal-day') {
    // Идеальный день
    if (rawAnswersStr.includes('cozy') || rawAnswersStr.includes('relax')) {
      return {
        archetype: 'Гедонист уютных выходных',
        archetypeEmoji: '☕',
        topTrait: 'Вайб: Неспешный домашний уют',
        insight: 'Поваляться в кровати до полудня, завтрак под пледом и любимый сериал — твой рецепт абсолютного субботнего счастья.',
        partnerTip: 'Не торопи с утра: дай не спеша проснуться, принеси кофе в постель — и день начнётся волшебно.',
        xpEarned: 150,
      };
    } else {
      return {
        archetype: 'Искатель ярких впечатлений',
        archetypeEmoji: '🥐',
        topTrait: 'Вайб: Сырники, кофе & городские открытия',
        insight: 'Тебя заряжает движение: уютные кафе, красивые городские улочки, выставки и свежий воздух.',
        partnerTip: 'Спонтанная прогулка по новым местам с чашкой фильтр-кофе подарит тебе максимум вдохновения.',
        xpEarned: 150,
      };
    }
  }

  if (testId === 'TEST-S4' || test.slug === 'sternberg-love-triangle') {
    return {
      archetype: 'Архитектор глубокого союза',
      archetypeEmoji: '💎',
      topTrait: 'Гармония близости и надёжного тыла',
      insight: 'Ты видишь в партнёре одновременно лучшего друга, чувственного любовника и надёжного спутника на всю жизнь.',
      partnerTip: 'Тебе важно не только мечтать о будущем, но и регулярно устраивать романтические искры прямо сейчас.',
      xpEarned: 150,
    };
  }

  if (testId === 'TEST-D1' || test.slug === 'family-scripts') {
    return {
      archetype: 'Хранитель новых традиций',
      archetypeEmoji: '🏡',
      topTrait: 'Осознанные правила собственного дома',
      insight: 'Ты умеешь отсекать устаревшие родительские паттерны и создавать свои тёплые, искренние правила для вашей пары.',
      partnerTip: 'Создавайте свои маленькие ритуалы: воскресные блинчики или вечерние прогулки — это строит ваш мир.',
      xpEarned: 150,
    };
  }

  if (testId === 'TEST-D2' || test.slug === 'conflict-resolution-styles') {
    return {
      archetype: 'Мудрый дипломат союза',
      archetypeEmoji: '🤝',
      topTrait: 'Стратегия Win-Win & Согласие',
      insight: 'В любом разногласии ты ищешь решение, при котором оба партнёра чувствуют себя услышанными и победителями.',
      partnerTip: 'Ты ценишь справедливость и честный диалог без ударов ниже пояса.',
      xpEarned: 150,
    };
  }

  // Default / Big Five
  return {
    archetype: 'Яркая многогранная личность',
    archetypeEmoji: '🌟',
    topTrait: 'Баланс открытости, чуткости и энергии',
    insight: 'Ты органично соединяешь в себе любопытство к новым горизонтам, заботу о близких и способность держать удар.',
    partnerTip: 'Твоя искренность и верность себе делают союз живым и настоящим.',
    xpEarned: 150,
  };
}

export function computePairTestComparison(
  test: TestCategory,
  p1Answers: Record<string, any> = {},
  p2Answers: Record<string, any> = {},
  p1Name: string = 'Партнёр 1',
  p2Name: string = 'Партнёр 2'
): PairTestComparison {
  const questions = test.questions || [];
  let matchesCount = 0;

  const questionComparisons = questions.map((q) => {
    const val1 = p1Answers[q.id];
    const val2 = p2Answers[q.id];

    let p1Label = 'Не ответил(а)';
    let p2Label = 'Не ответил(а)';

    if (q.type === 'trade_off') {
      p1Label = 'Распределил(а) приоритеты';
      p2Label = 'Распределил(а) приоритеты';
    } else {
      const opt1 = q.options?.find((o) => o.value === val1);
      const opt2 = q.options?.find((o) => o.value === val2);
      if (opt1) p1Label = opt1.label;
      if (opt2) p2Label = opt2.label;
    }

    const isExactMatch =
      val1 !== undefined &&
      val2 !== undefined &&
      (val1 === val2 || JSON.stringify(val1) === JSON.stringify(val2));

    if (isExactMatch) matchesCount++;

    let harmonyTip = isExactMatch
      ? '💚 Вы выбрали одинаковый вариант! Полная телепатия и синхрон взглядов.'
      : '⚡ Разные взгляды — это не повод для спора, а красивый тандем: вы дополняете друг друга!';

    return {
      questionId: q.id,
      questionText: q.text,
      p1Label,
      p2Label,
      isExactMatch,
      harmonyTip,
    };
  });

  const total = questions.length || 1;
  const synergyScore = Math.min(98, Math.max(72, Math.round(75 + (matchesCount / total) * 23)));

  let coupleBadge = '«Команда мечты & Взаимная опора»';
  let coupleBadgeEmoji = '✨';

  if (synergyScore >= 90) {
    coupleBadge = '«Союз телепатов & Полный синхрон»';
    coupleBadgeEmoji = '💫';
  } else if (synergyScore >= 82) {
    coupleBadge = '«Инь и Ян: Идеальный баланс»';
    coupleBadgeEmoji = '☯️';
  }

  const synergySummary = `Вы с ${p2Name} завершили этот тест! Совпадение взглядов составило ${synergyScore}%. В ${matchesCount} из ${total} ситуаций вы мыслите абсолютно одинаково, а различия создают идеальный баланс.`;
  const differencesInsight = `В тех вопросах, где ваши ответы разошлись, вы органично дополняете друг друга: там, где одному нужна пауза, второй приносит тепло и заботу.`;

  return {
    synergyScore,
    coupleBadge,
    coupleBadgeEmoji,
    synergySummary,
    matchesCount,
    totalQuestions: total,
    differencesInsight,
    questionComparisons,
  };
}
