import React from 'react';
import { Heart, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { TestCategory } from '../../types.ts';
import { getTestMeta } from './testMeta.ts';

interface TestFeaturedCardProps {
  featuredTest: TestCategory;
  onStartTest: (test: TestCategory) => void;
}

export const TestFeaturedCard: React.FC<TestFeaturedCardProps> = ({
  featuredTest,
  onStartTest,
}) => {
  const meta = getTestMeta(featuredTest);

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/35 to-amber-500/10 border border-[var(--card-border)] relative overflow-hidden space-y-4 shadow-[var(--card-shadow)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--accent)]/18 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[11px] shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>Рекомендуемое исследование</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight leading-snug">
            {meta.emotionalTitle}
          </h2>
          <div className="text-xs text-[var(--accent)] font-bold">{meta.tagline}</div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-2xs">
          <Heart className="w-6 h-6 fill-rose-500" />
        </div>
      </div>

      <p className="relative z-10 text-xs sm:text-sm text-[var(--text-2)] font-normal leading-relaxed">
        {meta.discoveryText}
      </p>

      <div className="relative z-10 pt-3 flex items-center justify-between gap-3 border-t border-[var(--divider)] flex-wrap">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-2)]">
          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>{meta.estimatedMinutes} минут для двоих</span>
        </div>

        <button
          type="button"
          onClick={() => onStartTest(featuredTest)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-pink-500 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:opacity-95 active:scale-95"
        >
          <span>Пройти вместе (+80 XP)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
