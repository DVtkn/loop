import dotenv from "dotenv";
import { logger } from "./logger.ts";

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  allowedOrigins: string[];
}

function parseAllowedOrigins(): string[] {
  const custom = process.env.ALLOWED_ORIGINS;
  if (custom) {
    return custom.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
}

export function loadConfig(): ServerConfig {
  const port = 3000; // Strictly port 3000 as mandated by environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  let jwtSecret = process.env.JWT_SECRET;

  if (isProd) {
    if (!jwtSecret || jwtSecret === 'loop_secret_fallback_12345' || jwtSecret.trim() === '') {
      logger.warn('ВНИМАНИЕ: Переменная JWT_SECRET отсутствует или содержит плейсхолдер. Используется временный ключ. Для безопасности добавьте JWT_SECRET в настройки Vercel.');
      jwtSecret = process.env.JWT_SECRET || 'loop_prod_secure_secret_fallback_key_2025';
    }
    const hasDb = Boolean(
      process.env.DATABASE_URL?.trim() ||
      process.env.NEON_DATABASE_URL?.trim() ||
      process.env.MY_DATABASE_URL?.trim() ||
      process.env.SQL_HOST?.trim()
    );
    if (!hasDb) {
      logger.warn('ВНИМАНИЕ: Переменная DATABASE_URL / NEON_DATABASE_URL отсутствует в переменных окружения Vercel. Добавьте строку подключения к Neon PostgreSQL в настройках проекта Vercel.');
    }
  } else {
    if (!jwtSecret) {
      logger.warn('JWT_SECRET is missing from environment. Using fallback (NOT safe for production).');
      jwtSecret = 'loop_secret_fallback_12345';
    }
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    logger.warn('GROQ_API_KEY is not configured in .env. AI psychologist (Sova) will return 503.');
  }

  return {
    port,
    nodeEnv,
    jwtSecret,
    groqApiKey: GROQ_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    allowedOrigins: parseAllowedOrigins(),
  };
}

export const config = loadConfig();
