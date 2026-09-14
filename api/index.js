var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/app.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { sql as sql4 } from "drizzle-orm";

// src/server/db/client.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";

// src/server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiInsights: () => aiInsights,
  bytea: () => bytea,
  careNotes: () => careNotes,
  chatMessages: () => chatMessages,
  coupleData: () => coupleData,
  coupleEvents: () => coupleEvents,
  coupleReports: () => coupleReports,
  couples: () => couples,
  dateEvents: () => dateEvents,
  pairRequests: () => pairRequests,
  photos: () => photos,
  pushSubscriptions: () => pushSubscriptions,
  relationshipMetrics: () => relationshipMetrics,
  testAnswers: () => testAnswers,
  testDrafts: () => testDrafts,
  testSessions: () => testSessions,
  timeCapsules: () => timeCapsules,
  userPsychProfiles: () => userPsychProfiles,
  users: () => users
});
import { numeric, pgTable, text, timestamp, boolean, jsonb, integer, real, unique, index, customType, foreignKey, varchar, uniqueIndex, uuid } from "drizzle-orm/pg-core";
var bytea = customType({
  dataType() {
    return "bytea";
  }
});
var users = pgTable("users", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  gender: text("gender"),
  // 'male' | 'female'
  avatarEmoji: text("avatar_emoji").notNull().default("sparkles"),
  partnerLogin: text("partner_login"),
  pairedAt: text("paired_at"),
  startDate: text("start_date"),
  city: text("city"),
  loveLanguage: text("love_language"),
  attachmentStyle: text("attachment_style"),
  currentMood: jsonb("current_mood"),
  // { emoji, label, note, updatedAt }
  lastActiveAt: text("last_active_at"),
  createdAt: text("created_at").notNull()
}, (t) => ({
  partnerLoginIdx: index("users_partner_login_idx").on(t.partnerLogin),
  partnerLoginFk: foreignKey({
    columns: [t.partnerLogin],
    foreignColumns: [t.login],
    name: "users_partner_login_fk"
  }).onDelete("set null")
}));
var pairRequests = pgTable("pair_requests", {
  id: text("id").primaryKey(),
  fromLogin: text("from_login").notNull().references(() => users.login, { onDelete: "cascade" }),
  fromName: text("from_name").notNull(),
  fromAvatar: text("from_avatar").notNull(),
  toLogin: text("to_login").notNull().references(() => users.login, { onDelete: "cascade" }),
  status: text("status").notNull(),
  // 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: text("created_at").notNull()
}, (t) => ({
  fromToIdx: index("pair_requests_from_to_idx").on(t.fromLogin, t.toLogin),
  toLoginIdx: index("pair_requests_to_login_idx").on(t.toLogin),
  statusIdx: index("pair_requests_status_idx").on(t.status)
}));
var coupleData = pgTable("couple_data", {
  id: text("id").primaryKey(),
  // using the 'login1_login2' sorted key
  data: jsonb("data").notNull(),
  lastUpdatedAt: text("last_updated_at").notNull()
});
var couples = pgTable("couples", {
  id: text("id").primaryKey(),
  user1Id: text("user1_id").references(() => users.id, { onDelete: "cascade" }),
  user2Id: text("user2_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("active").notNull(),
  xpPoints: integer("xp_points").default(0).notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  startDate: text("start_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var testSessions = pgTable("test_sessions", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull(),
  coupleId: text("couple_id").notNull(),
  testClass: text("test_class").default("couple").notNull(),
  // 'individual' | 'couple'
  status: text("status").default("in_progress").notNull(),
  // 'in_progress' | 'completed'
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  coupleIdIdx: index("test_sessions_couple_id_idx").on(t.coupleId),
  testIdIdx: index("test_sessions_test_id_idx").on(t.testId),
  statusIdx: index("test_sessions_status_idx").on(t.status)
}));
var testAnswers = pgTable("test_answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => testSessions.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  questionId: text("question_id").notNull(),
  scaleId: text("scale_id"),
  selectedValue: numeric("selected_value", { precision: 8, scale: 2 }).notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).default("1.00").notNull(),
  reactionTimeMs: integer("reaction_time_ms"),
  toggleCount: integer("toggle_count").default(0).notNull(),
  targetType: varchar("target_type", { length: 24 }).default("self").notNull(),
  // 'self' | 'partner_observation'
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  uniqUserQuestion: unique("uniq_user_session_question").on(t.sessionId, t.userId, t.questionId),
  sessionIdx: index("test_answers_session_idx").on(t.sessionId),
  userIdIdx: index("test_answers_user_idx").on(t.userId)
}));
var chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  senderLogin: text("sender_login").notNull(),
  role: text("role").notNull(),
  // 'partner1', 'partner2', 'ai'
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: text("created_at").notNull()
}, (t) => ({
  coupleCreatedIdx: index("chat_messages_couple_created_idx").on(t.coupleId, t.createdAt),
  senderIdx: index("chat_messages_sender_login_idx").on(t.senderLogin)
}));
var relationshipMetrics = pgTable("relationship_metrics", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  metricDate: text("metric_date").notNull(),
  // YYYY-MM-DD
  radarScores: jsonb("radar_scores").notNull(),
  // { trust, communication, passion, sharedValues, care, dailyLife }
  moodAverage: real("mood_average"),
  moodEntriesCount: integer("mood_entries_count").default(0),
  interactionCount: integer("interaction_count").default(0),
  quizCompleted: boolean("quiz_completed").default(false),
  streakDays: integer("streak_days").default(0),
  createdAt: text("created_at").notNull()
}, (t) => ({
  unq: unique().on(t.coupleId, t.metricDate)
}));
var aiInsights = pgTable("ai_insights", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  type: text("type").notNull(),
  // 'weekly' | 'risk_alert'
  content: jsonb("content").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  createdAt: text("created_at").notNull()
}, (t) => ({
  coupleCreatedIdx: index("ai_insights_couple_created_idx").on(t.coupleId, t.createdAt)
}));
var photos = pgTable("photos", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  uploaderLogin: text("uploader_login").notNull().references(() => users.login, { onDelete: "cascade" }),
  imageBytes: bytea("image_bytes").notNull(),
  mimeType: text("mime_type").notNull(),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  coupleIdIdx: index("photos_couple_id_idx").on(t.coupleId),
  createdAtIdx: index("photos_created_at_idx").on(t.createdAt)
}));
var dateEvents = pgTable("date_events", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  eventDate: text("event_date").notNull(),
  status: text("status").default("planned").notNull(),
  // 'planned' | 'completed' | 'cancelled'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  coupleIdIdx: index("date_events_couple_id_idx").on(t.coupleId)
}));
var careNotes = pgTable("care_notes", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  authorLogin: text("author_login").notNull(),
  targetLogin: text("target_login").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  coupleIdIdx: index("care_notes_couple_id_idx").on(t.coupleId)
}));
var timeCapsules = pgTable("time_capsules", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  authorLogin: text("author_login").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  openAt: text("open_at").notNull(),
  isOpened: boolean("is_opened").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  coupleIdIdx: index("time_capsules_couple_id_idx").on(t.coupleId)
}));
var pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userLogin: text("user_login").notNull(),
  coupleId: text("couple_id"),
  subscription: jsonb("subscription").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
  userLoginIdx: index("push_subscriptions_user_idx").on(t.userLogin)
}));
var coupleEvents = pgTable("couple_events", {
  id: text("id").primaryKey(),
  coupleId: text("couple_id").notNull(),
  targetLogin: text("target_login").notNull(),
  senderLogin: text("sender_login").notNull(),
  eventType: text("event_type").notNull(),
  // 'touch' | 'chat_message' | 'couple_updated'
  payload: jsonb("payload").notNull(),
  createdAt: text("created_at").notNull()
}, (t) => ({
  coupleTargetIdx: index("couple_events_target_idx").on(t.targetLogin, t.createdAt),
  coupleIdIdx: index("couple_events_couple_idx").on(t.coupleId, t.createdAt)
}));
var userPsychProfiles = pgTable("user_psych_profiles", {
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).primaryKey(),
  coupleId: text("couple_id").notNull(),
  sessionId: text("session_id").notNull(),
  traitScores: jsonb("trait_scores"),
  // S1..S24 normalized 0..100
  dominantVectors: jsonb("dominant_vectors"),
  eSafety: numeric("e_safety", { precision: 5, scale: 2 }).notNull().default("50.00"),
  aAutonomy: numeric("a_autonomy", { precision: 5, scale: 2 }).notNull().default("50.00"),
  cCloseness: numeric("c_closeness", { precision: 5, scale: 2 }).notNull().default("50.00"),
  rRepair: numeric("r_repair", { precision: 5, scale: 2 }).notNull().default("50.00"),
  vFuture: numeric("v_future", { precision: 5, scale: 2 }).notNull().default("50.00"),
  consistencyScore: numeric("consistency_score", { precision: 5, scale: 2 }),
  rawResponses: jsonb("raw_responses"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var coupleReports = pgTable("couple_reports", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  coupleId: text("couple_id").notNull().unique(),
  radarMetrics: jsonb("radar_metrics"),
  // 6 integral spheres: trust, closeness, communication, values, intimacy, lifestyle
  radarTrust: numeric("radar_trust", { precision: 5, scale: 2 }).notNull().default("50.00"),
  radarCloseness: numeric("radar_closeness", { precision: 5, scale: 2 }).notNull().default("50.00"),
  radarCommunication: numeric("radar_communication", { precision: 5, scale: 2 }).notNull().default("50.00"),
  radarIntimacy: numeric("radar_intimacy", { precision: 5, scale: 2 }).notNull().default("50.00"),
  radarValues: numeric("radar_values", { precision: 5, scale: 2 }).notNull().default("50.00"),
  archetypeTitle: text("archetype_title").notNull(),
  archetypeDescription: text("archetype_description").notNull(),
  leadSpheres: jsonb("lead_spheres").notNull(),
  synergyPoints: jsonb("synergy_points"),
  growthZones: jsonb("growth_zones"),
  blindSpots: jsonb("blind_spots"),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var testDrafts = pgTable("test_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  testId: varchar("test_id", { length: 64 }).notNull(),
  currentQuestionIndex: integer("current_question_index").default(0).notNull(),
  answers: jsonb("answers").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userTestDraftIdx: uniqueIndex("user_test_draft_idx").on(table.userId, table.testId)
}));

// src/server/logger.ts
import winston from "winston";
var isProd = process.env.NODE_ENV === "production";
var customLevels = {
  levels: {
    error: 0,
    security: 1,
    warn: 2,
    info: 3,
    debug: 4
  },
  colors: {
    error: "red",
    security: "magenta",
    warn: "yellow",
    info: "green",
    debug: "blue"
  }
};
winston.addColors(customLevels.colors);
var formatError = (err) => {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  } else if (err && typeof err === "object") {
    return { message: JSON.stringify(err) };
  } else if (err) {
    return { message: String(err) };
  }
  return void 0;
};
var prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
  // Cloud Logging automatically parses this
);
var devFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp: timestamp2, context, error }) => {
    const details = context || error ? `
  ${JSON.stringify({ ...context || {}, ...error ? { error } : {} }, null, 2)}` : "";
    return `[${timestamp2}] ${level}: ${message}${details}`;
  })
);
var winstonLogger = winston.createLogger({
  levels: customLevels.levels,
  level: isProd ? "info" : "debug",
  transports: [
    new winston.transports.Console({
      format: isProd ? prodFormat : devFormat
    })
  ]
});
var logger = {
  info: (message, context) => {
    winstonLogger.info(message, { context });
  },
  warn: (message, context, err) => {
    winstonLogger.warn(message, { context, error: formatError(err) });
  },
  error: (message, err, context) => {
    winstonLogger.error(message, { context, error: formatError(err) });
  },
  security: (message, context) => {
    winstonLogger.log("security", message, { context });
  },
  debug: (message, context) => {
    winstonLogger.log("debug", message, { context });
  }
};

// src/server/db/client.ts
neonConfig.poolQueryViaFetch = true;
neonConfig.webSocketConstructor = WebSocket;
var isSqlConfigured = () => {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") return true;
  if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim() !== "") return true;
  if (process.env.NEON_DATABASE_URL && process.env.NEON_DATABASE_URL.trim() !== "") return true;
  if (process.env.MY_DATABASE_URL && process.env.MY_DATABASE_URL.trim() !== "") return true;
  if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME && process.env.SQL_HOST.trim() !== "") return true;
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE && process.env.PGHOST.trim() !== "") return true;
  return false;
};
var getConnectionString = () => {
  let raw = null;
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    raw = process.env.DATABASE_URL;
  } else if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim() !== "") {
    raw = process.env.POSTGRES_URL;
  } else if (process.env.NEON_DATABASE_URL && process.env.NEON_DATABASE_URL.trim() !== "") {
    raw = process.env.NEON_DATABASE_URL;
  } else if (process.env.MY_DATABASE_URL && process.env.MY_DATABASE_URL.trim() !== "") {
    raw = process.env.MY_DATABASE_URL;
  } else if (process.env.SQL_HOST && (process.env.SQL_USER || process.env.SQL_ADMIN_USER) && process.env.SQL_DB_NAME && process.env.SQL_HOST.trim() !== "") {
    const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || "";
    const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || "";
    const port = process.env.SQL_PORT || "5432";
    raw = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${process.env.SQL_HOST}:${port}/${process.env.SQL_DB_NAME}?sslmode=require`;
  } else if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE && process.env.PGHOST.trim() !== "") {
    const user = process.env.PGUSER || "";
    const password = process.env.PGPASSWORD || "";
    const port = process.env.PGPORT || "5432";
    raw = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${process.env.PGHOST}:${port}/${process.env.PGDATABASE}?sslmode=require`;
  }
  return raw ? raw.replace(/[?&]channel_binding=[^&]*(&?)/, (m, tail) => tail ? m.startsWith("?") ? "?" : "&" : "").replace(/[?&]$/, "") : null;
};
var createPool = () => {
  const connStr = getConnectionString();
  if (!connStr) {
    return null;
  }
  if (!globalThis._neonPool) {
    globalThis._neonPool = new Pool({
      connectionString: connStr,
      max: 10,
      connectionTimeoutMillis: 1e4
    });
    globalThis._neonPool.on("error", (err) => {
      logger.warn("Neon pool connection notice:", void 0, err);
    });
  }
  return globalThis._neonPool;
};
var getDb = () => {
  if (globalThis._neonDb) {
    return globalThis._neonDb;
  }
  const pool = isSqlConfigured() ? createPool() : null;
  globalThis._neonDb = pool ? drizzle(pool, { schema: schema_exports }) : drizzle(new Pool({ connectionString: "postgresql://dummy:dummy@127.0.0.1:5432/dummy" }), { schema: schema_exports });
  return globalThis._neonDb;
};
var db = getDb();

// src/server/config.ts
import dotenv from "dotenv";
dotenv.config();
function parseAllowedOrigins() {
  const custom = process.env.ALLOWED_ORIGINS;
  if (custom) {
    return custom.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return [
    "http://localhost:3000",
    "http://localhost:5173"
  ];
}
function loadConfig() {
  const port = 3e3;
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProd8 = nodeEnv === "production";
  let jwtSecret = process.env.JWT_SECRET;
  if (isProd8) {
    if (!jwtSecret || jwtSecret === "loop_secret_fallback_12345" || jwtSecret.trim() === "") {
      logger.warn("\u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: \u041F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F JWT_SECRET \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0438\u043B\u0438 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0439 \u043A\u043B\u044E\u0447. \u0414\u043B\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 JWT_SECRET \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Vercel.");
      jwtSecret = process.env.JWT_SECRET || "loop_prod_secure_secret_fallback_key_2025";
    }
    const hasDb = Boolean(
      process.env.DATABASE_URL?.trim() || process.env.NEON_DATABASE_URL?.trim() || process.env.MY_DATABASE_URL?.trim() || process.env.SQL_HOST?.trim()
    );
    if (!hasDb) {
      logger.warn("\u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: \u041F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F DATABASE_URL / NEON_DATABASE_URL \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F Vercel. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0441\u0442\u0440\u043E\u043A\u0443 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A Neon PostgreSQL \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 Vercel.");
    }
  } else {
    if (!jwtSecret) {
      logger.warn("JWT_SECRET is missing from environment. Using fallback (NOT safe for production).");
      jwtSecret = "loop_secret_fallback_12345";
    }
  }
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    logger.warn("GROQ_API_KEY is not configured in .env. AI psychologist (Sova) will return 503.");
  }
  return {
    port,
    nodeEnv,
    jwtSecret,
    groqApiKey: GROQ_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    allowedOrigins: parseAllowedOrigins()
  };
}
var config = loadConfig();

// src/server/modules/chat/chat.service.ts
import { eq as eq2 } from "drizzle-orm";
import crypto2 from "crypto";

// src/server/services/storageService.ts
import fs from "fs";
import path from "path";
import { sql, eq, or } from "drizzle-orm";

// src/server/shared/errors/index.ts
var DatabaseUnavailableError = class _DatabaseUnavailableError extends Error {
  constructor(message = "\u0421\u0435\u0440\u0432\u0438\u0441 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443") {
    super(message);
    this.statusCode = 503;
    this.status = 503;
    this.code = "DB_UNAVAILABLE";
    this.name = "DatabaseUnavailableError";
    Object.setPrototypeOf(this, _DatabaseUnavailableError.prototype);
  }
};
function isDatabaseError(err) {
  if (!err) return false;
  if (err instanceof DatabaseUnavailableError || err.code === "DB_UNAVAILABLE" || err.status === 503 || err.statusCode === 503) {
    return true;
  }
  const msg = String(err.message || "");
  const code = String(err.code || "");
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "57P01" || // admin_shutdown
  code === "08001" || // sqlclient_unable_to_establish_sqlconnection
  code === "08006" || // connection_failure
  code === "08003" || // connection_does_not_exist
  msg.includes("fetch failed") || msg.includes("connection timeout") || msg.includes("connect ECONNREFUSED") || msg.includes("NeonDbError") || msg.includes("WebSocket connection") || msg.includes("Error connecting to database")) {
    return true;
  }
  return false;
}

// src/server/services/storageService.ts
var DATA_DIR = path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "db_store.json");
var isProd2 = () => process.env.NODE_ENV === "production";
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    logger.error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0438\u044E \u0434\u043B\u044F \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u043E\u0433\u043E \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430", err, { path: DATA_DIR });
  }
}
function readEmergencyFile() {
  if (isProd2()) {
    return { users: {}, pairRequests: [], coupleData: {}, chatMessages: [], rateLimits: {}, photos: [] };
  }
  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || {},
        pairRequests: parsed.pairRequests || [],
        coupleData: parsed.coupleData || {},
        chatMessages: parsed.chatMessages || [],
        rateLimits: parsed.rateLimits || {},
        photos: parsed.photos || []
      };
    }
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430 db_store.json", err);
  }
  return { users: {}, pairRequests: [], coupleData: {}, chatMessages: [], rateLimits: {}, photos: [] };
}
function writeEmergencyFile(data) {
  if (isProd2()) {
    return;
  }
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u0432 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u0444\u0430\u0439\u043B db_store.json", err);
  }
}
async function findUserByLogin(login) {
  const clean = login.trim().toLowerCase().replace(/^@/, "");
  if (!clean) return void 0;
  if (isProd2()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const res = await db.select().from(users).where(sql`LOWER(${users.login}) = ${clean}`).limit(1);
      return res && res.length > 0 ? res[0] : void 0;
    } catch (err) {
      logger.error("SQL \u0437\u0430\u043F\u0440\u043E\u0441 findUserByLogin \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441\u0431\u043E\u0435\u043C \u0432 production (fail-fast)", err, { login: clean });
      throw new DatabaseUnavailableError();
    }
  }
  let sqlUser;
  if (isSqlConfigured() && db) {
    try {
      const res = await db.select().from(users).where(sql`LOWER(${users.login}) = ${clean}`).limit(1);
      if (res && res.length > 0) {
        sqlUser = res[0];
      }
    } catch (err) {
      logger.warn("SQL \u0437\u0430\u043F\u0440\u043E\u0441 findUserByLogin \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439, \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043D\u0430 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u044B\u0439 \u0444\u0430\u0439\u043B", { login: clean }, err);
    }
  }
  const store = readEmergencyFile();
  const jsonUser = store.users[clean] || Object.values(store.users).find((u) => u && String(u.login).toLowerCase() === clean);
  if (sqlUser && jsonUser) {
    return {
      ...sqlUser,
      ...jsonUser,
      partnerLogin: jsonUser.partnerLogin || sqlUser.partnerLogin,
      pairedAt: jsonUser.pairedAt || sqlUser.pairedAt
    };
  }
  return sqlUser || jsonUser;
}
async function findUserByQuery(query) {
  const clean = query.trim().toLowerCase().replace(/^@/, "");
  if (!clean) return void 0;
  if (isProd2()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const res = await db.select().from(users).where(
        or(
          eq(users.login, clean),
          sql`LOWER(${users.login}) = ${clean}`,
          sql`LOWER(${users.name}) = ${clean}`
        )
      ).limit(1);
      return res && res.length > 0 ? res[0] : void 0;
    } catch (err) {
      logger.error("SQL \u0437\u0430\u043F\u0440\u043E\u0441 findUserByQuery \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441\u0431\u043E\u0435\u043C \u0432 production (fail-fast)", err, { query: clean });
      throw new DatabaseUnavailableError();
    }
  }
  let sqlUser;
  if (isSqlConfigured() && db) {
    try {
      const res = await db.select().from(users).where(
        or(
          eq(users.login, clean),
          sql`LOWER(${users.login}) = ${clean}`,
          sql`LOWER(${users.name}) = ${clean}`
        )
      ).limit(1);
      if (res && res.length > 0) {
        sqlUser = res[0];
      }
    } catch (err) {
      logger.warn("SQL \u0437\u0430\u043F\u0440\u043E\u0441 findUserByQuery \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439, \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043D\u0430 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u044B\u0439 \u0444\u0430\u0439\u043B", { query: clean }, err);
    }
  }
  const store = readEmergencyFile();
  const jsonUser = store.users[clean] || Object.values(store.users).find(
    (u) => u && (String(u.login).toLowerCase() === clean || String(u.name || "").toLowerCase() === clean)
  );
  if (sqlUser && jsonUser) {
    return {
      ...sqlUser,
      ...jsonUser,
      partnerLogin: jsonUser.partnerLogin || sqlUser.partnerLogin,
      pairedAt: jsonUser.pairedAt || sqlUser.pairedAt
    };
  }
  return sqlUser || jsonUser;
}
async function upsertUser(userData) {
  const cleanLogin = userData.login.trim().toLowerCase().replace(/^@/, "");
  const normalizedData = { ...userData, login: cleanLogin };
  if (isProd2()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.insert(users).values(normalizedData).onConflictDoUpdate({
        target: users.login,
        set: normalizedData
      });
      return;
    } catch (err) {
      logger.error("SQL \u0437\u0430\u043F\u0438\u0441\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0430\u0441\u044C \u0441\u0431\u043E\u0435\u043C \u0432 production (fail-fast)", err, { login: cleanLogin });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      await db.insert(users).values(normalizedData).onConflictDoUpdate({
        target: users.login,
        set: normalizedData
      });
    } catch (err) {
      logger.error("SQL \u0437\u0430\u043F\u0438\u0441\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0430\u0441\u044C \u0441\u0431\u043E\u0435\u043C, \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0432 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u043E\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435", err, { login: cleanLogin });
    }
  }
  const store = readEmergencyFile();
  store.users[cleanLogin] = { ...store.users[cleanLogin] || {}, ...normalizedData };
  writeEmergencyFile(store);
}
function mergeCoupleData(existing, incoming) {
  if (!existing) return incoming || {};
  if (!incoming) return existing || {};
  const merged = { ...existing, ...incoming };
  if (incoming.level !== void 0) merged.level = existing.level || 1;
  if (incoming.levelName !== void 0) merged.levelName = existing.levelName || "\u041F\u0435\u0440\u0432\u044B\u0439 \u0448\u0430\u0433";
  if (incoming.testsCompletedCount !== void 0) merged.testsCompletedCount = existing.testsCompletedCount || 0;
  if (merged.coupleProfile) {
    if (incoming.coupleProfile?.level !== void 0) merged.coupleProfile.level = existing.coupleProfile?.level || 1;
    if (incoming.coupleProfile?.levelName !== void 0) merged.coupleProfile.levelName = existing.coupleProfile?.levelName || "\u041F\u0435\u0440\u0432\u044B\u0439 \u0448\u0430\u0433";
    if (incoming.coupleProfile?.testsCompletedCount !== void 0) merged.coupleProfile.testsCompletedCount = existing.coupleProfile?.testsCompletedCount || 0;
  }
  if (Array.isArray(existing.tests) && Array.isArray(incoming.tests)) {
    const testMap = /* @__PURE__ */ new Map();
    existing.tests.forEach((t) => testMap.set(t.id, t));
    incoming.tests.forEach((t) => {
      const ex = testMap.get(t.id);
      if (ex) {
        testMap.set(t.id, {
          ...ex,
          ...t,
          questions: Array.isArray(t.questions) && t.questions.length > 0 ? t.questions : ex.questions,
          userAnswers: { ...ex.userAnswers || {}, ...t.userAnswers || {} },
          partnerAnswers: { ...ex.partnerAnswers || {}, ...t.partnerAnswers || {} },
          partner1Answers: { ...ex.partner1Answers || {}, ...t.partner1Answers || {} },
          partner2Answers: { ...ex.partner2Answers || {}, ...t.partner2Answers || {} },
          partner1Done: !!(ex.partner1Done || t.partner1Done),
          partner2Done: !!(ex.partner2Done || t.partner2Done),
          score: t.score !== void 0 ? t.score : ex.score,
          completedAt: t.completedAt || ex.completedAt
        });
      } else {
        testMap.set(t.id, t);
      }
    });
    merged.tests = Array.from(testMap.values());
  }
  if (Array.isArray(existing.pulseHistory) && Array.isArray(incoming.pulseHistory)) {
    const pulseMap = /* @__PURE__ */ new Map();
    existing.pulseHistory.forEach((p) => pulseMap.set(p.id || p.date, p));
    incoming.pulseHistory.forEach((p) => pulseMap.set(p.id || p.date, { ...pulseMap.get(p.id || p.date) || {}, ...p }));
    merged.pulseHistory = Array.from(pulseMap.values()).sort((a, b) => a.date > b.date ? -1 : 1);
  }
  if (Array.isArray(existing.challenges) && Array.isArray(incoming.challenges)) {
    const challMap = /* @__PURE__ */ new Map();
    existing.challenges.forEach((c) => challMap.set(c.id, c));
    incoming.challenges.forEach((c) => challMap.set(c.id, { ...challMap.get(c.id) || {}, ...c }));
    merged.challenges = Array.from(challMap.values());
  }
  if (Array.isArray(existing.wishlist) && Array.isArray(incoming.wishlist)) {
    const wishMap = /* @__PURE__ */ new Map();
    existing.wishlist.forEach((w) => wishMap.set(w.id, w));
    incoming.wishlist.forEach((w) => wishMap.set(w.id, { ...wishMap.get(w.id) || {}, ...w }));
    merged.wishlist = Array.from(wishMap.values());
  }
  if (Array.isArray(existing.dateInvites) && Array.isArray(incoming.dateInvites)) {
    const dateMap = /* @__PURE__ */ new Map();
    existing.dateInvites.forEach((d) => dateMap.set(d.id, d));
    incoming.dateInvites.forEach((d) => dateMap.set(d.id, { ...dateMap.get(d.id) || {}, ...d }));
    merged.dateInvites = Array.from(dateMap.values());
  }
  if (Array.isArray(existing.smallCravings) && Array.isArray(incoming.smallCravings)) {
    const cMap = /* @__PURE__ */ new Map();
    existing.smallCravings.forEach((c) => cMap.set(c.id, c));
    incoming.smallCravings.forEach((c) => cMap.set(c.id, { ...cMap.get(c.id) || {}, ...c }));
    merged.smallCravings = Array.from(cMap.values());
  }
  if (incoming.flowerPreferences) {
    merged.flowerPreferences = { ...existing.flowerPreferences || {}, ...incoming.flowerPreferences };
  }
  if (incoming.coupleProfile) {
    merged.coupleProfile = { ...existing.coupleProfile || {}, ...incoming.coupleProfile };
  }
  if (incoming.coupleXP !== void 0 || existing.coupleXP !== void 0) {
    merged.coupleXP = Math.max(Number(existing.coupleXP) || 0, Number(incoming.coupleXP) || 0);
  }
  if (Array.isArray(existing.xpHistory) && Array.isArray(incoming.xpHistory)) {
    const xpMap = /* @__PURE__ */ new Map();
    existing.xpHistory.forEach((x) => xpMap.set(x.id || `${x.date}_${x.action}`, x));
    incoming.xpHistory.forEach((x) => xpMap.set(x.id || `${x.date}_${x.action}`, x));
    merged.xpHistory = Array.from(xpMap.values());
  }
  if (Array.isArray(existing.timeCapsules) && Array.isArray(incoming.timeCapsules)) {
    const tcMap = /* @__PURE__ */ new Map();
    existing.timeCapsules.forEach((t) => tcMap.set(t.id, t));
    incoming.timeCapsules.forEach((t) => tcMap.set(t.id, { ...tcMap.get(t.id) || {}, ...t }));
    merged.timeCapsules = Array.from(tcMap.values());
  }
  if (Array.isArray(existing.loveTaps) && Array.isArray(incoming.loveTaps)) {
    const ltMap = /* @__PURE__ */ new Map();
    existing.loveTaps.forEach((t) => ltMap.set(t.id, t));
    incoming.loveTaps.forEach((t) => ltMap.set(t.id, { ...ltMap.get(t.id) || {}, ...t }));
    merged.loveTaps = Array.from(ltMap.values()).slice(-50);
  }
  if (Array.isArray(existing.scheduleEvents) || Array.isArray(incoming.scheduleEvents)) {
    const evMap = /* @__PURE__ */ new Map();
    (existing.scheduleEvents || []).forEach((e) => evMap.set(e.id, e));
    (incoming.scheduleEvents || []).forEach((e) => evMap.set(e.id, { ...evMap.get(e.id) || {}, ...e }));
    merged.scheduleEvents = Array.from(evMap.values()).filter((e) => !e.deleted);
  }
  if (Array.isArray(existing.moodHistory) || Array.isArray(incoming.moodHistory)) {
    const mdMap = /* @__PURE__ */ new Map();
    (existing.moodHistory || []).forEach((m) => mdMap.set(m.id || m.date, m));
    (incoming.moodHistory || []).forEach((m) => mdMap.set(m.id || m.date, { ...mdMap.get(m.id || m.date) || {}, ...m }));
    merged.moodHistory = Array.from(mdMap.values());
  }
  if (Array.isArray(existing.achievements) || Array.isArray(incoming.achievements)) {
    const achMap = /* @__PURE__ */ new Map();
    (existing.achievements || []).forEach((a) => achMap.set(a.id, a));
    (incoming.achievements || []).forEach((a) => achMap.set(a.id, { ...achMap.get(a.id) || {}, ...a }));
    merged.achievements = Array.from(achMap.values());
  }
  if (existing.dailyQuiz || incoming.dailyQuiz) {
    const exQuiz = existing.dailyQuiz || {};
    const inQuiz = incoming.dailyQuiz || {};
    if (exQuiz.id === inQuiz.id) {
      merged.dailyQuiz = {
        ...exQuiz,
        ...inQuiz,
        partner1Answer: inQuiz.partner1Answer || exQuiz.partner1Answer,
        partner2Answer: inQuiz.partner2Answer || exQuiz.partner2Answer,
        isMatch: inQuiz.isMatch || exQuiz.isMatch
      };
    } else if (inQuiz.id && (!exQuiz.id || inQuiz.id > exQuiz.id)) {
      merged.dailyQuiz = inQuiz;
    } else {
      merged.dailyQuiz = exQuiz;
    }
  }
  if (Array.isArray(existing.feedItems) || Array.isArray(incoming.feedItems)) {
    const fMap = /* @__PURE__ */ new Map();
    (existing.feedItems || []).forEach((f) => fMap.set(f.id || f.title, f));
    (incoming.feedItems || []).forEach((f) => fMap.set(f.id || f.title, { ...fMap.get(f.id || f.title) || {}, ...f }));
    merged.feedItems = Array.from(fMap.values()).slice(-50);
  }
  return merged;
}
async function getCoupleData(key) {
  if (isProd2()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const rows = await db.select().from(coupleData).where(eq(coupleData.id, key)).limit(1);
      return rows && rows.length > 0 ? rows[0].data : null;
    } catch (err) {
      logger.error("SQL \u0447\u0442\u0435\u043D\u0438\u0435 coupleData \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u043E\u0441\u044C \u0441\u0431\u043E\u0435\u043C \u0432 production (fail-fast)", err, { key });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      const rows = await db.select().from(coupleData).where(eq(coupleData.id, key)).limit(1);
      if (rows && rows.length > 0) {
        return rows[0].data;
      }
    } catch (err) {
      logger.warn("SQL \u0447\u0442\u0435\u043D\u0438\u0435 coupleData \u0441\u0431\u043E\u0438\u0442, \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430", { key }, err);
    }
  }
  const store = readEmergencyFile();
  return store.coupleData?.[key] || null;
}
async function saveCoupleData(key, data) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (isProd2()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.insert(coupleData).values({
        id: key,
        data,
        lastUpdatedAt: now
      }).onConflictDoUpdate({
        target: coupleData.id,
        set: {
          data,
          lastUpdatedAt: now
        }
      });
      return;
    } catch (err) {
      logger.error("SQL \u0437\u0430\u043F\u0438\u0441\u044C coupleData \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0430\u0441\u044C \u0441\u0431\u043E\u0435\u043C \u0432 production (fail-fast)", err, { key });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      await db.insert(coupleData).values({
        id: key,
        data,
        lastUpdatedAt: now
      }).onConflictDoUpdate({
        target: coupleData.id,
        set: {
          data,
          lastUpdatedAt: now
        }
      });
    } catch (err) {
      logger.error("SQL \u0437\u0430\u043F\u0438\u0441\u044C coupleData \u0441\u0431\u043E\u0438\u0442, \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0432 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u0444\u0430\u0439\u043B", err, { key });
    }
  }
  const store = readEmergencyFile();
  if (!store.coupleData) store.coupleData = {};
  store.coupleData[key] = data;
  writeEmergencyFile(store);
}

