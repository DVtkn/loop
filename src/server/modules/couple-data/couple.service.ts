import { getCoupleData, saveCoupleData, mergeCoupleData, readEmergencyFile, writeEmergencyFile } from "../../services/storageService.ts";
import { recordDailyMetrics } from "../../services/analytics.ts";
import { computeCoupleRatingAnalytics } from "../../../utils/rankingEngine.ts";
import { logger } from "../../shared/utils/logger.ts";
import { sendSSEEventToUser } from "../../shared/utils/sse.ts";
import { db, isSqlConfigured } from "../../db/client.ts";
import { users } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export async function syncCouplePayload(
  params: { login1: string; login2?: string | null; coupleId?: string | null; payload: any },
  senderUserLogin?: string
) {
  const { login1, login2, coupleId, payload } = params;

  let key = coupleId;
  if (!key) {
    if (login2) {
      const l1 = String(login1).toLowerCase().trim().replace(/^@/, "");
      const l2 = String(login2).toLowerCase().trim().replace(/^@/, "");
      key = [l1, l2].sort().join("_");
    } else {
      key = String(login1).toLowerCase().trim().replace(/^@/, "");
    }
  }

  // Read existing data from Neon & deep-merge to prevent overwriting partner's progress
  const existing = await getCoupleData(key);
  const merged = mergeCoupleData(existing, payload);

  // SECURITY: Recalculate level and stats on the server based on arrays
  try {
    const p1Name = merged.coupleProfile?.partner1?.name || "Partner 1";
    const p2Name = merged.coupleProfile?.partner2?.name || "Partner 2";

    const analytics = computeCoupleRatingAnalytics({
      xpHistory: merged.xpHistory || [],
      totalXP: merged.totalXP || 0,
      tests: merged.tests || [],
      dateInvites: merged.dateInvites || [],
      smallCravings: merged.smallCravings || [],
      loveTaps: merged.loveTaps || [],
      pulseHistory: merged.pulseHistory || [],
      challenges: merged.challenges || [],
      p1Name,
      p2Name,
    });

    // Enforce server-calculated values
    merged.level = analytics.levelInfo.level;
    merged.levelName = analytics.levelInfo.levelName;
    merged.testsCompletedCount = (merged.tests || []).filter((t: any) => t.partner1Done || t.partner2Done).length;

    if (merged.coupleProfile) {
      merged.coupleProfile.level = analytics.levelInfo.level;
      merged.coupleProfile.levelName = analytics.levelInfo.levelName;
      merged.coupleProfile.testsCompletedCount = merged.testsCompletedCount;
    }
  } catch (e) {
    logger.error("Failed to compute couple rating on server", e);
  }

  await saveCoupleData(key, merged);

  // Analytics: Record daily metrics
  try {
    const todayDate = new Date().toISOString().split("T")[0];
    await recordDailyMetrics(key, todayDate, merged);
  } catch (err: unknown) {
    logger.warn("Сбой записи ежедневных метрик в analytics", { coupleId: key }, err);
  }

  // Realtime notification to partner via SSE
  if (login2) {
    const sender = String(senderUserLogin || "").toLowerCase().trim().replace(/^@/, "");
    const otherLogin =
      String(login1).toLowerCase().trim().replace(/^@/, "") === sender
        ? String(login2).toLowerCase().trim().replace(/^@/, "")
        : String(login1).toLowerCase().trim().replace(/^@/, "");
    sendSSEEventToUser(otherLogin, "schedule_updated", { key, timestamp: new Date().toISOString() });
    sendSSEEventToUser(otherLogin, "couple_updated", { key, timestamp: new Date().toISOString() });
  }

  return { key, data: merged };
}

export async function fetchCoupleDataByKey(key: string) {
  const cleanKey = String(key || "").toLowerCase().trim();
  return await getCoupleData(cleanKey);
}

export async function fetchCoupleDataByLogins(login1: string, login2: string) {
  const l1 = String(login1 || "").toLowerCase().replace(/^@/, "");
  const l2 = String(login2 || "").toLowerCase().replace(/^@/, "");
  const key = [l1, l2].sort().join("_");
  return await getCoupleData(key);
}

