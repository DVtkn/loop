import webpush from "web-push";
import crypto from "crypto";
import { sql, eq } from "drizzle-orm";
import { db, isSqlConfigured } from "../db/client.ts";
import { pushSubscriptions } from "../db/schema.ts";
import { logger } from "../core/logger.ts";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@loopapp.io";

let isVapidReady = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isVapidReady = true;
    logger.info("Web Push (VAPID) успешно инициализирован в pushService");
  } catch (err) {
    logger.warn("Ошибка инициализации Web Push VAPID в pushService:", undefined, err);
  }
} else {
  logger.info("VAPID ключи не заданы в .env, pushService работает в режиме заглушки");
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

// In-memory fallback for local dev when SQL is not configured
interface MemorySubscription {
  id: string;
  userLogin: string;
  coupleId?: string;
  subscription: any;
  createdAt: string;
}
const memorySubscriptions: MemorySubscription[] = [];

/**
 * Сохранить подписку браузера на push-уведомления
 */
export async function savePushSubscription(params: {
  userLogin: string;
  coupleId?: string | null;
  subscription: any;
}): Promise<void> {
  const cleanLogin = String(params.userLogin || "").toLowerCase().replace(/^@/, "").trim();
  if (!cleanLogin || !params.subscription) return;

  const endpoint = params.subscription.endpoint;
  const subId = crypto.randomUUID();

  // 1. Сохранение в PostgreSQL (Neon)
  if (isSqlConfigured() && db) {
    try {
      // Удаляем устаревшие дубликаты подписок с тем же endpoint для этого логина
      if (endpoint) {
        await db
          .delete(pushSubscriptions)
          .where(
            sql`LOWER(${pushSubscriptions.userLogin}) = ${cleanLogin} AND ${pushSubscriptions.subscription}->>'endpoint' = ${endpoint}`
          );
      }

      await db.insert(pushSubscriptions).values({
        id: subId,
        userLogin: cleanLogin,
        coupleId: params.coupleId || null,
        subscription: params.subscription,
      });

      logger.info("Push-подписка успешно сохранена в Neon DB", { userLogin: cleanLogin });
      return;
    } catch (err) {
      logger.warn("Не удалось сохранить push-подписку в Neon DB, сохранение в память", { userLogin: cleanLogin }, err);
    }
  }

  // 2. Fallback memory storage
  const existingIdx = memorySubscriptions.findIndex(
    (s) => s.userLogin === cleanLogin && s.subscription?.endpoint === endpoint
  );
  if (existingIdx !== -1) {
    memorySubscriptions[existingIdx] = {
      id: subId,
      userLogin: cleanLogin,
      coupleId: params.coupleId || undefined,
      subscription: params.subscription,
      createdAt: new Date().toISOString(),
    };
  } else {
    memorySubscriptions.push({
      id: subId,
      userLogin: cleanLogin,
      coupleId: params.coupleId || undefined,
      subscription: params.subscription,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Отправить системное push-уведомление конкретному пользователю на все его зарегистрированные устройства
 */
export async function sendPushToUser(
  userLogin: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    url?: string;
  }
): Promise<number> {
  const cleanLogin = String(userLogin || "").toLowerCase().replace(/^@/, "").trim();
  if (!cleanLogin || !isVapidReady) return 0;

  const notificationPayload = JSON.stringify({
    title: payload.title || "Loop",
    body: payload.body || "Новое событие в вашей паре",
    icon: payload.icon || "/icon-192.png",
    tag: payload.tag || "loop-event",
    url: payload.url || "/",
  });

  const subsToSend: Array<{ id: string; subscription: any }> = [];

  // 1. Поиск подписок в PostgreSQL
  if (isSqlConfigured() && db) {
    try {
      const rows = await db
        .select({
          id: pushSubscriptions.id,
          subscription: pushSubscriptions.subscription,
        })
        .from(pushSubscriptions)
        .where(sql`LOWER(${pushSubscriptions.userLogin}) = ${cleanLogin}`);

      for (const r of rows) {
        if (r.subscription) {
          subsToSend.push({ id: r.id, subscription: r.subscription });
        }
      }
    } catch (err) {
      logger.warn("Ошибка выборки push-подписок из Neon DB", { userLogin: cleanLogin }, err);
    }
  }

  // Fallback memory
  if (subsToSend.length === 0) {
    const memoryMatches = memorySubscriptions.filter((s) => s.userLogin === cleanLogin);
    for (const m of memoryMatches) {
      subsToSend.push({ id: m.id, subscription: m.subscription });
    }
  }

  if (subsToSend.length === 0) {
    return 0;
  }

  let sentCount = 0;
  const expiredIds: string[] = [];

  await Promise.allSettled(
    subsToSend.map(async ({ id, subscription }) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        sentCount++;
      } catch (err: any) {
        const statusCode = err?.statusCode;
        // 404 или 410 = подписка устарела / приложение удалено
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(id);
        } else {
          logger.warn("Ошибка отправки push-уведомления", { userLogin: cleanLogin, statusCode, err: String(err) });
        }
      }
    })
  );

  // Очистка устаревших подписок
  if (expiredIds.length > 0 && isSqlConfigured() && db) {
    try {
      for (const id of expiredIds) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
      }
      logger.info("Удалены недействительные push-подписки", { count: expiredIds.length });
    } catch {}
  }

  return sentCount;
}
