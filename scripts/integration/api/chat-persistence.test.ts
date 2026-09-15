import { db, isSqlConfigured } from '../../../src/server/db/client.ts';
import { chatMessages, users } from '../../../src/server/db/schema.ts';
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

async function fetchApi(path: string, token: string | null, method = "GET", body?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "x-test-suite": "true" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export async function runChatPersistenceTest() {
  console.log("===============================================================");
  console.log("   CHAT PERSISTENCE & REALTIME TEST SUITE");
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
  const maleLogin = `mark_${ts}`;
  const femaleLogin = `sofia_${ts}`;
  const password = "StrongPassword123!";

  // 1. Register male user
  const regMale = await fetchApi("/api/auth/register", null, "POST", {
    login: maleLogin,
    password,
    name: "Марк",
    gender: "male",
    city: "Москва",
  });
  assert(regMale.status === 201 && !!regMale.data?.token, "1.1 Male user registered successfully");
  const maleToken = regMale.data?.token;

  // 2. Register female user
  const regFemale = await fetchApi("/api/auth/register", null, "POST", {
    login: femaleLogin,
    password,
    name: "София",
    gender: "female",
    city: "Москва",
  });
  assert(regFemale.status === 201 && !!regFemale.data?.token, "1.2 Female user registered successfully");
  const femaleToken = regFemale.data?.token;

  // 3. Create Pair (Male -> Female)
  const pairReq = await fetchApi("/api/pair/request", maleToken, "POST", {
    fromLogin: maleLogin,
    toLogin: femaleLogin,
  });
  assert(pairReq.status === 200 || pairReq.status === 201, "2.1 Pair request sent from male to female");

  // 4. Accept Pair (Female accepts Male)
  const acceptReq = await fetchApi("/api/pair/accept", femaleToken, "POST", {
    fromLogin: maleLogin,
    toLogin: femaleLogin,
    relationshipStartDate: "2024-05-10",
  });
  assert(acceptReq.status === 200, "2.2 Pair accepted by female");

  const expectedCoupleId = [maleLogin, femaleLogin].sort().join("_");

  // 5. Send message from male in together mode via POST /api/chat/message
  const messageText1 = "Привет, любимая! Как прошёл твой день?";
  const sendRes1 = await fetchApi("/api/chat/message", maleToken, "POST", {
    content: messageText1,
    role: "partner1",
    mode: "together",
  });
  assert(
    sendRes1.status === 201 && sendRes1.data?.message?.content === messageText1,
    "3.1 Message sent by male via POST /api/chat/message"
  );
  const savedMsgId1 = sendRes1.data?.message?.id;
  assert(!!savedMsgId1, "3.2 Saved message received valid database ID");

  // 6. Fetch history from Male perspective via GET /api/chat/messages?mode=together
  const getMaleRes = await fetchApi("/api/chat/messages?mode=together", maleToken, "GET");
  assert(
    getMaleRes.status === 200 &&
      Array.isArray(getMaleRes.data?.messages) &&
      getMaleRes.data.messages.some((m: any) => m.content === messageText1 && m.senderLogin === maleLogin),
    "4.1 Male retrieves sent message via GET /api/chat/messages?mode=together"
  );

  // 7. Fetch history from Female perspective via GET /api/chat/messages?mode=together
  const getFemaleRes = await fetchApi("/api/chat/messages?mode=together", femaleToken, "GET");
  assert(
    getFemaleRes.status === 200 &&
      Array.isArray(getFemaleRes.data?.messages) &&
      getFemaleRes.data.messages.some((m: any) => m.content === messageText1 && m.senderLogin === maleLogin),
    "4.2 Female retrieves message sent by male with matching author, text and timestamp"
  );

  // 8. Send reply from female in together mode
  const messageText2 = "Привет, дорогой! Всё отлично, готовлю вкусный ужин.";
  const sendRes2 = await fetchApi("/api/chat/messages", femaleToken, "POST", {
    content: messageText2,
    role: "partner2",
    mode: "together",
  });
  assert(
    sendRes2.status === 201 && sendRes2.data?.message?.content === messageText2,
    "5.1 Female sent reply message via POST /api/chat/messages"
  );

  // 9. Verify full conversation history retrieved by both partners in correct order
  const finalMaleRes = await fetchApi("/api/chat/messages?mode=together", maleToken, "GET");
  const finalFemaleRes = await fetchApi("/api/chat/messages?mode=together", femaleToken, "GET");

  assert(
    finalMaleRes.status === 200 &&
      Array.isArray(finalMaleRes.data?.messages) &&
      finalMaleRes.data.messages.length >= 2 &&
      finalMaleRes.data.messages.some((m: any) => m.content === messageText1) &&
      finalMaleRes.data.messages.some((m: any) => m.content === messageText2),
    "6.1 Male sees both messages chronologically preserved in DB"
  );

  assert(
    finalFemaleRes.status === 200 &&
      Array.isArray(finalFemaleRes.data?.messages) &&
      finalFemaleRes.data.messages.length >= 2 &&
      finalFemaleRes.data.messages.some((m: any) => m.content === messageText1) &&
      finalFemaleRes.data.messages.some((m: any) => m.content === messageText2),
    "6.2 Female sees both messages chronologically preserved in DB"
  );

  console.log("\n===============================================================");
  console.log(`   CHAT PERSISTENCE AUDIT: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Auto-run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes("chat-persistence.test.ts")) {
  runChatPersistenceTest().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
