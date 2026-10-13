import 'dotenv/config';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';

async function loginToApp(page: any, login: string, password: string) {
  console.log(`Logging in as ${login}...`);
  await page.goto(`${BASE_URL}/`);
  await page.fill('#auth-login-input', login);
  await page.fill('#auth-password-input', password);
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  const error = await page.locator('text=Неверный логин или пароль, text=Ошибка').first().textContent().catch(() => null);
  if (error) {
    console.log('Login error:', error);
    throw new Error(`Login failed: ${error}`);
  }
  
  const stillOnLogin = await page.locator('#auth-login-input').isVisible().catch(() => false);
  if (stillOnLogin) {
    const errorText = await page.locator('body').textContent().catch(() => '');
    console.log('Still on login page, page content:', errorText?.slice(0, 500));
    throw new Error('Login failed - still on login page');
  }
  
  console.log('Waiting for dashboard...');
  await page.waitForSelector('text=Тамагочи союза', { timeout: 30000 });
  console.log('Dashboard loaded!');
  
  const token = await page.evaluate(() => localStorage.getItem('loop_auth_token'));
  console.log('Token retrieved:', token ? 'yes' : 'no');
  return token;
}

async function waitForPetOnboarding(page: any): Promise<void> {
  await page.waitForSelector('text=Тамагочи союза', { timeout: 15000 });
  
  const hasOnboarding = await page.locator('text=Оживите питомца').isVisible().catch(() => false);
  if (hasOnboarding) {
    await page.click('button:has-text("Запустить консоль")');
    await page.waitForSelector('text=LOOP.EXE', { timeout: 10000 });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Чихуахуа"), button:has-text("Кошечка")').catch(async () => {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
    });
    await page.waitForTimeout(1000);

    await page.click('button:has-text("ЯЙЦА")');
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="Бусинка"]', 'Бусинка');
    await page.click('button:has-text("ПАСПОРТ")');
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("КОРМ")').first().click();
    await page.waitForTimeout(1000);
  }
}

