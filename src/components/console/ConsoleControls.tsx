import React from 'react';
import { PetActionType, PetSpecies } from '../../types.ts';

interface ConsoleControlsProps {
  step: 'bios' | 'egg' | 'name' | 'game';
  onButtonA: () => void;
  onButtonB: () => void;
  onDpadUp: () => void;
  onDpadDown: () => void;
  onDpadLeft: () => void;
  onDpadRight: () => void;
  onToggleSound: () => void;
  onTogglePause: () => void;
}

export const ConsoleControls: React.FC<ConsoleControlsProps> = ({
  onButtonA,
  onButtonB,
  onDpadUp,
  onDpadDown,
  onDpadLeft,
  onDpadRight,
  onToggleSound,
  onTogglePause,
}) => {
  return (
    <div className="w-full flex flex-col justify-end shrink-0 pt-1">
      <div className="flex items-center justify-between px-1">
        {/* Left: Classic D-Pad Cross */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 relative flex items-center justify-center">
            <div className="absolute w-7 h-20 bg-[#16192E] rounded-md shadow-[1px_2px_0_rgba(0,0,0,0.3)]" />
            <div className="absolute w-20 h-7 bg-[#16192E] rounded-md shadow-[1px_2px_0_rgba(0,0,0,0.3)]" />

            <button
              type="button"
              aria-label="Up"
              onClick={onDpadUp}
              className="absolute top-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-t-sm flex items-center justify-center text-white active:translate-y-0.5 cursor-pointer"
            >
              <span className="text-[12px] font-bold">▲</span>
            </button>
            <button
              type="button"
              aria-label="Down"
              onClick={onDpadDown}
              className="absolute bottom-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-b-sm flex items-center justify-center text-white active:-translate-y-0.5 cursor-pointer"
            >
              <span className="text-[12px] font-bold">▼</span>
            </button>
            <button
              type="button"
              aria-label="Left"
              onClick={onDpadLeft}
              className="absolute left-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-l-sm flex items-center justify-center text-white active:translate-x-0.5 cursor-pointer"
            >
              <span className="text-[12px] font-bold">◀</span>
            </button>
            <button
              type="button"
              aria-label="Right"
              onClick={onDpadRight}
              className="absolute right-0 w-7 h-7 bg-[#2E354B] active:bg-[#1A1F2C] rounded-r-sm flex items-center justify-center text-white active:-translate-x-0.5 cursor-pointer"
            >
              <span className="text-[12px] font-bold">▶</span>
            </button>
            <div className="w-5 h-5 bg-[#181D29] rounded-full z-10 pointer-events-none" />
          </div>
          <span className="text-[7.5px] font-pixel text-[#16192E]/80 mt-1 uppercase tracking-tight">D-PAD</span>
        </div>

        {/* Center: Slanted Rubber Oval Buttons */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onToggleSound}
                className="w-8 h-3.5 bg-[#16192E] rounded-full transform -rotate-12 border border-[#16192E]/40 active:translate-y-0.5 shadow-sm cursor-pointer"
              />
              <span className="text-[7px] font-pixel text-[#16192E] uppercase mt-1">ЗВУК</span>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onTogglePause}
                className="w-8 h-3.5 bg-[#16192E] rounded-full transform -rotate-12 border border-[#16192E]/40 active:translate-y-0.5 shadow-sm cursor-pointer"
              />
              <span className="text-[7px] font-pixel text-[#16192E] uppercase mt-1">START</span>
            </div>
          </div>
          <div className="text-center mt-0.5">
            <span className="font-pixel text-[7.5px] text-[#16192E] tracking-wide block">★ RETRO CO-OP ★</span>
            <span className="text-[7px] font-bold text-[#16192E]/70 block">A: ДЕЙСТВИЕ • B: МЕНЮ</span>
          </div>
        </div>

        {/* Right: Round Arcade Action Buttons (B & A) */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btnB"
              onClick={onButtonB}
              className="w-12 h-12 rounded-full bg-[#00BCD4] border-[3px] border-[#16192E] font-black text-lg text-white shadow-[0_3px_0_#16192E] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
            >
              B
            </button>
            <span className="text-[7.5px] font-pixel text-[#16192E] mt-1 uppercase">МЕНЮ</span>
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              id="btnA"
              onClick={onButtonA}
              className="w-12 h-12 rounded-full bg-[#FFD600] border-[3px] border-[#16192E] font-black text-lg text-[#16192E] shadow-[0_3px_0_#16192E] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
            >
              A
            </button>
            <span className="text-[7.5px] font-pixel text-[#BA0029] mt-1 uppercase">ДЕЙСТВИЕ</span>
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center gap-1 text-[#BA0029]/70">
        <span className="text-[8px] font-pixel tracking-widest uppercase">LOOP.EXE CO-OP SYSTEM</span>
        <span className="text-[8px]">♡</span>
      </div>
    </div>
  );
};
