import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { requirePairOwnership } from "../../shared/middleware/requirePairOwnership.ts";
import {
  getTrends,
  fetchAiInsights,
  generateWeeklyInsight,
  getCoupleReport,
  getUserPsychProfiles,
  getDetailedCoupleAnalytics,
} from "./analytics.service.ts";
import { logger } from "../../shared/utils/logger.ts";

import { findUserByLogin } from "../../services/storageService.ts";
import { getPairKey } from "../../shared/middleware/requirePairOwnership.ts";

export const analyticsRouter = Router();

function parseTrendsDays(query: Record<string, unknown>): number {
  const period = String(query.period || "");
  if (period === "1m") return 30;
  if (period === "3m") return 90;
  if (period === "6m") return 180;
  return parseInt(String(query.days || ""), 10) || 30;
}

analyticsRouter.get("/trends/:coupleId", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res) => {
  try {
    const { coupleId } = req.params;
    const days = parseTrendsDays(req.query as Record<string, unknown>);
    const trends = await getTrends(coupleId, days);
    return res.json(trends);
  } catch (err) {
    logger.error("Ошибка получения аналитики трендов", err);
    return res.status(500).json({ error: "Не удалось получить аналитику трендов" });
  }
});

analyticsRouter.get("/insights/:coupleId", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res) => {
  try {
    const { coupleId } = req.params;
    const insights = await fetchAiInsights(coupleId);
    return res.json({ insights });
  } catch (err) {
    logger.error("Ошибка получения инсайтов ИИ", err);
    return res.status(500).json({ error: "Не удалось получить инсайты" });
  }
});

analyticsRouter.post("/insights/generate", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    let resolvedCoupleId: string | undefined = req.couple?.id || (req.body?.coupleId ? String(req.body.coupleId) : undefined);
    if (!resolvedCoupleId) {
      const user = await findUserByLogin(userLogin);
      resolvedCoupleId = getPairKey(userLogin, user?.partnerLogin || null);
    }
    const contextData = {
      p1Name: req.body?.p1Name || "Партнёр 1",
      p2Name: req.body?.p2Name || "Партнёр 2",
      ...(req.body?.contextData || {}),
    };
    const insight = await generateWeeklyInsight(resolvedCoupleId, contextData);
    return res.json({ insight });
  } catch (err) {
    logger.error("Ошибка генерации недельного инсайта", err);
    return res.status(500).json({ error: "Ошибка генерации инсайта" });
  }
});

analyticsRouter.get("/couple-report/:coupleId", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { coupleId } = req.params;
    const result = await getDetailedCoupleAnalytics(coupleId, req.user?.login);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка получения couple-report", err);
    return res.status(500).json({ error: "Не удалось получить отчет пары" });
  }
});

analyticsRouter.get("/detailed/:coupleId", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { coupleId } = req.params;
    const result = await getDetailedCoupleAnalytics(coupleId, req.user?.login);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка получения detailed analytics", err);
    return res.status(500).json({ error: "Не удалось получить детальную аналитику" });
  }
});

analyticsRouter.get("/psych-profiles/:coupleId", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { coupleId } = req.params;
    const profiles = await getUserPsychProfiles(coupleId);
    return res.json({ profiles });
  } catch (err) {
    logger.error("Ошибка получения psych-profiles", err);
    return res.status(500).json({ error: "Не удалось получить профили" });
  }
});