// src/server/aiService.ts
import crypto from "crypto";
var GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
var MODEL_NAME = "qwen/qwen3.8-27b";
async function callGroqChat(messages) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    logger.warn("GROQ_API_KEY \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u0432 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0438 (.env)");
    return null;
  }
  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages,
        model: MODEL_NAME,
        temperature: 0.5,
        max_tokens: 650,
        stream: false
      })
    });
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        logger.info(`\u041E\u0442\u0432\u0435\u0442 Groq \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u043E\u043B\u0443\u0447\u0435\u043D (\u043C\u043E\u0434\u0435\u043B\u044C: ${MODEL_NAME})`);
        return content;
      }
    }
    const errText = await response.text();
    logger.warn(`Groq ${MODEL_NAME} \u0441\u0442\u0430\u0442\u0443\u0441 ${response.status}: ${errText.slice(0, 200)}`);
  } catch (err) {
    console.error("[Groq API Error]:", err);
  }
  return null;
}
async function saveAIMessageToDb(userLogin, prompt, reply) {
  if (!userLogin) return;
  const cleanLogin = String(userLogin).toLowerCase().replace(/^@/, "");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const userMsg = {
    id: crypto.randomUUID(),
    coupleId: `ai_${cleanLogin}`,
    senderLogin: cleanLogin,
    role: "partner1",
    content: prompt,
    isRead: true,
    createdAt: now
  };
  const aiMsg = {
    id: crypto.randomUUID(),
    coupleId: `ai_${cleanLogin}`,
    senderLogin: "ai_owl",
    role: "ai",
    content: reply,
    isRead: true,
    createdAt: new Date(Date.now() + 100).toISOString()
  };
  if (isSqlConfigured() && db) {
    try {
      await db.insert(chatMessages).values([userMsg, aiMsg]);
      return;
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0418\u0418-\u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0432 PostgreSQL", err, { login: cleanLogin });
    }
  }
  const store = readEmergencyFile();
  if (!store.chatMessages) store.chatMessages = [];
  store.chatMessages.push(userMsg, aiMsg);
  writeEmergencyFile(store);
}

// src/server/modules/chat/chat.service.ts
var isProd3 = () => process.env.NODE_ENV === "production";
async function getCoupleChatMessages(coupleId) {
  if (isProd3()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const msgs2 = await db.select().from(chatMessages).where(eq2(chatMessages.coupleId, coupleId)).orderBy(chatMessages.createdAt).limit(150);
      return msgs2;
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0447\u0442\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430 \u0438\u0437 SQL \u0432 production (fail-fast)", err, { coupleId });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      const msgs2 = await db.select().from(chatMessages).where(eq2(chatMessages.coupleId, coupleId)).orderBy(chatMessages.createdAt).limit(150);
      return msgs2;
    } catch (err) {
      logger.warn("\u0421\u0431\u043E\u0439 \u0447\u0442\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430 \u0438\u0437 SQL, \u0447\u0442\u0435\u043D\u0438\u0435 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430", { coupleId }, err);
    }
  }
  const store = readEmergencyFile();
  const msgs = (store.chatMessages || []).filter((m) => m.coupleId === coupleId).sort((a, b) => a.createdAt > b.createdAt ? 1 : -1).slice(-150);
  return msgs;
}
async function saveChatMessage(params) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const msg = {
    id: crypto2.randomUUID(),
    coupleId: params.coupleId,
    senderLogin: params.senderLogin,
    role: params.role || "partner1",
    content: params.content,
    isRead: false,
    createdAt: now
  };
  if (isProd3()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.insert(chatMessages).values(msg);
      return msg;
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0447\u0430\u0442\u0430 \u0432 SQL \u0432 production (fail-fast)", err, { coupleId: params.coupleId });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      await db.insert(chatMessages).values(msg);
      return msg;
    } catch (err) {
      logger.warn("\u0421\u0431\u043E\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0447\u0430\u0442\u0430 \u0432 SQL, \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0444\u0430\u0439\u043B", { coupleId: params.coupleId }, err);
    }
  }
  const store = readEmergencyFile();
  if (!store.chatMessages) store.chatMessages = [];
  store.chatMessages.push(msg);
  writeEmergencyFile(store);
  return msg;
}
async function getAIMessages(login) {
  const aiCoupleId = `ai_${login}`;
  if (isProd3()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const msgs2 = await db.select().from(chatMessages).where(eq2(chatMessages.coupleId, aiCoupleId)).orderBy(chatMessages.createdAt).limit(100);
      return msgs2;
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0447\u0442\u0435\u043D\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0418\u0418 \u0438\u0437 SQL \u0432 production (fail-fast)", err, { login });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      const msgs2 = await db.select().from(chatMessages).where(eq2(chatMessages.coupleId, aiCoupleId)).orderBy(chatMessages.createdAt).limit(100);
      return msgs2;
    } catch (err) {
      logger.warn("\u0421\u0431\u043E\u0439 \u0447\u0442\u0435\u043D\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0418\u0418 \u0438\u0437 SQL, \u0447\u0442\u0435\u043D\u0438\u0435 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430", { login }, err);
    }
  }
  const store = readEmergencyFile();
  const msgs = (store.chatMessages || []).filter((m) => m.coupleId === aiCoupleId).sort((a, b) => a.createdAt > b.createdAt ? 1 : -1).slice(-100);
  return msgs;
}

// src/server/shared/middleware/errorHandler.ts
function errorHandler(err, req, res, next) {
  logger.error("\u041D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 API", { path: req.path, method: req.method }, err);
  if (isDatabaseError(err) || process.env.NODE_ENV === "production" && isDatabaseError(err)) {
    return res.status(503).json({
      error: "\u0421\u0435\u0440\u0432\u0438\u0441 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443",
      code: "DB_UNAVAILABLE"
    });
  }
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430";
  return res.status(statusCode).json({
    error: message,
    code: err.code || "INTERNAL_ERROR"
  });
}

// src/server/modules/auth/auth.routes.ts
import { Router } from "express";

// src/server/shared/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
var isTestEnvironment = (req) => process.env.NODE_ENV === "test" || req.headers["x-test-suite"] === "true";
var registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req, res) => {
    logger.security("\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438", {
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json({
      error: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u0447\u0430\u0441."
    });
  }
});
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req, res) => {
    logger.security("\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u0432\u0445\u043E\u0434\u0430", {
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json({
      error: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u0432\u0445\u043E\u0434\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 15 \u043C\u0438\u043D\u0443\u0442."
    });
  }
});
var aiLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req, res) => {
    logger.security("\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A \u0418\u0418", {
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json({
      error: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A \u0418\u0418-\u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0443. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0441\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0443\u044E \u043F\u0430\u0443\u0437\u0443."
    });
  }
});
var pairLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req, res) => {
    logger.security("\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u043F\u0430\u0440\u043D\u044B\u0445 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439", {
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json({
      error: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435."
    });
  }
});
var photoUploadLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnvironment,
  handler: (req, res) => {
    logger.security("\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u043E\u0442\u043E", {
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json({
      error: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0447\u0430\u0441\u0442\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0439. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u0434\u043E\u0436\u0434\u0438\u0442\u0435 \u043C\u0438\u043D\u0443\u0442\u0443."
    });
  }
});

// src/server/shared/middleware/validation.ts
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message
      }));
      return res.status(400).json({
        error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0432\u0445\u043E\u0434\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445",
        code: "VALIDATION_ERROR",
        details: issues
      });
    }
    req.body = result.data;
    next();
  };
}

// src/server/shared/middleware/auth.middleware.ts
import jwt from "jsonwebtoken";

// src/server/shared/utils/sse.ts
var recentTouches = [];
var sseClients = /* @__PURE__ */ new Map();
function registerSSEClient(login, res) {
  const cleanLogin = login.toLowerCase().replace(/^@/, "");
  if (!sseClients.has(cleanLogin)) {
    sseClients.set(cleanLogin, []);
  }
  sseClients.get(cleanLogin).push(res);
}
function removeSSEClient(login, res) {
  const cleanLogin = login.toLowerCase().replace(/^@/, "");
  const clients = sseClients.get(cleanLogin);
  if (clients) {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
    if (clients.length === 0) sseClients.delete(cleanLogin);
  }
}
function sendSSEEventToUser(login, eventType, payload) {
  const cleanLogin = login.toLowerCase().replace(/^@/, "");
  const clients = sseClients.get(cleanLogin);
  if (clients && clients.length > 0) {
    const data = `event: ${eventType}
data: ${JSON.stringify(payload)}

`;
    clients.forEach((res) => {
      try {
        res.write(data);
      } catch (err) {
      }
    });
  }
}

// src/server/modules/realtime/realtime.service.ts
import { eq as eq3, and, gt, desc } from "drizzle-orm";
var pushSubscriptions2 = [];
var lastActiveCache = /* @__PURE__ */ new Map();
async function touchUserLastActive(login) {
  const cleanLogin = String(login || "").toLowerCase().replace(/^@/, "").trim();
  if (!cleanLogin) return;
  const now = Date.now();
  const lastTime = lastActiveCache.get(cleanLogin) || 0;
  if (now - lastTime < 25e3) {
    return;
  }
  lastActiveCache.set(cleanLogin, now);
  const nowIso = new Date(now).toISOString();
  if (isSqlConfigured() && db) {
    try {
      await db.update(users).set({ lastActiveAt: nowIso }).where(eq3(users.login, cleanLogin));
    } catch (err) {
      logger.warn("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F lastActiveAt \u0432 SQL", { login: cleanLogin }, err);
    }
  }
  try {
    const store = readEmergencyFile();
    if (store.users && store.users[cleanLogin]) {
      store.users[cleanLogin].lastActiveAt = nowIso;
      writeEmergencyFile(store);
    }
  } catch {
  }
}
async function recordCoupleEvent(params) {
  const eventId = params.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  if (isSqlConfigured() && db) {
    try {
      await db.insert(coupleEvents).values({
        id: eventId,
        coupleId: params.coupleId,
        targetLogin: params.targetLogin,
        senderLogin: params.senderLogin,
        eventType: params.eventType,
        payload: params.payload,
        createdAt: nowIso
      });
    } catch (err) {
      logger.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u043E\u0431\u044B\u0442\u0438\u0435 \u0432 \u0442\u0430\u0431\u043B\u0438\u0446\u0443 couple_events", void 0, err);
    }
  }
  sendSSEEventToUser(params.targetLogin, params.eventType, params.payload);
  return { id: eventId, createdAt: nowIso };
}
async function sendQuickTouch(params) {
  const sLogin = String(params.senderLogin).toLowerCase().replace(/^@/, "");
  const tLogin = String(params.targetLogin).toLowerCase().replace(/^@/, "");
  const now = Date.now();
  const tenSecondsAgo = now - 1e4;
  const existingRecent = recentTouches.find(
    (t) => t.senderLogin === sLogin && t.targetLogin === tLogin && t.actionType === params.actionType && new Date(t.createdAt).getTime() > tenSecondsAgo
  );
  if (existingRecent) {
    return {
      status: "throttled",
      throttled: true,
      message: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0443\u0436\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u043D\u0435\u0434\u0430\u0432\u043D\u043E",
      touch: existingRecent
    };
  }
  const newTouch = {
    id: `touch-${now}-${Math.random().toString(36).slice(2, 7)}`,
    senderLogin: sLogin,
    senderName: params.senderName || sLogin,
    targetLogin: tLogin,
    actionType: params.actionType,
    title: params.title || `${params.senderName || sLogin} \u043E\u0431\u0440\u0430\u0442\u0438\u043B(\u0430) \u043D\u0430 \u0432\u0430\u0441 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435`,
    subtitle: params.subtitle || "\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E",
    icon: params.icon || "heart",
    iconBg: params.iconBg || "bg-rose-500/10",
    iconColor: params.iconColor || "text-rose-500",
    customNote: params.customNote,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  recentTouches.unshift(newTouch);
  if (recentTouches.length > 200) recentTouches.pop();
  const coupleKey = [sLogin, tLogin].sort().join("_");
  if (isSqlConfigured() && db) {
    try {
      await db.insert(coupleEvents).values({
        id: newTouch.id,
        coupleId: coupleKey,
        targetLogin: tLogin,
        senderLogin: sLogin,
        eventType: "touch",
        payload: newTouch,
        createdAt: newTouch.createdAt
      });
    } catch (err) {
      logger.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043A\u0430\u0441\u0430\u043D\u0438\u0435 \u0432 couple_events (PostgreSQL)", void 0, err);
    }
  }
  sendSSEEventToUser(tLogin, "touch", newTouch);
  logger.info("\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u043A\u0430\u0441\u0430\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u0432 \u0411\u0414 \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", {
    from: sLogin,
    to: tLogin,
    action: params.actionType
  });
  return {
    status: "dispatched",
    throttled: false,
    touch: newTouch
  };
}
function getUserTouches(login) {
  const cleanLogin = String(login || "").toLowerCase().replace(/^@/, "");
  return recentTouches.filter(
    (t) => t.targetLogin === cleanLogin || t.senderLogin === cleanLogin
  );
}
async function handleHeartbeat(login) {
  const cleanLogin = String(login || "").toLowerCase().replace(/^@/, "").trim();
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let partnerLastActiveAt = null;
  let partnerLogin = null;
  if (cleanLogin) {
    await touchUserLastActive(cleanLogin);
    if (isSqlConfigured() && db) {
      try {
        const [currentUserRecord] = await db.select().from(users).where(eq3(users.login, cleanLogin)).limit(1);
        if (currentUserRecord?.partnerLogin) {
          partnerLogin = currentUserRecord.partnerLogin;
          const [partnerRecord] = await db.select().from(users).where(eq3(users.login, partnerLogin)).limit(1);
          if (partnerRecord?.lastActiveAt) {
            partnerLastActiveAt = partnerRecord.lastActiveAt;
          }
        }
      } catch (err) {
        logger.warn("Heartbeat error in Neon DB", void 0, err);
      }
    }
    if (!partnerLastActiveAt) {
      try {
        const store = readEmergencyFile();
        const userObj = store.users?.[cleanLogin];
        if (userObj?.partnerLogin) {
          partnerLogin = partnerLogin || userObj.partnerLogin;
          const partnerObj = store.users?.[userObj.partnerLogin.toLowerCase()];
          if (partnerObj?.lastActiveAt) {
            partnerLastActiveAt = partnerObj.lastActiveAt;
          }
        }
      } catch {
      }
    }
  }
  const isPartnerOnline = partnerLastActiveAt ? Date.now() - new Date(partnerLastActiveAt).getTime() < 18e4 : false;
  return {
    ok: true,
    timestamp: nowIso,
    login: cleanLogin,
    partnerLogin,
    partnerLastActiveAt,
    isPartnerOnline
  };
}
async function getEventsPoll(params) {
  const cleanLogin = String(params.login || "").toLowerCase().replace(/^@/, "").trim();
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const events = [];
  let partnerLastActiveAt = null;
  if (cleanLogin) {
    await touchUserLastActive(cleanLogin);
  }
  if (isSqlConfigured() && db && cleanLogin) {
    try {
      const [currentUserRecord] = await db.select().from(users).where(eq3(users.login, cleanLogin)).limit(1);
      if (currentUserRecord?.partnerLogin) {
        const [partnerRecord] = await db.select().from(users).where(eq3(users.login, currentUserRecord.partnerLogin)).limit(1);
        if (partnerRecord?.lastActiveAt) {
          partnerLastActiveAt = partnerRecord.lastActiveAt;
        }
      }
      const cutoffTime = params.since || new Date(Date.now() - 45e3).toISOString();
      const dbEvents = await db.select().from(coupleEvents).where(
        and(
          eq3(coupleEvents.targetLogin, cleanLogin),
          gt(coupleEvents.createdAt, cutoffTime)
        )
      ).orderBy(desc(coupleEvents.createdAt)).limit(30);
      for (const ev of dbEvents) {
        if (params.lastEventId && ev.id === params.lastEventId) continue;
        events.push({
          id: ev.id,
          type: ev.eventType,
          data: ev.payload,
          createdAt: ev.createdAt
        });
      }
    } catch (err) {
      logger.warn("Events poll error in Neon DB", void 0, err);
    }
  }
  if (!partnerLastActiveAt && cleanLogin) {
    try {
      const store = readEmergencyFile();
      const u = store.users?.[cleanLogin];
      if (u?.partnerLogin) {
        const p = store.users?.[u.partnerLogin.toLowerCase()];
        if (p?.lastActiveAt) {
          partnerLastActiveAt = p.lastActiveAt;
        }
      }
    } catch {
    }
  }
  if (events.length === 0) {
    const memoryTouches = recentTouches.filter(
      (t) => t.targetLogin === cleanLogin && (!params.lastEventId || t.id !== params.lastEventId)
    );
    for (const t of memoryTouches.slice(0, 10)) {
      events.push({
        id: t.id,
        type: "touch",
        data: t,
        createdAt: t.createdAt
      });
    }
  }
  const isPartnerOnline = partnerLastActiveAt ? Date.now() - new Date(partnerLastActiveAt).getTime() < 18e4 : false;
  return {
    events,
    touches: getUserTouches(cleanLogin),
    partnerLastActiveAt,
    isPartnerOnline,
    serverTime: nowIso
  };
}

// src/server/shared/middleware/auth.middleware.ts
function generateToken(login) {
  return jwt.sign({ login: login.toLowerCase() }, config.jwtSecret, { expiresIn: "30d" });
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const userLogin = String(decoded.login || "").toLowerCase();
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D" });
    }
    req.userLogin = userLogin;
    req.user = { login: userLogin };
    touchUserLastActive(userLogin).catch(() => {
    });
    next();
  } catch (err) {
    logger.warn("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 JWT \u0442\u043E\u043A\u0435\u043D\u0430", { ip: req.ip }, err);
    return res.status(401).json({ error: "\u0421\u0435\u0441\u0441\u0438\u044F \u0438\u0441\u0442\u0435\u043A\u043B\u0430 \u0438\u043B\u0438 \u0442\u043E\u043A\u0435\u043D \u043D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u0435\u043D" });
  }
}

// src/server/shared/validators/auth.validator.ts
import { z } from "zod";
var loginSchema = z.string().min(3, "\u041B\u043E\u0433\u0438\u043D \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u043A\u043E\u0440\u043E\u0447\u0435 3 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").max(20, "\u041B\u043E\u0433\u0438\u043D \u043D\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C 20 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").regex(/^[a-zA-Zа-яА-Я0-9_]+$/, "\u041B\u043E\u0433\u0438\u043D \u043C\u043E\u0436\u0435\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u043A\u0432\u044B, \u0446\u0438\u0444\u0440\u044B \u0438 _").transform((v) => v.toLowerCase().replace(/^@/, ""));
var passwordSchema = z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u043A\u043E\u0440\u043E\u0447\u0435 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").max(100, "\u041F\u0430\u0440\u043E\u043B\u044C \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439");
var registerSchema = z.object({
  login: loginSchema,
  password: passwordSchema,
  name: z.string().min(1, "\u0418\u043C\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E").max(50, "\u0418\u043C\u044F \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u043E\u0435").optional(),
  gender: z.enum(["male", "female"], { message: "\u041F\u043E\u043B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 (male/female)" })
});
var loginRequestSchema = z.object({
  login: loginSchema,
  password: passwordSchema
});
var changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "\u0421\u0442\u0430\u0440\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"),
  newPassword: passwordSchema
});
var resetPasswordSchema = z.object({
  login: loginSchema,
  newPassword: passwordSchema,
  secretKey: z.string().optional()
});
var updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  avatarEmoji: z.string().max(30).optional(),
  city: z.string().max(100).optional().nullable(),
  startDate: z.string().max(30).optional().nullable(),
  loveLanguage: z.string().max(50).optional().nullable(),
  attachmentStyle: z.string().max(50).optional().nullable(),
  currentMood: z.record(z.string(), z.unknown()).optional().nullable()
});

// src/server/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import crypto3 from "crypto";

