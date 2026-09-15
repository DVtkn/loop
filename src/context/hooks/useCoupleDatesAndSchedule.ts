import { useState } from 'react';
import {
  Venue,
  DateInvite,
  ScheduleEvent,
  WishlistItem,
  SmallCraving,
  FlowerPreference,
  PartnerId,
  DateReview,
} from '../../types.ts';
import { initialFlowerPreferences } from '../../data/questionBank.ts';
import { safeGetStorage } from '../../utils/safeStorage.ts';

export interface UseCoupleDatesAndScheduleProps {
  currentPartnerId: PartnerId;
  triggerConfetti: () => void;
  addCoupleXP: (points: number, reason: string, category: 'date' | 'bonus') => void;
  addFeedItem: (item: { author: PartnerId; type: 'sparkle' | 'heart'; title: string; subtitle: string }) => void;
}

export interface UseCoupleDatesAndScheduleReturn {
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
  addVenue: (venue: Omit<Venue, 'id' | 'createdAt' | 'addedBy'>) => void;
  deleteVenue: (id: string) => void;
  selectedCity: string;
  setSelectedCity: React.Dispatch<React.SetStateAction<string>>;
  dateInvites: DateInvite[];
  setDateInvites: React.Dispatch<React.SetStateAction<DateInvite[]>>;
  createDateInvite: (
    note: string,
    venueId?: string,
    locationName?: string,
    chosenDate?: string,
    chosenTime?: string
  ) => void;
  acceptDateInvite: (
    inviteId: string,
    date: string,
    time: string,
    location: string,
    link?: string,
    saveToVenues?: boolean
  ) => void;
  completeAndReviewDate: (inviteId: string, rating: number, impressions: string, photos: string[]) => void;
  confirmDatePlan: (inviteId: string, location: string, dateStr: string) => void;
  scheduleEvents: ScheduleEvent[];
  setScheduleEvents: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  addScheduleEvent: (eventData: Omit<ScheduleEvent, 'id' | 'createdAt'>) => Promise<void>;
  updateScheduleEvent: (id: string, updates: Partial<ScheduleEvent>) => Promise<void>;
  deleteScheduleEvent: (id: string) => Promise<void>;
  wishlist: WishlistItem[];
  setWishlist: React.Dispatch<React.SetStateAction<WishlistItem[]>>;
  addWishlistItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'addedBy' | 'isSecretReserved'>) => void;
  toggleSecretReserve: (id: string) => void;
  deleteWishlistItem: (id: string) => void;
  smallCravings: SmallCraving[];
  setSmallCravings: React.Dispatch<React.SetStateAction<SmallCraving[]>>;
  addSmallCraving: (title: string, category: SmallCraving['category']) => void;
  toggleCraving: (id: string) => void;
  flowerPreferences: Record<string, FlowerPreference>;
  setFlowerPreferences: React.Dispatch<React.SetStateAction<Record<string, FlowerPreference>>>;
  updateFlowerPreferences: (partnerId: PartnerId, prefs: Partial<FlowerPreference>) => void;
}

