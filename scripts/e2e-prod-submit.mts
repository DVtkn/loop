// E2E prod: submit all tests for two paired users, then verify server-side math via DB
import { initialTests as TESTS } from '../src/data/mockData.ts';

const BASE = 'https://loopza.vercel.app';
const creds = Object.fromEntries(
  (await import('node:fs')).readFileSync('/tmp/e2e-creds.env', 'utf8').trim().split('\n').map((l) => l.split('='))
);

function buildAnswers(test: any, pick: (i: number) => number) {
  return test.questions.map((q: any, i: number) => {
    if (q.type === 'trade_off') {
      const items = q.tradeOffItems || [];
      const rawPayload: Record<string, number> = {};
      let left = q.totalPoints ?? 10;
      items.forEach((it: any, j: number) => {
        const pts = j === items.length - 1 ? left : Math.max(0, pick(j + i));
        rawPayload[it.id] = Math.min(pts, left);
        left -= rawPayload[it.id];
      });
      if (left > 0) rawPayload[items[0].id] += left;
      return {
        questionId: q.id,
        value: '1',
        scaleId: null,
        reactionTimeMs: 1500 + i * 200,
        toggleCount: i % 2,
        targetType: 'self',
        rawPayload,
      };
    }
    const optIdx = pick(i) % q.options.length;
    const opt = q.options[optIdx];
    return {
      questionId: q.id,
      value: String(opt.value),
      scaleId: opt.scaleId ?? null,
      reactionTimeMs: 1200 + i * 300,
      toggleCount: optIdx,
      targetType: 'self',
      rawPayload: null,
    };
  });
}

async function submitAll(token: string, who: string, pick: (i: number) => number) {
  for (const test of TESTS as any[]) {
    const answers = buildAnswers(test, pick);
    const res = await fetch(`${BASE}/api/tests/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: test.id, answers }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(`${who} ${test.id}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 160)}`);
    if (!res.ok) throw new Error(`${who} ${test.id} failed`);
  }
}

await submitAll(creds.TOKEN_A, 'A', (i) => 0); // first option always
await submitAll(creds.TOKEN_B, 'B', (i) => (i * 3 + 1) % 7); // varied options

const ov = await fetch(`${BASE}/api/tests/overview`, {
  headers: { Authorization: `Bearer ${creds.TOKEN_A}` },
});
console.log('overview A:', JSON.stringify(await ov.json()).slice(0, 600));
