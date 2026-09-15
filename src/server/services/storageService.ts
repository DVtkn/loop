import fs from 'fs';
import path from 'path';
import { sql, eq, or } from 'drizzle-orm';
import { db, isSqlConfigured } from '../db/client.ts';
import { users, coupleData } from '../db/schema.ts';
import { logger } from '../core/logger.ts';
import { DbUser, DbUserInsert, JsonStoreShape } from '../core/types.ts';
import { DatabaseUnavailableError } from '../shared/errors/index.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db_store.json');

const isProd = () => process.env.NODE_ENV === 'production';

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err: unknown) {
    logger.error('Не удалось создать директорию для аварийного хранилища', err, { path: DATA_DIR });
  }
}

export function readEmergencyFile(): JsonStoreShape {
  if (isProd()) {
    return { users: {}, pairRequests: [], coupleData: {}, chatMessages: [], rateLimits: {}, photos: [] };
  }
  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || {},
        pairRequests: parsed.pairRequests || [],
        coupleData: parsed.coupleData || {},
        chatMessages: parsed.chatMessages || [],
        rateLimits: parsed.rateLimits || {},
        photos: parsed.photos || [],
      };
    }
  } catch (err: unknown) {
    logger.error('Ошибка чтения аварийного файла db_store.json', err);
  }
  return { users: {}, pairRequests: [], coupleData: {}, chatMessages: [], rateLimits: {}, photos: [] };
}

export function writeEmergencyFile(data: JsonStoreShape): void {
  if (isProd()) {
    // В Cloud Run контейнер эфемерен. В production этот фолбэк полностью отключён.
    return;
  }
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err: unknown) {
    logger.error('Ошибка записи в аварийный файл db_store.json', err);
  }
}

export async function findUserByLogin(login: string): Promise<DbUser | undefined> {
  const clean = login.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return undefined;

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const res = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.login}) = ${clean}`)
        .limit(1);
      return res && res.length > 0 ? (res[0] as DbUser) : undefined;
    } catch (err: unknown) {
      logger.error('SQL запрос findUserByLogin завершился сбоем в production (fail-fast)', err, { login: clean });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode with fallback
  let sqlUser: DbUser | undefined;
  if (isSqlConfigured() && db) {
    try {
      const res = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.login}) = ${clean}`)
        .limit(1);
      if (res && res.length > 0) {
        sqlUser = res[0] as DbUser;
      }
    } catch (err: unknown) {
      logger.warn('SQL запрос findUserByLogin завершился с ошибкой, переключение на резервный файл', { login: clean }, err);
    }
  }

  const store = readEmergencyFile();
  const jsonUser = store.users[clean] || Object.values(store.users).find((u) => u && String(u.login).toLowerCase() === clean);

  if (sqlUser && jsonUser) {
    return {
      ...sqlUser,
      ...jsonUser,
      partnerLogin: jsonUser.partnerLogin || sqlUser.partnerLogin,
      pairedAt: jsonUser.pairedAt || sqlUser.pairedAt,
    } as DbUser;
  }

  return sqlUser || jsonUser;
}

export async function findUserByQuery(query: string): Promise<DbUser | undefined> {
  const clean = query.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return undefined;

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const res = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.login, clean),
            sql`LOWER(${users.login}) = ${clean}`,
            sql`LOWER(${users.name}) = ${clean}`
          )
        )
        .limit(1);
      return res && res.length > 0 ? (res[0] as DbUser) : undefined;
    } catch (err: unknown) {
      logger.error('SQL запрос findUserByQuery завершился сбоем в production (fail-fast)', err, { query: clean });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode with fallback
  let sqlUser: DbUser | undefined;
  if (isSqlConfigured() && db) {
    try {
      const res = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.login, clean),
            sql`LOWER(${users.login}) = ${clean}`,
            sql`LOWER(${users.name}) = ${clean}`
          )
        )
        .limit(1);
      if (res && res.length > 0) {
        sqlUser = res[0] as DbUser;
      }
    } catch (err: unknown) {
      logger.warn('SQL запрос findUserByQuery завершился с ошибкой, переключение на резервный файл', { query: clean }, err);
    }
  }

  const store = readEmergencyFile();
  const jsonUser = store.users[clean] || Object.values(store.users).find(
    (u) => u && (String(u.login).toLowerCase() === clean || String(u.name || '').toLowerCase() === clean)
  );

  if (sqlUser && jsonUser) {
    return {
      ...sqlUser,
      ...jsonUser,
      partnerLogin: jsonUser.partnerLogin || sqlUser.partnerLogin,
      pairedAt: jsonUser.pairedAt || sqlUser.pairedAt,
    } as DbUser;
  }

  return sqlUser || jsonUser;
}