export function useCoupleDatesAndSchedule({
  currentPartnerId,
  triggerConfetti,
  addCoupleXP,
  addFeedItem,
}: UseCoupleDatesAndScheduleProps): UseCoupleDatesAndScheduleReturn {
  const [venues, setVenues] = useState<Venue[]>(() => {
    const data = safeGetStorage<Venue[]>('together_venues', []);
    return Array.isArray(data) ? data.filter((v) => !['v-1', 'v-2', 'v-3', 'v-4', 'v-5', 'v-6'].includes(v.id)) : [];
  });

  const [selectedCity, setSelectedCity] = useState<string>('Москва');

  const [dateInvites, setDateInvites] = useState<DateInvite[]>(() => {
    const data = safeGetStorage<DateInvite[]>('together_date_invites', []);
    return Array.isArray(data) ? data.filter((d) => !['inv-1'].includes(d.id)) : [];
  });

  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(() => {
    const data = safeGetStorage<ScheduleEvent[]>('together_schedule_events', []);
    return Array.isArray(data) ? data : [];
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const data = safeGetStorage<WishlistItem[]>('together_wishlist', []);
    return Array.isArray(data) ? data.filter((w) => !['w-1', 'w-2', 'w-3', 'w-4'].includes(w.id)) : [];
  });

  const [smallCravings, setSmallCravings] = useState<SmallCraving[]>(() => {
    const data = safeGetStorage<SmallCraving[]>('together_cravings', []);
    return Array.isArray(data) ? data.filter((c) => !['cr-1', 'cr-2', 'cr-3', 'cr-4'].includes(c.id)) : [];
  });

  const [flowerPreferences, setFlowerPreferences] = useState<Record<string, FlowerPreference>>(() => {
    return safeGetStorage('together_flowers', initialFlowerPreferences);
  });

  const addVenue = (venue: Omit<Venue, 'id' | 'createdAt' | 'addedBy'>) => {
    const newV: Venue = {
      ...venue,
      id: `v-${Date.now()}`,
      addedBy: currentPartnerId,
      createdAt: new Date().toISOString(),
    };
    setVenues((prev) => [newV, ...prev]);
    addCoupleXP(30, `Добавлено место в избранное: «${venue.name}»`, 'date');
    triggerConfetti();
  };

  const deleteVenue = (id: string) => {
    setVenues((prev) => prev.filter((v) => v.id !== id));
  };

  const createDateInvite = (
    note: string,
    venueId?: string,
    locationName?: string,
    chosenDate?: string,
    chosenTime?: string
  ) => {
    const recipientId: PartnerId = currentPartnerId === 'partner1' ? 'partner2' : 'partner1';
    const newInvite: DateInvite = {
      id: `inv-${Date.now()}`,
      senderId: currentPartnerId,
      recipientId,
      status: 'PENDING',
      invitationNote: note,
      venueId,
      chosenLocation: locationName,
      chosenDate,
      chosenTime,
      createdAt: new Date().toISOString(),
    };
    setDateInvites((prev) => [newInvite, ...prev]);
    addCoupleXP(20, 'Создано приглашение на свидание', 'date');
    triggerConfetti();
  };

  const acceptDateInvite = (
    inviteId: string,
    date: string,
    time: string,
    location: string,
    link?: string,
    saveToVenues?: boolean
  ) => {
    let matchedVenueId: string | undefined;
    if (saveToVenues && location && location.trim()) {
      const existing = venues.find((v) => v.name.toLowerCase() === location.trim().toLowerCase());
      if (!existing) {
        const newVenueId = `v-${Date.now()}`;
        const newVenue: Venue = {
          id: newVenueId,
          name: location.trim(),
          city: selectedCity || 'Москва',
          category: 'other',
          vibe: 'Добавлено при подтверждении свидания',
          priceLevel: '₽₽',
          address: location.trim(),
          rating: 5.0,
          description: `Особое место пары, согласованное на свидании ${date}`,
          bookingUrl: link,
          addedBy: currentPartnerId,
          createdAt: new Date().toISOString(),
        };
        setVenues((prev) => [newVenue, ...prev]);
        matchedVenueId = newVenueId;
      } else {
        matchedVenueId = existing.id;
      }
    }

    setDateInvites((prev) =>
      prev.map((inv) => {
        if (inv.id === inviteId) {
          const updated: DateInvite = {
            ...inv,
            status: 'CONFIRMED' as const,
            chosenDate: date,
            chosenTime: time,
            chosenLocation: location,
            chosenLink: link || inv.chosenLink,
            venueId: matchedVenueId || inv.venueId,
          };
          addFeedItem({
            author: currentPartnerId,
            type: 'sparkle',
            title: `Принял(а) приглашение на свидание!`,
            subtitle: `${date} в ${time} | ${location}`,
          });
          return updated;
        }
        return inv;
      })
    );
    addCoupleXP(50, `Согласовано свидание в ${location}`, 'date');
    triggerConfetti();
  };

  const completeAndReviewDate = (
    inviteId: string,
    rating: number,
    impressions: string,
    photos: string[]
  ) => {
    let dateLocation = 'Свидание';
    setDateInvites((prev) =>
      prev.map((inv) => {
        if (inv.id === inviteId) {
          dateLocation = inv.chosenLocation || 'Свидание';
          const review: DateReview = {
            id: `rev-${Date.now()}`,
            rating,
            impressions,
            photos,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentPartnerId,
          };
          return {
            ...inv,
            completed: true,
            status: 'CONFIRMED',
            review,
          };
        }
        return inv;
      })
    );

    const xpEarned = rating === 5 ? 200 : rating === 4 ? 150 : 100;
    addCoupleXP(xpEarned, `Свидание в «${dateLocation}» (${rating}⭐)`, 'date');
    addFeedItem({
      author: currentPartnerId,
      type: 'heart',
      title: `Завершено свидание: ${dateLocation}`,
      subtitle: `Оценка ${rating}/5 ⭐ • ${impressions || 'Было незабываемо!'}`,
    });
    triggerConfetti();
  };

  const confirmDatePlan = (_inviteId: string, _location: string, _dateStr: string) => {};

  const addScheduleEvent = async (eventData: Omit<ScheduleEvent, 'id' | 'createdAt'>) => {
    const newId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newEvent: ScheduleEvent = {
      ...eventData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setScheduleEvents((prev) => [newEvent, ...prev]);

    if (newEvent.isDate || newEvent.category === 'date') {
      const dateInviteId = `inv-plan-${newId}`;
      const partnerRecipient: PartnerId = newEvent.creatorId === 'partner1' ? 'partner2' : 'partner1';
      const newDateInvite: DateInvite = {
        id: dateInviteId,
        senderId: newEvent.creatorId,
        recipientId: partnerRecipient,
        status: 'CONFIRMED',
        invitationNote: newEvent.title,
        chosenDate: newEvent.date,
        chosenTime: newEvent.startTime,
        chosenLocation: newEvent.note || newEvent.title,
        createdAt: new Date().toISOString(),
      };
      setDateInvites((prev) => [newDateInvite, ...prev.filter((d) => d.id !== dateInviteId)]);
    }

    addCoupleXP(15, `Синхронизированы планы: «${eventData.isPrivate ? 'Личные планы' : eventData.title}»`, 'bonus');

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('loop_couple_channel');
        bc.postMessage({ type: 'SCHEDULE_UPDATED' });
        bc.close();
      }
    } catch {
      // ignore
    }
  };

  const updateScheduleEvent = async (id: string, updates: Partial<ScheduleEvent>) => {
    setScheduleEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));

    if (updates.category === 'date' || updates.isDate === true) {
      setDateInvites((prev) => {
        const exists = prev.some((d) => d.id === `inv-plan-${id}`);
        if (exists) {
          return prev.map((d) =>
            d.id === `inv-plan-${id}`
              ? {
                  ...d,
                  chosenDate: updates.date || d.chosenDate,
                  chosenTime: updates.startTime || d.chosenTime,
                  invitationNote: updates.title || d.invitationNote,
                  chosenLocation: updates.note || updates.title || d.chosenLocation,
                }
              : d
          );
        } else {
          const currentEv = scheduleEvents.find((e) => e.id === id);
          const creator: PartnerId = currentEv ? currentEv.creatorId : currentPartnerId;
          const partnerRecipient: PartnerId = creator === 'partner1' ? 'partner2' : 'partner1';
          return [
            {
              id: `inv-plan-${id}`,
              senderId: creator,
              recipientId: partnerRecipient,
              status: 'CONFIRMED',
              invitationNote: updates.title || currentEv?.title || 'Свидание',
              chosenDate: updates.date || currentEv?.date,
              chosenTime: updates.startTime || currentEv?.startTime,
              chosenLocation: updates.note || currentEv?.note || updates.title || currentEv?.title || 'Свидание',
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
      });
    } else if (updates.isDate === false || (updates.category !== undefined && updates.isDate !== true)) {
      setDateInvites((prev) => prev.filter((d) => d.id !== `inv-plan-${id}`));
    } else if (updates.date || updates.startTime || updates.title || updates.note) {
      setDateInvites((prev) =>
        prev.map((d) => {
          if (d.id === `inv-plan-${id}`) {
            return {
              ...d,
              chosenDate: updates.date || d.chosenDate,
              chosenTime: updates.startTime || d.chosenTime,
              invitationNote: updates.title || d.invitationNote,
              chosenLocation: updates.note || updates.title || d.chosenLocation,
            };
          }
          return d;
        })
      );
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('loop_couple_channel');
        bc.postMessage({ type: 'SCHEDULE_UPDATED' });
        bc.close();
      }
    } catch {
      // ignore
    }
  };

  const deleteScheduleEvent = async (id: string) => {
    setScheduleEvents((prev) => prev.filter((ev) => ev.id !== id));
    setDateInvites((prev) => prev.filter((d) => d.id !== `inv-plan-${id}`));
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('loop_couple_channel');
        bc.postMessage({ type: 'SCHEDULE_UPDATED' });
        bc.close();
      }
    } catch {
      // ignore
    }
  };

  const addWishlistItem = (item: Omit<WishlistItem, 'id' | 'createdAt' | 'addedBy' | 'isSecretReserved'>) => {
    const newItem: WishlistItem = {
      ...item,
      id: `w-${Date.now()}`,
      addedBy: currentPartnerId,
      isSecretReserved: false,
      createdAt: new Date().toISOString(),
    };
    setWishlist((prev) => [newItem, ...prev]);
  };

  const toggleSecretReserve = (id: string) => {
    setWishlist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.isSecretReserved;
          if (next) triggerConfetti();
          return {
            ...item,
            isSecretReserved: next,
            reservedBy: next ? currentPartnerId : undefined,
          };
        }
        return item;
      })
    );
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const addSmallCraving = (title: string, category: SmallCraving['category']) => {
    const targetPartner: PartnerId = currentPartnerId === 'partner1' ? 'partner2' : 'partner1';
    const newCraving: SmallCraving = {
      id: `cr-${Date.now()}`,
      title,
      category,
      addedBy: currentPartnerId,
      forPartner: targetPartner,
      fulfilled: false,
      createdAt: new Date().toISOString(),
    };
    setSmallCravings((prev) => [newCraving, ...prev]);
  };

  const toggleCraving = (id: string) => {
    setSmallCravings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.fulfilled;
          if (nextState) triggerConfetti();
          return {
            ...item,
            fulfilled: nextState,
            fulfilledAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return item;
      })
    );
  };

  const updateFlowerPreferences = (partnerId: PartnerId, prefs: Partial<FlowerPreference>) => {
    setFlowerPreferences((prev) => ({
      ...prev,
      [partnerId]: { ...prev[partnerId], ...prefs },
    }));
  };

  return {
    venues,
    setVenues,
    addVenue,
    deleteVenue,
    selectedCity,
    setSelectedCity,
    dateInvites,
    setDateInvites,
    createDateInvite,
    acceptDateInvite,
    completeAndReviewDate,
    confirmDatePlan,
    scheduleEvents,
    setScheduleEvents,
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    wishlist,
    setWishlist,
    addWishlistItem,
    toggleSecretReserve,
    deleteWishlistItem,
    smallCravings,
    setSmallCravings,
    addSmallCraving,
    toggleCraving,
    flowerPreferences,
    setFlowerPreferences,
    updateFlowerPreferences,
  };
}
