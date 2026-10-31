import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Heart,
  Lightbulb,
  MessageCircle,
  LayoutGrid,
  CreditCard,
  Send,
  Quote,
} from 'lucide-react';
import { DEEP_TALK_CARDS } from '../data/gamificationData';
import { DeepTalkCard } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { useCouple } from '../context/CoupleContext';
import { PageLayout } from './ui/PageLayout';

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'all', label: 'Все темы', icon: '✦' },
  { key: 'intimacy', label: 'Близость', icon: '♡' },
  { key: 'future', label: 'Будущее', icon: '★' },
  { key: 'memories', label: 'Воспоминания', icon: '✧' },
  { key: 'dreams', label: 'Мечты', icon: '♥' },
  { key: 'fun', label: 'Юмор', icon: '☺' },
];

export const DeepTalkView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { triggerConfetti, setActiveTab, sendPartnerMessage } = useCouple();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [sentToChat, setSentToChat] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return DEEP_TALK_CARDS;
    return DEEP_TALK_CARDS.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const currentCard: DeepTalkCard = filteredCards[currentIndex % (filteredCards.length || 1)] || DEEP_TALK_CARDS[0];

  const handleNext = () => {
    triggerHaptic('selection');
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    triggerHaptic('selection');
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleRandom = () => {
    triggerHaptic('selection');
    if (filteredCards.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filteredCards.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % filteredCards.length;
    }
    setCurrentIndex(nextIdx);
  };

  const handleCopy = () => {
    if (!currentCard) return;
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(currentCard.question);
      }
    } catch {}
    setCopied(true);
    triggerHaptic('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToChat = () => {
    if (!currentCard) return;
    sendPartnerMessage?.(`Вопрос для нас двоих: «${currentCard.question}»`, false);
    setSentToChat(true);
    triggerHaptic('success');
    triggerConfetti?.();
    setTimeout(() => setSentToChat(false), 2500);
  };

  return (
    <PageLayout
      title="Deep Talk"
      subtitle="Библиотека глубоких вопросов для сближения"
      onBack={onBack || (() => setActiveTab('us'))}
    >
      <div className="space-y-4 pt-1 pb-8">
        
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedCategory(cat.key);
                  setCurrentIndex(0);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--accent)] to-pink-500 text-white shadow-xs scale-102'
                    : 'bg-[var(--surface-solid)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--divider)]'
                }`}
              >
                <span className="text-[11px] opacity-90">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View mode toggle: Card vs List */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[var(--text-2)]">
            {filteredCards.length} {filteredCards.length === 1 ? 'вопрос' : 'вопросов'} в колоде
          </span>
          <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--divider)]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('card');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs'
                  : 'text-[var(--text-2)]'
              }`}
              title="Режим карточки"
            >
              <CreditCard className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('list');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs'
                  : 'text-[var(--text-2)]'
              }`}
              title="Список всех вопросов"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card View */}
        {viewMode === 'card' && currentCard && (
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/25 to-amber-500/8 border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden space-y-4"
              >
                {/* Background soft glow and giant quote watermark */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--accent)]/15 via-pink-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <Quote className="absolute -bottom-4 -right-4 w-32 h-32 text-[var(--text-3)]/8 pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-2xs">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>{currentCard.categoryLabel}</span>
                  </span>
                  <span className="text-xs font-bold text-[var(--text-3)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--divider)]">
                    {((currentIndex % filteredCards.length) + 1)} из {filteredCards.length}
                  </span>
                </div>

                <div className="relative z-10 py-3">
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] leading-snug tracking-tight">
                    «{currentCard.question}»
                  </h3>
                </div>

                {currentCard.tip && (
                  <div className="relative z-10 p-4 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--divider)] flex items-start gap-3 text-xs text-[var(--text-2)] leading-relaxed shadow-2xs">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="font-medium text-[var(--text-2)]">
                      <strong className="text-[var(--text)] font-bold block mb-0.5">Совет для диалога:</strong>
                      {currentCard.tip}
                    </p>
                  </div>
                )}

                {/* Quick actions */}
                <div className="relative z-10 pt-4 border-t border-[var(--divider)] flex items-center justify-between gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-bold text-[var(--text)] transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-2)]" />}
                    <span>{copied ? 'Скопировано' : 'Скопировать'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToChat}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-pink-500 text-white text-xs font-black transition-all active:scale-95 shadow-xs cursor-pointer hover:opacity-95"
                  >
                    {sentToChat ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{sentToChat ? 'Отправлено в чат' : 'Спросить в чате'}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3 px-4 rounded-2xl bg-[var(--surface-solid)] hover:bg-[var(--surface-2)] border border-[var(--card-border)] text-xs sm:text-sm font-bold text-[var(--text)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                type="button"
                onClick={handleRandom}
                className="p-3.5 rounded-2xl bg-[var(--surface-solid)] hover:bg-[var(--surface-2)] border border-[var(--card-border)] text-[var(--accent)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Случайная карта из колоды"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-4 rounded-2xl bg-[var(--surface-solid)] hover:bg-[var(--surface-2)] border border-[var(--card-border)] text-xs sm:text-sm font-bold text-[var(--text)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>Следующая</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredCards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setCurrentIndex(idx);
                  setViewMode('card');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-solid)] hover:bg-[var(--surface-2)] border border-[var(--card-border)] hover:border-[var(--accent)]/40 cursor-pointer transition-all active:scale-[0.99] shadow-2xs space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[var(--accent)]">
                    {card.categoryLabel}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-3)]">#{idx + 1}</span>
                </div>
                <p className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                  «{card.question}»
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </PageLayout>
  );
};
