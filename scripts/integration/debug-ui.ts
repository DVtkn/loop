import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  const ts = Date.now().toString(36);
  const artemLogin = `artem_${ts}`;
  const annaLogin = `anna_${ts}`;
  const password = 'Password123!';

  // 1. Регистрация Артёма
  const resArtem = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      login: artemLogin,
      password,
      name: 'Артём',
      gender: 'male',
      city: 'Москва',
    }),
  });
  const dataArtem = await resArtem.json();
  const tokenArtem = dataArtem.token;

  // Регистрация Анны
  const resAnna = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'true' },
    body: JSON.stringify({
      login: annaLogin,
      password,
      name: 'Анна',
      gender: 'female',
      city: 'Москва',
    }),
  });
  const dataAnna = await resAnna.json();
  const tokenAnna = dataAnna.token;

  // Связывание
  await fetch(`${BASE_URL}/api/pair/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenArtem}`, 'x-test-suite': 'true' },
    body: JSON.stringify({ fromLogin: artemLogin, toLogin: annaLogin }),
  });
  await fetch(`${BASE_URL}/api/pair/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAnna}`, 'x-test-suite': 'true' },
    body: JSON.stringify({ fromLogin: artemLogin, toLogin: annaLogin, relationshipStartDate: '2024-05-10' }),
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE_URL}/`);
  await page.waitForTimeout(500);

  // Вход
  await page.fill('#auth-login-input', artemLogin);
  await page.fill('#auth-password-input', password);
  await page.click('#auth-submit-btn');
  await page.waitForTimeout(1500);

  // Сохранить скриншот после логина
  await page.screenshot({ path: 'test-results/after-login.png' });
  console.log('Скриншот after-login.png сохранен');

  const visibleButtons = await page.locator('button').allInnerTexts();
  console.log('Visible buttons:', visibleButtons);

  // Попробуем нажать на Чат
  const chatNav = page.locator('#desktop-nav-chat, #mobile-tab-chat, button:has-text("Чат")');
  console.log('Chat nav count:', await chatNav.count());
  for (let i = 0; i < await chatNav.count(); i++) {
    const el = chatNav.nth(i);
    console.log(`Chat nav ${i}: visible=${await el.isVisible()}, text=${await el.innerText()}`);
    if (await el.isVisible()) {
      await el.click();
      break;
    }
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/after-chat-click.png' });
  console.log('Скриншот after-chat-click.png сохранен');

  console.log('Buttons on chat screen:', await page.locator('button').allInnerTexts());

  await browser.close();
}

main().catch(console.error);