export async function generateInviteCode(requesterLogin?: string): Promise<string> {
  const cleanLogin = String(requesterLogin || "").toLowerCase().trim().replace(/^@/, "");
  if (!cleanLogin) throw { status: 401, message: "Требуется авторизация" };
  const code = `LOOP-${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  if (isSqlConfigured() && db) {
    try {
      const res: any = await (db as any).update(users).set({ inviteCode: code, inviteCodeExpires: expiresAt }).where(eq(users.login, cleanLogin)).returning?.();
      void res;
    } catch (e) {
      logger.warn("generateInviteCode SQL failed, fallback to file", undefined, e as any);
      const store: any = readEmergencyFile();
      if (store.users?.[cleanLogin]) {
        store.users[cleanLogin].inviteCode = code;
        store.users[cleanLogin].inviteCodeExpires = expiresAt;
        writeEmergencyFile(store);
      }
    }
    // ensure file mirror for local polling consistency
    try {
      const store: any = readEmergencyFile();
      if (store.users?.[cleanLogin]) {
        store.users[cleanLogin].inviteCode = code;
        store.users[cleanLogin].inviteCodeExpires = expiresAt;
        writeEmergencyFile(store);
      }
    } catch {}
  } else {
    const store: any = readEmergencyFile();
    if (!store.users) store.users = {};
    if (!store.users[cleanLogin]) store.users[cleanLogin] = { login: cleanLogin } as any;
    store.users[cleanLogin].inviteCode = code;
    store.users[cleanLogin].inviteCodeExpires = expiresAt;
    writeEmergencyFile(store);
  }
  // also try SQL even if file succeeded, to keep Neon in sync
  if (isSqlConfigured() && db) {
    try { await (db as any).update(users).set({ inviteCode: code, inviteCodeExpires: expiresAt }).where(eq(users.login, cleanLogin)); } catch {}
  }
  return code;
}

export async function joinInvite(joinerLogin?: string, rawCode?: string): Promise<{ partnerLogin: string }> {
  const cleanLogin = String(joinerLogin || "").toLowerCase().trim().replace(/^@/, "");
  const cleanCode = String(rawCode || "").trim().toUpperCase();
  if (!cleanLogin || !cleanCode) throw { status: 400, message: "Код обязателен" };
  let inviterLogin: string | null = null;
  let inviterRow: any = null;
  if (isSqlConfigured() && db) {
    try {
      const rows: any[] = await (db as any).select().from(users).where(eq(users.inviteCode, cleanCode)).limit(1);
      if (rows.length) inviterRow = rows[0];
    } catch (e) { logger.warn("joinInvite SQL select failed", undefined, e as any); }
  }
  if (!inviterRow) {
    const store: any = readEmergencyFile();
    const found = Object.values(store.users || {}).find((u: any) => String(u.inviteCode || "").toUpperCase() === cleanCode);
    if (found) inviterRow = found as any;
  }
  if (!inviterRow) throw { status: 404, message: "Код не найден" };
  const expires = inviterRow.inviteCodeExpires ? new Date(String(inviterRow.inviteCodeExpires)) : null;
  if (!expires || isNaN(expires.getTime()) || expires.getTime() < Date.now()) throw { status: 410, message: "Код истёк" };
  inviterLogin = String(inviterRow.login || "").toLowerCase().trim();
  if (!inviterLogin) throw { status: 404, message: "Владелец кода не найден" };
  if (inviterLogin === cleanLogin) throw { status: 400, message: "Нельзя присоединиться к себе" };
  // check already paired
  const { findUserByLogin } = await import("../../services/storageService.ts");
  const joiner = await findUserByLogin(cleanLogin);
  const inviter = await findUserByLogin(inviterLogin);
  if (!joiner || !inviter) throw { status: 404, message: "Пользователь не найден" };
  if ((joiner as any).partnerLogin) throw { status: 409, message: "Вы уже в паре" };
  if ((inviter as any).partnerLogin) throw { status: 409, message: "Владелец кода уже в паре" };
  const { acceptPair } = await import("../../services/pairService.ts");
  // create pending request then accept atomically via acceptPair
  const { createPairRequest } = await import("../../services/pairService.ts");
  await createPairRequest(inviter as any, joiner as any);
  const result = await acceptPair(cleanLogin, inviterLogin);
  // clear invite code after use
  if (isSqlConfigured() && db) {
    try { await (db as any).update(users).set({ inviteCode: null, inviteCodeExpires: null }).where(eq(users.login, inviterLogin)); } catch {}
  }
  try {
    const store: any = readEmergencyFile();
    if (store.users?.[inviterLogin]) { store.users[inviterLogin].inviteCode = null; store.users[inviterLogin].inviteCodeExpires = null; writeEmergencyFile(store); }
  } catch {}
  void result;
  return { partnerLogin: inviterLogin };
}
