import React from 'react';
import { CouplePetState } from '../../../types.ts';

interface BiosScreenProps {
  pet: CouplePetState | null;
  onButtonA: () => void;
}

export const BiosScreen: React.FC<BiosScreenProps> = ({ pet, onButtonA }) => {
  return (
    <div className="relative z-10 flex flex-col justify-between h-full text-[#34D399] font-mono">
      <div className="flex justify-between items-center text-[10px] border-b border-[#34D399]/20 pb-1">
        <span className="tracking-wider">SYS.BOOT // 2025</span>
        <span>BATTERY: 100% [||||]</span>
      </div>

      <div className="my-auto space-y-2.5 p-1">
        <div className="flex items-center gap-2 text-[#6EE7B7]">
          <span className="text-lg animate-pulse">👾</span>
          <h1 className="font-pixel text-[12px] tracking-wider font-bold">LOOP-DOS v1.0</h1>
        </div>

        <div className="bg-[#050D0A]/90 p-3 rounded-xl border border-[#34D399]/30 text-[10px] space-y-1.5 shadow-inner">
          <div className="flex justify-between">
            <span>&gt; ROM CHECK:</span>
            <span className="text-[#34D399] font-bold bg-[#064E3B]/60 px-1 rounded">OK [PASS]</span>
          </div>
          <div className="flex justify-between">
            <span>&gt; CO-OP CHANNEL:</span>
            <span className="text-[#34D399] font-bold bg-[#064E3B]/60 px-1 rounded">SECURE 256-BIT</span>
          </div>
          <div className="flex justify-between">
            <span>&gt; PARTNER SYNC:</span>
            <span className="text-[#34D399] font-bold bg-[#064E3B]/60 px-1 rounded">READY (ОНЛАЙН)</span>
          </div>
          <div className="flex justify-between text-[#6EE7B7]/70 text-[9px] pt-1 border-t border-[#34D399]/20">
            <span>&gt; MEMORY BUFFER:</span>
            <span>{pet ? '1 PET ACTIVE' : '0 PETS DETECTED'}</span>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onButtonA}
            className="inline-block px-4 py-2 rounded-lg bg-[#064E3B]/80 border border-[#34D399]/70 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse hover:bg-[#064E3B] cursor-pointer"
          >
            <span className="font-pixel text-[10.5px] text-[#A7F3D0] tracking-wider font-bold">
              [ НАЖМИТЕ КНОПКУ (A) ]
            </span>
          </button>
          <p className="text-[8.5px] text-[#6EE7B7]/60 mt-2 font-pixel">✨ 8-BIT BOOT CHIME &amp; HAPTIC ENGAGED</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-[9px] text-[#34D399]/70 border-t border-[#34D399]/20 pt-1">
        <span>STATUS: READY</span>
        <span className="animate-pulse">CO-OP SYSTEM &gt;&gt;</span>
      </div>
    </div>
  );
};
