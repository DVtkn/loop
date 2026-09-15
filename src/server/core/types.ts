import { users, pairRequests, coupleData, chatMessages, relationshipMetrics, aiInsights } from '../db/schema.ts';

export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;

export type DbPairRequest = typeof pairRequests.$inferSelect;
export type DbPairRequestInsert = typeof pairRequests.$inferInsert;

export type DbCoupleData = typeof coupleData.$inferSelect;
export type DbCoupleDataInsert = typeof coupleData.$inferInsert;

export type DbChatMessage = typeof chatMessages.$inferSelect;
export type DbChatMessageInsert = typeof chatMessages.$inferInsert;

export type DbRelationshipMetric = typeof relationshipMetrics.$inferSelect;
export type DbRelationshipMetricInsert = typeof relationshipMetrics.$inferInsert;

export type DbAiInsight = typeof aiInsights.$inferSelect;
export type DbAiInsightInsert = typeof aiInsights.$inferInsert;
export type AiInsightContent = any;

export interface SafeUser {
  id: string;
  login: string;
  name: string;
  gender?: string | null;
  avatarEmoji: string;
  partnerLogin?: string | null;
  pairedAt?: string | null;
  startDate?: string | null;
  city?: string | null;
  loveLanguage?: string | null;
  attachmentStyle?: string | null;
  currentMood?: any;
  lastActiveAt?: string | null;
  createdAt: string;
}

export function toSafeUser(user: DbUser | any): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe as SafeUser;
}

export interface JsonStoreShape {
  users: Record<string, DbUser>;
  pairRequests: DbPairRequest[];
  coupleData: Record<string, any>;
  chatMessages: DbChatMessage[];
  rateLimits?: Record<string, { attempts: number; resetAt: number }>;
  photos?: any[];
}