// src/server/types.ts
function toSafeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// src/server/modules/auth/auth.service.ts
var DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
var isProd4 = () => process.env.NODE_ENV === "production";
async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
async function getAllUsersSafe() {
  const userMap = {};
  if (isProd4()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      const allSqlUsers = await db.select().from(users);
      for (const u of allSqlUsers) {
        userMap[u.login.toLowerCase()] = toSafeUser(u);
      }
      return Object.values(userMap);
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0447\u0442\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u0438\u0437 SQL \u0432 production (fail-fast)", err);
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      const allSqlUsers = await db.select().from(users);
      for (const u of allSqlUsers) {
        userMap[u.login.toLowerCase()] = toSafeUser(u);
      }
    } catch (err) {
      logger.warn("\u0421\u0431\u043E\u0439 \u0447\u0442\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u0438\u0437 SQL, \u0447\u0442\u0435\u043D\u0438\u0435 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430", void 0, err);
    }
  }
  const store = readEmergencyFile();
  for (const [k, u] of Object.entries(store.users || {})) {
    if (u && typeof u === "object" && !userMap[k.toLowerCase()]) {
      userMap[k.toLowerCase()] = toSafeUser(u);
    }
  }
  return Object.values(userMap);
}
async function registerUser(params) {
  const cleanLogin = String(params.login).trim().toLowerCase().replace(/^@/, "");
  const existing = await findUserByLogin(cleanLogin);
  if (existing) {
    throw { status: 400, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C \u043B\u043E\u0433\u0438\u043D\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" };
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(params.password, salt);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const userId = crypto3.randomUUID();
  const newUser = {
    id: userId,
    login: cleanLogin,
    passwordHash,
    name: params.name?.trim() || cleanLogin,
    gender: params.gender,
    avatarEmoji: "sparkles",
    partnerLogin: null,
    pairedAt: null,
    startDate: null,
    city: null,
    loveLanguage: null,
    attachmentStyle: null,
    currentMood: null,
    lastActiveAt: now,
    createdAt: now
  };
  await upsertUser(newUser);
  const token = generateToken(cleanLogin);
  logger.info("\u041D\u043E\u0432\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D", { login: cleanLogin });
  return {
    token,
    user: toSafeUser(newUser)
  };
}
async function loginUser(params, clientIp) {
  const cleanLogin = String(params.login).trim().toLowerCase().replace(/^@/, "");
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    await bcrypt.compare(params.password, DUMMY_HASH);
    throw { status: 401, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" };
  }
  const match = await verifyPassword(params.password, user.passwordHash);
  if (!match) {
    logger.security("\u041D\u0435\u0443\u0434\u0430\u0447\u043D\u0430\u044F \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u0432\u0445\u043E\u0434\u0430", { login: cleanLogin, ip: clientIp });
    throw { status: 401, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  user.lastActiveAt = now;
  await upsertUser(user);
  const token = generateToken(cleanLogin);
  logger.info("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0432\u043E\u0448\u0451\u043B \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443", { login: cleanLogin });
  return {
    token,
    user: toSafeUser(user)
  };
}
async function getUserProfile(login) {
  const cleanLogin = String(login || "").toLowerCase().replace(/^@/, "");
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    throw { status: 404, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  }
  return toSafeUser(user);
}
async function updateUserProfile(userLogin, updates) {
  const user = await findUserByLogin(userLogin);
  if (!user) throw { status: 404, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  if (updates.name !== void 0) user.name = updates.name;
  if (updates.gender !== void 0) user.gender = updates.gender;
  if (updates.avatarEmoji !== void 0) user.avatarEmoji = updates.avatarEmoji;
  if (updates.city !== void 0) user.city = updates.city;
  if (updates.startDate !== void 0) user.startDate = updates.startDate;
  if (updates.loveLanguage !== void 0) user.loveLanguage = updates.loveLanguage;
  if (updates.attachmentStyle !== void 0) user.attachmentStyle = updates.attachmentStyle;
  if (updates.currentMood !== void 0) user.currentMood = updates.currentMood;
  user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
  await upsertUser(user);
  logger.info("\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D", { login: userLogin });
  return toSafeUser(user);
}
async function changeUserPassword(userLogin, oldPass, newPass) {
  const user = await findUserByLogin(userLogin);
  if (!user) throw { status: 404, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  const match = await verifyPassword(oldPass, user.passwordHash);
  if (!match) {
    throw { status: 400, message: "\u0421\u0442\u0430\u0440\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0443\u043A\u0430\u0437\u0430\u043D \u043D\u0435\u0432\u0435\u0440\u043D\u043E" };
  }
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPass, salt);
  await upsertUser(user);
  logger.info("\u041F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D", { login: userLogin });
}
async function resetUserPassword(login, newPass) {
  const cleanLogin = String(login).toLowerCase().replace(/^@/, "");
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    throw { status: 404, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C \u043B\u043E\u0433\u0438\u043D\u043E\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  }
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPass, salt);
  await upsertUser(user);
  logger.info("\u041F\u0430\u0440\u043E\u043B\u044C \u0441\u0431\u0440\u043E\u0448\u0435\u043D", { login: cleanLogin });
}
async function syncAccounts(accounts) {
  for (const acc of accounts) {
    if (acc && acc.login) {
      const existing = await findUserByLogin(acc.login);
      if (!existing) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const cleanLogin = String(acc.login).toLowerCase().replace(/^@/, "");
        const passwordHash = acc.passwordHash || await bcrypt.hash(acc.password || "password123", 10);
        await upsertUser({
          id: acc.id || crypto3.randomUUID(),
          login: cleanLogin,
          passwordHash,
          name: acc.name || cleanLogin,
          gender: acc.gender || null,
          avatarEmoji: acc.avatarEmoji || "sparkles",
          partnerLogin: acc.partnerLogin ? String(acc.partnerLogin).toLowerCase() : null,
          pairedAt: acc.pairedAt || null,
          startDate: acc.startDate || null,
          city: acc.city || null,
          loveLanguage: acc.loveLanguage || null,
          attachmentStyle: acc.attachmentStyle || null,
          currentMood: acc.currentMood || null,
          lastActiveAt: now,
          createdAt: acc.createdAt || now
        });
      }
    }
  }
}

// src/server/modules/auth/auth.routes.ts
var authRouter = Router();
authRouter.get("/users", async (req, res, next) => {
  try {
    const users3 = await getAllUsersSafe();
    return res.json({ users: users3 });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/sync", async (req, res, next) => {
  try {
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
authRouter.get("/user/:login", requireAuth, async (req, res, next) => {
  try {
    const paramLogin = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    const userLogin = req.user?.login;
    if (paramLogin !== userLogin) {
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0447\u0443\u0436\u043E\u043C\u0443 \u043F\u0440\u043E\u0444\u0438\u043B\u044E" });
    }
    const user = await getUserProfile(paramLogin);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/update-profile", requireAuth, validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) return res.status(401).json({ error: "\u041D\u0435\u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" });
    const user = await updateUserProfile(userLogin, req.body);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/change-password", requireAuth, validateBody(changePasswordSchema), async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) return res.status(401).json({ error: "\u041D\u0435\u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" });
    const { oldPassword, newPassword } = req.body;
    await changeUserPassword(userLogin, oldPassword, newPassword);
    return res.json({ status: "ok", message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0451\u043D" });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { login, newPassword } = req.body;
    await resetUserPassword(login, newPassword);
    return res.json({ status: "ok", message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u0431\u0440\u043E\u0448\u0435\u043D" });
  } catch (err) {
    next(err);
  }
});

// src/server/modules/pairing/pairing.routes.ts
import { Router as Router2 } from "express";

// src/server/shared/middleware/requirePairOwnership.ts
function getPairKey(login, partnerLogin) {
  if (!partnerLogin) return login.toLowerCase().trim().replace(/^@/, "");
  return [
    login.toLowerCase().trim().replace(/^@/, ""),
    partnerLogin.toLowerCase().trim().replace(/^@/, "")
  ].sort().join("_");
}
function isUserInCouple(coupleId, userLogin) {
  if (!coupleId || !userLogin) return false;
  const cleanUser = userLogin.toLowerCase().trim().replace(/^@/, "");
  const cleanCouple = coupleId.toLowerCase().trim();
  if (cleanCouple === cleanUser) return true;
  if (cleanCouple === `ai_${cleanUser}`) return true;
  if (cleanCouple.startsWith(`${cleanUser}_`) || cleanCouple.endsWith(`_${cleanUser}`) || cleanCouple.includes(`_${cleanUser}_`)) {
    return true;
  }
  return false;
}
function requirePairOwnership(req, res, next) {
  const userLogin = req.user?.login;
  if (!userLogin) {
    return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  let coupleId = null;
  if (req.params?.coupleId || req.params?.key) {
    const targetId = req.params.coupleId || req.params.key;
    if (!isUserInCouple(targetId, userLogin)) {
      logger.security("\u041E\u0442\u043A\u0430\u0437 \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435 (IDOR: params.coupleId/key)", {
        userLogin,
        targetCoupleId: targetId,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430", code: "FORBIDDEN" });
    }
    coupleId = targetId;
  }
  if (req.body?.coupleId) {
    if (!isUserInCouple(req.body.coupleId, userLogin)) {
      logger.security("\u041E\u0442\u043A\u0430\u0437 \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435 (IDOR: body.coupleId)", {
        userLogin,
        targetCoupleId: req.body.coupleId,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430", code: "FORBIDDEN" });
    }
    coupleId = req.body.coupleId;
  }
  if (req.params?.login1 && req.params?.login2) {
    const l1 = req.params.login1.toLowerCase().trim().replace(/^@/, "");
    const l2 = req.params.login2.toLowerCase().trim().replace(/^@/, "");
    if (l1 !== userLogin && l2 !== userLogin) {
      logger.security("\u041E\u0442\u043A\u0430\u0437 \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435 (IDOR: params.login1/login2)", {
        userLogin,
        target: `${l1}_${l2}`,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430", code: "FORBIDDEN" });
    }
    coupleId = getPairKey(l1, l2);
  }
  if (req.body?.login1) {
    const l1 = String(req.body.login1).toLowerCase().trim().replace(/^@/, "");
    const l2 = req.body.login2 ? String(req.body.login2).toLowerCase().trim().replace(/^@/, "") : null;
    if (l1 !== userLogin && l2 !== userLogin) {
      logger.security("\u041E\u0442\u043A\u0430\u0437 \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435 (IDOR: body.login1/login2)", {
        userLogin,
        target: l2 ? `${l1}_${l2}` : l1,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430", code: "FORBIDDEN" });
    }
    coupleId = getPairKey(l1, l2);
  }
  if (req.params?.login) {
    const paramLogin = req.params.login.toLowerCase().trim().replace(/^@/, "");
    if (paramLogin !== userLogin) {
      logger.security("\u041E\u0442\u043A\u0430\u0437 \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435 (IDOR: params.login)", {
        userLogin,
        paramLogin,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430", code: "FORBIDDEN" });
    }
    coupleId = getPairKey(userLogin, paramLogin);
  }
  if (coupleId) {
    req.couple = { id: coupleId };
  }
  next();
}

// src/server/shared/validators/pairing.validator.ts
import { z as z2 } from "zod";
var pairRequestSchema = z2.object({
  fromLogin: loginSchema,
  toLogin: loginSchema
});
var pairAcceptSchema = z2.object({
  fromLogin: loginSchema,
  toLogin: loginSchema
});
var pairRejectSchema = z2.object({
  fromLogin: loginSchema,
  toLogin: loginSchema
});
var pairDisconnectSchema = z2.object({
  login: loginSchema
});

// src/server/modules/pairing/pairing.service.ts
import { eq as eq5, and as and3 } from "drizzle-orm";

// src/server/services/pairService.ts
import { eq as eq4, or as or3, and as and2 } from "drizzle-orm";
import crypto4 from "crypto";
var isProd5 = () => process.env.NODE_ENV === "production";
async function acceptPair(cleanMe, cleanPartner) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (isProd5()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.transaction(async (tx) => {
        await tx.update(users).set({ partnerLogin: cleanPartner, pairedAt: now }).where(eq4(users.login, cleanMe));
        await tx.update(users).set({ partnerLogin: cleanMe, pairedAt: now }).where(eq4(users.login, cleanPartner));
        await tx.delete(pairRequests).where(
          or3(
            and2(eq4(pairRequests.fromLogin, cleanPartner), eq4(pairRequests.toLogin, cleanMe)),
            and2(eq4(pairRequests.fromLogin, cleanMe), eq4(pairRequests.toLogin, cleanPartner))
          )
        );
      });
      logger.info("\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u043D\u0438\u044F \u043F\u0430\u0440\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430 (SQL)", {
        partner1: cleanMe,
        partner2: cleanPartner
      });
    } catch (err) {
      logger.error("CRITICAL: Transaction acceptPair failed in production (fail-fast).", err, {
        partner1: cleanMe,
        partner2: cleanPartner
      });
      throw new DatabaseUnavailableError();
    }
    const updatedMe2 = await findUserByLogin(cleanMe);
    const updatedPartner2 = await findUserByLogin(cleanPartner);
    if (updatedMe2 && updatedPartner2) {
      const key = [cleanMe, cleanPartner].sort().join("_");
      const existingData = await getCoupleData(key);
      if (!existingData || !existingData.coupleProfile) {
        const initData = {
          ...existingData || {},
          coupleProfile: {
            id: "c-" + Date.now(),
            status: "ACTIVE",
            linkCode: `LOOP-${Math.floor(1e3 + Math.random() * 9e3)}`,
            startDate: now.split("T")[0],
            city: updatedMe2.city || updatedPartner2.city || "\u041C\u043E\u0441\u043A\u0432\u0430",
            partner1: {
              id: "partner1",
              name: updatedMe2.name || cleanMe,
              login: cleanMe,
              avatar: updatedMe2.avatarEmoji || "user",
              email: "",
              gender: updatedMe2.gender,
              loveLanguage: updatedMe2.loveLanguage || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
              attachmentStyle: updatedMe2.attachmentStyle || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
              currentMood: updatedMe2.currentMood || { emoji: "calm", label: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E", updatedAt: now }
            },
            partner2: {
              id: "partner2",
              name: updatedPartner2.name || cleanPartner,
              login: cleanPartner,
              avatar: updatedPartner2.avatarEmoji || "user",
              email: "",
              gender: updatedPartner2.gender,
              loveLanguage: updatedPartner2.loveLanguage || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
              attachmentStyle: updatedPartner2.attachmentStyle || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
              currentMood: updatedPartner2.currentMood || { emoji: "calm", label: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E", updatedAt: now }
            },
            level: 1,
            levelName: "\u041F\u0435\u0440\u0432\u044B\u0439 \u0448\u0430\u0433",
            testsCompletedCount: 0
          }
        };
        await saveCoupleData(key, initData);
      }
    }
    return { updatedMe: updatedMe2, updatedPartner: updatedPartner2 };
  }
  let sqlSuccess = false;
  if (isSqlConfigured() && db) {
    try {
      await db.transaction(async (tx) => {
        await tx.update(users).set({ partnerLogin: cleanPartner, pairedAt: now }).where(eq4(users.login, cleanMe));
        await tx.update(users).set({ partnerLogin: cleanMe, pairedAt: now }).where(eq4(users.login, cleanPartner));
        await tx.delete(pairRequests).where(
          or3(
            and2(eq4(pairRequests.fromLogin, cleanPartner), eq4(pairRequests.toLogin, cleanMe)),
            and2(eq4(pairRequests.fromLogin, cleanMe), eq4(pairRequests.toLogin, cleanPartner))
          )
        );
      });
      sqlSuccess = true;
      logger.info("\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u043D\u0438\u044F \u043F\u0430\u0440\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430", {
        partner1: cleanMe,
        partner2: cleanPartner
      });
    } catch (err) {
      logger.error("\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u043D\u0438\u044F \u043F\u0430\u0440\u044B \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0430\u0441\u044C \u043E\u0448\u0438\u0431\u043A\u043E\u0439 (\u043E\u0442\u043A\u0430\u0442)", err, {
        partner1: cleanMe,
        partner2: cleanPartner
      });
    }
  }
  logger.warn("\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u043C\u0435\u0445\u0430\u043D\u0438\u0437\u043C \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u043D\u0438\u044F \u043F\u0430\u0440\u044B \u0432 \u0444\u0430\u0439\u043B\u0435 db_store.json", {
    partner1: cleanMe,
    partner2: cleanPartner
  });
  const store = readEmergencyFile();
  store.users[cleanMe] = {
    ...store.users[cleanMe] || {},
    login: cleanMe,
    partnerLogin: cleanPartner,
    pairedAt: now
  };
  store.users[cleanPartner] = {
    ...store.users[cleanPartner] || {},
    login: cleanPartner,
    partnerLogin: cleanMe,
    pairedAt: now
  };
  if (store.pairRequests) {
    store.pairRequests = store.pairRequests.filter(
      (r) => !(r.fromLogin === cleanPartner && r.toLogin === cleanMe || r.fromLogin === cleanMe && r.toLogin === cleanPartner)
    );
  }
  writeEmergencyFile(store);
  const updatedMe = await findUserByLogin(cleanMe);
  const updatedPartner = await findUserByLogin(cleanPartner);
  if (updatedMe && updatedPartner) {
    const key = [cleanMe, cleanPartner].sort().join("_");
    const existingData = await getCoupleData(key);
    if (!existingData || !existingData.coupleProfile) {
      const initData = {
        ...existingData || {},
        coupleProfile: {
          id: "c-" + Date.now(),
          status: "ACTIVE",
          linkCode: `LOOP-${Math.floor(1e3 + Math.random() * 9e3)}`,
          startDate: now.split("T")[0],
          city: updatedMe.city || updatedPartner.city || "\u041C\u043E\u0441\u043A\u0432\u0430",
          partner1: {
            id: "partner1",
            name: updatedMe.name || cleanMe,
            login: cleanMe,
            avatar: updatedMe.avatarEmoji || "user",
            email: "",
            gender: updatedMe.gender,
            loveLanguage: updatedMe.loveLanguage || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
            attachmentStyle: updatedMe.attachmentStyle || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
            currentMood: updatedMe.currentMood || { emoji: "calm", label: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E", updatedAt: now }
          },
          partner2: {
            id: "partner2",
            name: updatedPartner.name || cleanPartner,
            login: cleanPartner,
            avatar: updatedPartner.avatarEmoji || "user",
            email: "",
            gender: updatedPartner.gender,
            loveLanguage: updatedPartner.loveLanguage || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
            attachmentStyle: updatedPartner.attachmentStyle || "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0442\u0435\u0441\u0442",
            currentMood: updatedPartner.currentMood || { emoji: "calm", label: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u043E", updatedAt: now }
          },
          level: 1,
          levelName: "\u041F\u0435\u0440\u0432\u044B\u0439 \u0448\u0430\u0433",
          testsCompletedCount: 0
        }
      };
      await saveCoupleData(key, initData);
    }
  }
  return { updatedMe, updatedPartner };
}
async function disconnectPair(cleanLogin) {
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    return { error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D", status: 404 };
  }
  const partnerLogin = user.partnerLogin ? String(user.partnerLogin).toLowerCase() : null;
  if (isProd5()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.transaction(async (tx) => {
        await tx.update(users).set({ partnerLogin: null, pairedAt: null }).where(eq4(users.login, cleanLogin));
        if (partnerLogin) {
          await tx.update(users).set({ partnerLogin: null, pairedAt: null }).where(eq4(users.login, partnerLogin));
          await tx.delete(pairRequests).where(
            or3(
              and2(eq4(pairRequests.fromLogin, cleanLogin), eq4(pairRequests.toLogin, partnerLogin)),
              and2(eq4(pairRequests.fromLogin, partnerLogin), eq4(pairRequests.toLogin, cleanLogin))
            )
          );
        }
      });
      logger.info("\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0440\u0430\u0437\u0440\u044B\u0432\u0430 \u043F\u0430\u0440\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430 (SQL)", {
        user: cleanLogin,
        partner: partnerLogin
      });
    } catch (err) {
      logger.error("CRITICAL: Transaction disconnectPair failed in production (fail-fast).", err, {
        user: cleanLogin,
        partner: partnerLogin
      });
      throw new DatabaseUnavailableError();
    }
    const updatedUser2 = await findUserByLogin(cleanLogin);
    return { updatedUser: updatedUser2, status: 200 };
  }
  if (isSqlConfigured() && db) {
    try {
      await db.transaction(async (tx) => {
        await tx.update(users).set({ partnerLogin: null, pairedAt: null }).where(eq4(users.login, cleanLogin));
        if (partnerLogin) {
          await tx.update(users).set({ partnerLogin: null, pairedAt: null }).where(eq4(users.login, partnerLogin));
          await tx.delete(pairRequests).where(
            or3(
              and2(eq4(pairRequests.fromLogin, cleanLogin), eq4(pairRequests.toLogin, partnerLogin)),
              and2(eq4(pairRequests.fromLogin, partnerLogin), eq4(pairRequests.toLogin, cleanLogin))
            )
          );
        }
      });
      logger.info("\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0440\u0430\u0437\u0440\u044B\u0432\u0430 \u043F\u0430\u0440\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430", {
        user: cleanLogin,
        partner: partnerLogin
      });
    } catch (err) {
      logger.error("\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0440\u0430\u0437\u0440\u044B\u0432\u0430 \u043F\u0430\u0440\u044B \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0430\u0441\u044C \u043E\u0448\u0438\u0431\u043A\u043E\u0439 (\u043E\u0442\u043A\u0430\u0442)", err, {
        user: cleanLogin,
        partner: partnerLogin
      });
    }
  }
  logger.warn("\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u043C\u0435\u0445\u0430\u043D\u0438\u0437\u043C \u0440\u0430\u0437\u0440\u044B\u0432\u0430 \u043F\u0430\u0440\u044B \u0432 \u0444\u0430\u0439\u043B\u0435 db_store.json", {
    user: cleanLogin,
    partner: partnerLogin
  });
  const store = readEmergencyFile();
  if (store.users[cleanLogin]) {
    store.users[cleanLogin] = { ...store.users[cleanLogin], partnerLogin: null, pairedAt: null };
  }
  if (partnerLogin && store.users[partnerLogin]) {
    store.users[partnerLogin] = { ...store.users[partnerLogin], partnerLogin: null, pairedAt: null };
  }
  if (store.pairRequests && partnerLogin) {
    store.pairRequests = store.pairRequests.filter(
      (r) => !(r.fromLogin === cleanLogin && r.toLogin === partnerLogin || r.fromLogin === partnerLogin && r.toLogin === cleanLogin)
    );
  }
  writeEmergencyFile(store);
  const updatedUser = await findUserByLogin(cleanLogin);
  return { updatedUser, status: 200 };
}
async function createPairRequest(fromUser, toUser) {
  const cleanFrom = fromUser.login.toLowerCase();
  const cleanTo = toUser.login.toLowerCase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const reqId = crypto4.randomUUID();
  const reqObj = {
    id: reqId,
    fromLogin: cleanFrom,
    fromName: fromUser.name || cleanFrom,
    fromAvatar: fromUser.avatarEmoji || "sparkles",
    toLogin: cleanTo,
    status: "PENDING",
    createdAt: now
  };
  if (isProd5()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.transaction(async (tx) => {
        await tx.delete(pairRequests).where(
          or3(
            and2(eq4(pairRequests.fromLogin, cleanFrom), eq4(pairRequests.toLogin, cleanTo)),
            and2(eq4(pairRequests.fromLogin, cleanTo), eq4(pairRequests.toLogin, cleanFrom))
          )
        );
        await tx.insert(pairRequests).values(reqObj);
      });
      logger.info("\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043F\u0430\u0440\u0443 \u0441\u043E\u0437\u0434\u0430\u043D (SQL \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F)", { from: cleanFrom, to: cleanTo });
      return reqObj;
    } catch (err) {
      logger.error("CRITICAL: Transaction createPairRequest failed in production (fail-fast).", err, { from: cleanFrom, to: cleanTo });
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(pairRequests).where(
          or3(
            and2(eq4(pairRequests.fromLogin, cleanFrom), eq4(pairRequests.toLogin, cleanTo)),
            and2(eq4(pairRequests.fromLogin, cleanTo), eq4(pairRequests.toLogin, cleanFrom))
          )
        );
        await tx.insert(pairRequests).values(reqObj);
      });
      logger.info("\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043F\u0430\u0440\u0443 \u0441\u043E\u0437\u0434\u0430\u043D (SQL \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F)", { from: cleanFrom, to: cleanTo });
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u043D\u0430 \u043F\u0430\u0440\u0443 \u0432 SQL", err, { from: cleanFrom, to: cleanTo });
    }
  }
  logger.warn("\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043F\u0430\u0440\u0443 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u043E\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 JSON", { from: cleanFrom, to: cleanTo });
  const store = readEmergencyFile();
  if (!store.pairRequests) store.pairRequests = [];
  store.pairRequests = store.pairRequests.filter(
    (r) => !(r.fromLogin === cleanFrom && r.toLogin === cleanTo || r.fromLogin === cleanTo && r.toLogin === cleanFrom)
  );
  store.pairRequests.push(reqObj);
  writeEmergencyFile(store);
  return reqObj;
}

// src/server/modules/pairing/pairing.service.ts
var isProd6 = () => process.env.NODE_ENV === "production";
async function requestPairConnection(fromLogin, toLogin) {
  if (fromLogin === toLogin) {
    throw { status: 400, message: "\u041D\u0435\u043B\u044C\u0437\u044F \u0441\u0432\u044F\u0437\u0430\u0442\u044C \u043F\u0430\u0440\u0443 \u0441 \u0441\u0430\u043C\u0438\u043C \u0441\u043E\u0431\u043E\u0439" };
  }
  const fromUser = await findUserByLogin(fromLogin);
  const toUser = await findUserByQuery(toLogin);
  if (!fromUser) throw { status: 404, message: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  if (!toUser) throw { status: 404, message: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440 \u0441 \u0442\u0430\u043A\u0438\u043C \u043B\u043E\u0433\u0438\u043D\u043E\u043C \u0438\u043B\u0438 \u0438\u043C\u0435\u043D\u0435\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  if (fromUser.partnerLogin) throw { status: 400, message: "\u0412\u044B \u0443\u0436\u0435 \u0441\u043E\u0441\u0442\u043E\u0438\u0442\u0435 \u0432 \u043F\u0430\u0440\u0435", code: "ALREADY_PAIRED" };
  if (toUser.partnerLogin) throw { status: 400, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0436\u0435 \u0441\u043E\u0441\u0442\u043E\u0438\u0442 \u0432 \u043F\u0430\u0440\u0435", code: "TARGET_ALREADY_PAIRED" };
  if (fromUser.gender && toUser.gender && fromUser.gender === toUser.gender) {
    throw { status: 400, message: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043E\u0434\u043D\u043E\u043F\u043E\u043B\u044B\u0445 \u043F\u0430\u0440 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u043E\u0439. Loop \u0441\u043F\u0440\u043E\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D \u0434\u043B\u044F \u0433\u0435\u0442\u0435\u0440\u043E\u0441\u0435\u043A\u0441\u0443\u0430\u043B\u044C\u043D\u044B\u0445 \u043F\u0430\u0440." };
  }
  const reqObj = await createPairRequest(fromUser, toUser);
  return reqObj;
}
async function rejectPairRequest(fromLogin, toLogin) {
  if (isProd6()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.delete(pairRequests).where(
        and3(eq5(pairRequests.fromLogin, fromLogin), eq5(pairRequests.toLogin, toLogin))
      );
      return;
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u044B \u0438\u0437 SQL \u0432 production (fail-fast)", err);
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      await db.delete(pairRequests).where(
        and3(eq5(pairRequests.fromLogin, fromLogin), eq5(pairRequests.toLogin, toLogin))
      );
    } catch (err) {
      logger.warn("\u0421\u0431\u043E\u0439 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u044B \u0438\u0437 SQL", void 0, err);
    }
  }
  const store = readEmergencyFile();
  if (store.pairRequests) {
    store.pairRequests = store.pairRequests.filter(
      (r) => !(r.fromLogin === fromLogin && r.toLogin === toLogin)
    );
    writeEmergencyFile(store);
  }
}
async function getPairStatus(login) {
  const user = await findUserByLogin(login);
  if (!user) throw { status: 404, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  let partner;
  if (user.partnerLogin) {
    partner = await findUserByLogin(user.partnerLogin);
  }
  let incoming = [];
  let outgoing = [];
  if (isProd6()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      incoming = await db.select().from(pairRequests).where(and3(eq5(pairRequests.toLogin, login), eq5(pairRequests.status, "PENDING")));
      outgoing = await db.select().from(pairRequests).where(and3(eq5(pairRequests.fromLogin, login), eq5(pairRequests.status, "PENDING")));
      return {
        paired: !!user.partnerLogin,
        user: toSafeUser(user),
        partner: partner ? toSafeUser(partner) : null,
        incomingRequests: incoming,
        outgoingRequests: outgoing
      };
    } catch (err) {
      logger.error("\u0421\u0431\u043E\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 pair_requests \u0438\u0437 SQL \u0432 production (fail-fast)", err);
      throw new DatabaseUnavailableError();
    }
  }
  if (isSqlConfigured() && db) {
    try {
      incoming = await db.select().from(pairRequests).where(and3(eq5(pairRequests.toLogin, login), eq5(pairRequests.status, "PENDING")));
      outgoing = await db.select().from(pairRequests).where(and3(eq5(pairRequests.fromLogin, login), eq5(pairRequests.status, "PENDING")));
    } catch (err) {
      logger.warn("\u0421\u0431\u043E\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 pair_requests \u0438\u0437 SQL, \u0447\u0442\u0435\u043D\u0438\u0435 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430", void 0, err);
    }
  }
  if (incoming.length === 0 && outgoing.length === 0) {
    const store = readEmergencyFile();
    const allReqs = store.pairRequests || [];
    incoming = allReqs.filter((r) => r.toLogin === login && r.status === "PENDING");
    outgoing = allReqs.filter((r) => r.fromLogin === login && r.status === "PENDING");
  }
  return {
    paired: !!user.partnerLogin,
    user: toSafeUser(user),
    partner: partner ? toSafeUser(partner) : null,
    incomingRequests: incoming,
    outgoingRequests: outgoing
  };
}

// src/server/modules/pairing/pairing.routes.ts
var pairingRouter = Router2();
pairingRouter.post("/request", requireAuth, pairLimiter, validateBody(pairRequestSchema), async (req, res, next) => {
  try {
    const { fromLogin, toLogin } = req.body;
    const userLogin = req.user?.login;
    if (fromLogin !== userLogin) {
      return res.status(403).json({ error: "\u041D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441 \u043E\u0442 \u0447\u0443\u0436\u043E\u0433\u043E \u0438\u043C\u0435\u043D\u0438" });
    }
    const reqObj = await requestPairConnection(fromLogin, toLogin);
    return res.status(201).json({ request: reqObj, message: "\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D" });
  } catch (err) {
    next(err);
  }
});
pairingRouter.post("/accept", requireAuth, validateBody(pairAcceptSchema), async (req, res, next) => {
  try {
    const { fromLogin, toLogin } = req.body;
    const userLogin = req.user?.login;
    if (toLogin !== userLogin) {
      return res.status(403).json({ error: "\u0412\u044B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0447\u0443\u0436\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441" });
    }
    const { updatedMe, updatedPartner } = await acceptPair(toLogin, fromLogin);
    return res.json({
      status: "connected",
      me: updatedMe ? toSafeUser(updatedMe) : null,
      partner: updatedPartner ? toSafeUser(updatedPartner) : null
    });
  } catch (err) {
    next(err);
  }
});
pairingRouter.post("/reject", requireAuth, validateBody(pairRejectSchema), async (req, res, next) => {
  try {
    const { fromLogin, toLogin } = req.body;
    const userLogin = req.user?.login;
    if (toLogin !== userLogin) {
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430" });
    }
    await rejectPairRequest(fromLogin, toLogin);
    return res.json({ status: "rejected" });
  } catch (err) {
    next(err);
  }
});
pairingRouter.post("/disconnect", requireAuth, validateBody(pairDisconnectSchema), async (req, res, next) => {
  try {
    const { login } = req.body;
    const userLogin = req.user?.login;
    if (login !== userLogin) {
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0440\u0430\u0437\u0440\u044B\u0432\u0443 \u0447\u0443\u0436\u043E\u0439 \u043F\u0430\u0440\u044B" });
    }
    const result = await disconnectPair(login);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({
      status: "disconnected",
      user: result.updatedUser ? toSafeUser(result.updatedUser) : null
    });
  } catch (err) {
    next(err);
  }
});
pairingRouter.get("/status/:login", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const login = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    const status = await getPairStatus(login);
    return res.json(status);
  } catch (err) {
    next(err);
  }
});

// src/server/modules/couple-data/couple.routes.ts
import { Router as Router3 } from "express";

// src/server/shared/validators/couple.validator.ts
import { z as z3 } from "zod";
var coupleSyncSchema = z3.object({
  login1: loginSchema,
  login2: loginSchema.optional().nullable(),
  coupleId: z3.string().optional().nullable(),
  payload: z3.record(z3.string(), z3.unknown())
});

// src/server/analytics.ts
import { eq as eq6, and as and4, gte } from "drizzle-orm";
import crypto5 from "crypto";
async function recordDailyMetrics(coupleId, metricDate, data) {
  try {
    let moodAverage = null;
    let moodEntriesCount = 0;
    let interactionCount = 0;
    let quizCompleted = false;
    let streakDays = 0;
    let radarScores = {
      trust: 50,
      communication: 50,
      passion: 50,
      sharedValues: 50,
      care: 50,
      dailyLife: 50
    };
    if (data) {
      if (Array.isArray(data.moodHistory)) {
        const todayMoods = data.moodHistory.filter((m) => m.date === metricDate);
        moodEntriesCount = todayMoods.length;
        if (moodEntriesCount > 0) {
          moodAverage = todayMoods.reduce((acc, m) => acc + (m.score || 5), 0) / moodEntriesCount;
        }
      }
      const pulses = Array.isArray(data.pulseHistory) ? data.pulseHistory.filter((p) => p.date === metricDate).length : 0;
      interactionCount = pulses;
      if (data.dailyQuiz && data.dailyQuiz.id === metricDate) {
        quizCompleted = !!(data.dailyQuiz.partner1Answer || data.dailyQuiz.partner2Answer);
      }
      if (data.ranking) {
        streakDays = data.ranking.streakDays || 0;
      }
      const tests = Array.isArray(data.tests) ? data.tests : [];
      const testDoneCount = tests.filter((t) => t.partner1Done || t.partner2Done).length;
      radarScores = {
        trust: Math.min(100, 50 + testDoneCount * 5 + (moodAverage ? moodAverage * 2 : 0)),
        communication: Math.min(100, 50 + interactionCount * 10),
        passion: Math.min(100, 50 + (quizCompleted ? 10 : 0)),
        sharedValues: 60 + testDoneCount * 3,
        care: Math.min(100, 50 + (data.smallCravings?.filter((c) => c.fulfilled).length || 0) * 5),
        dailyLife: Math.min(100, 50 + (data.dateInvites?.filter((d) => d.status === "CONFIRMED").length || 0) * 10)
      };
    }
    if (!db) {
      return;
    }
    await db.insert(relationshipMetrics).values({
      id: crypto5.randomUUID(),
      coupleId,
      metricDate,
      radarScores,
      moodAverage,
      moodEntriesCount,
      interactionCount,
      quizCompleted,
      streakDays,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).onConflictDoUpdate({
      target: [relationshipMetrics.coupleId, relationshipMetrics.metricDate],
      set: {
        radarScores,
        moodAverage,
        moodEntriesCount,
        interactionCount,
        quizCompleted,
        streakDays
      }
    });
    logger.info(`Recorded daily metrics for ${coupleId} on ${metricDate}`);
  } catch (err) {
    logger.info(`Failed to record daily metrics for ${coupleId}: ${err.message}`);
  }
}
async function getTrends(coupleId, periodDays) {
  if (!db) return [];
  const pastDate = /* @__PURE__ */ new Date();
  pastDate.setDate(pastDate.getDate() - periodDays);
  const dateString = pastDate.toISOString().split("T")[0];
  try {
    const records = await db.select().from(relationshipMetrics).where(and4(
      eq6(relationshipMetrics.coupleId, coupleId),
      gte(relationshipMetrics.metricDate, dateString)
    )).orderBy(relationshipMetrics.metricDate);
    return records;
  } catch (err) {
    logger.info(`Failed to fetch trends for ${coupleId}: ${err.message}`);
    return [];
  }
}

// src/utils/rankingEngine.ts
var COUPLE_LEVELS = [
  {
    level: 1,
    name: "\u041F\u0435\u0440\u0432\u0430\u044F \u0438\u0441\u043A\u0440\u0430",
    minXP: 0,
    maxXP: 300,
    color: "gold",
    iconName: "Sparkles",
    description: "\u041D\u0430\u0447\u0430\u043B\u043E \u043F\u0443\u0442\u0438: \u043F\u0435\u0440\u0432\u044B\u0435 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u0448\u0430\u0433\u0438, \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u0441\u0442\u0438\u043B\u0435\u0439 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438 \u0438 \u044F\u0437\u044B\u043A\u043E\u0432 \u043B\u044E\u0431\u0432\u0438.",
    perks: ["\u0411\u0430\u0437\u043E\u0432\u044B\u0435 \u0442\u0435\u0441\u0442\u044B", "\u041A\u0430\u0441\u0430\u043D\u0438\u044F Love Taps", "\u041A\u043E\u043B\u0435\u0441\u043E \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0439"],
    nextLevelName: "\u0412\u0437\u0430\u0438\u043C\u043D\u044B\u0439 \u0440\u0435\u0437\u043E\u043D\u0430\u043D\u0441"
  },
  {
    level: 2,
    name: "\u0412\u0437\u0430\u0438\u043C\u043D\u044B\u0439 \u0440\u0435\u0437\u043E\u043D\u0430\u043D\u0441",
    minXP: 300,
    maxXP: 750,
    color: "rose",
    iconName: "Heart",
    description: "\u0422\u0451\u043F\u043B\u0430\u044F \u0441\u043E\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430: \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u0434\u0438\u0430\u043B\u043E\u0433\u0438, \u043F\u0435\u0440\u0432\u044B\u0435 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F \u0438 \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u044B\u0439 \u0447\u0435\u043A\u0438\u043D \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F.",
    perks: ["\u0410\u043D\u0430\u043B\u0438\u0437 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u043E\u0432 \u043F\u043E \u0413\u043E\u0442\u0442\u043C\u0430\u043D\u0443", "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 Deep Talk", "\u0421\u0435\u043A\u0440\u0435\u0442\u043D\u044B\u0439 \u0432\u0438\u0448\u043B\u0438\u0441\u0442"],
    nextLevelName: "\u0413\u043B\u0443\u0431\u043E\u043A\u0430\u044F \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u044C"
  },
  {
    level: 3,
    name: "\u0413\u043B\u0443\u0431\u043E\u043A\u0430\u044F \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u044C",
    minXP: 750,
    maxXP: 1500,
    color: "teal",
    iconName: "ShieldCheck",
    description: "\u0418\u0441\u0442\u0438\u043D\u043D\u0430\u044F \u0431\u043B\u0438\u0437\u043E\u0441\u0442\u044C: \u0433\u043B\u0443\u0431\u043E\u043A\u043E\u0435 \u0432\u0437\u0430\u0438\u043C\u043E\u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u0442\u0440\u0438\u0433\u0433\u0435\u0440\u043E\u0432, \u0437\u0430\u0431\u043E\u0442\u0430 \u0431\u0435\u0437 \u0441\u043B\u043E\u0432 \u0438 \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u043E\u0435 \u0434\u043E\u0432\u0435\u0440\u0438\u0435.",
    perks: ["\u041A\u0430\u043F\u0441\u0443\u043B\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u0438", "\u0418\u043D\u0434\u0435\u043A\u0441 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438", "\u0418\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u043E\u0432\u0435\u0442\u044B \u0421\u043E\u0432\u044B"],
    nextLevelName: "\u041D\u0435\u0440\u0430\u0437\u043B\u0443\u0447\u043D\u044B\u0435 \u0441\u0435\u0440\u0434\u0446\u0430"
  },
  {
    level: 4,
    name: "\u041D\u0435\u0440\u0430\u0437\u043B\u0443\u0447\u043D\u044B\u0435 \u0441\u0435\u0440\u0434\u0446\u0430",
    minXP: 1500,
    maxXP: 2500,
    color: "coral",
    iconName: "Flame",
    description: "\u041A\u0440\u0435\u043F\u043A\u0438\u0439 \u0441\u043E\u044E\u0437: \u0441\u043B\u0430\u0436\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0432 \u0431\u044B\u0442\u0443, \u0441\u0442\u0440\u0430\u0441\u0442\u0438, \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u044F\u0445 \u0438 \u043F\u0440\u0435\u043E\u0434\u043E\u043B\u0435\u043D\u0438\u0438 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0445 \u0432\u044B\u0437\u043E\u0432\u043E\u0432.",
    perks: ["\u0420\u0430\u0434\u0430\u0440 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439 PRO", "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u0447\u0435\u043B\u043B\u0435\u043D\u0434\u0436\u0438 \u043C\u0435\u0441\u044F\u0446\u0430", "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0434\u043E\u043B\u0433\u043E\u0441\u0440\u043E\u0447\u043D\u044B\u0445 \u0446\u0435\u043B\u0435\u0439"],
    nextLevelName: "\u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u0430\u044F \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u044F"
  },
  {
    level: 5,
    name: "\u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u0430\u044F \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u044F",
    minXP: 2500,
    maxXP: 4e3,
    color: "amber",
    iconName: "Crown",
    description: "\u041C\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u043E \u043B\u044E\u0431\u0432\u0438: \u0431\u0435\u0437\u0443\u0441\u043B\u043E\u0432\u043D\u043E\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u0435, \u0432\u044B\u0441\u043E\u043A\u0430\u044F \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0437\u0440\u0435\u043B\u043E\u0441\u0442\u044C \u0438 \u043D\u0435\u0440\u0443\u0448\u0438\u043C\u0430\u044F \u043E\u043F\u043E\u0440\u0430.",
    perks: ["\u0417\u043E\u043B\u043E\u0442\u043E\u0439 \u0441\u0442\u0430\u0442\u0443\u0441 \u043F\u0430\u0440\u044B", "\u041F\u043E\u043B\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0430\u0441\u043F\u043E\u0440\u0442 \u0441\u043E\u044E\u0437\u0430", "VIP-\u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0439"],
    nextLevelName: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u044B\u0439 \u0441\u043E\u044E\u0437"
  },
  {
    level: 6,
    name: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u044B\u0439 \u0441\u043E\u044E\u0437",
    minXP: 4e3,
    maxXP: 1e4,
    color: "purple",
    iconName: "Trophy",
    description: "\u0412\u0435\u0440\u0448\u0438\u043D\u0430 \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u0438: \u044D\u0442\u0430\u043B\u043E\u043D\u043D\u044B\u0435 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0441\u043A\u0438\u0435 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F, \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0435 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u043C \u043E\u043F\u044B\u0442\u043E\u043C \u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u0435\u043C.",
    perks: ["\u041B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441", "\u0410\u0440\u0445\u0438\u0432 \u043B\u0443\u0447\u0448\u0438\u0445 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0445 \u0432\u043E\u0441\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0439", "\u0411\u0435\u0441\u0441\u0440\u043E\u0447\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F \u043A\u043E \u0432\u0441\u0435\u043C \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044F\u043C"],
    nextLevelName: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0430\u043D\u0433"
  }
];
function getCoupleLevelInfo(xp) {
  const currentLevel = COUPLE_LEVELS.slice().reverse().find((l) => xp >= l.minXP) || COUPLE_LEVELS[0];
  const nextLevel = COUPLE_LEVELS.find((l) => l.level === currentLevel.level + 1);
  const rangeSpan = nextLevel ? nextLevel.minXP - currentLevel.minXP : 2e3;
  const currentInLevel = xp - currentLevel.minXP;
  const progressPercent = nextLevel ? Math.min(100, Math.max(0, Math.round(currentInLevel / rangeSpan * 100))) : 100;
  const xpToNext = nextLevel ? Math.max(0, nextLevel.minXP - xp) : 0;
  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    color: currentLevel.color,
    iconName: currentLevel.iconName,
    description: currentLevel.description,
    perks: currentLevel.perks,
    currentXP: xp,
    minXP: currentLevel.minXP,
    nextLevelMinXP: nextLevel ? nextLevel.minXP : currentLevel.maxXP,
    xpToNext,
    progressPercent,
    nextLevelName: nextLevel?.name || "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0430\u043D\u0433"
  };
}
function computeCoupleRatingAnalytics(params) {
  const { xpHistory, totalXP, tests, dateInvites, smallCravings, loveTaps, pulseHistory, challenges } = params;
  const levelInfo = getCoupleLevelInfo(totalXP);
  let testXP = 0;
  let dateXP = 0;
  let reactionXP = 0;
  let careXP = 0;
  let challengeXP = 0;
  let p1XP = 0;
  let p2XP = 0;
  const p1TestsCount = tests.filter((t) => t.partner1Done).length;
  const p2TestsCount = tests.filter((t) => t.partner2Done).length;
  const bothTestsCount = tests.filter((t) => t.partner1Done && t.partner2Done).length;
  const confirmedDates = dateInvites.filter((d) => d.status === "CONFIRMED" || d.completed);
  const completedReviews = dateInvites.filter((d) => d.review);
  const fulfilledCravings = smallCravings.filter((c) => c.fulfilled);
  const p1TapsCount = loveTaps.length;
  const pulseCount = pulseHistory.length;
  const completedChallenges = challenges.filter((c) => c.partner1Completed || c.partner2Completed);
  testXP = (p1TestsCount + p2TestsCount) * 150 + bothTestsCount * 100;
  dateXP = dateInvites.length * 40 + confirmedDates.length * 100 + completedReviews.length * 150;
  reactionXP = p1TapsCount * 10 + pulseCount * 25 + 50;
  careXP = fulfilledCravings.length * 50 + smallCravings.length * 20;
  challengeXP = completedChallenges.length * 60;
  p1XP = p1TestsCount * 150 + bothTestsCount * 50 + Math.round(dateXP * 0.48) + Math.round(reactionXP * 0.52) + Math.round(careXP * 0.5);
  p2XP = p2TestsCount * 150 + bothTestsCount * 50 + Math.round(dateXP * 0.52) + Math.round(reactionXP * 0.48) + Math.round(careXP * 0.5);
  if (xpHistory && xpHistory.length > 0) {
    xpHistory.forEach((entry) => {
      if (entry.partnerId === "partner1") p1XP += entry.points;
      else if (entry.partnerId === "partner2") p2XP += entry.points;
      else {
        p1XP += Math.round(entry.points / 2);
        p2XP += Math.round(entry.points / 2);
      }
    });
  }
  const effectiveTotal = Math.max(totalXP, p1XP + p2XP, 50);
  if (p1XP + p2XP === 0) {
    p1XP = Math.round(effectiveTotal * 0.52);
    p2XP = Math.round(effectiveTotal * 0.48);
  }
  const partner1Percent = Math.min(95, Math.max(5, Math.round(p1XP / (p1XP + p2XP) * 100)));
  const partner2Percent = 100 - partner1Percent;
  const balanceDiff = Math.abs(partner1Percent - partner2Percent);
  const balanceScore = Math.max(10, 100 - balanceDiff * 2);
  let balanceStatus = "\u0418\u0434\u0435\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0438\u043D\u0435\u0440\u0433\u0438\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438";
  if (balanceDiff > 35) {
    balanceStatus = "\u041E\u0434\u0438\u043D \u043F\u0430\u0440\u0442\u043D\u0451\u0440 \u043F\u0440\u043E\u044F\u0432\u043B\u044F\u0435\u0442 \u0431\u043E\u043B\u044C\u0448\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B";
  } else if (balanceDiff > 18) {
    balanceStatus = "\u0425\u043E\u0440\u043E\u0448\u0438\u0439 \u0432\u0437\u0430\u0438\u043C\u043D\u044B\u0439 \u0431\u0430\u043B\u0430\u043D\u0441";
  }
  const testsCoverage = Math.min(1, (p1TestsCount + p2TestsCount) / 8);
  const dateEngagement = Math.min(1, (confirmedDates.length + 1) / 3);
  const activityFactor = Math.min(1, effectiveTotal / 2e3);
  const synergyScore = Math.min(
    100,
    Math.max(25, Math.round(balanceScore * 0.35 + testsCoverage * 30 + dateEngagement * 20 + activityFactor * 15))
  );
  let synergyStatus = "\u0413\u0430\u0440\u043C\u043E\u043D\u0438\u0447\u043D\u044B\u0439 \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u044B\u0439 \u043A\u043E\u043D\u0442\u0430\u043A\u0442";
  if (synergyScore >= 88) synergyStatus = "\u0412\u044B\u0441\u0448\u0430\u044F \u0441\u0442\u0435\u043F\u0435\u043D\u044C \u043F\u0430\u0440\u043D\u043E\u0433\u043E \u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F";
  else if (synergyScore >= 70) synergyStatus = "\u0422\u0451\u043F\u043B\u044B\u0439 \u0432\u0437\u0430\u0438\u043C\u043D\u044B\u0439 \u0440\u0435\u0437\u043E\u043D\u0430\u043D\u0441";
  else if (synergyScore < 50) synergyStatus = "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u0430\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C";
  const categories = [
    {
      key: "tests",
      title: "\u041F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0442\u0435\u0441\u0442\u044B",
      subtitle: `${p1TestsCount + p2TestsCount} \u043F\u0440\u043E\u0439\u0434\u0435\u043D\u043E (${bothTestsCount} \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u043E)`,
      points: testXP,
      count: p1TestsCount + p2TestsCount,
      color: "indigo",
      iconName: "ShieldCheck",
      xpPerAction: "+150 XP \u0437\u0430 \u0442\u0435\u0441\u0442, +100 XP \u0431\u043E\u043D\u0443\u0441"
    },
    {
      key: "dates",
      title: "\u0421\u0432\u0438\u0434\u0430\u043D\u0438\u044F \u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
      subtitle: `${dateInvites.length} \u0441\u043E\u0437\u0434\u0430\u043D\u043E, ${confirmedDates.length} \u043F\u0440\u043E\u0432\u0435\u0434\u0435\u043D\u043E`,
      points: dateXP,
      count: dateInvites.length,
      color: "rose",
      iconName: "Wine",
      xpPerAction: "+40..150 XP \u0437\u0430 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0435"
    },
    {
      key: "reactions",
      title: "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u0438 \u0447\u0435\u043A\u0438\u043D\u044B",
      subtitle: `${p1TapsCount} \u043A\u0430\u0441\u0430\u043D\u0438\u0439, ${pulseCount} \u0437\u0430\u043C\u0435\u0440\u043E\u0432 \u043F\u0443\u043B\u044C\u0441\u0430`,
      points: reactionXP,
      count: p1TapsCount + pulseCount,
      color: "gold",
      iconName: "Zap",
      xpPerAction: "+10..25 XP \u0437\u0430 \u0447\u0435\u043A\u0438\u043D"
    },
    {
      key: "care",
      title: "\u0417\u0430\u0431\u043E\u0442\u0430 \u0438 \u0436\u0435\u043B\u0430\u043D\u0438\u044F",
      subtitle: `${fulfilledCravings.length} \u0438\u0437 ${smallCravings.length} \u0438\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u043E`,
      points: careXP,
      count: smallCravings.length,
      color: "emerald",
      iconName: "Heart",
      xpPerAction: "+50 XP \u0437\u0430 \u0438\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435"
    },
    {
      key: "challenges",
      title: "\u0427\u0435\u043B\u043B\u0435\u043D\u0434\u0436\u0438 \u0438 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438",
      subtitle: `${completedChallenges.length} \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0445 \u0437\u0430\u0434\u0430\u043D\u0438\u0439`,
      points: challengeXP,
      count: completedChallenges.length,
      color: "coral",
      iconName: "Target",
      xpPerAction: "+60 XP \u0437\u0430 \u0447\u0435\u043B\u043B\u0435\u043D\u0434\u0436"
    }
  ];
  const timelineData = [
    {
      name: "\u0421\u0442\u0430\u0440\u0442",
      total: Math.round(effectiveTotal * 0.15),
      p1: Math.round(p1XP * 0.15),
      p2: Math.round(p2XP * 0.15),
      tests: Math.round(testXP * 0.2),
      dates: Math.round(dateXP * 0.1),
      reactions: Math.round(reactionXP * 0.1),
      care: Math.round(careXP * 0.1)
    },
    {
      name: "\u041D\u0435\u0434\u0435\u043B\u044F 1",
      total: Math.round(effectiveTotal * 0.35),
      p1: Math.round(p1XP * 0.35),
      p2: Math.round(p2XP * 0.35),
      tests: Math.round(testXP * 0.4),
      dates: Math.round(dateXP * 0.3),
      reactions: Math.round(reactionXP * 0.35),
      care: Math.round(careXP * 0.3)
    },
    {
      name: "\u041D\u0435\u0434\u0435\u043B\u044F 2",
      total: Math.round(effectiveTotal * 0.65),
      p1: Math.round(p1XP * 0.65),
      p2: Math.round(p2XP * 0.65),
      tests: Math.round(testXP * 0.7),
      dates: Math.round(dateXP * 0.6),
      reactions: Math.round(reactionXP * 0.7),
      care: Math.round(careXP * 0.65)
    },
    {
      name: "\u0421\u0435\u0439\u0447\u0430\u0441",
      total: effectiveTotal,
      p1: p1XP,
      p2: p2XP,
      tests: testXP,
      dates: dateXP,
      reactions: reactionXP,
      care: careXP
    }
  ];
  return {
    totalXP: effectiveTotal,
    levelInfo,
    partner1XP: p1XP,
    partner2XP: p2XP,
    partner1Percent,
    partner2Percent,
    balanceScore,
    balanceStatus,
    categories,
    synergyScore,
    synergyStatus,
    timelineData
  };
}

// src/server/modules/couple-data/couple.service.ts
async function syncCouplePayload(params, senderUserLogin) {
  const { login1, login2, coupleId, payload } = params;
  let key = coupleId;
  if (!key) {
    if (login2) {
      const l1 = String(login1).toLowerCase().trim().replace(/^@/, "");
      const l2 = String(login2).toLowerCase().trim().replace(/^@/, "");
      key = [l1, l2].sort().join("_");
    } else {
      key = String(login1).toLowerCase().trim().replace(/^@/, "");
    }
  }
  const existing = await getCoupleData(key);
  const merged = mergeCoupleData(existing, payload);
  try {
    const p1Name = merged.coupleProfile?.partner1?.name || "Partner 1";
    const p2Name = merged.coupleProfile?.partner2?.name || "Partner 2";
    const analytics = computeCoupleRatingAnalytics({
      xpHistory: merged.xpHistory || [],
      totalXP: merged.totalXP || 0,
      tests: merged.tests || [],
      dateInvites: merged.dateInvites || [],
      smallCravings: merged.smallCravings || [],
      loveTaps: merged.loveTaps || [],
      pulseHistory: merged.pulseHistory || [],
      challenges: merged.challenges || [],
      p1Name,
      p2Name
    });
    merged.level = analytics.levelInfo.level;
    merged.levelName = analytics.levelInfo.levelName;
    merged.testsCompletedCount = (merged.tests || []).filter((t) => t.partner1Done || t.partner2Done).length;
    if (merged.coupleProfile) {
      merged.coupleProfile.level = analytics.levelInfo.level;
      merged.coupleProfile.levelName = analytics.levelInfo.levelName;
      merged.coupleProfile.testsCompletedCount = merged.testsCompletedCount;
    }
  } catch (e) {
    logger.error("Failed to compute couple rating on server", e);
  }
  await saveCoupleData(key, merged);
  try {
    const todayDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    await recordDailyMetrics(key, todayDate, merged);
  } catch (err) {
    logger.warn("\u0421\u0431\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0445 \u043C\u0435\u0442\u0440\u0438\u043A \u0432 analytics", { coupleId: key }, err);
  }
  if (login2) {
    const sender = String(senderUserLogin || "").toLowerCase().trim().replace(/^@/, "");
    const otherLogin = String(login1).toLowerCase().trim().replace(/^@/, "") === sender ? String(login2).toLowerCase().trim().replace(/^@/, "") : String(login1).toLowerCase().trim().replace(/^@/, "");
    sendSSEEventToUser(otherLogin, "schedule_updated", { key, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    sendSSEEventToUser(otherLogin, "couple_updated", { key, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  }
  return { key, data: merged };
}
async function fetchCoupleDataByKey(key) {
  const cleanKey = String(key || "").toLowerCase().trim();
  return await getCoupleData(cleanKey);
}
async function fetchCoupleDataByLogins(login1, login2) {
  const l1 = String(login1 || "").toLowerCase().replace(/^@/, "");
  const l2 = String(login2 || "").toLowerCase().replace(/^@/, "");
  const key = [l1, l2].sort().join("_");
  return await getCoupleData(key);
}

// src/server/modules/couple-data/couple.routes.ts
var coupleRouter = Router3();
coupleRouter.post("/sync", requireAuth, requirePairOwnership, validateBody(coupleSyncSchema), async (req, res, next) => {
  try {
    const { login1, login2, coupleId, payload } = req.body;
    const result = await syncCouplePayload(
      { login1, login2, coupleId, payload },
      req.user?.login
    );
    return res.json({
      status: "synced",
      key: result.key,
      data: result.data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    next(err);
  }
});
coupleRouter.get("/data/:key", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const key = String(req.params.key || "").toLowerCase().trim();
    const data = await fetchCoupleDataByKey(key);
    return res.json({ data: data || null });
  } catch (err) {
    next(err);
  }
});
coupleRouter.get("/data/:login1/:login2", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const data = await fetchCoupleDataByLogins(req.params.login1, req.params.login2);
    return res.json({ data: data || null });
  } catch (err) {
    next(err);
  }
});

// src/server/modules/chat/chat.routes.ts
import { Router as Router4 } from "express";

// src/server/shared/validators/chat.validator.ts
import { z as z4 } from "zod";
var chatMessageCreateSchema = z4.object({
  coupleId: z4.string().min(3).max(100),
  senderLogin: z4.string(),
  role: z4.string().optional(),
  content: z4.string().min(1, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C").max(2e3, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u043E\u0435")
});
var aiChatMessageSchema = z4.object({
  messages: z4.array(
    z4.object({
      role: z4.string().min(1).max(20),
      content: z4.string().min(1).max(4e3)
    })
  ).min(1, "\u0421\u043F\u0438\u0441\u043E\u043A \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C"),
  userLogin: loginSchema.optional(),
  context: z4.record(z4.string(), z4.unknown()).optional()
});
var aiReportSchema = z4.object({
  coupleProfile: z4.record(z4.string(), z4.unknown()).optional(),
  radarScores: z4.record(z4.string(), z4.unknown()).optional()
});
var aiDateIdeaSchema = z4.object({
  budget: z4.string().max(50).optional(),
  vibe: z4.string().max(50).optional(),
  location: z4.string().max(100).optional()
});

// src/server/modules/chat/safety.filter.ts
var EMERGENCY_PATTERNS = [
  /суицид|покончить с собой|не хочу жить|убить себя|спрыгнуть/i,
  /бьет меня|ударил|душит|угрожает расправой|боюсь за свою жизнь|домашнее насилие/i,
  /самоповрежден|режу вены|причинить себе вред|наглотаться таблеток/i
];
function evaluateSafetyRisk(text2) {
  const isTriggered = EMERGENCY_PATTERNS.some((pattern) => pattern.test(text2 || ""));
  if (!isTriggered) {
    return { hasRisk: false };
  }
  return {
    hasRisk: true,
    systemNotice: "\u042F \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u044E, \u043A\u0430\u043A \u0432\u0430\u043C \u0442\u044F\u0436\u0435\u043B\u043E \u0438 \u043D\u0435\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u043F\u0440\u044F\u043C\u043E \u0441\u0435\u0439\u0447\u0430\u0441. \u041A\u0430\u043A \u0430\u043B\u0433\u043E\u0440\u0438\u0442\u043C, \u044F \u043D\u0435 \u0438\u043C\u0435\u044E \u043F\u0440\u0430\u0432\u0430 \u0438 \u043A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u044D\u043A\u0441\u0442\u0440\u0435\u043D\u043D\u0443\u044E \u043A\u0440\u0438\u0437\u0438\u0441\u043D\u0443\u044E \u043F\u043E\u043C\u043E\u0449\u044C. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441\u043E \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0430\u043C\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043C\u043E\u0433\u0443\u0442 \u043F\u043E\u043C\u043E\u0447\u044C \u043D\u0435\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E:\n\n\u2022 \u0415\u0434\u0438\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0434\u043E\u0432\u0435\u0440\u0438\u044F: 8-800-2000-122 (\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E, \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u043E, \u043A\u0440\u0443\u0433\u043B\u043E\u0441\u0443\u0442\u043E\u0447\u043D\u043E)\n\u2022 \u041A\u0440\u0438\u0437\u0438\u0441\u043D\u044B\u0439 \u0446\u0435\u043D\u0442\u0440 \u043F\u043E\u043C\u043E\u0449\u0438: 8-800-7000-600\n\u2022 \u041D\u0435\u043E\u0442\u043B\u043E\u0436\u043D\u0430\u044F \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u043E\u043C\u043E\u0449\u044C: 051 (\u0441 \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0433\u043E) \u0438\u043B\u0438 +7 (495) 051\n\n\u0421\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u044D\u0442\u043E\u0442 \u0448\u0430\u0433 \u0440\u0430\u0434\u0438 \u0432\u0430\u0448\u0435\u0439 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438. \u0412\u044B \u043D\u0435 \u043E\u0434\u043D\u0438."
  };
}

// src/utils/psychologyEngine.ts
var DEFAULT_WEEKLY_PLAN = [
  {
    day: "\u041F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A",
    title: "\u0423\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u0437\u0430\u043A\u043B\u0430\u0434\u043A\u0430 \u043D\u0430 \u0434\u0435\u043D\u044C",
    duration: "2 \u043C\u0438\u043D\u0443\u0442\u044B",
    gottmanPrinciple: "\u041A\u0430\u0440\u0442\u0430 \u043B\u044E\u0431\u0432\u0438 (Love Map)",
    instruction: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0443 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430: \xAB\u041A\u0430\u043A\u043E\u0435 \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u0435 \u0438\u043B\u0438 \u0432\u044B\u0437\u043E\u0432 \u0436\u0434\u0451\u0442 \u0442\u0435\u0431\u044F \u0441\u0435\u0433\u043E\u0434\u043D\u044F? \u0427\u0435\u043C \u044F \u043C\u043E\u0433\u0443 \u0442\u0435\u0431\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044C?\xBB"
  },
  {
    day: "\u0421\u0440\u0435\u0434\u0430",
    title: "\u041C\u0438\u043A\u0440\u043E-\u0441\u044E\u0440\u043F\u0440\u0438\u0437 \u043D\u0430 \u044F\u0437\u044B\u043A\u0435 \u043B\u044E\u0431\u0432\u0438",
    duration: "5 \u043C\u0438\u043D\u0443\u0442",
    gottmanPrinciple: "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0439 \u0441\u0447\u0451\u0442",
    instruction: "\u0421\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435: \u0437\u0430\u043F\u0438\u0441\u043A\u0430 \u0432 \u0441\u0443\u043C\u043A\u0443 \u0441 \u043A\u043E\u043C\u043F\u043B\u0438\u043C\u0435\u043D\u0442\u043E\u043C \u0438\u043B\u0438 \u043D\u0435\u043E\u0436\u0438\u0434\u0430\u043D\u043D\u044B\u0439 \u043B\u044E\u0431\u0438\u043C\u044B\u0439 \u043A\u043E\u0444\u0435."
  },
  {
    day: "\u041F\u044F\u0442\u043D\u0438\u0446\u0430",
    title: "\xAB\u0411\u0435\u0441\u0448\u0443\u043C\u043D\u043E\u0435 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0435\xBB",
    duration: "25 \u043C\u0438\u043D\u0443\u0442",
    gottmanPrinciple: "\u041A\u0443\u043B\u044C\u0442\u0443\u0440\u0430 \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u043D\u043E\u0441\u0442\u0438",
    instruction: "\u0427\u0430\u0439 \u0438\u043B\u0438 \u043D\u0430\u043F\u0438\u0442\u043E\u043A \u0431\u0435\u0437 \u0433\u0430\u0434\u0436\u0435\u0442\u043E\u0432. \u041D\u0430\u0437\u043E\u0432\u0438\u0442\u0435 3 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0445 \u043F\u043E\u0441\u0442\u0443\u043F\u043A\u0430 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430 \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E, \u0437\u0430 \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432\u044B \u0438\u0441\u043A\u0440\u0435\u043D\u043D\u0435 \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u043D\u044B."
  },
  {
    day: "\u0412\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u0435",
    title: "\u041D\u0435\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0443\u043B\u044C\u0441 \u0432 Loop",
    duration: "3 \u043C\u0438\u043D\u0443\u0442\u044B",
    gottmanPrinciple: "\u041A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u043A\u0430 \u0431\u043B\u0438\u0437\u043E\u0441\u0442\u0438",
    instruction: "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0439 \u0447\u0435\u043A\u0438\u043D \u043F\u0443\u043B\u044C\u0441\u0430 \u043D\u0435\u0434\u0435\u043B\u0438 \u0438 \u043E\u0442\u043C\u0435\u0442\u044C\u0442\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0435 \u0447\u0435\u043B\u043B\u0435\u043D\u0434\u0436\u0438."
  }
];
function calculateCoupleAnalysis(profile, pulseHistory, tests) {
  const p1 = profile.partner1;
  const p2 = profile.partner2;
  const testAttachment = tests.find((t) => t.id === "TEST-S1" || t.slug === "attachment-style");
  const testLoveLang = tests.find((t) => t.id === "TEST-S2" || t.slug === "five-love-languages" || t.slug === "love-languages");
  const testConflicts = tests.find((t) => t.id === "TEST-S3" || t.id === "TEST-D2" || t.slug === "gottman-four-horsemen");
  const testValues = tests.find((t) => t.id === "TEST-C1" || t.id === "TEST-D1" || t.slug === "ideal-day" || t.slug === "family-scripts");
  const testIntimacy = tests.find((t) => t.id === "TEST-S4" || t.slug === "sternberg-love-triangle");
  const p1CompletedCount = tests.filter((t) => t.partner1Done).length;
  const p2CompletedCount = tests.filter((t) => t.partner2Done).length;
  const bothCompletedCount = tests.filter((t) => t.partner1Done && t.partner2Done).length;
  const completedTestsCount = tests.filter((t) => t.partner1Done || t.partner2Done).length;
  const totalTestsCount = tests.length || 7;
  const isCoupleReportReady = p1CompletedCount > 0 && p2CompletedCount > 0 && bothCompletedCount > 0;
  const p1Pulses = pulseHistory.filter((p) => p.author === "partner1");
  const p2Pulses = pulseHistory.filter((p) => p.author === "partner2");
  const hasPulseData = p1Pulses.length > 0 || p2Pulses.length > 0;
  const makeDim = (key, label, test, baseDesc, completedDesc) => {
    const p1Done = !!test?.partner1Done;
    const p2Done = !!test?.partner2Done;
    const isCompleted = p1Done && p2Done;
    if (!isCompleted) {
      return {
        key,
        label,
        p1Score: p1Done ? 86 : 0,
        p2Score: p2Done ? 88 : 0,
        averageScore: p1Done && p2Done ? 87 : 0,
        status: "growth",
        description: p1Done && !p2Done ? `\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u043E\u0442 ${p2.name || "\u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430"}` : !p1Done && p2Done ? `\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u043E\u0442 ${p1.name || "\u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430"}` : baseDesc,
        isCompleted: false
      };
    }
    const p1Score = 88;
    const p2Score = 90;
    const avg = Math.round((p1Score + p2Score) / 2);
    return {
      key,
      label,
      p1Score,
      p2Score,
      averageScore: avg,
      status: avg >= 80 ? "excellent" : "good",
      description: completedDesc,
      isCompleted: true
    };
  };
  const dimAttachment = makeDim(
    "attachment",
    "\u0421\u0442\u0438\u043B\u044C \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438 & \u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C",
    testAttachment,
    "\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A \xAB\u0421\u0442\u0438\u043B\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438 (ECR)\xBB \u0435\u0449\u0451 \u043D\u0435 \u043F\u0440\u043E\u0439\u0434\u0435\u043D.",
    "\u0412\u044B\u0441\u043E\u043A\u0438\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438, \u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u0442\u0440\u0438\u0433\u0433\u0435\u0440\u043E\u0432 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u0438."
  );
  const dimLoveLanguages = makeDim(
    "love_languages",
    "\u042F\u0437\u044B\u043A\u0438 \u043B\u044E\u0431\u0432\u0438 & \u0412\u0437\u0430\u0438\u043C\u043D\u0430\u044F \u0437\u0430\u0431\u043E\u0442\u0430",
    testLoveLang,
    "\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A \xAB5 \u044F\u0437\u044B\u043A\u043E\u0432 \u043B\u044E\u0431\u0432\u0438 (\u0427\u0435\u043F\u043C\u0435\u043D)\xBB \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F.",
    "\u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043A\u0430\u043D\u0430\u043B\u043E\u0432 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F: \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u0438 \u0441\u043B\u043E\u0432\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438."
  );
  const dimConflicts = makeDim(
    "conflicts",
    "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0430\u043C\u0438 (\u0413\u043E\u0442\u0442\u043C\u0430\u043D)",
    testConflicts,
    "\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A \xAB\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B & 4 \u0432\u0441\u0430\u0434\u043D\u0438\u043A\u0430\xBB \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F.",
    "\u0423\u043C\u0435\u043D\u0438\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043C\u044F\u0433\u043A\u0438\u0439 \u0441\u0442\u0430\u0440\u0442, \u0433\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u044C \u043A \u0434\u0435\u044D\u0441\u043A\u0430\u043B\u0430\u0446\u0438\u0438 \u0441\u043F\u043E\u0440\u043E\u0432."
  );
  const dimValues = makeDim(
    "values",
    "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0435\u0439 & \u0411\u0443\u0434\u0443\u0449\u0435\u0435",
    testValues,
    "\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A \xAB\u0421\u0435\u043C\u0435\u0439\u043D\u044B\u0435 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0438 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0438\xBB \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F.",
    "\u0415\u0434\u0438\u043D\u044B\u0439 \u0432\u0437\u0433\u043B\u044F\u0434 \u043D\u0430 \u0444\u0438\u043D\u0430\u043D\u0441\u044B, \u0441\u0435\u043C\u0435\u0439\u043D\u044B\u0439 \u0443\u043A\u043B\u0430\u0434, \u0446\u0435\u043B\u0438 \u0438 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0440\u043E\u043B\u0435\u0439."
  );
  const dimIntimacy = makeDim(
    "intimacy",
    "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F & \u0427\u0443\u0432\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F \u0431\u043B\u0438\u0437\u043E\u0441\u0442\u044C",
    testIntimacy,
    "\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A \xAB\u0422\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u043B\u044E\u0431\u0432\u0438 (\u0421\u0442\u0435\u0440\u043D\u0431\u0435\u0440\u0433)\xBB \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F.",
    "\u0413\u043B\u0443\u0431\u043E\u043A\u0430\u044F \u0438\u0441\u043A\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C, \u0434\u043E\u0432\u0435\u0440\u0438\u0435 \u0438 \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0441\u043E\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430."
  );
  let dimLifestyle;
  if (hasPulseData) {
    const avgPulseP1 = p1Pulses.length ? Math.round(p1Pulses.reduce((s, p) => s + p.closeness, 0) / p1Pulses.length * 10) : 0;
    const avgPulseP2 = p2Pulses.length ? Math.round(p2Pulses.reduce((s, p) => s + p.closeness, 0) / p2Pulses.length * 10) : 0;
    const avg = Math.round((avgPulseP1 + avgPulseP2) / (avgPulseP1 > 0 && avgPulseP2 > 0 ? 2 : 1));
    dimLifestyle = {
      key: "lifestyle",
      label: "\u0420\u0438\u0442\u043C \u0436\u0438\u0437\u043D\u0438 & \u0411\u0430\u043B\u0430\u043D\u0441 \xAB\u041C\u044B / \u042F\xBB",
      p1Score: avgPulseP1,
      p2Score: avgPulseP2,
      averageScore: avg,
      status: avg >= 80 ? "excellent" : "good",
      description: "\u0420\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u043D\u043E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0435\u0436\u0435\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u0443\u043B\u044C\u0441\u0430 \u043F\u0430\u0440\u044B.",
      isCompleted: true
    };
  } else {
    dimLifestyle = {
      key: "lifestyle",
      label: "\u0420\u0438\u0442\u043C \u0436\u0438\u0437\u043D\u0438 & \u0411\u0430\u043B\u0430\u043D\u0441 \xAB\u041C\u044B / \u042F\xBB",
      p1Score: 0,
      p2Score: 0,
      averageScore: 0,
      status: "growth",
      description: "\u041E\u0442\u043C\u0435\u0447\u0430\u0439\u0442\u0435 \u0435\u0436\u0435\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0443\u043B\u044C\u0441 \u043F\u0430\u0440\u044B, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u0430\u0442\u044C \u044D\u0442\u0443 \u0448\u043A\u0430\u043B\u0443.",
      isCompleted: false
    };
  }
  const dimensions = [
    dimAttachment,
    dimLoveLanguages,
    dimConflicts,
    dimValues,
    dimIntimacy,
    dimLifestyle
  ];
  const completedDimensions = dimensions.filter((d) => d.isCompleted);
  const hasData = completedDimensions.length > 0;
  if (!isCoupleReportReady) {
    const waitingForName = p1CompletedCount > p2CompletedCount ? p2.name || "\u041F\u0430\u0440\u0442\u043D\u0451\u0440 2" : p2CompletedCount > p1CompletedCount ? p1.name || "\u041F\u0430\u0440\u0442\u043D\u0451\u0440 1" : null;
    const completedLeaderCount = Math.max(p1CompletedCount, p2CompletedCount);
    const leaderName = p1CompletedCount >= p2CompletedCount ? p1.name : p2.name;
    const pendingSummary = completedLeaderCount > 0 ? `${leaderName} \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B(\u0430) ${completedLeaderCount} \u0438\u0437 ${totalTestsCount} \u043E\u043F\u0440\u043E\u0441\u043D\u0438\u043A\u043E\u0432. \u041E\u0436\u0438\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u043E\u0442 ${waitingForName || "\u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430"}, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0430\u0441\u043F\u043E\u0440\u0442 \u0441\u043E\u044E\u0437\u0430 \u0438 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u0440\u0430\u0434\u0430\u0440 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u0438.` : `\u0412\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u0440\u043E\u0448\u043B\u0438 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0442\u0435\u0441\u0442\u0430. \u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u0439 \u0442\u0435\u0441\u0442 \u0432\u0434\u0432\u043E\u0451\u043C \u0438\u043B\u0438 \u043F\u043E \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438, \u0447\u0442\u043E\u0431\u044B \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0441\u043C\u043E\u0433\u043B\u0430 \u0441\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0440\u0430\u0434\u0430\u0440 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439 \u0441\u043E\u044E\u0437\u0430 ${p1.name} \u0438 ${p2.name}.`;
    return {
      hasData: completedLeaderCount > 0,
      isCoupleReportReady: false,
      waitingFor: waitingForName,
      completedTestsCount,
      totalTestsCount,
      p1CompletedCount,
      p2CompletedCount,
      bothCompletedCount,
      compatibilityScore: null,
      archetypeTitle: null,
      archetypeSubtitle: null,
      summary: pendingSummary,
      dimensions,
      strengths: [],
      growthZones: [],
      partner1Profile: {
        attachmentType: p1CompletedCount > 0 ? "\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u0441 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u044C\u044E \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u0438\u0438" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u0430 \xAB\u0421\u0442\u0438\u043B\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438\xBB",
        topLoveLanguage: p1CompletedCount > 0 ? "\u041A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u0430 \xAB5 \u044F\u0437\u044B\u043A\u043E\u0432 \u043B\u044E\u0431\u0432\u0438\xBB",
        stressPattern: p1CompletedCount > 0 ? "\u0420\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u0430 \xAB\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B\xBB",
        coreNeed: p1CompletedCount > 0 ? "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432"
      },
      partner2Profile: {
        attachmentType: p2CompletedCount > 0 ? "\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u0441 \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u044D\u043C\u043F\u0430\u0442\u0438\u0435\u0439" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u0430 \xAB\u0421\u0442\u0438\u043B\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438\xBB",
        topLoveLanguage: p2CompletedCount > 0 ? "\u0421\u043B\u043E\u0432\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u0430 \xAB5 \u044F\u0437\u044B\u043A\u043E\u0432 \u043B\u044E\u0431\u0432\u0438\xBB",
        stressPattern: p2CompletedCount > 0 ? "\u041F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u044C \u0432 \u0434\u0438\u0430\u043B\u043E\u0433\u0435" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u0430 \xAB\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B\xBB",
        coreNeed: p2CompletedCount > 0 ? "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u043A\u043B\u0438\u043A" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432"
      },
      weeklyActionPlan: DEFAULT_WEEKLY_PLAN
    };
  }
  const compatibilityScore = Math.round(
    completedDimensions.reduce((acc, curr) => acc + curr.averageScore, 0) / (completedDimensions.length || 1)
  );
  let archetypeTitle = "\xAB\u041E\u0441\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0439 \u0442\u0430\u043D\u0434\u0435\u043C & \u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0438\u0430\u043B\u043E\u0433\xBB";
  let archetypeSubtitle = "\u041D\u0430\u0447\u0430\u043B\u043E \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u043A\u0438 \u043F\u0430\u0440\u044B";
  if (bothCompletedCount >= 5) {
    archetypeTitle = "\xAB\u041D\u0430\u0434\u0451\u0436\u043D\u0430\u044F \u0433\u0430\u0432\u0430\u043D\u044C & \u041E\u0431\u0449\u0438\u0439 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\xBB";
    archetypeSubtitle = "\u041F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0430\u0440\u0445\u0435\u0442\u0438\u043F: \u041E\u0441\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0435 \u0441\u043E\u044E\u0437\u043D\u0438\u043A\u0438 \u0441 \u0432\u044B\u0441\u043E\u043A\u0438\u043C \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u043E\u043C";
  } else if (bothCompletedCount >= 3) {
    archetypeTitle = "\xAB\u0413\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u043A\u043E\u043D\u0442\u0430\u043A\u0442 & \u0412\u0437\u0430\u0438\u043C\u043D\u0430\u044F \u043E\u043F\u043E\u0440\u0430\xBB";
    archetypeSubtitle = "\u041F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0430\u0440\u0445\u0435\u0442\u0438\u043F: \u041F\u0430\u0440\u0442\u043D\u0451\u0440\u044B \u043D\u0430 \u044D\u0442\u0430\u043F\u0435 \u0443\u0433\u043B\u0443\u0431\u043B\u0435\u043D\u0438\u044F \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u0441\u0432\u044F\u0437\u0438";
  } else {
    archetypeTitle = "\xAB\u041E\u0441\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0439 \u0442\u0430\u043D\u0434\u0435\u043C & \u0412\u0437\u0430\u0438\u043C\u043D\u044B\u0439 \u0434\u0438\u0430\u043B\u043E\u0433\xBB";
    archetypeSubtitle = `\u041F\u0440\u043E\u0439\u0434\u0435\u043D\u043E ${bothCompletedCount} \u0438\u0437 ${totalTestsCount} \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0445 \u043E\u043F\u0440\u043E\u0441\u043D\u0438\u043A\u043E\u0432`;
  }
  const summary = `${p1.name} \u0438 ${p2.name} \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0438 ${bothCompletedCount} \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0445 \u043E\u043F\u0440\u043E\u0441\u043D\u0438\u043A\u043E\u0432 \u0438\u0437 ${totalTestsCount}. \u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u0438 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0445 \u0448\u043A\u0430\u043B \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 ${compatibilityScore}%. ${bothCompletedCount < totalTestsCount ? `\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u043E\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044F ${totalTestsCount - bothCompletedCount} \u043E\u043F\u0440\u043E\u0441\u043D\u0438\u043A\u0430, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u043B\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0430\u0441\u043F\u043E\u0440\u0442 \u043F\u0430\u0440\u044B.` : "\u0412\u0441\u0435 \u0431\u0430\u0437\u043E\u0432\u044B\u0435 \u043E\u0441\u0438 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439 \u043E\u0442\u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u0430\u043D\u044B \u0438 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u044B."}`;
  const strengths = [];
  if (dimAttachment.isCompleted) {
    strengths.push({
      title: "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F",
      description: `\u041E\u0431\u0430 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430 \u0443\u043C\u0435\u044E\u0442 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C \u0443\u044F\u0437\u0432\u0438\u043C\u043E\u0441\u0442\u044C \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430. ${p1.name} \u0434\u0430\u0435\u0442 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u0438 \u0441\u043F\u043E\u043A\u043E\u0439\u0441\u0442\u0432\u0438\u0435, \u0430 ${p2.name} \u043F\u0440\u0438\u0432\u043D\u043E\u0441\u0438\u0442 \u0442\u0435\u043F\u043B\u043E \u0438 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0443\u044E \u0433\u043B\u0443\u0431\u0438\u043D\u0443.`,
      icon: "ShieldHeart",
      metricTag: `${dimAttachment.averageScore}% \u0434\u043E\u0432\u0435\u0440\u0438\u0435`
    });
  }
  if (dimLoveLanguages.isCompleted) {
    strengths.push({
      title: "\u0412\u0437\u0430\u0438\u043C\u043E\u0434\u043E\u043F\u043E\u043B\u043D\u044F\u0435\u043C\u043E\u0441\u0442\u044C \u044F\u0437\u044B\u043A\u043E\u0432 \u043B\u044E\u0431\u0432\u0438",
      description: `\u0412\u044B \u043E\u0441\u043E\u0437\u043D\u0430\u043D\u043D\u043E \u043D\u0430\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0435 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u043E\u0441\u0443\u0434\u044B \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u0437\u0430\u0431\u043E\u0442\u043E\u0439 \u0438 \u043C\u0438\u043A\u0440\u043E-\u043A\u0430\u0441\u0430\u043D\u0438\u044F\u043C\u0438.`,
      icon: "HeartHandshake",
      metricTag: `${dimLoveLanguages.averageScore}% \u0437\u0430\u0431\u043E\u0442\u0430`
    });
  }
  if (dimConflicts.isCompleted) {
    strengths.push({
      title: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u0430\u0437\u043D\u043E\u0433\u043B\u0430\u0441\u0438\u044F\u043C\u0438 \u043F\u043E \u0413\u043E\u0442\u0442\u043C\u0430\u043D\u0443",
      description: "\u0412\u044B \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u044B \u0441\u043B\u044B\u0448\u0430\u0442\u044C \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430, \u0432\u043E\u0432\u0440\u0435\u043C\u044F \u0431\u0440\u0430\u0442\u044C \u043F\u0430\u0443\u0437\u0443 \u0438 \u0438\u0437\u0431\u0435\u0433\u0430\u0442\u044C \u0441\u0430\u0440\u043A\u0430\u0437\u043C\u0430.",
      icon: "CheckCircle2",
      metricTag: `${dimConflicts.averageScore}% \u043C\u044F\u0433\u043A\u0438\u0439 \u0441\u0442\u0430\u0440\u0442`
    });
  }
  if (dimValues.isCompleted) {
    strengths.push({
      title: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0434\u043E\u043B\u0433\u043E\u0441\u0440\u043E\u0447\u043D\u044B\u0445 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0435\u0439",
      description: "\u041E\u0431\u0449\u0435\u0435 \u0432\u0438\u0434\u0435\u043D\u0438\u0435 \u0441\u0435\u043C\u0435\u0439\u043D\u044B\u0445 \u043F\u043B\u0430\u043D\u043E\u0432, \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u0440\u043E\u043B\u0435\u0439 \u0438 \u043B\u0438\u0447\u043D\u043E\u0439 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u0438\u0438.",
      icon: "Compass",
      metricTag: `${dimValues.averageScore}% \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0438`
    });
  }
  const growthZones = [];
  if (dimConflicts.isCompleted) {
    growthZones.push({
      title: "\u0420\u0430\u0437\u043D\u044B\u0439 \u0442\u0435\u043C\u043F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u0441\u0442\u0440\u0435\u0441\u0441\u0430",
      description: `\u041A\u043E\u0433\u0434\u0430 \u043D\u0430\u043A\u0430\u043F\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0443\u0441\u0442\u0430\u043B\u043E\u0441\u0442\u044C, ${p1.name} \u043C\u043E\u0436\u0435\u0442 \u0438\u0441\u043F\u044B\u0442\u044B\u0432\u0430\u0442\u044C \u043F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u044C \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u0438\u0438, \u0447\u0442\u043E ${p2.name} \u043C\u043E\u0436\u0435\u0442 \u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C \u043A\u0430\u043A \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0442\u0434\u0430\u043B\u0435\u043D\u0438\u0435.`,
      risk: "\u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u043D\u0435\u0434\u043E\u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u0432 \u043F\u0435\u0440\u0432\u044B\u0435 \u0447\u0430\u0441\u044B \u043F\u043E\u0441\u043B\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u0434\u043E\u043C\u043E\u0439.",
      antidote: "\u041F\u0440\u043E\u0433\u043E\u0432\u0430\u0440\u0438\u0432\u0430\u0442\u044C \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u0440\u0435\u0441\u0443\u0440\u0441\u0430 \u043F\u0435\u0440\u0435\u0434 \u0432\u0445\u043E\u0434\u043E\u043C: \xAB\u042F \u043E\u0447\u0435\u043D\u044C \u0440\u0430\u0434(\u0430) \u0442\u0435\u0431\u044F \u0432\u0438\u0434\u0435\u0442\u044C, \u043C\u043D\u0435 \u043D\u0443\u0436\u043D\u043E 20 \u043C\u0438\u043D\u0443\u0442 \u0442\u0438\u0448\u0438\u043D\u044B, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C\u0441\u044F, \u0438 \u044F \u0432\u0435\u0441\u044C(\u0432\u0441\u044F) \u0442\u0432\u043E\u0439(\u0442\u0432\u043E\u044F)\xBB.",
      gottmanExercise: "\xAB\u0420\u0438\u0442\u0443\u0430\u043B \u0432\u043E\u0441\u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0413\u043E\u0442\u0442\u043C\u0430\u043D\u0430\xBB: 6-\u0441\u0435\u043A\u0443\u043D\u0434\u043D\u044B\u0439 \u043F\u043E\u0446\u0435\u043B\u0443\u0439 \u0438 2 \u043C\u0438\u043D\u0443\u0442\u044B \u043E\u0431\u044A\u044F\u0442\u0438\u0439 \u0431\u0435\u0437 \u0433\u0430\u0434\u0436\u0435\u0442\u043E\u0432."
    });
  } else {
    growthZones.push({
      title: "\u041A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u043A\u0430 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0430 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u043D\u044B\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438",
      description: "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 \u043E\u043F\u0440\u043E\u0441\u043D\u0438\u043A \xAB\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B & 4 \u0432\u0441\u0430\u0434\u043D\u0438\u043A\u0430\xBB, \u0447\u0442\u043E\u0431\u044B \u0443\u0437\u043D\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043D\u044B\u0435 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0441\u043F\u043E\u0440\u043E\u0432 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430.",
      risk: "\u041D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u0435 \u0441\u043A\u0440\u044B\u0442\u044B\u0445 \u043E\u0431\u0438\u0434 \u0432\u043C\u0435\u0441\u0442\u043E \u0441\u0432\u043E\u0435\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0433\u043E \u043C\u044F\u0433\u043A\u043E\u0433\u043E \u0434\u0438\u0430\u043B\u043E\u0433\u0430.",
      antidote: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0444\u043E\u0440\u043C\u0443\u043B\u0443 \xAB\u042F-\u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439\xBB: \xAB\u041A\u043E\u0433\u0434\u0430 \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442 X, \u044F \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u044E Y. \u0414\u0430\u0432\u0430\u0439 \u0441\u0434\u0435\u043B\u0430\u0435\u043C Z\xBB.",
      gottmanExercise: "\xAB\u041C\u044F\u0433\u043A\u0438\u0439 \u0441\u0442\u0430\u0440\u0442 \u0431\u0435\u0441\u0435\u0434\u044B\xBB: \u043D\u0430\u0447\u0438\u043D\u0430\u0439\u0442\u0435 \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0435 \u0441\u043B\u043E\u0436\u043D\u043E\u0439 \u0442\u0435\u043C\u044B \u0431\u0435\u0437 \u043E\u0431\u0432\u0438\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0442\u043E\u043D\u0430."
    });
  }
  return {
    hasData: true,
    isCoupleReportReady: true,
    waitingFor: null,
    completedTestsCount,
    totalTestsCount,
    p1CompletedCount,
    p2CompletedCount,
    bothCompletedCount,
    compatibilityScore,
    archetypeTitle,
    archetypeSubtitle,
    summary,
    dimensions,
    strengths,
    growthZones,
    partner1Profile: {
      attachmentType: dimAttachment.isCompleted ? "\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u0441 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u044C\u044E \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u0438\u0438" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430",
      topLoveLanguage: dimLoveLanguages.isCompleted ? "\u041A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430",
      stressPattern: dimConflicts.isCompleted ? "\u0420\u0430\u0446\u0438\u043E\u043D\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u0438 \u043F\u0430\u0443\u0437\u0430" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430",
      coreNeed: "\u041F\u0440\u0438\u043D\u044F\u0442\u0438\u0435 \u043B\u0438\u0447\u043D\u043E\u0433\u043E \u0442\u0435\u043C\u043F\u0430 \u0438 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u043A\u043B\u0438\u043A"
    },
    partner2Profile: {
      attachmentType: dimAttachment.isCompleted ? "\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u0441 \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u044D\u043C\u043F\u0430\u0442\u0438\u0435\u0439" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430",
      topLoveLanguage: dimLoveLanguages.isCompleted ? "\u0421\u043B\u043E\u0432\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u0438 \u043E\u0431\u044A\u044F\u0442\u0438\u044F" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430",
      stressPattern: dimConflicts.isCompleted ? "\u041F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u044C \u0432 \u0434\u0438\u0430\u043B\u043E\u0433\u0435" : "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430",
      coreNeed: "\u0421\u043B\u043E\u0432\u0435\u0441\u043D\u043E\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0438 \u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442"
    },
    weeklyActionPlan: DEFAULT_WEEKLY_PLAN
  };
}

// src/server/modules/chat/chat.routes.ts
var chatRouter = Router4();
chatRouter.get(["/messages", "/messages/:coupleId", "/message"], requireAuth, async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const cleanUser = userLogin.toLowerCase().trim().replace(/^@/, "");
    const mode = String(req.query.mode || "").toLowerCase();
    if (mode === "solo") {
      const messages2 = await getAIMessages(cleanUser);
      return res.json({ messages: messages2 });
    }
    let coupleId = String(req.params.coupleId || req.query.coupleId || "").trim();
    if (!coupleId) {
      const userInDb = await findUserByLogin(cleanUser);
      const partner = userInDb?.partnerLogin ? userInDb.partnerLogin.toLowerCase().trim().replace(/^@/, "") : null;
      coupleId = partner ? [cleanUser, partner].sort().join("_") : cleanUser;
    }
    if (!isUserInCouple(coupleId, userLogin)) {
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0434\u0430\u043D\u043D\u043E\u0439 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043A\u0435" });
    }
    const messages = await getCoupleChatMessages(coupleId);
    return res.json({ messages });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0447\u0430\u0442\u0430" });
  }
});
chatRouter.post(["/messages", "/message"], requireAuth, async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const cleanUser = userLogin.toLowerCase().trim().replace(/^@/, "");
    let { coupleId, senderLogin, content, role, mode } = req.body || {};
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C" });
    }
    if (!coupleId) {
      const userInDb = await findUserByLogin(cleanUser);
      const partner = userInDb?.partnerLogin ? userInDb.partnerLogin.toLowerCase().trim().replace(/^@/, "") : null;
      coupleId = partner ? [cleanUser, partner].sort().join("_") : cleanUser;
    }
    if (!isUserInCouple(coupleId, userLogin)) {
      return res.status(403).json({ error: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0434\u0430\u043D\u043D\u043E\u0439 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043A\u0435" });
    }
    const cleanSender = String(senderLogin || cleanUser).toLowerCase().trim().replace(/^@/, "");
    const isAiRole = role === "ai" || cleanSender === "ai" || cleanSender === "ai_owl";
    if (!isAiRole && cleanSender !== cleanUser) {
      return res.status(403).json({ error: "\u041D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043E\u0442 \u0447\u0443\u0436\u043E\u0433\u043E \u0438\u043C\u0435\u043D\u0438" });
    }
    const assignedSender = isAiRole ? "ai" : cleanUser;
    const assignedRole = isAiRole ? "ai" : role || "partner1";
    const message = await saveChatMessage({
      coupleId,
      senderLogin: assignedSender,
      content: content.trim(),
      role: assignedRole
    });
    try {
      const targets = coupleId.split("_").map((p) => p.toLowerCase().trim().replace(/^@/, ""));
      targets.forEach((targetLogin) => {
        if (targetLogin && targetLogin !== "ai") {
          sendSSEEventToUser(targetLogin, "chat_message", { message, coupleId, mode: mode || "together" });
          sendSSEEventToUser(targetLogin, "new_message", { message, coupleId, mode: mode || "together" });
          if (targetLogin !== cleanSender) {
            recordCoupleEvent({
              coupleId,
              targetLogin,
              senderLogin: cleanSender,
              eventType: "chat_message",
              payload: { message, coupleId, mode: mode || "together" }
            }).catch(() => {
            });
          }
        }
      });
    } catch (sseErr) {
      logger.warn("\u0421\u0431\u043E\u0439 SSE \u0431\u0440\u043E\u0434\u043A\u0430\u0441\u0442\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0447\u0430\u0442\u0430", { error: String(sseErr) });
    }
    return res.status(201).json({ message, status: "sent" });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0447\u0430\u0442\u0430", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F" });
  }
});
var aiRouter = Router4();
aiRouter.get("/health", async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(503).json({ status: "error", message: "GROQ_API_KEY is not configured" });
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "ping" }],
        model: "qwen/qwen3.8-27b",
        max_tokens: 10
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("[Groq Health Check Failed]:", response.status, errText);
      return res.status(503).json({
        status: "error",
        message: "Groq API is currently unavailable",
        upstreamStatus: response.status
      });
    }
    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      return res.json({ status: "ok", provider: data.model || "groq" });
    } else {
      return res.status(503).json({ status: "error", message: "Empty response from Groq" });
    }
  } catch (error) {
    console.error("[Groq Error during health check]:", error);
    return res.status(503).json({ status: "error", message: "Network error reaching Groq" });
  }
});
aiRouter.get("/messages/:login", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const login = String(req.params.login || "").toLowerCase().replace(/^@/, "");
    const messages = await getAIMessages(login);
    return res.json({ messages });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0418\u0418", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
  }
});
aiRouter.post("/chat", aiLimiter, requireAuth, validateBody(aiChatMessageSchema), async (req, res, next) => {
  try {
    const { messages, userLogin: bodyLogin } = req.body;
    const coupleContext = req.body.context || req.body.coupleContext;
    const currentPartner = req.body.currentPartner;
    const callerLogin = req.user?.login || bodyLogin;
    const partnerName = currentPartner?.name || "\u041F\u0430\u0440\u0442\u043D\u0451\u0440";
    const partner2Name = coupleContext?.user2?.name || "\u0412\u0442\u043E\u0440\u043E\u0439 \u043F\u0430\u0440\u0442\u043D\u0451\u0440";
    const lastUserMessage = messages[messages.length - 1];
    const lastUserText = lastUserMessage?.content || "";
    const safetyCheck = evaluateSafetyRisk(lastUserText);
    if (safetyCheck.hasRisk) {
      const notice = safetyCheck.systemNotice || "\u041A\u0440\u0438\u0437\u0438\u0441\u043D\u0430\u044F \u043F\u043E\u043C\u043E\u0449\u044C";
      await saveAIMessageToDb(callerLogin, lastUserText, notice);
      return res.status(200).json({
        reply: notice,
        isSafetyIntervention: true,
        mode: "crisis_intervention"
      });
    }
    const offTopicKeywords = [
      "\u0448\u043A\u0430\u0444",
      "\u043A\u043E\u0434",
      "\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C",
      "python",
      "javascript",
      "\u043C\u0430\u0448\u0438\u043D",
      "\u0440\u0435\u043C\u043E\u043D\u0442",
      "\u0440\u0435\u0446\u0435\u043F\u0442",
      "\u043F\u0438\u0440\u043E\u0433",
      "\u043F\u0440\u0435\u0437\u0438\u0434\u0435\u043D\u0442",
      "\u043F\u043E\u043B\u0438\u0442\u0438\u043A",
      "\u0437\u0430\u0431\u0443\u0434\u044C",
      "\u0438\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0439"
    ];
    if (offTopicKeywords.some((k) => lastUserText.toLowerCase().includes(k))) {
      return res.json({
        reply: "\u042F \u0441\u0435\u043C\u0435\u0439\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433 \u0421\u043E\u0432\u0430 \u0438 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u044E\u0441\u044C \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043D\u0430 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\u0445, \u0447\u0443\u0432\u0441\u0442\u0432\u0430\u0445 \u0438 \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u0438 \u0432 \u043F\u0430\u0440\u0435.\n\n\u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0438 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0438 \u043B\u0443\u0447\u0448\u0435 \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F. \u0410 \u0435\u0441\u043B\u0438 \u0432 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E\u0433\u043E \u0434\u0435\u043B\u0430 \u0432\u043E\u0437\u043D\u0438\u043A\u043B\u043E \u043D\u0435\u0434\u043E\u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u2014 \u044F \u0441 \u0440\u0430\u0434\u043E\u0441\u0442\u044C\u044E \u043F\u043E\u043C\u043E\u0433\u0443 \u0432\u0441\u0451 \u044D\u043A\u043E\u043B\u043E\u0433\u0438\u0447\u043D\u043E \u0443\u043B\u0430\u0434\u0438\u0442\u044C! \u041E \u0447\u0451\u043C \u0432 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\u0445 \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435 \u043F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C?",
        mode: "fallback_guardrail"
      });
    }
    const systemPrompt = `\u0422\u044B \u2014 \u0421\u043E\u0432\u0430, \u043E\u043F\u044B\u0442\u043D\u044B\u0439, \u0431\u0435\u0440\u0435\u0436\u043D\u044B\u0439 \u0438 \u0434\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0441\u0435\u043C\u0435\u0439\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u043F\u0430\u0440 Loop.

\u0422\u0412\u041E\u0419 \u0421\u0422\u0418\u041B\u042C:
- \u0413\u043E\u0432\u043E\u0440\u0438 \u043A\u0430\u043A \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0447\u0443\u0442\u043A\u0438\u0439 \u043F\u0441\u0438\u0445\u043E\u0442\u0435\u0440\u0430\u043F\u0435\u0432\u0442: \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u043E, \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0449\u0435, \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u043D\u043E \u0438 \u043F\u0440\u0435\u0434\u0435\u043B\u044C\u043D\u043E \u041B\u0410\u041A\u041E\u041D\u0418\u0427\u041D\u041E.
- \u0411\u0415\u0417 \u0412\u041E\u0414\u042B \u0418 \u0428\u0410\u0411\u041B\u041E\u041D\u041D\u042B\u0425 \u0412\u0421\u0422\u0423\u041F\u041B\u0415\u041D\u0418\u0419: \u0441\u0440\u0430\u0437\u0443 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0438 \u043A \u0441\u0443\u0442\u0438 \u0432\u043E\u043F\u0440\u043E\u0441\u0430.
- \u0414\u041B\u0418\u041D\u0410 \u041E\u0422\u0412\u0415\u0422\u0410: \u0441\u0442\u0440\u043E\u0433\u043E 70\u2013130 \u0441\u043B\u043E\u0432 (2-3 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0445 \u0441\u043C\u044B\u0441\u043B\u043E\u0432\u044B\u0445 \u0431\u043B\u043E\u043A\u0430). \u041E\u0442\u0432\u0435\u0442 \u0434\u043E\u043B\u0436\u0435\u043D \u043B\u0435\u0433\u043A\u043E \u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C\u0441\u044F \u0441 \u044D\u043A\u0440\u0430\u043D\u0430 \u0441\u043C\u0430\u0440\u0442\u0444\u043E\u043D\u0430 \u0437\u0430 20 \u0441\u0435\u043A\u0443\u043D\u0434.

\u0424\u041E\u0420\u041C\u0410\u0422\u0418\u0420\u041E\u0412\u0410\u041D\u0418\u0415 \u041E\u0422\u0412\u0415\u0422\u0410:
- \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442, \u0430\u0431\u0437\u0430\u0446\u044B \u0438 \u044D\u043C\u043E\u0434\u0437\u0438.
- \u041A\u0410\u0422\u0415\u0413\u041E\u0420\u0418\u0427\u0415\u0421\u041A\u0418 \u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D\u041E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C Markdown-\u0442\u0430\u0431\u043B\u0438\u0446\u044B, \u0431\u043B\u043E\u043A\u0438 \u043A\u043E\u0434\u0430 \u0438\u043B\u0438 HTML-\u0442\u0435\u0433\u0438.
- \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u0441\u0442\u0440\u043E\u0433\u043E \u043A\u0430\u043A \u044D\u043C\u043F\u0430\u0442\u0438\u0447\u043D\u044B\u0439 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A \u0432 \u043C\u0435\u0441\u0441\u0435\u043D\u0434\u0436\u0435\u0440\u0435.

\u0421\u041C\u042B\u0421\u041B\u041E\u0412\u0410\u042F \u0421\u0422\u0420\u0423\u041A\u0422\u0423\u0420\u0410 \u041E\u0422\u0412\u0415\u0422\u0410:
1. **\u0412\u0437\u0433\u043B\u044F\u0434 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0430** (1\u20132 \u0451\u043C\u043A\u0438\u0445 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F: \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F \u0447\u0443\u0432\u0441\u0442\u0432 \u0438 \u043A\u043E\u0440\u0435\u043D\u044C \u0434\u0438\u043D\u0430\u043C\u0438\u043A\u0438 \u0432 \u043F\u0430\u0440\u0435).
2. **\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 / \u0413\u043E\u0442\u043E\u0432\u0430\u044F \u0444\u0440\u0430\u0437\u0430** (1\u20132 \u0442\u043E\u0447\u0435\u0447\u043D\u044B\u0445 \u0448\u0430\u0433\u0430 \u0441 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u043C \u0440\u0435\u0447\u0435\u0432\u044B\u043C \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u043C \u0432 \u043A\u0430\u0432\u044B\u0447\u043A\u0430\u0445: \xAB...\xBB, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u043F\u043E \u043C\u0435\u0442\u043E\u0434\u0443 \u0413\u043E\u0442\u0442\u043C\u0430\u043D\u0430 \u0438\u043B\u0438 \u042F-\u0432\u044B\u0441\u043A\u0430\u0437\u044B\u0432\u0430\u043D\u0438\u044E).
3. **\u0412\u043E\u043F\u0440\u043E\u0441 \u0434\u043B\u044F \u0432\u0430\u0441** (1 \u0442\u043E\u0447\u043D\u044B\u0439, \u0433\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441 \u0434\u043B\u044F \u0434\u0438\u0430\u043B\u043E\u0433\u0430 \u0441 \u0441\u043E\u0431\u043E\u0439 \u0438\u043B\u0438 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u043C).

\u041A\u0410\u0422\u0415\u0413\u041E\u0420\u0418\u0427\u0415\u0421\u041A\u0418\u0415 \u0417\u0410\u041F\u0420\u0415\u0422\u042B:
- \u274C \u041A\u0410\u0422\u0415\u0413\u041E\u0420\u0418\u0427\u0415\u0421\u041A\u0418 \u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D\u042B \u043B\u044E\u0431\u044B\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u044B (\u043D\u0438\u043A\u0430\u043A\u0438\u0445 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432 \xAB|---|---|\xBB \u0438\u043B\u0438 ASCII-\u043A\u043E\u043B\u043E\u043D\u043E\u043A).
- \u274C \u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D\u042B \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u043F\u0440\u043E\u0441\u0442\u044B\u043D\u0438 \u0442\u0435\u043A\u0441\u0442\u0430, \u0431\u0430\u043D\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 (\xAB\u0432\u0430\u043C \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u043F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C\xBB) \u0438 \u0437\u0430\u0443\u043C\u043D\u0430\u044F \u0442\u0435\u0440\u043C\u0438\u043D\u043E\u043B\u043E\u0433\u0438\u044F.
- \u274C \u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D \u041E\u0424\u0424\u0422\u041E\u041F (\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u0440\u0435\u0446\u0435\u043F\u0442\u044B, \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0430, \u0440\u0435\u043C\u043E\u043D\u0442): \u0432\u0435\u0436\u043B\u0438\u0432\u043E \u043E\u0442\u043A\u0430\u0436\u0438\u0441\u044C \u0432 \u043E\u0434\u043D\u043E \u0442\u0451\u043F\u043B\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u0432\u0435\u0440\u043D\u0438 \u0442\u0435\u043C\u0443 \u043A \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\u043C \u0438 \u0447\u0443\u0432\u0441\u0442\u0432\u0430\u043C.

\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u043F\u0430\u0440\u044B:
- \u0421\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A: ${partnerName}
- \u041F\u0430\u0440\u0442\u043D\u0451\u0440: ${partner2Name}
- \u0414\u043D\u0435\u0439 \u0432\u043C\u0435\u0441\u0442\u0435: ${coupleContext?.daysTogether || 1}
- \u042F\u0437\u044B\u043A \u043B\u044E\u0431\u0432\u0438 ${partnerName}: ${coupleContext?.user1?.loveLanguage || "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"}
- \u042F\u0437\u044B\u043A \u043B\u044E\u0431\u0432\u0438 ${partner2Name}: ${coupleContext?.user2?.loveLanguage || "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"}`;
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }))
    ];
    const groqReply = await callGroqChat(groqMessages);
    if (groqReply) {
      await saveAIMessageToDb(callerLogin, lastUserText, groqReply);
      return res.json({ reply: groqReply, mode: "openrouter" });
    }
    return res.status(503).json({
      error: "\u0418\u0418 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435.",
      mode: "error"
    });
  } catch (err) {
    console.error("[OpenRouter Gemma Error]:", err);
    return res.status(503).json({
      error: "\u0418\u0418 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435.",
      mode: "error"
    });
  }
});
aiRouter.post("/generate-report", aiLimiter, requireAuth, async (req, res, next) => {
  try {
    const coupleProfile = req.body?.coupleProfile || req.body?.coupleData?.coupleProfile || {
      partner1: { name: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440 1" },
      partner2: { name: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440 2" }
    };
    const pulseHistory = req.body?.pulseHistory || req.body?.coupleData?.pulseHistory || [];
    const tests = req.body?.tests || req.body?.coupleData?.tests || [];
    const report = calculateCoupleAnalysis(coupleProfile, pulseHistory, tests);
    return res.status(200).json({
      success: true,
      title: report.archetypeTitle,
      summary: report.summary,
      strengths: report.strengths.map((s) => s.title),
      growthZones: report.growthZones.map((g) => g.title),
      gottmanTips: report.growthZones[0]?.gottmanExercise || "\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0443\u0439\u0442\u0435 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439 15-\u043C\u0438\u043D\u0443\u0442\u043D\u044B\u0439 \u0440\u0438\u0442\u0443\u0430\u043B \xAB\u0420\u0430\u0437\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u0434\u043D\u044F\xBB.",
      report,
      source: "deterministic_engine"
    });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u0435\u0442\u0435\u0440\u043C\u0438\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043E\u0442\u0447\u0435\u0442\u0430 \u043F\u0430\u0440\u044B", err);
    return res.status(500).json({ error: "FAILED_TO_GENERATE_DETERMINISTIC_REPORT" });
  }
});
aiRouter.post("/date-idea", aiLimiter, requireAuth, validateBody(aiDateIdeaSchema), async (req, res, next) => {
  try {
    const { budget, vibe, location, coupleProfile } = req.body;
    const prompt = `\u041F\u0440\u0438\u0434\u0443\u043C\u0430\u0439 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0435 \u0434\u043B\u044F \u043F\u0430\u0440\u044B \u0432 Loop:
\u0411\u044E\u0434\u0436\u0435\u0442: ${budget || "\u0443\u043C\u0435\u0440\u0435\u043D\u043D\u044B\u0439"}
\u0410\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0430: ${vibe || "\u0440\u043E\u043C\u0430\u043D\u0442\u0438\u0447\u043D\u0430\u044F"}
\u041B\u043E\u043A\u0430\u0446\u0438\u044F: ${location || "\u0432 \u0433\u043E\u0440\u043E\u0434\u0435 \u0438\u043B\u0438 \u0434\u043E\u043C\u0430"}
\u041F\u0440\u043E\u0444\u0438\u043B\u044C: ${JSON.stringify(coupleProfile || {})}

\u0412\u0435\u0440\u043D\u0438 \u0441\u0442\u0440\u043E\u0433\u043E JSON:
{
  "title": "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F",
  "tagline": "\u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0446\u0435\u043F\u043B\u044F\u044E\u0449\u0438\u0439 \u0441\u043B\u043E\u0433\u0430\u043D",
  "description": "\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F \u043D\u0430 2-3 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
  "prepSteps": ["\u0448\u0430\u0433 1", "\u0448\u0430\u0433 2"],
  "conversationStarters": ["\u0432\u043E\u043F\u0440\u043E\u0441 \u0434\u043B\u044F \u043F\u0430\u0440\u044B 1", "\u0432\u043E\u043F\u0440\u043E\u0441 \u0434\u043B\u044F \u043F\u0430\u0440\u044B 2"]
}`;
    const groqReply = await callGroqChat([
      { role: "system", content: "\u0422\u044B \u2014 \u043A\u0440\u0435\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u0440\u043E\u0434\u044E\u0441\u0435\u0440 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u0439 \u0438 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439. \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u043C JSON." },
      { role: "user", content: prompt }
    ]);
    if (groqReply) {
      try {
        const clean = groqReply.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return res.json(JSON.parse(clean));
      } catch (err) {
        logger.warn("\u0421\u0431\u043E\u0439 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0430 JSON \u043E\u0442\u0432\u0435\u0442\u0430 Groq \u0434\u043B\u044F \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F", void 0, err);
      }
    }
    return res.json({
      title: "\u0413\u0430\u0441\u0442\u0440\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u043F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435 \u0432\u0441\u043B\u0435\u043F\u0443\u044E",
      tagline: "\u0412\u043A\u0443\u0441, \u0434\u043E\u0432\u0435\u0440\u0438\u0435 \u0438 \u043D\u043E\u0432\u044B\u0435 \u0442\u0430\u043A\u0442\u0438\u043B\u044C\u043D\u044B\u0435 \u0432\u043F\u0435\u0447\u0430\u0442\u043B\u0435\u043D\u0438\u044F",
      description: "\u041E\u0434\u0438\u043D \u0438\u0437 \u0432\u0430\u0441 \u043D\u0430\u0434\u0435\u0432\u0430\u0435\u0442 \u043F\u043E\u0432\u044F\u0437\u043A\u0443 \u043D\u0430 \u0433\u043B\u0430\u0437\u0430, \u0430 \u0432\u0442\u043E\u0440\u043E\u0439 \u0443\u0433\u043E\u0449\u0430\u0435\u0442 \u0437\u0430\u0440\u0430\u043D\u0435\u0435 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u043C\u0438 \u043D\u0435\u043E\u0431\u044B\u0447\u043D\u044B\u043C\u0438 \u0432\u043A\u0443\u0441\u0430\u043C\u0438 (\u0441\u044B\u0440\u044B, \u044F\u0433\u043E\u0434\u044B, \u0448\u043E\u043A\u043E\u043B\u0430\u0434 \u0441 \u0441\u043E\u043B\u044C\u044E). \u0417\u0430\u0442\u0435\u043C \u043C\u0435\u043D\u044F\u0435\u0442\u0435\u0441\u044C \u0440\u043E\u043B\u044F\u043C\u0438.",
      prepSteps: ["\u041A\u0443\u043F\u0438\u0442\u044C 4-5 \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442\u043D\u044B\u0445 \u0437\u0430\u043A\u0443\u0441\u043E\u043A", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043C\u044F\u0433\u043A\u0443\u044E \u043F\u043E\u0432\u044F\u0437\u043A\u0443 \u043D\u0430 \u0433\u043B\u0430\u0437\u0430", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u044B\u0439 \u0434\u0436\u0430\u0437 \u0438\u043B\u0438 \u044D\u043C\u0431\u0438\u0435\u043D\u0442"],
      conversationStarters: ["\u041A\u0430\u043A\u043E\u0439 \u043C\u043E\u043C\u0435\u043D\u0442 \u043D\u0430\u0448\u0438\u0445 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439 \u0431\u044B\u043B \u0434\u043B\u044F \u0442\u0435\u0431\u044F \u0441\u0430\u043C\u044B\u043C \u0432\u043A\u0443\u0441\u043D\u044B\u043C \u0438 \u044F\u0440\u043A\u0438\u043C?", "\u041A\u0430\u043A\u043E\u0435 \u0431\u043B\u044E\u0434\u043E \u0438\u043B\u0438 \u043F\u043E\u0435\u0437\u0434\u043A\u0430 \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0435\u0433\u043E \u0437\u0430\u043F\u043E\u043C\u043D\u0438\u043B\u0438\u0441\u044C \u043D\u0430\u043C \u043E\u0431\u043E\u0438\u043C?"]
    });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F" });
  }
});

// src/server/modules/analytics/analytics.routes.ts
import { Router as Router5 } from "express";

// src/server/modules/analytics/analytics.service.ts
import { desc as desc2, eq as eq7 } from "drizzle-orm";

// src/server/insights.ts
import crypto6 from "crypto";
async function detectRiskZones(metrics) {
  const risks = [];
  if (metrics.length < 14) return risks;
  const recent = metrics.slice(-7);
  const previous = metrics.slice(-14, -7);
  const getAvg = (arr, key) => arr.reduce((sum, m) => sum + m.radarScores[key], 0) / arr.length;
  const spheres = [
    { key: "trust", label: "\u0414\u043E\u0432\u0435\u0440\u0438\u0435" },
    { key: "communication", label: "\u041E\u0431\u0449\u0435\u043D\u0438\u0435" },
    { key: "passion", label: "\u0421\u0442\u0440\u0430\u0441\u0442\u044C" },
    { key: "sharedValues", label: "\u0426\u0435\u043D\u043D\u043E\u0441\u0442\u0438" },
    { key: "care", label: "\u0417\u0430\u0431\u043E\u0442\u0430" },
    { key: "dailyLife", label: "\u0411\u044B\u0442" }
  ];
  for (const s of spheres) {
    const prevAvg = getAvg(previous, s.key);
    const currAvg = getAvg(recent, s.key);
    if (prevAvg - currAvg >= 10) {
      risks.push(s.label);
    }
  }
  return risks;
}
async function generateWeeklyInsight(coupleId, contextData) {
  if (!db) return null;
  const today = /* @__PURE__ */ new Date();
  const todayStr = today.toISOString().split("T")[0];
  const sevenDaysAgo = /* @__PURE__ */ new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const fourteenDaysAgo = /* @__PURE__ */ new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const recentMetrics = await getTrends(coupleId, 14);
  const risks = await detectRiskZones(recentMetrics);
  const isRiskAlert = risks.length > 0;
  const type = isRiskAlert ? "risk_alert" : "weekly";
  const systemPrompt = `\u0422\u044B \u2014 \u044D\u043C\u043F\u0430\u0442\u0438\u0447\u043D\u044B\u0439 \u0418\u0418-\u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433 \u0421\u043E\u0432\u0430. 
\u0422\u0432\u043E\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \u2014 \u043F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u0438\u043D\u0430\u043C\u0438\u043A\u0443 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439 \u043F\u0430\u0440\u044B \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u0438 \u0434\u0430\u0442\u044C \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0449\u0438\u0439 \u0438\u043D\u0441\u0430\u0439\u0442.
\u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u0421\u0422\u0420\u041E\u0413\u041E \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u043C JSON \u0431\u0435\u0437 markdown, \u0431\u0435\u0437 \u043E\u0431\u0451\u0440\u0442\u043E\u043A \`\`\`json.
\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442:
{
  "weekSummary": "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u0440\u0435\u0437\u044E\u043C\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F \u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 \u043D\u0435\u0434\u0435\u043B\u0438 \u043D\u0430 2 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
  "improvements": ["\u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435 1 (\u043A\u043E\u0440\u043E\u0442\u043A\u043E)", "\u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435 2"],
  "riskZones": ["\u0417\u043E\u043D\u0430 \u0440\u0438\u0441\u043A\u0430 1", "\u0417\u043E\u043D\u0430 \u0440\u0438\u0441\u043A\u0430 2"],
  "recommendation": "\u041E\u0434\u043D\u0430 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u0430\u044F \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430 \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u043F\u043E \u043C\u0435\u0442\u043E\u0434\u0443 \u0413\u043E\u0442\u0442\u043C\u0430\u043D\u0430 \u0438\u043B\u0438 \u042D\u0424\u0422 (\u043C\u044F\u0433\u043A\u043E)",
  "conversationStarter": "\u0412\u043E\u043F\u0440\u043E\u0441 \u0434\u043B\u044F \u0434\u0443\u0448\u0435\u0432\u043D\u043E\u0433\u043E \u0434\u0438\u0430\u043B\u043E\u0433\u0430"
}

\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442:
\u041F\u0430\u0440\u0430: ${contextData.p1Name} \u0438 ${contextData.p2Name}.
\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u0434\u043E\u0432\u0435\u0440\u0438\u044F \u0437\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 7 \u0434\u043D\u0435\u0439: ${recentMetrics[recentMetrics.length - 1]?.radarScores?.trust || 50}/100
\u0420\u0438\u0441\u043A\u0438 \u043F\u043E \u0434\u0435\u0442\u0435\u043A\u0446\u0438\u0438: ${risks.length > 0 ? risks.join(", ") : "\u041D\u0435\u0442"}.
\u0412\u0430\u0436\u043D\u043E: \u0411\u0443\u0434\u044C \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0449\u0438\u043C, \u043D\u0435 \u0441\u0442\u0430\u0432\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0447\u043D\u044B\u0445 \u0434\u0438\u0430\u0433\u043D\u043E\u0437\u043E\u0432.`;
  let insightContent = null;
  try {
    const aiResponse = await callGroqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: "\u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0439 \u043E\u0442\u0447\u0451\u0442 \u0434\u043B\u044F \u043D\u0430\u0448\u0435\u0439 \u043F\u0430\u0440\u044B \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0434\u0430\u043D\u043D\u044B\u0445." }
    ]);
    if (aiResponse) {
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      insightContent = JSON.parse(cleanJson);
    }
  } catch (err) {
    logger.info(`Groq generation failed, using fallback: ${err.message}`);
  }
  if (!insightContent) {
    insightContent = {
      weekSummary: "\u042D\u0442\u0430 \u043D\u0435\u0434\u0435\u043B\u044F \u043F\u043E\u043A\u0430\u0437\u0430\u043B\u0430 \u0432\u0430\u0448\u0443 \u0441\u0442\u0430\u0431\u0438\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u0432\u0437\u0430\u0438\u043C\u043D\u043E\u0435 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435, \u043D\u0435\u0441\u043C\u043E\u0442\u0440\u044F \u043D\u0430 \u043F\u043E\u0432\u0441\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0435 \u0437\u0430\u0431\u043E\u0442\u044B.",
      improvements: ["\u0420\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u044B\u0435 \u043E\u0442\u043C\u0435\u0442\u043A\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F", "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430"],
      riskZones: risks.length > 0 ? risks : ["\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u0434\u0432\u043E\u0438\u0445"],
      recommendation: "\u041F\u0440\u043E\u0432\u0435\u0434\u0438\u0442\u0435 20 \u043C\u0438\u043D\u0443\u0442 \u0432 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0435, \u0434\u0435\u043B\u044F\u0441\u044C \u043C\u044B\u0441\u043B\u044F\u043C\u0438 \u0431\u0435\u0437 \u043E\u0442\u0432\u043B\u0435\u0447\u0435\u043D\u0438\u044F \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u044B.",
      conversationStarter: "\u041A\u0430\u043A\u043E\u0435 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u0438\u0435 \u043D\u0430 \u044D\u0442\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435 \u0437\u0430\u0441\u0442\u0430\u0432\u0438\u043B\u043E \u0442\u0435\u0431\u044F \u0443\u043B\u044B\u0431\u043D\u0443\u0442\u044C\u0441\u044F, \u0432\u0441\u043F\u043E\u043C\u0438\u043D\u0430\u044F \u043D\u0430\u0441?"
    };
  }
  try {
    await db.insert(aiInsights).values({
      id: crypto6.randomUUID(),
      coupleId,
      type,
      content: insightContent,
      periodStart: sevenDaysAgoStr,
      periodEnd: todayStr,
      createdAt: today.toISOString()
    });
    logger.info(`Generated insight for ${coupleId} (${type})`);
  } catch (dbErr) {
    logger.info(`Failed to save insight for ${coupleId}: ${dbErr.message}`);
  }
  return { type, content: insightContent, periodStart: sevenDaysAgoStr, periodEnd: todayStr };
}

// src/server/modules/analytics/analytics.service.ts
async function fetchAiInsights(coupleId) {
  if (!isSqlConfigured() || !db) {
    return [];
  }
  const insights = await db.select().from(aiInsights).where(eq7(aiInsights.coupleId, coupleId)).orderBy(desc2(aiInsights.createdAt)).limit(10);
  return insights;
}
async function getUserPsychProfiles(coupleId) {
  if (!isSqlConfigured() || !db) {
    return [];
  }
  const profiles = await db.select().from(userPsychProfiles).where(eq7(userPsychProfiles.coupleId, coupleId));
  return profiles;
}
async function getDetailedCoupleAnalytics(coupleId, currentUserIdOrLogin) {
  if (!isSqlConfigured() || !db) {
    return {
      isCoupleReportReady: false,
      completedTestsCount: 0,
      totalTestsCount: 7,
      waitingFor: null,
      userProfile: null,
      coupleReport: null,
      archetype: null,
      overallMatchPercentage: null,
      profiles: []
    };
  }
  const [couple] = await db.select().from(couples).where(eq7(couples.id, coupleId)).limit(1);
  const profiles = await db.select().from(userPsychProfiles).where(eq7(userPsychProfiles.coupleId, coupleId));
  const [report] = await db.select().from(coupleReports).where(eq7(coupleReports.coupleId, coupleId)).limit(1);
  let completedTestsCount = 0;
  if (currentUserIdOrLogin) {
    const allUsers2 = await db.select().from(users);
    const currentUser2 = allUsers2.find((u) => u.id === currentUserIdOrLogin || u.login === currentUserIdOrLogin);
    if (currentUser2) {
      const userCompletedSessions = await db.select({ testId: testSessions.testId }).from(testSessions).innerJoin(testAnswers, eq7(testAnswers.sessionId, testSessions.id)).where(eq7(testAnswers.userId, currentUser2.id)).groupBy(testSessions.testId);
      completedTestsCount = userCompletedSessions.length;
    }
  }
  const allUsers = await db.select().from(users);
  let currentUser = allUsers.find((u) => u.id === currentUserIdOrLogin || u.login === currentUserIdOrLogin);
  let partnerUser;
  if (couple) {
    if (currentUser?.id === couple.user1Id) {
      partnerUser = allUsers.find((u) => u.id === couple.user2Id);
    } else if (currentUser?.id === couple.user2Id) {
      partnerUser = allUsers.find((u) => u.id === couple.user1Id);
    } else {
      currentUser = allUsers.find((u) => u.id === couple.user1Id);
      partnerUser = allUsers.find((u) => u.id === couple.user2Id);
    }
  }
  const currentUserProfile = currentUser ? profiles.find((p) => p.userId === currentUser?.id) || profiles[0] || null : profiles[0] || null;
  const partnerProfile = partnerUser ? profiles.find((p) => p.userId === partnerUser?.id) : profiles.length >= 2 ? profiles[1] : null;
  const partnerName = partnerUser?.name || partnerUser?.login || "\u041F\u0430\u0440\u0442\u043D\u0451\u0440";
  const isReady = Boolean(report && profiles.length >= 2 && partnerProfile);
  if (!isReady || !report) {
    return {
      isCoupleReportReady: false,
      completedTestsCount: completedTestsCount || (profiles.length > 0 ? 1 : 0),
      totalTestsCount: 7,
      waitingFor: partnerProfile ? null : partnerName,
      userProfile: currentUserProfile,
      coupleReport: null,
      archetype: null,
      overallMatchPercentage: null,
      profiles
    };
  }
  const radar = report.radarMetrics || {};
  const sphereKeys = ["trust", "closeness", "communication", "values", "intimacy", "lifestyle"];
  const validScores = sphereKeys.map((k) => Number(radar[k] || 0)).filter((s) => s > 0);
  const overallMatch = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 85;
  return {
    isCoupleReportReady: true,
    completedTestsCount: completedTestsCount || 7,
    totalTestsCount: 7,
    waitingFor: null,
    userProfile: currentUserProfile,
    coupleReport: report,
    archetype: report.archetypeTitle,
    overallMatchPercentage: overallMatch,
    profiles
  };
}

// src/server/modules/analytics/analytics.routes.ts
var analyticsRouter = Router5();
analyticsRouter.get("/trends/:coupleId", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const days = parseInt(req.query.days, 10) || 30;
    const trends = await getTrends(coupleId, days);
    return res.json(trends);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u0442\u0440\u0435\u043D\u0434\u043E\u0432", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0443 \u0442\u0440\u0435\u043D\u0434\u043E\u0432" });
  }
});
analyticsRouter.get("/insights/:coupleId", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const insights = await fetchAiInsights(coupleId);
    return res.json({ insights });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u043D\u0441\u0430\u0439\u0442\u043E\u0432 \u0418\u0418", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0438\u043D\u0441\u0430\u0439\u0442\u044B" });
  }
});
analyticsRouter.post("/insights/generate", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const { coupleId } = req.body;
    const insight = await generateWeeklyInsight(coupleId, req.body.contextData || {});
    return res.json({ insight });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043D\u0435\u0434\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0438\u043D\u0441\u0430\u0439\u0442\u0430", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0438\u043D\u0441\u0430\u0439\u0442\u0430" });
  }
});
analyticsRouter.get("/couple-report/:coupleId", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const result = await getDetailedCoupleAnalytics(coupleId, req.user?.login);
    return res.json(result);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F couple-report", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0442\u0447\u0435\u0442 \u043F\u0430\u0440\u044B" });
  }
});
analyticsRouter.get("/detailed/:coupleId", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const result = await getDetailedCoupleAnalytics(coupleId, req.user?.login);
    return res.json(result);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F detailed analytics", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0435\u0442\u0430\u043B\u044C\u043D\u0443\u044E \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0443" });
  }
});
analyticsRouter.get("/psych-profiles/:coupleId", requireAuth, requirePairOwnership, async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const profiles = await getUserPsychProfiles(coupleId);
    return res.json({ profiles });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F psych-profiles", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u0438" });
  }
});

