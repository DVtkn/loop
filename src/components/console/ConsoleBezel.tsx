import React from 'react';

interface ConsoleBezelProps {
  isNightOrSleepy: boolean;
  onClose: () => void;
}

export const ConsoleBezel: React.FC<ConsoleBezelProps> = ({ isNightOrSleepy, onClose }) => {
  return (
    <div className="w-full flex items-center justify-between px-2 pt-0.5 pb-2 shrink-0">
      <div className="flex gap-1.5 opacity-85">
        <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block" />
        <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block" />
        <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block" />
      </div>

      <div className="bg-[#16192E] px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-[#16192E]">
        <span className="w-2 h-2 rounded-full bg-[#32FF98] shadow-[0_0_8px_#32FF98] animate-pulse" />
        <span className="font-pixel text-[8.5px] tracking-wider text-[#32FF98] uppercase">
          {isNightOrSleepy ? 'LINK OK (SLEEP)' : 'LINK OK • DUO'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 opacity-85">
          <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block" />
          <span className="w-2 h-2 rounded-full bg-[#16192E] inline-block" />
        </div>
        <button
          onClick={onClose}
          title="Закрыть консоль"
          className="w-5 h-5 rounded-full bg-[#16192E] text-white/80 hover:text-white flex items-center justify-center text-[10px] font-bold border border-[#374151] active:scale-90 transition-transform ml-1 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
