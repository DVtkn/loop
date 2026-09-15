import { Router } from "express";
import { pairLimiter } from "../../shared/middleware/rateLimiter.ts";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { requirePairOwnership } from "../../shared/middleware/requirePairOwnership.ts";
import {
  pairRequestSchema,
  pairAcceptSchema,
  pairRejectSchema,
  pairDisconnectSchema,
} from "../../shared/validators/pairing.validator.ts";
import {
  requestPairConnection,
  acceptPair,
  rejectPairRequest,
  disconnectPair,
  getPairStatus,
} from "./pairing.service.ts";
import { toSafeUser } from "../../core/types.ts";

export const pairingRouter = Router();

pairingRouter.post("/request", requireAuth, pairLimiter, validateBody(pairRequestSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { fromLogin, toLogin } = req.body;
    const userLogin = req.user?.login;

    if (fromLogin !== userLogin) {
      return res.status(403).json({ error: "Нельзя отправить запрос от чужого имени" });
    }

    const reqObj = await requestPairConnection(fromLogin, toLogin);
    return res.status(201).json({ request: reqObj, message: "Запрос на соединение отправлен" });
  } catch (err) {
    next(err);
  }
});

pairingRouter.post("/accept", requireAuth, validateBody(pairAcceptSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { fromLogin, toLogin } = req.body;
    const userLogin = req.user?.login;

    // The user accepting must be toLogin
    if (toLogin !== userLogin) {
      return res.status(403).json({ error: "Вы не можете принять чужой запрос" });
    }

    const { updatedMe, updatedPartner } = await acceptPair(toLogin, fromLogin);
    return res.json({
      status: "connected",
      me: updatedMe ? toSafeUser(updatedMe) : null,
      partner: updatedPartner ? toSafeUser(updatedPartner) : null,
    });
  } catch (err) {
    next(err);
  }
});

pairingRouter.post("/reject", requireAuth, validateBody(pairRejectSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { fromLogin, toLogin } = req.body;
    const userLogin = req.user?.login;

    if (toLogin !== userLogin) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    await rejectPairRequest(fromLogin, toLogin);
    return res.json({ status: "rejected" });
  } catch (err) {
    next(err);
  }
});

pairingRouter.post("/disconnect", requireAuth, validateBody(pairDisconnectSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { login } = req.body;
    const userLogin = req.user?.login;

    if (login !== userLogin) {
      return res.status(403).json({ error: "Нет доступа к разрыву чужой пары" });
    }

    const result = await disconnectPair(login);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({
      status: "disconnected",
      user: result.updatedUser ? toSafeUser(result.updatedUser) : null,
    });
  } catch (err) {
    next(err);
  }
});

pairingRouter.get("/status/:login", requireAuth, requirePairOwnership, async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    const status = await getPairStatus(login);
    return res.json(status);
  } catch (err) {
    next(err);
  }
});
