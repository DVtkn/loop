import crypto from "crypto";
import { eq, sql, and, or, inArray, ne, count } from "drizzle-orm";
import { db, isSqlConfigured } from "../../db/client.ts";
import { testSessions, testAnswers, couples, coupleData, users, userPsychProfiles, coupleReports, testDrafts } from "../../db/schema.ts";
import { TESTS_REGISTRY, getSphereByTestId, TEST_REGISTRY_ENTRIES } from "@/src/shared/tests.registry.ts";
import { logger } from "../../shared/utils/logger.ts";
import { DatabaseUnavailableError } from "../../shared/errors/index.ts";
import { calculatePsychProfile } from "./psychometrics.calc.ts";
import { calculateCoupleMatrix } from "./couple-matrix.calc.ts";
import { calculateCoupleRadarMatrix, CoupleRadarResult } from "./report.matrix.ts";

/** Единый реестр всех тестов — источник правды (SSOT). */
export { TESTS_REGISTRY, getSphereByTestId, TEST_REGISTRY_ENTRIES };

export const CATALOG_TEST_IDS = Object.keys(TESTS_REGISTRY);

export const EXPECTED_QUESTIONS = Object.fromEntries(
  Object.entries(TESTS_REGISTRY as Record<string, TestDefinition>).map(([id, def]) => [id, def.totalQuestions])
);

/**
 * Канонический coupleId для тестов — строго из JWT-логина через users.partnerLogin
 * (таблица couples не используется), без доверия client-supplied coupleId.
 * Одиночка: собственный логин.
 */
export async function resolveTestCoupleId(userLogin: string): Promise<string> {
  const clean = (s: string) => s.toLowerCase().trim().replace(/^@/, "");
  if (!isSqlConfigured() || !db) return clean(userLogin);
  const [u] = await db
    .select({ login: users.login, partnerLogin: users.partnerLogin })
    .from(users)
    .where(eq(users.login, userLogin));
  if (!u) return clean(userLogin);
  if (!u.partnerLogin) return clean(u.login);
  return [clean(u.login), clean(u.partnerLogin)].sort().join("_");
}

export interface TestDefinition {
  id: string;
  title: string;
  sphere: "trust" | "closeness" | "communication" | "values" | "intimacy" | "lifestyle";
  totalQuestions: number;
}

export interface SubmitAnswerItem {
  questionId: string;
  value: any;
  scaleId?: string | null;
  reactionTimeMs?: number | null;
  toggleCount?: number | null;
  targetType?: string | null;
  rawPayload?: any;
}

/**
 * Атомарная отправка ответов теста с валидацией из реестра.
 * Гарантирует: userId из JWT, проверка кол-ва ответов, транзакция, draft cleanup, профиль, отчет.
 */
export async function atomicSubmitTestAnswers(
  testId: string,
  coupleId: string,
  userLogin: string,
  answers: SubmitAnswerItem[]
) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (!isSqlConfigured() || !db)) {
    throw new DatabaseUnavailableError();
  }

  // 1. Строгая валидация через реестр
  const testDef = TESTS_REGISTRY[testId];
  if (!testDef) {
    throw new Error(`Unknown testId: ${testId}`);
  }
  if (answers.length !== testDef.totalQuestions) {
    const missing = testDef.totalQuestions - answers.length;
    throw new Error(
      `ValidationFailed: Expected ${testDef.totalQuestions} answers for "${testDef.title}", got ${answers.length}. Missing ${missing} question(s).`
    );
  }

  if (isSqlConfigured() && db) {
    return await db.transaction(async (tx) => {
      // 2. userId берётся строго из JWT
      const [u] = await tx.select().from(users).where(eq(users.login, userLogin));
      const userId = u ? u.id : userLogin;

      // 3. Находим/создаём сессию in_progress
      let session = await tx
        .select()
        .from(testSessions)
        .where(
          and(
            eq(testSessions.coupleId, coupleId),
            eq(testSessions.testId, testId),
            eq(testSessions.status, "in_progress")
          )
        )
        .limit(1);

      if (!session.length) {
        const newSessionId = crypto.randomUUID();
        const [created] = await tx
          .insert(testSessions)
          .values({
            id: newSessionId,
            testId,
            coupleId,
            testClass: "couple",
            status: "in_progress",
          })
          .returning();
        session = [created];
      }
      const sessionId = session[0].id;

      // 4. Пакетная вставка ответов (с метаданными шкалы и сырым payload)
      const answerRecords = answers.map((a) => ({
        id: crypto.randomUUID(),
        sessionId,
        userId,
        questionId: a.questionId,
        selectedValue: String(a.value),
        scaleId: a.scaleId ?? null,
        weight: "1.00",
        reactionTimeMs: a.reactionTimeMs ?? null,
        toggleCount: a.toggleCount ?? 0,
        targetType: a.targetType ?? "self",
        rawPayload: a.rawPayload ?? null,
      }));
      await tx.insert(testAnswers).values(answerRecords);

      // 5. Удаляем черновик этого теста у этого пользователя
      await tx.delete(testDrafts).where(
        and(eq(testDrafts.userId, userId), eq(testDrafts.testId, testId))
      );

      // 6. Пересчёт психопрофиля пользователя (24 шкалы)
      await _recalculateUserProfile(tx, coupleId, userId, testId);

      // 7. Помечаем сессию завершённой (до триггера, иначе последний сабмит не засчитается)
      await tx.update(testSessions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(testSessions.id, sessionId));

      // 8. Триггер отчета о паре (проверка и запись coupleReport)
      const triggerResult = await _triggerCoupleReportIfReady(tx, coupleId, userId);

      return {
        status: "completed",
        testId,
        userId,
        sessionId,
        answersCount: answers.length,
        harmonyState: triggerResult,
      };
    });
  }

  // Dev fallback
  return { status: "recorded_locally", testId, message: "Dev mode: no DB" };
}