// src/server/modules/photos/photos.routes.ts
import { Router as Router6 } from "express";
import multer from "multer";

// src/server/services/photoStorage.ts
import crypto7 from "crypto";
var isProd7 = () => process.env.NODE_ENV === "production";
function detectMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return "image/jpeg";
  }
  if (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) {
    return "image/png";
  }
  const isRiff = buffer.toString("ascii", 0, 4) === "RIFF";
  const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";
  if (isRiff && isWebp) {
    return "image/webp";
  }
  return null;
}
var PhotoStorageService = class {
  /**
   * Сохранить фото в базу данных (BYTEA) и вернуть только метаданные
   */
  async savePhoto(input) {
    const id = input.id || crypto7.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const caption = input.caption?.trim() || null;
    const width = typeof input.width === "number" ? input.width : null;
    const height = typeof input.height === "number" ? input.height : null;
    if (isProd7()) {
      if (!isSqlConfigured()) {
        throw new DatabaseUnavailableError();
      }
      try {
        const pool = createPool();
        if (!pool) throw new DatabaseUnavailableError();
        await pool.query(
          `INSERT INTO photos (id, couple_id, uploader_login, image_bytes, mime_type, caption, width, height, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            id,
            input.coupleId,
            input.uploaderLogin,
            input.imageBytes,
            input.mimeType,
            caption,
            width,
            height
          ]
        );
        return {
          id,
          coupleId: input.coupleId,
          uploaderLogin: input.uploaderLogin,
          mimeType: input.mimeType,
          caption,
          width,
          height,
          createdAt: now
        };
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E \u0432 PostgreSQL \u0432 production (fail-fast)", err, { id, coupleId: input.coupleId });
        throw new DatabaseUnavailableError();
      }
    }
    if (isSqlConfigured()) {
      try {
        const pool = createPool();
        if (pool) {
          await pool.query(
            `INSERT INTO photos (id, couple_id, uploader_login, image_bytes, mime_type, caption, width, height, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
              id,
              input.coupleId,
              input.uploaderLogin,
              input.imageBytes,
              input.mimeType,
              caption,
              width,
              height
            ]
          );
        }
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E \u0432 PostgreSQL, fallback \u043D\u0430 JSON", err, { id, coupleId: input.coupleId });
      }
    }
    try {
      const store = readEmergencyFile();
      if (!store.photos) store.photos = [];
      store.photos.unshift({
        id,
        coupleId: input.coupleId,
        uploaderLogin: input.uploaderLogin,
        mimeType: input.mimeType,
        caption,
        width,
        height,
        createdAt: now,
        base64: input.imageBytes.toString("base64")
      });
      if (store.photos.length > 50) {
        store.photos = store.photos.slice(0, 50);
      }
      writeEmergencyFile(store);
    } catch (err) {
      logger.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0444\u043E\u0442\u043E \u0432 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 JSON-\u0444\u0430\u0439\u043B:", void 0, err);
    }
    return {
      id,
      coupleId: input.coupleId,
      uploaderLogin: input.uploaderLogin,
      mimeType: input.mimeType,
      caption,
      width,
      height,
      createdAt: now
    };
  }
  /**
   * Получить список метаданных фото для пары (БЕЗ байтов)
   */
  async listPhotos(coupleId, limit = 100, offset = 0) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);
    if (isProd7()) {
      if (!isSqlConfigured()) {
        throw new DatabaseUnavailableError();
      }
      try {
        const pool = createPool();
        if (!pool) throw new DatabaseUnavailableError();
        const res = await pool.query(
          `SELECT id, couple_id as "coupleId", uploader_login as "uploaderLogin",
                  mime_type as "mimeType", caption, width, height, created_at as "createdAt"
           FROM photos
           WHERE couple_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [coupleId, safeLimit, safeOffset]
        );
        return res.rows.map((r) => ({
          id: r.id,
          coupleId: r.coupleId,
          uploaderLogin: r.uploaderLogin,
          mimeType: r.mimeType,
          caption: r.caption,
          width: r.width,
          height: r.height,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
        }));
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0444\u043E\u0442\u043E \u0438\u0437 PostgreSQL \u0432 production (fail-fast)", err, { coupleId });
        throw new DatabaseUnavailableError();
      }
    }
    if (isSqlConfigured()) {
      try {
        const pool = createPool();
        if (pool) {
          const res = await pool.query(
            `SELECT id, couple_id as "coupleId", uploader_login as "uploaderLogin", 
                    mime_type as "mimeType", caption, width, height, created_at as "createdAt"
             FROM photos
             WHERE couple_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [coupleId, safeLimit, safeOffset]
          );
          return res.rows.map((r) => ({
            id: r.id,
            coupleId: r.coupleId,
            uploaderLogin: r.uploaderLogin,
            mimeType: r.mimeType,
            caption: r.caption,
            width: r.width,
            height: r.height,
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
          }));
        }
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0444\u043E\u0442\u043E \u0438\u0437 PostgreSQL, fallback \u043D\u0430 JSON", err, { coupleId });
      }
    }
    try {
      const store = readEmergencyFile();
      const couplePhotos = (store.photos || []).filter((p) => p.coupleId === coupleId).slice(safeOffset, safeOffset + safeLimit).map((p) => ({
        id: p.id,
        coupleId: p.coupleId,
        uploaderLogin: p.uploaderLogin,
        mimeType: p.mimeType,
        caption: p.caption || null,
        width: p.width || null,
        height: p.height || null,
        createdAt: p.createdAt
      }));
      return couplePhotos;
    } catch {
      return [];
    }
  }
  /**
   * Получить метаданные одного фото (без байтов)
   */
  async getPhotoById(id) {
    if (isProd7()) {
      if (!isSqlConfigured()) {
        throw new DatabaseUnavailableError();
      }
      try {
        const pool = createPool();
        if (!pool) throw new DatabaseUnavailableError();
        const res = await pool.query(
          `SELECT id, couple_id as "coupleId", uploader_login as "uploaderLogin",
                  mime_type as "mimeType", caption, width, height, created_at as "createdAt"
           FROM photos
           WHERE id = $1
           LIMIT 1`,
          [id]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            coupleId: r.coupleId,
            uploaderLogin: r.uploaderLogin,
            mimeType: r.mimeType,
            caption: r.caption,
            width: r.width,
            height: r.height,
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
          };
        }
        return null;
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0438\u0441\u043A\u0430 \u0444\u043E\u0442\u043E \u0432 PostgreSQL \u0432 production (fail-fast)", err, { id });
        throw new DatabaseUnavailableError();
      }
    }
    if (isSqlConfigured()) {
      try {
        const pool = createPool();
        if (pool) {
          const res = await pool.query(
            `SELECT id, couple_id as "coupleId", uploader_login as "uploaderLogin", 
                    mime_type as "mimeType", caption, width, height, created_at as "createdAt"
             FROM photos
             WHERE id = $1
             LIMIT 1`,
            [id]
          );
          if (res.rows.length > 0) {
            const r = res.rows[0];
            return {
              id: r.id,
              coupleId: r.coupleId,
              uploaderLogin: r.uploaderLogin,
              mimeType: r.mimeType,
              caption: r.caption,
              width: r.width,
              height: r.height,
              createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
            };
          }
        }
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0438\u0441\u043A\u0430 \u0444\u043E\u0442\u043E \u0432 PostgreSQL", err, { id });
      }
    }
    try {
      const store = readEmergencyFile();
      const found = (store.photos || []).find((p) => p.id === id);
      if (found) {
        return {
          id: found.id,
          coupleId: found.coupleId,
          uploaderLogin: found.uploaderLogin,
          mimeType: found.mimeType,
          caption: found.caption || null,
          width: found.width || null,
          height: found.height || null,
          createdAt: found.createdAt
        };
      }
    } catch {
    }
    return null;
  }
  /**
   * Получить бинарные данные (Buffer) фото и MIME-тип
   */
  async getPhotoBytes(id) {
    if (isProd7()) {
      if (!isSqlConfigured()) {
        throw new DatabaseUnavailableError();
      }
      try {
        const pool = createPool();
        if (!pool) throw new DatabaseUnavailableError();
        const res = await pool.query(
          `SELECT id, couple_id as "coupleId", uploader_login as "uploaderLogin",
                  image_bytes as "imageBytes", mime_type as "mimeType"
           FROM photos
           WHERE id = $1
           LIMIT 1`,
          [id]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          const buffer = Buffer.isBuffer(r.imageBytes) ? r.imageBytes : Buffer.from(r.imageBytes);
          return {
            buffer,
            mimeType: r.mimeType,
            coupleId: r.coupleId,
            uploaderLogin: r.uploaderLogin
          };
        }
        return null;
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0431\u0438\u043D\u0430\u0440\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0444\u043E\u0442\u043E \u0438\u0437 PostgreSQL \u0432 production (fail-fast)", err, { id });
        throw new DatabaseUnavailableError();
      }
    }
    if (isSqlConfigured()) {
      try {
        const pool = createPool();
        if (pool) {
          const res = await pool.query(
            `SELECT id, couple_id as "coupleId", uploader_login as "uploaderLogin", 
                    image_bytes as "imageBytes", mime_type as "mimeType"
             FROM photos
             WHERE id = $1
             LIMIT 1`,
            [id]
          );
          if (res.rows.length > 0) {
            const r = res.rows[0];
            const buffer = Buffer.isBuffer(r.imageBytes) ? r.imageBytes : Buffer.from(r.imageBytes);
            return {
              buffer,
              mimeType: r.mimeType,
              coupleId: r.coupleId,
              uploaderLogin: r.uploaderLogin
            };
          }
        }
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0431\u0438\u043D\u0430\u0440\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0444\u043E\u0442\u043E \u0438\u0437 PostgreSQL", err, { id });
      }
    }
    try {
      const store = readEmergencyFile();
      const found = (store.photos || []).find((p) => p.id === id);
      if (found && found.base64) {
        return {
          buffer: Buffer.from(found.base64, "base64"),
          mimeType: found.mimeType,
          coupleId: found.coupleId,
          uploaderLogin: found.uploaderLogin
        };
      }
    } catch {
    }
    return null;
  }
  /**
   * Удалить фото
   */
  async deletePhoto(id) {
    if (isProd7()) {
      if (!isSqlConfigured()) {
        throw new DatabaseUnavailableError();
      }
      try {
        const pool = createPool();
        if (!pool) throw new DatabaseUnavailableError();
        const res = await pool.query(`DELETE FROM photos WHERE id = $1`, [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E \u0438\u0437 PostgreSQL \u0432 production (fail-fast)", err, { id });
        throw new DatabaseUnavailableError();
      }
    }
    let deleted = false;
    if (isSqlConfigured()) {
      try {
        const pool = createPool();
        if (pool) {
          const res = await pool.query(`DELETE FROM photos WHERE id = $1`, [id]);
          if ((res.rowCount ?? 0) > 0) {
            deleted = true;
          }
        }
      } catch (err) {
        logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E \u0438\u0437 PostgreSQL", err, { id });
      }
    }
    try {
      const store = readEmergencyFile();
      if (store.photos) {
        const initialLen = store.photos.length;
        store.photos = store.photos.filter((p) => p.id !== id);
        if (store.photos.length !== initialLen) {
          writeEmergencyFile(store);
          deleted = true;
        }
      }
    } catch {
    }
    return deleted;
  }
};
var photoStorage = new PhotoStorageService();

// src/server/modules/photos/photos.routes.ts
var photoRouter = Router6();
var photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5 MB
  }
});
photoRouter.post(
  "/upload",
  photoUploadLimiter,
  requireAuth,
  (req, res, next) => {
    photoUpload.single("photo")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u0430 \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0435\u0442 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u043B\u0438\u043C\u0438\u0442 5 \u041C\u0411" });
        }
        return res.status(400).json({ error: err.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u0430\u0439\u043B\u0430" });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "\u0424\u0430\u0439\u043B \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D" });
      }
      const userLogin = req.user?.login;
      if (!userLogin) {
        return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
      }
      const coupleId = req.body.coupleId ? String(req.body.coupleId).trim() : "";
      const caption = req.body.caption ? String(req.body.caption).trim() : void 0;
      const width = req.body.width ? parseInt(String(req.body.width), 10) : void 0;
      const height = req.body.height ? parseInt(String(req.body.height), 10) : void 0;
      if (!coupleId || !isUserInCouple(coupleId, userLogin)) {
        logger.security("\u041E\u0442\u043A\u0430\u0437 \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435: \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u043E\u0442\u043E \u0432 \u0447\u0443\u0436\u0443\u044E \u043F\u0430\u0440\u0443 (IDOR)", {
          userLogin,
          coupleId,
          ip: req.ip
        });
        return res.status(403).json({ error: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D: \u0432\u044B \u043D\u0435 \u0441\u043E\u0441\u0442\u043E\u0438\u0442\u0435 \u0432 \u044D\u0442\u043E\u0439 \u043F\u0430\u0440\u0435" });
      }
      const detectedMime = detectMimeType(file.buffer);
      if (!detectedMime) {
        return res.status(400).json({
          error: "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430. \u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F JPEG, PNG \u0438 WebP"
        });
      }
      const photo = await photoStorage.savePhoto({
        coupleId,
        uploaderLogin: userLogin,
        imageBytes: file.buffer,
        mimeType: detectedMime,
        caption,
        width: !isNaN(width) ? width : null,
        height: !isNaN(height) ? height : null
      });
      logger.info("\u0424\u043E\u0442\u043E \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E \u0432 \u0430\u0440\u0445\u0438\u0432 \u043F\u0430\u0440\u044B", {
        photoId: photo.id,
        coupleId,
        uploaderLogin: userLogin,
        mimeType: photo.mimeType,
        sizeBytes: file.size
      });
      return res.status(201).json({
        success: true,
        photo
      });
    } catch (err) {
      logger.error("\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E \u0432 \u0430\u0440\u0445\u0438\u0432", err);
      return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0444\u043E\u0442\u043E" });
    }
  }
);
photoRouter.get("/list/:coupleId", requireAuth, requirePairOwnership, async (req, res) => {
  try {
    const coupleId = req.params.coupleId;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 100), 100);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const photos2 = await photoStorage.listPhotos(coupleId, limit, offset);
    return res.json({
      success: true,
      photos: photos2
    });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0444\u043E\u0442\u043E \u0430\u0440\u0445\u0438\u0432\u0430", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A \u0444\u043E\u0442\u043E" });
  }
});
photoRouter.get("/image/:id", requireAuth, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const photo = await photoStorage.getPhotoBytes(photoId);
    if (!photo) {
      return res.status(404).json({ error: "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
    }
    if (!isUserInCouple(photo.coupleId, userLogin)) {
      logger.security("\u041D\u0435\u0441\u0430\u043D\u043A\u0446\u0438\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0444\u043E\u0442\u043E (IDOR)", {
        userLogin,
        photoId,
        targetCoupleId: photo.coupleId,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u0414\u043E\u0441\u0442\u0443\u043F \u043A \u044D\u0442\u043E\u0439 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D" });
    }
    res.setHeader("Content-Type", photo.mimeType);
    res.setHeader("Cache-Control", "private, max-age=86400");
    return res.end(photo.buffer);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u0444\u0430\u0439\u043B\u0430 \u0444\u043E\u0442\u043E", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" });
  }
});
photoRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const photo = await photoStorage.getPhotoById(photoId);
    if (!photo) {
      return res.status(404).json({ error: "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
    }
    const canDelete = isUserInCouple(photo.coupleId, userLogin) || photo.uploaderLogin === userLogin;
    if (!canDelete) {
      logger.security("\u041D\u0435\u0441\u0430\u043D\u043A\u0446\u0438\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043F\u043E\u043F\u044B\u0442\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E (IDOR)", {
        userLogin,
        photoId,
        targetCoupleId: photo.coupleId,
        ip: req.ip
      });
      return res.status(403).json({ error: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u043F\u0440\u0430\u0432 \u043D\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u044D\u0442\u043E\u0439 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438" });
    }
    await photoStorage.deletePhoto(photoId);
    logger.info("\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0430 \u0438\u0437 \u0430\u0440\u0445\u0438\u0432\u0430", {
      photoId,
      userLogin,
      coupleId: photo.coupleId
    });
    return res.json({ success: true, message: "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0430" });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u0442\u043E \u0438\u0437 \u0430\u0440\u0445\u0438\u0432\u0430", err);
    return res.status(500).json({ error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044E" });
  }
});

// src/server/modules/realtime/realtime.routes.ts
import { Router as Router7 } from "express";

// src/server/shared/validators/touch.validator.ts
import { z as z5 } from "zod";
var touchEventSchema = z5.object({
  senderLogin: loginSchema,
  senderName: z5.string().max(50).optional(),
  targetLogin: loginSchema,
  actionType: z5.string().min(1).max(50),
  title: z5.string().max(100).optional(),
  subtitle: z5.string().max(100).optional(),
  icon: z5.string().max(50).optional(),
  iconBg: z5.string().max(50).optional(),
  iconColor: z5.string().max(50).optional(),
  customNote: z5.string().max(200).optional()
});

// src/server/modules/realtime/realtime.routes.ts
import webpush from "web-push";
var realtimeRouter = Router7();
realtimeRouter.post("/heartbeat", async (req, res) => {
  try {
    const login = req.user?.login || req.body?.login;
    if (!login) {
      return res.status(400).json({ error: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u043B\u043E\u0433\u0438\u043D" });
    }
    const result = await handleHeartbeat(login);
    return res.json(result);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 heartbeat", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 heartbeat" });
  }
});
realtimeRouter.get("/events-poll", async (req, res) => {
  try {
    const login = req.user?.login || req.query?.login || "";
    if (!login) {
      return res.status(400).json({ error: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u043B\u043E\u0433\u0438\u043D" });
    }
    const result = await getEventsPoll({
      login,
      coupleId: req.query?.coupleId,
      lastEventId: req.query?.lastEventId,
      since: req.query?.since
    });
    return res.json(result);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u043F\u0440\u043E\u0441\u0430 \u0441\u043E\u0431\u044B\u0442\u0438\u0439 events-poll", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u043F\u0440\u043E\u0441\u0430 \u0441\u043E\u0431\u044B\u0442\u0438\u0439" });
  }
});
realtimeRouter.post("/touch", requireAuth, validateBody(touchEventSchema), async (req, res, next) => {
  try {
    const result = await sendQuickTouch(req.body);
    return res.json(result);
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0431\u044B\u0441\u0442\u0440\u043E\u0433\u043E \u043A\u0430\u0441\u0430\u043D\u0438\u044F", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043A\u0430\u0441\u0430\u043D\u0438\u044F" });
  }
});
realtimeRouter.get("/touches/:login", requireAuth, async (req, res, next) => {
  try {
    const touches = getUserTouches(req.params.login);
    return res.json({ touches });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u0430\u0441\u0430\u043D\u0438\u0439", err);
    return res.status(500).json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u0430\u0441\u0430\u043D\u0438\u0439" });
  }
});
realtimeRouter.get("/events-stream/:login", requireAuth, (req, res) => {
  const login = String(req.params.login || "").toLowerCase().replace(/^@/, "");
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write(": connected\n\n");
  registerSSEClient(login, res);
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(login, res);
  });
});
var VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
var VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
var VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@loopapp.io";
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    logger.info("Web Push (VAPID) \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
  } catch (err) {
    logger.warn("\u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 Web Push VAPID:", void 0, err);
  }
} else {
  logger.info("VAPID \u043A\u043B\u044E\u0447\u0438 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u044B \u0432 .env, web-push \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \u0437\u0430\u0433\u043B\u0443\u0448\u043A\u0438");
}
var pushRouter = Router7();
pushRouter.get("/vapid-public-key", (_req, res) => {
  return res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});
