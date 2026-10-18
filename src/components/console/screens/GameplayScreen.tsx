import React from 'react';
import { CouplePetState, PetActionType } from '../../../types.ts';
import {
  PET_SPECIES_DETAILS,
  SLEEP_IMAGE,
  SLEEP_IMAGE_FALLBACK,
  MOOD_BUBBLES,
  getPetVisualStatus,
} from '../../../data/petData.ts';
import { PetAvatarLiving } from '../../pet/PetAvatarLiving.tsx';

interface FloatingHeart {
  id: number;
  emoji: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface GameplayScreenProps {
  pet: CouplePetState;
  isNightOrSleepy: boolean;
  selectedQuickAction: PetActionType;
  onSelectQuickAction: (action: PetActionType) => void;
  onPerformAction: (action: PetActionType) => void;
  onTapPet: () => void;
  onOpenPauseMenu: () => void;
  actionFeedback: string | null;
  currentFunnyQuote: string | null;
  isBouncing: boolean;
  showPurrBadge: boolean;
  floatingHearts: FloatingHeart[];
  isLoading: boolean;
  quickActions: Array<{
    type: PetActionType;
    emoji: string;
    label: string;
    xp: string;
    color: string;
  }>;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  pet,
  isNightOrSleepy,
  selectedQuickAction,
  onSelectQuickAction,
  onPerformAction,
  onTapPet,
  onOpenPauseMenu,
  actionFeedback,
  currentFunnyQuote,
  isBouncing,
  showPurrBadge,
  floatingHearts,
  isLoading,
  quickActions,
}) => {
  if (isNightOrSleepy) {
    return (
      <div className="flex flex-col justify-between h-full space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300 border-b border-cyan-500/20 pb-1">
          <div className="flex items-center gap-1">
            <span className="text-yellow-300">🌙</span>
            <span>НОЧНОЙ РЕЖИМ • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="text-emerald-400">CO-OP СПЯТ</span>
            <span className="bg-[#111C2D] text-cyan-300 px-1 rounded text-[8px]">
              ЭНРГ: {pet.energy}%
            </span>
          </div>
        </div>

        {/* 4 Need Gauges (Sleep Mode) */}
        <div className="grid grid-cols-4 gap-1.5 my-0.5">
          {[
            { label: 'СЫТ', val: pet.hunger, col: 'bg-yellow-400', txt: 'text-yellow-300' },
            { label: 'РАД', val: pet.joy, col: 'bg-cyan-400', txt: 'text-cyan-300' },
            { label: 'СОН', val: pet.energy, col: 'bg-sky-400 animate-pulse', txt: 'text-sky-300 animate-pulse' },
            { label: 'ЧИСТ', val: pet.cleanliness, col: 'bg-emerald-400', txt: 'text-emerald-300' },
          ].map((st) => (
            <div key={st.label} className="bg-[#131F42] border border-cyan-500/30 rounded p-1 text-center">
              <div className={`text-[7.5px] font-bold ${st.txt} flex justify-between`}>
                <span>{st.label}</span>
                <span>{st.val}%</span>
              </div>
              <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden mt-0.5">
                <div className={`h-full ${st.col} rounded-full`} style={{ width: `${st.val}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="self-center px-2 py-0.5 rounded-full bg-[#1A264F] border border-cyan-400/40 text-[9px] font-bold text-cyan-200 flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>⚠️ {pet.name.toUpperCase()} КЛЮЁТ НОСОМ • УЛОЖИТЕ МАЛЫША</span>
        </div>

        {/* Sleeping Pet Stage */}
        <div className="relative flex-1 flex flex-col items-center justify-center min-h-0 my-0.5">
          <div className="absolute top-1 left-3 text-yellow-300 text-xl animate-bounce">🌙</div>
          <div className="absolute top-2 right-6 text-yellow-200 text-xs animate-ping">✦</div>
          <div className="absolute bottom-2 left-5 text-cyan-300 text-xs">✨</div>

          <div className="absolute top-1 right-8 flex flex-col items-end text-cyan-300 font-pixel text-xs animate-pulse">
            <span className="text-[8px] opacity-40">z</span>
            <span className="text-[10px] opacity-70">Z</span>
            <span className="text-[12px] opacity-90 drop-shadow-[0_0_6px_#06B6D4]">Z</span>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-cyan-400/70 shadow-[0_0_24px_rgba(6,182,212,0.5)] bg-[#131F42] flex items-center justify-center p-1">
              <img
                src={SLEEP_IMAGE}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = SLEEP_IMAGE_FALLBACK;
                }}
                alt="Спящий питомец"
                className="w-full h-full object-contain filter drop-shadow-md animate-pulse"
                style={{ animationDuration: '3.5s' }}
              />
            </div>
            <div className="absolute -bottom-1.5 bg-[#A855F7] text-white font-pixel text-[8px] px-3 py-0.5 rounded-full border border-white/30 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              💤 СЛАДКО СПИТ
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#131F42] border border-cyan-500/40 p-2 text-center">
          <div className="text-[9.5px] font-bold text-yellow-300">
            🌙 ТИХИЙ ЧАС И ВОССТАНОВЛЕНИЕ ЭНЕРГИИ
          </div>
          <div className="text-[8px] text-cyan-200 mt-0.5">
            Сон восполняет силы и дарит спокойствие союзу
          </div>
        </div>

        <button
          type="button"
          onClick={() => onPerformAction('sleep')}
          disabled={isLoading}
          className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white border-2 border-[#16192E] rounded-xl py-2 px-3 shadow-[0_3px_0_#111C2D] flex items-center justify-between active:translate-y-0.5 transition-transform cursor-pointer"
        >
          <span className="font-pixel text-[8.5px] uppercase">
            🌙 УЛОЖИТЬ СПАТЬ (ЖМИ А)
          </span>
          <span className="bg-[#FFE600] text-[#111C2D] font-pixel text-[7.5px] px-1.5 py-0.5 rounded font-black">
            +25 XP 💤
          </span>
        </button>
      </div>
    );
  }

  const visualStatus = getPetVisualStatus(pet, isNightOrSleepy);

  return (
    <div className="flex flex-col justify-between h-full space-y-1">
      <div className="flex items-center justify-between pb-1 border-b border-[#111C2D]/15 text-[9px] font-bold text-[#111C2D]">
        <div className="flex items-center gap-1">
          <span>🔥 СТРИК 42 ДНЯ</span>
          <span className="text-[#111C2D]/40">•</span>
          <span>1.2 КГ</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-emerald-800">CO-OP: OK</span>
          <span className="bg-[#111C2D] text-[#32FF98] px-1.5 py-0.2 rounded font-pixel text-[7.5px]">
            PWR: 99%
          </span>
        </div>
      </div>

      {/* 4 Vital Stat Bars */}
      <div className="grid grid-cols-4 gap-1.5 my-0.5">
        {[
          { label: '🍓 СЫТ', val: pet.hunger, col: 'bg-[#BA0029]', valCol: 'text-[#BA0029]' },
          { label: '⚡ РАД', val: pet.joy, col: 'bg-[#FFD600]', valCol: 'text-amber-500' },
          { label: '💤 ЭНРГ', val: pet.energy, col: 'bg-[#00BCD4]', valCol: 'text-cyan-600' },
          { label: '🧼 ЧИСТ', val: pet.cleanliness, col: 'bg-[#22C55E]', valCol: 'text-emerald-600' },
        ].map((st) => (
          <div key={st.label} className="bg-white/95 border border-[#111C2D] rounded-lg p-1 text-center shadow-xs">
            <div className="flex items-center justify-between text-[7.5px] font-black text-[#111C2D] mb-0.5">
              <span>{st.label}</span>
              <span className={st.valCol}>{st.val}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#111C2D]/15 rounded-full overflow-hidden">
              <div className={`h-full ${st.col} rounded-full transition-all duration-500`} style={{ width: `${st.val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Central Pet Interactive Stage with Living Pet Avatar */}
      <div
        onClick={onTapPet}
        className="relative flex-1 flex flex-col items-center justify-center my-0.5 cursor-pointer select-none"
        title="Тапните по питомцу, чтобы погладить!"
      >
        <div className="mb-1 flex items-center justify-center max-w-[280px]">
          <div className="bg-white border-[1.5px] border-[#16192E] rounded-full px-3 py-1 text-[9.5px] font-bold shadow-[2px_2px_0px_#16192E] inline-flex items-center gap-1.5 animate-bounce text-center">
            <span className="text-xs">{pet.species === 'cat' ? '🐱' : '🐶'}</span>
            <span className="text-[#16192E] font-black tracking-tight leading-tight">
              {currentFunnyQuote || visualStatus.speech}
            </span>
            <span className="text-xs">✨</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-[#FFD600]/30 filter blur-md animate-pulse pointer-events-none" />
          <div
            className="w-36 h-36 rounded-full border-2 border-dashed border-[#FFD600] animate-spin absolute pointer-events-none opacity-80"
            style={{ animationDuration: '24s' }}
          />

          <PetAvatarLiving
            pet={pet}
            size="console"
            isBouncing={isBouncing}
            showNeedBadge={false}
            interactive={false}
          />

          {showPurrBadge && (
            <div className="absolute -right-3 top-0 bg-[#FFE600] text-[#16192E] border-2 border-[#16192E] px-2 py-0.5 rounded-full font-pixel text-[8px] font-black shadow-[2px_2px_0px_#16192E] z-30 animate-pulse">
              {pet.species === 'cat' ? 'МУРРР~ +5❤️' : 'ГАВ-ГАВ! +5❤️'}
            </div>
          )}

          {floatingHearts.map((h) => (
            <span
              key={h.id}
              className="absolute pointer-events-none text-lg z-30 transition-all duration-700 ease-out select-none"
              style={{
                left: `${h.x}px`,
                top: `${h.y}px`,
                transform: `translate(${h.targetX}px, ${h.targetY}px) scale(1.3)`,
                opacity: 0,
              }}
            >
              {h.emoji}
            </span>
          ))}
        </div>

        <div className="w-24 h-2 bg-[#16192E]/15 rounded-full mx-auto mt-1 blur-2xs" />

        <div className="mt-1 flex items-center gap-1 bg-white/95 border-[1.5px] border-[#16192E] rounded-full px-2.5 py-0.5 shadow-xs">
          <span className="text-[9.5px] font-black text-[#111C2D]">
            {pet.species === 'cat' ? 'Кошечка' : 'Чихуахуа'} {pet.name} • Lv.{pet.level} 🐾
          </span>
          <span
            className={`text-[7.5px] font-black px-1.5 py-0.2 rounded-full border border-[#111C2D] ${
              visualStatus.urgency === 'critical'
                ? 'bg-[#FB083C] text-white animate-pulse'
                : visualStatus.urgency === 'warning'
                ? 'bg-[#FFE600] text-[#111C2D]'
                : 'bg-[#32FF98] text-[#111C2D]'
            }`}
          >
            {visualStatus.badgeEmoji} {visualStatus.badgeText}
          </span>
        </div>

        <div className="text-[8px] text-[#16192E]/60 font-bold mt-0.5 flex items-center gap-1">
          <span>👆</span>
          <span>Тапни по {pet.name}, чтобы погладить и развеселить!</span>
        </div>
      </div>

      {/* Duo Synergy Progress */}
      <div className="bg-white/95 border-[1.5px] border-[#111C2D] rounded-xl p-1.5 shadow-xs">
        <div className="flex items-center justify-between text-[8.5px] font-black text-[#111C2D] mb-0.5">
          <span className="text-[#BA0029] flex items-center gap-1">♡ СИНЕРГИЯ ДУО</span>
          <span className="text-[#725C00]">РОСТ 2X БЫСТРЕЕ ⚡</span>
        </div>
        <div className="w-full h-2 bg-[#111C2D]/15 rounded-full overflow-hidden border border-[#111C2D]/20 relative">
          <div
            className="h-full bg-gradient-to-r from-[#BA0029] via-[#FFD600] to-[#22C55E] rounded-full transition-all duration-500"
            style={{ width: `${pet.synergy ?? 95}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[7.5px] text-[#111C2D]/80 font-bold mt-0.5 px-0.5">
          <span>Аура пары: Радужное сияние</span>
          <span className="font-black text-[#111C2D]">{pet.synergy ?? 95}% Резонанс</span>
        </div>
      </div>

      {/* Quick Actions Care Menu (2x2 Grid) */}
      <div className="bg-white/95 rounded-xl p-1.5 border-[1.5px] border-[#111C2D] shadow-xs flex flex-col gap-1">
        <div className="flex items-center justify-between border-b border-[#111C2D]/15 pb-0.5">
          <span className="font-pixel text-[8px] font-bold text-[#111C2D]">🎮 БЫСТРЫЕ ДЕЙСТВИЯ</span>
          <button
            type="button"
            onClick={onOpenPauseMenu}
            className="bg-[#00BCD4] text-[#111C2D] text-[7px] font-black px-1.5 py-0.2 rounded border border-[#111C2D] cursor-pointer"
          >
            МЕНЮ (B)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((act) => {
            const isSelected = selectedQuickAction === act.type;
            const isUrgent = visualStatus.primaryAction === act.type;
            return (
              <div
                key={act.type}
                onClick={() => onSelectQuickAction(act.type)}
                className={`rounded-lg p-1 flex items-center gap-1.5 cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-[#FEF08A] border-2 border-[#FB083C] shadow-[1px_1px_0px_#111C2D]'
                    : isUrgent
                    ? 'bg-[#FEF08A]/60 border-2 border-[#00BCD4] shadow-xs animate-pulse'
                    : 'bg-white/90 border border-[#111C2D] shadow-xs'
                }`}
              >
                <span className="text-sm">{act.emoji}</span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[8.5px] font-black text-[#111C2D] leading-none">{act.label}</span>
                    {isSelected && (
                      <span className="bg-[#BA0029] text-white text-[6px] font-black px-1 rounded">ЖМИ А</span>
                    )}
                    {!isSelected && isUrgent && (
                      <span className="bg-[#00BCD4] text-[#111C2D] text-[6px] font-black px-1 rounded">НУЖНО!</span>
                    )}
                  </div>
                  <span className={`text-[6.5px] ${act.color} font-black mt-0.5`}>{act.xp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Action Banner Button */}
      {(() => {
        const actionLabels: Record<PetActionType, { label: string; xp: string; icon: string }> = {
          feed: { label: `ПОКОРМИТЬ ${pet.name.toUpperCase()}`, xp: '+15 XP', icon: '🍽' },
          play: { label: `ПОИГРАТЬ С ${pet.name.toUpperCase()}`, xp: '+20 XP', icon: '🎾' },
          wash: { label: `ПОМЫТЬ ${pet.name.toUpperCase()}`, xp: '+15 XP', icon: '🧼' },
          sleep: { label: `УЛОЖИТЬ СПАТЬ ${pet.name.toUpperCase()}`, xp: '+25 XP', icon: '🌙' },
          hug: { label: `ОБНЯТЬ ${pet.name.toUpperCase()}`, xp: '+10 XP', icon: '❤️' },
        };
        const currentMeta = actionLabels[selectedQuickAction] || actionLabels.feed;

        return (
          <button
            type="button"
            onClick={() => onPerformAction(selectedQuickAction)}
            disabled={isLoading}
            className="w-full bg-[#BA0029] hover:bg-[#E90036] active:scale-[0.98] border-[2.5px] border-[#111C2D] rounded-xl py-2 px-3 flex items-center justify-between shadow-[0_3px_0_#111C2D] text-white transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-xs font-black tracking-wide">
              <span>{currentMeta.icon}</span>
              <span className="truncate">
                {actionFeedback || `${currentMeta.label} (ЖМИ А)`}
              </span>
            </span>
            <span className="bg-[#FFD600] text-[#111C2D] font-black text-[9px] px-2 py-0.5 rounded-full border border-[#111C2D] shadow-xs shrink-0">
              {currentMeta.xp}
            </span>
          </button>
        );
      })()}
    </div>
  );
};
