import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext.tsx';
import { Venue } from '../types.ts';
import { IconColorTheme } from './ColoredIcon.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { CarouselTile, ActionRow, PrimaryCTA, CarouselItem } from './ui/SystemBlocks.tsx';
import { DateWheel, DateIdea } from './DateWheel.tsx';
import { PlacesView } from './dates/PlacesView.tsx';
import { GamesView } from './dates/GamesView.tsx';
import { DatesHistorySection } from './dates/DatesHistorySection.tsx';
import { InviteBuilderModal } from './dates/InviteBuilderModal.tsx';
import { AddVenueModal } from './dates/AddVenueModal.tsx';

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

  const currentPartner = currentPartnerId === 'partner1' ? coupleProfile.partner1 : coupleProfile.partner2;
  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;

  // Level 1 vs Level 2 View navigation
  const [currentView, setCurrentView] = useState<'main' | 'places' | 'games'>(() => {
    if (datesSubTab === 'places') return 'places';
    if (datesSubTab === 'games') return 'games';
    return 'main';
  });
  const [selectedGame, setSelectedGame] = useState<'truth_dare' | 'deep_talks' | 'spicy' | 'this_or_that' | 'household_roulette' | null>(null);

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

  // Category presets
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

  const dateFormats: CarouselItem[] = [
    {
      id: 'restaurant',
      title: 'Ресторан',
      icon: <Wine className="w-5 h-5" />,
      color: 'warmth',
      onClick: () => {
        setInviteNote('Приглашаю тебя на романтический ужин в красивый ресторан');
        setShowInviteModal(true);
      },
    },
    {
      id: 'cafe',
      title: 'Кофейня',
      icon: <Coffee className="w-5 h-5" />,
      color: 'mood',
      onClick: () => {
        setInviteNote('Давай сходим за кофе и вкусным десертом');
        setShowInviteModal(true);
      },
    },
    {
      id: 'park',
      title: 'Прогулка',
      icon: <TreePine className="w-5 h-5" />,
      color: 'care',
      onClick: () => {
        setInviteNote('Пойдём погуляем в красивом парке на свежем воздухе');
        setShowInviteModal(true);
      },
    },
    {
      id: 'cinema',
      title: 'Кино',
      icon: <Film className="w-5 h-5" />,
      color: 'gamification',
      onClick: () => {
        setInviteNote('Выберем фильм и проведём уютный вечер в кино');
        setShowInviteModal(true);
      },
    },
    {
      id: 'outdoor',
      title: 'Крыша',
      icon: <Sun className="w-5 h-5" />,
      color: 'time',
      onClick: () => {
        setInviteNote('Хочу встретить с тобой закат на панорамной крыше');
        setShowInviteModal(true);
      },
    },
    {
      id: 'spa',
      title: 'СПА',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'dialogue',
      onClick: () => {
        setInviteNote('Предлагаю расслабляющий день в СПА только для нас двоих');
        setShowInviteModal(true);
      },
    },
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

  // LEVEL 2: МЕСТА И ЗАВЕДЕНИЯ (PUSH VIEW)
  if (currentView === 'places') {
    return (
      <PlacesView
        venues={venues}
        categories={categories}
        currentPartnerId={currentPartnerId}
        partnerName={otherPartner.name}
        onBack={() => {
          setCurrentView('main');
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

  // LEVEL 2: ИГРЫ ДЛЯ СВИДАНИЙ (PUSH VIEW)
  if (currentView === 'games') {
    return (
      <GamesView
        currentPartnerName={currentPartner?.name || 'Я'}
        partnerName={otherPartner.name}
        onBack={() => {
          setCurrentView('main');
          setSelectedGame(null);
          setDatesSubTab('invite');
        }}
        onAddCoupleXP={addCoupleXP}
        onTriggerConfetti={triggerConfetti}
        initialGame={selectedGame}
      />
    );
  }

  // LEVEL 1: ГЛАВНЫЙ ЭКРАН СВИДАНИЙ (КОЛЕСО, CTA, PUSH-КАРТОЧКИ, ИСТОРИЯ)
  return (
    <PageLayout title="Свидания" hideHeader>
      <div className="max-w-xl mx-auto w-full space-y-5 pb-10 animate-fadeIn">
        {/* Header with Title & XP Badge */}
        <div className="flex items-end justify-between pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              Свидания & Романтика
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-2)] mt-0.5">
              Идеи, любимые места и тёплые воспоминания пары
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold">{coupleXP} XP</span>
          </div>
        </div>

        {/* 1. КОЛЕСО ИДЕЙ */}
        <DateWheel
          onSelectIdea={(idea: DateIdea) => {
            setInviteNote(idea.inviteText);
            setShowInviteModal(true);
          }}
        />

        {/* 2. PRIMARY CTA: Пригласить на свидание */}
        <PrimaryCTA
          icon={<Send className="w-5 h-5" />}
          title="Пригласить на свидание"
          subtitle={`Отправить инвайт для ${otherPartner.name}`}
          color="warmth"
          onClick={() => {
            triggerHaptic('selection');
            setShowInviteModal(true);
          }}
        />

        {/* 3. PUSH NAVIGATION CARDS: Места пары & Игры для двоих */}
        <div className="space-y-2.5">
          <ActionRow
            icon={<MapPin className="w-5 h-5" />}
            title="Места и заведения пары"
            value={`${venues.length} сохранённых локаций`}
            onClick={() => {
              triggerHaptic('selection');
              setCurrentView('places');
            }}
            color="warmth"
          />
          <ActionRow
            icon={<Gamepad2 className="w-5 h-5" />}
            title="Игры для свиданий"
            value="5 форматов для сближения и быта"
            onClick={() => {
              triggerHaptic('selection');
              setSelectedGame(null);
              setCurrentView('games');
            }}
            color="gamification"
          />
          <ActionRow
            icon={<Dices className="w-5 h-5" />}
            title="Рулетка честного быта"
            value="Кто сегодня готовит кофе, моет посуду или выбирает кино"
            onClick={() => {
              triggerHaptic('selection');
              setSelectedGame('household_roulette');
              setCurrentView('games');
            }}
            color="dialogue"
          />
        </div>

        {/* 4. Carousel of date ideas */}
        <CarouselTile items={dateFormats} title="Популярные форматы свиданий" />

        {/* 5. ИСТОРИЯ СВИДАНИЙ */}
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