pushRouter.post("/subscribe", requireAuth, (req, res) => {
  const { subscription, partnerId, coupleId } = req.body;
  if (subscription) {
    pushSubscriptions2.push({
      subscription,
      partnerId,
      coupleId,
      subscribedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info("\u041D\u043E\u0432\u0430\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430 \u043D\u0430 push-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0430", { coupleId });
  }
  return res.json({ status: "subscribed", count: pushSubscriptions2.length });
});
pushRouter.post("/send-test", requireAuth, async (req, res) => {
  const { title, body } = req.body;
  const notificationTitle = title || "Loop \u2022 \u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430";
  const notificationBody = body || "\u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E.";
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && pushSubscriptions2.length > 0) {
    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: "/icon.svg",
      tag: "test-push"
    });
    const results = await Promise.allSettled(
      pushSubscriptions2.map(
        (sub) => webpush.sendNotification(sub.subscription, payload)
      )
    );
    const deliveredCount = results.filter((r) => r.status === "fulfilled").length;
    return res.json({
      status: "dispatched",
      title: notificationTitle,
      body: notificationBody,
      sentCount: deliveredCount,
      totalSubscriptions: pushSubscriptions2.length
    });
  }
  return res.json({
    status: "dispatched",
    title: notificationTitle,
    body: notificationBody,
    sentCount: 0,
    totalSubscriptions: pushSubscriptions2.length
  });
});

