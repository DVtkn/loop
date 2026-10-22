import React, { useState } from 'react';
import { Gamepad2, Flame, MessageCircle, Sparkles, ChevronRight, Dices } from 'lucide-react';
import { PageLayout } from '../ui/PageLayout.tsx';
import { StatTile } from '../ui/SystemBlocks.tsx';
import { triggerHaptic } from '../../utils/haptics.ts';
import { TRUTHS, DARES } from '../../data/truthDare.ts';
import { DEEP_TALKS, SPICY_18, THIS_OR_THAT } from '../../data/gamesData.ts';
import { HouseholdRoulette } from './HouseholdRoulette.tsx';

interface GamesViewProps {
  currentPartnerName: string;
  partnerName: string;
  onBack: () => void;
  onAddCoupleXP: (xp: number, desc: string, type?: any) => void;
  onTriggerConfetti: () => void;
  initialGame?: 'truth_dare' | 'deep_talks' | 'spicy' | 'this_or_that' | 'household_roulette' | null;
}

export const GamesView: React.FC<GamesViewProps> = ({
  currentPartnerName,
  partnerName,
  onBack,
  onAddCoupleXP,
  onTriggerConfetti,
  initialGame = null,
}) => {
  const [activeGame, setActiveGame] = useState<'truth_dare' | 'deep_talks' | 'spicy' | 'this_or_that' | 'household_roulette' | null>(initialGame);
  const [tdCurrentPlayer, setTdCurrentPlayer] = useState<string>(currentPartnerName);
  const [tdAction, setTdAction] = useState<'truth' | 'dare' | null>(null);
  const [tdCardText, setTdCardText] = useState<string>('');
  const [simpleGameText, setSimpleGameText] = useState<string>('');

  const handleDrawSimpleCard = (gameMode: 'deep_talks' | 'spicy' | 'this_or_that') => {
    triggerHaptic('light');
    let arr: string[] = [];
    if (gameMode === 'deep_talks') arr = DEEP_TALKS;
    else if (gameMode === 'spicy') arr = SPICY_18;
    else if (gameMode === 'this_or_that') arr = THIS_OR_THAT;
    setSimpleGameText(arr[Math.floor(Math.random() * arr.length)]);
  };

  const handleDrawCard = (type: 'truth' | 'dare') => {
    triggerHaptic('light');
    setTdAction(type);
    const arr = type === 'truth' ? TRUTHS : DARES;
    setTdCardText(arr[Math.floor(Math.random() * arr.length)]);
  };

  const handleNextPlayer = () => {
    triggerHaptic('selection');
    setTdAction(null);
    setTdCurrentPlayer(tdCurrentPlayer === currentPartnerName ? partnerName : currentPartnerName);
  };

  return (
    <PageLayout
      title={
        activeGame === 'household_roulette'
          ? 'Рулетка честного быта'
          : activeGame
          ? 'Игра для двоих'
          : 'Игры для свиданий'
      }
      subtitle={
        activeGame === 'household_roulette'
          ? 'Честный жребий домашних дел и заботы'
          : activeGame
          ? 'Интерактивный раунд сближения'
          : 'Правда или Действие, глубокие темы и 18+'
      }
      onBack={() => {
        if (activeGame) {
          setActiveGame(null);
        } else {
          onBack();
        }
      }}
    >
      <div className="space-y-4 pb-8 animate-fadeIn">
        {activeGame === 'household_roulette' ? (
          <HouseholdRoulette
            currentPartnerName={currentPartnerName}
            partnerName={partnerName}
            onBack={() => setActiveGame(null)}
            onAddCoupleXP={onAddCoupleXP}
            onTriggerConfetti={onTriggerConfetti}
          />
        ) : !activeGame ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={<Gamepad2 className="w-5 h-5" />}
                value="5"
                label="Форматов игр"
                color="gamification"
              />
              <StatTile
                icon={<Sparkles className="w-5 h-5" />}
                value="120+"
                label="Интересных тем"
                color="mood"
              />
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveGame('truth_dare');
                  setTdCurrentPlayer(currentPartnerName || 'Я');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xs hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] group-hover:text-emerald-600 transition-colors">
                      Правда или Действие
                    </h4>
                    <p className="text-xs text-[var(--text-2)] mt-0.5">
                      Классическая игра с честными откровениями и милыми заданиями
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-2)] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              <div
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveGame('spicy');
                  handleDrawSimpleCard('spicy');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xs hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] group-hover:text-rose-500 transition-colors">
                      Пикантные вопросы 18+
                    </h4>
                    <p className="text-xs text-[var(--text-2)] mt-0.5">
                      Откровенные вопросы для страсти, фантазий и телесной близости
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-2)] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              <div
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveGame('deep_talks');
                  handleDrawSimpleCard('deep_talks');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xs hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] group-hover:text-indigo-500 transition-colors">
                      Глубокие беседы
                    </h4>
                    <p className="text-xs text-[var(--text-2)] mt-0.5">
                      Вопросы о ценностях, мечтах, детстве и совместном будущем
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-2)] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              <div
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveGame('this_or_that');
                  handleDrawSimpleCard('this_or_that');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xs hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)] group-hover:text-amber-500 transition-colors">
                      Или / Или (Выборы)
                    </h4>
                    <p className="text-xs text-[var(--text-2)] mt-0.5">
                      Быстрые весёлые дилеммы: проверьте, совпадут ли ваши вкусы
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-2)] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>

              <div
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveGame('household_roulette');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--divider)] shadow-2xs hover:border-indigo-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Dices className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text)] group-hover:text-indigo-500 transition-colors">
                        Рулетка честного быта
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        Новинка
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-2)] mt-0.5">
                      Кто моет посуду, выбирает кино или готовит кофе — честный жребий
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-2)] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          </div>
        ) : activeGame === 'truth_dare' ? (
          <div className="bg-[var(--surface)] p-5 sm:p-6 rounded-3xl border border-[var(--divider)] shadow-xs relative min-h-[420px] flex flex-col justify-between">
            <div className="text-center pt-2">
              <span className="px-3 py-1 bg-[var(--surface-2)] text-[var(--text-2)] rounded-full text-xs font-bold">
                Правда или Действие
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-3">
                Ход игрока: <span className="text-[var(--accent)]">{tdCurrentPlayer}</span>
              </h3>
            </div>

            {!tdAction ? (
              <div className="grid grid-cols-2 gap-4 my-auto py-6">
                <button
                  type="button"
                  onClick={() => handleDrawCard('truth')}
                  className="aspect-square rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                >
                  <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-base sm:text-lg">Правда</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDrawCard('dare')}
                  className="aspect-square rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-2xs group"
                >
                  <Flame className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-base sm:text-lg">Действие</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-auto py-4 animate-fadeIn">
                <div
                  className={`p-6 sm:p-7 rounded-3xl border-2 w-full max-w-sm text-center shadow-md ${
                    tdAction === 'truth'
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : 'bg-rose-500 border-rose-400 text-white'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
                    {tdAction === 'truth' ? (
                      <MessageCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Flame className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <p className="text-base sm:text-lg font-bold leading-relaxed">{tdCardText}</p>
                </div>

                <div className="flex items-center gap-2.5 mt-6 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => {
                      onAddCoupleXP(
                        tdAction === 'truth' ? 15 : 25,
                        `${tdCurrentPlayer} выполнил(а) задание (${tdAction === 'truth' ? 'Правда' : 'Действие'})`,
                        'bonus'
                      );
                      onTriggerConfetti();
                      handleNextPlayer();
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    Справился (+{tdAction === 'truth' ? '15' : '25'} XP)
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPlayer}
                    className="py-3 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] font-semibold text-[var(--text)] hover:bg-[var(--surface-3)] text-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Пропустить
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveGame(null)}
                className="text-xs text-[var(--text-2)] hover:text-[var(--text)] font-semibold cursor-pointer"
              >
                ← Выбрать другую игру
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--surface)] p-5 sm:p-6 rounded-3xl border border-[var(--divider)] shadow-xs relative min-h-[420px] flex flex-col justify-between">
            <div className="text-center pt-2">
              <span className="px-3 py-1 bg-[var(--surface-2)] text-[var(--text-2)] rounded-full text-xs font-bold">
                {activeGame === 'deep_talks'
                  ? 'Глубокие беседы'
                  : activeGame === 'spicy'
                  ? 'Пикантные вопросы 18+'
                  : 'Или / Или'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto py-4 animate-fadeIn">
              <div
                className={`p-6 sm:p-8 rounded-3xl border w-full max-w-sm text-center shadow-md ${
                  activeGame === 'deep_talks'
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : activeGame === 'spicy'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                    activeGame === 'deep_talks'
                      ? 'bg-indigo-500 text-white'
                      : activeGame === 'spicy'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {activeGame === 'deep_talks' ? (
                    <MessageCircle className="w-6 h-6" />
                  ) : activeGame === 'spicy' ? (
                    <Flame className="w-6 h-6" />
                  ) : (
                    <Sparkles className="w-6 h-6" />
                  )}
                </div>

                <p className="text-base sm:text-lg font-bold text-[var(--text)] leading-relaxed min-h-[80px] flex items-center justify-center">
                  {simpleGameText}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-6 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    onAddCoupleXP(5, 'Ответили на вопрос в игре', 'bonus');
                    triggerHaptic('light');
                    if (activeGame !== null) {
                      handleDrawSimpleCard(activeGame as 'deep_talks' | 'spicy' | 'this_or_that');
                    }
                  }}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-all ${
                    activeGame === 'deep_talks'
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : activeGame === 'spicy'
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  Следующий вопрос (+5 XP)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGame(null)}
                  className="w-full py-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Закончить раунд
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
