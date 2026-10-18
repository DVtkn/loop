import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Calendar, Clock } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface WeeklyPlanTask {
  id: string;
  day: string;
  title: string;
  duration: string;
  description: string;
  xp: number;
}

const DEFAULT_TASKS: WeeklyPlanTask[] = [
  {
    id: 'plan_mon',
    day: 'Пн',
    title: 'Утренний вопрос поддержки',
    duration: '2 мин',
    description: '«Какое главное событие ждёт тебя сегодня? Чем я могу поддержать тебя?»',
    xp: 10,
  },
  {
    id: 'plan_wed',
    day: 'Ср',
    title: 'Микро-сюрприз на языке любви',
    duration: '5 мин',
    description: 'Нежная записка в сумку, комплимент или любимый напиток без повода.',
    xp: 15,
  },
  {
    id: 'plan_fri',
    day: 'Пт',
    title: '«Бесшумное свидание» без телефонов',
    duration: '25 мин',
    description: 'Чай при свечах. Назовите 3 конкретных поступка партнёра за неделю с благодарностью.',
    xp: 25,
  },
  {
    id: 'plan_sun',
    day: 'Вс',
    title: 'Сверка пульса пары в Loop',
    duration: '3 мин',
    description: 'Отметьте чекин в приложении и обсудите, что подарило больше всего тепла.',
    xp: 20,
  },
];

interface WeeklyPlanChecklistProps {
  onTaskComplete?: (task: WeeklyPlanTask) => void;
}

export const WeeklyPlanChecklist: React.FC<WeeklyPlanChecklistProps> = ({
  onTaskComplete,
}) => {
  const STORAGE_KEY = 'loop_weekly_plan_completed';

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['plan_mon'];
    } catch {
      return ['plan_mon'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTaskIds));
    } catch {
      // ignore
    }
  }, [completedTaskIds]);

  const toggleTask = (task: WeeklyPlanTask) => {
    triggerHaptic('selection');
    const isDone = completedTaskIds.includes(task.id);
    if (isDone) {
      setCompletedTaskIds((prev) => prev.filter((id) => id !== task.id));
    } else {
      triggerHaptic('success');
      setCompletedTaskIds((prev) => [...prev, task.id]);
      if (onTaskComplete) {
        onTaskComplete(task);
      }
    }
  };

  const completedCount = completedTaskIds.length;
  const totalCount = DEFAULT_TASKS.length;

  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-[var(--surface)] border border-[var(--divider)] shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <h4 className="font-extrabold text-sm sm:text-base text-[var(--text)]">
              Интерактивный план работы на неделю
            </h4>
          </div>
          <p className="text-xs text-[var(--text-3)]">
            Отмечайте выполненные ритуалы для прокачки гармонии союза
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[11px] font-black border border-rose-500/20 shrink-0">
          {completedCount}/{totalCount} закрыто
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-rose-500 to-amber-500 transition-all duration-500 rounded-full"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5 pt-1">
        {DEFAULT_TASKS.map((t) => {
          const isDone = completedTaskIds.includes(t.id);
          return (
            <div
              key={t.id}
              onClick={() => toggleTask(t)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                isDone
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-[var(--surface-2)] border-[var(--divider)]/50 hover:border-rose-400/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-all ${
                  isDone
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'border-2 border-[var(--divider)] text-transparent hover:border-rose-400'
                }`}
              >
                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-rose-500">{t.day}:</span>
                    <span
                      className={`text-xs font-bold transition-all ${
                        isDone ? 'line-through text-[var(--text-3)]' : 'text-[var(--text)]'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-3)] font-medium">
                      ({t.duration})
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-amber-500 shrink-0">
                    +{t.xp} XP
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-2)] mt-0.5 leading-relaxed font-normal">
                  {t.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
