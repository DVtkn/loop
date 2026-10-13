import { describe, it, expect, vi, beforeEach } from 'vitest';

// Изолируем чистые функции от хранилища и логгера:
// requirePairOwnership тянет storageService (Neon/Drizzle), errorHandler — winston.
vi.mock('../../src/server/services/storageService.ts', () => ({
  findUserByLogin: vi.fn(),
}));

vi.mock('../../src/server/db/client.ts', () => ({
  db: undefined,
  isSqlConfigured: () => false,
  getConnectionString: () => null,
  createPool: () => null,
  getDb: () => undefined,
}));

vi.mock('../../src/server/shared/utils/logger.ts', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    security: vi.fn(),
  },
}));

import {
  getPairKey,
  isUserInCouple,
} from '../../src/server/shared/middleware/requirePairOwnership.ts';
import { errorHandler } from '../../src/server/shared/middleware/errorHandler.ts';
import { applySpeciesBonus, calcDuoSynergy } from '../../src/server/modules/pet/pet.service.ts';
import type { Request, Response, NextFunction } from 'express';

describe('getPairKey — канонический ключ пары', () => {
  it('сортирует логины одинаково в любом порядке', () => {
    expect(getPairKey('bob', 'anna')).toBe('anna_bob');
    expect(getPairKey('anna', 'bob')).toBe('anna_bob');
  });

  it('нормализует регистр, @ и пробелы', () => {
    expect(getPairKey('@Anna', ' BOB ')).toBe('anna_bob');
  });

  it('без партнёра возвращает одиночный ключ', () => {
    expect(getPairKey('Dmitry', null)).toBe('dmitry');
    expect(getPairKey('@Dmitry', undefined)).toBe('dmitry');
  });
});

describe('isUserInCouple — свой или чужой', () => {
  it('пускает по точному совпадению и нормализации', () => {
    expect(isUserInCouple('anna', 'anna')).toBe(true);
    expect(isUserInCouple('anna', '@Anna')).toBe(true);
  });

  it('пускает в ИИ-пару ai_<login>', () => {
    expect(isUserInCouple('ai_anna', 'anna')).toBe(true);
  });

  it('пускает обоих партнёров в любом порядке ключа', () => {
    expect(isUserInCouple('anna_bob', 'anna')).toBe(true);
    expect(isUserInCouple('anna_bob', 'bob')).toBe(true);
    expect(isUserInCouple('bob_anna', 'anna')).toBe(true);
  });

  it('не пускает постороннего', () => {
    expect(isUserInCouple('anna_bob', 'eve')).toBe(false);
  });

  it('не путает подстроку с целым логином (ловушки IDOR)', () => {
    expect(isUserInCouple('annax_bob', 'anna')).toBe(false);
    expect(isUserInCouple('anna_bobx', 'bob')).toBe(false);
    expect(isUserInCouple('xanna_bob', 'anna')).toBe(false);
  });

  it('пустые входы — отказ', () => {
    expect(isUserInCouple('', 'anna')).toBe(false);
    expect(isUserInCouple('anna_bob', '')).toBe(false);
    expect(isUserInCouple('', '')).toBe(false);
  });
});

describe('errorHandler — код ошибки по статусу', () => {
  const makeRes = () => {
    const res = {
      statusCode: 0,
      body: null as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };
    return res;
  };

  const req = { path: '/api/test', method: 'GET' } as unknown as Request;
  const next = (() => {}) as unknown as NextFunction;

  const run = (err: unknown) => {
    const res = makeRes();
    errorHandler(err, req, res as unknown as Response, next);
    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('400 → BAD_REQUEST', () => {
    const res = run({ status: 400, message: 'Плохо' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ code: 'BAD_REQUEST', error: 'Плохо' });
  });

  it('401 → UNAUTHORIZED, 403 → FORBIDDEN, 404 → NOT_FOUND', () => {
    expect(run({ status: 401, message: 'x' }).body).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(run({ status: 403, message: 'x' }).body).toMatchObject({ code: 'FORBIDDEN' });
    expect(run({ status: 404, message: 'x' }).body).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('409 → CONFLICT, 422 → UNPROCESSABLE_ENTITY', () => {
    expect(run({ status: 409, message: 'x' }).body).toMatchObject({ code: 'CONFLICT' });
    expect(run({ status: 422, message: 'x' }).body).toMatchObject({ code: 'UNPROCESSABLE_ENTITY' });
  });

  it('сбой базы → 503 + DB_UNAVAILABLE', () => {
    const res = run({ code: 'DB_UNAVAILABLE', message: 'База легла' });
    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ code: 'DB_UNAVAILABLE' });
  });
  it('явный code сервиса не затирается', () => {
    const res = run({ status: 400, message: 'Вы уже состоите в паре', code: 'ALREADY_PAIRED' });
    expect(res.body).toMatchObject({ code: 'ALREADY_PAIRED' });
  });

  it('учитывает поле statusCode', () => {
    const res = run({ statusCode: 404, message: 'Нет' });
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('500 без кода → INTERNAL_ERROR', () => {
    const res = run({ status: 500, message: 'Упало' });
    expect(res.body).toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('пустая ошибка → 500 + дефолтное сообщение', () => {
    const res = run({});
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});

describe('applySpeciesBonus — бонус вида', () => {
  it('пёс: +15% к положительному приросту энергии', () => {
    expect(applySpeciesBonus('dog', { energy: 35 })).toMatchObject({ energy: 40 });
    expect(applySpeciesBonus('dog', { hunger: 25, joy: 5 })).toMatchObject({ hunger: 25, joy: 5 });
  });

  it('кошка: +15% к положительному приросту радости', () => {
    expect(applySpeciesBonus('cat', { joy: 20 })).toMatchObject({ joy: 23 });
    expect(applySpeciesBonus('cat', { hunger: 25, energy: 35 })).toMatchObject({ hunger: 25, energy: 35 });
  });

  it('траты не усиливаются (игра −10 энергии у пса)', () => {
    expect(applySpeciesBonus('dog', { joy: 20, energy: -10 })).toMatchObject({ joy: 20, energy: -10 });
  });

  it('пустой прирост → нули', () => {
    expect(applySpeciesBonus('cat', {})).toEqual({ hunger: 0, joy: 0, energy: 0, cleanliness: 0 });
  });
});

describe('calcDuoSynergy — синергия дуо', () => {
  it('никого сегодня: 50, один: 75, оба: 100', () => {
    expect(calcDuoSynergy([])).toBe(50);
    expect(calcDuoSynergy(['dmitry'])).toBe(75);
    expect(calcDuoSynergy(['dmitry', 'anna'])).toBe(100);
  });

  it('дубли и регистр схлопываются', () => {
    expect(calcDuoSynergy(['Anna', 'anna', 'ANNA'])).toBe(75);
    expect(calcDuoSynergy(['dmitry', 'DMITRY', 'anna'])).toBe(100);
  });
});
