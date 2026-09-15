import { db } from '../../../src/server/db/client.ts';
import { users } from '../../../src/server/db/schema.ts';

const BASE_URL = "http://localhost:3000";

async function fetchApi(path: string, token: string | null, method = "GET", body?: any) {
  const headers: any = { "Content-Type": "application/json" };
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
  const u1 = "u1_v_" + Date.now().toString(36);
  const u2 = "u2_v_" + Date.now().toString(36);

  const token1 = (await fetchApi("/api/auth/register", null, "POST", { login: u1, password: "pw", name: "User 1" })).data.token;
  const token2 = (await fetchApi("/api/auth/register", null, "POST", { login: u2, password: "pw", name: "User 2" })).data.token;

  await fetchApi("/api/pair/request", token1, "POST", { fromLogin: u1, toLogin: u2 });
  await fetchApi("/api/pair/accept", token2, "POST", { fromLogin: u1, toLogin: u2 });

  const coupleId = [u1, u2].sort().join('_');

  console.log("=== VULNERABILITY TEST (GREEN RUN) ===");
  console.log("Sending fake level 999 payload...");

  // Send forged payload
  const resSync = await fetchApi("/api/couple/sync", token1, "POST", {
    login1: u1,
    login2: u2,
    coupleId,
    payload: {
      testsCompletedCount: 999,
      level: 999,
      coupleProfile: {
        testsCompletedCount: 999,
        level: 999
      }
    }
  });

  // Verify
  const res = await fetchApi(`/api/couple/data/${coupleId}`, token2);
  const data = res.data?.data;
  console.log(`Server saved root level: ${data?.level}`);
  console.log(`Server saved profile level: ${data?.coupleProfile?.level}`);

  if (data?.level === 999 || data?.coupleProfile?.level === 999) {
    console.error("❌ VULNERABLE: Server accepted client-forged level 999!");
  } else {
    console.log("✅ SECURE: Server rejected forged level, correctly set to:", data?.level || 1);
  }
}

run();