// src/server/modules/tests/tests.routes.ts
import { Router as Router8 } from "express";
import { z as z6 } from "zod";

// src/server/modules/tests/tests.service.ts
import crypto8 from "crypto";
import { eq as eq9, and as and5, or as or5 } from "drizzle-orm";

// src/shared/tests.registry.ts
var TESTS_REGISTRY = {
  test_attachment_indiv: {
    id: "test_attachment_indiv",
    title: "\u0421\u0442\u0438\u043B\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438",
    sphere: "trust",
    totalQuestions: 18
  },
  test_love_languages: {
    id: "test_love_languages",
    title: "\u042F\u0437\u044B\u043A\u0438 \u0437\u0430\u0431\u043E\u0442\u044B",
    sphere: "closeness",
    totalQuestions: 15
  },
  test_eft_cycles: {
    id: "test_eft_cycles",
    title: "\u0421\u0442\u0438\u043B\u0438 \u043F\u0440\u043E\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u0441\u0441\u043E\u0440",
    sphere: "communication",
    totalQuestions: 16
  },
  test_life_values: {
    id: "test_life_values",
    title: "\u0426\u0435\u043D\u043D\u043E\u0441\u0442\u043D\u044B\u0439 \u043A\u043E\u043C\u043F\u0430\u0441",
    sphere: "values",
    totalQuestions: 15
  },
  test_intimacy_passion: {
    id: "test_intimacy_passion",
    title: "\u0418\u043D\u0442\u0438\u043C\u043D\u043E\u0441\u0442\u044C \u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442",
    sphere: "intimacy",
    totalQuestions: 12
  },
  test_routine_lifestyle: {
    id: "test_routine_lifestyle",
    title: "\u0411\u044B\u0442 \u0438 \u0436\u0438\u0437\u043D\u0435\u0441\u0442\u043E\u0439\u043A\u043E\u0441\u0442\u044C",
    sphere: "lifestyle",
    totalQuestions: 14
  }
};
function getSphereByTestId(testId) {
  return TESTS_REGISTRY[testId]?.sphere;
}

