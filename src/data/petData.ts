import { PetSpecies } from '../types.ts';

export const RANDOM_PET_NAMES = [
  'Бусинка', 'Пиксель', 'Моти', 'Зефирка', 'Пончик',
  'Чипсик', 'Лучик', 'Байт', 'Тоффи', 'Пуговка'
];

export interface SpeciesConfig {
  title: string;
  badge: string;
  trait: string;
  bonus: string;
  eggGradient: string;
  image: string;
  imageFallback: string;
}

export const PET_SPECIES_DETAILS: Record<PetSpecies, SpeciesConfig> = {
  dog: {
    title: 'ЧИХУАХУА',
    badge: 'Преданный & Бодрый',
    trait: 'Преданный и жизнерадостный щенок',
    bonus: '+15% к энергии от совместных свиданий',
    eggGradient: 'from-[#FFE394] via-[#FFAEBD] to-[#FF8FA3]',
    image: '/assets/tamagotchi/dog-happy.jpg',
    imageFallback: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHetbq7FldgIT8gIsFWK6AJ0BDWnZvOpSOXdZ2GeFJDc_H5tUpe0CwR9RPrg5j9DoS-_NgbHa-CRGmI4vACoSVqE74QsKVM4b9KLQrqprLG6kpLPhrZrvZ7MAXxsE4L7Vv8uMV3cJjIhZ7T8I60itzbhmeE0Mhdt5i2ZNdmrTY7cnpnb5_-EIy2n9F9NlgOcTvRcatnrQQAS0I76grcjNGUguiH68TM-DKSNnKnTCnatw_yvGPR5oBvg',
  },
  cat: {
    title: 'КОШЕЧКА',
    badge: 'Ласковая & Мурчащая',
    trait: 'Мягкая, уютная и ласковая кошка',
    bonus: '+15% к радости от совместных касаний',
    eggGradient: 'from-[#C4B5FD] via-[#A7F3D0] to-[#6EE7B7]',
    image: '/assets/tamagotchi/cat-happy.jpg',
    imageFallback: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9CUkEIg3KYo7vRkIl9aNFKuI_YylFZnPxuGLbMAU-BE59Kn_O4dgg8Rsrz3WChhz-g6hi9_pyt-RMlb_46D_naW5P9IeY8hDmoIyfR_B59a4ZvX4yM8h_23rlS3HtP6nf7rQ2LXNKRrnOKo3iW6A1F47utWuwzlhyX0dMGHjpYzFPvf9A02B6rn-OgXHyJpfokvVeaIES7OIEBDXwlEZjZ_UUdEo6iNF6IODjsAHHGBFLoqgI2yMMVg',
  },
};

export const SLEEP_IMAGE = '/assets/tamagotchi/dog-sleep.jpg';
export const SLEEP_IMAGE_FALLBACK = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYQBzgEj8bxvPylrR-g0Wxlq_lQprKeW-lB9TW_KxP55ElP5RK4F9TKNj7CFawvCwbkKXRMVCpN4hkTotd4-LpgiBhoufpQpk2ondK1giu_dFAWgKjr73oopIucQGlNQHqRBP3xh4QZCppS0rnRp32N5LznWmwZVezLu2a4HkniAz8E3RIwQ9ZpL6sRvK-UE2IDxDLBGld-m7dEHky0YSw5_GzBVOtgjjwiFe8u8Mts2yNLdptP3OkCQ';

export const MOOD_BUBBLES: Record<string, string> = {
  happy: 'Тяв! Люблю вас! 💖',
  sleepy: 'Клюю носом... уложи спать 🥱💤',
  hungry: 'Животик урчит... дай поесть! 🥩🥺',
  playful: 'Поиграем скорее в мячик? 🎾⚡',
  loved: 'Муррр~ самое теплое счастье! +5❤️',
  dirty: 'Ой, я весь испачкался! Хочу в ванну! 🧼🛁',
};

export type PetVisualStateType = 'dirty' | 'sleepy' | 'hungry' | 'sad' | 'sparkling' | 'happy';

