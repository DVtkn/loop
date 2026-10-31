import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

// =======================================================================
// SEMANTIC COLOR SYSTEM
// =======================================================================
// 1. Тепло / забота (Обнять, Думаю о тебе, поцелуй, любовь) -> #FF453A -> #FF6482
// 2. Настроение / эмоции (Пульс, чувства, радость, энергия) -> #FFB648 -> #FF8A3D
// 3. Время / ожидание (Скучаю, календарь, фото, воспоминания) -> #4A9EFF -> #2E6FD9
// 4. Поддержка / забота о состоянии (квесты, помощь, чай, хотелки) -> #34D399 -> #059669
// 5. Достижения / gamification (XP, награды, стрик, уровень, тесты) -> #7A6BFF -> #4A3AC4
// 6. Разговоры / диалог (психолог, сова, беседы, мысль, вопросы) -> #A78BFA -> #7C5CE0
// =======================================================================

export type SemanticColorType =
  | 'warmth'
  | 'mood'
  | 'time'
  | 'care'
  | 'gamification'
  | 'dialogue'
  | 'danger'
  | string;

export interface SemanticToken {
  from: string;
  to: string;
  gradient: string;
  glow: string;
  text: string;
}

export function getSemanticToken(typeOrColor?: SemanticColorType): SemanticToken {
  const c = (typeOrColor || 'warmth').toLowerCase().trim();

  // 1. Тепло / забота / любовь / Primary (Кораллово-красный #FF3B4E)
  if (
    c === 'warmth' ||
    c === 'rose' ||
    c === 'red' ||
    c === 'pink' ||
    c === 'love' ||
    c === 'hug' ||
    c === '#ff3b4e' ||
    c === '#ff453a' ||
    c === '#ff3b30' ||
    c === '#f43f5e' ||
    c === '#e11d48' ||
    c === 'var(--accent)'
  ) {
    return {
      from: '#FF3B4E',
      to: '#FF5A6E',
      gradient: 'linear-gradient(135deg, #FF3B4E 0%, #FF5A6E 100%)',
      glow: 'rgba(255, 59, 78, 0.35)',
      text: '#FF3B4E',
    };
  }

  // 2. Настроение / эмоции / вдохновение (Тёплый янтарь / шампань)
  if (
    c === 'mood' ||
    c === 'amber' ||
    c === 'orange' ||
    c === 'gold' ||
    c === 'yellow' ||
    c === 'energy' ||
    c === 'pulse' ||
    c === '#ffb648' ||
    c === '#ff8a3d' ||
    c === '#f59e0b' ||
    c === '#f97316'
  ) {
    return {
      from: '#FF8A50',
      to: '#FFA364',
      gradient: 'linear-gradient(135deg, #FF8A50 0%, #FFA364 100%)',
      glow: 'rgba(255, 138, 80, 0.35)',
      text: '#FF8A50',
    };
  }

  // 3. Время / фото / воспоминания (Мягкий глубокий коралл-роуз)
  if (
    c === 'time' ||
    c === 'miss' ||
    c === 'photo' ||
    c === 'calendar' ||
    c === 'blue' ||
    c === 'sky'
  ) {
    return {
      from: '#FF4D6D',
      to: '#C9184A',
      gradient: 'linear-gradient(135deg, #FF4D6D 0%, #C9184A 100%)',
      glow: 'rgba(255, 77, 109, 0.35)',
      text: '#FF4D6D',
    };
  }

  // 4. Забота / гармония / здоровье (Мягкая мята / шалфей)
  if (
    c === 'care' ||
    c === 'mint' ||
    c === 'emerald' ||
    c === 'green' ||
    c === 'teal' ||
    c === 'health' ||
    c === 'craving'
  ) {
    return {
      from: '#2FB86F',
      to: '#239358',
      gradient: 'linear-gradient(135deg, #2FB86F 0%, #239358 100%)',
      glow: 'rgba(47, 184, 111, 0.35)',
      text: '#2FB86F',
    };
  }

  // 5. Достижения / квесты / квиз (Глубокий коралл / рубин)
  if (
    c === 'gamification' ||
    c === 'indigo' ||
    c === 'violet' ||
    c === 'xp' ||
    c === 'award' ||
    c === 'level' ||
    c === 'test' ||
    c === 'tests' ||
    c === 'rank'
  ) {
    return {
      from: '#E02A3C',
      to: '#FF4558',
      gradient: 'linear-gradient(135deg, #E02A3C 0%, #FF4558 100%)',
      glow: 'rgba(224, 42, 60, 0.35)',
      text: '#E02A3C',
    };
  }

  // 6. Разговоры / Сова / вопросы (Тёплый розовый шёлк)
  if (
    c === 'dialogue' ||
    c === 'purple' ||
    c === 'lavender' ||
    c === 'owl' ||
    c === 'chat' ||
    c === 'talk' ||
    c === 'question'
  ) {
    return {
      from: '#FF5E7E',
      to: '#E63956',
      gradient: 'linear-gradient(135deg, #FF5E7E 0%, #E63956 100%)',
      glow: 'rgba(255, 94, 126, 0.35)',
      text: '#FF5E7E',
    };
  }

  // Опасные действия / выход
  if (c === 'danger' || c === 'logout' || c === '#ef4444' || c === '#dc2626') {
    return {
      from: '#EF4444',
      to: '#B91C1C',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
      glow: 'rgba(239, 68, 68, 0.35)',
      text: '#EF4444',
    };
  }

  // Fallback warmth (Coral Red)
  return {
    from: '#FF3B4E',
    to: '#FF5A6E',
    gradient: 'linear-gradient(135deg, #FF3B4E 0%, #FF5A6E 100%)',
    glow: 'rgba(255, 59, 78, 0.35)',
    text: '#FF3B4E',
  };
}

