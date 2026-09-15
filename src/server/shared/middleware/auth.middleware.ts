import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../core/config.ts";
import { logger } from "../utils/logger.ts";
import { touchUserLastActive } from "../../modules/realtime/realtime.service.ts";

export interface AuthenticatedUser {
  login: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  userLogin?: string;
  couple?: { id: string };
}

export function generateToken(login: string): string {
  return jwt.sign({ login: login.toLowerCase() }, config.jwtSecret, { expiresIn: "30d" });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Необходима авторизация" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { login: string };
    const userLogin = String(decoded.login || "").toLowerCase();
    
    if (!userLogin) {
      return res.status(401).json({ error: "Недействительный токен" });
    }

    req.userLogin = userLogin;
    req.user = { login: userLogin };
    
    // Фоновое обновление активности пользователя при любом авторизованном запросе
    touchUserLastActive(userLogin).catch(() => {});

    next();
  } catch (err: unknown) {
    logger.warn("Ошибка валидации JWT токена", { ip: req.ip }, err);
    return res.status(401).json({ error: "Сессия истекла или токен недействителен" });
  }
}
