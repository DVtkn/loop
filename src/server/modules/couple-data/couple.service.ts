import { getCoupleData, saveCoupleData, mergeCoupleData } from "../../services/storageService.ts";
import { recordDailyMetrics } from "../../services/analytics.ts";
import { computeCoupleRatingAnalytics } from "../../../utils/rankingEngine.ts";
import { logger } from "../../shared/utils/logger.ts";
import { sendSSEEventToUser } from "../../shared/utils/sse.ts";

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
