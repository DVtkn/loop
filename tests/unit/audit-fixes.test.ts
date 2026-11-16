import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStore: Record<string, any> = {
  users: {},
  pairRequests: [],
  coupleData: {},
  chatMessages: {},
  aiMessages: {},
  touches: {},
  couplePets: {},
  coupleEvents: [],
  testDrafts: [],
  testSessions: [],
  testAnswers: [],
  userPsychProfiles: [],
  coupleReports: [],
};

vi.mock('../../src/server/db/client.ts', () => ({
  db: undefined,
  isSqlConfigured: () => false,
  getConnectionString: () => null,
  createPool: () => null,
  getDb: () => undefined,
}));

vi.mock('../../src/server/services/storageService.ts', () => ({
  readEmergencyFile: vi.fn(() => JSON.parse(JSON.stringify(mockStore))),
  writeEmergencyFile: vi.fn((next: any) => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    Object.assign(mockStore, JSON.parse(JSON.stringify(next)));
  }),
  findUserByLogin: vi.fn(async (login: string) => {
    const clean = login.toLowerCase().trim().replace(/^@/, '');
    return mockStore.users[clean] || null;
  }),
}));

vi.mock('../../src/server/services/aiService.ts', () => ({
  callGroqChat: vi.fn(async () => null),
}));

import { chatMessageCreateSchema } from '../../src/server/shared/validators/chat.validator.ts';
import { getUserStorageKey } from '../../src/utils/safeStorage.ts';
import { normalizeDraftAnswersMap } from '../../src/server/modules/tests/tests.service.ts';
import { generateWeeklyInsight } from '../../src/server/services/insights.ts';
import { createPet, getPetState, performPetAction } from '../../src/server/modules/pet/pet.service.ts';

describe('Audit Remediations Verification', () => {
  beforeEach(() => {
    mockStore.users = {
      alice: { id: 'u1', login: 'alice', name: 'Алиса', partnerLogin: 'bob' },
      bob: { id: 'u2', login: 'bob', name: 'Боб', partnerLogin: 'alice' },
    };
    mockStore.couplePets = {};
    mockStore.coupleEvents = [];
  });

  it('rejects client-spoofed role: "ai" in couple chat validator', () => {
    const valid = chatMessageCreateSchema.safeParse({ content: 'Привет!', role: 'partner1' });
    expect(valid.success).toBe(true);

    const spoofed = chatMessageCreateSchema.safeParse({ content: 'Привет!', role: 'ai' });
    expect(spoofed.success).toBe(false);
  });

  it('isolates client localStorage keys cleanly per user login', () => {
    expect(getUserStorageKey('together_couple_xp', 'Alice')).toBe('together_couple_xp_alice');
    expect(getUserStorageKey('together_couple_xp', '@Bob')).toBe('together_couple_xp_bob');
    expect(getUserStorageKey('together_couple_xp', null)).toBe('together_couple_xp_guest');
    expect(getUserStorageKey('together_couple_xp', '')).toBe('together_couple_xp_guest');
  });

  it('normalizes both plain object maps and legacy answer arrays in test drafts', () => {
    expect(normalizeDraftAnswersMap({ q1: 'a', q2: 3 })).toEqual({ q1: 'a', q2: 3 });
    expect(
      normalizeDraftAnswersMap([
        { questionId: 'q1', value: 'yes' },
        { questionId: 'q2', value: 5 },
      ])
    ).toEqual({ q1: 'yes', q2: 5 });
    expect(normalizeDraftAnswersMap([])).toEqual({});
    expect(normalizeDraftAnswersMap(null)).toEqual({});
  });

  it('generates structured weekly insight even when SQL DB is unavailable in dev', async () => {
    const insight = await generateWeeklyInsight('alice_bob', { p1Name: 'Алиса', p2Name: 'Боб' });
    expect(insight).not.toBeNull();
    expect(insight?.content?.weekSummary).toBeTruthy();
    expect(insight?.content?.recommendation).toBeTruthy();
    expect(insight?.content?.conversationStarter).toBeTruthy();
  });

  it('supports dev JSON pet creation, retrieval, and care actions without SQL', async () => {
    const created = await createPet('alice', 'dog', 'Рекс');
    expect(created.success).toBe(true);
    expect(created.state?.name).toBe('Рекс');
    expect(created.state?.species).toBe('dog');
    expect(created.state?.pairKey).toBe('alice_bob');

    const loaded = await getPetState('bob');
    expect(loaded.name).toBe('Рекс');
    expect(loaded.pairKey).toBe('alice_bob');

    const actionRes = await performPetAction('alice', 'feed');
    expect(actionRes.success).toBe(true);
    expect(actionRes.state?.experience).toBeGreaterThan(0);
    expect(actionRes.expGained).toBeGreaterThan(0);
  });
});
