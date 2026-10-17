import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { MetricDetail } from './radarUtils.ts';

interface ArchetypeSynergySectionProps {
  coupleArchetype: { title: string; subtitle: string } | null;
  synergyPoints: MetricDetail[];
  growthZones: MetricDetail[];
}

export const ArchetypeSynergySection: React.FC<ArchetypeSynergySectionProps> = ({
  coupleArchetype,
  synergyPoints,
  growthZones,
}) => {
  if (!coupleArchetype) return null;

  return (
    <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xs space-y-4">
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-[var(--accent)]">
          Психологический архетип союза
        </span>
        <h4 className="text-base font-bold text-[var(--text)]">{coupleArchetype.title}</h4>
        <p className="text-xs text-[var(--text-2)] leading-relaxed">
          {coupleArchetype.subtitle}
        </p>
      </div>

      {synergyPoints.length > 0 && (
        <div className="pt-2 border-t border-[var(--divider)] space-y-2">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Точки взаимной синергии (Резонанс ≥ 75%)</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {synergyPoints.map((s) => (
              <div
                key={s.key}
                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between"
              >
                <span className="font-semibold text-[var(--text)]">{s.name}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {s.avgScore}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {growthZones.length > 0 && (
        <div className="pt-2 border-t border-[var(--divider)] space-y-2">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Зоны совместного развития и внимания</span>
          </span>
          <div className="space-y-2">
            {growthZones.map((g) => (
              <div
                key={g.key}
                className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text)]">{g.name}</span>
                  <span className="font-bold text-[var(--accent)]">{g.avgScore}%</span>
                </div>
                <p className="text-[11px] text-[var(--text-2)] leading-relaxed">{g.gottmanTip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