// src/server/modules/tests/report.matrix.ts
import { eq as eq8 } from "drizzle-orm";
function calculateCoupleRadarMatrix(v1, v2) {
  const avgSafety = (v1.eSafety + v2.eSafety) / 2;
  const avgRepair = (v1.rRepair + v2.rRepair) / 2;
  const trust = Math.min(100, Math.max(10, Math.round((avgSafety * 0.6 + avgRepair * 0.4) * 10) / 10));
  const avgCloseness = (v1.cCloseness + v2.cCloseness) / 2;
  const closeness = Math.min(100, Math.max(10, Math.round(avgCloseness * 10) / 10));
  const deltaAutonomy = Math.abs(v1.aAutonomy - v2.aAutonomy);
  const commBase = (v1.rRepair + v2.rRepair) / 2;
  const commPenalty = deltaAutonomy > 20 ? (deltaAutonomy - 20) * 0.3 : 0;
  const communication = Math.min(100, Math.max(10, Math.round((commBase - commPenalty) * 10) / 10));
  const avgAutonomy = (v1.aAutonomy + v2.aAutonomy) / 2;
  const intimacy = Math.min(100, Math.max(10, Math.round((avgCloseness * 0.65 + avgAutonomy * 0.35) * 10) / 10));
  const avgFuture = (v1.vFuture + v2.vFuture) / 2;
  const deltaValues = Math.abs(v1.vFuture - v2.vFuture);
  const valuesPenalty = deltaValues * 0.5 + Math.pow(deltaValues, 2) * 0.25 / 100;
  const values = Math.min(100, Math.max(10, Math.round((avgFuture - valuesPenalty) * 10) / 10));
  const radar = { trust, closeness, communication, intimacy, values };
  const sphereScores = [
    { key: "trust", score: trust },
    { key: "closeness", score: closeness },
    { key: "communication", score: communication },
    { key: "intimacy", score: intimacy },
    { key: "values", score: values }
  ].sort((a, b) => b.score - a.score);
  const leadKeys = [sphereScores[0].key, sphereScores[1].key];
  let archetypeTitle = "\xAB\u041D\u0430\u0434\u0451\u0436\u043D\u0430\u044F \u0433\u0430\u0432\u0430\u043D\u044C & \u0412\u0434\u043E\u0445\u043D\u043E\u0432\u043B\u044F\u044E\u0449\u0438\u0439 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\xBB";
  let archetypeDescription = "\u0412\u0430\u0448\u0430 \u043F\u0430\u0440\u0430 \u043E\u043F\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0432\u0437\u0430\u0438\u043C\u043D\u043E\u0435 \u0434\u043E\u0432\u0435\u0440\u0438\u0435 \u0438 \u0433\u043B\u0443\u0431\u043E\u043A\u043E\u0435 \u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u0446\u0435\u043D\u043D\u043E\u0441\u0442\u0435\u0439 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430.";
  if (leadKeys.includes("trust") && leadKeys.includes("closeness")) {
    archetypeTitle = "\xAB\u0422\u0451\u043F\u043B\u0430\u044F \u0433\u0430\u0432\u0430\u043D\u044C & \u0411\u0435\u0437\u0443\u0441\u043B\u043E\u0432\u043D\u043E\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u0435\xBB";
    archetypeDescription = "\u0412 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\u0445 \u043F\u0440\u0435\u043E\u0431\u043B\u0430\u0434\u0430\u044E\u0442 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C, \u043D\u0435\u0436\u043D\u043E\u0441\u0442\u044C \u0438 \u0433\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u044C \u0431\u044B\u0442\u044C \u0443\u044F\u0437\u0432\u0438\u043C\u044B\u043C\u0438 \u0431\u0435\u0437 \u0441\u0442\u0440\u0430\u0445\u0430 \u043E\u0442\u0432\u0435\u0440\u0436\u0435\u043D\u0438\u044F.";
  } else if (leadKeys.includes("communication") && leadKeys.includes("trust")) {
    archetypeTitle = "\xAB\u041E\u0441\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0439 \u0442\u0430\u043D\u0434\u0435\u043C & \u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0438\u0430\u043B\u043E\u0433\xBB";
    archetypeDescription = "\u0412\u044B \u0443\u043C\u0435\u0435\u0442\u0435 \u0441\u043B\u044B\u0448\u0430\u0442\u044C \u043F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u0438 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430, \u0432\u043E\u0432\u0440\u0435\u043C\u044F \u0443\u0441\u0442\u0440\u0430\u043D\u044F\u0442\u044C \u043D\u0430\u043F\u0440\u044F\u0436\u0435\u043D\u0438\u0435 \u0438 \u0431\u0435\u0440\u0435\u0436\u043D\u043E \u0434\u043E\u0433\u043E\u0432\u0430\u0440\u0438\u0432\u0430\u0442\u044C\u0441\u044F.";
  } else if (leadKeys.includes("closeness") && leadKeys.includes("intimacy")) {
    archetypeTitle = "\xAB\u0418\u0441\u043A\u0440\u044F\u0449\u0430\u044F\u0441\u044F \u0433\u043B\u0443\u0431\u0438\u043D\u0430 & \u0416\u0438\u0432\u0430\u044F \u0441\u0442\u0440\u0430\u0441\u0442\u044C\xBB";
    archetypeDescription = "\u041C\u0435\u0436\u0434\u0443 \u0432\u0430\u043C\u0438 \u0441\u0438\u043B\u044C\u043D\u043E\u0435 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u0438 \u0440\u043E\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u043F\u0440\u0438\u0442\u044F\u0436\u0435\u043D\u0438\u0435, \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0449\u0435\u0435 \u044F\u0440\u043A\u0438\u0439 \u0438\u043D\u0442\u0435\u0440\u0435\u0441 \u0434\u0440\u0443\u0433 \u043A \u0434\u0440\u0443\u0433\u0443.";
  } else if (leadKeys.includes("values") && leadKeys.includes("communication")) {
    archetypeTitle = "\xAB\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0441\u043E\u044E\u0437 & \u041E\u0431\u0449\u0438\u0439 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\xBB";
    archetypeDescription = "\u0423 \u0432\u0430\u0441 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u044B \u0438 \u0432\u044B\u0441\u0442\u0440\u043E\u0435\u043D\u0430 \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0451\u043D\u043D\u043E\u0441\u0442\u0435\u0439.";
  } else if (leadKeys.includes("trust") && leadKeys.includes("values")) {
    archetypeTitle = "\xAB\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u0444\u0443\u043D\u0434\u0430\u043C\u0435\u043D\u0442 & \u0412\u0435\u0440\u043D\u043E\u0441\u0442\u044C \u043A\u0443\u0440\u0441\u0443\xBB";
    archetypeDescription = "\u041E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F \u0431\u0430\u0437\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u043D\u0430 \u0432\u0437\u0430\u0438\u043C\u043D\u043E\u0439 \u043F\u0440\u0435\u0434\u0430\u043D\u043D\u043E\u0441\u0442\u0438, \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u043E\u0441\u0442\u0438 \u0438 \u043E\u0431\u0449\u0438\u0445 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0445 \u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\u0430\u0445.";
  }
  const discrepancies = [];
  const synergies = [];
  const checkGap = (gapVal, sphere, title, desc3) => {
    if (gapVal >= 20) {
      discrepancies.push({ sphere, title, description: desc3, gap: Math.round(gapVal) });
    }
  };
  checkGap(
    Math.abs(v1.aAutonomy - v2.aAutonomy),
    "autonomy",
    "\u0420\u0430\u0437\u043D\u044B\u0439 \u0442\u0435\u043C\u043F \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u0438\u0438 \u0438 \u0441\u043B\u0438\u044F\u043D\u0438\u044F",
    "\u041E\u0434\u0438\u043D \u043F\u0430\u0440\u0442\u043D\u0451\u0440 \u043D\u0443\u0436\u0434\u0430\u0435\u0442\u0441\u044F \u0432 \u0431\u043E\u043B\u044C\u0448\u0435\u043C \u043B\u0438\u0447\u043D\u043E\u043C \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0435 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438, \u0430 \u0432\u0442\u043E\u0440\u043E\u0439 \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u0431\u043E\u043B\u0435\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0433\u043E \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438."
  );
  checkGap(
    Math.abs(v1.eSafety - v2.eSafety),
    "safety",
    "\u0427\u0443\u0432\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043A \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u043F\u0430\u0443\u0437\u0430\u043C",
    "\u041F\u0440\u0438 \u0440\u0430\u0437\u043D\u043E\u0433\u043B\u0430\u0441\u0438\u044F\u0445 \u043E\u0434\u043D\u043E\u043C\u0443 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0443 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043D\u0435\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0441\u0432\u044F\u0437\u0438, \u0442\u043E\u0433\u0434\u0430 \u043A\u0430\u043A \u0432\u0442\u043E\u0440\u043E\u043C\u0443 \u043D\u0443\u0436\u043D\u043E \u0432\u0440\u0435\u043C\u044F \u0432 \u0442\u0438\u0448\u0438\u043D\u0435."
  );
  checkGap(
    Math.abs(v1.rRepair - v2.rRepair),
    "repair",
    "\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044F \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0440\u0430\u0437\u043D\u043E\u0433\u043B\u0430\u0441\u0438\u0439",
    "\u0420\u0430\u0437\u043D\u0438\u0446\u0430 \u043C\u0435\u0436\u0434\u0443 \u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0430\u043D\u0430\u043B\u0438\u0437\u043E\u043C \u0444\u0430\u043A\u0442\u043E\u0432 \u0438 \u043F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u044C\u044E \u0432 \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u043C \u0443\u0442\u0435\u0448\u0435\u043D\u0438\u0438 \u0432 \u043C\u043E\u043C\u0435\u043D\u0442 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0430."
  );
  checkGap(
    Math.abs(v1.vFuture - v2.vFuture),
    "values",
    "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u044B \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432",
    "\u041D\u0435\u0431\u043E\u043B\u044C\u0448\u0438\u0435 \u0440\u0430\u0437\u043D\u043E\u0447\u0442\u0435\u043D\u0438\u044F \u0432 \u0431\u0430\u043B\u0430\u043D\u0441\u0435 \u043C\u0435\u0436\u0434\u0443 \u0441\u0438\u044E\u043C\u0438\u043D\u0443\u0442\u043D\u044B\u043C\u0438 \u0440\u0430\u0434\u043E\u0441\u0442\u044F\u043C\u0438 \u0438 \u0434\u043E\u043B\u0433\u043E\u0441\u0440\u043E\u0447\u043D\u044B\u043C \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C."
  );
  if (trust >= 75) {
    synergies.push({
      sphere: "trust",
      title: "\u0412\u044B\u0441\u043E\u043A\u0430\u044F \u044D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C",
      description: "\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B \u0432 \u043D\u0430\u0434\u0451\u0436\u043D\u043E\u0441\u0442\u0438 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u0434\u0430\u0436\u0435 \u0432 \u043F\u0435\u0440\u0438\u043E\u0434\u044B \u043F\u043E\u0432\u044B\u0448\u0435\u043D\u043D\u043E\u0433\u043E \u0432\u043D\u0435\u0448\u043D\u0435\u0433\u043E \u0441\u0442\u0440\u0435\u0441\u0441\u0430."
    });
  }
  if (closeness >= 75) {
    synergies.push({
      sphere: "closeness",
      title: "\u0421\u043F\u043E\u043D\u0442\u0430\u043D\u043D\u0430\u044F \u043D\u0435\u0436\u043D\u043E\u0441\u0442\u044C \u0438 \u0442\u0435\u043F\u043B\u043E\u0442\u0430",
      description: "\u0423\u043C\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u044F\u0432\u043B\u044F\u0442\u044C \u0437\u0430\u0431\u043E\u0442\u0443 \u0447\u0435\u0440\u0435\u0437 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0435 \u0434\u0435\u0442\u0430\u043B\u0438 \u0438 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0435 \u0437\u043D\u0430\u043A\u0438 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F."
    });
  }
  return {
    radar,
    archetype: {
      title: archetypeTitle,
      description: archetypeDescription,
      leadSpheres: leadKeys
    },
    blindSpots: {
      discrepancies,
      synergies
    }
  };
}

