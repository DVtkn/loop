import { safeGetStorage, safeSetStorage } from '../utils/safeStorage.ts';

export interface HouseholdRouletteItem {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category?: 'daily' | 'food' | 'fun' | 'care' | 'custom';
  isDefault?: boolean;
}

export const HOUSEHOLD_ROULETTE_STORAGE_KEY = 'together_household_roulette_items';

export const DEFAULT_HOUSEHOLD_ITEMS: HouseholdRouletteItem[] = [
  {
    id: 'movie',
    title: 'Кто выбирает фильм на вечер? 🎬',
    emoji: '🎬',
    color: '#6366F1', // Indigo
    category: 'fun',
    isDefault: true,
  },
  {
    id: 'coffee',
    title: 'Кто готовит утренний кофе? ☕',
    emoji: '☕',
    color: '#F59E0B', // Amber
    category: 'daily',
    isDefault: true,
  },
  {
    id: 'pet',
    title: 'Кто выгуливает питомца? 🐾',
    emoji: '🐾',
    color: '#10B981', // Emerald
    category: 'daily',
    isDefault: true,
  },
  {
    id: 'dishes',
    title: 'Кто моет посуду / загружает посудомойку? 🫧',
    emoji: '🫧',
    color: '#06B6D4', // Cyan
    category: 'daily',
    isDefault: true,
  },
  {
    id: 'dinner',
    title: 'Кто выбирает и заказывает ужин? 🍕',
    emoji: '🍕',
    color: '#EC4899', // Pink
    category: 'food',
    isDefault: true,
  },
  {
    id: 'massage',
    title: 'Массаж 10 минут перед сном 💆',
    emoji: '💆',
    color: '#8B5CF6', // Purple
    category: 'care',
    isDefault: true,
  },
  {
    id: 'pass',
    title: 'Чур я отдыхаю — делает партнёр! 👑',
    emoji: '👑',
    color: '#EAB308', // Yellow
    category: 'fun',
    isDefault: true,
  },
  {
    id: 'cleaning',
    title: 'Совместная уборка под музыку 🎵',
    emoji: '🎵',
    color: '#14B8A6', // Teal
    category: 'daily',
    isDefault: true,
  },
];

export const ROULETTE_PALETTE_COLORS = [
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EAB308', // Gold
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#3B82F6', // Blue
];

export const ROULETTE_EMOJI_SUGGESTIONS = [
  '🎬', '☕', '🐾', '🫧', '🍕', '💆', '👑', '🎵',
  '🧹', '🛒', '🥐', '🚗', '🪴', '🧺', '🎲', '🍹',
  '🍳', '🥞', '🍷', '🍣', '🍫', '🛌', '🕯️', '🍿',
];

/**
 * Minimum items required for meaningful SVG wheel geometry
 */
export const MIN_ROULETTE_ITEMS = 3;

/**
 * Retrieve saved household roulette items from safeStorage or fallback to defaults
 */
export function getHouseholdItems(): HouseholdRouletteItem[] {
  const stored = safeGetStorage<HouseholdRouletteItem[]>(
    HOUSEHOLD_ROULETTE_STORAGE_KEY,
    DEFAULT_HOUSEHOLD_ITEMS
  );
  if (!Array.isArray(stored) || stored.length < MIN_ROULETTE_ITEMS) {
    return [...DEFAULT_HOUSEHOLD_ITEMS];
  }
  return stored;
}

/**
 * Save household roulette items to storage
 */
export function saveHouseholdItems(items: HouseholdRouletteItem[]): void {
  safeSetStorage(HOUSEHOLD_ROULETTE_STORAGE_KEY, items);
}

/**
 * Add a new custom chore to the household roulette
 */
export function addHouseholdItem(
  item: Omit<HouseholdRouletteItem, 'id'> & { id?: string }
): HouseholdRouletteItem[] {
  const current = getHouseholdItems();
  const newItem: HouseholdRouletteItem = {
    ...item,
    id: item.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category: item.category || 'custom',
    isDefault: false,
  };
  const updated = [...current, newItem];
  saveHouseholdItems(updated);
  return updated;
}

/**
 * Delete a chore from the household roulette, enforcing the minimum 3 items constraint
 */
export function deleteHouseholdItem(id: string): HouseholdRouletteItem[] {
  const current = getHouseholdItems();
  if (current.length <= MIN_ROULETTE_ITEMS) {
    // Enforce safety guard: cannot delete below minimum
    return current;
  }
  const updated = current.filter((item) => item.id !== id);
  if (updated.length < MIN_ROULETTE_ITEMS) {
    return current;
  }
  saveHouseholdItems(updated);
  return updated;
}

/**
 * Reset household roulette items to the original 8 default chores
 */
export function resetHouseholdItems(): HouseholdRouletteItem[] {
  const defaults = [...DEFAULT_HOUSEHOLD_ITEMS];
  saveHouseholdItems(defaults);
  return defaults;
}
