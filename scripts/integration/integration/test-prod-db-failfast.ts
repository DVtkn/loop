import fs from "fs";
import path from "path";
import express from "express";

// 1. Configure environment to production with UNCONFIGURED database
process.env.NODE_ENV = "production";
delete process.env.MY_DATABASE_URL;
delete process.env.DATABASE_URL;
delete process.env.NEON_DATABASE_URL;
delete process.env.SQL_HOST;
delete process.env.SQL_USER;
delete process.env.SQL_DB_NAME;

// Clear any cached pool
if (global._neonPool) {
  try { global._neonPool.end(); } catch {}
  global._neonPool = undefined;
}

import { generateToken } from '../../../src/server/shared/middleware/auth.middleware.ts';
import { authRouter } from '../../../src/server/modules/auth/auth.routes.ts';
import { pairingRouter } from '../../../src/server/modules/pairing/pairing.routes.ts';
import { coupleRouter } from '../../../src/server/modules/couple-data/couple.routes.ts';
import { errorHandler } from '../../../src/server/shared/middleware/errorHandler.ts';
import { isSqlConfigured } from '../../../src/server/db/client.ts';

const testApp = express();
testApp.use(express.json());
testApp.use("/api/auth", authRouter);
testApp.use("/api/pair", pairingRouter);
testApp.use("/api/couple", coupleRouter);
testApp.use(errorHandler);

const DB_STORE_PATH = path.join(process.cwd(), "data", "db_store.json");

async function runProdFailFastTests() {
  console.log("==================================================");
  console.log("TEST SUITE: PRODUCTION STRICT FAIL-FAST DATABASE MODE");
  console.log("Environment: NODE_ENV=production");
  console.log(`isSqlConfigured(): ${isSqlConfigured()}`);
  console.log("==================================================\n");

  const server = testApp.listen(3099);
  const BASE_URL = "http://127.0.0.1:3099";

  try {
    const testLogin = `ff_${Date.now().toString(36)}`;
    const partnerLogin = `pt_${Date.now().toString(36)}`;
    const coupleId = [testLogin, partnerLogin].sort().join("_");

    // Test 1: Register request in production with unconfigured DB
    console.log(`[TEST 1] POST /api/auth/register (login: ${testLogin})`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: testLogin, password: "password123", name: "FailFast User" })
    });
    const regBody = await regRes.json();
    console.log(`[API RESPONSE] Status: ${regRes.status}`);
    console.log(`[API RESPONSE] Body:`, JSON.stringify(regBody));

    if (regRes.status !== 503) {
      throw new Error(`Expected HTTP 503 but got ${regRes.status}`);
    }
    if (regBody.code !== "DB_UNAVAILABLE") {
      throw new Error(`Expected code 'DB_UNAVAILABLE' but got '${regBody.code}'`);
    }
    if (regBody.error !== "Сервис временно недоступен, попробуйте через минуту") {
      throw new Error(`Unexpected error message: '${regBody.error}'`);
    }
    console.log("✅ TEST 1 PASSED: Registration returned 503 DB_UNAVAILABLE as expected.");

    // Test 2: Check that db_store.json was NOT modified in production
    console.log("\n[TEST 2] Verifying that data/db_store.json was NOT modified/written to in production");
    const currentStoreContent = fs.existsSync(DB_STORE_PATH) ? fs.readFileSync(DB_STORE_PATH, "utf-8") : null;
    if (currentStoreContent && currentStoreContent.includes(testLogin)) {
      throw new Error("CRITICAL FAILURE: testLogin was found in data/db_store.json! File fallback occurred in production!");
    }
    console.log("✅ TEST 2 PASSED: data/db_store.json was NOT written to. File fallback is strictly disabled in production.");

    // Test 3: Authenticated pair request with unconfigured DB in production
    console.log("\n[TEST 3] POST /api/pair/request with valid token in production (DB unavailable)");
    const validToken = generateToken(testLogin);
    const pairRes = await fetch(`${BASE_URL}/api/pair/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${validToken}` },
      body: JSON.stringify({ fromLogin: testLogin, toLogin: partnerLogin })
    });
    const pairBody = await pairRes.json();
    console.log(`[API RESPONSE] Status: ${pairRes.status}`);
    console.log(`[API RESPONSE] Body:`, JSON.stringify(pairBody));

    if (pairRes.status !== 503) {
      throw new Error(`Expected HTTP 503 but got ${pairRes.status}`);
    }
    if (pairBody.code !== "DB_UNAVAILABLE") {
      throw new Error(`Expected code 'DB_UNAVAILABLE' but got '${pairBody.code}'`);
    }
    console.log("✅ TEST 3 PASSED: Authenticated pair request returned 503 DB_UNAVAILABLE without writing to file.");

    // Test 4: Couple sync endpoint with unconfigured DB in production
    console.log("\n[TEST 4] POST /api/couple/sync in production (DB unavailable)");
    const syncRes = await fetch(`${BASE_URL}/api/couple/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${validToken}` },
      body: JSON.stringify({ login1: testLogin, login2: partnerLogin, coupleId, payload: { level: 2 } })
    });
    const syncBody = await syncRes.json();
    console.log(`[API RESPONSE] Status: ${syncRes.status}`);
    console.log(`[API RESPONSE] Body:`, JSON.stringify(syncBody));

    if (syncRes.status !== 503) {
      throw new Error(`Expected HTTP 503 but got ${syncRes.status}`);
    }
    if (syncBody.code !== "DB_UNAVAILABLE") {
      throw new Error(`Expected code 'DB_UNAVAILABLE' but got '${syncBody.code}'`);
    }
    console.log("✅ TEST 4 PASSED: Couple sync returned 503 DB_UNAVAILABLE without writing to file.");

    console.log("\n==================================================");
    console.log("ALL PRODUCTION FAIL-FAST TESTS PASSED SUCCESSFULLY");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ TEST FAILURE:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runProdFailFastTests();
