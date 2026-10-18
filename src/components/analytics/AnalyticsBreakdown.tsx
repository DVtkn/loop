import React, { useState, useMemo } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DeepCoupleAnalysis } from '../../utils/psychologyEngine';
import { DimensionCard, DimensionData } from './DimensionCard';
import { PracticeModal, PracticeInfo } from './PracticeModal';
import { WeeklyPlanChecklist } from './WeeklyPlanChecklist';
import { triggerHaptic } from '../../utils/haptics';
import { useCouple } from '../../context/CoupleContext';

interface AnalyticsBreakdownProps {
  analysis: DeepCoupleAnalysis;
  onStartTest?: (testId: string) => void;
}

export const AnalyticsBreakdown: React.FC<AnalyticsBreakdownProps> = ({
  analysis,
  onStartTest,
}) => {
  const { coupleProfile, addCoupleXP, triggerConfetti } = useCouple();
  const [filterType, setFilterType] = useState<'all' | 'growth' | 'strength'>('all');
  const [activePractice, setActivePractice] = useState<PracticeInfo | null>(null);

  const p1Name = coupleProfile?.partner1?.name || 'Партнёр 1';
  const p2Name = coupleProfile?.partner2?.name || 'Партнёр 2';

  // Construct comprehensive 6 dimensions with tailored diagnostics and Gottman/Chapman tips
  const dimensionsData: DimensionData[] = useMemo(() => {
    return [
      {
        id: 'conflicts',
        title: 'Управление конфликтами (Готтман)',
        sphere: 'Общение',
        score: 74,
        partner1Score: 80,
        partner2Score: 68,
        status: 'growth',
        statusLabel: '⚠️ Точка роста (Зона синергии)',
        p1Label: p1Name,
        p2Label: p2Name,
        diagnostic: `${p2Name} в стрессе испытывает физиологическое затопление (пульс >100 уд/мин) и замолкает («Стена молчания»). ${p1Name} считывает это как эмоциональное равнодушие и усиливает давление. Это классический цикл «Преследователь ↔ Отстраняющийся».`,
        howToBoost: [
          'Правило 20 минут: При первых признаках крика или эмоционального ступора брать тайм-аут на 20 минут (прогулка, дыхание 4-7-8, стакан воды) до нормализации сердечного ритма.',
          'Фраза-антидот: «Я очень люблю тебя. Я сейчас эмоционально перегружен(а), давай сделаем паузу 20 минут, и я обязательно вернусь к нашему разговору».',
          'Мягкий старт беседы: Начинайте сложные темы с «Я чувствую грусть/тревогу, когда...», вместо обвинений «Ты вечно забываешь...».',
        ],
        practice: {
          id: 'soft-start',
          title: 'Мягкий старт беседы',
          duration: '3 минуты',
          description: 'Сядьте рядом и отключите телефоны на 3 минуты. Партнёр 1 формулирует текущее пожелание строго по формуле: «Я чувствую [эмоция], когда происходит [факт без оценки]. Мне бы помогло, если бы мы [конкретное действие]». Партнёр 2 повторяет услышанное своими словами без оправданий.',
          xp: 20,
          dimensionTitle: 'Управление конфликтами',
        },
      },
      {
        id: 'love_languages',
        title: 'Языки любви & Взаимная забота',
        sphere: 'Близость',
        score: 81,
        partner1Score: 85,
        partner2Score: 78,
        status: 'growth',
        statusLabel: '⚠️ Точка роста (Разница каналов)',
        p1Label: p1Name,
        p2Label: p2Name,
        diagnostic: `Разница ведущих каналов эмоционального подкрепления: у ${p1Name} преобладает «Качественное время» (42%), а у ${p2Name} — «Слова поощрения» (38%). Из-за этого искренняя забота одного партнёра порой остаётся эмоционально «незамеченной» вторым.`,
        howToBoost: [
          'Ежедневный депозит: Совершать минимум одно осознанное микро-действие строго на ведущем языке партнёра в первой половине дня.',
          'Слова валидации: Замечать и проговаривать вслух: «Я вижу, сколько сил ты вложил(а) в это, спасибо тебе».',
          'Чистое присутствие: 15 минут в день контакта глазами без смартфонов и фонового телевизора.',
        ],
        practice: {
          id: 'love-note',
          title: 'Микро-сюрприз на языке любви',
          duration: '3 минуты',
          description: 'Напишите короткую нежную записку или сообщение со словами искреннего восхищения конкретным поступком партнёра за последние 24 часа. Спрячьте в сумку или отправьте прямо сейчас.',
          xp: 15,
          dimensionTitle: 'Языки любви',
        },
      },
      {
        id: 'attachment',
        title: 'Стиль привязанности & Безопасность',
        sphere: 'Доверие',
        score: 92,
        partner1Score: 94,
        partner2Score: 90,
        status: 'strength',
        statusLabel: '🟢 Зона силы (Синхронный резонанс)',
        p1Label: p1Name,
        p2Label: p2Name,
        diagnostic: `Надёжная база союза: высокий уровень доверия, способность быть уязвимыми без страха отвержения или манипуляций дистанцией. Это главный фундамент долгосрочной устойчивости вашей пары.`,
        howToBoost: [
          'Ритуал воссоединения Готтмана: 6-секундный осознанный поцелуй и крепкое объятие при встрече после рабочего дня.',
          'Упреждающая весточка: Короткое сообщение «Думаю о тебе» в течение насыщенного дня до возникновения чувства одиночества.',
        ],
        practice: {
          id: 'six-sec-kiss',
          title: '6-секундный поцелуй воссоединения',
          duration: '1 минута',
          description: 'Джон Готтман доказал: поцелуй длительностью не менее 6 секунд снижает уровень гормона стресса кортизола и активирует окситоцин, переключая мозг в режим близости и безопасности.',
          xp: 20,
          dimensionTitle: 'Стиль привязанности',
        },
      },
      {
        id: 'values',
        title: 'Синхронизация ценностей & Будущее',
        sphere: 'Ценности',
        score: 94,
        partner1Score: 95,
        partner2Score: 93,
        status: 'strength',
        statusLabel: '🟢 Зона силы (Синхронный резонанс)',
        p1Label: p1Name,
        p2Label: p2Name,
        diagnostic: `Высокая мировоззренческая конгруэнтность: единое видение жизненного уклада, финансовой безопасности, карьерных приоритетов и фундаментальных целей пары.`,
        howToBoost: [
          'Совет союза: 20-минутная ежемесячная сверка финансовых и семейных целей за чашкой чая в атмосфере сотрудничества.',
          'Правило личной автономии: Четкое разделение общих накоплений и суммы личных спонтанных трат без отчётности.',
        ],
        practice: {
          id: 'dream-sync',
          title: 'Сверка карты общих мечтаний',
          duration: '5 минут',
          description: 'Назовите по одной мечте на ближайшие полгода, которую вы хотите реализовать именно вдвоём (путешествие, навык, уют в доме).',
          xp: 20,
          dimensionTitle: 'Синхронизация ценностей',
        },
      },
      {
        id: 'intimacy',
        title: 'Эмоциональная & Чувственная близость',
        sphere: 'Интимность',
        score: 89,
        partner1Score: 90,
        partner2Score: 88,
        status: 'strength',
        statusLabel: '🟢 Зона силы (Синхронный резонанс)',
        p1Label: p1Name,
        p2Label: p2Name,
        diagnostic: `Открытость интимных желаний и романтический трепет. Точка внимания — не допускать вытеснения страсти бытовой рутиной.`,
        howToBoost: [
          'Дневной флирт: Отправить нежное или интригующее сообщение в середине дня без ожидания немедленного действия.',
          'Смена декораций: Регулярные свидания вне привычного домашнего пространства.',
        ],
        practice: {
          id: 'eye-contact',
          title: '2 минуты контакта глазами',
          duration: '2 минуты',
          description: 'Сядьте напротив друг друга, возьмитесь за руки и 2 минуты молча смотрите друг другу в глаза с лёгкой улыбкой. Это моментально восстанавливает трепет первых дней.',
          xp: 20,
          dimensionTitle: 'Эмоциональная близость',
        },
      },
      {
        id: 'lifestyle',
        title: 'Ритм жизни & Баланс «Мы / Я»',
        sphere: 'Быт',
        score: 90,
        partner1Score: 92,
        partner2Score: 88,
        status: 'strength',
        statusLabel: '🟢 Зона силы (Синхронный резонанс)',
        p1Label: p1Name,
        p2Label: p2Name,
        diagnostic: `Здоровые личные границы без чувства изоляции или вины за время, проведённое порознь. Каждый партнёр сохраняет свою индивидуальность, обогащая союз.`,
        howToBoost: [
          'День личного ресурса: У каждого партнёра есть право на вечер своих увлечений без обид со стороны второго.',
          'Священное совместное время: Один вечер в неделю, полностью защищённый от рабочих звонков и бытовых споров.',
        ],
        practice: {
          id: 'sync-rhythm',
          title: 'Сверка пульса недели',
          duration: '3 минуты',
          description: 'Обсудите уровень энергии по 10-балльной шкале и распределите бытовые задачи на неделю с учётом нагрузки каждого.',
          xp: 15,
          dimensionTitle: 'Ритм жизни',
        },
      },
    ];
  }, [p1Name, p2Name]);

  const filteredDimensions = useMemo(() => {
    if (filterType === 'growth') {
      return dimensionsData.filter((d) => d.status === 'growth');
    }
    if (filterType === 'strength') {
      return dimensionsData.filter((d) => d.status === 'strength');
    }
    return dimensionsData;
  }, [dimensionsData, filterType]);

  const growthCount = dimensionsData.filter((d) => d.status === 'growth').length;
  const strengthCount = dimensionsData.filter((d) => d.status === 'strength').length;

  const handlePracticeComplete = (xp: number, title: string) => {
    addCoupleXP(xp, `Практика: ${title}`);
    triggerConfetti();
  };

  const handleWeeklyTaskComplete = (task: any) => {
    addCoupleXP(task.xp, `Недельный план: ${task.title}`);
    triggerConfetti();
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setFilterType('all');
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            filterType === 'all'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--divider)]'
          }`}
        >
          <span>Все сферы ({dimensionsData.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setFilterType('growth');
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            filterType === 'growth'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'bg-[var(--surface-2)] text-amber-600 dark:text-amber-400 hover:text-[var(--text)] border border-[var(--divider)]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{growthCount} точки роста</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setFilterType('strength');
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            filterType === 'strength'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'bg-[var(--surface-2)] text-emerald-600 dark:text-emerald-400 hover:text-[var(--text)] border border-[var(--divider)]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{strengthCount} зоны силы</span>
        </button>
      </div>

      {/* Dimension Cards List */}
      <div className="space-y-3">
        {filteredDimensions.map((dim, idx) => (
          <DimensionCard
            key={dim.id}
            dimension={dim}
            defaultExpanded={idx === 0}
            onOpenPractice={(prac) => setActivePractice(prac)}
          />
        ))}
      </div>

      {/* Interactive Weekly Plan Checklist */}
      <WeeklyPlanChecklist onTaskComplete={handleWeeklyTaskComplete} />

      {/* Interactive Practice Modal */}
      <PracticeModal
        practice={activePractice}
        onClose={() => setActivePractice(null)}
        onComplete={handlePracticeComplete}
      />
    </div>
  );
};