export interface PetVisualStatus {
  stateType: PetVisualStateType;
  primaryAction: 'feed' | 'play' | 'wash' | 'sleep' | null;
  urgency: 'critical' | 'warning' | 'normal' | 'thriving';
  badgeText: string;
  badgeEmoji: string;
  badgeClass: string;
  buttonHighlight: string;
  speech: string;
  isDirty: boolean;
  isVeryDirty: boolean;
  isSleepy: boolean;
  isDeeplySleepy: boolean;
  isHungry: boolean;
  isStarving: boolean;
  isSad: boolean;
  isSparkling: boolean;
  isLoved: boolean;
}

export const STATE_PET_QUOTES: Record<PetSpecies, Record<PetVisualStateType, string[]>> = {
  dog: {
    dirty: [
      'Я просто исследовал мир... и нашел лужу! 🐾🧼',
      'Чумазый нос — признак веселой прогулки! Помоешь? 🛁',
      'Буль-буль! Хочу пенную ванну с уточкой! 🦆🫧',
      'Ой-ой, я весь в пыли и репьях! Срочно спасать шерстку! 🧼',
    ],
    sleepy: [
      'Зев-зев... глазки слипаются, уложи спать 🥱💤',
      'Я не сплю, я просто очень медленно моргаю... 💤',
      'Уложи меня под одеялко и поцелуй в нос! 🛌🐾',
      'Хррр-пссс... мне снится огромная сосиска... 💤🥩',
    ],
    hungry: [
      'Животик урчит! Где моя сочная вкусняшка? 🥩🥺',
      'Мой желудок исполняет оперу «Дай поесть»! 🍖',
      'Служу за еду! Сделаю любой трюк за кусочек мяса! 🐾',
      'Кушать подано? Нет? А когда будет, хозяин? 🥺',
    ],
    sad: [
      'Мне так грустно одному... брось скорее мячик! 🎾🥺',
      'Пойдем гулять и веселиться, я соскучился! 🐾',
      'Почеши за ушком, не оставляй меня грустить 🥺💔',
    ],
    sparkling: [
      'Пахну цветочками и блещу чистотой! Гав-ура! ✨🧼',
      'Хвостик расчесан, шерстка блестит на солнце! ✨🐕',
      'Я самый чистый и красивый чемпион! 🏆✨',
    ],
    happy: [
      'Тяв! Где вкусняшка? Я видел колбаску! 🥩',
      'Ты лучший человек во вселенной! 💖',
      'Почеши пузико! Срочно! 🐾',
      'Хвост виляет быстрее скорости света! 🐕✨',
      'Я здесь главный охранник ваших сердечек! 🛡️❤️',
    ],
  },
  cat: {
    dirty: [
      'Я же благородная кошка, а не трубочист! В ванну! 🧼👑',
      'Шерстка слиплась от пыли... мне срочно нужно мытье! 🛁',
      'Мои белые лапки стали черными... непорядок! 🐾🧼',
      'Помой меня деликатно, чтобы шубка снова сияла! 🫧',
    ],
    sleepy: [
      'Мур-мяу... клубочком сворачиваюсь, пора байкать 💤🌙',
      'Включаю ночной энергосберегающий режим... Zzz 🥱',
      'Не трогай, я превратился в пушистую подушку 💤',
      'Зеваю во всю пасть... отнеси меня на лежанку 🥱🛌',
    ],
    hungry: [
      'Человек! Миска пуста уже целую вечность! 🐟😿',
      'На дне миски видна пустота! Наполни ее паштетом! 🍣',
      'Мяу-тревога! Уровень рыбки в организме: 0%! 🐟⚡',
      'Если не покормишь — сделаю кусь за пятку! 😈',
    ],
    sad: [
      'Скучно... побегай со мной с веревочкой или лазером! 🧶😿',
      'Мне одиноко... почеши за ушком и помурчим 🥺',
      'Где мои любимые люди? Хочу внимания! 🐾',
    ],
    sparkling: [
      'Сияю как сокровище! Идеальная пушистая шубка! 🌸✨',
      'Муррр, обожаю быть чистенькой и благоухающей! 🛁✨',
      'Шерстинка к шерстинке! Королевский лоск! 👑✨',
    ],
    happy: [
      'Мур-мяу! Уровень милоты: 1000% 🌸',
      'Кусь! Это я так выражаю безумную любовь! ❤️',
      'Я здесь божество, а ты мой любимый слуга с паштетом 👑',
      'Муррр~ лапками делаю массаж 🐾',
      'Тыгыдык-тыгыдык по всей квартире! ⚡',
    ],
  },
};

