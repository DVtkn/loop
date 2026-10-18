import React from 'react';
import { motion } from 'motion/react';
import { Compass, MessageSquare, Mail } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';

interface QuickShortcutsProps {
  onOpenWheel: () => void;
  onOpenDeepTalk: () => void;
  onOpenCapsule: () => void;
}

export const QuickShortcuts: React.FC<QuickShortcutsProps> = ({
  onOpenWheel,
  onOpenDeepTalk,
  onOpenCapsule,
}) => {
  const shortcuts = [
    {
      id: 'date-idea',
      title: 'Идея свидания',
      subtitle: 'Колесо идей',
      icon: Compass,
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      color: 'text-rose-500 dark:text-rose-400',
      onClick: () => {
        triggerHaptic('light');
        onOpenWheel();
      },
    },
    {
      id: 'deep-talk',
      title: 'Deep Talk',
      subtitle: 'Вопрос для двоих',
      icon: MessageSquare,
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      color: 'text-indigo-500 dark:text-indigo-400',
      onClick: () => {
        triggerHaptic('light');
        onOpenDeepTalk();
      },
    },
    {
      id: 'time-capsule',
      title: 'Капсула времени',
      subtitle: 'Письмо в будущее',
      icon: Mail,
      bg: 'bg-teal-500/10 dark:bg-teal-500/20',
      color: 'text-teal-600 dark:text-teal-400',
      onClick: () => {
        triggerHaptic('light');
        onOpenCapsule();
      },
    },
  ];

  return (
    <section id="block-3-quick-shortcuts" className="grid grid-cols-3 gap-2 sm:gap-2.5">
      {shortcuts.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={item.onClick}
            className="p-3 sm:p-3.5 rounded-[24px] bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/40 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] flex flex-col items-center text-center gap-2 transition-all cursor-pointer group select-none"
          >
            <div
              className={`w-10 h-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}
            >
              <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="w-full min-w-0">
              <div className="text-xs font-bold text-[var(--text)] leading-tight line-clamp-2">{item.title}</div>
              <div className="text-[10px] text-[var(--text-3)] font-medium mt-0.5 hidden xs:block">{item.subtitle}</div>
            </div>
          </motion.button>
        );
      })}
    </section>
  );
};
