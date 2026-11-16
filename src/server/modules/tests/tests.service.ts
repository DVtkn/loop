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
import { readEmergencyFile, writeEmergencyFile, findUserByLogin } from "../../services/storageService.ts";

const isProd = () => process.env.NODE_ENV === "production";

export function normalizeDraftAnswersMap(
  raw: Record<string, unknown> | Array<{ questionId: string; value: unknown }> | null | undefined
): Record<string, unknown> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out: Record<string, unknown> = {};
    for (const item of raw) {
      if (item && typeof item.questionId === "string") {
        out[item.questionId] = item.value;
      }
    }
    return out;
  }
  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

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
  const cleanLogin = clean(userLogin);
  if (!cleanLogin) return "";
  if (isSqlConfigured() && db) {
    try {
      const [u] = await db
        .select({ login: users.login, partnerLogin: users.partnerLogin })
        .from(users)
        .where(eq(users.login, cleanLogin));
      if (u) {
        if (!u.partnerLogin) return clean(u.login);
        return [clean(u.login), clean(u.partnerLogin)].sort().join("_");
      }
    } catch {
      if (isProd()) throw new DatabaseUnavailableError();
    }
  }
  const fallbackUser = await findUserByLogin(cleanLogin);
  if (!fallbackUser?.partnerLogin) return cleanLogin;
  return [cleanLogin, clean(fallbackUser.partnerLogin)].sort().join("_");
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

      // 4. Очистка возможных незавершённых ответов в текущей сессии + пакетная вставка
      await tx.delete(testAnswers).where(
        and(eq(testAnswers.sessionId, sessionId), eq(testAnswers.userId, userId))
      );

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
      await _recalculateUserProfile(tx, coupleId, userId, testId, sessionId);

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

  // Dev / Test fallback (без SQL)
  const cleanLogin = userLogin.toLowerCase().trim().replace(/^@/, "");
  const store = readEmergencyFile();
  if (!store.testSessions) store.testSessions = [];
  if (!store.testAnswers) store.testAnswers = [];
  if (!store.userPsychProfiles) store.userPsychProfiles = {};
  if (!store.coupleReports) store.coupleReports = {};
  if (!store.testDrafts) store.testDrafts = {};

  const sessionId = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  store.testSessions.push({
    id: sessionId,
    testId,
    coupleId,
    testClass: "couple",
    status: "completed",
    completedAt: nowIso,
  });

  // Заменяем предыдущие ответы этого же пользователя на этот тест в этой паре
  const existingSessionIds = new Set(
    store.testSessions.filter((s) => s.coupleId === coupleId && s.testId === testId).map((s) => s.id)
  );
  store.testAnswers = store.testAnswers.filter(
    (a) => !(a.userId === cleanLogin && existingSessionIds.has(a.sessionId))
  );
  for (const a of answers) {
    store.testAnswers.push({
      id: crypto.randomUUID(),
      sessionId,
      userId: cleanLogin,
      questionId: a.questionId,
      selectedValue: String(a.value),
      scaleId: a.scaleId ?? null,
      weight: "1.00",
      reactionTimeMs: a.reactionTimeMs ?? null,
      toggleCount: a.toggleCount ?? 0,
      targetType: a.targetType ?? "self",
      rawPayload: a.rawPayload ?? null,
    });
  }

  delete store.testDrafts[`${cleanLogin}:${testId}`];

  const myCoupleSessions = new Set(
    store.testSessions.filter((s) => s.coupleId === coupleId && s.status === "completed").map((s) => s.id)
  );
  const myAllAnswers = store.testAnswers.filter((a) => a.userId === cleanLogin && myCoupleSessions.has(a.sessionId));
  const profile = calculatePsychProfile(myAllAnswers);
  store.userPsychProfiles[cleanLogin] = {
    userId: cleanLogin,
    coupleId,
    sessionId,
    traitScores: profile.traitScores,
    dominantVectors: profile.dominantVectors,
    eSafety: String(profile.eSafety),
    aAutonomy: String(profile.aAutonomy),
    cCloseness: String(profile.cCloseness),
    rRepair: String(profile.rRepair),
    vFuture: String(profile.vFuture),
    consistencyScore: String(profile.consistencyScore),
    updatedAt: nowIso,
  };

  let harmonyState: { state: "PARTNER_PENDING" | "BOTH_COMPLETED" | "REPORT_GENERATED"; radar?: any } = {
    state: "PARTNER_PENDING",
  };
  const coupleUser = await findUserByLogin(cleanLogin);
  const partnerLogin = coupleUser?.partnerLogin?.toLowerCase().trim().replace(/^@/, "");
  if (partnerLogin) {
    const myCompletedIds = new Set(
      store.testSessions
        .filter((s) => s.coupleId === coupleId && s.status === "completed")
        .filter((s) => store.testAnswers!.some((a) => a.sessionId === s.id && a.userId === cleanLogin))
        .map((s) => s.testId)
    );
    const partnerCompletedIds = new Set(
      store.testSessions
        .filter((s) => s.coupleId === coupleId && s.status === "completed")
        .filter((s) => store.testAnswers!.some((a) => a.sessionId === s.id && a.userId === partnerLogin))
        .map((s) => s.testId)
    );
    const p1Done = CATALOG_TEST_IDS.every((id) => myCompletedIds.has(id));
    const p2Done = CATALOG_TEST_IDS.every((id) => partnerCompletedIds.has(id));
    if (p1Done && p2Done) {
      const p1Scales = store.userPsychProfiles[cleanLogin]?.traitScores;
      const p2Scales = store.userPsychProfiles[partnerLogin]?.traitScores;
      if (p1Scales?.s1 != null && p2Scales?.s1 != null) {
        const matrixResult = calculateCoupleMatrix(p1Scales, p2Scales);
        store.coupleReports[coupleId] = {
          id: crypto.randomUUID(),
          coupleId,
          radarMetrics: matrixResult.radar,
          archetypeTitle: matrixResult.archetype.title,
          archetypeDescription: matrixResult.archetype.description,
          leadSpheres: matrixResult.archetype.leadSpheres,
          synergyPoints: matrixResult.synergyPoints,
          growthZones: matrixResult.growthZones,
          blindSpots: matrixResult.destructivePatternsDetected,
          calculatedAt: nowIso,
        };
        harmonyState = { state: "REPORT_GENERATED", radar: matrixResult.radar };
      } else {
        harmonyState = { state: "BOTH_COMPLETED" };
      }
    }
  }

  writeEmergencyFile(store);
  return {
    status: "completed",
    testId,
    userId: cleanLogin,
    sessionId,
    answersCount: answers.length,
    harmonyState,
  };
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
  answers: Record<string, unknown> | Array<{ questionId: string; value: any }>
) {
  const normalizedAnswers = normalizeDraftAnswersMap(answers);

  if (!isSqlConfigured() || !db) {
    if (isProd()) throw new DatabaseUnavailableError();
    const cleanLogin = userLogin.toLowerCase().trim().replace(/^@/, "");
    const store = readEmergencyFile();
    if (!store.testDrafts) store.testDrafts = {};
    store.testDrafts[`${cleanLogin}:${testId}`] = {
      userId: cleanLogin,
      testId,
      currentQuestionIndex,
      answers: normalizedAnswers,
      updatedAt: new Date().toISOString(),
    };
    writeEmergencyFile(store);
    return { status: "saved", testId, currentQuestionIndex };
  }

  const [u] = await db.select().from(users).where(eq(users.login, userLogin));
  const userId = u ? u.id : userLogin;

  await db.insert(testDrafts).values({
    userId,
    testId,
    currentQuestionIndex,
    answers: normalizedAnswers,
  }).onConflictDoUpdate({
    target: [testDrafts.userId, testDrafts.testId],
    set: {
      currentQuestionIndex,
      answers: normalizedAnswers,
      updatedAt: new Date(),
    },
  });

  return { status: "saved", testId, currentQuestionIndex };
}

