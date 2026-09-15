import { eq, or, and } from 'drizzle-orm';
import crypto from 'crypto';
import { db, isSqlConfigured } from '../db/client.ts';
import { users, pairRequests } from '../db/schema.ts';
import { logger } from '../core/logger.ts';
import { readEmergencyFile, writeEmergencyFile, findUserByLogin, getCoupleData, saveCoupleData } from './storageService.ts';
import { DbUser, DbPairRequest } from '../core/types.ts';
import { DatabaseUnavailableError } from '../shared/errors/index.ts';

const isProd = () => process.env.NODE_ENV === 'production';

export async function acceptPair(cleanMe: string, cleanPartner: string) {
  const now = new Date().toISOString();

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ partnerLogin: cleanPartner, pairedAt: now })
          .where(eq(users.login, cleanMe));

        await tx
          .update(users)
          .set({ partnerLogin: cleanMe, pairedAt: now })
          .where(eq(users.login, cleanPartner));

        await tx.delete(pairRequests).where(
          or(
            and(eq(pairRequests.fromLogin, cleanPartner), eq(pairRequests.toLogin, cleanMe)),
            and(eq(pairRequests.fromLogin, cleanMe), eq(pairRequests.toLogin, cleanPartner))
          )
        );
      });
      logger.info('Транзакция связывания пары успешно завершена (SQL)', {
        partner1: cleanMe,
        partner2: cleanPartner,
      });
    } catch (err: unknown) {
      logger.error('CRITICAL: Transaction acceptPair failed in production (fail-fast).', err, {
        partner1: cleanMe,
        partner2: cleanPartner,
      });
      throw new DatabaseUnavailableError();
    }

    const updatedMe = await findUserByLogin(cleanMe);
    const updatedPartner = await findUserByLogin(cleanPartner);

    if (updatedMe && updatedPartner) {
      const key = [cleanMe, cleanPartner].sort().join('_');
      const existingData = await getCoupleData(key);
      if (!existingData || !existingData.coupleProfile) {
        const initData = {
          ...(existingData || {}),
          coupleProfile: {
            id: 'c-' + Date.now(),
            status: 'ACTIVE',
            linkCode: `LOOP-${Math.floor(1000 + Math.random() * 9000)}`,
            startDate: now.split('T')[0],
            city: updatedMe.city || updatedPartner.city || 'Москва',
            partner1: {
              id: 'partner1',
              name: updatedMe.name || cleanMe,
              login: cleanMe,
              avatar: updatedMe.avatarEmoji || 'user',
              email: '',
              gender: updatedMe.gender,
              loveLanguage: updatedMe.loveLanguage || 'Пройдите тест',
              attachmentStyle: updatedMe.attachmentStyle || 'Пройдите тест',
              currentMood: updatedMe.currentMood || { emoji: 'calm', label: 'Спокойно', updatedAt: now }
            },
            partner2: {
              id: 'partner2',
              name: updatedPartner.name || cleanPartner,
              login: cleanPartner,
              avatar: updatedPartner.avatarEmoji || 'user',
              email: '',
              gender: updatedPartner.gender,
              loveLanguage: updatedPartner.loveLanguage || 'Пройдите тест',
              attachmentStyle: updatedPartner.attachmentStyle || 'Пройдите тест',
              currentMood: updatedPartner.currentMood || { emoji: 'calm', label: 'Спокойно', updatedAt: now }
            },
            level: 1,
            levelName: 'Первый шаг',
            testsCompletedCount: 0,
          }
        };
        await saveCoupleData(key, initData);
      }
    }

    return { updatedMe, updatedPartner };
  }

  // Dev / Test mode with fallback
  let sqlSuccess = false;
  if (isSqlConfigured() && db) {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ partnerLogin: cleanPartner, pairedAt: now })
          .where(eq(users.login, cleanMe));

        await tx
          .update(users)
          .set({ partnerLogin: cleanMe, pairedAt: now })
          .where(eq(users.login, cleanPartner));

        await tx.delete(pairRequests).where(
          or(
            and(eq(pairRequests.fromLogin, cleanPartner), eq(pairRequests.toLogin, cleanMe)),
            and(eq(pairRequests.fromLogin, cleanMe), eq(pairRequests.toLogin, cleanPartner))
          )
        );
      });
      sqlSuccess = true;
      logger.info('Транзакция связывания пары успешно завершена', {
        partner1: cleanMe,
        partner2: cleanPartner,
      });
    } catch (err: unknown) {
      logger.error('Транзакция связывания пары завершилась ошибкой (откат)', err, {
        partner1: cleanMe,
        partner2: cleanPartner,
      });
    }
  }

  logger.warn('Использован аварийный механизм связывания пары в файле db_store.json', {
    partner1: cleanMe,
    partner2: cleanPartner,
  });
  const store = readEmergencyFile();
  store.users[cleanMe] = {
    ...(store.users[cleanMe] || {}),
    login: cleanMe,
    partnerLogin: cleanPartner,
    pairedAt: now,
  } as DbUser;
  store.users[cleanPartner] = {
    ...(store.users[cleanPartner] || {}),
    login: cleanPartner,
    partnerLogin: cleanMe,
    pairedAt: now,
  } as DbUser;
  if (store.pairRequests) {
    store.pairRequests = store.pairRequests.filter(
      (r) =>
        !(
          (r.fromLogin === cleanPartner && r.toLogin === cleanMe) ||
          (r.fromLogin === cleanMe && r.toLogin === cleanPartner)
        )
    );
  }
  writeEmergencyFile(store);

  const updatedMe = await findUserByLogin(cleanMe);
  const updatedPartner = await findUserByLogin(cleanPartner);

  if (updatedMe && updatedPartner) {
    const key = [cleanMe, cleanPartner].sort().join('_');
    const existingData = await getCoupleData(key);
    if (!existingData || !existingData.coupleProfile) {
      const initData = {
        ...(existingData || {}),
        coupleProfile: {
          id: 'c-' + Date.now(),
          status: 'ACTIVE',
          linkCode: `LOOP-${Math.floor(1000 + Math.random() * 9000)}`,
          startDate: now.split('T')[0],
          city: updatedMe.city || updatedPartner.city || 'Москва',
          partner1: {
            id: 'partner1',
            name: updatedMe.name || cleanMe,
            login: cleanMe,
            avatar: updatedMe.avatarEmoji || 'user',
            email: '',
            gender: updatedMe.gender,
            loveLanguage: updatedMe.loveLanguage || 'Пройдите тест',
            attachmentStyle: updatedMe.attachmentStyle || 'Пройдите тест',
            currentMood: updatedMe.currentMood || { emoji: 'calm', label: 'Спокойно', updatedAt: now }
          },
          partner2: {
            id: 'partner2',
            name: updatedPartner.name || cleanPartner,
            login: cleanPartner,
            avatar: updatedPartner.avatarEmoji || 'user',
            email: '',
            gender: updatedPartner.gender,
            loveLanguage: updatedPartner.loveLanguage || 'Пройдите тест',
            attachmentStyle: updatedPartner.attachmentStyle || 'Пройдите тест',
            currentMood: updatedPartner.currentMood || { emoji: 'calm', label: 'Спокойно', updatedAt: now }
          },
          level: 1,
          levelName: 'Первый шаг',
          testsCompletedCount: 0,
        }
      };
      await saveCoupleData(key, initData);
    }
  }

  return { updatedMe, updatedPartner };
}

