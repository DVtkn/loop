import { desc, eq, inArray } from "drizzle-orm";
import { db, isSqlConfigured } from "../../db/client.ts";
import { aiInsights, coupleReports, userPsychProfiles, couples, users, testSessions, testAnswers } from "../../db/schema.ts";
import { recordDailyMetrics, getTrends } from "../../analytics.ts";
import { generateWeeklyInsight } from "../../insights.ts";
import { CATALOG_TEST_IDS } from "../tests/tests.service.ts";

export { recordDailyMetrics, getTrends, generateWeeklyInsight };

export async function fetchAiInsights(coupleId: string) {
  if (!isSqlConfigured() || !db) {
    return [];
  }

  const insights = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.coupleId, coupleId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(10);

  return insights;
}

export async function getCoupleReport(coupleId: string) {
  if (!isSqlConfigured() || !db) {
    return null;
  }

  const [report] = await db
    .select()
    .from(coupleReports)
    .where(eq(coupleReports.coupleId, coupleId))
    .limit(1);

  return report || null;
}

export async function getUserPsychProfiles(coupleId: string) {
  if (!isSqlConfigured() || !db) {
    return [];
  }

  const profiles = await db
    .select()
    .from(userPsychProfiles)
    .where(eq(userPsychProfiles.coupleId, coupleId));

  return profiles;
}

export interface DetailedCoupleAnalyticsResponse {
  isCoupleReportReady: boolean;
  completedTestsCount: number;
  totalTestsCount: number;
  waitingFor: string | null;
  userProfile: any | null;
  coupleReport: any | null;
  archetype: string | null;
  overallMatchPercentage: number | null;
  profiles: any[];
}

export async function getDetailedCoupleAnalytics(
  coupleId: string,
  currentUserIdOrLogin?: string
): Promise<DetailedCoupleAnalyticsResponse> {
  if (!isSqlConfigured() || !db) {
    return {
      isCoupleReportReady: false,
      completedTestsCount: 0,
      totalTestsCount: CATALOG_TEST_IDS.length,
      waitingFor: null,
      userProfile: null,
      coupleReport: null,
      archetype: null,
      overallMatchPercentage: null,
      profiles: [],
    };
  }

  // 1. Fetch couple data
  const [couple] = await db.select().from(couples).where(eq(couples.id, coupleId)).limit(1);

  // 2. Fetch profiles and report
  const profiles = await db
    .select()
    .from(userPsychProfiles)
    .where(eq(userPsychProfiles.coupleId, coupleId));

  const [report] = await db
    .select()
    .from(coupleReports)
    .where(eq(coupleReports.coupleId, coupleId))
    .limit(1);


  // 3. Fetch completed sessions by me
  let completedTestsCount = 0;
  if (currentUserIdOrLogin) {
    const allUsers = await db.select().from(users);
    const currentUser = allUsers.find((u) => u.id === currentUserIdOrLogin || u.login === currentUserIdOrLogin);
    
    if (currentUser) {
      const userCompletedSessions = await db
        .select({ testId: testSessions.testId })
        .from(testSessions)
        .innerJoin(testAnswers, eq(testAnswers.sessionId, testSessions.id))
        .where(eq(testAnswers.userId, currentUser.id))
        .groupBy(testSessions.testId);
      
      completedTestsCount = userCompletedSessions.length;
    }
  }


  // 4. Identify partner names
  const allUsers = await db.select().from(users);
  let currentUser = allUsers.find((u) => u.id === currentUserIdOrLogin || u.login === currentUserIdOrLogin);
  let partnerUser: typeof currentUser | undefined;

  if (couple) {
    if (currentUser?.id === couple.user1Id) {
      partnerUser = allUsers.find((u) => u.id === couple.user2Id);
    } else if (currentUser?.id === couple.user2Id) {
      partnerUser = allUsers.find((u) => u.id === couple.user1Id);
    } else {
      currentUser = allUsers.find((u) => u.id === couple.user1Id);
      partnerUser = allUsers.find((u) => u.id === couple.user2Id);
    }
  }

  const currentUserProfile = currentUser
    ? profiles.find((p) => p.userId === currentUser?.id) || profiles[0] || null
    : profiles[0] || null;

  const partnerProfile = partnerUser
    ? profiles.find((p) => p.userId === partnerUser?.id)
    : profiles.length >= 2
    ? profiles[1]
    : null;

  const partnerName = partnerUser?.name || partnerUser?.login || 'Партнёр';

  // Strict check: Report is ready ONLY if report exists in DB AND both psych profiles exist
  const isReady = Boolean(report && profiles.length >= 2 && partnerProfile);

  if (!isReady || !report) {
    return {
      isCoupleReportReady: false,
      completedTestsCount: completedTestsCount || (profiles.length > 0 ? 1 : 0),
      totalTestsCount: CATALOG_TEST_IDS.length,
      waitingFor: partnerProfile ? null : partnerName,
      userProfile: currentUserProfile,
      coupleReport: null,
      archetype: null,
      overallMatchPercentage: null,
      profiles,
    };
  }

  // Calculate overall match percentage from radar metrics
  const radar = (report.radarMetrics as any) || {};
  const sphereKeys = ['trust', 'closeness', 'communication', 'values', 'intimacy', 'lifestyle'];
  const validScores = sphereKeys.map((k) => Number(radar[k] || 0)).filter((s) => s > 0);
  const overallMatch = validScores.length
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 85;

  return {
    isCoupleReportReady: true,
    completedTestsCount: completedTestsCount || CATALOG_TEST_IDS.length,
    totalTestsCount: CATALOG_TEST_IDS.length,
    waitingFor: null,
    userProfile: currentUserProfile,
    coupleReport: report,
    archetype: report.archetypeTitle,
    overallMatchPercentage: overallMatch,
    profiles,
  };
}
