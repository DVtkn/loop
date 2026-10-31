import React, { useState } from 'react';
import {
  Coffee,
  Heart,
  Flower2,
  Gift,
  Smile,
  CheckCircle2,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Sparkles,
  Edit3,
  Utensils,
  HandHeart,
  HelpCircle,
  ShoppingBag,
  Home as HomeIcon,
  Smartphone,
  Shirt,
  Ticket,
  X,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { SmallCraving, WishlistItem } from '../types';
import { PageLayout } from './ui/PageLayout';
import { triggerHaptic } from '../utils/haptics';
import { ColoredAvatar } from './ColoredIcon';

export const CareBaseView: React.FC = () => {
  const {
    currentPartnerId,
    coupleProfile,
    smallCravings,
    addCraving,
    toggleCraving,
    flowerPreferences,
    wishlist,
    addWishlistItem,
    deleteWishlistItem,
    setActiveTab,
    triggerConfetti,
  } = useCouple();

  // Modals state
  const [showAddCravingModal, setShowAddCravingModal] = useState<boolean>(false);
  const [showFlowersModal, setShowFlowersModal] = useState<boolean>(false);
  const [showWishlistModal, setShowWishlistModal] = useState<boolean>(false);

  // New Craving State
  const [newCravingTitle, setNewCravingTitle] = useState<string>('');
  const [newCravingCategory, setNewCravingCategory] = useState<SmallCraving['category']>('treat');

  // New Wishlist State
  const [wishlistTitle, setWishlistTitle] = useState<string>('');
  const [wishlistPrice, setWishlistPrice] = useState<string>('');
  const [wishlistCategory, setWishlistCategory] = useState<WishlistItem['category']>('gift');
  const [wishlistNote, setWishlistNote] = useState<string>('');

  const currentPartner = currentPartnerId === 'partner1' ? coupleProfile.partner1 : coupleProfile.partner2;
  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;
  const otherPartnerId = currentPartnerId === 'partner1' ? 'partner2' : 'partner1';

  const partnerFlowerPrefs = flowerPreferences[otherPartnerId] || {
    favoriteFlowers: ['Пионы', 'Ромашки'],
    dislikedFlowers: ['Гвоздики'],
    colorPreferences: ['Пастельные тона'],
    careNotes: 'Менять воду раз в 2 дня',
    idealBouquetDescription: 'Воздушный букет в крафтовой бумаге',
  };

  const CRAVING_PRESETS = [
    { title: 'Любимый кофе утром', category: 'drink' as const, icon: '☕' },
    { title: 'Шоколадный десерт', category: 'treat' as const, icon: '🍫' },
    { title: 'Массаж плеч 15 мин', category: 'touch' as const, icon: '💆' },
    { title: '15 минут тишины', category: 'help' as const, icon: '🧘' },
    { title: 'Вечерний сериал вдвоём', category: 'touch' as const, icon: '🎬' },
  ];

  const handleCreateCraving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCravingTitle.trim()) return;
    addCraving(newCravingTitle.trim(), newCravingCategory);
    setNewCravingTitle('');
    setShowAddCravingModal(false);
    triggerHaptic('success');
    triggerConfetti();
  };

  const handleCreateWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistTitle.trim()) return;
    addWishlistItem({
      title: wishlistTitle.trim(),
      priceEstimate: wishlistPrice.trim() || undefined,
      category: wishlistCategory,
      note: wishlistNote.trim() || undefined,
    });
    setWishlistTitle('');
    setWishlistPrice('');
    setWishlistNote('');
    triggerHaptic('success');
  };

  const getCravingIcon = (cat: SmallCraving['category']) => {
    switch (cat) {
      case 'treat':
        return <Utensils className="w-4 h-4" />;
      case 'drink':
        return <Coffee className="w-4 h-4" />;
      case 'touch':
        return <Heart className="w-4 h-4" />;
      case 'help':
        return <HandHeart className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <PageLayout title="Книга заботы" subtitle={`Всё о вкусах и маленьких радостях ${otherPartner.name || 'партнёра'}`} onBack={() => setActiveTab('us')}>
      <div className="space-y-5 pt-1 pb-10">
        
        {/* Hero Card: Care Profile of Partner */}
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/40 to-amber-500/10 border border-[var(--card-border)] shadow-[var(--card-shadow)] relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-rose-500/15 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/12 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-500/20 shadow-2xs">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span>Забота без повода</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                Радости для {otherPartner.name || 'Любимого человека'}
              </h2>
              <p className="text-xs text-[var(--text-2)] font-medium leading-relaxed">
                Шпаргалка, которая помогает делать точные сюрпризы и поднимать настроение в один клик.
              </p>
            </div>

            <div className="w-14 h-14 rounded-full ring-3 ring-[var(--surface-solid)] overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shrink-0 shadow-xs">
              <ColoredAvatar avatar={otherPartner.avatar || 'heart'} name={otherPartner.name} size="md" />
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--divider)] flex items-center gap-4 text-xs font-bold text-[var(--text-2)] flex-wrap relative z-10">
            <span className="text-[var(--text)] font-black">
              {smallCravings.length} {smallCravings.length === 1 ? 'хотелка' : 'хотелок'}
            </span>
            <span>•</span>
            <span className="text-[var(--text)] font-black">
              {wishlist.length} {wishlist.length === 1 ? 'подарок' : 'подарков'} в вишлисте
            </span>
          </div>
        </div>

        {/* 2 Primary Interactive Tiles: Flowers & Wishlist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Card 1: Favorite Flowers */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setShowFlowersModal(true);
            }}
            className="p-5 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/50 transition-all cursor-pointer text-left group shadow-[var(--card-shadow)] relative overflow-hidden space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Flower2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] leading-tight">
                    Любимые цветы
                  </h3>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">
                    Сорта, оттенки и предпочтения
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5 shrink-0" />
            </div>

            <div className="pt-2 border-t border-[var(--divider)] flex items-center gap-1.5 flex-wrap">
              {partnerFlowerPrefs.favoriteFlowers && partnerFlowerPrefs.favoriteFlowers.length > 0 ? (
                partnerFlowerPrefs.favoriteFlowers.map((f, i) => (
                  <span key={i} className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    🌸 {f}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--text-3)] font-medium">Нажмите, чтобы настроить</span>
              )}
            </div>
          </button>

          {/* Card 2: Wishlist of Gifts */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setShowWishlistModal(true);
            }}
            className="p-5 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] hover:border-[var(--accent)]/50 transition-all cursor-pointer text-left group shadow-[var(--card-shadow)] relative overflow-hidden space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] leading-tight">
                    Виш-лист подарков
                  </h3>
                  <p className="text-xs text-[var(--text-2)] mt-0.5">
                    Мечты, вещи и впечатления
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5 shrink-0" />
            </div>

            <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-[11px]">
                {wishlist.length} {wishlist.length === 1 ? 'желание' : 'желаний'}
              </span>
              <span className="text-[11px] font-bold text-[var(--text-3)]">
                Открыть список →
              </span>
            </div>
          </button>

        </div>

        {/* Section: Small Cravings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Маленькие хотелки и радости
              </h3>
              <p className="text-xs text-[var(--text-2)]">
                Простые вещи, которыми можно порадовать друг друга прямо сегодня
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowAddCravingModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-pink-500 text-white text-xs font-black shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>

          {smallCravings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {smallCravings.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    toggleCraving(c.id);
                    triggerHaptic('success');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs active:scale-98 ${
                    c.fulfilled
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-[var(--surface-solid)] border-[var(--card-border)] hover:border-[var(--accent)]/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                        c.fulfilled
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {c.fulfilled ? <CheckCircle2 className="w-5 h-5" /> : getCravingIcon(c.category)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${c.fulfilled ? 'line-through text-[var(--text-2)]' : 'text-[var(--text)]'}`}>
                        {c.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-3)] font-medium">
                        {c.fulfilled ? 'Исполнено ❤️' : 'Нажмите, чтобы отметить исполненным'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    c.fulfilled
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--divider)]'
                  }`}>
                    {c.fulfilled ? '✓ Готово' : 'Хочу ✨'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[var(--surface-solid)] border border-[var(--card-border)] text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Coffee className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)]">Хотелок пока нет</h4>
              <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto">
                Добавьте свои любимые мелочи (любимый кофе, круассан, массаж), чтобы партнёр знал, как поднять вам настроение!
              </p>
              <button
                type="button"
                onClick={() => setShowAddCravingModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-bold text-[var(--accent)] border border-[var(--divider)] transition-colors cursor-pointer"
              >
                Добавить первую хотелку
              </button>
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: Add Craving */}
      {showAddCravingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-solid)] rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-[var(--card-border)] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-[var(--text)]">
                  Добавить свою хотелку
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCravingModal(false)}
                className="p-1 text-[var(--text-2)] hover:text-[var(--text)] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--text-3)]">Быстрые идеи в 1 клик:</p>
              <div className="flex flex-wrap gap-1.5">
                {CRAVING_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setNewCravingTitle(p.title);
                      setNewCravingCategory(p.category);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[11px] font-semibold text-[var(--text)] border border-[var(--divider)] cursor-pointer"
                  >
                    {p.icon} {p.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateCraving} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-[var(--text-2)] mb-1">
                  Что вас порадует?
                </label>
                <input
                  type="text"
                  required
                  value={newCravingTitle}
                  onChange={(e) => setNewCravingTitle(e.target.value)}
                  placeholder="Шоколадный эклер, капучино, массаж..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-2)] mb-1">
                  Категория
                </label>
                <select
                  value={newCravingCategory}
                  onChange={(e) => setNewCravingCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] focus:outline-none"
                >
                  <option value="treat">Вкусняшка / Еда</option>
                  <option value="drink">Кофе / Напиток</option>
                  <option value="touch">Массаж / Тактильность</option>
                  <option value="help">Помощь и забота</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCravingModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-[var(--text-2)] bg-[var(--surface-2)] rounded-xl hover:text-[var(--text)] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[var(--accent)] to-pink-500 hover:opacity-95 rounded-xl shadow-xs cursor-pointer"
                >
                  Добавить (+20 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Flowers Details */}
      {showFlowersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-solid)] rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-[var(--card-border)] space-y-4 animate-fadeIn max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flower2 className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-[var(--text)]">
                  Цветы для {otherPartner.name || 'партнёра'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFlowersModal(false)}
                className="p-1 text-[var(--text-2)] hover:text-[var(--text)] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)]">
                <p className="font-bold text-[var(--text-2)]">Любимые цветы:</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-1">
                  {partnerFlowerPrefs.favoriteFlowers?.join(', ') || 'Не указаны'}
                </p>
              </div>

              <div className="p-3.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)]">
                <p className="font-bold text-[var(--text-2)]">Не любит:</p>
                <p className="text-sm font-semibold text-[var(--text-2)] mt-1">
                  {partnerFlowerPrefs.dislikedFlowers?.join(', ') || 'Нет нелюбимых'}
                </p>
              </div>

              <div className="p-3.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)]">
                <p className="font-bold text-[var(--text-2)]">Цветовая гамма букета:</p>
                <p className="text-sm font-medium text-[var(--text)] mt-1">
                  {partnerFlowerPrefs.colorPreferences?.join(', ') || 'Нежные пастельные тона'}
                </p>
              </div>

              <div className="p-3.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)]">
                <p className="font-bold text-[var(--text-2)]">Заметка флористу:</p>
                <p className="text-sm font-medium text-[var(--text)] mt-1">
                  {partnerFlowerPrefs.careNotes || 'Воздушный крафтовый букет, менять воду раз в 2 дня'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFlowersModal(false)}
              className="w-full py-2.5 text-xs font-bold text-white bg-[var(--accent)] rounded-xl shadow-xs cursor-pointer"
            >
              Отлично, запомнил(а)
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Wishlist */}
      {showWishlistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface-solid)] rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-[var(--card-border)] space-y-4 animate-fadeIn max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-[var(--text)]">
                  Виш-лист подарков
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWishlistModal(false)}
                className="p-1 text-[var(--text-2)] hover:text-[var(--text)] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of gifts */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {wishlist.length > 0 ? (
                wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[var(--text)]">{item.title}</p>
                      {item.priceEstimate && (
                        <p className="text-[11px] text-[var(--accent)] font-semibold">{item.priceEstimate}</p>
                      )}
                      {item.note && (
                        <p className="text-[11px] text-[var(--text-2)] italic">{item.note}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteWishlistItem(item.id)}
                      className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-2)] text-center py-4 italic">
                  Виш-лист пока пуст. Добавьте первый подарок ниже!
                </p>
              )}
            </div>

            {/* Add gift mini form */}
            <form onSubmit={handleCreateWishlistItem} className="space-y-2.5 pt-2 border-t border-[var(--divider)]">
              <p className="text-xs font-bold text-[var(--text)]">Добавить подарок в вишлист</p>
              <input
                type="text"
                required
                value={wishlistTitle}
                onChange={(e) => setWishlistTitle(e.target.value)}
                placeholder="Книга, спа, духи, билеты..."
                className="w-full px-3 py-2 text-xs bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={wishlistPrice}
                  onChange={(e) => setWishlistPrice(e.target.value)}
                  placeholder="Ориентир цены (3 000 ₽)"
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] focus:outline-none"
                />
                <select
                  value={wishlistCategory}
                  onChange={(e) => setWishlistCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] focus:outline-none"
                >
                  <option value="gift">Подарок</option>
                  <option value="experience">Впечатление</option>
                  <option value="home">Для дома</option>
                  <option value="clothing">Одежда</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[var(--accent)] to-pink-500 hover:opacity-95 rounded-xl shadow-xs cursor-pointer"
              >
                Сохранить в виш-лист
              </button>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