export async function disconnectPair(cleanLogin: string) {
  const user = await findUserByLogin(cleanLogin);
  if (!user) {
    return { error: 'Пользователь не найден', status: 404 };
  }
  const partnerLogin = user.partnerLogin ? String(user.partnerLogin).toLowerCase() : null;

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ partnerLogin: null, pairedAt: null })
          .where(eq(users.login, cleanLogin));

        if (partnerLogin) {
          await tx
            .update(users)
            .set({ partnerLogin: null, pairedAt: null })
            .where(eq(users.login, partnerLogin));

          await tx.delete(pairRequests).where(
            or(
              and(eq(pairRequests.fromLogin, cleanLogin), eq(pairRequests.toLogin, partnerLogin)),
              and(eq(pairRequests.fromLogin, partnerLogin), eq(pairRequests.toLogin, cleanLogin))
            )
          );
        }
      });
      logger.info('Транзакция разрыва пары успешно завершена (SQL)', {
        user: cleanLogin,
        partner: partnerLogin,
      });
    } catch (err: unknown) {
      logger.error('CRITICAL: Transaction disconnectPair failed in production (fail-fast).', err, {
        user: cleanLogin,
        partner: partnerLogin,
      });
      throw new DatabaseUnavailableError();
    }

    const updatedUser = await findUserByLogin(cleanLogin);
    return { updatedUser, status: 200 };
  }

  // Dev / Test mode with fallback
  if (isSqlConfigured() && db) {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ partnerLogin: null, pairedAt: null })
          .where(eq(users.login, cleanLogin));

        if (partnerLogin) {
          await tx
            .update(users)
            .set({ partnerLogin: null, pairedAt: null })
            .where(eq(users.login, partnerLogin));

          await tx.delete(pairRequests).where(
            or(
              and(eq(pairRequests.fromLogin, cleanLogin), eq(pairRequests.toLogin, partnerLogin)),
              and(eq(pairRequests.fromLogin, partnerLogin), eq(pairRequests.toLogin, cleanLogin))
            )
          );
        }
      });
      logger.info('Транзакция разрыва пары успешно завершена', {
        user: cleanLogin,
        partner: partnerLogin,
      });
    } catch (err: unknown) {
      logger.error('Транзакция разрыва пары завершилась ошибкой (откат)', err, {
        user: cleanLogin,
        partner: partnerLogin,
      });
    }
  }

  logger.warn('Использован аварийный механизм разрыва пары в файле db_store.json', {
    user: cleanLogin,
    partner: partnerLogin,
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
      (r) =>
        !(
          (r.fromLogin === cleanLogin && r.toLogin === partnerLogin) ||
          (r.fromLogin === partnerLogin && r.toLogin === cleanLogin)
        )
    );
  }
  writeEmergencyFile(store);

  const updatedUser = await findUserByLogin(cleanLogin);
  return { updatedUser, status: 200 };
}

