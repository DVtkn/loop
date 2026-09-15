import { numeric, pgTable, text, timestamp, boolean, jsonb, integer, real, unique, index, customType, foreignKey, varchar, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  login: text('login').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  gender: text('gender'), // 'male' | 'female'
  avatarEmoji: text('avatar_emoji').notNull().default('sparkles'),
  partnerLogin: text('partner_login'),
  pairedAt: text('paired_at'),
  startDate: text('start_date'),
  city: text('city'),
  loveLanguage: text('love_language'),
  attachmentStyle: text('attachment_style'),
  currentMood: jsonb('current_mood'), // { emoji, label, note, updatedAt }
  lastActiveAt: text('last_active_at'),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  partnerLoginIdx: index('users_partner_login_idx').on(t.partnerLogin),
  partnerLoginFk: foreignKey({
    columns: [t.partnerLogin],
    foreignColumns: [t.login],
    name: 'users_partner_login_fk'
  }).onDelete('set null'),
}));

export const pairRequests = pgTable('pair_requests', {
  id: text('id').primaryKey(),
  fromLogin: text('from_login').notNull().references(() => users.login, { onDelete: 'cascade' }),
  fromName: text('from_name').notNull(),
  fromAvatar: text('from_avatar').notNull(),
  toLogin: text('to_login').notNull().references(() => users.login, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: text('created_at').notNull(),
}, (t) => ({
  fromToIdx: index('pair_requests_from_to_idx').on(t.fromLogin, t.toLogin),
  toLoginIdx: index('pair_requests_to_login_idx').on(t.toLogin),
  statusIdx: index('pair_requests_status_idx').on(t.status),
}));

export const coupleData = pgTable('couple_data', {
  id: text('id').primaryKey(), // using the 'login1_login2' sorted key
  data: jsonb('data').notNull(),
  lastUpdatedAt: text('last_updated_at').notNull(),
});

export const couples = pgTable('couples', {
  id: text('id').primaryKey(),
  user1Id: text('user1_id').references(() => users.id, { onDelete: 'cascade' }),
  user2Id: text('user2_id').references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').default('active').notNull(),
  xpPoints: integer('xp_points').default(0).notNull(),
  currentLevel: integer('current_level').default(1).notNull(),
  streakDays: integer('streak_days').default(0).notNull(),
  startDate: text('start_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testSessions = pgTable('test_sessions', {
  id: text('id').primaryKey(),
  testId: text('test_id').notNull(),
  coupleId: text('couple_id').notNull(),
  testClass: text('test_class').default('couple').notNull(), // 'individual' | 'couple'
  status: text('status').default('in_progress').notNull(), // 'in_progress' | 'completed'
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleIdIdx: index('test_sessions_couple_id_idx').on(t.coupleId),
  testIdIdx: index('test_sessions_test_id_idx').on(t.testId),
  statusIdx: index('test_sessions_status_idx').on(t.status),
}));

export const testAnswers = pgTable('test_answers', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => testSessions.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  questionId: text('question_id').notNull(),
  scaleId: text('scale_id'),
  selectedValue: text('selected_value').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }).default('1.00').notNull(),
  reactionTimeMs: integer('reaction_time_ms'),
  toggleCount: integer('toggle_count').default(0).notNull(),
  targetType: varchar('target_type', { length: 24 }).default('self').notNull(), // 'self' | 'partner_observation'
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqUserQuestion: unique('uniq_user_session_question').on(t.sessionId, t.userId, t.questionId),
  sessionIdx: index('test_answers_session_idx').on(t.sessionId),
  userIdIdx: index('test_answers_user_idx').on(t.userId),
}));

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  senderLogin: text('sender_login').notNull(),
  role: text('role').notNull(), // 'partner1', 'partner2', 'ai'
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  coupleCreatedIdx: index('chat_messages_couple_created_idx').on(t.coupleId, t.createdAt),
  senderIdx: index('chat_messages_sender_login_idx').on(t.senderLogin),
}));

export const relationshipMetrics = pgTable('relationship_metrics', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  metricDate: text('metric_date').notNull(), // YYYY-MM-DD
  radarScores: jsonb('radar_scores').notNull(), // { trust, communication, passion, sharedValues, care, dailyLife }
  moodAverage: real('mood_average'),
  moodEntriesCount: integer('mood_entries_count').default(0),
  interactionCount: integer('interaction_count').default(0),
  quizCompleted: boolean('quiz_completed').default(false),
  streakDays: integer('streak_days').default(0),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  unq: unique().on(t.coupleId, t.metricDate)
}));

