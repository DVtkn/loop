import 'dotenv/config';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chat Persistence & Realtime E2E Audit', () => {
  test('E2E Сквозной тест персистентности чата "Вместе" и сохранения после F5', async ({ page }) => {
    console.log('1. Инициализация пары Артём + Анна...');
    const ts = Date.now().toString(36);
    const artemLogin = `artem_${ts}`;
    const annaLogin = `anna_${ts}`;
    const password = 'Password123!';

    // Регистрация Артёма
    const resArtem = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-suite': (process.env.TEST_SUITE_SECRET || '') },
      body: JSON.stringify({
        login: artemLogin,
        password,
        name: 'Артём',
        gender: 'male',
        city: 'Москва',
      }),
    });
    const dataArtem = await resArtem.json();
    expect(resArtem.ok).toBeTruthy();
    const tokenArtem = dataArtem.token;

    // Регистрация Анны
    const resAnna = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-suite': (process.env.TEST_SUITE_SECRET || '') },
      body: JSON.stringify({
        login: annaLogin,
        password,
        name: 'Анна',
        gender: 'female',
        city: 'Москва',
      }),
    });
    const dataAnna = await resAnna.json();
    expect(resAnna.ok).toBeTruthy();
    const tokenAnna = dataAnna.token;

    // Связывание пары
    const resReq = await fetch(`${BASE_URL}/api/pair/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenArtem}`,
        'x-test-suite': (process.env.TEST_SUITE_SECRET || ''),
      },
      body: JSON.stringify({
        fromLogin: artemLogin,
        toLogin: annaLogin,
      }),
    });
    expect(resReq.ok).toBeTruthy();

    const resAccept = await fetch(`${BASE_URL}/api/pair/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAnna}`,
        'x-test-suite': (process.env.TEST_SUITE_SECRET || ''),
      },
      body: JSON.stringify({
        fromLogin: artemLogin,
        toLogin: annaLogin,
        relationshipStartDate: '2024-05-10',
      }),
    });
    expect(resAccept.ok).toBeTruthy();
    console.log('2. Пара успешно создана и связана в Neon DB.');

    console.log('3. Открытие приложения...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    console.log(`4. Вход под @${artemLogin}...`);
    await page.fill('#auth-login-input', artemLogin);
    await page.fill('#auth-password-input', password);
    await page.click('#auth-submit-btn');
    await page.waitForTimeout(1000);

    console.log('5. Переход во вкладку "Чат"...');
    const chatNav = page.locator('#desktop-nav-chat, #mobile-tab-chat, button:has-text("Чат")');
    for (let i = 0; i < await chatNav.count(); i++) {
      const el = chatNav.nth(i);
      if (await el.isVisible()) {
        await el.click();
        break;
      }
    }
    await page.waitForTimeout(800);

    console.log('6. Переключение в режим "Вместе"...');
    const togetherBtn = page.locator('#chat-mode-together, button:has-text("Вместе")').first();
    await togetherBtn.click();
    await page.waitForTimeout(600);

    console.log('7. Проверка динамического статуса партнёра в шапке...');
    const isOnlineVisible = await page.locator('header').locator('text=В сети').isVisible();
    console.log(`   Статус "В сети" (зеленый индикатор в шапке): ${isOnlineVisible}`);

    const testMessage = `Тестовое сообщение для проверки F5 [${Date.now()}]`;
    console.log(`8. Отправка сообщения: "${testMessage}"...`);
    const input = page.locator('input[placeholder*="сообщение"]').first();
    await input.fill(testMessage);

    const sendBtn = page.locator('button[title="Отправить"], button[type="submit"]').last();
    await sendBtn.click();
    await page.waitForTimeout(1000);

    // Проверка появления до перезагрузки
    await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 5000 });

    console.log('9. Выполнение перезагрузки F5...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    console.log('10. Повторный переход во вкладку "Чат" после перезагрузки...');
    const chatNavAfter = page.locator('#desktop-nav-chat, #mobile-tab-chat, button:has-text("Чат")');
    for (let i = 0; i < await chatNavAfter.count(); i++) {
      const el = chatNavAfter.nth(i);
      if (await el.isVisible()) {
        await el.click();
        break;
      }
    }
    await page.waitForTimeout(800);

    const togetherBtnAfter = page.locator('#chat-mode-together, button:has-text("Вместе")').first();
    if (await togetherBtnAfter.isVisible()) {
      await togetherBtnAfter.click();
    }
    await page.waitForTimeout(1200);

    // Проверка персистентности
    await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 7000 });
    console.log('11. Сообщение успешно загружено из базы после перезагрузки!');

    await page.screenshot({ path: 'test-results/chat-verified.png', fullPage: true });
    console.log('12. Скриншот сохранён: test-results/chat-verified.png');
  });
});
