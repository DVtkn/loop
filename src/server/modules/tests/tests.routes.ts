import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { requirePairOwnership } from "../../shared/middleware/requirePairOwnership.ts";
import {
  atomicSubmitTestAnswers,
  resolveTestCoupleId,
  submitTestAnswer,
  getTestsStatusForUser,
  CATALOG_TEST_IDS,
  EXPECTED_QUESTIONS,
  saveTestDraft,
  getTestDraft,
  clearTestDraft,
} from "./tests.service.ts";
import { getSphereByTestId } from "@/src/shared/tests.registry.ts";
import { logger } from "../../shared/utils/logger.ts";

export const testsRouter = Router();

testsRouter.get("/status", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const statuses = await getTestsStatusForUser(userLogin);
    return res.status(200).json({
      success: true,
      statuses,
    });
  } catch (err) {
    logger.error("Ошибка получения статусов тестов", err);
    next(err);
  }
});

testsRouter.get("/overview", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const statuses = await getTestsStatusForUser(userLogin);
    // Маппим сферу через реестр
    const testsWithSphere = statuses.map((s) => ({
      ...s,
      sphere: getSphereByTestId(s.testId) || "unknown",
    }));

    // Маппим в формат контрактного ответа
    const overview = {
      totalTests: statuses.length,
      myCompletedCount: statuses.filter((s) => s.isCompletedByMe).length,
      partnerCompletedCount: statuses.filter((s) => s.isCompletedByPartner).length,
      isCoupleReportReady: statuses.every(
        (s) => s.isCompletedByMe && s.isCompletedByPartner
      ),
      tests: testsWithSphere.map((s) => ({
        id: s.testId,
        sphere: s.sphere,
        isCompletedByMe: s.isCompletedByMe,
        isCompletedByPartner: s.isCompletedByPartner,
        myDraft: null,
      })),
    };

    return res.status(200).json({
      success: true,
      ...overview,
    });
  } catch (err) {
    logger.error("Ошибка получения обзора тестов", err);
    next(err);
  }
});

testsRouter.get("/catalog", requireAuth, async (_req, res) => {
  return res.status(200).json({
    success: true,
    testIds: CATALOG_TEST_IDS,
    expectedQuestions: EXPECTED_QUESTIONS,
  });
});

/** Атомарная отправка всего теста (все ответы сразу) */
testsRouter.post(
  "/submit",
  requireAuth,
  requirePairOwnership,
  validateBody(
    z.object({
      testId: z.string().min(1),
      answers: z.array(
        z.object({
          questionId: z.string(),
          value: z.union([z.string(), z.number()]),
          scaleId: z.string().max(64).nullish(),
          reactionTimeMs: z.number().int().nonnegative().nullish(),
          toggleCount: z.number().int().nonnegative().nullish(),
          targetType: z.enum(["self", "partner_observation"]).nullish(),
          rawPayload: z.record(z.string(), z.unknown()).nullish(),
        })
      ).min(1),
    })
  ),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userLogin = req.user?.login;
      const coupleId = await resolveTestCoupleId(userLogin ?? "");
      const { testId, answers } = req.body;

      if (!userLogin || !coupleId) {
        return res.status(401).json({ error: "Необходима авторизация и пара" });
      }

      const result = await atomicSubmitTestAnswers(testId, coupleId, userLogin, answers);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("Ошибка отправки теста", err);
      if (err instanceof Error && err.message.startsWith("ValidationFailed")) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  }
);

/** Инкрементальная отправка одного ответа */
testsRouter.post(
  "/answer",
  requireAuth,
  requirePairOwnership,
  validateBody(
    z.object({
      testId: z.string().min(1),
      questionId: z.string().min(1),
      selectedValue: z.union([z.string(), z.number()]).optional(),
      reactionTimeMs: z.number().nullable().optional(),
      toggleCount: z.number().nullable().optional(),
      targetType: z.string().nullable().optional(),
      rawPayload: z.any().optional(),
    })
  ),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userLogin = req.user?.login;
      const coupleId = await resolveTestCoupleId(userLogin ?? "");
      const { testId, questionId, selectedValue, reactionTimeMs, toggleCount, targetType, rawPayload } = req.body;

      if (!userLogin || !coupleId) {
        return res.status(401).json({ error: "Необходима авторизация и пара" });
      }

      const result = await submitTestAnswer({
        testId,
        coupleId,
        userLogin,
        questionId,
        selectedValue,
        reactionTimeMs,
        toggleCount,
        targetType,
        rawPayload,
      });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("Ошибка записи ответа", err);
      next(err);
    }
  }
);

/** Сохранить черновик */
testsRouter.post(
  "/draft",
  requireAuth,
  validateBody(
    z.object({
      testId: z.string().min(1),
      currentQuestionIndex: z.number().int().min(0),
      answers: z.array(
        z.object({
          questionId: z.string(),
          value: z.union([z.string(), z.number()]),
        })
      ).min(1),
    })
  ),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userLogin = req.user?.login;
      const { testId, currentQuestionIndex, answers } = req.body;

      if (!userLogin) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const result = await saveTestDraft(userLogin, testId, currentQuestionIndex, answers);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("Ошибка сохранения черновика", err);
      next(err);
    }
  }
);

/** Получить черновик */
testsRouter.get("/draft/:testId", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    const { testId } = req.params;

    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const draft = await getTestDraft(userLogin, testId);
    return res.status(200).json({ success: true, draft });
  } catch (err) {
    logger.error("Ошибка получения черновика", err);
    next(err);
  }
});

/** Удалить черновик */
testsRouter.delete("/draft/:testId", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    const { testId } = req.params;

    if (!userLogin) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const result = await clearTestDraft(userLogin, testId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("Ошибка удаления черновика", err);
    next(err);
  }
});