import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Sparkles,
  Settings2,
  Plus,
  Trash2,
  X,
  Check,
  Trophy,
  Dices,
  RefreshCw,
} from 'lucide-react';
import {
  HouseholdRouletteItem,
  getHouseholdItems,
  saveHouseholdItems,
  addHouseholdItem,
  deleteHouseholdItem,
  resetHouseholdItems,
  ROULETTE_PALETTE_COLORS,
  ROULETTE_EMOJI_SUGGESTIONS,
  MIN_ROULETTE_ITEMS,
} from '../../data/householdRouletteData.ts';
import { play8BitAudio } from '../../utils/audio8Bit.ts';
import { triggerHaptic } from '../../utils/haptics.ts';

export interface HouseholdRouletteProps {
  currentPartnerName: string;
  partnerName: string;
  onBack?: () => void;
  onAddCoupleXP: (xp: number, desc: string, type?: any) => void;
  onTriggerConfetti: () => void;
}

export const HouseholdRoulette: React.FC<HouseholdRouletteProps> = ({
  currentPartnerName,
  partnerName,
  onBack,
  onAddCoupleXP,
  onTriggerConfetti,
}) => {
  // Items state from storage
  const [items, setItems] = useState<HouseholdRouletteItem[]>(() => getHouseholdItems());

  // Wheel animation & physics state
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [needleTwitch, setNeedleTwitch] = useState<boolean>(false);
  const currentRotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Winner & Assignee celebration state
  const [selectedItem, setSelectedItem] = useState<HouseholdRouletteItem | null>(null);
  const [assignee, setAssignee] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [xpClaimed, setXpClaimed] = useState<boolean>(false);
  const xpClaimedRef = useRef<boolean>(false);

  // Custom chore management drawer/modal
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newEmoji, setNewEmoji] = useState<string>('🧹');
  const [newColor, setNewColor] = useState<string>(ROULETTE_PALETTE_COLORS[0]);

  // Clean up any timers/animations on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  const numSlices = items.length;
  const sliceAngle = 360 / numSlices;

  // Wheel math: helper to construct SVG arc path
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // Trigger wheel spin
  const handleSpin = useCallback(() => {
    if (isSpinning || numSlices < MIN_ROULETTE_ITEMS) return;

    triggerHaptic('selection');
    play8BitAudio('click');
    setIsSpinning(true);
    setSelectedItem(null);
    setShowCelebration(false);
    xpClaimedRef.current = false;
    setXpClaimed(false);

    // Pick random target slice
    const targetIndex = Math.floor(Math.random() * numSlices);
    const targetItem = items[targetIndex];

    // Slices are oriented with SVG -rotate-90 (slice 0 starts at Top / 0 deg clockwise).
    // Target slice center is at (targetIndex + 0.5) * sliceAngle deg clockwise.
    // To align the target slice center with the top pointer (0 deg):
    const targetSliceCenter = (targetIndex + 0.5) * sliceAngle;
    const targetAngle = 360 - targetSliceCenter;

    // Continuous forward rotation: at least 5-7 full spins
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const currentBase = Math.ceil(currentRotationRef.current / 360) * 360;
    const newRotation = currentBase + extraSpins + targetAngle;

    const startRot = currentRotationRef.current;
    currentRotationRef.current = newRotation;
    setRotation(newRotation);

    const spinDuration = 3300; // 3.3s
    const startTime = performance.now();
    let lastSectorIndex = Math.floor(startRot / sliceAngle);

    // Real-time tick & haptic feedback loop during deceleration
    const tickLoop = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / spinDuration);
      // Deceleration curve: cubic-bezier approximation
      const eased = 1 - Math.pow(1 - t, 3.2);
      const currentAngle = startRot + (newRotation - startRot) * eased;
      const currentSector = Math.floor(currentAngle / sliceAngle);

      if (currentSector > lastSectorIndex) {
        lastSectorIndex = currentSector;
        play8BitAudio('click');
        triggerHaptic('light');
        setNeedleTwitch(true);
        setTimeout(() => setNeedleTwitch(false), 45);
      }

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tickLoop);
      }
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      animFrameRef.current = requestAnimationFrame(tickLoop);
    }

    // Spin completion
    spinTimerRef.current = setTimeout(() => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsSpinning(false);
      setSelectedItem(targetItem);

      // Fair Play Assignee selection: 50/50 between partners
      const partners = [currentPartnerName || 'Я', partnerName || 'Партнёр'];
      const chosenAssignee = partners[Math.floor(Math.random() * partners.length)];
      setAssignee(chosenAssignee);

      play8BitAudio('fanfare');
      triggerHaptic('success');
      onTriggerConfetti();
      setShowCelebration(true);
    }, spinDuration);
  }, [isSpinning, numSlices, items, sliceAngle, currentPartnerName, partnerName, onTriggerConfetti]);

  // Handle claiming the XP bonus
  const handleClaimXP = () => {
    if (xpClaimedRef.current || xpClaimed || !selectedItem) return;
    xpClaimedRef.current = true;
    setXpClaimed(true);
    onAddCoupleXP(15, `Рулетка честного быта: ${selectedItem.title} (${assignee})`, 'bonus');
    play8BitAudio('sparkle');
    triggerHaptic('success');
    setTimeout(() => {
      setShowCelebration(false);
    }, 400);
  };

  // Add custom chore
  const handleAddChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const updated = addHouseholdItem({
      title: newTitle.trim(),
      emoji: newEmoji,
      color: newColor,
    });
    setItems(updated);
    setNewTitle('');
    triggerHaptic('selection');
    play8BitAudio('click');
  };

  // Delete chore
  const handleDeleteChore = (id: string) => {
    if (items.length <= MIN_ROULETTE_ITEMS) return;
    const updated = deleteHouseholdItem(id);
    setItems(updated);
    triggerHaptic('light');
    play8BitAudio('click');
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    const defaults = resetHouseholdItems();
    setItems(defaults);
    triggerHaptic('selection');
    play8BitAudio('click');
  };

  return (
    <div className="space-y-4 max-w-full overflow-hidden animate-fadeIn pb-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition-colors min-h-[44px] min-w-[44px] -ml-2 px-2"
          >
            ← Назад к играм
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            disabled={isSpinning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] text-xs font-semibold border border-[var(--divider)] transition-all min-h-[44px] active:scale-95 disabled:opacity-50"
            aria-label="Настройка обязанностей"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Обязанности ({items.length})</span>
            <span className="sm:hidden">{items.length}</span>
          </button>
        </div>
      </div>

      {/* Main Wheel Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--divider)] shadow-xs relative flex flex-col items-center justify-center">
        {/* Banner Header */}
        <div className="w-full text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold mb-1.5">
            <Dices className="w-3.5 h-3.5" />
            Честный жребий
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">
            Рулетка честного быта
          </h2>
          <p className="text-xs text-[var(--text-2)] mt-0.5 max-w-sm mx-auto">
            Крутите колесо, чтобы весело и справедливо распределить домашние дела и приятные ритуалы
          </p>
        </div>

        {/* Wheel & Needle Wrapper */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-2 select-none">
          {/* Top Pointer Needle with recoil animation */}
          <div
            className="absolute top-0 left-1/2 z-30 pointer-events-none drop-shadow-md"
            style={{
              transform: needleTwitch
                ? 'translateX(-50%) translateY(-10px) rotate(-14deg)'
                : 'translateX(-50%) translateY(-10px) rotate(0deg)',
              transition: needleTwitch ? 'transform 0.04s ease-out' : 'transform 0.14s ease-out',
            }}
          >
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-rose-500 drop-shadow-sm filter" />
          </div>

          {/* Rotating Wheel Body */}
          <div
            className="w-full h-full rounded-full shadow-lg border-4 border-[var(--surface)] overflow-hidden relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 3.3s cubic-bezier(0.12, 0.8, 0.2, 1.0)'
                : 'none',
            }}
          >
            {/* SVG Pie Slices */}
            <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90 rounded-full">
              {items.map((slice, i) => {
                const startAngle = i / numSlices;
                const endAngle = (i + 1) / numSlices;
                const [startX, startY] = getCoordinatesForPercent(startAngle);
                const [endX, endY] = getCoordinatesForPercent(endAngle);
                const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                const pathData = [
                  `M 0 0`,
                  `L ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `Z`,
                ].join(' ');

                const isEven = i % 2 === 0;

                return (
                  <path
                    key={slice.id}
                    d={pathData}
                    fill={slice.color}
                    fillOpacity={isEven ? 0.94 : 0.82}
                    stroke="var(--surface)"
                    strokeWidth="0.015"
                  />
                );
              })}
            </svg>

            {/* Radial Labels and Emojis Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {items.map((slice, i) => {
                const angle = i * sliceAngle + sliceAngle / 2;
                return (
                  <div
                    key={slice.id}
                    className="absolute w-full h-full top-0 left-0 flex items-start justify-center pt-2 sm:pt-3.5"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 50%',
                    }}
                  >
                    <div
                      className="flex flex-col items-center select-none text-center"
                      style={{
                        transform: 'rotate(90deg)',
                      }}
                    >
                      <span className="text-base sm:text-xl leading-none filter drop-shadow-xs">
                        {slice.emoji}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Spin Action Button */}
          <div className="absolute inset-0 m-auto w-18 h-18 sm:w-20 sm:h-20 rounded-full z-20 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full h-full rounded-full bg-[var(--surface)] text-[var(--text)] border-3 border-[var(--divider)] shadow-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-all min-h-[44px] min-w-[44px] ${
                isSpinning
                  ? 'opacity-80 cursor-not-allowed scale-95'
                  : 'hover:border-indigo-500 hover:scale-105'
              }`}
              aria-label="Крутить рулетку"
            >
              <RotateCw
                className={`w-5 h-5 text-indigo-500 dark:text-indigo-400 ${
                  isSpinning ? 'animate-spin' : ''
                }`}
              />
              <span className="text-[10px] sm:text-xs font-bold leading-tight uppercase tracking-wider">
                {isSpinning ? '...' : 'Крутить'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Spin Trigger Bar on Mobile */}
        <div className="mt-4 w-full flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50 min-h-[44px]"
          >
            <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Рулетка крутится...' : 'Испытать жребий'}</span>
          </button>
        </div>

        {/* Gamification Tip */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-2)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Каждый принятый жребий приносит <strong>+15 XP</strong> в баланс пары</span>
        </div>
      </div>

      {/* Celebration Modal / Victory Announcement */}
      {showCelebration && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-3xl shadow-xs">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
                Жребий брошен!
              </span>
              <h3 className="text-xl font-extrabold text-[var(--text)] mt-2">
                {selectedItem.title}
              </h3>
            </div>

            {/* Assignee Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-center space-y-1">
              <p className="text-xs text-[var(--text-2)] font-medium">
                Сегодня это делает:
              </p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {selectedItem.emoji} {assignee}
              </p>
              <p className="text-[11px] text-[var(--text-2)] italic mt-1">
                {assignee === (currentPartnerName || 'Я')
                  ? `Благородная миссия заботы о доме сегодня на тебе! ${partnerName || 'Партнёр'} шлёт лучи любви 💕`
                  : `${currentPartnerName || 'Ты'} сегодня официально на чилле и отдыхе! 👑`}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleClaimXP}
                disabled={xpClaimed}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>{xpClaimed ? 'Жребий принят! (+15 XP)' : 'Принять жребий (+15 XP)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCelebration(false);
                  handleSpin();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--surface-2)] text-[var(--text)] font-semibold text-xs border border-[var(--divider)] hover:bg-[var(--surface-3)] active:scale-98 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Крутить снова</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Chore Customization Sheet/Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--divider)] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--divider)]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)]">
                  Настройка обязанностей
                </h3>
                <p className="text-xs text-[var(--text-2)]">
                  {items.length} активных дел в рулетке (минимум {MIN_ROULETTE_ITEMS})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Закрыть настройки"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chores List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-56">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] gap-2"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${item.color}25`, color: item.color }}
                    >
                      {item.emoji}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[var(--text)] truncate">
                      {item.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteChore(item.id)}
                    disabled={items.length <= MIN_ROULETTE_ITEMS}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title={
                      items.length <= MIN_ROULETTE_ITEMS
                        ? `Минимум ${MIN_ROULETTE_ITEMS} обязанности`
                        : 'Удалить обязанность'
                    }
                    aria-label={`Удалить ${item.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Chore Form */}
            <form onSubmit={handleAddChore} className="space-y-3 pt-2 border-t border-[var(--divider)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Добавить своё задание
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Заправить кровать 🛏️"
                    className="flex-1 px-3 py-2 text-base rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text)] placeholder-[var(--text-2)] focus:outline-hidden focus:border-indigo-500 min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs disabled:opacity-40 min-h-[44px] flex items-center justify-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить</span>
                  </button>
                </div>
              </div>

              {/* Emoji Selector */}
              <div>
                <span className="text-[11px] font-medium text-[var(--text-2)] mb-1 block">
                  Иконка задания:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--divider)]">
                  {ROULETTE_EMOJI_SUGGESTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewEmoji(em)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform min-h-[32px] min-w-[32px] ${
                        newEmoji === em ? 'bg-indigo-500/20 scale-110 ring-2 ring-indigo-500' : 'hover:bg-[var(--surface)]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <span className="text-[11px] font-medium text-[var(--text-2)] mb-1 block">
                  Цвет сектора:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {ROULETTE_PALETTE_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewColor(col)}
                      className={`w-6 h-6 rounded-full shrink-0 transition-transform min-h-[32px] min-w-[32px] ${
                        newColor === col ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: col }}
                      aria-label={`Выбрать цвет ${col}`}
                    />
                  ))}
                </div>
              </div>
            </form>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--divider)]">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-[var(--text-2)] hover:text-rose-500 transition-colors py-2 min-h-[44px]"
              >
                Сбросить к стандартным
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-xs font-bold border border-[var(--divider)] hover:bg-[var(--surface-3)] min-h-[44px]"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
