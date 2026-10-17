import React from 'react';
import { CouplePetState } from '../../../types.ts';

interface PauseMenuModalProps {
  pet: CouplePetState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCloseConsole: () => void;
  onResumeGame: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  pet,
  soundEnabled,
  onToggleSound,
  onCloseConsole,
  onResumeGame,
}) => {
  return (
    <div className="flex flex-col justify-between h-full space-y-2">
      <div className="w-full flex items-center justify-between bg-[#111C2D] text-white px-2.5 py-1.5 rounded-lg shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[#FFD600] animate-spin" style={{ animationDuration: '3s' }}>
            ⚙️
          </span>
          <span className="font-pixel text-[9px] tracking-wider text-[#FFD600]">
            [ PAUSE // МЕНЮ СОЮЗА (B) ]
          </span>
        </div>
        <span className="font-pixel text-[7.5px] bg-[#BA0029] px-1.5 py-0.5 rounded text-white">
          АКТИВНО
        </span>
      </div>

      <div className="my-auto space-y-2">
        <div
          onClick={onToggleSound}
          className="bg-white/95 rounded-xl p-2.5 border border-[#111C2D] shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
            <div>
              <div className="font-bold text-[11px] text-[#111C2D]">ЗВУК &amp; ВИБРО</div>
              <div className="text-[9px] text-[#111C2D]/60 font-medium">8-бит щелчки и виброотклик</div>
            </div>
          </div>
          <div
            className={`font-pixel text-[8px] px-2 py-0.5 rounded font-black ${
              soundEnabled ? 'bg-[#22C55E] text-[#111C2D]' : 'bg-zinc-200 text-zinc-600'
            }`}
          >
            {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
          </div>
        </div>

        <div className="bg-white/95 rounded-xl p-2.5 border border-[#111C2D] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <div>
              <div className="font-bold text-[11px] text-[#111C2D]">СИНХРОНИЗАЦИЯ ПАРЫ</div>
              <div className="text-[9px] text-[#111C2D]/60 font-medium">98% связь • Онлайн союза OK</div>
            </div>
          </div>
          <span className="font-pixel text-[7.5px] bg-[#E8F5E9] text-emerald-800 border border-emerald-600/30 px-1.5 py-0.5 rounded font-bold">
            ТАЙМИНГ OK
          </span>
        </div>

        <div className="bg-white/95 rounded-xl p-2.5 border border-[#111C2D] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏷️</span>
            <div>
              <div className="font-bold text-[11px] text-[#111C2D]">ИМЯ ПИТОМЦА</div>
              <div className="text-[9px] text-[#111C2D]/60 font-medium">Статус: Подтверждено парой</div>
            </div>
          </div>
          <span className="font-pixel text-[8px] bg-[#FFE600] text-[#111C2D] border border-[#111C2D] px-2 py-0.5 rounded font-black">
            {pet.name}
          </span>
        </div>

        <div
          onClick={onCloseConsole}
          className="bg-[#FFF0F2] rounded-xl p-2.5 border border-[#BA0029] shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🚪</span>
            <div>
              <div className="font-bold text-[11px] text-[#BA0029]">ВЫХОД В ЛОББИ</div>
              <div className="text-[9px] text-[#111C2D]/60 font-medium">Вернуться в главный дашборд</div>
            </div>
          </div>
          <span className="font-pixel text-[8px] text-[#BA0029]">ВЫХОД ▶</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onResumeGame}
        className="w-full bg-[#111C2D] text-[#38E5FF] border-2 border-[#111C2D] rounded-xl py-2 px-3 shadow-[0_3px_0_#0D111F] flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform cursor-pointer"
      >
        <span className="font-pixel text-[9px] uppercase tracking-wide">
          [ B ] ВЕРНУТЬСЯ В ИГРУ С ПИТОМЦЕМ
        </span>
      </button>
    </div>
  );
};
