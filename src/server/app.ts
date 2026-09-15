import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { sql } from "drizzle-orm";

import { db, createPool, isSqlConfigured } from "./db/client";
import { users, pairRequests, coupleData, chatMessages, aiInsights, relationshipMetrics } from "./db/schema";
import { config } from "./core/config";
import { logger } from "./shared/utils/logger";
import { callGroqChat } from "./modules/chat/chat.service";
import { errorHandler } from "./shared/middleware/errorHandler";
import { writeEmergencyFile } from "./services/storageService";

import { authRouter } from "./modules/auth/auth.routes";
import { pairingRouter } from "./modules/pairing/pairing.routes";
import { coupleRouter } from "./modules/couple-data/couple.routes";
import { chatRouter, aiRouter } from "./modules/chat/chat.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { photoRouter } from "./modules/photos/photos.routes";
import { realtimeRouter, pushRouter } from "./modules/realtime/realtime.routes";
import { testsRouter } from "./modules/tests/tests.routes";

export { logger, callGroqChat };

const app = express();

// Database schema initialization & indexes creation
export async function initDatabase() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isSqlConfigured()) {
    if (isProd) {
      logger.warn("ВНИМАНИЕ: DATABASE_URL не настроена в production (Vercel). Пожалуйста, добавьте переменную DATABASE_URL в Project Settings -> Environment Variables на Vercel.");
      return;
    }
    logger.info("Cloud SQL / PostgreSQL не настроен — используется резервное хранилище /data/db_store.json для dev-режима");
    return;
  }
  try {
    const pool = createPool();
    if (!pool) {
      logger.warn("Не удалось создать пул подключений к PostgreSQL.");
      return;
    }
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        login text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text NOT NULL,
        gender text,
        avatar_emoji text NOT NULL DEFAULT '✨',
        partner_login text,
        created_at text NOT NULL,
        updated_at text NOT NULL,
        data_version integer NOT NULL DEFAULT 1
      )`,
      `CREATE INDEX IF NOT EXISTS users_login_idx ON users(login)`,
      `CREATE TABLE IF NOT EXISTS pair_requests (
        id text PRIMARY KEY,
        from_login text NOT NULL,
        to_login text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at text NOT NULL,
        updated_at text NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS pair_requests_to_login_idx ON pair_requests(to_login)`,
      `CREATE INDEX IF NOT EXISTS pair_requests_from_login_idx ON pair_requests(from_login)`,
      `CREATE TABLE IF NOT EXISTS couple_data (
        id text PRIMARY KEY,
        data jsonb NOT NULL,
        last_updated_at text NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS couple_data_id_idx ON couple_data(id)`,
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id text PRIMARY KEY,
        sender_login text NOT NULL,
        recipient_login text NOT NULL,
        text text NOT NULL,
        created_at text NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS chat_messages_sender_recipient_idx ON chat_messages(sender_login, recipient_login)`,
      `CREATE TABLE IF NOT EXISTS test_sessions (
        id text PRIMARY KEY,
        test_id text NOT NULL,
        couple_id text NOT NULL,
        test_class text NOT NULL DEFAULT 'couple',
        status text NOT NULL DEFAULT 'in_progress',
        completed_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS test_sessions_couple_id_idx ON test_sessions(couple_id)`,
      `CREATE TABLE IF NOT EXISTS test_answers (
        id text PRIMARY KEY,
        session_id text NOT NULL,
        user_id text NOT NULL,
        question_id text NOT NULL,
        scale_id text,
        selected_value numeric(8, 2) NOT NULL,
        weight numeric(5, 2) NOT NULL DEFAULT 1.00,
        reaction_time_ms integer,
        toggle_count integer NOT NULL DEFAULT 0,
        target_type varchar(24) NOT NULL DEFAULT 'self',
        raw_payload jsonb,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT uniq_user_session_question UNIQUE (session_id, user_id, question_id)
      )`,
      `CREATE INDEX IF NOT EXISTS test_answers_session_idx ON test_answers(session_id)`,
      `CREATE INDEX IF NOT EXISTS test_answers_user_idx ON test_answers(user_id)`,
      `ALTER TABLE test_answers ADD COLUMN IF NOT EXISTS reaction_time_ms integer`,
      `ALTER TABLE test_answers ADD COLUMN IF NOT EXISTS toggle_count integer NOT NULL DEFAULT 0`,
      `ALTER TABLE test_answers ADD COLUMN IF NOT EXISTS target_type varchar(24) NOT NULL DEFAULT 'self'`,
      `ALTER TABLE test_answers ADD COLUMN IF NOT EXISTS raw_payload jsonb`,
      `CREATE TABLE IF NOT EXISTS user_psych_profiles (
        user_id text PRIMARY KEY,
        couple_id text NOT NULL,
        session_id text NOT NULL,
        e_safety numeric(5, 2) NOT NULL,
        a_autonomy numeric(5, 2) NOT NULL,
        c_closeness numeric(5, 2) NOT NULL,
        r_repair numeric(5, 2) NOT NULL,
        v_future numeric(5, 2) NOT NULL,
        consistency_score numeric(5, 2),
        raw_responses jsonb,
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      )`,
      `ALTER TABLE user_psych_profiles ADD COLUMN IF NOT EXISTS consistency_score numeric(5, 2)`,
      `ALTER TABLE user_psych_profiles ADD COLUMN IF NOT EXISTS trait_scores jsonb`,
      `ALTER TABLE user_psych_profiles ADD COLUMN IF NOT EXISTS dominant_vectors jsonb`,
      `CREATE TABLE IF NOT EXISTS couple_reports (
        id text PRIMARY KEY,
        session_id text NOT NULL,
        couple_id text NOT NULL UNIQUE,
        radar_trust numeric(5, 2) NOT NULL DEFAULT 50.00,
        radar_closeness numeric(5, 2) NOT NULL DEFAULT 50.00,
        radar_communication numeric(5, 2) NOT NULL DEFAULT 50.00,
        radar_intimacy numeric(5, 2) NOT NULL DEFAULT 50.00,
        radar_values numeric(5, 2) NOT NULL DEFAULT 50.00,
        radar_metrics jsonb,
        archetype_title text NOT NULL,
        archetype_description text NOT NULL,
        lead_spheres jsonb NOT NULL,
        synergy_points jsonb,
        growth_zones jsonb,
        blind_spots jsonb,
        calculated_at timestamp with time zone NOT NULL DEFAULT now(),
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS radar_trust numeric(5, 2)`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS radar_closeness numeric(5, 2)`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS radar_communication numeric(5, 2)`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS radar_intimacy numeric(5, 2)`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS radar_values numeric(5, 2)`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS radar_metrics jsonb`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS archetype_title text`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS archetype_description text`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS lead_spheres jsonb`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS synergy_points jsonb`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS growth_zones jsonb`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS blind_spots jsonb`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS calculated_at timestamp with time zone DEFAULT now()`,
      `ALTER TABLE couple_reports ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`
    ];
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (stmtErr) {
        logger.debug("Init statement warning (continuing):", { error: String(stmtErr) });
      }
    }
    logger.info("Таблицы и индексы базы данных успешно проверены/созданы в PostgreSQL");
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? { message: err.message, stack: err.stack } : err;
    if (isProd) {
      logger.error("Предупреждение инициализации таблиц PostgreSQL в production:", { error: errorObj });
    } else {
      logger.warn("Ошибка при проверке/создании таблиц PostgreSQL, переключаемся на аварийный режим:", { error: errorObj });
    }
  }
}

