import { db, isSqlConfigured } from "../../db/client.ts";
import { couplePets, coupleEvents, users } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { logger } from "../../shared/utils/logger.ts";
import { sendSSEEventToUser } from "../../shared/utils/sse.ts";
import { getPairKey } from "../../shared/middleware/requirePairOwnership.ts";
import type { CouplePetState, PetActionResult, PetMood, PetActionType } from "../../../types.ts";

const DEFAULT_PET_STATE: CouplePetState = {
  id: "",
  name: "Мурчик",
  hunger: 80,
  energy: 80,
  joy: 80,
  level: 1,
  exp: 0,
  mood: "happy",
  createdAt: "",
  updatedAt: "",
};

/**
 * Derive coupleId from user login by looking up partnerLogin in DB.
 */
async function getCoupleId(userLogin: string): Promise<string | null> {
  if (!isSqlConfigured() || !db) return null;
  const userRow = await db.select().from(users).where(eq(users.login, userLogin)).limit(1);
  if (!userRow.length || !userRow[0].partnerLogin) return null;
  return getPairKey(userLogin, userRow[0].partnerLogin);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function deriveMood(state: CouplePetState): PetMood {
  if (state.energy < 20) return "sleepy";
  if (state.hunger < 20) return "hungry";
  if (state.joy >= 80) return "playful";
  return "happy";
}

/**
 * Get pet state for a user's couple. Auto-initializes if not exists.
 */
export async function getPetState(userLogin: string): Promise<CouplePetState> {
  const coupleId = await getCoupleId(userLogin);
  if (!coupleId) {
    throw { status: 403, message: "Вы не состоите в паре" };
  }

  if (isSqlConfigured() && db) {
    try {
      let row = await db.select().from(couplePets).where(eq(couplePets.id, coupleId)).limit(1);
      if (row.length === 0) {
        // Auto-init with defaults
        const now = new Date().toISOString();
        const init = { ...DEFAULT_PET_STATE, id: coupleId, createdAt: now, updatedAt: now };
        await db.insert(couplePets).values(init as any);
        row = [init as any];
      }
      return row[0] as CouplePetState;
    } catch (e) {
      logger.warn("getPetState SQL failed", undefined, e as any);
    }
  }
  throw { status: 503, message: "База данных недоступна" };
}

/**
 * Perform an action on the pet (feed, play, sleep, pet).
 */
export async function performPetAction(
  userLogin: string,
  action: PetActionType
): Promise<PetActionResult> {
  const coupleId = await getCoupleId(userLogin);
  if (!coupleId) {
    throw { status: 403, message: "Вы не состоите в паре" };
  }

  if (!isSqlConfigured() || !db) {
    throw { status: 503, message: "База данных недоступна" };
  }

  try {
    // Use a transaction for atomicity
    const result = await db.transaction(async (tx) => {
      let row = await tx.select().from(couplePets).where(eq(couplePets.id, coupleId)).limit(1);
      let state: CouplePetState;
      let isNew = false;
      if (row.length === 0) {
        const now = new Date().toISOString();
        state = { ...DEFAULT_PET_STATE, id: coupleId, createdAt: now, updatedAt: now };
        isNew = true;
      } else {
        state = row[0] as CouplePetState;
      }

      let expGained = 0;
      let levelUp = false;

      // Apply action effects
      switch (action) {
        case "feed":
          state.hunger = clamp(state.hunger + 30, 0, 100);
          state.joy = clamp(state.joy + 5, 0, 100);
          expGained = 10;
          state.lastFedAt = new Date().toISOString();
          state.mood = state.joy >= 50 ? "happy" : state.mood;
          break;
        case "play":
          state.energy = clamp(state.energy - 20, 0, 100);
          state.joy = clamp(state.joy + 30, 0, 100);
          expGained = 15;
          state.lastPlayedAt = new Date().toISOString();
          state.mood = "playful";
          break;
        case "sleep":
          state.energy = clamp(state.energy + 40, 0, 100);
          state.hunger = clamp(state.hunger - 10, 0, 100);
          expGained = 5;
          state.lastSleptAt = new Date().toISOString();
          state.mood = "sleepy";
          break;
        case "pet":
          state.joy = clamp(state.joy + 20, 0, 100);
          expGained = 10;
          state.lastPettedAt = new Date().toISOString();
          state.mood = "loved";
          break;
      }

      state.exp += expGained;
      // Level up every 100 exp
      while (state.exp >= 100) {
        state.level += 1;
        state.exp -= 100;
        levelUp = true;
      }

      state.mood = deriveMood(state);
      state.updatedAt = new Date().toISOString();

      if (isNew) {
        await tx.insert(couplePets).values(state as any);
      } else {
        await tx.update(couplePets).set(state as any).where(eq(couplePets.id, coupleId));
      }

      // Log the action as a couple event
      const eventId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await tx.insert(coupleEvents).values({
        id: eventId,
        coupleId,
        targetLogin: "",
        senderLogin: userLogin,
        eventType: "pet_action",
        payload: { action, petName: state.name, level: state.level, mood: state.mood },
        createdAt: new Date().toISOString(),
      });

      return { state, expGained, levelUp };
    });

    // Notify partner via SSE
    if (isSqlConfigured() && db) {
      const userRow = await db.select().from(users).where(eq(users.login, userLogin)).limit(1);
      if (userRow.length && userRow[0].partnerLogin) {
        sendSSEEventToUser(userRow[0].partnerLogin, "pet_updated", {
          coupleId,
          action,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      state: result.state,
      message: getActionMessage(action, result.levelUp),
      levelUp: result.levelUp,
      expGained: result.expGained,
    };
  } catch (e) {
    logger.error("performPetAction error", e);
    throw e;
  }
}

/**
 * Rename the pet.
 */
export async function renamePet(userLogin: string, name: string): Promise<{ success: boolean; state: CouplePetState }> {
  const coupleId = await getCoupleId(userLogin);
  if (!coupleId) {
    throw { status: 403, message: "Вы не состоите в паре" };
  }

  if (!isSqlConfigured() || !db) {
    throw { status: 503, message: "База данных недоступна" };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw { status: 400, message: "Имя не может быть пустым" };
  }

  let state: CouplePetState | undefined;
  try {
    const result = await db.update(couplePets).set({ name: trimmedName, updatedAt: new Date().toISOString() }).where(eq(couplePets.id, coupleId)).returning();
    // Drizzle returns rows in some configurations
    state = result.length ? (result[0] as CouplePetState) : undefined;
    if (!state) {
      // Fallback: read after update
      const rows = await db.select().from(couplePets).where(eq(couplePets.id, coupleId)).limit(1);
      state = rows.length ? (rows[0] as CouplePetState) : undefined;
    }
  } catch (e) {
    logger.warn("renamePet update failed", undefined, e as any);
  }

  if (!state) {
    throw { status: 404, message: "Питомец не найден" };
  }

  return { success: true, state };
}

function getActionMessage(action: PetActionType, levelUp: boolean): string {
  if (levelUp) return "Уровень повышен! 🎉";
  switch (action) {
    case "feed": return "Ням-ням! 🍖 Сытость восстановлена";
    case "play": return "Весело! 🎮 Радость выросла";
    case "sleep": return "Сладких снов... 💤 Энергия восстановлена";
    case "pet": return "Ласка! ❤️ Радость выросла";
    default: return "Действие выполнено";
  }
}
