import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { logger } from "../utils/logger.ts";
import { isTestSuiteAllowed } from "./testSuiteGate.ts";

const isTestEnvironment = (req: Request) =>
  process.env.NODE_ENV === "test" || isTestSuiteAllowed(req.headers["x-test-suite"]);

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Allows multiple accounts on shared home Wi-Fi / campus networks
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req: Request, res: Response) => {
    logger.security("Превышен лимит регистрации", {
      ip: req.ip,
      path: req.originalUrl,
    });
    res.status(429).json({
      error: "Слишком много попыток регистрации. Попробуйте через час.",
    });
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req: Request, res: Response) => {
    logger.security("Превышен лимит попыток входа", {
      ip: req.ip,
      path: req.originalUrl,
    });
    res.status(429).json({
      error: "Слишком много попыток входа. Попробуйте через 15 минут.",
    });
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req: Request, res: Response) => {
    logger.security("Превышен лимит запросов к ИИ", {
      ip: req.ip,
      path: req.originalUrl,
    });
    res.status(429).json({
      error: "Слишком много запросов к ИИ-психологу. Пожалуйста, сделайте небольшую паузу.",
    });
  },
});

export const pairLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req: Request, res: Response) => {
    logger.security("Превышен лимит парных операций", {
      ip: req.ip,
      path: req.originalUrl,
    });
    res.status(429).json({
      error: "Слишком много запросов на соединение. Попробуйте позже.",
    });
  },
});

export const photoUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req: Request, res: Response) => {
    logger.security("Превышен лимит загрузки фото", {
      ip: req.ip,
      path: req.originalUrl,
    });
    res.status(429).json({
      error: "Слишком частая загрузка фотографий. Пожалуйста, подождите минуту.",
    });
  },
});
