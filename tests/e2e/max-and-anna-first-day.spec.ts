import { test, expect } from '@playwright/test';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const TS = Date.now();
const MAX_LOGIN = `max_${TS}`;
const ANNA_LOGIN = `anna_${TS}`;
const PWD = 'TestPass123!';

test.setTimeout(240000);
test('Max and Anna first day - full journey', async ({ browser }) => {
  const ctxA = await browser.newContext({ extraHTTPHeaders: { 'x-test-suite': 'true' } });
  const ctxB = await browser.newContext({ extraHTTPHeaders: { 'x-test-suite': 'true' } });
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  async function register(page:any, login:string, name:string, gender:'male'|'female'){
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auth-tab-register', { timeout: 15000 });
    await page.click('#auth-tab-register');
    await page.waitForSelector('#auth-login-input');
    await page.fill('#auth-login-input', login);
    await page.fill('#auth-name-input', name);
    if (gender==='female') await page.click('#auth-gender-female-btn');
    await page.fill('#auth-password-input', PWD);
    const [resp] = await Promise.all([
      page.waitForResponse((r: any) => r.url().includes('/api/auth/register') || r.url().includes('/api/auth/login'), { timeout: 10000 }).catch(()=>null),
      page.click('#auth-submit-btn')
    ]);
    // wait for onboarding - use text which is more robust than id
    await page.waitForSelector('text=Пространство для двоих', { timeout: 15000 });
  }

  // Max registers
  await register(pageA, MAX_LOGIN, 'Макс', 'male');
  // Anna registers
  await register(pageB, ANNA_LOGIN, 'Анна', 'female');

  // Max creates pair via onboarding - 3 steps
  await pageA.click('#onboarding-create-pair-btn');
  await pageA.waitForSelector('#onboarding-p1-name-input', { timeout: 10000 });
  await pageA.fill('#onboarding-p1-name-input', 'Макс');
  await pageA.click('#onboarding-step1-next-btn');
  await pageA.waitForSelector('#onboarding-p2-name-input');
  await pageA.fill('#onboarding-p2-name-input', 'Анна');
  await pageA.click('#onboarding-step2-next-btn');
  await pageA.waitForSelector('#onboarding-finish-create-btn');
  await pageA.click('text=Мы только начали встречаться');
  // generate real code via API
  const genPromise = pageA.waitForResponse((r: any) => r.url().includes('/api/couple/generate-code'), { timeout: 10000 }).catch(()=>null);
  await pageA.click('#onboarding-finish-create-btn');
  await genPromise;
  await pageA.waitForSelector('#onboarding-enter-app-btn', { timeout: 10000 });
  // extract code text
  let inviteCode = '';
  try { inviteCode = (await pageA.locator('text=/LOOP-/').first().textContent())?.trim() || ''; } catch {}
  // fallback regex
  if (!inviteCode || !inviteCode.includes('LOOP-')) {
    const txt = await pageA.locator('body').textContent();
    const m = txt?.match(/LOOP-\d{6}/);
    if (m) inviteCode = m[0];
  }
  console.log('inviteCode extracted', inviteCode);
  expect(inviteCode).toMatch(/LOOP-\d{6}/);
  await pageA.click('#onboarding-enter-app-btn');
  await pageA.waitForSelector('text=Сегодня', { timeout: 15000 }).catch(()=>{});
  // ensure dashboard loaded
  await pageA.waitForTimeout(1000);

  // Anna joins via code
  await pageB.click('#onboarding-join-pair-btn');
  await pageB.waitForSelector('#onboarding-join-code-input');
  await pageB.fill('#onboarding-join-code-input', inviteCode);
  await pageB.fill('#onboarding-join-my-name-input', 'Анна');
  const joinRespPromise = pageB.waitForResponse((r: any) => r.url().includes('/api/couple/join'), { timeout: 10000 }).catch(()=>null);
  await pageB.click('#onboarding-join-submit-btn');
  const joinResp = await joinRespPromise;
  if (joinResp) {
    const body = await joinResp.text().catch(()=>'<no body>');
    console.log('join resp', joinResp.status(), body.slice(0,500));
    expect(joinResp.ok()).toBeTruthy();
  }
  await pageB.waitForSelector('text=Сегодня', { timeout: 15000 }).catch(()=>{});
  await pageB.waitForTimeout(1500);

  // Verify pairing - hug button visible for both
  await pageA.waitForTimeout(2000);
  await expect(pageA.locator('#main-hug-cta')).toBeVisible({ timeout: 10000 });
  await expect(pageB.locator('#main-hug-cta')).toBeVisible({ timeout: 10000 });

  // Bell check
  await expect(pageA.locator('#header-bell-btn')).toBeVisible({ timeout: 5000 });
  await pageA.click('#header-bell-btn');
  await pageA.waitForSelector('text=Уведомления', { timeout: 5000 });
  await pageA.click('text=Закрыть');
  await pageA.waitForTimeout(500);

  // Morning hug
  await pageA.click('#main-hug-cta');
  await expect(pageA.locator('text=Объятие доставлено!')).toBeVisible({ timeout: 5000 });
  // Anna should receive toast within 10s (polling)
  await pageB.waitForTimeout(3000);
  const toast = pageB.locator('[role="status"]');
  await expect(toast.first()).toBeVisible({ timeout: 15000 });
  const answerBtn = pageB.locator('[role="status"] button:has-text("Ответить")').first();
  if (await answerBtn.isVisible({ timeout: 2000 }).catch(()=>false)) {
    await answerBtn.click();
  } else {
    await toast.first().locator('button').last().click().catch(()=>{});
  }
  await pageB.waitForTimeout(1000);

  // Psychology - take test
  async function takeTest(page:any){
    // goto tests via profile? use direct navigation to hash? Instead click through UI
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    // click compatibility card to open tests?
    const link = page.locator('text=Пройти тест').first();
    if (await link.isVisible({ timeout: 3000 }).catch(()=>false)) await link.click();
    await page.waitForTimeout(800);
    // first test card
    const card = page.locator('.group').filter({ hasText: 'Пять языков' }).first();
    const firstCard = await card.isVisible({ timeout: 3000 }).catch(()=>false) ? card : page.locator('button:has-text("Пройти")').first();
    await firstCard.click({ timeout: 5000 }).catch(()=>{});
    // modal answer loop
    for (let i=0;i<8;i++){
      const modal = page.locator('.fixed.inset-0.z-50');
      if (!(await modal.isVisible({ timeout: 1000 }).catch(()=>false))) break;
      // pick first radio option
      const opt = modal.locator('button').filter({ hasText: /^[А-ЯЁ]/ }).first();
      if (await opt.isVisible({ timeout: 2000 }).catch(()=>false)) await opt.click();
      const next = modal.locator('button:has-text("Далее"), button:has-text("Завершить")').first();
      if (await next.isVisible({ timeout: 2000 }).catch(()=>false) && await next.isEnabled()) {
        await next.click();
        await page.waitForTimeout(600);
      } else break;
    }
    const done = page.locator('button:has-text("Вернуться к списку")');
    if (await done.isVisible({ timeout: 3000 }).catch(()=>false)) await done.click();
  }
  await takeTest(pageA);
  await takeTest(pageB);
  await pageA.waitForTimeout(2000);
  // radar check - goto "Мы" -> radar?
  await pageA.click('text=Мы');
  await pageA.waitForTimeout(1000);
  await pageA.locator('text=Карта гармонии').first().click({ timeout: 5000 }).catch(()=>{});
  await expect(pageA.locator('svg').first()).toBeVisible({ timeout: 8000 });
  await pageB.click('text=Мы');
  await pageB.waitForTimeout(1000);
  await pageB.locator('text=Карта гармонии').first().click({ timeout: 5000 }).catch(()=>{});
  await expect(pageB.locator('svg').first()).toBeVisible({ timeout: 8000 });

  // Date wheel
  await pageA.click('text=Свидания');
  await pageA.waitForSelector('text=Колесо идей для свиданий', { timeout: 8000 });
  await pageA.click('button:has-text("Крутить")');
  await pageA.waitForTimeout(4200); // spin + result
  await expect(pageA.locator('button:has-text("Пригласить с этой идеей")')).toBeVisible({ timeout: 5000 });
  await pageA.click('button:has-text("Пригласить с этой идеей")');
  await pageA.waitForSelector('text=Приглашение на свидание', { timeout: 5000 });
  await pageA.click('button:has-text("Отправить приглашение")');
  // wait for sync to server
  await pageA.waitForResponse((r: any) => r.url().includes('/api/couple/sync'), { timeout: 8000 }).catch(()=>null);
  await pageA.waitForTimeout(2000);
  // Anna reloads to fetch latest coupleData then opens dates
  await pageB.reload();
  await pageB.waitForTimeout(1500);
  await pageB.click('text=Свидания');
  await pageB.waitForTimeout(2500);
  const accept = pageB.locator('button:has-text("Принять приглашение")').first();
  await expect(accept).toBeVisible({ timeout: 10000 });
  await accept.click();
  await pageB.waitForSelector('text=Подтвердить свидание', { timeout: 5000 }).catch(()=>{});
  const confirm = pageB.locator('button:has-text("Подтвердить свидание")').first();
  if (await confirm.isVisible({ timeout: 3000 }).catch(()=>false)) {
    await confirm.click();
  }
  await pageB.waitForTimeout(1000);

  await ctxA.close();
  await ctxB.close();
});
