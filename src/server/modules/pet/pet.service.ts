import { db, isSqlConfigured } from "../../db/client.ts";
import { couplePets, coupleEvents, users, couples } from "../../db/schema.ts";
import { eq, and, or, gte } from "drizzle-orm";
import { logger } from "../../shared/utils/logger.ts";
import { sendSSEEventToUser } from "../../shared/utils/sse.ts";
import { getPairKey } from "../../shared/middleware/requirePairOwnership.ts";
import type { CouplePetState, PetActionResult, PetActionType, PetMood, PetSpecies } from "../../../types.ts";

const DEFAULT_PET_STATE: CouplePetState = {
  id: "",
  coupleId: "",
  pairKey: "",
  species: "dog",
  name: "Бусинка",
  nameStatus: "confirmed",
  nameProposedBy: undefined,
  isOnboardingCompleted: false,
  hunger: 85,
  joy: 90,
  energy: 65,
  cleanliness: 80,
  mood: "happy",
  level: 1,
  experience: 0,
  weightKg: "1.20",
  lastFedAt: new Date().toISOString(),
  lastPlayedAt: new Date().toISOString(),
  lastRestedAt: new Date().toISOString(),
  lastWashedAt: new Date().toISOString(),
  lastInteractionAt: new Date().toISOString(),
  lastActionBy: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Бонус вида: пёс бодрее (прирост энергии ×1.15), кошка ласковее (прирост радости ×1.15).
 * Чистая функция — покрыта unit-тестами.
 */
export function applySpeciesBonus(
  species: PetSpecies,
  gains: { hunger?: number; joy?: number; energy?: number; cleanliness?: number }
): { hunger: number; joy: number; energy: number; cleanliness: number } {
  const base = {
    hunger: gains.hunger ?? 0,
    joy: gains.joy ?? 0,
    energy: gains.energy ?? 0,
    cleanliness: gains.cleanliness ?? 0,
  };
  if (species === "dog" && base.energy > 0) base.energy = Math.round(base.energy * 1.15);
  if (species === "cat" && base.joy > 0) base.joy = Math.round(base.joy * 1.15);
  return base;
}

/**
 * Синергия дуо: 50 (питомец ваш) + 25 за твою заботу сегодня + 25 за заботу партнёра.
 * Чистая функция — покрыта unit-тестами.
 */
export function calcDuoSynergy(todayActors: string[]): number {
  const uniq = new Set(todayActors.map((a) => String(a).toLowerCase()));
  return Math.min(100, 50 + 25 * Math.min(2, uniq.size));
}

/**
 * Decay Engine: Calculate stat decay based on time elapsed since last interaction.
 */
function applyDecay(state: CouplePetState): CouplePetState {
  const now = new Date();
  const lastInteraction = new Date(state.lastInteractionAt);
  const hoursElapsed = Math.max(0, (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60));
  
  if (hoursElapsed < 0.1) return state;

  const decayed = { ...state };
  
  decayed.hunger = Math.max(0, state.hunger - Math.floor(hoursElapsed * 5));
  decayed.joy = Math.max(0, state.joy - Math.floor(hoursElapsed * 3));
  decayed.cleanliness = Math.max(0, state.cleanliness - Math.floor(hoursElapsed * 4));
  
  const hoursSinceRest = (now.getTime() - new Date(state.lastRestedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceRest > 1) {
    decayed.energy = Math.max(0, state.energy - Math.floor(hoursElapsed * 2));
  }

  decayed.mood = deriveMood(decayed);
  decayed.lastInteractionAt = now.toISOString();
  decayed.updatedAt = now.toISOString();

  return decayed;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function deriveMood(state: CouplePetState): PetMood {
  const criticalNeeds: { mood: PetMood; val: number }[] = [
    { mood: 'dirty', val: state.cleanliness },
    { mood: 'sleepy', val: state.energy },
    { mood: 'hungry', val: state.hunger },
  ];
  criticalNeeds.sort((a, b) => a.val - b.val);

  if (criticalNeeds[0].val < 35) {
    return criticalNeeds[0].mood;
  }
  if (state.joy >= 75) return "playful";
  return "happy";
}

function getXPForLevel(level: number): number {
  return level * 100;
}

function checkLevelUp(state: CouplePetState): { state: CouplePetState; levelUp: boolean } {
  let newState = { ...state };
  let levelUp = false;
  
  while (newState.experience >= getXPForLevel(newState.level)) {
    newState.level += 1;
    levelUp = true;
  }
  
  return { state: newState, levelUp };
}

async function getCoupleInfo(userLogin: string): Promise<{ coupleId: string; pairKey: string; userId: string } | null> {
  if (!isSqlConfigured() || !db) return null;
  
  const userRow = await db.select().from(users).where(eq(users.login, userLogin)).limit(1);
  if (!userRow.length || !userRow[0].partnerLogin) return null;
  
  const partnerLogin = userRow[0].partnerLogin;
  const pairKey = getPairKey(userLogin, partnerLogin);
  
  // Find couple in couples table by user IDs
  const partnerUser = await db.select().from(users).where(eq(users.login, partnerLogin)).limit(1);
  if (!partnerUser.length) return null;
  
  const coupleRow = await db.select().from(couples).where(
    or(
      and(
        eq(couples.user1Id, userRow[0].id),
        eq(couples.user2Id, partnerUser[0].id)
      ),
      and(
        eq(couples.user1Id, partnerUser[0].id),
        eq(couples.user2Id, userRow[0].id)
      )
    )
  ).limit(1);
  let coupleId: string;
  if (coupleRow.length) {
    coupleId = coupleRow[0].id;
  } else {
    coupleId = pairKey;
    try {
      await db.insert(couples).values({
        id: pairKey,
        user1Id: userRow[0].id,
        user2Id: partnerUser[0].id,
        startDate: new Date().toISOString().split('T')[0],
      }).onConflictDoNothing();
    } catch (err) {
      logger.warn('getCoupleInfo: failed to ensure couples row', { pairKey, err });
    }
  }
  
  return { coupleId, pairKey, userId: userRow[0].id };
}


function toIsoString(v: unknown): string {
  try {
    return v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function normalizePetRow(row: Record<string, unknown>): CouplePetState {
  const pet = { ...row } as unknown as CouplePetState;
  for (const k of ["lastFedAt","lastPlayedAt","lastRestedAt","lastWashedAt","lastInteractionAt","createdAt","updatedAt"] as const) {
    (pet as unknown as Record<string, unknown>)[k] = toIsoString((row as Record<string, unknown>)[k]);
  }
  return pet;
}

async function calcTodaySynergy(coupleId: string): Promise<number> {
  if (!isSqlConfigured() || !db) return 50;
  try {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const rows = await db
      .select({ senderLogin: coupleEvents.senderLogin })
      .from(coupleEvents)
      .where(
        and(
          eq(coupleEvents.coupleId, coupleId),
          eq(coupleEvents.eventType, "pet_action"),
          gte(coupleEvents.createdAt, dayStart.toISOString())
        )
      );
    return calcDuoSynergy(rows.map((r) => r.senderLogin));
  } catch {
    // Синергия — украшение, никогда не ломает чтение состояния
    return 50;
  }
}

export async function getPetState(userLogin: string): Promise<CouplePetState> {
  const coupleInfo = await getCoupleInfo(userLogin);
  if (!coupleInfo) {
    throw { status: 403, message: "Вы не состоите в паре" };
  }

  if (!isSqlConfigured() || !db) {
    throw { status: 503, message: "База данных недоступна" };
  }

  try {
    const row = await db.select().from(couplePets).where(eq(couplePets.pairKey, coupleInfo.pairKey)).limit(1);
    
    if (row.length === 0) {
      return {
        ...DEFAULT_PET_STATE,
        id: crypto.randomUUID(),
        coupleId: coupleInfo.coupleId,
        pairKey: coupleInfo.pairKey,
        isOnboardingCompleted: false,
        synergy: await calcTodaySynergy(coupleInfo.coupleId),
      };
    }
    
    const pet = normalizePetRow(row[0] as Record<string, unknown>);
    // Apply decay engine
    const decayed = applyDecay(pet);
    
    // If stats changed, update in DB
    if (decayed.hunger !== pet.hunger || decayed.joy !== pet.joy || 
        decayed.energy !== pet.energy || decayed.cleanliness !== pet.cleanliness ||
        decayed.mood !== pet.mood) {
      await db.update(couplePets)
        .set({ 
          hunger: decayed.hunger,
          joy: decayed.joy,
          energy: decayed.energy,
          cleanliness: decayed.cleanliness,
          mood: decayed.mood,
          lastInteractionAt: new Date(decayed.lastInteractionAt).toISOString(),
          updatedAt: new Date(decayed.updatedAt).toISOString()
        })
        .where(eq(couplePets.pairKey, coupleInfo.pairKey));
    }

    return { ...decayed, synergy: await calcTodaySynergy(coupleInfo.coupleId) };
  } catch (e) {
    logger.warn("getPetState SQL failed", undefined, e as any);
    throw { status: 503, message: "База данных недоступна" };
  }
}

export async function createPet(
  userLogin: string, 
  species: "dog" | "cat", 
  name: string
): Promise<PetActionResult> {
  const coupleInfo = await getCoupleInfo(userLogin);
  if (!coupleInfo) {
    throw { status: 403, message: "Вы не состоите в паре" };
  }

  if (!isSqlConfigured() || !db) {
    throw { status: 503, message: "База данных недоступна" };
  }

  const existingPet = await db
    .select()
    .from(couplePets)
    .where(eq(couplePets.pairKey, coupleInfo.pairKey))
    .limit(1);
  if (existingPet.length > 0) {
    throw { status: 400, message: "Питомец для этой пары уже создан" };
  }

  const now = new Date();
  const nowISO = now.toISOString();
  
  const petId = crypto.randomUUID();
  
  const newPet: CouplePetState = {
    id: petId,
    coupleId: coupleInfo.coupleId,
    pairKey: coupleInfo.pairKey,
    species: species as PetSpecies,
    name: name.trim(),
    nameStatus: "confirmed",
    nameProposedBy: coupleInfo.userId,
    isOnboardingCompleted: true,
    hunger: 85,
    joy: 90,
    energy: 65,
    cleanliness: 80,
    mood: "happy",
    level: 1,
    experience: 50,
    weightKg: "1.20",
    lastFedAt: nowISO,
    lastPlayedAt: nowISO,
    lastRestedAt: nowISO,
    lastWashedAt: nowISO,
    lastInteractionAt: nowISO,
    lastActionBy: coupleInfo.userId,
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  try {
    await db.insert(couplePets).values(newPet as any);
    
    await awardCoupleXP(coupleInfo.coupleId, 50, "pet_birth");
    await logPetEvent(coupleInfo.coupleId, userLogin, "birth", { petName: name, species });
    await notifyPartner(coupleInfo, userLogin, "pet_birth", { petName: name, species });
    
    return {
      success: true,
      state: newPet,
      message: `🎉 ${name} родился! Добро пожаловать в семью!`,
      levelUp: false,
      expGained: 50,
    };
  } catch (e) {
    logger.error("createPet error", e);
    console.error("createPet error:", e);
    throw e;
  }
}

export async function performPetAction(
  userLogin: string,
  action: PetActionType
): Promise<PetActionResult> {
  const coupleInfo = await getCoupleInfo(userLogin);
  if (!coupleInfo) {
    throw { status: 403, message: "Вы не состоите в паре" };
  }

  if (!isSqlConfigured() || !db) {
    throw { status: 503, message: "База данных недоступна" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const row = await tx.select().from(couplePets).where(eq(couplePets.pairKey, coupleInfo.pairKey)).limit(1);
      
      if (row.length === 0) {
        throw { status: 404, message: "Питомец не найден. Сначала завершите онбординг." };
      }
      
      let state = applyDecay(normalizePetRow(row[0] as Record<string, unknown>));
      let expGained = 0;
      let actionName = "";
      let emoji = "";

      let gains = { hunger: 0, joy: 0, energy: 0, cleanliness: 0 };

      switch (action) {
        case "feed":
          gains = { hunger: 25, joy: 5, energy: 0, cleanliness: 0 };
          expGained = 15;
          state.lastFedAt = new Date().toISOString();
          actionName = "покормил";
          emoji = "🍓";
          break;
        case "play":
          gains = { hunger: 0, joy: 20, energy: -10, cleanliness: 0 };
          expGained = 20;
          state.lastPlayedAt = new Date().toISOString();
          actionName = "поиграл с";
          emoji = "🎾";
          break;
        case "wash":
          gains = { hunger: 0, joy: 0, energy: 0, cleanliness: 25 };
          expGained = 15;
          state.lastWashedAt = new Date().toISOString();
          actionName = "помыл";
          emoji = "🛁";
          break;
        case "sleep":
          gains = { hunger: 0, joy: 0, energy: 35, cleanliness: 0 };
          expGained = 25;
          state.lastRestedAt = new Date().toISOString();
          actionName = "уложил спать";
          emoji = "💤";
          break;
        case "hug":
          gains = { hunger: 0, joy: 10, energy: 0, cleanliness: 0 };
          expGained = 10;
          actionName = "обнял";
          emoji = "🤗";
          break;
      }

      // Бонус вида применяется только к положительному приросту (траты не растут)
      const boosted = applySpeciesBonus(state.species, gains);
      state.hunger = clamp(state.hunger + boosted.hunger, 0, 100);
      state.joy = clamp(state.joy + boosted.joy, 0, 100);
      state.energy = clamp(state.energy + boosted.energy, 0, 100);
      state.cleanliness = clamp(state.cleanliness + boosted.cleanliness, 0, 100);

      state.experience += expGained;
      state.lastInteractionAt = new Date().toISOString();
      state.lastActionBy = coupleInfo.userId;
      state.mood = deriveMood(state);
      state.updatedAt = new Date().toISOString();

      const { state: leveledState, levelUp } = checkLevelUp(state);
      state = leveledState;

      await tx.update(couplePets)
        .set(state as any)
        .where(eq(couplePets.pairKey, coupleInfo.pairKey));

      const eventId = `${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;
      await tx.insert(coupleEvents).values({
        id: eventId,
        coupleId: coupleInfo.coupleId,
        targetLogin: "",
        senderLogin: userLogin,
        eventType: "pet_action",
        payload: { action, petName: state.name, level: state.level, mood: state.mood, expGained },
        createdAt: new Date().toISOString(),
      });

      return { state, expGained, levelUp, actionName, emoji };
    });

    await awardCoupleXP(coupleInfo.coupleId, result.expGained, `pet_${action}`);
    await notifyPartner(coupleInfo, userLogin, `pet_${action}`, { 
      petName: result.state.name, 
      action,
      expGained: result.expGained 
    });

    return {
      success: true,
      state: result.state,
      message: getActionMessage(action, result.levelUp, result.actionName, result.emoji),
      levelUp: result.levelUp,
      expGained: result.expGained,
    };
  } catch (e) {
    logger.error("performPetAction error", e);
    throw e;
  }
}

export async function proposePetName(userLogin: string, name: string): Promise<{ success: boolean; state: CouplePetState }> {
  const coupleInfo = await getCoupleInfo(userLogin);
  if (!coupleInfo) throw { status: 403, message: "Вы не состоите в паре" };

  const trimmedName = name.trim();
  if (!trimmedName) throw { status: 400, message: "Имя не может быть пустым" };

  if (!isSqlConfigured() || !db) throw { status: 503, message: "База данных недоступна" };

const now = new Date();
    
    try {
      const result = await db.update(couplePets)
        .set({ 
          name: trimmedName,
          nameStatus: "pending_partner",
          nameProposedBy: coupleInfo.userId,
          updatedAt: now.toISOString()
        })
        .where(eq(couplePets.pairKey, coupleInfo.pairKey))
        .returning();

    const state = result.length ? normalizePetRow(result[0] as Record<string, unknown>) : undefined;
    if (!state) throw { status: 404, message: "Питомец не найден" };

    await notifyPartner(coupleInfo, userLogin, "pet_name_proposed", { 
      proposedName: trimmedName,
      proposedBy: userLogin
    });

    return { success: true, state };
  } catch (e) {
    logger.error("proposePetName error", e);
    throw e;
  }
}

export async function confirmPetName(userLogin: string, confirm: boolean): Promise<{ success: boolean; state: CouplePetState }> {
  const coupleInfo = await getCoupleInfo(userLogin);
  if (!coupleInfo) throw { status: 403, message: "Вы не состоите в паре" };

  if (!isSqlConfigured() || !db) throw { status: 503, message: "База данных недоступна" };

  const now = new Date();
  
  try {
    const result = await db.update(couplePets)
      .set({ 
        nameStatus: confirm ? "confirmed" : "pending_partner",
        updatedAt: now.toISOString()
      })
      .where(eq(couplePets.pairKey, coupleInfo.pairKey))
      .returning();

    const state = result.length ? normalizePetRow(result[0] as Record<string, unknown>) : undefined;
    if (!state) throw { status: 404, message: "Питомец не найден" };

    return { success: true, state };
  } catch (e) {
    logger.error("confirmPetName error", e);
    throw e;
  }
}

export async function switchPetSpecies(userLogin: string, species: "dog" | "cat"): Promise<{ success: boolean; state: CouplePetState }> {
  const coupleInfo = await getCoupleInfo(userLogin);
  if (!coupleInfo) throw { status: 403, message: "Вы не состоите в паре" };

  if (!isSqlConfigured() || !db) throw { status: 503, message: "База данных недоступна" };

  const now = new Date();
  
  try {
    const result = await db.update(couplePets)
      .set({ 
        species: species as PetSpecies,
        updatedAt: now.toISOString()
      })
      .where(eq(couplePets.pairKey, coupleInfo.pairKey))
      .returning();

    const state = result.length ? normalizePetRow(result[0] as Record<string, unknown>) : undefined;
    if (!state) throw { status: 404, message: "Питомец не найден" };

    return { success: true, state };
  } catch (e) {
    logger.error("switchPetSpecies error", e);
    throw e;
  }
}

async function awardCoupleXP(coupleId: string, xp: number, _reason: string): Promise<void> {
  if (!isSqlConfigured() || !db) return;
  
  try {
    const couple = await db.select({ xp: couples.xpPoints }).from(couples).where(eq(couples.id, coupleId)).limit(1);
    await db.update(couples)
      .set({ 
        xpPoints: (couple[0]?.xp || 0) + xp
      })
      .where(eq(couples.id, coupleId));
  } catch (e) {
    logger.warn("awardCoupleXP failed", undefined, e as any);
  }
}

async function logPetEvent(coupleId: string, userLogin: string, eventType: string, payload: any): Promise<void> {
  if (!isSqlConfigured() || !db) return;
  
  try {
    const eventId = `${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;
    await db.insert(coupleEvents).values({
      id: eventId,
      coupleId,
      targetLogin: "",
      senderLogin: userLogin,
      eventType: "pet_action",
      payload: { ...payload, eventType },
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.warn("logPetEvent failed", undefined, e as any);
  }
}

async function notifyPartner(coupleInfo: { coupleId: string; pairKey: string; userId: string }, userLogin: string, eventType: string, payload: any): Promise<void> {
  if (!isSqlConfigured() || !db) return;
  
  try {
    const userRow = await db.select().from(users).where(eq(users.id, coupleInfo.userId)).limit(1);
    if (!userRow.length) return;
    
    const partnerLogin = userRow[0].partnerLogin;
    if (!partnerLogin) return;
    
    sendSSEEventToUser(partnerLogin, "pet_updated", {
      coupleId: coupleInfo.coupleId,
      eventType,
      payload,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    logger.warn("notifyPartner failed", undefined, e as any);
  }
}

function getActionMessage(action: PetActionType, levelUp: boolean, actionName: string, emoji: string): string {
  if (levelUp) return `🎉 Уровень повышен! ${emoji}`;
  
  const messages: Record<PetActionType, string> = {
    feed: `${emoji} Ням-ням! Сытость восстановлена`,
    play: `${emoji} Весело! Радость выросла`,
    wash: `${emoji} Чистота восстановлена! Пузырики...`,
    sleep: `${emoji} Сладких снов... Энергия восстановлена`,
    hug: `${emoji} Обнимашки! Радость выросла`,
  };
  
  return messages[action] || "Действие выполнено";
}