// Lazy/On-demand DB check for serverless
let dbInitPromise: Promise<void> | null = null;
export function ensureDatabaseInitialized(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      dbInitPromise = null;
      logger.error("Database initialization error:", err);
    });
  }
  return dbInitPromise;
}

// Middleware: ensure DB is initialized before processing API requests (except health check)
app.use(async (req, res, next) => {
  const isHealthCheck = req.path === "/health" || req.path === "/api/health";
  if (!isHealthCheck && (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.startsWith("/pair"))) {
    try {
      await ensureDatabaseInitialized();
    } catch (err) {
      logger.error("Database initialization check failed during request:", err);
      return res.status(503).json({
        error: "База данных временно недоступна. Пожалуйста, проверьте подключение DATABASE_URL в настройках Vercel.",
      });
    }
  }
  next();
});

// Trust proxy for secure headers behind proxies/Vercel/Cloud Run
app.set("trust proxy", 1);

// 1. SECURITY & MIDDLEWARE
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://*"],
        connectSrc: ["'self'", "https://*", "wss://*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      // Allow localhost in development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
      // Allow any Vercel preview or production deployment domain
      if (origin.endsWith(".vercel.app") || origin.includes("ais-") || origin.includes("google.com")) {
        return callback(null, true);
      }
      // Otherwise allow to avoid blocking valid clients
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 2. OBSERVABILITY & MODULAR API ROUTER
const apiRouter = express.Router();

apiRouter.get("/health", async (req, res) => {
  const memory = process.memoryUsage();
  let dbStatus = "not_configured";
  let dbLatencyMs: number | null = null;
  let dbErrorDetail: any = null;

  if (isSqlConfigured() && db) {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Date.now() - start;
      dbStatus = "connected";
    } catch (err: unknown) {
      dbStatus = "error";
      const errorObj = err instanceof Error ? { message: err.message, stack: err.stack } : String(err);
      logger.error("Health check DB ping failed:", { error: errorObj });
      dbErrorDetail = errorObj;
    }
  }

  const isHealthy = dbStatus === "connected" || dbStatus === "not_configured";
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? "ok" : "degraded",
    environment: config.nodeEnv,
    version: "2.1.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: dbErrorDetail,
    },
    system: {
      memoryRssMb: Math.round(memory.rss / 1024 / 1024),
      memoryHeapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    },
  });
});

