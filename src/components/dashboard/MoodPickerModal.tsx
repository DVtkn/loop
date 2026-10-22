import React, { useState, useEffect } from 'react';
import { SmilePlus, X, Sparkles, BatteryCharging, Battery, BatteryLow, Zap } from 'lucide-react';
import { ColoredIcon, MOOD_PRESETS } from '../ColoredIcon.tsx';
import {
  CARE_MODE_PRESETS,
  getBatteryTier,
  findCarePresetByKey,
} from '../../utils/careBatteryEngine.ts';
import { CareModePresetKey } from '../../types.ts';

export interface MoodPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitMood: (
    key: string,
    label: string,
    note: string,
    energyLevel?: number,
    careMode?: string
  ) => void;
  initialMoodKey?: string;
  initialMoodLabel?: string;
  initialNote?: string;
  initialEnergyLevel?: number;
  initialCareMode?: string;
}

export const MoodPickerModal: React.FC<MoodPickerModalProps> = ({
  isOpen,
  onClose,
  onSubmitMood,
  initialMoodKey = 'calm',
  initialMoodLabel = 'Спокойствие',
  initialNote = '',
  initialEnergyLevel = 80,
  initialCareMode = 'adventure',
}) => {
  const [customMoodKey, setCustomMoodKey] = useState<string>(initialMoodKey);
  const [customMoodLabel, setCustomMoodLabel] = useState<string>(initialMoodLabel);
  const [moodNote, setMoodNote] = useState<string>(initialNote);
  const [energyLevel, setEnergyLevel] = useState<number>(initialEnergyLevel);
  const [selectedCareMode, setSelectedCareMode] = useState<string>(initialCareMode);

  useEffect(() => {
    if (isOpen) {
      setCustomMoodKey(initialMoodKey);
      setCustomMoodLabel(initialMoodLabel);
      setMoodNote(initialNote);
      setEnergyLevel(initialEnergyLevel);
      setSelectedCareMode(initialCareMode);
    }
  }, [isOpen, initialMoodKey, initialMoodLabel, initialNote, initialEnergyLevel, initialCareMode]);

  if (!isOpen) return null;

  const tier = getBatteryTier(energyLevel);

  const handlePresetSelect = (presetKey: CareModePresetKey, defaultEnergy: number, label: string) => {
    setSelectedCareMode(presetKey);
    setEnergyLevel(defaultEnergy);
    // If user hasn't heavily modified the custom label, suggest a matching mood preset
    if (presetKey === 'need_hugs') {
      setCustomMoodKey('tired');
      setCustomMoodLabel('Нужна забота');
    } else if (presetKey === 'low_battery') {
      setCustomMoodKey('calm');
      setCustomMoodLabel('Тихий отдых');
    } else if (presetKey === 'adventure') {
      setCustomMoodKey('fun');
      setCustomMoodLabel('К приключениям');
    } else if (presetKey === 'full_energy') {
      setCustomMoodKey('inspire');
      setCustomMoodLabel('Полон энергии');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customMoodLabel.trim()) return;
    onSubmitMood(
      customMoodKey,
      customMoodLabel.trim(),
      moodNote.trim(),
      energyLevel,
      selectedCareMode || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn" />

      <div className="relative z-10 w-full max-w-lg bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 border border-[var(--divider)] shadow-2xl space-y-0 max-h-[92vh] flex flex-col pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] animate-slideUp">
        <div className="w-10 h-1 rounded-full bg-[var(--divider)] mx-auto sm:hidden mb-3 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between shrink-0 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--surface-blush)] text-[var(--accent)] flex items-center justify-center">
              <SmilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text)] leading-tight">
                Батарейка заботы и настроение
              </h3>
              <p className="text-xs text-[var(--text-2)]">Партнёр увидит ваш заряд и сможет поддержать вас</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden space-y-3.5">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* 1. Partner Energy & Care Battery Section */}
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{tier.icon}</span>
                  <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Заряд энергии
                  </span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${tier.badgeClass}`}>
                  <span>{energyLevel}%</span>
                  <span className="opacity-70">•</span>
                  <span>{tier.label}</span>
                </div>
              </div>

              {/* Visual Battery Bar */}
              <div className="relative w-full h-3 rounded-full bg-[var(--surface-3)] overflow-hidden border border-[var(--divider)]/50">
                <div
                  className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${tier.gradientClass}`}
                  style={{ width: `${energyLevel}%` }}
                />
              </div>

              {/* Interactive Range Slider (Mobile Ergonomics >= 44px target) */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-3)] font-medium mb-1.5">
                  <span>🪫 0% (Истощён)</span>
                  <span>⚡ 100% (Полон сил)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={energyLevel}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEnergyLevel(val);
                  }}
                  className="w-full h-9 min-h-[44px] accent-[var(--accent)] cursor-pointer"
                  aria-label="Уровень энергии"
                />
              </div>

              {/* 4 Care Mode Preset Chips */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-wider">
                  Режимы заботы (быстрый выбор):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CARE_MODE_PRESETS.map((preset) => {
                    const isSelected = selectedCareMode === preset.key;
                    return (
                      <button
                        type="button"
                        key={preset.key}
                        onClick={() => handlePresetSelect(preset.key, preset.defaultEnergy, preset.label)}
                        className={`p-2.5 min-h-[44px] rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[var(--surface-solid)] border-[var(--accent)] ring-2 ring-[var(--accent)]/20 shadow-xs'
                            : 'bg-[var(--surface-solid)]/70 border-[var(--divider)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-solid)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{preset.icon}</span>
                          <span className="text-xs font-bold text-[var(--text)] truncate">
                            {preset.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--text-3)] shrink-0">
                          {preset.defaultEnergy}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Mood Presets Grid */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-wider px-1">
                Эмоциональный оттенок:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOOD_PRESETS.map((preset) => {
                  const isSelected = customMoodKey === preset.key;
                  return (
                    <button
                      type="button"
                      key={preset.key}
                      onClick={() => {
                        setCustomMoodKey(preset.key);
                        setCustomMoodLabel(preset.label);
                      }}
                      className={`p-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-start gap-2 transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs scale-[1.02]'
                          : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--divider)] hover:border-[var(--accent)]/40'
                      }`}
                    >
                      <ColoredIcon icon={preset.icon} color={preset.color} size="sm" />
                      <span className="leading-tight text-left">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Custom Label Input (16px base font to prevent iOS Safari auto-zoom) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-wider px-1 block">
                Своя формулировка состояния:
              </label>
              <input
                type="text"
                value={customMoodLabel}
                onChange={(e) => setCustomMoodLabel(e.target.value)}
                placeholder="Например: Заряжен на романтику / Устал от суеты..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-base sm:text-sm text-[var(--text)] font-medium placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* 4. Optional Note Input (16px base font to prevent iOS Safari auto-zoom) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-wider px-1 block">
                Заметка партнёру (необязательно):
              </label>
              <input
                type="text"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Пара тёплых слов о дне или чего хочется прямо сейчас..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-base sm:text-sm text-[var(--text)] font-normal placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Modal Actions (Touch targets >= 44px) */}
          <div className="flex gap-2 pt-3 border-t border-[var(--divider)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 min-h-[44px] rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!customMoodLabel.trim()}
              className="flex-1 py-3 min-h-[44px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Сохранить заряд и состояние</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
