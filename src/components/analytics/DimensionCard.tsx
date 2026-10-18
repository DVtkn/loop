import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { PracticeInfo } from './PracticeModal';

export interface DimensionData {
  id: string;
  title: string;
  sphere: string;
  score: number;
  partner1Score: number;
  partner2Score: number;
  status: 'growth' | 'strength';
  statusLabel: string;
  p1Label: string;
  p2Label: string;
  diagnostic: string;
  howToBoost: string[];
  practice: PracticeInfo;
}

interface DimensionCardProps {
  dimension: DimensionData;
  onOpenPractice: (practice: PracticeInfo) => void;
  defaultExpanded?: boolean;
}

export const DimensionCard: React.FC<DimensionCardProps> = ({
  dimension,
  onOpenPractice,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    triggerHaptic('selection');
    setIsExpanded(!isExpanded);
  };

  const isGrowth = dimension.status === 'growth';

  return (
    <div
      className={`rounded-[26px] border transition-all overflow-hidden bg-[var(--surface)] ${
        isGrowth
          ? 'border-amber-500/30 shadow-2xs hover:border-amber-500/50'
          : 'border-[var(--divider)] shadow-2xs hover:border-rose-400/40'
      }`}
    >
      {/* Top Header Card (Always visible, click to toggle) */}
      <div
        onClick={toggleExpand}
        className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-3 select-none"
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-extrabold text-sm sm:text-base text-[var(--text)]">
              {dimension.title}
            </h4>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                isGrowth
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
              }`}
            >
              {isGrowth ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              <span>{dimension.statusLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-3)] font-medium">
            <span>
              {dimension.p1Label}: <strong className="text-[var(--text)] font-bold">{dimension.partner1Score}%</strong>
            </span>
            <span>•</span>
            <span>
              {dimension.p2Label}: <strong className="text-[var(--text)] font-bold">{dimension.partner2Score}%</strong>
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGrowth ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${dimension.score}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-black text-lg sm:text-xl tracking-tight ${
              isGrowth ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {dimension.score}%
          </span>
          <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-3)]">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-[var(--divider)]/40 pt-4 animate-fadeIn">
          {/* 1. Psychological Diagnostic Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>🔍</span>
              <span>Диагностика пары по тесту:</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed font-normal">
              {dimension.diagnostic}
            </p>
          </div>

          {/* 2. How to Boost to 90%+ Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Как повысить показатель до 90%+:</span>
            </div>
            <ul className="text-xs sm:text-sm text-[var(--text)] space-y-2 leading-relaxed">
              {dimension.howToBoost.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Actionable Micro-Practice Button */}
          <div>
            <button
              type="button"
              onClick={() => onOpenPractice(dimension.practice)}
              className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Запустить 3-мин практику: «{dimension.practice.title}» (+{dimension.practice.xp} XP)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
