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
  sleepy: 'Клюю носом... 💤',
  hungry: 'Кушать! 🍓',
  playful: 'Поиграем? 🎾',
  loved: 'Муррр~ +5❤️',
  dirty: 'Буль-буль! Чистота! 🧼',
};

export const FUNNY_PET_QUOTES: Record<PetSpecies, string[]> = {
  dog: [
    'Тяв! Где вкусняшка? Я видел колбаску! 🥩',
    'Ты лучший человек во вселенной! (после холодильника) 💖',
    'Почеши пузико! Срочно! 🐾',
    'Я не толстый, это кость пушистая! 🧁',
    'Тыгыдык в 3 часа ночи? Я всегда готов! ⚡',
    'Хвост виляет быстрее скорости света! 🐕✨',
    'Гав! Дай пять лапкой! 🐾',
    'Мячик — смысл всей моей собачьей жизни! 🎾',
    'Я здесь главный охранник ваших сердечек! 🛡️❤️',
  ],
  cat: [
    'Мур-мяу! Уровень милоты: 1000% 🌸',
    'Человек, ты опоздал с кормом на 0.5 секунды! 🐟',
    'Кусь! Это я так выражаю безумную любовь! ❤️',
    'Я здесь божество, а ты мой слуга с паштетом 👑',
    'Муррр~ лапками делаю массаж 🐾',
    'Тыгыдык-тыгыдык по всей квартире! ⚡',
    'Картонная коробка в 10 раз лучше лежанки! 📦',
    'Почеши за ушком и я включу мурчащий моторчик 🐱',
    'Смотрю в пустую стену с очень умным видом 👁️',
  ],
};
