import { eq, or, and } from "drizzle-orm";
import { db, isSqlConfigured } from "../../db/client.ts";
import { users, pairRequests } from "../../db/schema.ts";
import { logger } from "../../shared/utils/logger.ts";
import { readEmergencyFile, writeEmergencyFile, findUserByLogin, findUserByQuery } from "../../services/storageService.ts";
import { DbUser, toSafeUser } from "../../core/types.ts";
import { createPairRequest, acceptPair, disconnectPair } from "../../services/pairService.ts";
import { DatabaseUnavailableError } from "../../shared/errors/index.ts";

export { createPairRequest, acceptPair, disconnectPair };

const isProd = () => process.env.NODE_ENV === "production";

export async function requestPairConnection(fromLogin: string, toLogin: string) {
  if (fromLogin === toLogin) {
    throw { status: 400, message: "Нельзя связать пару с самим собой" };
  }

  const fromUser = await findUserByLogin(fromLogin);
  const toUser = await findUserByQuery(toLogin);

  if (!fromUser) throw { status: 404, message: "Отправитель не найден" };
  if (!toUser) throw { status: 404, message: "Партнёр с таким логином или именем не найден" };
  if (fromUser.partnerLogin) throw { status: 400, message: "Вы уже состоите в паре", code: "ALREADY_PAIRED" };
  if (toUser.partnerLogin) throw { status: 400, message: "Пользователь уже состоит в паре", code: "TARGET_ALREADY_PAIRED" };

  if (fromUser.gender && toUser.gender && fromUser.gender === toUser.gender) {
    throw { status: 400, message: "Регистрация однополых пар временно не поддерживается системой. Loop спроектирован для гетеросексуальных пар." };
  }

  const reqObj = await createPairRequest(fromUser, toUser);
  return reqObj;
}

export async function rejectPairRequest(fromLogin: string, toLogin: string) {
  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      await db.delete(pairRequests).where(
        and(eq(pairRequests.fromLogin, fromLogin), eq(pairRequests.toLogin, toLogin))
      );
      return;
    } catch (err: unknown) {
      logger.error("Сбой удаления запроса пары из SQL в production (fail-fast)", err);
      throw new DatabaseUnavailableError();
    }
  }

  // Dev mode
  if (isSqlConfigured() && db) {
    try {
      await db.delete(pairRequests).where(
        and(eq(pairRequests.fromLogin, fromLogin), eq(pairRequests.toLogin, toLogin))
      );
    } catch (err: unknown) {
      logger.warn("Сбой удаления запроса пары из SQL", undefined, err);
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

export async function getPairStatus(login: string) {
  const user = await findUserByLogin(login);
  if (!user) throw { status: 404, message: "Пользователь не найден" };

  let partner: DbUser | undefined;
  if (user.partnerLogin) {
    partner = await findUserByLogin(user.partnerLogin);
  }

  let incoming: any[] = [];
  let outgoing: any[] = [];

  if (isProd()) {
    if (!isSqlConfigured() || !db) {
      throw new DatabaseUnavailableError();
    }
    try {
      incoming = await db
        .select()
        .from(pairRequests)
        .where(and(eq(pairRequests.toLogin, login), eq(pairRequests.status, "PENDING")));
      outgoing = await db
        .select()
        .from(pairRequests)
        .where(and(eq(pairRequests.fromLogin, login), eq(pairRequests.status, "PENDING")));
      return {
        paired: !!user.partnerLogin,
        user: toSafeUser(user),
        partner: partner ? toSafeUser(partner) : null,
        incomingRequests: incoming,
        outgoingRequests: outgoing,
      };
    } catch (err: unknown) {
      logger.error("Сбой выборки pair_requests из SQL в production (fail-fast)", err);
      throw new DatabaseUnavailableError();
    }
  }

  // Dev mode
  if (isSqlConfigured() && db) {
    try {
      incoming = await db
        .select()
        .from(pairRequests)
        .where(and(eq(pairRequests.toLogin, login), eq(pairRequests.status, "PENDING")));
      outgoing = await db
        .select()
        .from(pairRequests)
        .where(and(eq(pairRequests.fromLogin, login), eq(pairRequests.status, "PENDING")));
    } catch (err: unknown) {
      logger.warn("Сбой выборки pair_requests из SQL, чтение из файла", undefined, err);
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
    outgoingRequests: outgoing,
  };
}
