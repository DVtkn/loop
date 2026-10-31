import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { TestCategory } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';

export interface TestCardStatus {
  state: string;
  label: string;
  sublabel: string;
  isComplete: boolean;
  actionText: string;
}

export function resolveTestStatus(
  test: Partial<TestCategory>,
  partnerName: string = 'Партнёр'
): TestCardStatus {
  const isMyDone =
    test.isCompletedByMe !== undefined
      ? !!test.isCompletedByMe
      : !!test.partner1Done;
  const isPartnerDone =
    test.isCompletedByPartner !== undefined
      ? !!test.isCompletedByPartner
      : !!test.partner2Done;

  if (isMyDone && isPartnerDone) {
    return {
      state: 'BOTH_DONE',
      label: 'Оба завершили',
      sublabel: 'Смотреть инсайты',
      isComplete: true,
      actionText: 'Результаты →',
    };
  }
  if (isMyDone && !isPartnerDone) {
    return {
      state: 'WAITING_PARTNER',
      label: 'Вы прошли',
      sublabel: `Ждём ${partnerName}`,
      isComplete: false,
      actionText: 'Ответы →',
    };
  }
  if (!isMyDone && isPartnerDone) {
    return {
      state: 'PARTNER_READY',
      label: `${partnerName} прошёл(ла)`,
      sublabel: 'Пройдите для сравнения',
      isComplete: false,
      actionText: 'Пройти исследование',
    };
  }
  return {
    state: 'NOT_STARTED',
    label: 'Ещё не проходили',
    sublabel: `${test.estimatedMinutes || 5} минут`,
    isComplete: false,
    actionText: 'Пройти исследование',
  };
}

export interface TestCardProps {
  test: TestCategory;
  onClick?: () => void;
  status?: TestCardStatus;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onClick = () => {}, status }) => {
  const meta = getTestMeta(test);
  const activeStatus = status || resolveTestStatus(test);

  return (
    <div
      onClick={onClick}
      className="p-4 sm:p-5 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/50 transition-all cursor-pointer group space-y-3 shadow-[var(--card-shadow)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-[var(--accent)]">
              {meta.categoryIcon} {meta.categoryLabel}
            </span>
            <span className="text-[11px] text-[var(--text-3)]">•</span>
            <span className="text-[11px] text-[var(--text-2)] font-semibold">
              {meta.estimatedMinutes} мин
            </span>
          </div>

          <h4 className="text-base font-black text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-snug">
            {meta.emotionalTitle}
          </h4>

          <div className="text-xs text-[var(--text-2)] font-medium">{meta.tagline}</div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 text-right">
          {activeStatus.state === 'BOTH_DONE' ? (
            <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1 border border-emerald-500/25 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{activeStatus.label}</span>
            </div>
          ) : activeStatus.state === 'WAITING_PARTNER' ? (
            <div className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/25 shadow-2xs">
              {activeStatus.label}
            </div>
          ) : activeStatus.state === 'PARTNER_READY' ? (
            <div className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-black border border-rose-500/25 shadow-2xs animate-pulse">
              {activeStatus.label}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--text-3)] font-semibold bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--divider)]">
              {activeStatus.label}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--text-2)] leading-relaxed font-normal">
        {meta.discoveryText}
      </p>

      <div className="pt-2.5 border-t border-[var(--divider)] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[var(--text-3)] font-medium">{activeStatus.sublabel}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="font-black text-[var(--accent)] hover:opacity-85 flex items-center gap-1 cursor-pointer"
        >
          <span>{activeStatus.actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

