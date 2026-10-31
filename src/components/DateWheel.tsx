import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RotateCw, Heart, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export type DateVibe = 'all' | 'romantic' | 'dinner' | 'home' | 'city' | 'relax' | 'fun';

export interface DateIdea {
  id: string;
  title: string;
  emoji: string;
  category: string;
  color: string;
  description: string;
  inviteText: string;
  vibe: 'romantic' | 'dinner' | 'home' | 'city' | 'relax' | 'fun';
  duration: string;
  psychTip: string;
}

export const DATE_IDEAS: DateIdea[] = [
  {
    id: 'dinner',
    title: 'Романтический ужин',
    emoji: '🍷',
    category: 'Ресторан',
    color: '#F43F5E',
    description: 'Уютный столик при свечах в любимом заведении или новом атмосферном месте.',
    inviteText: 'Приглашаю тебя на романтический ужин при свечах в красивом ресторане',
    vibe: 'dinner',
    duration: '2-3 часа',
    psychTip: 'Смена обстановки и неспешная трапеза повышают уровень окситоцина и возвращают романтический интерес.',
  },
  {
    id: 'sunset',
    title: 'Крыша на закате',
    emoji: '🌅',
    category: 'Панорама',
    color: '#F59E0B',
    description: 'Встретить золотой час с видом на город, взяв с собой горячий чай и тёплый плед.',
    inviteText: 'Хочу встретить с тобой закат на панорамной крыше с чаем и пледом',
    vibe: 'city',
    duration: '1.5-2 часа',
    psychTip: 'Любование закатом вместе синхронизирует биоритмы и мгновенно переключает с рабочей суеты на нежность.',
  },
  {
    id: 'cinema',
    title: 'Кино под пледом',
    emoji: '🎬',
    category: 'Кино',
    color: '#8B5CF6',
    description: 'Любимый фильм, попкорн или камерный зал на последних рядах только для вас.',
    inviteText: 'Давай выберем классный фильм и проведём вечер в кино под тёплым пледом',
    vibe: 'home',
    duration: '2 часа',
    psychTip: 'Тактильная близость во время совместного просмотра и обсуждение сюжета сближают без давления.',
  },
  {
    id: 'walk',
    title: 'Прогулка с кофе',
    emoji: '☕',
    category: 'Кофейня',
    color: '#10B981',
    description: 'Неспешный разговор по тихим улочкам с любимым ароматным напитком в руках.',
    inviteText: 'Пойдём гулять по вечернему городу с горячим кофе и неспешными разговорами',
    vibe: 'city',
    duration: '1-1.5 часа',
    psychTip: 'Прогулка плечом к плечу облегчает искренние разговоры: взгляд направлен вперёд, снимая напряжение.',
  },
  {
    id: 'cooking',
    title: 'Кулинарный батл',
    emoji: '🍕',
    category: 'Дома',
    color: '#EC4899',
    description: 'Приготовить вместе домашнюю пасту, пиццу с необычными топингами или десерт.',
    inviteText: 'Предлагаю устроить уютный вечер дома: приготовим вместе что-нибудь вкусное!',
    vibe: 'home',
    duration: '1.5-2 часа',
    psychTip: 'Слаженная игра на кухне и разделение задач формируют ощущение сплоченной и надежной команды.',
  },
  {
    id: 'spa',
    title: 'СПА & Релакс',
    emoji: '🫧',
    category: 'Релакс',
    color: '#06B6D4',
    description: 'Бассейн, аромасауна, массаж и полная чувственная перезагрузка вдвоём.',
    inviteText: 'Предлагаю устроить расслабляющий день в СПА только для нас двоих',
    vibe: 'relax',
    duration: '2-4 часа',
    psychTip: 'Телесное расслабление снижает кортизол и помогает заново почувствовать притяжение друг к другу.',
  },
  {
    id: 'art',
    title: 'Мастер-класс',
    emoji: '🎨',
    category: 'Впечатления',
    color: '#6366F1',
    description: 'Гончарный круг, рисование вином, кулинарный воркшоп или роспись керамики.',
    inviteText: 'Давай сходим на необычный творческий мастер-класс и создадим что-то вместе!',
    vibe: 'fun',
    duration: '2-3 часа',
    psychTip: 'Новые общие навыки вызывают яркий выброс дофамина, обновляя эмоциональные якоря отношений.',
  },
  {
    id: 'surprise',
    title: 'Свидание-сюрприз',
    emoji: '✨',
    category: 'Секрет',
    color: '#E11D48',
    description: 'Один партнёр держит маршрут в тайне, а второй наслаждается интригой до самого финала.',
    inviteText: 'Я подготовил(а) для тебя свидание-сюрприз. Локация останется тайной до самого начала!',
    vibe: 'romantic',
    duration: 'Весь вечер',
    psychTip: 'Сладкое предвкушение и взаимное доверие разжигают романтическую искру и детский азарт.',
  },
  {
    id: 'spa_home',
    title: 'Ванна при свечах',
    emoji: '🛁',
    category: 'Релакс',
    color: '#14B8A6',
    description: 'Теплая пенная ванна, расслабляющий плейлист, свечи и массаж после тяжелой недели.',
    inviteText: 'Давай устроим расслабляющий вечер дома: ванна при свечах, музыка и массаж только для нас.',
    vibe: 'relax',
    duration: '1.5 часа',
    psychTip: 'Бескорыстная забота о комфорте партнера закладывает глубочайшее ощущение эмоционального дома.',
  },
  {
    id: 'night_drive',
    title: 'Огни ночного города',
    emoji: '🚗',
    category: 'Город',
    color: '#3B82F6',
    description: 'Любимый плейлист, пустые ночные мосты и откровенный разговор без посторонних.',
    inviteText: 'Поедем кататься по ночному городу под наш любимый трек-лист и огни фонарей?',
    vibe: 'city',
    duration: '1.5-2 часа',
    psychTip: 'Уютное замкнутое пространство и движение в темноте располагают к самым сокровенным признаниям.',
  },
  {
    id: 'picnic',
    title: 'Пикник на траве',
    emoji: '🧺',
    category: 'Природа',
    color: '#10B981',
    description: 'Плед, свежие ягоды, любимый сыр и теплый ветерок в уютном парке или у озера.',
    inviteText: 'Приглашаю тебя на уютный пикник: возьмём плед, фрукты и просто отдохнём на природе вдвоём.',
    vibe: 'romantic',
    duration: '2-3 часа',
    psychTip: 'Контакт с природой освобождает от ментального шума и дарит чувство безмятежной легкости.',
  },
  {
    id: 'tasting',
    title: 'Дегустация вкусов',
    emoji: '🧀',
    category: 'Ресторан',
    color: '#F59E0B',
    description: 'Сырная, винная или шоколадная дегустация, новые гастрономические открытия.',
    inviteText: 'Предлагаю устроить вечер дегустации: откроем новые вкусы и отлично проведём вечер!',
    vibe: 'dinner',
    duration: '2 часа',
    psychTip: 'Внимание к тонким оттенкам вкуса активизирует сенсорное восприятие и настраивает на чувственность.',
  },
];