export const FUNNY_PET_QUOTES: Record<PetSpecies, string[]> = {
  dog: STATE_PET_QUOTES.dog.happy,
  cat: STATE_PET_QUOTES.cat.happy,
};

export function getPetVisualStatus(pet: {
  cleanliness: number;
  energy: number;
  hunger: number;
  joy: number;
  species: PetSpecies;
  mood?: string;
}, isNight?: boolean): PetVisualStatus {
  const isDirty = pet.cleanliness < 45;
  const isVeryDirty = pet.cleanliness < 25;
  const isNightTime = isNight ?? (new Date().getHours() >= 23 || new Date().getHours() < 7);
  const isSleepy = pet.energy < 45 || isNightTime || pet.mood === 'sleepy';
  const isDeeplySleepy = pet.energy < 25 || (isNightTime && pet.energy < 50);
  const isHungry = pet.hunger < 45;
  const isStarving = pet.hunger < 25;
  const isSad = pet.joy < 45;
  const isSparkling = pet.cleanliness >= 80;
  const isLoved = pet.joy >= 70 && pet.hunger >= 60 && pet.energy >= 50 && pet.cleanliness >= 50;

  // Find lowest critical need
  const needs = [
    { type: 'dirty' as PetVisualStateType, action: 'wash' as const, val: pet.cleanliness },
    { type: 'sleepy' as PetVisualStateType, action: 'sleep' as const, val: pet.energy },
    { type: 'hungry' as PetVisualStateType, action: 'feed' as const, val: pet.hunger },
    { type: 'sad' as PetVisualStateType, action: 'play' as const, val: pet.joy },
  ];
  needs.sort((a, b) => a.val - b.val);

  const lowest = needs[0];

  if (lowest.val < 25) {
    if (lowest.type === 'dirty') {
      return {
        stateType: 'dirty',
        primaryAction: 'wash',
        urgency: 'critical',
        badgeText: 'Весь в грязи! Срочно помыть',
        badgeEmoji: '🧼',
        badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 animate-pulse',
        buttonHighlight: 'ring-2 ring-cyan-400 ring-offset-1 shadow-lg bg-cyan-500/20 text-cyan-600',
        speech: pet.species === 'cat'
          ? 'Шерстка слиплась от грязи... помой меня скорее! 🧼'
          : 'Я весь в лужах и грязи! Срочно в ванну! 🛁',
        isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
      };
    }
    if (lowest.type === 'sleepy') {
      return {
        stateType: 'sleepy',
        primaryAction: 'sleep',
        urgency: 'critical',
        badgeText: 'Засыпает на ходу',
        badgeEmoji: '💤',
        badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 animate-pulse',
        buttonHighlight: 'ring-2 ring-indigo-400 ring-offset-1 shadow-lg bg-indigo-500/20 text-indigo-600',
        speech: pet.species === 'cat'
          ? 'Глазки слипаются... уложи в кроватку 🥱💤'
          : 'Зев-зев... лапки подкашиваются, спать хочу 💤',
        isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
      };
    }
    if (lowest.type === 'hungry') {
      return {
        stateType: 'hungry',
        primaryAction: 'feed',
        urgency: 'critical',
        badgeText: 'Ужасно голоден!',
        badgeEmoji: '🍓',
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse',
        buttonHighlight: 'ring-2 ring-rose-400 ring-offset-1 shadow-lg bg-rose-500/20 text-rose-600',
        speech: pet.species === 'cat'
          ? 'Животик бурчит! Где моя рыбка? 🐟🥺'
          : 'Я сейчас съем свои лапки! Дай вкусняшку! 🥩🥺',
        isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
      };
    }
    // sad
    return {
      stateType: 'sad',
      primaryAction: 'play',
      urgency: 'critical',
      badgeText: 'Очень тоскует...',
      badgeEmoji: '🥺',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse',
      buttonHighlight: 'ring-2 ring-amber-400 ring-offset-1 shadow-lg bg-amber-500/20 text-amber-600',
      speech: pet.species === 'cat'
        ? 'Мне так одиноко... поиграй со мной! 🧶🥺'
        : 'Хвостик опустился... давай скорее играть! 🎾🥺',
      isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
    };
  }

  // Warning level (< 45)
  if (lowest.val < 45) {
    if (lowest.type === 'dirty') {
      return {
        stateType: 'dirty',
        primaryAction: 'wash',
        urgency: 'warning',
        badgeText: 'Испачкался: пора купаться',
        badgeEmoji: '🧼',
        badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
        buttonHighlight: 'ring-1.5 ring-cyan-400/80 bg-cyan-500/15',
        speech: pet.species === 'cat'
          ? 'Шерстка запылилась, пора бы в ванну 🧼'
          : 'Я извалялся на прогулке, помой меня! 🛁',
        isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
      };
    }
    if (lowest.type === 'sleepy') {
      return {
        stateType: 'sleepy',
        primaryAction: 'sleep',
        urgency: 'warning',
        badgeText: 'Клюёт носом: хочет спать',
        badgeEmoji: '💤',
        badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
        buttonHighlight: 'ring-1.5 ring-indigo-400/80 bg-indigo-500/15',
        speech: pet.species === 'cat'
          ? 'Мур... сладко зеваю, пора отдыхать 🥱'
          : 'Сил мало осталось, уложи в постельку 💤',
        isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
      };
    }
    if (lowest.type === 'hungry') {
      return {
        stateType: 'hungry',
        primaryAction: 'feed',
        urgency: 'warning',
        badgeText: 'Проголодался: покорми',
        badgeEmoji: '🍓',
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        buttonHighlight: 'ring-1.5 ring-rose-400/80 bg-rose-500/15',
        speech: pet.species === 'cat'
          ? 'В животике пустовато... дай лакомство! 🐟'
          : 'Хрум-хрум бы чего-нибудь вкусного! 🥩',
        isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
      };
    }
    return {
      stateType: 'sad',
      primaryAction: 'play',
      urgency: 'warning',
      badgeText: 'Скучает без внимания',
      badgeEmoji: '🎾',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      buttonHighlight: 'ring-1.5 ring-amber-400/80 bg-amber-500/15',
      speech: pet.species === 'cat'
        ? 'Скучно сидеть... покатай шарик! 🎾'
        : 'Брось мячик, разомнем лапки! 🎾🐾',
      isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
    };
  }

  // Sparkling clean & well-cared
  if (isSparkling && isLoved) {
    return {
      stateType: 'sparkling',
      primaryAction: null,
      urgency: 'thriving',
      badgeText: 'Сияет от счастья и чистоты',
      badgeEmoji: '✨',
      badgeClass: 'bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/30',
      buttonHighlight: '',
      speech: pet.species === 'cat'
        ? 'Шубка блестит, животик полон, мурчу от любви! ✨💖'
        : 'Самый счастливый и чистый хвостик на свете! ✨🐾',
      isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
    };
  }

  return {
    stateType: 'happy',
    primaryAction: null,
    urgency: 'normal',
    badgeText: 'Бодр и счастлив',
    badgeEmoji: '💖',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    buttonHighlight: '',
    speech: pet.species === 'cat'
      ? 'Муррр~ все отлично! Люблю вас! 🐱💖'
      : 'Тяв-гав! Отличное настроение! 🐕💖',
    isDirty, isVeryDirty, isSleepy, isDeeplySleepy, isHungry, isStarving, isSad, isSparkling, isLoved,
  };
}
