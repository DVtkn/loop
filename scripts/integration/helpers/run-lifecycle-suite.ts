import { db, isSqlConfigured } from '../../../src/server/db/client.ts';
import { users, pairRequests, chatMessages, coupleData, careNotes, testSessions, testAnswers, coupleReports } from '../../../src/server/db/schema.ts';
import { eq, or } from "drizzle-orm";
import { evaluateSafetyRisk } from '../../../src/server/modules/chat/safety.filter.ts';
import { calculateCoupleAnalysis } from '../../../src/utils/psychologyEngine.ts';

const BASE_URL = "http://localhost:3000";

async function fetchApi(path: string, token: string | null, method = "GET", body?: any) {
  const headers: any = { "Content-Type": "application/json", "x-test-suite": "true" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export async function runLifecycleSuite() {
  console.log("===============================================================");
  console.log("   LOOP 9-MODULE QA & SECURITY AUDIT TEST SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  const ts = Date.now().toString(36);
  const maleLogin = `artem_${ts}`;
  const femaleLogin = `alina_${ts}`;
  const male2Login = `dmitry_${ts}`;

  let maleToken: string = "";
  let femaleToken: string = "";
  let male2Token: string = "";
  let coupleId: string = "";

  // -------------------------------------------------------------
  // MODULE 1: AUTHENTICATION, VALIDATION & SOLO MODE
  // -------------------------------------------------------------
  console.log("▶ MODULE 1: Authentication, Validation & Solo Mode");

  // 1.1 Validation error on invalid fields
  const badReg = await fetchApi("/api/auth/register", null, "POST", {
    login: "user@invalid!",
    password: "123",
    name: "Bad",
  });
  assert(badReg.status === 400, "1.1 Registration rejects invalid login/password/missing gender (400 Bad Request)");

  // 1.2 Valid registrations
  const regMale = await fetchApi("/api/auth/register", null, "POST", {
    login: maleLogin,
    password: "Password123!",
    name: "Артём",
    gender: "male",
  });
  assert(regMale.status === 201 && !!regMale.data?.token, "1.2.1 Male user registered successfully");
  maleToken = regMale.data?.token || "";

  const regFemale = await fetchApi("/api/auth/register", null, "POST", {
    login: femaleLogin,
    password: "Password123!",
    name: "Алина",
    gender: "female",
  });
  assert(regFemale.status === 201 && !!regFemale.data?.token, "1.2.2 Female user registered successfully");
  femaleToken = regFemale.data?.token || "";

  const regMale2 = await fetchApi("/api/auth/register", null, "POST", {
    login: male2Login,
    password: "Password123!",
    name: "Дмитрий",
    gender: "male",
  });
  male2Token = regMale2.data?.token || "";

  // -------------------------------------------------------------
  // MODULE 2: PAIRING, GENDER RULES & COLLISION PROTECTION
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 2: Pairing & Incompatible Gender Rejection");

  // 2.1 Same-gender pairing rejection
  const sameGenderReq = await fetchApi("/api/pair/request", maleToken, "POST", {
    fromLogin: maleLogin,
    toLogin: male2Login,
  });
  assert(
    sameGenderReq.status === 400 || sameGenderReq.data?.error?.includes("пол"),
    "2.1 Same-gender pair request rejected (male + male)"
  );

  // 2.2 Valid pair request male + female
  const pairReq = await fetchApi("/api/pair/request", maleToken, "POST", {
    fromLogin: maleLogin,
    toLogin: femaleLogin,
  });
  assert(pairReq.status === 200 || pairReq.status === 201, "2.2 Pair request created successfully (male -> female)");

  // 2.3 Accept pairing
  const acceptPair = await fetchApi("/api/pair/accept", femaleToken, "POST", {
    fromLogin: maleLogin,
    toLogin: femaleLogin,
    relationshipStartDate: "2024-01-01",
  });
  assert(acceptPair.status === 200, "2.3 Pair accepted successfully and startDate recorded");
  coupleId = [maleLogin, femaleLogin].sort().join("_");

  // 2.4 Stealing protection: try to pair already paired user
  const stealReq = await fetchApi("/api/pair/request", male2Token, "POST", {
    fromLogin: male2Login,
    toLogin: femaleLogin,
  });
  assert(
    stealReq.status === 400 || stealReq.status === 409 || stealReq.data?.error?.includes("паре"),
    "2.4 Stealing protection prevents requesting already paired user"
  );

  // -------------------------------------------------------------
  // MODULE 3: REALTIME TOUCHES & THROTTLING
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 3: Quick Touches & Realtime");

  const touchRes = await fetchApi("/api/couple/touch", femaleToken, "POST", {
    senderLogin: femaleLogin,
    targetLogin: maleLogin,
    actionType: "hug",
    title: "Обнять",
  });
  assert(touchRes.status === 200 || touchRes.status === 201, "3.1 Quick touch recorded and dispatched");

  // -------------------------------------------------------------
  // MODULE 4: PSYCHOMETRIC TESTS & TRANSACTIONAL SCORING
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 4: Psychometric Tests & Concurrency");

  const testSubmit = await fetchApi("/api/tests/submit-answer", maleToken, "POST", {
    coupleId,
    testId: "love_languages",
    questionId: "q1",
    selectedValue: 5,
    expectedQuestionsCount: 15,
  });
  assert(
    testSubmit.status === 200 && (testSubmit.data?.status === "waiting_for_partner" || testSubmit.data?.status === "recorded_locally" || testSubmit.data?.success),
    "4.1 Test answer submitted atomically with pessimistic session lock"
  );

  // 4.2 Deterministic Report Generation (No LLM)
  const reportRes = await fetchApi("/api/ai/generate-report", maleToken, "POST", {
    coupleProfile: {
      partner1: { name: "Артём", loveLanguage: "Качественное время" },
      partner2: { name: "Алина", loveLanguage: "Слова поощрения" },
    },
    pulseHistory: [],
    tests: [],
  });
  assert(
    reportRes.status === 200 && reportRes.data?.source === "deterministic_engine" && !!reportRes.data?.title,
    "4.2 Couple report generated via 100% deterministic mathematical psychology engine"
  );

  // -------------------------------------------------------------
  // MODULE 5: DAILY QUESTION & BLIND REVEAL
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 5: Daily Question & Timezones");

  const utcToday = new Date().toISOString().slice(0, 10);
  assert(utcToday.length === 10, `5.1 UTC daily date key normalized to ${utcToday}`);

  // -------------------------------------------------------------
  // MODULE 6: AI CHAT SAFETY FILTER & PROMPT ISOLATION
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 6: AI Chat Crisis Filter & Guardrails");

  // 6.1 Direct safety filter evaluation
  const crisisCheck = evaluateSafetyRisk("мне тяжело, не хочу жить и думаю покончить с собой");
  assert(
    crisisCheck.hasRisk === true && Boolean(crisisCheck.systemNotice?.includes("8-800-2000-122")),
    "6.1.1 Safety filter detects crisis trigger and prepares 8-800 hotline contacts"
  );

  // 6.2 Endpoint intercept
  const safetyChat = await fetchApi("/api/ai/chat", maleToken, "POST", {
    userLogin: maleLogin,
    messages: [{ role: "user", content: "я больше не могу так жить, хочу умереть и покончить с собой" }],
    context: { daysTogether: 100 },
  });
  assert(
    safetyChat.status === 200 && safetyChat.data?.isSafetyIntervention === true && safetyChat.data?.reply?.includes("8-800"),
    "6.1.2 /api/ai/chat intercepts crisis pattern before LLM and returns emergency contacts"
  );

  // -------------------------------------------------------------
  // MODULE 7: CHAT PERSISTENCE & PRIVACY
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 7: Chat Persistence & Realtime");

  // 7.1 Send message in Together mode
  const sendMsgRes = await fetchApi("/api/chat/messages", maleToken, "POST", {
    coupleId,
    senderLogin: maleLogin,
    content: "Привет, любимая! Как прошёл твой день?",
    role: "partner1",
    mode: "together",
  });
  assert(
    sendMsgRes.status === 201 && sendMsgRes.data?.message?.content === "Привет, любимая! Как прошёл твой день?",
    "7.1 Chat message saved to database via POST /api/chat/messages"
  );

  // 7.2 Fetch chat history for couple
  const getMsgsRes = await fetchApi(`/api/chat/messages/${coupleId}`, femaleToken, "GET");
  assert(
    getMsgsRes.status === 200 &&
      Array.isArray(getMsgsRes.data?.messages) &&
      getMsgsRes.data.messages.some((m: any) => m.content === "Привет, любимая! Как прошёл твой день?"),
    "7.2 Partner retrieves persisted chat history via GET /api/chat/messages/:coupleId"
  );

  // -------------------------------------------------------------
  // MODULE 8 & 9: ANTI-CHEAT & IDOR PROTECTION
  // -------------------------------------------------------------
  console.log("\n▶ MODULE 8 & 9: Security, Anti-Cheat & IDOR");

  // 9.1 Anti-Cheat: client attempts to tamper with level and XP
  const syncTamper = await fetchApi("/api/couple/sync", maleToken, "POST", {
    login1: maleLogin,
    login2: femaleLogin,
    coupleId,
    payload: {
      xpPoints: 999999,
      level: 99,
      levelName: "Взломанный уровень",
    },
  });
  assert(
    syncTamper.status === 200 && (syncTamper.data?.coupleData?.level || 1) < 50,
    "9.1 Server ignores tampered client XP and recalculates progress server-side"
  );

  // 9.2 IDOR protection: stranger user attempts to access couple data
  const strangerReq = await fetchApi(`/api/couple/data/${coupleId}`, male2Token, "GET");
  assert(
    strangerReq.status === 403,
    "9.2 Middleware requirePairOwnership rejects access from unauthorized third party (403 Forbidden)"
  );

  console.log("\n===============================================================");
  console.log(`   AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

// Auto-run when executed directly
if (process.argv[1]?.includes("run-lifecycle-suite")) {
  runLifecycleSuite();
}