export const WHEEL_IDEAS = DATE_IDEAS.slice(0, 8);

interface DateWheelProps {
  onSelectIdea: (idea: DateIdea) => void;
  compact?: boolean;
}

export const DateWheel: React.FC<DateWheelProps> = ({ onSelectIdea, compact = false }) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedIdea, setSelectedIdea] = useState<DateIdea | null>(null);
  const currentRotationRef = useRef<number>(0);

  const numSlices = WHEEL_IDEAS.length;
  const sliceAngle = 360 / numSlices;

  const handleSpin = () => {
    if (isSpinning) return;

    triggerHaptic('selection');
    setIsSpinning(true);
    setSelectedIdea(null);

    // Pick random target index
    const randomIndex = Math.floor(Math.random() * numSlices);
    const targetIdea = WHEEL_IDEAS[randomIndex];

    // Pointer is at the top (270 degrees in standard circle coords or angle 0 at top).
    // Let's set top pointer at angle 0.
    // Each slice i occupies [i * sliceAngle, (i+1) * sliceAngle].
    // Center of slice i is (i + 0.5) * sliceAngle.
    // To align slice center with top pointer (0 deg / 360 deg):
    // Rotation mod 360 should make: 360 - ((i + 0.5) * sliceAngle)
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const targetSliceCenter = (randomIndex + 0.5) * sliceAngle;
    const targetAngle = 360 - targetSliceCenter;

    // Maintain continuous forward rotation
    const currentBase = Math.ceil(currentRotationRef.current / 360) * 360;
    const newRotation = currentBase + extraSpins + targetAngle;
    currentRotationRef.current = newRotation;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedIdea(targetIdea);
      triggerHaptic('success');
    }, 3200);
  };

  // Helper to construct SVG arc path
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text)] leading-tight">
              Колесо идей для свиданий
            </h3>
            <p className="text-xs text-[var(--text-2)]">
              Не знаете куда сходить? Доверьтесь случаю
            </p>
          </div>
        </div>
      </div>

      {/* Wheel Container */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          {/* Pointer Marker at the top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 pointer-events-none drop-shadow-md">
            <div className="w-5 h-6 bg-rose-500 clip-triangle flex items-center justify-center">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-rose-500" />
            </div>
          </div>

          {/* Rotating SVG Wheel */}
          <div
            className="w-full h-full rounded-full shadow-lg border-4 border-[var(--surface)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 3.2s cubic-bezier(0.15, 0.88, 0.22, 1.0)'
                : 'none',
            }}
          >
            <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90 rounded-full">
              {WHEEL_IDEAS.map((slice, i) => {
                const startAngle = i / numSlices;
                const endAngle = (i + 1) / numSlices;
                const [startX, startY] = getCoordinatesForPercent(startAngle);
                const [endX, endY] = getCoordinatesForPercent(endAngle);
                const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                const pathData = [
                  `M 0 0`,
                  `L ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `Z`,
                ].join(' ');

                // Alternating pleasant opacity / tone
                const isEven = i % 2 === 0;

                return (
                  <path
                    key={slice.id}
                    d={pathData}
                    fill={slice.color}
                    fillOpacity={isEven ? 0.9 : 0.78}
                    stroke="var(--surface)"
                    strokeWidth="0.015"
                  />
                );
              })}
            </svg>

            {/* Labels and Emojis Layer inside wheel */}
            <div className="absolute inset-0 pointer-events-none">
              {WHEEL_IDEAS.map((slice, i) => {
                const angle = i * sliceAngle + sliceAngle / 2;
                return (
                  <div
                    key={slice.id}
                    className="absolute w-full h-full top-0 left-0 flex items-start justify-center pt-3 sm:pt-4"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 50%',
                    }}
                  >
                    <div
                      className="flex flex-col items-center select-none"
                      style={{
                        transform: 'rotate(90deg)',
                      }}
                    >
                      <span className="text-base sm:text-lg leading-none filter drop-shadow-xs">
                        {slice.emoji}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Spin Button */}
          <div className="absolute inset-0 m-auto w-16 h-16 sm:w-18 sm:h-18 rounded-full z-10 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full h-full rounded-full bg-[var(--surface)] text-[var(--text)] border-2 border-[var(--divider)] shadow-md flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform ${
                isSpinning ? 'opacity-75 cursor-not-allowed' : 'hover:border-[var(--accent)]'
              }`}
            >
              <RotateCw className={`w-4 h-4 text-[var(--accent)] ${isSpinning ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold tracking-tight">
                {isSpinning ? '...' : 'Крутить'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Idea Result Banner */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--accent)]/30 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 rounded-xl bg-[var(--surface)] border border-[var(--divider)]">
                  {selectedIdea.emoji}
                </span>
                <div>
                  <span className="text-[10px] font-bold text-[var(--accent)]">
                    Выбор колеса · {selectedIdea.category}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text)]">
                    {selectedIdea.title}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              {selectedIdea.description}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSelectIdea(selectedIdea)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Пригласить с этой идеей</span>
              </button>
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="py-2.5 px-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)] text-xs font-semibold border border-[var(--divider)] transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Ещё раз</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
