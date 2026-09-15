import { db } from '../../../src/server/db/client.ts';
import { users, pairRequests, chatMessages, coupleData } from '../../../src/server/db/schema.ts';
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

async function fetchApi(path: string, token: string | null, method = "GET", body?: any) {
  const headers: any = { "Content-Type": "application/json", "x-test-suite": "true" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function run() {
  console.log("==================================================");
  console.log("STARTING FULL E2E INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  const ts = Date.now().toString(36);
  const u1 = `u1_${ts}`;
  const u2 = `u2_${ts}`;
  const u3 = `u3_${ts}`;

  let token1: string | null = null;
  let token2: string | null = null;
  let token3: string | null = null;

  try {
    console.log("--- SCENARIO 1: SOLO USERS & BOUNDARIES ---");

    // 1.1 Registrations
    let res = await fetchApi("/api/auth/register", null, "POST", { login: u1, password: "password123", name: "User 1" });
    console.log(`[API] POST /api/auth/register (u1) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));
    token1 = res.data?.token;

    res = await fetchApi("/api/auth/register", null, "POST", { login: u2, password: "password123", name: "User 2" });
    token2 = res.data?.token;
    res = await fetchApi("/api/auth/register", null, "POST", { login: u3, password: "password123", name: "User 3" });
    token3 = res.data?.token;

    // 1.2 DB Check Solo
    let u1Db = await db.select().from(users).where(eq(users.login, u1));
    console.log(`[DB] SELECT * FROM users WHERE login = '${u1}' -> [{login: '${u1Db[0]?.login}', partnerLogin: ${u1Db[0]?.partnerLogin}}]`);

    // 1.3-1.5, 1.7-1.8: Solo actions without partner
    res = await fetchApi(`/api/pair/status/${u1}`, token1);
    console.log(`[API] GET /api/pair/status/${u1} (Solo profile) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // Wait, let's test fetching couple data when solo. Should fail 403 or 404.
    res = await fetchApi(`/api/couple/data/${u1}`, token1);
    console.log(`[API] GET /api/couple/data/${u1} (Solo request) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // 1.6 AI Chat Fallback check
    res = await fetchApi("/api/ai/chat", token1, "POST", { messages: [{role: "user", content: "Привет"}], userLogin: u1 });
    console.log(`[API] POST /api/ai/chat -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // Pair request (Self)
    res = await fetchApi("/api/pair/request", token1, "POST", { fromLogin: u1, toLogin: u1 });
    console.log(`[API] POST /api/pair/request (Self) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // Valid Pair Request
    res = await fetchApi("/api/pair/request", token1, "POST", { fromLogin: u1, toLogin: u2 });
    console.log(`[API] POST /api/pair/request (Valid u1->u2) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    console.log("\n--- SCENARIO 2: PAIRING PROCESS ---");
    // Accept
    res = await fetchApi("/api/pair/accept", token2, "POST", { fromLogin: u1, toLogin: u2 });
    console.log(`[API] POST /api/pair/accept (u2 accepts u1) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    u1Db = await db.select().from(users).where(eq(users.login, u1));
    let u2Db = await db.select().from(users).where(eq(users.login, u2));
    console.log(`[DB] SELECT * FROM users -> u1.partnerLogin: ${u1Db[0]?.partnerLogin}, u2.partnerLogin: ${u2Db[0]?.partnerLogin}`);

    console.log("\n--- SCENARIO 3: POST-PAIRING, SHARED DATA & XP ---");
    const coupleId = [u1, u2].sort().join('_');

    // Sync Couple Data: 3.3 Compatibility, 3.4 QotD, 3.5 XP
    const syncPayload = {
      testsCompletedCount: 1,
      level: 2,
      levelName: "Level 2",
      questionOfTheDay: {
        id: "q1",
        question: "How are you?",
        myAnswer: "Good",
        partnerAnswer: null
      }
    };

    res = await fetchApi("/api/couple/sync", token1, "POST", {
      login1: u1, login2: u2, coupleId, payload: syncPayload
    });
    console.log(`[API] POST /api/couple/sync (u1 sends test/XP data) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // u2 retrieves data
    res = await fetchApi(`/api/couple/data/${coupleId}`, token2);
    console.log(`[API] GET /api/couple/data (by u2) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // Send touch
    res = await fetchApi("/api/couple/touch", token1, "POST", {
      senderLogin: u1,
      senderName: "User 1",
      targetLogin: u2,
      actionType: "hug",
      title: "Обнял вас"
    });
    console.log(`[API] POST /api/couple/touch -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

    // IDOR
    res = await fetchApi(`/api/couple/data/${coupleId}`, token3);
    console.log(`[API] GET /api/couple/data (by u3 - IDOR) -> Status: ${res.status}, Body:`, JSON.stringify(res.data));

  } catch (err) {
    console.error("Test execution encountered an unexpected error:", err);
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("E2E INTEGRATION TEST SUITE COMPLETED");
  console.log("==================================================");
  process.exit(0);
}
run();
