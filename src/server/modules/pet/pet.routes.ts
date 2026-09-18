import { Router } from "express";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { petActionSchema, petRenameSchema } from "../../shared/validators/pet.validator.ts";
import {
  getPetState,
  performPetAction,
  renamePet,
} from "./pet.service.ts";
import { logger } from "../../shared/utils/logger.ts";

export const petRouter = Router();

// GET /api/pet/state — get pet state with auto-init
petRouter.get("/state", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const state = await getPetState(login);
    return res.json(state);
  } catch (err) {
    logger.error("Ошибка получения состояния питомца", err);
    next(err);
  }
});

// POST /api/pet/action — perform action (feed, play, sleep, pet)
petRouter.post("/action", requireAuth, validateBody(petActionSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const { action } = req.body;
    const result = await performPetAction(login, action);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка выполнения действия питомца", err);
    next(err);
  }
});

// POST /api/pet/rename — rename pet
petRouter.post("/rename", requireAuth, validateBody(petRenameSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const { name } = req.body;
    const result = await renamePet(login, name);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка переименования питомца", err);
    next(err);
  }
});
