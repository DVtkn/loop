import { db } from '../db/client.ts';
import { relationshipMetrics } from '../db/schema.ts';
import { sql, eq, and, gte } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../core/logger.ts";

/**
 * Parses couple data and records daily metrics to the database.
 * Designed to be idempotent (UPSERTs based on coupleId and metricDate).
 */
export async function recordDailyMetrics(coupleId: string, metricDate: string, data: any) {
  try {
    // Basic fallback initialization
    let moodAverage = null;
    let moodEntriesCount = 0;
    let interactionCount = 0;
    let quizCompleted = false;
    let streakDays = 0;
    let radarScores = {
      trust: 50,
      communication: 50,
      passion: 50,
      sharedValues: 50,
      care: 50,
      dailyLife: 50
    };

    if (data) {
      // Aggregate mood
      if (Array.isArray(data.moodHistory)) {
        // filter today's moods
        const todayMoods = data.moodHistory.filter((m: any) => m.date === metricDate);
        moodEntriesCount = todayMoods.length;
        if (moodEntriesCount > 0) {
          moodAverage = todayMoods.reduce((acc: number, m: any) => acc + (m.score || 5), 0) / moodEntriesCount;
        }
      }

      // Interaction count (pulse history + date invites + chat)
      const pulses = Array.isArray(data.pulseHistory) ? data.pulseHistory.filter((p: any) => p.date === metricDate).length : 0;
      interactionCount = pulses;

      // Quiz completed
      if (data.dailyQuiz && data.dailyQuiz.id === metricDate) {
        quizCompleted = !!(data.dailyQuiz.partner1Answer || data.dailyQuiz.partner2Answer);
      }

      // Streak
      if (data.ranking) {
        streakDays = data.ranking.streakDays || 0;
      }
      
      // Calculate radar heuristics (simplified version of the frontend logic for history points)
      // Usually would deeply mirror frontend logic, here we extract key signals.
      const tests = Array.isArray(data.tests) ? data.tests : [];
      const testDoneCount = tests.filter((t: any) => t.partner1Done || t.partner2Done).length;
      
      radarScores = {
        trust: Math.min(100, 50 + testDoneCount * 5 + (moodAverage ? moodAverage * 2 : 0)),
        communication: Math.min(100, 50 + interactionCount * 10),
        passion: Math.min(100, 50 + (quizCompleted ? 10 : 0)),
        sharedValues: 60 + testDoneCount * 3,
        care: Math.min(100, 50 + (data.smallCravings?.filter((c: any) => c.fulfilled).length || 0) * 5),
        dailyLife: Math.min(100, 50 + (data.dateInvites?.filter((d: any) => d.status === 'CONFIRMED').length || 0) * 10)
      };
    }

    if (!db) {
       // Cloud SQL not configured, using fallback
       return;
    }

    // Insert into Cloud SQL with UPSERT (ON CONFLICT DO UPDATE)
    await db.insert(relationshipMetrics)
      .values({
        id: crypto.randomUUID(),
        coupleId,
        metricDate,
        radarScores,
        moodAverage,
        moodEntriesCount,
        interactionCount,
        quizCompleted,
        streakDays,
        createdAt: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: [relationshipMetrics.coupleId, relationshipMetrics.metricDate],
        set: {
          radarScores,
          moodAverage,
          moodEntriesCount,
          interactionCount,
          quizCompleted,
          streakDays,
        }
      });
      
    logger.info(`Recorded daily metrics for ${coupleId} on ${metricDate}`);
  } catch (err: any) {
    logger.info(`Failed to record daily metrics for ${coupleId}: ${err.message}`);
  }
}


/**
 * Retrieves the relationship metric trends for a given couple over a specified period.
 */
export async function getTrends(coupleId: string, periodDays: number) {
  if (!db) return []; // Fallback for no-db

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - periodDays);
  const dateString = pastDate.toISOString().split('T')[0];

  try {
    const records = await db.select()
      .from(relationshipMetrics)
      .where(and(
        eq(relationshipMetrics.coupleId, coupleId),
        gte(relationshipMetrics.metricDate, dateString)
      ))
      .orderBy(relationshipMetrics.metricDate);
      
    return records;
  } catch (err: any) {
    logger.info(`Failed to fetch trends for ${coupleId}: ${err.message}`);
    return [];
  }
}