test.describe.configure({ mode: 'serial' });
test.describe('Couple Full Lifecycle E2E', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';
  
  let maxToken: string;
  let annaToken: string;
  let browser: any;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test('Stage 1: API - Reset passwords, login, and create pet via API', async ({ request }) => {
    test.setTimeout(60000);
    
    // Reset passwords
    const reset1 = await request.post(`${BASE_URL}/api/auth/reset-password`, {
      headers: { 'Content-Type': 'application/json' },
      data: { login: 'dmitry', newPassword: 'TestPass123!', secretKey: process.env.TEST_SUITE_SECRET || '' }
    });
    expect(reset1.ok()).toBeTruthy();
    
    const reset2 = await request.post(`${BASE_URL}/api/auth/reset-password`, {
      headers: { 'Content-Type': 'application/json' },
      data: { login: 'anna', newPassword: 'TestPass123!', secretKey: process.env.TEST_SUITE_SECRET || '' }
    });
    expect(reset2.ok()).toBeTruthy();
    
    // Login via API
    const login1 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { login: 'dmitry', password: 'TestPass123!' }
    });
    const loginData1 = await login1.json();
    const maxToken = loginData1.token;
    expect(maxToken).toBeTruthy();
    
    const login2 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { login: 'anna', password: 'TestPass123!' }
    });
    const loginData2 = await login2.json();
    const annaToken = loginData2.token;
    expect(annaToken).toBeTruthy();
    
    // Create pet via API (Max)
    const petBirth = await request.post(`${BASE_URL}/api/pet/birth`, {
      headers: { Authorization: `Bearer ${maxToken}` },
      data: { species: 'dog', name: 'Бусинка' }
    });
    if (petBirth.ok()) {
      const petData = await petBirth.json();
      expect(petData.state.name).toBe('Бусинка');
      expect(petData.state.species).toBe('dog');
      expect(petData.state.isOnboardingCompleted).toBe(true);
    } else {
      // питомец уже мог быть создан в предыдущем прогоне — это допустимо
      expect(petBirth.status()).toBe(400);
    }
    
    // Verify Anna can see the pet
    const petStateAnna = await request.get(`${BASE_URL}/api/pet`, {
      headers: { Authorization: `Bearer ${annaToken}` }
    });
    const petDataAnna = await petStateAnna.json();
    expect(petDataAnna.name).toBe('Бусинка');
    expect(petDataAnna.species).toBe('dog');
    expect(petDataAnna.isOnboardingCompleted).toBe(true);
  });

  test('Stage 2: UI - Pet widget visible on dashboard', async ({ browser }) => {
    test.setTimeout(60000);
    
    const context = await browser.newContext({ 
      viewport: { width: 390, height: 844 },
      locale: 'ru-RU'
    });
    const page = await context.newPage();
    
    await page.goto(`${BASE_URL}/`);
    await page.fill('#auth-login-input', 'dmitry');
    await page.fill('#auth-password-input', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Тамагочи союза', { timeout: 30000 });
    
    // Verify pet widget
    await expect(page.locator('text=Тамагочи союза')).toBeVisible();
    await expect(page.locator('text=Бусинка').first()).toBeVisible();
    await expect(page.locator('text=Сытость').first()).toBeVisible();
    await expect(page.locator('text=Радость').first()).toBeVisible();
    await expect(page.locator('text=Энергия').first()).toBeVisible();
    await expect(page.locator('text=Чистота')).toBeVisible();
    
    await page.close();
  });

  test('Stage 3: API - Co-op pet care actions', async ({ request }) => {
    test.setTimeout(60000);
    
    // Login via API
    const login1 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { login: 'dmitry', password: 'TestPass123!' }
    });
    const loginData1 = await login1.json();
    const maxToken = loginData1.token;
    
    const login2 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { login: 'anna', password: 'TestPass123!' }
    });
    const loginData2 = await login2.json();
    const annaToken = loginData2.token;
    
    // Текущее состояние до действий (питомец мог «проголодаться» за время простоя)
    const beforeRes = await request.get(`${BASE_URL}/api/pet`, {
      headers: { Authorization: `Bearer ${annaToken}` }
    });
    const before = await beforeRes.json();
    
    // Anna feeds the pet
    const feed = await request.post(`${BASE_URL}/api/pet/action`, {
      headers: { Authorization: `Bearer ${annaToken}` },
      data: { action: 'feed' }
    });
    expect(feed.ok()).toBeTruthy();
    const feedData = await feed.json();
    expect(feedData.success).toBe(true);
    // Стат может упереться в кап 100 при повторных прогонах — проверяем нестрогим сравнением + начисление XP
    expect(feedData.state.hunger).toBeGreaterThanOrEqual(before.hunger);
    expect(feedData.expGained).toBe(15);
    
    // Anna plays with the pet
    const play = await request.post(`${BASE_URL}/api/pet/action`, {
      headers: { Authorization: `Bearer ${annaToken}` },
      data: { action: 'play' }
    });
    expect(play.ok()).toBeTruthy();
    const playData = await play.json();
    expect(playData.success).toBe(true);
    expect(playData.state.joy).toBeGreaterThanOrEqual(feedData.state.joy);
    expect(playData.expGained).toBe(20);
    
    // Anna hugs the pet
    const hug = await request.post(`${BASE_URL}/api/pet/action`, {
      headers: { Authorization: `Bearer ${annaToken}` },
      data: { action: 'hug' }
    });
    expect(hug.ok()).toBeTruthy();
    const hugData = await hug.json();
    expect(hugData.success).toBe(true);
    
    // Verify Max sees updated stats
    const petStateMax = await request.get(`${BASE_URL}/api/pet`, {
      headers: { Authorization: `Bearer ${maxToken}` }
    });
    const petDataMax = await petStateMax.json();
    expect(petDataMax.hunger).toBeGreaterThanOrEqual(feedData.state.hunger);
    expect(petDataMax.joy).toBeGreaterThanOrEqual(playData.state.joy);
  });

  test('Stage 4: UI - Tamagotchi console opens and works', async ({ browser }) => {
    test.setTimeout(60000);
    
    const context = await browser.newContext({ 
      viewport: { width: 390, height: 844 },
      locale: 'ru-RU'
    });
    const page = await context.newPage();
    
    await page.goto(`${BASE_URL}/`);
    await page.fill('#auth-login-input', 'dmitry');
    await page.fill('#auth-password-input', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Тамагочи союза', { timeout: 30000 });
    
    // Open Tamagotchi console
    await page.click('button:has-text("Запустить консоль")');
    await page.waitForSelector('text=СИНЕРГИЯ ДУО', { timeout: 15000 });

    // Verify console elements
    await expect(page.locator('text=Бусинка').first()).toBeVisible();
    await expect(page.locator('text=СИНЕРГИЯ ДУО').first()).toBeVisible();
    await expect(page.locator('text=КОРМ').first()).toBeVisible();
    await expect(page.locator('text=ИГРА').first()).toBeVisible();
    await expect(page.locator('text=СПАТЬ').first()).toBeVisible();
    await expect(page.locator('text=ЛАСКА').first()).toBeVisible();

    // Test action button
    await page.locator('button:has-text("КОРМ")').first().click();
    await page.waitForTimeout(1000);
    
    await page.close();
  });
});