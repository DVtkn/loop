import { Router } from "express";
import { registerLimiter, loginLimiter } from "../../shared/middleware/rateLimiter.ts";
import { isTestSuiteAllowed } from "../../shared/middleware/testSuiteGate.ts";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import {
  registerSchema,
  loginRequestSchema,
  updateProfileSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "../../shared/validators/auth.validator.ts";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  resetUserPassword,
  syncAccounts,
} from "./auth.service.ts";
import { logger } from "../../shared/utils/logger.ts";

export const authRouter = Router();

authRouter.post("/sync", async (req, res, next) => {
  try {
    if (!isTestSuiteAllowed(req.headers["x-admin-secret"])) {
      return res.status(404).json({ error: "Not found" });
    }
    const { accounts } = req.body;
    if (!Array.isArray(accounts)) {
      return res.status(400).json({ error: "accounts must be an array" });
    }
    await syncAccounts(accounts);
    return res.json({ status: "synced" });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/register", registerLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { login, password, name, gender } = req.body;
    const result = await registerUser({ login, password, name, gender });
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", loginLimiter, validateBody(loginRequestSchema), async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const result = await loginUser({ login, password }, req.ip);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get("/user/:login", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const paramLogin = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    const userLogin = req.user?.login;

    if (paramLogin !== userLogin) {
      return res.status(403).json({ error: "Нет доступа к чужому профилю" });
    }

    const user = await getUserProfile(paramLogin);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/update-profile", requireAuth, validateBody(updateProfileSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) return res.status(401).json({ error: "Неавторизован" });

    const user = await updateUserProfile(userLogin, req.body);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/change-password", requireAuth, validateBody(changePasswordSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) return res.status(401).json({ error: "Неавторизован" });

    const { oldPassword, newPassword } = req.body;
    await changeUserPassword(userLogin, oldPassword, newPassword);
    return res.json({ status: "ok", message: "Пароль успешно изменён" });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { login, newPassword } = req.body;
    const secretGate = isTestSuiteAllowed((req.body as any)?.secretKey);
    if (!secretGate) {
      return res.status(403).json({ error: "Сброс пароля по логину отключён в целях безопасности. Обратитесь в поддержку приложения." });
    }
    await resetUserPassword(login, newPassword);
    return res.json({ status: "ok", message: "Пароль успешно сброшен" });
  } catch (err) {
    next(err);
  }
});
