import React, { useState, useMemo } from 'react';
import { PageLayout } from './ui/PageLayout.tsx';
import {
  MapPin,
  Sparkles,
  Send,
  Award,
  Wine,
  Coffee,
  TreePine,
  Film,
  Sun,
  Gamepad2,
  Compass,
  Dices,
  Heart,
  Calendar,
  Clock,
  ChevronRight,
  Shuffle,
  ChevronDown,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext.tsx';
import { Venue } from '../types.ts';
import { IconColorTheme } from './ColoredIcon.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { DateWheel, DateIdea, DATE_IDEAS, DateVibe } from './DateWheel.tsx';
import { PlacesView } from './dates/PlacesView.tsx';
import { GamesView } from './dates/GamesView.tsx';
import { DatesHistorySection } from './dates/DatesHistorySection.tsx';
import { InviteBuilderModal } from './dates/InviteBuilderModal.tsx';
import { AddVenueModal } from './dates/AddVenueModal.tsx';

type DatesSubTab = 'ideas' | 'invites' | 'places' | 'games';

const VIBE_FILTERS: { id: DateVibe; label: string; icon: string }[] = [
  { id: 'all', label: 'Все идеи', icon: '✨' },
  { id: 'dinner', label: 'Ужин', icon: '🍷' },
  { id: 'romantic', label: 'Романтика', icon: '🕯' },
  { id: 'home', label: 'Дома', icon: '🛋' },
  { id: 'city', label: 'В городе', icon: '🏙' },
  { id: 'relax', label: 'СПА & Релакс', icon: '🫧' },
  { id: 'fun', label: 'Впечатления', icon: '🎨' },
];

const DATE_COLLECTIONS = [
  {
    id: 'gastro',
    title: 'Гастро-романтика',
    subtitle: 'Уютный столик при свечах, дегустации и неспешный ужин',
    emoji: '🍷',
    bgGradient: 'from-rose-500/15 via-rose-500/5 to-transparent',
    border: 'border-rose-500/25',
    presetText: 'Приглашаю тебя на романтический ужин при свечах в красивом ресторане',
  },
  {
    id: 'city_lights',
    title: 'Огни ночного города',
    subtitle: 'Крыша на закате, тихие улочки и прогулка под фонарями',
    emoji: '🏙',
    bgGradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'border-amber-500/25',
    presetText: 'Хочу встретить с тобой закат на панорамной крыше или погулять по ночному городу',
  },
  {
    id: 'cozy_home',
    title: 'Домашний уют',
    subtitle: 'Кино под теплым пледом, кулинарный батл или вечер СПА',
    emoji: '🛋',
    bgGradient: 'from-purple-500/15 via-purple-500/5 to-transparent',
    border: 'border-purple-500/25',
    presetText: 'Предлагаю устроить уютный вечер дома: приготовим что-то вкусное и посмотрим кино под пледом',
  },
  {
    id: 'new_experience',
    title: 'Новый опыт',
    subtitle: 'Гончарный круг, мастер-класс или спонтанный квест для двоих',
    emoji: '🎨',
    bgGradient: 'from-teal-500/15 via-teal-500/5 to-transparent',
    border: 'border-teal-500/25',
    presetText: 'Давай сходим на необычный творческий мастер-класс и создадим что-то вместе!',
  },
];

export const DatesView: React.FC = () => {
  const {
    currentPartnerId,
    coupleProfile,
    venues,
    addVenue,
    deleteVenue,
    dateInvites,
    createDateInvite,
    acceptDateInvite,
    completeAndReviewDate,
    datesSubTab,
    setDatesSubTab,
    addFeedItem,
    coupleXP,
    addCoupleXP,
    triggerConfetti,
  } = useCouple();

  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;

  // Active Sub-tab navigation
  const [subTab, setSubTab] = useState<DatesSubTab>(() => {
    if (datesSubTab === 'places') return 'places';
    if (datesSubTab === 'games') return 'games';
    return 'ideas';
  });

  const [selectedGame, setSelectedGame] = useState<'truth_dare' | 'deep_talks' | 'spicy' | 'this_or_that' | 'household_roulette' | null>(null);

  // Vibe & Spark Generator State
  const [selectedVibe, setSelectedVibe] = useState<DateVibe>('all');
  const [currentSparkIdea, setCurrentSparkIdea] = useState<DateIdea>(() => DATE_IDEAS[0]);
  const [isWheelExpanded, setIsWheelExpanded] = useState<boolean>(false);

  // Filtered ideas by active vibe
  const availableVibeIdeas = useMemo(() => {
    if (selectedVibe === 'all') return DATE_IDEAS;
    return DATE_IDEAS.filter((i) => i.vibe === selectedVibe);
  }, [selectedVibe]);

  // Handle Spark Shuffle
  const handleShuffleSpark = () => {
    triggerHaptic('light');
    const pool = availableVibeIdeas.length > 0 ? availableVibeIdeas : DATE_IDEAS;
    const filteredPool = pool.filter((i) => i.id !== currentSparkIdea.id);
    const candidateList = filteredPool.length > 0 ? filteredPool : pool;
    const randomPick = candidateList[Math.floor(Math.random() * candidateList.length)];
    setCurrentSparkIdea(randomPick);
  };

  // Switch vibe filter
  const handleSelectVibe = (vibe: DateVibe) => {
    triggerHaptic('selection');
    setSelectedVibe(vibe);
    const newPool = vibe === 'all' ? DATE_IDEAS : DATE_IDEAS.filter((i) => i.vibe === vibe);
    if (newPool.length > 0) {
      setCurrentSparkIdea(newPool[0]);
    }
  };

  // --- Invite Form State (Modal) ---
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteNote, setInviteNote] = useState<string>('Приглашаю тебя провести этот особенный вечер вдвоём');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [customLocationName, setCustomLocationName] = useState<string>('');
  const [inviteDate, setInviteDate] = useState<string>('');
  const [inviteTime, setInviteTime] = useState<string>('');
  const [inviteSentSuccess, setInviteSentSuccess] = useState<boolean>(false);

  // --- Add Venue Modal State ---
  const [showAddVenueModal, setShowAddVenueModal] = useState<boolean>(false);

  // --- For Accepting Invites ---
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // --- For Reviewing Dates ---
  const [reviewingInviteId, setReviewingInviteId] = useState<string | null>(null);

  // Pending Invites Count
  const pendingInvitesCount = dateInvites.filter(
    (inv) => inv.status === 'PENDING' && inv.senderId !== currentPartnerId
  ).length;

  // Active or Upcoming confirmed date
  const activeInvite = useMemo(() => {
    return (
      dateInvites.find((inv) => inv.status === 'CONFIRMED' && !inv.completed) ||
      dateInvites.find((inv) => inv.status === 'PROPOSED') ||
      dateInvites.find((inv) => inv.status === 'PENDING')
    );
  }, [dateInvites]);

  // Category presets for venues
  const categories: {
    id: Venue['category'];
    label: string;
    icon: any;
    color: IconColorTheme;
  }[] = [
    { id: 'restaurant', label: 'Ресторан', icon: Wine, color: 'rose' },
    { id: 'cafe', label: 'Кофейня', icon: Coffee, color: 'amber' },
    { id: 'park', label: 'Парк / Прогулка', icon: TreePine, color: 'emerald' },
    { id: 'cinema', label: 'Кино / Театр', icon: Film, color: 'indigo' },
    { id: 'outdoor', label: 'Крыша / Панорама', icon: Sun, color: 'gold' },
    { id: 'spa', label: 'СПА / Релакс', icon: Sparkles, color: 'teal' },
    { id: 'other', label: 'Особенное', icon: Compass, color: 'purple' },
  ];

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const venueObj = venues.find((v) => v.id === selectedVenueId);
    const locName = venueObj ? venueObj.name : customLocationName || 'Наше особенное свидание';

    createDateInvite(
      inviteNote,
      selectedVenueId || undefined,
      locName,
      inviteDate || undefined,
      inviteTime || undefined
    );

    addFeedItem({
      author: currentPartnerId,
      type: 'heart',
      title: `Пригласил(а) на свидание в «${locName}»!`,
      subtitle: inviteNote,
    });

    setInviteSentSuccess(true);
    triggerHaptic('success');
    triggerConfetti();

    setTimeout(() => {
      setInviteSentSuccess(false);
      setShowInviteModal(false);
      setInviteNote('Приглашаю тебя провести этот особенный вечер вдвоём');
      setSelectedVenueId('');
      setCustomLocationName('');
      setInviteDate('');
      setInviteTime('');
    }, 1500);
  };

  const handleCreateVenue = (venueData: any) => {
    addVenue(venueData);
    triggerHaptic('success');
    setShowAddVenueModal(false);
  };

  const handleAcceptInviteSubmit = (
    id: string,
    date: string,
    time: string,
    location: string,
    bookingLink?: string,
    saveToVenues?: boolean
  ) => {
    acceptDateInvite(id, date, time, location, bookingLink, saveToVenues);
    triggerHaptic('success');
    triggerConfetti();
    setAcceptingId(null);
  };

  const handleSaveReview = (
    inviteId: string,
    rating: number,
    notes: string,
    photos: string[]
  ) => {
    completeAndReviewDate(inviteId, rating, notes, photos);
    triggerHaptic('success');
    triggerConfetti();
    setReviewingInviteId(null);
  };

  // SUBVIEW: ПЛАВНЫЙ ПЕРЕХОД В МЕСТА
  if (subTab === 'places') {
    return (
      <PlacesView
        venues={venues}
        categories={categories}
        currentPartnerId={currentPartnerId}
        partnerName={otherPartner.name}
        onBack={() => {
          setSubTab('ideas');
          setDatesSubTab('invite');
        }}
        onAddVenue={handleCreateVenue}
        onDeleteVenue={deleteVenue}
        onInviteToVenue={(venue) => {
          setSelectedVenueId(venue.id);
          setInviteNote(`Приглашаю тебя в наше особенное место: «${venue.name}»`);
          setShowInviteModal(true);
        }}
        showAddVenueModal={showAddVenueModal}
        setShowAddVenueModal={setShowAddVenueModal}
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        inviteNote={inviteNote}
        setInviteNote={setInviteNote}
        selectedVenueId={selectedVenueId}
        setSelectedVenueId={setSelectedVenueId}
        customLocationName={customLocationName}
        setCustomLocationName={setCustomLocationName}
        inviteDate={inviteDate}
        setInviteDate={setInviteDate}
        inviteTime={inviteTime}
        setInviteTime={setInviteTime}
        inviteSentSuccess={inviteSentSuccess}
        onSendInviteSubmit={handleSendInvite}
      />
    );
  }

  // SUBVIEW: ИГРЫ ДЛЯ СВИДАНИЙ И РУЛЕТКА
  if (subTab === 'games') {
    return (
      <GamesView
        currentPartnerName={coupleProfile[currentPartnerId]?.name || 'Я'}
        partnerName={otherPartner.name}
        onBack={() => {
          setSubTab('ideas');
          setSelectedGame(null);
          setDatesSubTab('invite');
        }}
        onAddCoupleXP={addCoupleXP}
        onTriggerConfetti={triggerConfetti}
        initialGame={selectedGame}
      />
    );
  }

  // MAIN VIEW: ИДЕИ & ПРИГЛАШЕНИЯ
  return (
    <PageLayout title="Свидания" hideHeader>
      <div className="max-w-xl mx-auto w-full space-y-4 pb-12 animate-fadeIn">
        {/* Top Header & XP Indicator */}
        <header className="flex items-end justify-between pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
                Свидания
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-blush)] text-[var(--accent)] font-bold">
                Романтика
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
              Идеи, билеты и тёплые воспоминания пары
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Award className="w-4 h-4" />
            <span className="text-xs font-extrabold">{coupleXP} XP</span>
          </div>
        </header>

        {/* Segmented Control Pill Navigation */}
        <nav
          role="tablist"
          aria-label="Разделы свиданий"
          className="flex items-center p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] gap-1 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'ideas'}
            onClick={() => {
              triggerHaptic('selection');
              setSubTab('ideas');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'ideas'
                ? 'bg-[var(--surface-solid)] text-[var(--text)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Идеи</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'invites'}
            onClick={() => {
              triggerHaptic('selection');
              setSubTab('invites');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              subTab === 'invites'
                ? 'bg-[var(--surface-solid)] text-[var(--text)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Билеты</span>
            {pendingInvitesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {pendingInvitesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={(subTab as DatesSubTab) === 'places'}
            onClick={() => {
              triggerHaptic('selection');
              setSubTab('places');
            }}
            className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-[var(--text-2)] hover:text-[var(--text)] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>Места</span>
            {venues.length > 0 && (
              <span className="text-[10px] font-semibold opacity-70">
                ({venues.length})
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={(subTab as DatesSubTab) === 'games'}
            onClick={() => {
              triggerHaptic('selection');
              setSubTab('games');
            }}
            className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-[var(--text-2)] hover:text-[var(--text)] cursor-pointer"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Игры</span>
          </button>
        </nav>

        {/* TAB 1: ИДЕИ & ИСКРА */}
        {subTab === 'ideas' && (
          <div className="space-y-4">
            {/* 1. HERO CARD: Любовный билет или Запланировать свидание */}
            {activeInvite ? (
              <article className="p-4 sm:p-5 rounded-[26px] bg-gradient-to-br from-[var(--surface-solid)] to-[var(--surface-2)] border border-[var(--card-border)] shadow-md relative overflow-hidden space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-[var(--divider)] pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-xs shrink-0">
                      🎟
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-3)] block truncate">
                        Любовный посадочный талон
                      </span>
                      <p className="text-xs font-bold text-[var(--text)] truncate">
                        Свидание для {otherPartner.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs shrink-0 ${
                      activeInvite.status === 'CONFIRMED'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {activeInvite.status === 'CONFIRMED' ? '🥂 Подтверждено' : '⏳ Ожидает ответа'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                    {activeInvite.chosenLocation || 'Особенный романтический вечер'}
                  </h3>
                  <p className="text-xs text-[var(--text-2)] italic line-clamp-2">
                    «{activeInvite.invitationNote}»
                  </p>
                  {(activeInvite.chosenDate || activeInvite.chosenTime) && (
                    <div className="flex items-center gap-3 text-xs text-[var(--text)] font-semibold pt-1">
                      {activeInvite.chosenDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>{activeInvite.chosenDate}</span>
                        </span>
                      )}
                      {activeInvite.chosenTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>{activeInvite.chosenTime}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  {activeInvite.status === 'PENDING' && activeInvite.senderId !== currentPartnerId ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setAcceptingId(activeInvite.id);
                        setSubTab('invites');
                      }}
                      className="w-full py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98 transition-all"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Принять приглашение {otherPartner.name}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSubTab('invites');
                      }}
                      className="w-full py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] text-xs font-bold border border-[var(--divider)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                    >
                      <span>Посмотреть детали билета</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            ) : (
              <article className="p-4 sm:p-5 rounded-[26px] bg-gradient-to-br from-rose-500/15 via-amber-500/10 to-purple-500/15 border border-[var(--card-border)] shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[var(--accent)]/15 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-solid)] text-[var(--accent)] text-[11px] font-bold border border-[var(--accent)]/20 shadow-2xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Время для двоих</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[var(--text)] tracking-tight">
                    Подарите особенный вечер друг другу
                  </h3>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed max-w-md">
                    Даже 2 часа наедине без телефонов возвращают ощущение первых бабочек и тёплой влюблённости.
                  </p>
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setShowInviteModal(true);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-extrabold shadow-md shadow-[var(--accent)]/20 flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Пригласить на свидание</span>
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* 2. ГЕНЕРАТОР ИСКРЫ: Свидание под настроение */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--text)] tracking-tight flex items-center gap-1.5">
                    <span>✨ Генератор искры</span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-2)]">
                    Выберите настроение для романтического вечера
                  </p>
                </div>
              </div>

              {/* Vibe filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {VIBE_FILTERS.map((f) => {
                  const isActive = selectedVibe === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectVibe(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border active:scale-95 shadow-2xs flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                          : 'bg-[var(--surface-solid)] text-[var(--text-2)] border-[var(--divider)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span>{f.icon}</span>
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* The Spark Card (Semantic <article> as per card guidance) */}
              <article className="p-4 sm:p-5 rounded-[26px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)] border border-[var(--divider)]">
                      {currentSparkIdea.emoji} {currentSparkIdea.category}
                    </span>
                    <span className="text-xs text-[var(--text-2)] font-medium">
                      ⏱ {currentSparkIdea.duration}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--surface-blush)] px-2.5 py-0.5 rounded-full">
                    {currentSparkIdea.vibe === 'home' ? '🛋 Дома' : '🏙 Вне дома'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text)] tracking-tight">
                    {currentSparkIdea.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
                    {currentSparkIdea.description}
                  </p>
                </div>

                {/* Couple Psychology Insight */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <p className="text-[11px] sm:text-xs leading-relaxed">
                    <strong className="font-bold">Эффект сближения: </strong>
                    {currentSparkIdea.psychTip}
                  </p>
                </div>

                {/* Card Actions */}
                <footer className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setInviteNote(currentSparkIdea.inviteText);
                      setShowInviteModal(true);
                    }}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-md shadow-[var(--accent)]/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Пригласить с этой идеей</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShuffleSpark}
                    className="py-3 px-3.5 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] text-xs font-bold border border-[var(--divider)] flex items-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                    title="Найти другую идею"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Другая искра</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsWheelExpanded((prev) => !prev);
                    }}
                    className={`py-3 px-3.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 ${
                      isWheelExpanded
                        ? 'bg-[var(--surface-blush)] text-[var(--accent)] border-[var(--accent)]/40'
                        : 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] border-[var(--divider)]'
                    }`}
                    title="Колесо фортуны"
                  >
                    <span>🎡</span>
                    <span className="hidden sm:inline">Рулетка</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        isWheelExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </footer>
              </article>
            </section>

            {/* 3. OPTIONAL EXPANDABLE WHEEL */}
            {isWheelExpanded && (
              <div className="animate-fadeIn">
                <DateWheel
                  compact
                  onSelectIdea={(idea: DateIdea) => {
                    setInviteNote(idea.inviteText);
                    setShowInviteModal(true);
                  }}
                />
              </div>
            )}

            {/* 4. БЕНТО-КОЛЛЕКЦИИ: 4 формата свиданий */}
            <section className="space-y-2.5 pt-1">
              <h3 className="text-sm font-extrabold text-[var(--text)] tracking-tight">
                Коллекции форматов свиданий
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DATE_COLLECTIONS.map((c) => (
                  <article
                    key={c.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setInviteNote(c.presetText);
                      setShowInviteModal(true);
                    }}
                    className={`p-4 rounded-[24px] bg-[var(--surface-solid)] bg-gradient-to-br ${c.bgGradient} border ${c.border} shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl p-2 rounded-2xl bg-[var(--surface-solid)] shadow-2xs border border-[var(--divider)]">
                        {c.emoji}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-0.5">
                        <span>Выбрать</span>
                        <span>→</span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[var(--text-2)] mt-0.5 leading-relaxed">
                        {c.subtitle}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* 5. БЫСТРЫЙ ДОСТУП К ИГРАМ & РУЛЕТКЕ БЫТА */}
            <section className="space-y-2.5 pt-1">
              <h3 className="text-sm font-extrabold text-[var(--text)] tracking-tight">
                Игры для двоих и честный быт
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <article
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedGame('household_roulette');
                    setSubTab('games');
                  }}
                  className="p-4 rounded-[24px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-xs hover:border-[var(--accent)]/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
                      <Dices className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">Рулетка быта</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                          Без споров
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-2)] truncate">Кто моет посуду или варит кофе</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </article>

                <article
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedGame(null);
                    setSubTab('games');
                  }}
                  className="p-4 rounded-[24px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-xs hover:border-[var(--accent)]/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
                      <Gamepad2 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">Игры для двоих</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                          5 форматов
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-2)] truncate">Правда/Действие, Deep Talks, 18+</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </article>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: ПРИГЛАШЕНИЯ & ДНЕВНИК */}
        {subTab === 'invites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                  Билеты и летопись свиданий
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  Все приглашения, согласованное время и фото-воспоминания
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setShowInviteModal(true);
                }}
                className="py-2 px-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Новый инвайт</span>
              </button>
            </div>

            <DatesHistorySection
              dateInvites={dateInvites}
              currentPartnerId={currentPartnerId}
              coupleProfile={coupleProfile}
              venues={venues}
              acceptingId={acceptingId}
              setAcceptingId={setAcceptingId}
              reviewingInviteId={reviewingInviteId}
              setReviewingInviteId={setReviewingInviteId}
              onOpenInviteModal={() => setShowInviteModal(true)}
              onAcceptInviteSubmit={handleAcceptInviteSubmit}
              onSaveReview={handleSaveReview}
            />
          </div>
        )}

        {/* Modal: Create Date Invite */}
        <InviteBuilderModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          partnerName={otherPartner.name}
          inviteNote={inviteNote}
          setInviteNote={setInviteNote}
          selectedVenueId={selectedVenueId}
          setSelectedVenueId={setSelectedVenueId}
          customLocationName={customLocationName}
          setCustomLocationName={setCustomLocationName}
          inviteDate={inviteDate}
          setInviteDate={setInviteDate}
          inviteTime={inviteTime}
          setInviteTime={setInviteTime}
          venues={venues}
          inviteSentSuccess={inviteSentSuccess}
          onSubmit={handleSendInvite}
        />

        {/* Modal: Add Venue */}
        <AddVenueModal
          isOpen={showAddVenueModal}
          onClose={() => setShowAddVenueModal(false)}
          categories={categories}
          onAddVenue={handleCreateVenue}
        />
      </div>
    </PageLayout>
  );
};
