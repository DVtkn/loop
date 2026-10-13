import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.ts";
import { isDatabaseError } from "../errors/index.ts";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error("Необработанная ошибка API", err, { path: req.path, method: req.method });

  if (isDatabaseError(err) || (process.env.NODE_ENV === "production" && isDatabaseError(err))) {
    return res.status(503).json({
      error: "Сервис временно недоступен, попробуйте через минуту",
      code: "DB_UNAVAILABLE",
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  // 5xx наружу — только generic: внутрь message может попасть сырой SQL/стек драйвера
  const message =
    statusCode >= 500 ? "Внутренняя ошибка сервера" : err.message || "Внутренняя ошибка сервера";
  const fallbackCode =
    statusCode === 400
      ? "BAD_REQUEST"
      : statusCode === 401
        ? "UNAUTHORIZED"
        : statusCode === 403
          ? "FORBIDDEN"
          : statusCode === 404
            ? "NOT_FOUND"
            : statusCode === 409
              ? "CONFLICT"
              : statusCode === 422
                ? "UNPROCESSABLE_ENTITY"
                : "INTERNAL_ERROR";

  return res.status(statusCode).json({
    error: message,
    code: err.code || fallbackCode,
  });
}