export const aiInsights = pgTable('ai_insights', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  type: text('type').notNull(), // 'weekly' | 'risk_alert'
  content: jsonb('content').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  coupleCreatedIdx: index('ai_insights_couple_created_idx').on(t.coupleId, t.createdAt),
}));

export const photos = pgTable('photos', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  uploaderLogin: text('uploader_login').notNull().references(() => users.login, { onDelete: 'cascade' }),
  imageBytes: bytea('image_bytes').notNull(),
  mimeType: text('mime_type').notNull(),
  caption: text('caption'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleIdIdx: index('photos_couple_id_idx').on(t.coupleId),
  createdAtIdx: index('photos_created_at_idx').on(t.createdAt),
}));

export const dateEvents = pgTable('date_events', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  eventDate: text('event_date').notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'completed' | 'cancelled'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleIdIdx: index('date_events_couple_id_idx').on(t.coupleId),
}));

export const careNotes = pgTable('care_notes', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  authorLogin: text('author_login').notNull(),
  targetLogin: text('target_login').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleIdIdx: index('care_notes_couple_id_idx').on(t.coupleId),
}));

export const timeCapsules = pgTable('time_capsules', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  authorLogin: text('author_login').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  openAt: text('open_at').notNull(),
  isOpened: boolean('is_opened').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleIdIdx: index('time_capsules_couple_id_idx').on(t.coupleId),
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userLogin: text('user_login').notNull(),
  coupleId: text('couple_id'),
  subscription: jsonb('subscription').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userLoginIdx: index('push_subscriptions_user_idx').on(t.userLogin),
}));

export const coupleEvents = pgTable('couple_events', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  targetLogin: text('target_login').notNull(),
  senderLogin: text('sender_login').notNull(),
  eventType: text('event_type').notNull(), // 'touch' | 'chat_message' | 'couple_updated'
  payload: jsonb('payload').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  coupleTargetIdx: index('couple_events_target_idx').on(t.targetLogin, t.createdAt),
  coupleIdIdx: index('couple_events_couple_idx').on(t.coupleId, t.createdAt),
}));



export const userPsychProfiles = pgTable('user_psych_profiles', {
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  coupleId: text('couple_id').notNull(),
  sessionId: text('session_id').notNull(),
  traitScores: jsonb('trait_scores'), // S1..S24 normalized 0..100
  dominantVectors: jsonb('dominant_vectors'),
  eSafety: numeric('e_safety', { precision: 5, scale: 2 }).notNull().default('50.00'),
  aAutonomy: numeric('a_autonomy', { precision: 5, scale: 2 }).notNull().default('50.00'),
  cCloseness: numeric('c_closeness', { precision: 5, scale: 2 }).notNull().default('50.00'),
  rRepair: numeric('r_repair', { precision: 5, scale: 2 }).notNull().default('50.00'),
  vFuture: numeric('v_future', { precision: 5, scale: 2 }).notNull().default('50.00'),
  consistencyScore: numeric('consistency_score', { precision: 5, scale: 2 }),
  rawResponses: jsonb('raw_responses'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const coupleReports = pgTable('couple_reports', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  coupleId: text('couple_id').notNull().unique(),
  radarMetrics: jsonb('radar_metrics'), // 6 integral spheres: trust, closeness, communication, values, intimacy, lifestyle
  radarTrust: numeric('radar_trust', { precision: 5, scale: 2 }).notNull().default('50.00'),
  radarCloseness: numeric('radar_closeness', { precision: 5, scale: 2 }).notNull().default('50.00'),
  radarCommunication: numeric('radar_communication', { precision: 5, scale: 2 }).notNull().default('50.00'),
  radarIntimacy: numeric('radar_intimacy', { precision: 5, scale: 2 }).notNull().default('50.00'),
  radarValues: numeric('radar_values', { precision: 5, scale: 2 }).notNull().default('50.00'),
  radarLifestyle: numeric('radar_lifestyle', { precision: 5, scale: 2 }).notNull().default('50.00'),
  personalityTypes: jsonb('personality_types'),
  archetypeTitle: text('archetype_title').notNull(),
  archetypeDescription: text('archetype_description').notNull(),
  leadSpheres: jsonb('lead_spheres').notNull(),
  synergyPoints: jsonb('synergy_points'),
  growthZones: jsonb('growth_zones'),
  blindSpots: jsonb('blind_spots'),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});


export const testDrafts = pgTable('test_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  testId: varchar('test_id', { length: 64 }).notNull(),
  currentQuestionIndex: integer('current_question_index').default(0).notNull(),
  answers: jsonb('answers').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userTestDraftIdx: uniqueIndex('user_test_draft_idx').on(table.userId, table.testId)
}));