/** Получить черновик теста */
export async function getTestDraft(userLogin: string, testId: string) {
  if (!isSqlConfigured() || !db) {
    if (isProd()) return null;
    const cleanLogin = userLogin.toLowerCase().trim().replace(/^@/, "");
    const store = readEmergencyFile();
    const draft = store.testDrafts?.[`${cleanLogin}:${testId}`];
    if (!draft) return null;
    return { ...draft, answers: normalizeDraftAnswersMap(draft.answers) };
  }

  const [u] = await db.select().from(users).where(eq(users.login, userLogin));
  const userId = u ? u.id : userLogin;

  const [draft] = await db
    .select()
    .from(testDrafts)
    .where(and(eq(testDrafts.userId, userId), eq(testDrafts.testId, testId)))
    .limit(1);

  if (!draft) return null;
  return {
    ...draft,
    answers: normalizeDraftAnswersMap(draft.answers as any),
  };
}

/** Удалить черновик теста */
export async function clearTestDraft(userLogin: string, testId: string) {
  if (!isSqlConfigured() || !db) {
    if (isProd()) throw new DatabaseUnavailableError();
    const cleanLogin = userLogin.toLowerCase().trim().replace(/^@/, "");
    const store = readEmergencyFile();
    if (store.testDrafts) {
      delete store.testDrafts[`${cleanLogin}:${testId}`];
      writeEmergencyFile(store);
    }
    return { status: "cleared", testId };
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
  const cleanLogin = userLogin.toLowerCase().trim().replace(/^@/, "");
  if (!isSqlConfigured() || !db) {
    if (isProd()) {
      return CATALOG_TEST_IDS.map((testId) => ({
        testId,
        isCompletedByMe: false,
        isCompletedByPartner: false,
      }));
    }
    const store = readEmergencyFile();
    const u = await findUserByLogin(cleanLogin);
    const partnerLogin = u?.partnerLogin?.toLowerCase().trim().replace(/^@/, "");
    const coupleId = await resolveTestCoupleId(cleanLogin);
    const sessions = (store.testSessions || []).filter(
      (s) => s.status === "completed" && s.coupleId === coupleId
    );
    const answers = store.testAnswers || [];
    const mySet = new Set(
      sessions
        .filter((s) => answers.some((a) => a.sessionId === s.id && a.userId === cleanLogin))
        .map((s) => s.testId)
    );
    const partnerSet = new Set(
      partnerLogin
        ? sessions
            .filter((s) => answers.some((a) => a.sessionId === s.id && a.userId === partnerLogin))
            .map((s) => s.testId)
        : []
    );
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: mySet.has(testId),
      isCompletedByPartner: partnerSet.has(testId),
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
    .selectDistinct({ testId: testSessions.testId })
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
    .selectDistinct({ testId: testSessions.testId })
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
   testId: string,
   sessionId: string
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
     sessionId,
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
export async function _triggerCoupleReportIfReady(
  tx: any,
  coupleId: string,
  userId: string
): Promise<{ state: "PARTNER_PENDING" | "BOTH_COMPLETED" | "REPORT_GENERATED"; radar?: any }> {
  if (!tx || !coupleId || !userId) {
    return { state: "PARTNER_PENDING" };
  }
  // Проверяем, прошли ли оба пользователя все тесты из реестра (selectDistinct предотвращает загрузку всех ответов на каждый вопрос)
  const tests = await tx
    .selectDistinct({ testId: testSessions.testId, userId: testAnswers.userId })
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