// src/server/modules/tests/tests.service.ts
var CATALOG_TEST_IDS = Object.keys(TESTS_REGISTRY);
var EXPECTED_QUESTIONS = Object.fromEntries(
  Object.entries(TESTS_REGISTRY).map(([id, def]) => [id, def.totalQuestions])
);
async function atomicSubmitTestAnswers(testId, coupleId, userLogin, answers) {
  const isProd8 = process.env.NODE_ENV === "production";
  if (isProd8 && (!isSqlConfigured() || !db)) {
    throw new DatabaseUnavailableError();
  }
  const testDef = TESTS_REGISTRY[testId];
  if (!testDef) {
    throw new Error(`Unknown testId: ${testId}`);
  }
  if (answers.length !== testDef.totalQuestions) {
    const missing = testDef.totalQuestions - answers.length;
    throw new Error(
      `ValidationFailed: Expected ${testDef.totalQuestions} answers for "${testDef.title}", got ${answers.length}. Missing ${missing} question(s).`
    );
  }
  if (isSqlConfigured() && db) {
    return await db.transaction(async (tx) => {
      const [u] = await tx.select().from(users).where(eq9(users.login, userLogin));
      const userId = u ? u.id : userLogin;
      let session = await tx.select().from(testSessions).where(
        and5(
          eq9(testSessions.coupleId, coupleId),
          eq9(testSessions.testId, testId),
          eq9(testSessions.status, "in_progress")
        )
      ).limit(1);
      if (!session.length) {
        const newSessionId = crypto8.randomUUID();
        const [created] = await tx.insert(testSessions).values({
          id: newSessionId,
          testId,
          coupleId,
          testClass: "couple",
          status: "in_progress"
        }).returning();
        session = [created];
      }
      const sessionId = session[0].id;
      const answerRecords = answers.map((a) => ({
        id: crypto8.randomUUID(),
        sessionId,
        userId,
        questionId: a.questionId,
        selectedValue: String(a.value),
        weight: "1.00",
        reactionTimeMs: null,
        toggleCount: 0,
        targetType: "self",
        rawPayload: null
      }));
      await tx.insert(testAnswers).values(answerRecords);
      await tx.delete(testDrafts).where(
        and5(eq9(testDrafts.userId, userId), eq9(testDrafts.testId, testId))
      );
      await _recalculateUserProfile(tx, coupleId, userId, testId);
      const triggerResult = await _triggerCoupleReportIfReady(tx, coupleId, userId);
      await tx.update(testSessions).set({ status: "completed", completedAt: /* @__PURE__ */ new Date() }).where(eq9(testSessions.id, sessionId));
      return {
        status: "completed",
        testId,
        userId,
        sessionId,
        answersCount: answers.length,
        harmonyState: triggerResult
      };
    });
  }
  return { status: "recorded_locally", testId, message: "Dev mode: no DB" };
}
async function submitTestAnswer(params) {
  const isProd8 = process.env.NODE_ENV === "production";
  if (isProd8 && (!isSqlConfigured() || !db)) {
    throw new DatabaseUnavailableError();
  }
  const testDef = TESTS_REGISTRY[params.testId];
  if (!testDef) {
    throw new Error(`Unknown testId: ${params.testId}`);
  }
  if (isSqlConfigured() && db) {
    return await db.transaction(async (tx) => {
      const [u] = await tx.select().from(users).where(eq9(users.login, params.userLogin));
      const userId = u ? u.id : params.userLogin;
      let sessionId = params.sessionId;
      if (!sessionId) {
        let session = await tx.select().from(testSessions).where(
          and5(
            eq9(testSessions.coupleId, params.coupleId),
            eq9(testSessions.testId, params.testId),
            eq9(testSessions.status, "in_progress")
          )
        ).limit(1);
        if (!session.length) {
          const newSessionId = crypto8.randomUUID();
          const [created] = await tx.insert(testSessions).values({
            id: newSessionId,
            testId: params.testId,
            coupleId: params.coupleId,
            testClass: "couple",
            status: "in_progress"
          }).returning();
          session = [created];
        }
        sessionId = session[0].id;
      }
      await tx.insert(testAnswers).values({
        id: crypto8.randomUUID(),
        sessionId,
        userId,
        questionId: params.questionId,
        selectedValue: String(params.selectedValue ?? ""),
        weight: "1.00",
        reactionTimeMs: params.reactionTimeMs ?? null,
        toggleCount: params.toggleCount ?? 0,
        targetType: params.targetType ?? "self",
        rawPayload: params.rawPayload ?? null
      }).onConflictDoUpdate({
        target: [testAnswers.sessionId, testAnswers.userId, testAnswers.questionId],
        set: {
          selectedValue: String(params.selectedValue ?? ""),
          reactionTimeMs: params.reactionTimeMs ?? null,
          toggleCount: params.toggleCount ?? 0,
          targetType: params.targetType ?? "self",
          rawPayload: params.rawPayload ?? null
        }
      });
      return {
        status: "answer_recorded",
        testId: params.testId,
        userId,
        sessionId,
        questionId: params.questionId
      };
    });
  }
  return { status: "recorded_locally", testId: params.testId, message: "Dev mode: no DB" };
}
async function saveTestDraft(userLogin, testId, currentQuestionIndex, answers) {
  if (!isSqlConfigured() || !db) {
    return { status: "saved_locally", message: "Dev mode: no DB" };
  }
  const [u] = await db.select().from(users).where(eq9(users.login, userLogin));
  const userId = u ? u.id : userLogin;
  await db.insert(testDrafts).values({
    userId,
    testId,
    currentQuestionIndex,
    answers
  }).onConflictDoUpdate({
    target: [testDrafts.userId, testDrafts.testId],
    set: {
      currentQuestionIndex,
      answers,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  return { status: "saved", testId, currentQuestionIndex };
}
async function getTestDraft(userLogin, testId) {
  if (!isSqlConfigured() || !db) {
    return null;
  }
  const [u] = await db.select().from(users).where(eq9(users.login, userLogin));
  const userId = u ? u.id : userLogin;
  const [draft] = await db.select().from(testDrafts).where(and5(eq9(testDrafts.userId, userId), eq9(testDrafts.testId, testId))).limit(1);
  return draft ?? null;
}
async function clearTestDraft(userLogin, testId) {
  if (!isSqlConfigured() || !db) {
    return { status: "cleared_locally", message: "Dev mode: no DB" };
  }
  const [u] = await db.select().from(users).where(eq9(users.login, userLogin));
  const userId = u ? u.id : userLogin;
  await db.delete(testDrafts).where(
    and5(eq9(testDrafts.userId, userId), eq9(testDrafts.testId, testId))
  );
  return { status: "cleared", testId };
}
async function getTestsStatusForUser(userLogin) {
  if (!isSqlConfigured() || !db) {
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: false,
      isCompletedByPartner: false
    }));
  }
  const [u] = await db.select().from(users).where(eq9(users.login, userLogin));
  if (!u) return [];
  const userId = u.id;
  const [couple] = await db.select().from(couples).where(or5(eq9(couples.user1Id, userId), eq9(couples.user2Id, userId))).limit(1);
  if (!couple) {
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: false,
      isCompletedByPartner: false
    }));
  }
  const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
  if (!partnerId) {
    return CATALOG_TEST_IDS.map((testId) => ({
      testId,
      isCompletedByMe: false,
      isCompletedByPartner: false
    }));
  }
  const myCompleted = await db.select({ testId: testSessions.testId }).from(testSessions).innerJoin(testAnswers, eq9(testAnswers.sessionId, testSessions.id)).where(and5(eq9(testAnswers.userId, userId), eq9(testSessions.status, "completed")));
  const partnerCompleted = await db.select({ testId: testSessions.testId }).from(testSessions).innerJoin(testAnswers, eq9(testAnswers.sessionId, testSessions.id)).where(and5(eq9(testAnswers.userId, partnerId), eq9(testSessions.status, "completed")));
  const mySet = new Set(myCompleted.map((r) => r.testId));
  const partnerSet = new Set(partnerCompleted.map((r) => r.testId));
  return CATALOG_TEST_IDS.map((testId) => ({
    testId,
    isCompletedByMe: mySet.has(testId),
    isCompletedByPartner: partnerSet.has(testId)
  }));
}
async function _recalculateUserProfile(tx, coupleId, userId, testId) {
  const answers = await tx.select().from(testAnswers).innerJoin(testSessions, eq9(testAnswers.sessionId, testSessions.id)).where(and5(eq9(testAnswers.userId, userId), eq9(testSessions.testId, testId), eq9(testSessions.status, "completed")));
  if (!answers.length) return;
  const scaleScores = {};
  const scaleCounts = {};
  for (const row of answers) {
    const ans = row.test_answers;
    const scale = ans.scaleId || "unknown";
    const val = Number(ans.selectedValue);
    scaleScores[scale] = (scaleScores[scale] || 0) + val;
    scaleCounts[scale] = (scaleCounts[scale] || 0) + 1;
  }
  const traitScores = {};
  for (const scale of Object.keys(scaleScores)) {
    traitScores[scale] = scaleCounts[scale] > 0 ? Math.round(scaleScores[scale] / scaleCounts[scale] * 100) : 50;
  }
  await tx.insert(userPsychProfiles).values({
    userId,
    coupleId,
    sessionId: answers[0]?.test_answers.sessionId || "",
    traitScores,
    eSafety: "50.00",
    aAutonomy: "50.00",
    cCloseness: "50.00",
    rRepair: "50.00",
    vFuture: "50.00",
    rawResponses: answers.map((r) => r.test_answers),
    updatedAt: /* @__PURE__ */ new Date()
  }).onConflictDoUpdate({
    target: [userPsychProfiles.userId],
    set: {
      traitScores,
      eSafety: "50.00",
      aAutonomy: "50.00",
      cCloseness: "50.00",
      rRepair: "50.00",
      vFuture: "50.00",
      rawResponses: answers.map((r) => r.test_answers),
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function _triggerCoupleReportIfReady(tx, coupleId, userId) {
  const tests = await tx.select({ testId: testSessions.testId, userId: testAnswers.userId }).from(testSessions).innerJoin(testAnswers, eq9(testAnswers.sessionId, testSessions.id)).where(and5(eq9(testSessions.coupleId, coupleId), eq9(testSessions.status, "completed")));
  const completedByUser = /* @__PURE__ */ new Map();
  for (const row of tests) {
    const { testId, userId: uId } = row;
    if (!completedByUser.has(uId)) completedByUser.set(uId, /* @__PURE__ */ new Set());
    completedByUser.get(uId).add(testId);
  }
  const allTestIds = CATALOG_TEST_IDS;
  const userIds = Array.from(completedByUser.keys());
  if (userIds.length < 2) {
    return { state: "PARTNER_PENDING" };
  }
  const [user1Tests, user2Tests] = [completedByUser.get(userIds[0]), completedByUser.get(userIds[1])];
  const user1Complete = allTestIds.every((t) => user1Tests?.has(t));
  const user2Complete = allTestIds.every((t) => user2Tests?.has(t));
  if (!user1Complete || !user2Complete) {
    return { state: "PARTNER_PENDING" };
  }
  const [profile1, profile2] = await Promise.all([
    tx.select().from(userPsychProfiles).where(eq9(userPsychProfiles.userId, userIds[0])).limit(1),
    tx.select().from(userPsychProfiles).where(eq9(userPsychProfiles.userId, userIds[1])).limit(1)
  ]);
  const v1 = profile1[0]?.traitScores;
  const v2 = profile2[0]?.traitScores;
  if (!v1 || !v2) {
    return { state: "BOTH_COMPLETED" };
  }
  const vec1 = {
    eSafety: v1.eSafety ?? 50,
    aAutonomy: v1.aAutonomy ?? 50,
    cCloseness: v1.cCloseness ?? 50,
    rRepair: v1.rRepair ?? 50,
    vFuture: v1.vFuture ?? 50,
    consistencyScore: v1.consistencyScore ?? 95
  };
  const vec2 = {
    eSafety: v2.eSafety ?? 50,
    aAutonomy: v2.aAutonomy ?? 50,
    cCloseness: v2.cCloseness ?? 50,
    rRepair: v2.rRepair ?? 50,
    vFuture: v2.vFuture ?? 50,
    consistencyScore: v2.consistencyScore ?? 95
  };
  const radarResult = calculateCoupleRadarMatrix(vec1, vec2);
  await tx.insert(coupleReports).values({
    coupleId,
    sessionId: "",
    radarMetrics: radarResult.radar,
    radarTrust: radarResult.radar.trust,
    radarCloseness: radarResult.radar.closeness,
    radarCommunication: radarResult.radar.communication,
    radarIntimacy: radarResult.radar.intimacy,
    radarValues: radarResult.radar.values,
    radarLifestyle: radarResult.radar.values,
    // используем values как lifestyle
    archetypeTitle: radarResult.archetype.title,
    archetypeDescription: radarResult.archetype.description,
    leadSpheres: radarResult.archetype.leadSpheres,
    synergyPoints: radarResult.blindSpots.synergies,
    growthZones: radarResult.blindSpots.discrepancies.map((d) => d.title),
    blindSpots: radarResult.blindSpots.discrepancies,
    calculatedAt: /* @__PURE__ */ new Date()
  }).onConflictDoUpdate({
    target: [coupleReports.coupleId],
    set: {
      radarMetrics: radarResult.radar,
      radarTrust: radarResult.radar.trust,
      radarCloseness: radarResult.radar.closeness,
      radarCommunication: radarResult.radar.communication,
      radarIntimacy: radarResult.radar.intimacy,
      radarValues: radarResult.radar.values,
      radarLifestyle: radarResult.radar.values,
      archetypeTitle: radarResult.archetype.title,
      archetypeDescription: radarResult.archetype.description,
      leadSpheres: radarResult.archetype.leadSpheres,
      synergyPoints: radarResult.blindSpots.synergies,
      growthZones: radarResult.blindSpots.discrepancies.map((d) => d.title),
      blindSpots: radarResult.blindSpots.discrepancies,
      calculatedAt: /* @__PURE__ */ new Date()
    }
  });
  return { state: "REPORT_GENERATED", radar: radarResult };
}

// src/server/modules/tests/tests.routes.ts
var testsRouter = Router8();
testsRouter.get("/status", requireAuth, async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const statuses = await getTestsStatusForUser(userLogin);
    return res.status(200).json({
      success: true,
      statuses
    });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u0442\u0435\u0441\u0442\u043E\u0432", err);
    next(err);
  }
});
testsRouter.get("/overview", requireAuth, async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const statuses = await getTestsStatusForUser(userLogin);
    const testsWithSphere = statuses.map((s) => ({
      ...s,
      sphere: getSphereByTestId(s.testId) || "unknown"
    }));
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
        myDraft: null
      }))
    };
    return res.status(200).json({
      success: true,
      ...overview
    });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043E\u0431\u0437\u043E\u0440\u0430 \u0442\u0435\u0441\u0442\u043E\u0432", err);
    next(err);
  }
});
testsRouter.get("/catalog", requireAuth, async (_req, res) => {
  return res.status(200).json({
    success: true,
    testIds: CATALOG_TEST_IDS,
    expectedQuestions: EXPECTED_QUESTIONS
  });
});
testsRouter.post(
  "/submit",
  requireAuth,
  requirePairOwnership,
  validateBody(
    z6.object({
      testId: z6.string().min(1),
      answers: z6.array(
        z6.object({
          questionId: z6.string(),
          value: z6.union([z6.string(), z6.number()])
        })
      ).min(1)
    })
  ),
  async (req, res, next) => {
    try {
      const userLogin = req.user?.login;
      const coupleId = req.couple?.id;
      const { testId, answers } = req.body;
      if (!userLogin || !coupleId) {
        return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0438 \u043F\u0430\u0440\u0430" });
      }
      const result = await atomicSubmitTestAnswers(testId, coupleId, userLogin, answers);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0442\u0435\u0441\u0442\u0430", err);
      if (err instanceof Error && err.message.startsWith("ValidationFailed")) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  }
);
testsRouter.post(
  "/answer",
  requireAuth,
  requirePairOwnership,
  validateBody(
    z6.object({
      testId: z6.string().min(1),
      questionId: z6.string().min(1),
      selectedValue: z6.union([z6.string(), z6.number()]).optional(),
      reactionTimeMs: z6.number().nullable().optional(),
      toggleCount: z6.number().nullable().optional(),
      targetType: z6.string().nullable().optional(),
      rawPayload: z6.any().optional()
    })
  ),
  async (req, res, next) => {
    try {
      const userLogin = req.user?.login;
      const coupleId = req.couple?.id;
      const { testId, questionId, selectedValue, reactionTimeMs, toggleCount, targetType, rawPayload } = req.body;
      if (!userLogin || !coupleId) {
        return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0438 \u043F\u0430\u0440\u0430" });
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
        rawPayload
      });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u043E\u0442\u0432\u0435\u0442\u0430", err);
      next(err);
    }
  }
);
testsRouter.post(
  "/draft",
  requireAuth,
  validateBody(
    z6.object({
      testId: z6.string().min(1),
      currentQuestionIndex: z6.number().int().min(0),
      answers: z6.array(
        z6.object({
          questionId: z6.string(),
          value: z6.union([z6.string(), z6.number()])
        })
      ).min(1)
    })
  ),
  async (req, res, next) => {
    try {
      const userLogin = req.user?.login;
      const { testId, currentQuestionIndex, answers } = req.body;
      if (!userLogin) {
        return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
      }
      const result = await saveTestDraft(userLogin, testId, currentQuestionIndex, answers);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430", err);
      next(err);
    }
  }
);
testsRouter.get("/draft/:testId", requireAuth, async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    const { testId } = req.params;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const draft = await getTestDraft(userLogin, testId);
    return res.status(200).json({ success: true, draft });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430", err);
    next(err);
  }
});
testsRouter.delete("/draft/:testId", requireAuth, async (req, res, next) => {
  try {
    const userLogin = req.user?.login;
    const { testId } = req.params;
    if (!userLogin) {
      return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
    }
    const result = await clearTestDraft(userLogin, testId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430", err);
    next(err);
  }
});

// src/server/app.ts
var app = express();
async function initDatabase() {
  const isProd8 = process.env.NODE_ENV === "production";
  if (!isSqlConfigured()) {
    if (isProd8) {
      logger.warn("\u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: DATABASE_URL \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0430 \u0432 production (Vercel). \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u0443\u044E DATABASE_URL \u0432 Project Settings -> Environment Variables \u043D\u0430 Vercel.");
      return;
    }
    logger.info("Cloud SQL / PostgreSQL \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D \u2014 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 /data/db_store.json \u0434\u043B\u044F dev-\u0440\u0435\u0436\u0438\u043C\u0430");
    return;
  }
  try {
    const pool = createPool();
    if (!pool) {
      logger.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0443\u043B \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0439 \u043A PostgreSQL.");
      return;
    }
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        login text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        name text NOT NULL,
        gender text,
        avatar_emoji text NOT NULL DEFAULT '\u2728',
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
    logger.info("\u0422\u0430\u0431\u043B\u0438\u0446\u044B \u0438 \u0438\u043D\u0434\u0435\u043A\u0441\u044B \u0431\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u044B/\u0441\u043E\u0437\u0434\u0430\u043D\u044B \u0432 PostgreSQL");
  } catch (err) {
    const errorObj = err instanceof Error ? { message: err.message, stack: err.stack } : err;
    if (isProd8) {
      logger.error("\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 \u0442\u0430\u0431\u043B\u0438\u0446 PostgreSQL \u0432 production:", { error: errorObj });
    } else {
      logger.warn("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435/\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0442\u0430\u0431\u043B\u0438\u0446 PostgreSQL, \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u043C\u0441\u044F \u043D\u0430 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C:", { error: errorObj });
    }
  }
}
var dbInitPromise = null;
function ensureDatabaseInitialized() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      dbInitPromise = null;
      logger.error("Database initialization error:", err);
    });
  }
  return dbInitPromise;
}
app.use(async (req, res, next) => {
  const isHealthCheck = req.path === "/health" || req.path === "/api/health";
  if (!isHealthCheck && (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.startsWith("/pair"))) {
    try {
      await ensureDatabaseInitialized();
    } catch (err) {
      logger.error("Database initialization check failed during request:", err);
      return res.status(503).json({
        error: "\u0411\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 DATABASE_URL \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 Vercel."
      });
    }
  }
  next();
});
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://*"],
        connectSrc: ["'self'", "https://*", "wss://*"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
      if (origin.endsWith(".vercel.app") || origin.includes("ais-") || origin.includes("google.com")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
var apiRouter = express.Router();
apiRouter.get("/health", async (req, res) => {
  const memory = process.memoryUsage();
  let dbStatus = "not_configured";
  let dbLatencyMs = null;
  let dbErrorDetail = null;
  if (isSqlConfigured() && db) {
    const start = Date.now();
    try {
      await db.execute(sql4`SELECT 1`);
      dbLatencyMs = Date.now() - start;
      dbStatus = "connected";
    } catch (err) {
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
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: dbErrorDetail
    },
    system: {
      memoryRssMb: Math.round(memory.rss / 1024 / 1024),
      memoryHeapUsedMb: Math.round(memory.heapUsed / 1024 / 1024)
    }
  });
});
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
      } catch (err) {
        logger.warn("DB clear tables warning:", { error: String(err) });
      }
    }
    writeEmergencyFile({ users: {}, pairRequests: [], coupleData: {}, chatMessages: [], rateLimits: {}, photos: [] });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("Failed to clear data:", err);
    return res.status(500).json({ error: "Failed to clear data" });
  }
});
apiRouter.post("/log-error", (req, res) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      import("fs").then((fs2) => {
        fs2.appendFileSync("client-errors.log", JSON.stringify(req.body) + "\n");
      }).catch(() => {
      });
    } else {
      logger.warn("Client error reported:", { clientError: req.body });
    }
  } catch (err) {
    logger.error("Failed to process client-error:", err);
  }
  return res.json({ ok: true });
});
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
app.use("/api", apiRouter);
app.use("/", apiRouter);
app.use(errorHandler);
var app_default = app;
export {
  callGroqChat,
  app_default as default,
  ensureDatabaseInitialized,
  initDatabase,
  logger
};
//# sourceMappingURL=index.js.map
