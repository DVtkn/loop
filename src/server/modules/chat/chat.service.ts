import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, isSqlConfigured } from "../../db/client.ts";
import { chatMessages } from "../../db/schema.ts";
import { logger } from "../../shared/utils/logger.ts";
import { readEmergencyFile, writeEmergencyFile } from "../../services/storageService.ts";
import {
  callGroqChat,
  saveAIMessageToDb,
} from "../../services/aiService.ts";
import { DatabaseUnavailableError } from "../../shared/errors/index.ts";

export { callGroqChat, saveAIMessageToDb };

const isProd = () => process.env.NODE_ENV === "production";

export async function getCoupleChatMessages(coupleId: string) {
  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const msgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.coupleId, coupleId))
        .orderBy(chatMessages.createdAt)
        .limit(150);
      return msgs;
    } catch (err: unknown) {
      logger.error("Сбой чтения сообщений чата из SQL в production (fail-fast)", err, { coupleId });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev mode
  if (isSqlConfigured() && db) {
    try {
      const msgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.coupleId, coupleId))
        .orderBy(chatMessages.createdAt)
        .limit(150);
      return msgs;
    } catch (err: unknown) {
      logger.warn("Сбой чтения сообщений чата из SQL, чтение из файла", { coupleId }, err);
    }
  }

  const store = readEmergencyFile();
  const msgs = (store.chatMessages || [])
    .filter((m) => m.coupleId === coupleId)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
    .slice(-150);

  return msgs;
}

export async function saveChatMessage(params: {
  coupleId: string;
  senderLogin: string;
  content: string;
  role?: string;
}) {
  const now = new Date().toISOString();
  const msg = {
    id: crypto.randomUUID(),
    coupleId: params.coupleId,
    senderLogin: params.senderLogin,
    role: params.role || "partner1",
    content: params.content,
    isRead: false,
    createdAt: now,
  };

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.insert(chatMessages).values(msg);
      return msg;
    } catch (err: unknown) {
      logger.error("Сбой сохранения сообщения чата в SQL в production (fail-fast)", err, { coupleId: params.coupleId });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev mode
  if (isSqlConfigured() && db) {
    try {
      await db.insert(chatMessages).values(msg);
      return msg;
    } catch (err: unknown) {
      logger.warn("Сбой сохранения сообщения чата в SQL, запись в файл", { coupleId: params.coupleId }, err);
    }
  }

  const store = readEmergencyFile();
  if (!store.chatMessages) store.chatMessages = [];
  store.chatMessages.push(msg);
  writeEmergencyFile(store);

  return msg;
}

export async function getAIMessages(login: string) {
  const aiCoupleId = `ai_${login}`;

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const msgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.coupleId, aiCoupleId))
        .orderBy(chatMessages.createdAt)
        .limit(100);
      return msgs;
    } catch (err: unknown) {
      logger.error("Сбой чтения истории ИИ из SQL в production (fail-fast)", err, { login });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev mode
  if (isSqlConfigured() && db) {
    try {
      const msgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.coupleId, aiCoupleId))
        .orderBy(chatMessages.createdAt)
        .limit(100);
      return msgs;
    } catch (err: unknown) {
      logger.warn("Сбой чтения истории ИИ из SQL, чтение из файла", { login }, err);
    }
  }

  const store = readEmergencyFile();
  const msgs = (store.chatMessages || [])
    .filter((m) => m.coupleId === aiCoupleId)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
    .slice(-100);

  return msgs;
}