export async function upsertUser(userData: DbUserInsert): Promise<void> {
  const cleanLogin = userData.login.trim().toLowerCase().replace(/^@/, '');
  const normalizedData = { ...userData, login: cleanLogin };

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db
        .insert(users)
        .values(normalizedData)
        .onConflictDoUpdate({
          target: users.login,
          set: normalizedData,
        });
      return;
    } catch (err: unknown) {
      logger.error('SQL запись пользователя завершилась сбоем в production (fail-fast)', err, { login: cleanLogin });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode with fallback
  if (isSqlConfigured() && db) {
    try {
      await db
        .insert(users)
        .values(normalizedData)
        .onConflictDoUpdate({
          target: users.login,
          set: normalizedData,
        });
    } catch (err: unknown) {
      logger.error('SQL запись пользователя завершилась сбоем, сохранение в аварийное хранилище', err, { login: cleanLogin });
    }
  }

  const store = readEmergencyFile();
  store.users[cleanLogin] = { ...(store.users[cleanLogin] || {}), ...normalizedData } as DbUser;
  writeEmergencyFile(store);
}

export function mergeCoupleData(existing: any, incoming: any): any {
  if (!existing) return incoming || {};
  if (!incoming) return existing || {};

  const merged = { ...existing, ...incoming };

  // SECURITY STRIP: Prevent client from forging calculated levels or XP
  if (incoming.level !== undefined) merged.level = existing.level || 1;
  if (incoming.levelName !== undefined) merged.levelName = existing.levelName || 'Первый шаг';
  if (incoming.testsCompletedCount !== undefined) merged.testsCompletedCount = existing.testsCompletedCount || 0;

  if (merged.coupleProfile) {
    if (incoming.coupleProfile?.level !== undefined) merged.coupleProfile.level = existing.coupleProfile?.level || 1;
    if (incoming.coupleProfile?.levelName !== undefined) merged.coupleProfile.levelName = existing.coupleProfile?.levelName || 'Первый шаг';
    if (incoming.coupleProfile?.testsCompletedCount !== undefined) merged.coupleProfile.testsCompletedCount = existing.coupleProfile?.testsCompletedCount || 0;
  }

  // 1. Tests merge: ensure each test merges questions / answers / partnerAnswers / scores
  if (Array.isArray(existing.tests) && Array.isArray(incoming.tests)) {
    const testMap = new Map<string, any>();
    existing.tests.forEach((t: any) => testMap.set(t.id, t));
    incoming.tests.forEach((t: any) => {
      const ex = testMap.get(t.id);
      if (ex) {
        testMap.set(t.id, {
          ...ex,
          ...t,
          questions: Array.isArray(t.questions) && t.questions.length > 0 ? t.questions : ex.questions,
          userAnswers: { ...(ex.userAnswers || {}), ...(t.userAnswers || {}) },
          partnerAnswers: { ...(ex.partnerAnswers || {}), ...(t.partnerAnswers || {}) },
          partner1Answers: { ...(ex.partner1Answers || {}), ...(t.partner1Answers || {}) },
          partner2Answers: { ...(ex.partner2Answers || {}), ...(t.partner2Answers || {}) },
          partner1Done: !!(ex.partner1Done || t.partner1Done),
          partner2Done: !!(ex.partner2Done || t.partner2Done),
          score: t.score !== undefined ? t.score : ex.score,
          completedAt: t.completedAt || ex.completedAt,
        });
      } else {
        testMap.set(t.id, t);
      }
    });
    merged.tests = Array.from(testMap.values());
  }

  // 2. Pulse History merge
  if (Array.isArray(existing.pulseHistory) && Array.isArray(incoming.pulseHistory)) {
    const pulseMap = new Map<string, any>();
    existing.pulseHistory.forEach((p: any) => pulseMap.set(p.id || p.date, p));
    incoming.pulseHistory.forEach((p: any) => pulseMap.set(p.id || p.date, { ...(pulseMap.get(p.id || p.date) || {}), ...p }));
    merged.pulseHistory = Array.from(pulseMap.values()).sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  // 3. Challenges merge
  if (Array.isArray(existing.challenges) && Array.isArray(incoming.challenges)) {
    const challMap = new Map<string, any>();
    existing.challenges.forEach((c: any) => challMap.set(c.id, c));
    incoming.challenges.forEach((c: any) => challMap.set(c.id, { ...(challMap.get(c.id) || {}), ...c }));
    merged.challenges = Array.from(challMap.values());
  }

  // 4. Wishlist merge
  if (Array.isArray(existing.wishlist) && Array.isArray(incoming.wishlist)) {
    const wishMap = new Map<string, any>();
    existing.wishlist.forEach((w: any) => wishMap.set(w.id, w));
    incoming.wishlist.forEach((w: any) => wishMap.set(w.id, { ...(wishMap.get(w.id) || {}), ...w }));
    merged.wishlist = Array.from(wishMap.values());
  }

  // 5. Date Invites merge
  if (Array.isArray(existing.dateInvites) && Array.isArray(incoming.dateInvites)) {
    const dateMap = new Map<string, any>();
    existing.dateInvites.forEach((d: any) => dateMap.set(d.id, d));
    incoming.dateInvites.forEach((d: any) => dateMap.set(d.id, { ...(dateMap.get(d.id) || {}), ...d }));
    merged.dateInvites = Array.from(dateMap.values());
  }

  // 6. Cravings & Flowers
  if (Array.isArray(existing.smallCravings) && Array.isArray(incoming.smallCravings)) {
    const cMap = new Map<string, any>();
    existing.smallCravings.forEach((c: any) => cMap.set(c.id, c));
    incoming.smallCravings.forEach((c: any) => cMap.set(c.id, { ...(cMap.get(c.id) || {}), ...c }));
    merged.smallCravings = Array.from(cMap.values());
  }

  if (incoming.flowerPreferences) {
    merged.flowerPreferences = { ...(existing.flowerPreferences || {}), ...incoming.flowerPreferences };
  }

  // 7. Couple Profile & XP
  if (incoming.coupleProfile) {
    merged.coupleProfile = { ...(existing.coupleProfile || {}), ...incoming.coupleProfile };
  }

  if (incoming.coupleXP !== undefined || existing.coupleXP !== undefined) {
    merged.coupleXP = Math.max(Number(existing.coupleXP) || 0, Number(incoming.coupleXP) || 0);
  }

  if (Array.isArray(existing.xpHistory) && Array.isArray(incoming.xpHistory)) {
    const xpMap = new Map<string, any>();
    existing.xpHistory.forEach((x: any) => xpMap.set(x.id || `${x.date}_${x.action}`, x));
    incoming.xpHistory.forEach((x: any) => xpMap.set(x.id || `${x.date}_${x.action}`, x));
    merged.xpHistory = Array.from(xpMap.values());
  }

  // 8. Time Capsules & Love Taps & Daily Quiz
  if (Array.isArray(existing.timeCapsules) && Array.isArray(incoming.timeCapsules)) {
    const tcMap = new Map<string, any>();
    existing.timeCapsules.forEach((t: any) => tcMap.set(t.id, t));
    incoming.timeCapsules.forEach((t: any) => tcMap.set(t.id, { ...(tcMap.get(t.id) || {}), ...t }));
    merged.timeCapsules = Array.from(tcMap.values());
  }

  if (Array.isArray(existing.loveTaps) && Array.isArray(incoming.loveTaps)) {
    const ltMap = new Map<string, any>();
    existing.loveTaps.forEach((t: any) => ltMap.set(t.id, t));
    incoming.loveTaps.forEach((t: any) => ltMap.set(t.id, { ...(ltMap.get(t.id) || {}), ...t }));
    merged.loveTaps = Array.from(ltMap.values()).slice(-50);
  }

  // 9. Schedule Events ("Наши планы")
  if (Array.isArray(existing.scheduleEvents) || Array.isArray(incoming.scheduleEvents)) {
    const evMap = new Map<string, any>();
    (existing.scheduleEvents || []).forEach((e: any) => evMap.set(e.id, e));
    (incoming.scheduleEvents || []).forEach((e: any) => evMap.set(e.id, { ...(evMap.get(e.id) || {}), ...e }));
    merged.scheduleEvents = Array.from(evMap.values()).filter((e: any) => !e.deleted);
  }

  // 10. Mood History & Achievements
  if (Array.isArray(existing.moodHistory) || Array.isArray(incoming.moodHistory)) {
    const mdMap = new Map<string, any>();
    (existing.moodHistory || []).forEach((m: any) => mdMap.set(m.id || m.date, m));
    (incoming.moodHistory || []).forEach((m: any) => mdMap.set(m.id || m.date, { ...(mdMap.get(m.id || m.date) || {}), ...m }));
    merged.moodHistory = Array.from(mdMap.values());
  }

  if (Array.isArray(existing.achievements) || Array.isArray(incoming.achievements)) {
    const achMap = new Map<string, any>();
    (existing.achievements || []).forEach((a: any) => achMap.set(a.id, a));
    (incoming.achievements || []).forEach((a: any) => achMap.set(a.id, { ...(achMap.get(a.id) || {}), ...a }));
    merged.achievements = Array.from(achMap.values());
  }

  // 11. Daily Quiz
  if (existing.dailyQuiz || incoming.dailyQuiz) {
    const exQuiz = existing.dailyQuiz || {};
    const inQuiz = incoming.dailyQuiz || {};
    if (exQuiz.id === inQuiz.id) {
      merged.dailyQuiz = {
        ...exQuiz,
        ...inQuiz,
        partner1Answer: inQuiz.partner1Answer || exQuiz.partner1Answer,
        partner2Answer: inQuiz.partner2Answer || exQuiz.partner2Answer,
        isMatch: inQuiz.isMatch || exQuiz.isMatch
      };
    } else if (inQuiz.id && (!exQuiz.id || inQuiz.id > exQuiz.id)) {
      merged.dailyQuiz = inQuiz;
    } else {
      merged.dailyQuiz = exQuiz;
    }
  }

  // 12. Feed Items
  if (Array.isArray(existing.feedItems) || Array.isArray(incoming.feedItems)) {
    const fMap = new Map<string, any>();
    (existing.feedItems || []).forEach((f: any) => fMap.set(f.id || f.title, f));
    (incoming.feedItems || []).forEach((f: any) => fMap.set(f.id || f.title, { ...(fMap.get(f.id || f.title) || {}), ...f }));
    merged.feedItems = Array.from(fMap.values()).slice(-50);
  }

  return merged;
}

export async function getCoupleData(key: string): Promise<any | null> {
  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const rows = await db.select().from(coupleData).where(eq(coupleData.id, key)).limit(1);
      return rows && rows.length > 0 ? rows[0].data : null;
    } catch (err: unknown) {
      logger.error('SQL чтение coupleData завершилось сбоем в production (fail-fast)', err, { key });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode with fallback
  if (isSqlConfigured() && db) {
    try {
      const rows = await db.select().from(coupleData).where(eq(coupleData.id, key)).limit(1);
      if (rows && rows.length > 0) {
        return rows[0].data;
      }
    } catch (err: unknown) {
      logger.warn('SQL чтение coupleData сбоит, попытка чтения аварийного файла', { key }, err);
    }
  }

  const store = readEmergencyFile();
  return store.coupleData?.[key] || null;
}

export async function saveCoupleData(key: string, data: any): Promise<void> {
  const now = new Date().toISOString();

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db
        .insert(coupleData)
        .values({
          id: key,
          data,
          lastUpdatedAt: now,
        })
        .onConflictDoUpdate({
          target: coupleData.id,
          set: {
            data,
            lastUpdatedAt: now,
          },
        });
      return;
    } catch (err: unknown) {
      logger.error('SQL запись coupleData завершилась сбоем в production (fail-fast)', err, { key });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode with fallback
  if (isSqlConfigured() && db) {
    try {
      await db
        .insert(coupleData)
        .values({
          id: key,
          data,
          lastUpdatedAt: now,
        })
        .onConflictDoUpdate({
          target: coupleData.id,
          set: {
            data,
            lastUpdatedAt: now,
          },
        });
    } catch (err: unknown) {
      logger.error('SQL запись coupleData сбоит, сохранение в аварийный файл', err, { key });
    }
  }

  const store = readEmergencyFile();
  if (!store.coupleData) store.coupleData = {};
  store.coupleData[key] = data;
  writeEmergencyFile(store);
}
