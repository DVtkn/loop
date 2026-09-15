import bcrypt from "bcryptjs";
import crypto from "crypto";
import { users } from "../../db/schema.ts";
import { db, isSqlConfigured } from "../../db/client.ts";
import { findUserByLogin, upsertUser, readEmergencyFile } from "../../services/storageService.ts";
import { DbUser, toSafeUser } from "../../core/types.ts";
import { generateToken } from "../../shared/middleware/auth.middleware.ts";
import { logger } from "../../shared/utils/logger.ts";
import { DatabaseUnavailableError } from "../../shared/errors/index.ts";

const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const isProd = () => process.env.NODE_ENV === "production";

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function getAllUsersSafe() {
  const userMap: Record<string, any> = {};

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const allSqlUsers = await db.select().from(users);
      for (const u of allSqlUsers) {
        userMap[u.login.toLowerCase()] = toSafeUser(u as DbUser);
      }
      return Object.values(userMap);
    } catch (err: unknown) {
      logger.error("Сбой чтения списка пользователей из SQL в production (fail-fast)", err);
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode
  if (isSqlConfigured() && db) {
    try {
      const allSqlUsers = await db.select().from(users);
      for (const u of allSqlUsers) {
        userMap[u.login.toLowerCase()] = toSafeUser(u as DbUser);
      }
    } catch (err: unknown) {
      logger.warn("Сбой чтения списка пользователей из SQL, чтение из файла", undefined, err);
    }
  }

  // Merge JSON users as fallback for missing users in dev mode
  const store = readEmergencyFile();
  for (const [k, u] of Object.entries(store.users || {})) {
    if (u && typeof u === "object" && !userMap[k.toLowerCase()]) {
      userMap[k.toLowerCase()] = toSafeUser(u as DbUser);
    }
  }

  return Object.values(userMap);
}

export async function registerUser(params: { login: string; password: string; name?: string; gender: "male" | "female" }) {
  const cleanLogin = String(params.login).trim().toLowerCase().replace(/^@/, "");

  const existing = await findUserByLogin(cleanLogin);
  if (existing) {
    throw { status: 400, message: "Пользователь с таким логином уже существует" };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(params.password, salt);
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  const newUser: DbUser = {
    id: userId,
    login: cleanLogin,
    passwordHash,
    name: params.name?.trim() || cleanLogin,
    gender: params.gender,
    avatarEmoji: "sparkles",
    partnerLogin: null,
    pairedAt: null,
    startDate: null,
    city: null,
    loveLanguage: null,
    attachmentStyle: null,
    currentMood: null,
    lastActiveAt: now,
    createdAt: now,
  };

  await upsertUser(newUser);
  const token = generateToken(cleanLogin);
  logger.info("Новый пользователь успешно зарегистрирован", { login: cleanLogin });

  return {
    token,
    user: toSafeUser(newUser),
  };
}

export async function loginUser(params: { login: string; password: string }, clientIp?: string) {
  const cleanLogin = String(params.login).trim().toLowerCase().replace(/^@/, "");
  const user = await findUserByLogin(cleanLogin);

  // Constant-time check mitigation
  if (!user) {
    await bcrypt.compare(params.password, DUMMY_HASH);
    throw { status: 401, message: "Неверный логин или пароль" };
  }

  const match = await verifyPassword(params.password, user.passwordHash);
  if (!match) {
    logger.security("Неудачная попытка входа", { login: cleanLogin, ip: clientIp });
    throw { status: 401, message: "Неверный логин или пароль" };
  }

  // Update lastActiveAt
  const now = new Date().toISOString();
  user.lastActiveAt = now;
  await upsertUser(user);

  const token = generateToken(cleanLogin);
  logger.info("Пользователь успешно вошёл в систему", { login: cleanLogin });

  return {
    token,
    user: toSafeUser(user),
  };
}

export async function getUserProfile(login: string) {
  const cleanLogin = String(login || "").toLowerCase().replace(/^@/, "");
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    throw { status: 404, message: "Пользователь не найден" };
  }
  return toSafeUser(user);
}

export async function updateUserProfile(userLogin: string, updates: any) {
  const user = await findUserByLogin(userLogin);
  if (!user) throw { status: 404, message: "Пользователь не найден" };

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.gender !== undefined) user.gender = updates.gender;
  if (updates.avatarEmoji !== undefined) user.avatarEmoji = updates.avatarEmoji;
  if (updates.city !== undefined) user.city = updates.city;
  if (updates.startDate !== undefined) user.startDate = updates.startDate;
  if (updates.loveLanguage !== undefined) user.loveLanguage = updates.loveLanguage;
  if (updates.attachmentStyle !== undefined) user.attachmentStyle = updates.attachmentStyle;
  if (updates.currentMood !== undefined) user.currentMood = updates.currentMood;
  user.lastActiveAt = new Date().toISOString();

  await upsertUser(user);
  logger.info("Профиль пользователя обновлен", { login: userLogin });
  return toSafeUser(user);
}

export async function changeUserPassword(userLogin: string, oldPass: string, newPass: string) {
  const user = await findUserByLogin(userLogin);
  if (!user) throw { status: 404, message: "Пользователь не найден" };

  const match = await verifyPassword(oldPass, user.passwordHash);
  if (!match) {
    throw { status: 400, message: "Старый пароль указан неверно" };
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPass, salt);
  await upsertUser(user);
  logger.info("Пароль пользователя успешно изменен", { login: userLogin });
}

export async function resetUserPassword(login: string, newPass: string) {
  const cleanLogin = String(login).toLowerCase().replace(/^@/, "");
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    throw { status: 404, message: "Пользователь с таким логином не найден" };
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPass, salt);
  await upsertUser(user);
  logger.info("Пароль сброшен", { login: cleanLogin });
}

export async function syncAccounts(accounts: any[]) {
  for (const acc of accounts) {
    if (acc && acc.login) {
      const existing = await findUserByLogin(acc.login);
      if (!existing) {
        const now = new Date().toISOString();
        const cleanLogin = String(acc.login).toLowerCase().replace(/^@/, "");
        const passwordHash = acc.passwordHash || (await bcrypt.hash(acc.password || "password123", 10));

        await upsertUser({
          id: acc.id || crypto.randomUUID(),
          login: cleanLogin,
          passwordHash,
          name: acc.name || cleanLogin,
          gender: acc.gender || null,
          avatarEmoji: acc.avatarEmoji || "sparkles",
          partnerLogin: acc.partnerLogin ? String(acc.partnerLogin).toLowerCase() : null,
          pairedAt: acc.pairedAt || null,
          startDate: acc.startDate || null,
          city: acc.city || null,
          loveLanguage: acc.loveLanguage || null,
          attachmentStyle: acc.attachmentStyle || null,
          currentMood: acc.currentMood || null,
          lastActiveAt: now,
          createdAt: acc.createdAt || now,
        });
      }
    }
  }
}
