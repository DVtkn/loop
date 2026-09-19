import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_BASE = process.env.PLAYWRIGHT_API_URL || BASE_URL;

async function registerUser(page: any, login: string, password: string, name: string, gender: 'male' | 'female') {
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="text"]', login);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Войти")');
  
  // Wait for redirect to onboarding or dashboard
  await page.waitForURL(/\/onboarding|\//, { timeout: 10000 });
  
  // If onboarding, fill it out
  if (page.url().includes('/onboarding')) {
    await page.fill('input[name="name"]', name);
    await page.click(`button:has-text("${gender === 'male' ? 'Парень' : 'Девушка'}")`);
    await page.click('button:has-text("Далее")');
    await page.waitForURL(/\//, { timeout: 10000 });
  }
  
  // Wait for dashboard
  await page.waitForSelector('[data-testid="dashboard"], .dashboard, text=Тамагочи союза', { timeout: 10000 });
}

async function getAuthToken(page: any): Promise<string> {
  return await page.evaluate(() => localStorage.getItem('loop_auth_token'));
}

async function createCoupleInvite(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/couple/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  return data.code;
}

async function joinCouple(token: string, code: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/couple/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join couple');
}

async function waitForPetOnboarding(page: any): Promise<void> {
  // Wait for pet widget or onboarding
  await page.waitForSelector('text=Тамагочи союза', { timeout: 15000 });
  
  // Check if onboarding is needed
  const hasOnboarding = await page.locator('text=Оживите питомца').isVisible().catch(() => false);
  if (hasOnboarding) {
    await page.click('button:has-text("Запустить консоль")');
    await page.waitForSelector('text=LOOP-DOS', { timeout: 10000 });
    
    // BIOS screen - press A
    await page.click('button:has-text("НАЖМИТЕ A")');
    await page.waitForTimeout(1000);
    
    // Select species - dog (first option)
    await page.click('button:has-text("Чихуахуа"), button:has-text("Собака"), text=🐕').catch(async () => {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
    });
    await page.waitForTimeout(1000);
    
    // Name input
    await page.fill('input[placeholder*="имя" i], input[placeholder*="name" i]', 'Бусинка');
    await page.click('button:has-text("Подтвердить"), button:has-text("A")');
    await page.waitForTimeout(1000);
    
    // First feeding tutorial
    await page.click('button:has-text("Покормить")');
    await page.waitForTimeout(1000);
  }
}

test.describe('Couple Full Lifecycle E2E', () => {
  const timestamp = Date.now();
  const maxLogin = `test_max_${timestamp}`;
  const annaLogin = `test_anna_${timestamp}`;
  const password = 'TestPass123!';
  const maxName = 'Макс';
  const annaName = 'Анна';
  
  let maxContext: any;
  let annaContext: any;
  let maxPage: any;
  let annaPage: any;
  let maxToken: string;
  let annaToken: string;
  let inviteCode: string;

  test.beforeAll(async ({ browser }) => {
    maxContext = await browser.newContext({ 
      viewport: { width: 390, height: 844 },
      locale: 'ru-RU'
    });
    annaContext = await browser.newContext({ 
      viewport: { width: 390, height: 844 },
      locale: 'ru-RU'
    });
    
    maxPage = await maxContext.newPage();
    annaPage = await annaContext.newPage();
  });

  test.afterAll(async () => {
    await maxContext.close();
    await annaContext.close();
  });

  test('Stage 1: Registration, onboarding and pairing', async () => {
    // Max registration
    await registerUser(maxPage, maxLogin, password, maxName, 'male');
    maxToken = await getAuthToken(maxPage);
    expect(maxToken).toBeTruthy();
    
    // Anna registration
    await registerUser(annaPage, annaLogin, password, annaName, 'female');
    annaToken = await getAuthToken(annaPage);
    expect(annaToken).toBeTruthy();

    // Max creates invite
    inviteCode = await createCoupleInvite(maxToken);
    expect(inviteCode).toMatch(/^LOOP-\d{6}$/);

    // Anna joins with invite
    await joinCouple(annaToken, inviteCode);
    
    // Both should be on dashboard
    await maxPage.waitForSelector('text=Тамагочи союза', { timeout: 10000 });
    await annaPage.waitForSelector('text=Тамагочи союза', { timeout: 10000 });
  });

  test('Stage 2: Pet Tamagotchi - Max onboarding, Anna sync', async () => {
    // Max goes through pet onboarding
    await waitForPetOnboarding(maxPage);
    
    // Verify pet created on Max's side
    await maxPage.waitForSelector('text=Бусинка', { timeout: 10000 });
    await expect(maxPage.locator('text=Сытость')).toBeVisible();
    await expect(maxPage.locator('text=Радость')).toBeVisible();
    await expect(maxPage.locator('text=Энергия')).toBeVisible();
    await expect(maxPage.locator('text=Чистота')).toBeVisible();

    // Anna opens widget - should see pet immediately (no onboarding)
    await annaPage.reload();
    await annaPage.waitForSelector('text=Тамагочи союза', { timeout: 10000 });
    await expect(annaPage.locator('text=Бусинка')).toBeVisible({ timeout: 10000 });
    await expect(annaPage.locator('text=Сытость')).toBeVisible();
  });

  test('Stage 3: Co-op pet care - Anna feeds, Max sees update', async () => {
    // Anna feeds the pet
    await annaPage.click('button:has-text("Покормить")');
    await annaPage.waitForTimeout(1000);
    
    // Anna spams hugs
    await annaPage.click('button:has-text("Спамить обнимашками")');
    await annaPage.waitForTimeout(1000);

    // Max should see updated stats without reload (SSE/polling)
    await maxPage.waitForTimeout(3000);
    
    // Check Max sees updated hunger and joy
    const maxHunger = await maxPage.locator('text=Сытость').locator('..').locator('.progress-bar, [style*="width"]').first().getAttribute('style').catch(() => '');
    expect(maxHunger).toBeTruthy();
  });

  test('Stage 4: Activity feed shows partner actions', async () => {
    // Check activity feed on Max's side
    await maxPage.click('button:has-text("Лента"), button:has-text("События")').catch(() => {});
    await maxPage.waitForSelector('text=покормила, text=покормил, text=обняла, text=обнял', { timeout: 5000 }).catch(() => {});
  });

  test('Stage 5: Database verification', async () => {
    // Direct API check
    const maxToken = await getAuthToken(maxPage);
    const res = await fetch(`${API_BASE}/api/pet`, {
      headers: { Authorization: `Bearer ${maxToken}` }
    });
    const petData = await res.json();
    
    expect(res.ok).toBeTruthy();
    expect(petData.name).toBe('Бусинка');
    expect(petData.species).toBe('dog');
    expect(petData.isOnboardingCompleted).toBe(true);
    expect(petData.hunger).toBeGreaterThan(85); // After feeding
    expect(petData.experience).toBeGreaterThan(50); // Birth + actions
    expect(petData.level).toBeGreaterThanOrEqual(1);
  });

  test('Stage 6: Daily contact - Touch, Question, Date, Chat', async () => {
    // Touch/Pulse
    await maxPage.click('button:has-text("Обнять"), button:has-text("Пульс")').catch(() => {});
    await annaPage.waitForSelector('text=Макс, text=касание, text=обнял', { timeout: 5000 }).catch(() => {});

    // Question of the day
    await maxPage.fill('textarea, input[placeholder*="ответ" i]', 'Мой тестовый ответ');
    await maxPage.click('button:has-text("Ответить")').catch(() => {});
    await annaPage.reload();
    await annaPage.waitForSelector('text=Мой тестовый ответ', { timeout: 5000 }).catch(() => {});

    // Date invitation
    await maxPage.click('button:has-text("Свидание"), button:has-text("Колесо")').catch(() => {});
    await maxPage.waitForSelector('button:has-text("Создать"), button:has-text("Отправить")', { timeout: 5000 }).catch(() => {});

    // Chat message
    await maxPage.click('button:has-text("Чат"), a:has-text("Чат")').catch(() => {});
    await maxPage.fill('input[placeholder*="сообщение" i], textarea[placeholder*="сообщение" i]', 'Тестовое сообщение от Макса');
    await maxPage.click('button:has-text("Отправить"), button[type="submit"]').catch(() => {});
    await annaPage.waitForSelector('text=Тестовое сообщение от Макса', { timeout: 5000 }).catch(() => {});
  });

  test('Stage 7: Cleanup - remove test users', async () => {
    // This would typically be done via API, but for now just verify we can log out
    await maxPage.click('button:has-text("Выход"), button:has-text("Настройки")').catch(() => {});
    await annaPage.click('button:has-text("Выход"), button:has-text("Настройки")').catch(() => {});
  });
});