/** Инкрементальная отправка ответа (для режима вопрос-за-вопросом) */
export async function submitTestAnswer(
  params: {
    sessionId?: string;
    testId: string;
    coupleId: string;
    userLogin: string;
    questionId: string;
    selectedValue?: string | number;
    expectedQuestionsCount?: number;
    reactionTimeMs?: number | null;
    toggleCount?: number | null;
    targetType?: string | null;
    rawPayload?: any;
  }
) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (!isSqlConfigured() || !db)) {
    throw new DatabaseUnavailableError();
  }

  const testDef = TESTS_REGISTRY[params.testId];
  if (!testDef) {
    throw new Error(`Unknown testId: ${params.testId}`);
  }

  if (isSqlConfigured() && db) {
    return await db.transaction(async (tx) => {
      const [u] = await tx.select().from(users).where(eq(users.login, params.userLogin));
      const userId = u ? u.id : params.userLogin;

      let sessionId = params.sessionId;
      if (!sessionId) {
        let session = await tx
          .select()
          .from(testSessions)
          .where(
            and(
              eq(testSessions.coupleId, params.coupleId),
              eq(testSessions.testId, params.testId),
              eq(testSessions.status, "in_progress")
            )
          )
          .limit(1);

        if (!session.length) {
          const newSessionId = crypto.randomUUID();
          const [created] = await tx
            .insert(testSessions)
            .values({
              id: newSessionId,
              testId: params.testId,
              coupleId: params.coupleId,
              testClass: "couple",
              status: "in_progress",
            })
            .returning();
          session = [created];
        }
        sessionId = session[0].id;
      }

      // Upsert ответа (on conflict update)
      await tx.insert(testAnswers).values({
        id: crypto.randomUUID(),
        sessionId,
        userId,
        questionId: params.questionId,
        selectedValue: String(params.selectedValue ?? ""),
        weight: "1.00",
        reactionTimeMs: params.reactionTimeMs ?? null,
        toggleCount: params.toggleCount ?? 0,
        targetType: params.targetType ?? "self",
        rawPayload: params.rawPayload ?? null,
      }).onConflictDoUpdate({
        target: [testAnswers.sessionId, testAnswers.userId, testAnswers.questionId],
        set: {
          selectedValue: String(params.selectedValue ?? ""),
          reactionTimeMs: params.reactionTimeMs ?? null,
          toggleCount: params.toggleCount ?? 0,
          targetType: params.targetType ?? "self",
          rawPayload: params.rawPayload ?? null,
        },
      });

      return {
        status: "answer_recorded",
        testId: params.testId,
        userId,
        sessionId,
        questionId: params.questionId,
      };
    });
  }

  return { status: "recorded_locally", testId: params.testId, message: "Dev mode: no DB" };
}

/** Сохранить черновик теста */
export async function saveTestDraft(
  userLogin: string,
  testId: string,
  currentQuestionIndex: number,
  answers: Array<{ questionId: string; value: any }>
) {
  if (!isSqlConfigured() || !db) {
    return { status: "saved_locally", message: "Dev mode: no DB" };
  }

  const [u] = await db.select().from(users).where(eq(users.login, userLogin));
  const userId = u ? u.id : userLogin;

  await db.insert(testDrafts).values({
    userId,
    testId,
    currentQuestionIndex,
    answers,
  }).onConflictDoUpdate({
    target: [testDrafts.userId, testDrafts.testId],
    set: {
      currentQuestionIndex,
      answers,
      updatedAt: new Date(),
    },
  });

  return { status: "saved", testId, currentQuestionIndex };
}

