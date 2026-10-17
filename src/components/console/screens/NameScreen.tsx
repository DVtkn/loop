import React from 'react';
import { PetSpecies } from '../../../types.ts';
import { PET_SPECIES_DETAILS } from '../../../data/petData.ts';

interface NameScreenProps {
  selectedSpecies: PetSpecies;
  petName: string;
  setPetName: (name: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onRandomName: () => void;
  onSubmitBirth: () => void;
  isLoading: boolean;
  error: string | null;
}

export const NameScreen: React.FC<NameScreenProps> = ({
  selectedSpecies,
  petName,
  setPetName,
  nameInputRef,
  onRandomName,
  onSubmitBirth,
  isLoading,
  error,
}) => {
  return (
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center text-[10px] font-vt border-b border-[#111C2D]/15 pb-1">
        <span className="text-emerald-800 font-bold">SYS.HATCH // V1.0</span>
        <span className="text-[#BA0029] font-black text-[9px]">CO-OP SYNC: OK</span>
        <span className="text-emerald-800 font-bold">PWR: 100%</span>
      </div>

      <div className="text-center my-0.5">
        <div className="inline-block bg-[#16192E] px-2.5 py-0.5 rounded shadow-sm">
          <h2 className="font-pixel text-[9px] text-[#32FF98] uppercase">
            ✨ РОЖДЕНИЕ: НОВЫЙ ДРУГ ВЫЛУПИЛСЯ!
          </h2>
        </div>
        <p className="text-[10px] font-bold text-[#111C2D]/70 mt-0.5">
          Свидетельство о рождении питомца пары
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center my-auto py-1">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-[#FFD600]/30 filter blur-md animate-pulse" />
          <div className="w-26 h-26 rounded-3xl overflow-hidden border-3 border-[#16192E] bg-white shadow-[0_4px_0_#16192E] flex items-center justify-center p-1 relative z-10">
            <img
              src={PET_SPECIES_DETAILS[selectedSpecies].image}
              onError={(e) => {
                (e.target as HTMLImageElement).src = PET_SPECIES_DETAILS[selectedSpecies].imageFallback;
              }}
              alt={selectedSpecies}
              className="w-full h-full object-contain filter drop-shadow animate-pet-wiggle"
            />
          </div>
          <span className="absolute -top-1 left-2 text-base animate-bounce z-20">✦</span>
          <span className="absolute top-0 right-2 text-base animate-pulse z-20">✨</span>
          <span className="absolute bottom-1 right-1 text-base animate-ping z-20">💖</span>
        </div>
        <div className="mt-1 flex items-center gap-1 bg-[#16192E] text-[#FFD700] px-3 py-0.5 rounded-full font-pixel text-[8px]">
          <span>★</span>
          <span>НОВЫЙ ХРАНИТЕЛЬ АКТИВИРОВАН</span>
          <span>★</span>
        </div>
      </div>

      <div className="bg-white/95 border border-[#111C2D]/30 rounded-xl p-2.5 shadow-sm space-y-1.5">
        <div className="flex items-center justify-between border-b border-[#111C2D]/15 pb-1">
          <span className="font-pixel text-[8px] font-bold text-[#BA0029] flex items-center gap-1">
            📜 СВИДЕТЕЛЬСТВО О РОЖДЕНИИ #001
          </span>
          <span className="font-pixel text-[7px] bg-[#16192E] text-white px-1.5 py-0.5 rounded">
            ПАРА: СОЮЗ
          </span>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex-1 bg-[#EEF8E8] border border-[#111C2D] rounded-lg px-2 py-1 flex items-center justify-between shadow-inner">
            <span className="font-pixel text-[8.5px] text-[#111C2D]/70 mr-1">ИМЯ: [</span>
            <input
              ref={nameInputRef}
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value.slice(0, 20))}
              maxLength={20}
              className="bg-transparent font-pixel text-[10px] text-[#BA0029] tracking-wider uppercase focus:outline-none w-full font-black text-center"
              placeholder="Бусинка"
            />
            <span className="font-pixel text-[8.5px] text-[#111C2D]/70">]</span>
          </div>

          <button
            type="button"
            onClick={onRandomName}
            title="Случайное имя"
            className="bg-[#FFE600] active:translate-y-0.5 text-[#111C2D] border border-[#111C2D] rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-[0_2px_0_#111C2D] cursor-pointer shrink-0 font-pixel text-[8px] font-bold"
          >
            <span>🎲</span>
            <span>РАНДОМ</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-0.5 text-[8.5px] text-[#111C2D]/80 border-t border-[#111C2D]/10">
          <span className="truncate">● Синхронизация: подтвердит имя в приложении</span>
          <span className="font-pixel text-[7px] bg-[#BA0029] text-white px-1 rounded shrink-0">
            {PET_SPECIES_DETAILS[selectedSpecies].badge}
          </span>
        </div>
      </div>

      <div className="mt-1.5">
        <button
          type="button"
          onClick={onSubmitBirth}
          disabled={isLoading || !petName.trim()}
          className="w-full bg-[#16192E] text-[#FFD700] border-2 border-[#16192E] rounded-xl py-2 px-2 shadow-[0_3px_0_#0D111F] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-transform disabled:opacity-50 cursor-pointer"
        >
          <span className="text-sm">✨</span>
          <span className="font-pixel text-[8.5px] uppercase tracking-tight">
            {isLoading ? 'ОФОРМЛЯЕМ...' : 'ВЫДАТЬ ПАСПОРТ & В КОМНАТУ (ЖМИ А)'}
          </span>
          <span className="bg-[#FFD700] text-[#16192E] font-pixel text-[7px] px-1 py-0.5 rounded font-black">
            [+50 XP]
          </span>
        </button>
      </div>

      {error && (
        <div className="text-center font-bold text-xs text-[#BA0029] bg-rose-50 p-1 rounded mt-1">
          {error}
        </div>
      )}
    </div>
  );
};
