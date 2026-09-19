import { Router } from "express";
import { validateBody } from "../../shared/middleware/validation.ts";
import { requireAuth, AuthenticatedRequest } from "../../shared/middleware/auth.middleware.ts";
import { 
  petBirthSchema, 
  petActionSchema, 
  petProposeNameSchema, 
  petConfirmNameSchema,
  petSwitchSchema 
} from "../../shared/validators/pet.validator.ts";
import {
  getPetState,
  createPet,
  performPetAction,
  proposePetName,
  confirmPetName,
  switchPetSpecies,
} from "./pet.service.ts";
import { logger } from "../../shared/utils/logger.ts";

export const petRouter = Router();

// GET /api/pet — get pet state with auto-init
petRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
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

// POST /api/pet/birth — complete onboarding (create pet)
petRouter.post("/birth", requireAuth, validateBody(petBirthSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const { species, name } = req.body;
    const result = await createPet(login, species, name);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка создания питомца", err);
    next(err);
  }
});

// POST /api/pet/action — perform action (feed, play, wash, sleep, hug)
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

// POST /api/pet/propose-name — propose new name
petRouter.post("/propose-name", requireAuth, validateBody(petProposeNameSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const { name } = req.body;
    const result = await proposePetName(login, name);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка предложения имени", err);
    next(err);
  }
});

// POST /api/pet/confirm-name — confirm proposed name
petRouter.post("/confirm-name", requireAuth, validateBody(petConfirmNameSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const { confirm } = req.body;
    const result = await confirmPetName(login, confirm);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка подтверждения имени", err);
    next(err);
  }
});

// PATCH /api/pet/switch — switch pet species
petRouter.patch("/switch", requireAuth, validateBody(petSwitchSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const login = req.user?.login;
    if (!login) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    const { species } = req.body;
    const result = await switchPetSpecies(login, species);
    return res.json(result);
  } catch (err) {
    logger.error("Ошибка смены вида питомца", err);
    next(err);
  }
});