/** Получить черновик теста */
export async function getTestDraft(userLogin: string, testId: string) {
  if (!isSqlConfigured() || !db) {
    return null;
  }

  const [u] = await db.select().from(users).where(eq(users.login, userLogin));
  const userId = u ? u.id : userLogin;

  const [draft] = await db
    .select()
    .from(testDrafts)
    .where(and(eq(testDrafts.userId, userId), eq(testDrafts.testId, testId)))
    .limit(1);

  return draft ?? null;
}

/** Удалить черновик теста */
export async function clearTestDraft(userLogin: string, testId: string) {
  if (!isSqlConfigured() || !db) {
    return { status: "cleared_locally", message: "Dev mode: no DB" };
  }

  const [u] = await db.select().from(users).where(eq(users.login, userLogin));
  const userId = u ? u.id : userLogin;

  await db.delete(testDrafts).where(
    and(eq(testDrafts.userId, userId), eq(testDrafts.testId, testId))
  );

  return { status: "cleared", testId };
}

/** Получить статусы тестов для пользователя */
export async function getTestsStatusForUser(userLogin: string) {
  if (!isSqlConfigured() || !db) {
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: false,
      isCompletedByPartner: false,
    }));
  }

  const [u] = await db.select().from(users).where(eq(users.login, userLogin));
  if (!u) return [];

  const userId = u.id;

  // Партнёр — строго через users.partnerLogin (таблица couples не используется)
  if (!u.partnerLogin) {
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: false,
      isCompletedByPartner: false,
    }));
  }

  const [partner] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.login, u.partnerLogin));

  const partnerId = partner?.id;

  if (!partnerId) {
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: false,
      isCompletedByPartner: false,
    }));
  }

  const coupleId = await resolveTestCoupleId(userLogin);

  // Получаем завершенные тесты пользователя (в рамках текущей пары)
  const myCompleted = await db
    .select({ testId: testSessions.testId })
    .from(testSessions)
    .innerJoin(testAnswers, eq(testAnswers.sessionId, testSessions.id))
    .where(
      and(
        eq(testAnswers.userId, userId),
        eq(testSessions.status, "completed"),
        eq(testSessions.coupleId, coupleId)
      )
    );

  // Получаем завершенные тесты партнера (в рамках текущей пары)
  const partnerCompleted = await db
    .select({ testId: testSessions.testId })
    .from(testSessions)
    .innerJoin(testAnswers, eq(testAnswers.sessionId, testSessions.id))
    .where(
      and(
        eq(testAnswers.userId, partnerId),
        eq(testSessions.status, "completed"),
        eq(testSessions.coupleId, coupleId)
      )
    );

  const mySet = new Set(myCompleted.map((r) => r.testId));
  const partnerSet = new Set(partnerCompleted.map((r) => r.testId));

  return CATALOG_TEST_IDS.map((testId) => ({
    testId,
    isCompletedByMe: mySet.has(testId),
    isCompletedByPartner: partnerSet.has(testId),
  }));
}

/** Пересчёт психопрофиля пользователя (24 шкалы) через настоящий движок */
async function _recalculateUserProfile(
  tx: any,
  coupleId: string,
  userId: string,
  testId: string
) {
  // Получаем ВСЕ ответы пользователя по текущей паре (не только этот тест) —
  // профиль строится кумулятивно из всех пройденных им модулей.
  const rows = await tx
    .select({
      answers: testAnswers,
    })
    .from(testAnswers)
    .innerJoin(testSessions, eq(testAnswers.sessionId, testSessions.id))
    .where(and(eq(testAnswers.userId, userId), eq(testSessions.coupleId, coupleId)));

  if (!rows.length) return;

  const rawForEngine = rows.map((r: any) => ({
    questionId: r.answers.questionId,
    selectedValue: r.answers.selectedValue,
    weight: r.answers.weight,
    reactionTimeMs: r.answers.reactionTimeMs,
    toggleCount: r.answers.toggleCount,
    targetType: r.answers.targetType,
    rawPayload: r.answers.rawPayload,
  }));

  // Запускаем движок 24 шкал
  const profile = calculatePsychProfile(rawForEngine);

  // Upsert профиля — храним полные 24 шкалы + 5 мета-векторов
  await tx.insert(userPsychProfiles).values({
    userId,
    coupleId,
    sessionId: "",
    traitScores: profile.traitScores,
    dominantVectors: profile.dominantVectors,
    eSafety: String(profile.eSafety),
    aAutonomy: String(profile.aAutonomy),
    cCloseness: String(profile.cCloseness),
    rRepair: String(profile.rRepair),
    vFuture: String(profile.vFuture),
    consistencyScore: String(profile.consistencyScore),
    rawResponses: rawForEngine,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [userPsychProfiles.userId],
    set: {
      traitScores: profile.traitScores,
      dominantVectors: profile.dominantVectors,
      eSafety: String(profile.eSafety),
      aAutonomy: String(profile.aAutonomy),
      cCloseness: String(profile.cCloseness),
      rRepair: String(profile.rRepair),
      vFuture: String(profile.vFuture),
      consistencyScore: String(profile.consistencyScore),
      rawResponses: rawForEngine,
      updatedAt: new Date(),
    },
  });
}