export async function createPairRequest(fromUser: DbUser, toUser: DbUser) {
  const cleanFrom = fromUser.login.toLowerCase();
  const cleanTo = toUser.login.toLowerCase();
  const now = new Date().toISOString();
  const reqId = crypto.randomUUID();

  const reqObj: DbPairRequest = {
    id: reqId,
    fromLogin: cleanFrom,
    fromName: fromUser.name || cleanFrom,
    fromAvatar: fromUser.avatarEmoji || 'sparkles',
    toLogin: cleanTo,
    status: 'PENDING',
    createdAt: now,
  };

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.transaction(async (tx) => {
        await tx.delete(pairRequests).where(
          or(
            and(eq(pairRequests.fromLogin, cleanFrom), eq(pairRequests.toLogin, cleanTo)),
            and(eq(pairRequests.fromLogin, cleanTo), eq(pairRequests.toLogin, cleanFrom))
          )
        );
        await tx.insert(pairRequests).values(reqObj);
      });
      logger.info('Запрос на пару создан (SQL транзакция)', { from: cleanFrom, to: cleanTo });
      return reqObj;
    } catch (err: unknown) {
      logger.error('CRITICAL: Transaction createPairRequest failed in production (fail-fast).', err, { from: cleanFrom, to: cleanTo });
      throw new DatabaseUnavailableError();
    }
  }

  // Dev / Test mode with fallback
  if (isSqlConfigured() && db) {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(pairRequests).where(
          or(
            and(eq(pairRequests.fromLogin, cleanFrom), eq(pairRequests.toLogin, cleanTo)),
            and(eq(pairRequests.fromLogin, cleanTo), eq(pairRequests.toLogin, cleanFrom))
          )
        );
        await tx.insert(pairRequests).values(reqObj);
      });
      logger.info('Запрос на пару создан (SQL транзакция)', { from: cleanFrom, to: cleanTo });
    } catch (err: unknown) {
      logger.error('Сбой создания запроса на пару в SQL', err, { from: cleanFrom, to: cleanTo });
    }
  }

  logger.warn('Запрос на пару сохранён в аварийное хранилище JSON', { from: cleanFrom, to: cleanTo });
  const store = readEmergencyFile();
  if (!store.pairRequests) store.pairRequests = [];
  store.pairRequests = store.pairRequests.filter(
    (r) =>
      !(
        (r.fromLogin === cleanFrom && r.toLogin === cleanTo) ||
        (r.fromLogin === cleanTo && r.toLogin === cleanFrom)
      )
  );
  store.pairRequests.push(reqObj);
  writeEmergencyFile(store);

  return reqObj;
}
