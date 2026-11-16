import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockDb = {
  select: vi.fn(),
  selectDistinct: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};

let sqlConfigured = false;

vi.mock('../../src/server/db/client.ts', () => ({
  get db() {
    return sqlConfigured ? mockDb : undefined;
  },
  isSqlConfigured: () => sqlConfigured,
  getConnectionString: () => (sqlConfigured ? 'postgresql://mock-host/mock' : null),
  createPool: () => null,
  getDb: () => (sqlConfigured ? mockDb : undefined),
}));

import { getGeminiModelName, DEFAULT_GEMINI_MODEL, callAIChatDetailed } from '../../src/server/services/aiService.ts';
import {
  lastActiveCache,
  pruneLastActiveCache,
  touchUserLastActive,
  MAX_LAST_ACTIVE_CACHE_SIZE,
} from '../../src/server/modules/realtime/realtime.service.ts';
import * as realtimeRoutes from '../../src/server/modules/realtime/realtime.routes.ts';
import * as realtimeService from '../../src/server/modules/realtime/realtime.service.ts';
import { awardCoupleXP } from '../../src/server/modules/pet/pet.service.ts';
import { _triggerCoupleReportIfReady } from '../../src/server/modules/tests/tests.service.ts';
import { getDetailedCoupleAnalytics } from '../../src/server/modules/analytics/analytics.service.ts';
import { couples, testSessions, testAnswers } from '../../src/server/db/schema.ts';

describe('Boost Audit Fixes Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    sqlConfigured = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Gemini Model Configuration & Fallback in aiService', () => {
    it('defaults to gemini-2.5-flash when GEMINI_MODEL is unset', () => {
      delete process.env.GEMINI_MODEL;
      expect(getGeminiModelName()).toBe('gemini-2.5-flash');
      expect(DEFAULT_GEMINI_MODEL).toBe('gemini-2.5-flash');
    });

    it('respects process.env.GEMINI_MODEL when configured', () => {
      process.env.GEMINI_MODEL = 'gemini-2.0-flash-exp';
      expect(getGeminiModelName()).toBe('gemini-2.0-flash-exp');
    });

    it('returns graceful fallback when neither GEMINI_API_KEY nor GROQ_API_KEY is configured', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GROQ_API_KEY;

      const result = await callAIChatDetailed([{ role: 'user', content: 'Привет' }]);
      expect(result.provider).toBe('fallback');
      expect(result.reply).toContain('Я рядом');
    });
  });

  describe('2. Realtime Service Cache Pruning & Dead Code Elimination', () => {
    beforeEach(() => {
      lastActiveCache.clear();
    });

    it('does not export dead in-memory pushSubscriptions array from realtime service', () => {
      expect((realtimeService as any).pushSubscriptions).toBeUndefined();
    });

    it('does not import or expose pushSubscriptions in realtime routes', () => {
      expect((realtimeRoutes as any).pushSubscriptions).toBeUndefined();
    });

    it('throttles lastActiveAt updates within 25 seconds', async () => {
      const now = Date.now();
      lastActiveCache.set('testuser', now);

      await touchUserLastActive('testuser');
      expect(lastActiveCache.get('testuser')).toBe(now);
    });

    it('prunes entries older than maxAgeMs', () => {
      const now = Date.now();
      const oldTime = now - (6 * 60 * 1000); // 6 mins ago

      lastActiveCache.set('old_user_1', oldTime);
      lastActiveCache.set('old_user_2', oldTime);
      lastActiveCache.set('active_user', now);

      pruneLastActiveCache(now, 5 * 60 * 1000);

      expect(lastActiveCache.has('old_user_1')).toBe(false);
      expect(lastActiveCache.has('old_user_2')).toBe(false);
      expect(lastActiveCache.has('active_user')).toBe(true);
    });

    it('enforces maximum size boundary on lastActiveCache when cap is reached', () => {
      const now = Date.now();
      for (let i = 0; i < MAX_LAST_ACTIVE_CACHE_SIZE + 50; i++) {
        lastActiveCache.set(`user_${i}`, now);
      }

      expect(lastActiveCache.size).toBeGreaterThanOrEqual(MAX_LAST_ACTIVE_CACHE_SIZE);
      pruneLastActiveCache(now);
      expect(lastActiveCache.size).toBeLessThan(MAX_LAST_ACTIVE_CACHE_SIZE);
    });
  });

  describe('3. Tests Service _triggerCoupleReportIfReady uses selectDistinct', () => {
    it('queries distinct completed sessions/users without loading all answer rows', async () => {
      const mockSelectDistinct = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { testId: 'test_1', userId: 'user_a' },
              { testId: 'test_1', userId: 'user_b' },
            ]),
          }),
        }),
      });

      const mockTx = {
        selectDistinct: mockSelectDistinct,
      };

      const result = await _triggerCoupleReportIfReady(mockTx as any, 'couple_123', 'user_a');
      expect(mockSelectDistinct).toHaveBeenCalledTimes(1);
      expect(result.state).toBe('PARTNER_PENDING');
    });
  });

  describe('4. Pet Service Atomic SQL Increment for XP', () => {
    it('executes atomic update without check-then-write select when SQL is configured', async () => {
      sqlConfigured = true;

      const mockWhere = vi.fn().mockResolvedValue([{ id: 'c1' }]);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      await awardCoupleXP('couple_123', 50, 'pet_action');

      // Verify that NO select query was issued (no race condition)
      expect(mockDb.select).not.toHaveBeenCalled();

      // Verify that update was called with couples table
      expect(mockDb.update).toHaveBeenCalledWith(couples);
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockWhere).toHaveBeenCalledTimes(1);
    });

    it('returns gracefully when SQL is not configured', async () => {
      sqlConfigured = false;
      await expect(awardCoupleXP('couple_123', 50, 'pet_action')).resolves.not.toThrow();
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('5. Analytics Service Completed Tests Scoping', () => {
    it('returns empty results safely when DB is not configured without crashing', async () => {
      sqlConfigured = false;
      const analytics = await getDetailedCoupleAnalytics('couple_123', 'alice');
      expect(analytics).toBeDefined();
      expect(analytics.completedTestsCount).toBe(0);
      expect(analytics.totalTestsCount).toBeGreaterThan(0);
      expect(analytics.isCoupleReportReady).toBe(false);
    });

    it('scopes completedTestsCount query to the specific coupleId and status completed', async () => {
      sqlConfigured = true;

      const mockGroupBy = vi.fn().mockResolvedValue([{ testId: 'test_1' }, { testId: 'test_2' }]);
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });

      // First call is couples, second is userPsychProfiles, third is coupleReports, fourth is users, fifth is testSessions
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // couples
          return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'c1', user1Id: 'u1', user2Id: 'u2' }]) }) }) };
        }
        if (callCount === 2) {
          // userPsychProfiles
          return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) };
        }
        if (callCount === 3) {
          // coupleReports
          return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) };
        }
        if (callCount === 4) {
          // users
          return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'u1', login: 'alice' }]) }) }) };
        }
        if (callCount === 5) {
          // testSessions with innerJoin and where
          return { from: mockFrom };
        }
        // subsequent users query for partner
        return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'u1', login: 'alice' }, { id: 'u2', login: 'bob' }]) }) };
      });

      const analytics = await getDetailedCoupleAnalytics('c1', 'alice');

      expect(mockFrom).toHaveBeenCalledWith(testSessions);
      expect(mockInnerJoin).toHaveBeenCalledWith(testAnswers, expect.anything());
      expect(mockWhere).toHaveBeenCalledTimes(1);
      expect(analytics.completedTestsCount).toBe(2);
    });
  });
});