/** Триггер: проверка готовности couple report и расчёт радара */
async function _triggerCoupleReportIfReady(
  tx: any,
  coupleId: string,
  userId: string
): Promise<{ state: "PARTNER_PENDING" | "BOTH_COMPLETED" | "REPORT_GENERATED"; radar?: any }> {
  // Проверяем, прошли ли оба пользователя все тесты из реестра
  const tests = await tx
    .select({ testId: testSessions.testId, userId: testAnswers.userId })
    .from(testSessions)
    .innerJoin(testAnswers, eq(testAnswers.sessionId, testSessions.id))
    .where(and(eq(testSessions.coupleId, coupleId), eq(testSessions.status, "completed")));

  const completedByUser = new Map<string, Set<string>>();
  for (const row of tests) {
    const { testId, userId: uId } = row;
    if (!completedByUser.has(uId)) completedByUser.set(uId, new Set());
    completedByUser.get(uId)!.add(testId);
  }

  const allTestIds = CATALOG_TEST_IDS;
  const userIds = Array.from(completedByUser.keys());

  if (userIds.length < 2) {
    return { state: "PARTNER_PENDING" };
  }

  const [user1Tests, user2Tests] = [completedByUser.get(userIds[0]), completedByUser.get(userIds[1])];
  const user1Complete = allTestIds.every((t) => user1Tests?.has(t));
  const user2Complete = allTestIds.every((t) => user2Tests?.has(t));

  if (!user1Complete || !user2Complete) {
    return { state: "PARTNER_PENDING" };
  }

  // Оба прошли все тесты — считаем 6-сферный радар из полных 24-шкальных профилей
  const [profile1, profile2] = await Promise.all([
    tx.select().from(userPsychProfiles).where(eq(userPsychProfiles.userId, userIds[0])).limit(1),
    tx.select().from(userPsychProfiles).where(eq(userPsychProfiles.userId, userIds[1])).limit(1),
  ]);

  const scales1 = profile1[0]?.traitScores as Record<string, number> | undefined;
  const scales2 = profile2[0]?.traitScores as Record<string, number> | undefined;

  if (!scales1 || !scales2 || scales1.s1 == null || scales2.s1 == null) {
    return { state: "BOTH_COMPLETED" }; // профили еще не готовы
  }

  const matrixResult = calculateCoupleMatrix(scales1 as any, scales2 as any);

  // Big Five из 24-шкальных профилей (маппинг см. psychometrics.calc Module 7)
  const toPercent = (v: number | undefined) => Math.round(Math.min(100, Math.max(0, v ?? 50)));
  const bigFive = (s: Record<string, number>) => ({
    extraversion: toPercent(s.s23),
    agreeableness: toPercent(s.s5),
    conscientiousness: toPercent(s.s21),
    emotionalStability: toPercent(s.s12),
    openness: toPercent(s.s24),
  });

  // Сохраняем/обновляем coupleReport (6 сфер + архетип)
  const reportValues = {
    coupleId,
    sessionId: "",
    radarMetrics: matrixResult.radar,
    radarTrust: String(matrixResult.radar.trust),
    radarCloseness: String(matrixResult.radar.closeness),
    radarCommunication: String(matrixResult.radar.communication),
    radarIntimacy: String(matrixResult.radar.intimacy),
    radarValues: String(matrixResult.radar.values),
    radarLifestyle: String(matrixResult.radar.lifestyle),
    archetypeTitle: matrixResult.archetype.title,
    archetypeDescription: matrixResult.archetype.description,
    leadSpheres: matrixResult.archetype.leadSpheres,
    synergyPoints: matrixResult.synergyPoints,
    growthZones: matrixResult.growthZones,
    blindSpots: matrixResult.destructivePatternsDetected,
    personalityTypes: { partner1: bigFive(scales1!), partner2: bigFive(scales2!) },
    calculatedAt: new Date(),
  };

  await tx.insert(coupleReports).values({
    ...reportValues,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  }).onConflictDoUpdate({
    target: [coupleReports.coupleId],
    set: reportValues,
  });

  return { state: "REPORT_GENERATED", radar: matrixResult.radar };
}