import React, { useState, useMemo } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';
import { MetricDetail, PSYCH_24_SCALES_CONFIG, VectorScaleInfo, getStatusLabel } from './radarUtils.ts';

interface RadarScalesDrawerProps {
  scoreMap: MetricDetail[];
  targetPartnerScoreKey: 'p1Score' | 'p2Score';
}

interface GroupedVector {
  vectorKey: string;
  vectorName: string;
  scales: VectorScaleInfo[];
}

export const RadarScalesDrawer: React.FC<RadarScalesDrawerProps> = ({
  scoreMap,
  targetPartnerScoreKey,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const scalesByVector = useMemo<GroupedVector[]>(() => {
    const map = new Map<string, GroupedVector>();
    PSYCH_24_SCALES_CONFIG.forEach((scale) => {
      if (!map.has(scale.vectorKey)) {
        map.set(scale.vectorKey, {
          vectorKey: scale.vectorKey,
          vectorName: scale.vectorName,
          scales: [],
        });
      }
      map.get(scale.vectorKey)!.scales.push(scale);
    });
    return Array.from(map.values());
  }, []);

  return (
    <div className="space-y-3 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setIsOpen(!isOpen);
        }}
        className="w-full py-2.5 px-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] border border-[var(--divider)] text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <span>24 первичные шкалы личности (6 векторов)</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-3)] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--accent)]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="space-y-4 animate-fadeIn">
          {scalesByVector.map((vec, idx) => {
            const vectorMetric = scoreMap.find((m) => m.key === vec.vectorKey);
            const score = vectorMetric ? vectorMetric[targetPartnerScoreKey] : 0;

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--accent)]">{vec.vectorName}</h4>
                  {score > 0 && (
                    <span className="text-[11px] font-bold text-[var(--text-2)]">{score}%</span>
                  )}
                </div>
                <div className="space-y-2.5">
                  {vec.scales.map((scale) => (
                    <div
                      key={scale.id}
                      className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text)]">{scale.name}</span>
                        <span className="text-[10px] font-bold text-[var(--accent)]">
                          {score > 0 ? `${score}% • ${getStatusLabel(score)}` : 'Не пройден'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-3)] leading-relaxed">{scale.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