// Admin endpoint for tests / staging resets
apiRouter.post("/admin/clear-all-data", async (req, res) => {
  try {
    if (isSqlConfigured() && db) {
      try {
        await db.delete(chatMessages);
        await db.delete(coupleData);
        await db.delete(pairRequests);
        await db.delete(aiInsights);
        await db.delete(relationshipMetrics);
        await db.delete(users);
      } catch (err: unknown) {
        logger.warn("DB clear tables warning:", { error: String(err) });
      }
    }
    writeEmergencyFile({ users: {}, pairRequests: [], coupleData: {}, chatMessages: [], rateLimits: {}, photos: [] });
    return res.json({ ok: true });
  } catch (err: unknown) {
    logger.error("Failed to clear data:", err);
    return res.status(500).json({ error: "Failed to clear data" });
  }
});

// Client observability error logger
apiRouter.post("/log-error", (req, res) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      import("fs").then((fs) => {
        fs.appendFileSync("client-errors.log", JSON.stringify(req.body) + "\n");
      }).catch(() => {});
    } else {
      logger.warn("Client error reported:", { clientError: req.body });
    }
  } catch (err: unknown) {
    logger.error("Failed to process client-error:", err);
  }
  return res.json({ ok: true });
});

// 3. MOUNT MODULAR SUB-ROUTERS
apiRouter.use("/auth", authRouter);
apiRouter.use("/pair", pairingRouter);
apiRouter.use("/couple", coupleRouter);
apiRouter.use("/couple", realtimeRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/tests", testsRouter);
apiRouter.use("/photos", photoRouter);
apiRouter.use("/push", pushRouter);

// Universal mount: allows both /api/* and /* (handles Vercel rewrite prefix stripping)
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
