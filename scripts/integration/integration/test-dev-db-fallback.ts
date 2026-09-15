import fs from "fs";
import path from "path";
import express from "express";

// 1. Configure environment to DEVELOPMENT with UNCONFIGURED database
process.env.NODE_ENV = "development";
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
import { errorHandler } from '../../../src/server/shared/middleware/errorHandler.ts';
import { isSqlConfigured } from '../../../src/server/db/client.ts';

const testApp = express();
testApp.use(express.json());
testApp.use("/api/auth", authRouter);
testApp.use("/api/pair", pairingRouter);
testApp.use(errorHandler);

const DB_STORE_PATH = path.join(process.cwd(), "data", "db_store.json");

async function runDevFallbackTests() {
  console.log("==================================================");
  console.log("TEST SUITE: DEVELOPMENT FILE FALLBACK MODE");
  console.log("Environment: NODE_ENV=development");
  console.log(`isSqlConfigured(): ${isSqlConfigured()}`);
  console.log("==================================================\n");

  const server = testApp.listen(3100);
  const BASE_URL = "http://127.0.0.1:3100";

  try {
    const testLogin = `dev_${Date.now().toString(36)}`;

    // Test 1: Register request in dev with unconfigured DB
    console.log(`[TEST 1] POST /api/auth/register (login: ${testLogin})`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: testLogin, password: "password123", name: "Dev Fallback User" })
    });
    const regBody = await regRes.json();
    console.log(`[API RESPONSE] Status: ${regRes.status}`);

    if (regRes.status !== 201) {
      console.log(`[API RESPONSE] Body:`, JSON.stringify(regBody));
      throw new Error(`Expected HTTP 201 but got ${regRes.status}`);
    }
    console.log("✅ TEST 1 PASSED: Registration returned 201 successfully in Dev Mode with no SQL DB.");

    // Test 2: Check that db_store.json WAS modified in development
    console.log("\n[TEST 2] Verifying that data/db_store.json WAS modified/written to in development");
    const currentStoreContent = fs.existsSync(DB_STORE_PATH) ? fs.readFileSync(DB_STORE_PATH, "utf-8") : null;
    if (!currentStoreContent || !currentStoreContent.includes(testLogin)) {
      throw new Error("CRITICAL FAILURE: testLogin was NOT found in data/db_store.json! File fallback failed in development!");
    }
    console.log("✅ TEST 2 PASSED: data/db_store.json WAS written to. File fallback works in development mode.");

    console.log("\n==================================================");
    console.log("ALL DEV FALLBACK TESTS PASSED SUCCESSFULLY");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ TEST FAILURE:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runDevFallbackTests();
