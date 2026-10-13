import { Router } from "express";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { touchEventSchema } from "../../shared/validators/touch.validator.ts";
import {
  sendQuickTouch,
  getUserTouches,
  registerSSEClient,
  removeSSEClient,
  pushSubscriptions,
  handleHeartbeat,
  getEventsPoll,
} from "./realtime.service.ts";
import { logger } from "../../shared/utils/logger.ts";

export const realtimeRouter = Router();

// Heartbeat endpoint for Vercel Serverless (client pings every 25-30s)
realtimeRouter.post("/heartbeat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(400).json({ error: "Не указан логин" });
    }
    const result = await handleHeartbeat(login);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка обработки heartbeat", err);
    return res.status(500).json({ error: "Ошибка heartbeat" });
  }
});

// Smart Polling endpoint for Vercel Serverless (client polls every 2-3s in active tab)
realtimeRouter.get("/events-poll", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const login = (req.user?.login || "") as string;
    if (!login) {
      return res.status(400).json({ error: "Не указан логин" });
    }
    const result = await getEventsPoll({
      login,
      coupleId: req.query?.coupleId as string,
      lastEventId: req.query?.lastEventId as string,
      since: req.query?.since as string,
    });
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка опроса событий events-poll", err);
    return res.status(500).json({ error: "Ошибка опроса событий" });
  }
});

// Endpoint for sending a quick touch action to partner
realtimeRouter.post("/touch", requireAuth, validateBody(touchEventSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await sendQuickTouch(req.body);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка отправки быстрого касания", err);
    return res.status(500).json({ error: "Ошибка отправки касания" });
  }
});

// Endpoint for fetching recent touches for a user (polling fallback)
realtimeRouter.get("/touches/:login", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const paramLogin = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    if (!req.user?.login || paramLogin !== req.user.login) {
      return res.status(403).json({ error: "Нет доступа" });
    }
    const touches = getUserTouches(paramLogin);
    return res.json({ touches });
  } catch (err) {
    logger.error("Ошибка загрузки касаний", err);
    return res.status(500).json({ error: "Ошибка загрузки касаний" });
  }
});

// Server-Sent Events (SSE) stream for instant real-time delivery (<50ms)
realtimeRouter.get("/events-stream/:login", requireAuth, (req: AuthenticatedRequest, res) => {
  const login = String(req.params.login || "").toLowerCase().replace(/^@/, "");
  if (!req.user?.login || login !== req.user.login) {
    res.status(403).json({ error: "Нет доступа" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(": connected\n\n");
  registerSSEClient(login, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(login, res);
  });
});

import webpush from "web-push";

// Инициализация VAPID для web-push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@loopapp.io";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    logger.info("Web Push (VAPID) успешно инициализирован");
  } catch (err) {
    logger.warn("Ошибка инициализации Web Push VAPID:", undefined, err);
  }
} else {
  logger.info("VAPID ключи не заданы в .env, web-push работает в режиме заглушки");
}

export const pushRouter = Router();

pushRouter.get("/vapid-public-key", (_req, res) => {
  return res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

pushRouter.post("/subscribe", requireAuth, (req, res) => {
  const { subscription, partnerId, coupleId } = req.body;
  if (subscription) {
    pushSubscriptions.push({
      subscription,
      partnerId,
      coupleId,
      subscribedAt: new Date().toISOString(),
    });
    logger.info("Новая подписка на push-уведомления зарегистрирована", { coupleId });
  }
  return res.json({ status: "subscribed", count: pushSubscriptions.length });
});

pushRouter.post("/send-test", requireAuth, async (req, res) => {
  const { title, body } = req.body;
  const notificationTitle = title || "Loop • Внимание партнёра";
  const notificationBody = body || "Тестовое уведомление доставлено.";

  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && pushSubscriptions.length > 0) {
    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: "/icon.svg",
      tag: "test-push",
    });

    const results = await Promise.allSettled(
      pushSubscriptions.map((sub) =>
        webpush.sendNotification(sub.subscription, payload)
      )
    );

    const deliveredCount = results.filter((r) => r.status === "fulfilled").length;
    return res.json({
      status: "dispatched",
      title: notificationTitle,
      body: notificationBody,
      sentCount: deliveredCount,
      totalSubscriptions: pushSubscriptions.length,
    });
  }

  return res.json({
    status: "dispatched",
    title: notificationTitle,
    body: notificationBody,
    sentCount: 0,
    totalSubscriptions: pushSubscriptions.length,
  });
});
