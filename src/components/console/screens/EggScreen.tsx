import React from 'react';
import { PetSpecies } from '../../../types.ts';
import { PET_SPECIES_DETAILS } from '../../../data/petData.ts';

interface EggScreenProps {
  selectedSpecies: PetSpecies;
  onSelectSpecies: (species: PetSpecies) => void;
  onConfirm: () => void;
}

export const EggScreen: React.FC<EggScreenProps> = ({
  selectedSpecies,
  onSelectSpecies,
  onConfirm,
}) => {
  return (
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center text-[10px] font-vt tracking-wider border-b border-[#111C2D]/15 pb-1">
        <span className="text-emerald-800 font-bold">SYS.INCUBATOR // V1.0</span>
        <span className="text-[#BA0029] font-black text-[9px]">CO-OP SYNC: OK</span>
        <span className="text-emerald-800 font-bold">BATTERY: 100%</span>
      </div>

      <div className="text-center my-0.5">
        <div className="inline-block bg-[#16192E] border border-[#111C2D] px-2 py-0.5 rounded shadow-sm">
          <h2 className="font-pixel text-[9px] text-[#32FF98] tracking-wide uppercase">
            🥚 ИНКУБАТОР: ВЫБЕРИТЕ ХРАНИТЕЛЯ
          </h2>
        </div>
        <p className="text-[10px] font-bold text-[#111C2D]/70 mt-0.5">
          Выбор общего питомца пары на весь игровой цикл
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 my-auto">
        {(['dog', 'cat'] as PetSpecies[]).map((sp) => {
          const details = PET_SPECIES_DETAILS[sp];
          const isSelected = selectedSpecies === sp;
          return (
            <div
              key={sp}
              onClick={() => onSelectSpecies(sp)}
              className={`relative rounded-xl p-2 flex flex-col items-center justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-2 border-[#BA0029] shadow-[0_0_12px_rgba(186,0,41,0.25)] ring-1 ring-[#BA0029]'
                  : 'bg-white/60 border border-[#111C2D]/30 opacity-75 hover:opacity-100'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2.5 bg-[#BA0029] text-white font-pixel text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  ► ВЫБРАНО
                </div>
              )}
              <div
                className={`w-16 h-20 bg-gradient-to-b ${details.eggGradient} rounded-[50%_50%_46%_46%_/_60%_60%_40%_40%] border-2 border-[#16192E] p-1 flex items-center justify-center relative shadow-sm my-1 animate-bounce`}
                style={{ animationDuration: sp === 'dog' ? '2.5s' : '3s' }}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#16192E] bg-white flex items-center justify-center p-0.5 shadow-inner">
                  <img
                    src={details.image}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = details.imageFallback;
                    }}
                    alt={details.title}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
              </div>
              <div className="text-center w-full mt-1">
                <div className={`font-pixel text-[9px] font-bold ${sp === 'dog' ? 'text-[#BA0029]' : 'text-emerald-800'}`}>
                  {details.title}
                </div>
                <div className="bg-[#FFE3E8] border border-[#BA0029]/30 rounded px-1 py-0.5 mt-1 text-[8.5px] font-extrabold text-[#BA0029]">
                  {details.bonus}
                </div>
                <div className="font-pixel text-[6.5px] text-[#111C2D]/70 mt-1 uppercase">{details.badge}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full bg-[#16192E] text-[#FFD700] border-2 border-[#16192E] rounded-xl py-2 px-2 shadow-[0_3px_0_#0D111F] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-transform cursor-pointer"
        >
          <span className="font-pixel text-[8.5px] uppercase tracking-wide">
            [ НАЖМИТЕ (A) ЧТОБЫ СОГЛАСОВАТЬ ]
          </span>
        </button>
      </div>
    </div>
  );
};