// Backward-compat alias for pastel token queries
export function getPastelToken(color?: string) {
  const token = getSemanticToken(color);
  return {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    text: token.text,
  };
}

// =======================================================================
// 1. STAT-TILE (Факты, числа, без клика, сдержанный премиальный вид)
// =======================================================================
interface StatTileProps {
  icon: React.ReactNode;
  value: string | number | React.ReactNode;
  label: string;
  color?: SemanticColorType;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  color = 'gamification',
}) => {
  const token = getSemanticToken(color);

  return (
    <div className="flex flex-col p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-solid)] to-[var(--surface-blush)]/35 border border-[var(--card-border)] shadow-2xs hover:shadow-xs relative overflow-hidden transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
          style={{ background: token.gradient, color: '#ffffff', boxShadow: `0 4px 12px -2px ${token.glow}` }}
        >
          {iconWithWhite(icon)}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-[var(--text)] leading-none tracking-tight">
        {value}
      </div>
      <div className="text-xs text-[var(--text-2)] font-bold mt-1.5 line-clamp-2">
        {label}
      </div>
    </div>
  );
};

// =======================================================================
// 2. CAROUSEL-TILE (Горизонтальный ряд инструментов пары)
// =======================================================================
export interface CarouselItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  color?: SemanticColorType;
}

interface CarouselTileProps {
  items: CarouselItem[];
  title?: string;
}

export const CarouselTile: React.FC<CarouselTileProps> = ({ items, title }) => {
  return (
    <div className="space-y-2.5 shrink-0 w-full overflow-hidden">
      {title && (
        <h3 className="text-xs font-semibold text-[var(--text-3)] px-0.5">
          {title}
        </h3>
      )}
      <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar px-0.5 snap-x snap-mandatory">
        {items.map((item) => {
          const token = getSemanticToken(item.color);
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={item.onClick}
              className="flex-none min-w-[105px] max-w-[120px] p-3 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] hover:border-[var(--accent)]/40 flex flex-col items-start gap-2 transition-all snap-start cursor-pointer group text-left"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ background: `${token.text}18`, color: token.text }}
              >
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-[var(--text)] leading-tight line-clamp-2">
                {item.title}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// =======================================================================
// 3. ACTION-ROW (Группа действий, аккуратная строка с шевроном)
// =======================================================================
interface ActionRowProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  onClick: () => void;
  color?: SemanticColorType;
  danger?: boolean;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  title,
  value,
  onClick,
  color = 'warmth',
  danger,
}) => {
  const token = getSemanticToken(danger ? 'danger' : color);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3.5 sm:p-4 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--divider)] mb-[-1px] first:rounded-t-2xl last:rounded-b-2xl transition-colors cursor-pointer ${
        danger ? 'text-rose-500' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${token.text}18`, color: token.text }}
        >
          {icon}
        </div>
        <span
          className={`text-sm font-semibold text-left line-clamp-2 ${
            danger ? 'text-rose-500 font-bold' : 'text-[var(--text)]'
          }`}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {value && (
          <span className="text-xs sm:text-sm text-[var(--text-2)] font-medium">
            {value}
          </span>
        )}
        <ChevronRight
          className={`w-4 h-4 ${danger ? 'text-rose-400' : 'text-[var(--text-3)]'}`}
        />
      </div>
    </motion.button>
  );
};

// =======================================================================
// 4. PRIMARY CTA (Сдержанный, элегантный призыв к действию)
// =======================================================================
interface PrimaryCTAProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  subtitle?: string;
  color?: SemanticColorType;
}

export const PrimaryCTA: React.FC<PrimaryCTAProps> = ({
  title,
  icon,
  onClick,
  subtitle,
  color = 'warmth',
}) => {
  const token = getSemanticToken(color);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] hover:border-[var(--accent)]/40 shadow-xs hover:shadow-sm transition-all cursor-pointer group text-left"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-blush)] text-[var(--accent)] transition-transform group-hover:scale-105"
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-bold text-[var(--text)] leading-snug">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-[var(--text-2)] font-normal mt-0.5 line-clamp-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-2)] group-hover:text-[var(--accent)] transition-colors shrink-0 ml-2">
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
};

// Helper to make sure inner icon adopts white color inside rich gradient container
function iconWithWhite(icon: React.ReactNode): React.ReactNode {
  if (React.isValidElement(icon)) {
    const el = icon as React.ReactElement<{ className?: string }>;
    return React.cloneElement(el, {
      className: `${el.props?.className || ''} text-white`.replace(/text-\w+-\d+/g, 'text-white'),
    });
  }
  return icon;
}
