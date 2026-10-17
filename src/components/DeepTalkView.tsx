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
    sendPartnerMessage(`Вопрос для нас двоих: «${currentCard.question}»`, false);
    setSentToChat(true);
    triggerHaptic('success');
    triggerConfetti();
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
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-2xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
                }`}
              >
                <span className="text-[11px] opacity-80">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View mode toggle: Card vs List */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-[var(--text-2)]">
            {filteredCards.length} {filteredCards.length === 1 ? 'вопрос' : 'вопросов'} в категории
          </span>
          <div className="flex items-center gap-1 bg-[var(--surface-2)] p-0.5 rounded-lg border border-[var(--divider)]">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'card'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-2xs'
                  : 'text-[var(--text-2)]'
              }`}
              title="Режим карточки"
            >
              <CreditCard className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-2xs'
                  : 'text-[var(--text-2)]'
              }`}
              title="Список всех вопросов"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card View */}
        {viewMode === 'card' && currentCard && (
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-[var(--divider)] shadow-xs overflow-hidden"
              >
                {/* Background soft glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15">
                    <Heart className="w-3 h-3 fill-[var(--accent)]" />
                    <span>{currentCard.categoryLabel}</span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-3)]">
                    {((currentIndex % filteredCards.length) + 1)} / {filteredCards.length}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-relaxed tracking-tight my-4">
                  «{currentCard.question}»
                </h3>

                {currentCard.tip && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-[var(--surface-3)]/60 border border-[var(--divider)]/60 flex items-start gap-2.5 text-xs text-[var(--text-2)] leading-relaxed">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="font-normal">{currentCard.tip}</p>
                  </div>
                )}

                {/* Quick actions */}
                <div className="mt-6 pt-4 border-t border-[var(--divider)] flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-semibold text-[var(--text)] transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-2)]" />}
                    <span>{copied ? 'Скопировано' : 'Скопировать'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToChat}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    {sentToChat ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{sentToChat ? 'Отправлено в чат' : 'Отправить в чат'}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3 px-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--divider)] text-xs sm:text-sm font-semibold text-[var(--text)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                type="button"
                onClick={handleRandom}
                className="p-3 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--divider)] text-[var(--accent)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Случайный вопрос"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--divider)] text-xs sm:text-sm font-semibold text-[var(--text)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>Следующий</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2.5">
            {filteredCards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setCurrentIndex(idx);
                  setViewMode('card');
                }}
                className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--divider)] cursor-pointer transition-all active:scale-[0.99] shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--accent)]">
                    {card.categoryLabel}
                  </span>
                  <span className="text-[11px] text-[var(--text-3)]">#{idx + 1}</span>
                </div>
                <p className="text-sm font-semibold text-[var(--text)] line-clamp-2">
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
