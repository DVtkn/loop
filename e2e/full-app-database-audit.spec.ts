import "dotenv/config";
import { test, expect } from '@playwright/test';
import { db } from '../src/server/db/client';
import * as schema from '../src/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getConnectionString, isSqlConfigured } from '../src/server/db/client';

test.describe('Full App E2E with Direct Database Verification', () => {
  // Use unique identifiers for this test run to avoid collisions
  const testId = Date.now().toString();
  const maxLogin = `max_${testId}`;
  const annaLogin = `anna_${testId}`;
  const maxPassword = 'Password123!';
  const annaPassword = 'Password123!';
  const maxName = 'Max';
  const annaName = 'Anna';

  // Helper to get couple id from two user ids
  const getCoupleId = async (user1Id: string, user2Id: string) => {
    const couple = await db.select().from(schema.couples).where(
      and(
        eq(schema.couples.user1Id, user1Id),
        eq(schema.couples.user2Id, user2Id)
      )
    ).limit(1);
    if (couple.length > 0) return couple[0].id;
    const couple2 = await db.select().from(schema.couples).where(
      and(
        eq(schema.couples.user1Id, user2Id),
        eq(schema.couples.user2Id, user1Id)
      )
    ).limit(1);
    if (couple2.length > 0) return couple2[0].id;
    throw new Error('Couple not found');
  };

  test.beforeAll(async () => {
    // No global setup needed
    // Debug environment variables
    console.log('--- ENV DEBUG ---');
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.log('POSTGRES_URL set:', !!process.env.POSTGRES_URL);
    console.log('NEON_DATABASE_URL set:', !!process.env.NEON_DATABASE_URL);
    console.log('MY_DATABASE_URL set:', !!process.env.MY_DATABASE_URL);
    console.log('SQL_HOST set:', !!process.env.SQL_HOST);
    console.log('SQL_USER set:', !!process.env.SQL_USER);
    console.log('SQL_DB_NAME set:', !!process.env.SQL_DB_NAME);
    console.log('PGHOST set:', !!process.env.PGHOST);
    console.log('PGUSER set:', !!process.env.PGUSER);
    console.log('PGDATABASE set:', !!process.env.PGDATABASE);
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      console.log('DATABASE_URL length:', url.length);
      console.log('DATABASE_URL prefix:', url.substring(0, Math.min(30, url.length)));
    }
    console.log('isSqlConfigured():', isSqlConfigured());
    console.log('getConnectionString():', getConnectionString() ? '[SET]' : '[NULL]');
    const cs = getConnectionString();
    if (cs) {
      console.log('Connection string length:', cs.length);
      console.log('Connection string prefix:', cs.substring(0, Math.min(50, cs.length)));
    }
    console.log('--- END ENV DEBUG ---');
  });

  test.afterAll(async () => {
    // Cleanup: delete test users and related data
    try {
      // We'll delete in reverse order of dependencies using the logins
      const maxUser = await db.select().from(schema.users).where(eq(schema.users.login, maxLogin)).limit(1);
      const annaUser = await db.select().from(schema.users).where(eq(schema.users.login, annaLogin)).limit(1);
      if (maxUser[0] && annaUser[0]) {
        const coupleId = await getCoupleId(maxUser[0].id, annaUser[0].id);
        // Delete dependent records
        await db.delete(schema.coupleEvents).where(eq(schema.coupleEvents.coupleId, coupleId));
        await db.delete(schema.couplePets).where(eq(schema.couplePets.coupleId, coupleId));
        await db.delete(schema.chatMessages).where(eq(schema.chatMessages.coupleId, coupleId));
        // Delete test answers for either user
        await db.delete(schema.testAnswers).where(
          sql`${schema.testAnswers.userId} IN (${maxUser[0].id}, ${annaUser[0].id})`
        );
        await db.delete(schema.testSessions).where(eq(schema.testSessions.coupleId, coupleId));
        await db.delete(schema.couples).where(eq(schema.couples.id, coupleId));
      }
      await db.delete(schema.users).where(eq(schema.users.login, maxLogin));
      await db.delete(schema.users).where(eq(schema.users.login, annaLogin));
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }
  });

  test('should register pair, complete test, create pet, and send message', async ({ context }) => {
    // Create two pages for two users
    const maxPage = await context.newPage();
    const annaPage = await context.newPage();

    try {
      // === 1. Registration and Pairing ===
      // Max registers
      await maxPage.goto('http://localhost:3000/register');
      await maxPage.waitForLoadState('domcontentloaded');
      // Click on the "Регистрация" tab to switch to registration form
      const registrationTab = maxPage.locator('text=Регистрация');
      await registrationTab.waitFor({ state: 'visible', timeout: 5000 });
      await registrationTab.click();
// Wait for login input to be attached to DOM
       const loginInput = maxPage.locator('input#auth-login-input');
       await loginInput.waitFor({ state: 'attached', timeout: 5000 });
       await loginInput.fill(maxLogin);
       const nameInput = maxPage.locator('input#auth-name-input');
       await nameInput.waitFor({ state: 'attached', timeout: 5000 });
       await nameInput.fill(maxName);
       const passwordInput = maxPage.locator('input#auth-password-input');
       await passwordInput.waitFor({ state: 'attached', timeout: 5000 });
       await passwordInput.fill(maxPassword);
       // Wait for gender option "Мужской (Он)" to be visible and click it
       const maleOption = maxPage.locator('text=Мужской (Он)');
       await maleOption.waitFor({ state: 'visible', timeout: 5000 });
       await maleOption.click();
       // Click the "Создать пространство для нас" button
       const createPairButton = maxPage.locator('text=Создать пространство для нас');
       await createPairButton.waitFor({ state: 'visible', timeout: 5000 });
       await createPairButton.click();
       // Wait for invite code to appear or error to show
       const inviteCodeElem = maxPage.waitForSelector('.invite-code', { timeout: 15000 });
       const errorElem = maxPage.waitForSelector('.error, .alert-error, [role="alert"]', { timeout: 15000 });
       const [inviteCodeResult, errorResult] = await Promise.all([
         inviteCodeElem.catch(() => null),
         errorElem.catch(() => null)
       ]);
       if (errorResult) {
         const errorText = await errorResult.textContent();
         console.log('Registration error:', errorText);
         throw new Error('Registration failed: ' + errorText);
       }
       if (!inviteCodeResult) {
         console.log('Invite code element not found. Page content:', await maxPage.content());
         throw new Error('Invite code element not found');
       }
       const inviteCode = await inviteCodeResult.textContent();
       expect(inviteCode).toMatch(/[A-Z0-9]{6}/);

      // Anna registers and uses invite code
      await annaPage.goto('http://localhost:3000/register');
      await annaPage.waitForLoadState('domcontentloaded');
      const annaRegistrationTab = annaPage.locator('text=Регистрация');
      await annaRegistrationTab.waitFor({ state: 'visible', timeout: 5000 });
      await annaRegistrationTab.click();
      const annaLoginInput = annaPage.locator('input#auth-login-input');
      await annaLoginInput.waitFor({ state: 'attached', timeout: 5000 });
      await annaLoginInput.fill(annaLogin);
      const annaNameInput = annaPage.locator('input#auth-name-input');
      await annaNameInput.waitFor({ state: 'attached', timeout: 5000 });
      await annaNameInput.fill(annaName);
      const annaPasswordInput = annaPage.locator('input#auth-password-input');
      await annaPasswordInput.waitFor({ state: 'attached', timeout: 5000 });
      await annaPasswordInput.fill(annaPassword);
      const annaMaleOption = annaPage.locator('text=Мужской (Он)');
      await annaMaleOption.waitFor({ state: 'visible', timeout: 5000 });
      await annaMaleOption.click();
      await annaPage.click('button[type="submit"]');
// Wait for invite code to appear or error to show
       const annaInviteCodeElem = annaPage.waitForSelector('.invite-code', { timeout: 15000 });
       const annaErrorElem = annaPage.waitForSelector('.error, .alert-error, [role="alert"]', { timeout: 15000 });
       const [annaInviteCodeResult, annaErrorResult] = await Promise.all([
         annaInviteCodeElem.catch(() => null),
         annaErrorElem.catch(() => null)
       ]);
       if (annaErrorResult) {
         const annaErrorText = await annaErrorResult.textContent();
         console.log('Anna registration error:', annaErrorText);
         throw new Error('Anna registration failed: ' + annaErrorText);
       }
       if (!annaInviteCodeResult) {
         console.log('Anna invite code element not found. Page content:', await annaPage.content());
         throw new Error('Anna invite code element not found');
       }
       const annaInviteCode = await annaInviteCodeResult.textContent();
       expect(annaInviteCode).toMatch(/[A-Z0-9]{6}/);

      // Verify pairing in DB
      const maxUser = await db.select().from(schema.users).where(eq(schema.users.login, maxLogin)).limit(1);
      const annaUser = await db.select().from(schema.users).where(eq(schema.users.login, annaLogin)).limit(1);
      expect(maxUser[0]?.partnerLogin).toBe(annaLogin);
      expect(annaUser[0]?.partnerLogin).toBe(maxLogin);
      expect(maxUser[0]?.pairedAt).not.toBeNull();
      expect(annaUser[0]?.pairedAt).not.toBeNull();

      // Get couple id
      const coupleId = await getCoupleId(maxUser[0].id, annaUser[0].id);
      expect(coupleId).toBeDefined();

      // === 2. Psychological Tests ===
      // Navigate to tests page for both
      await maxPage.goto('http://localhost:3000/tests');
      await annaPage.goto('http://localhost:3000/tests');

      // Max starts a test
      await maxPage.click('button:has-text("Start Test")');
      // Assume the test has 5 questions, each with two options
      for (let i = 0; i < 5; i++) {
        await maxPage.click(`button.option:nth-child(1)`); // pick first option each time
        await maxPage.click('button:has-text("Next")');
      }
      await maxPage.click('button:has-text("Finish")');

      // Anna does the same
      await annaPage.click('button:has-text("Start Test")');
      for (let i = 0; i < 5; i++) {
        await annaPage.click(`button.option:nth-child(2)`); // pick second option
        await annaPage.click('button:has-text("Next")');
      }
      await annaPage.click('button:has-text("Finish")');

      // Verify test sessions and answers
      const testSessions = await db.select().from(schema.testSessions).where(eq(schema.testSessions.coupleId, coupleId));
      expect(testSessions.length).toBeGreaterThan(0);
      const testSession = testSessions[0];
      expect(testSession.status).toBe('completed');

      const testAnswers = await db.select().from(schema.testAnswers).where(eq(schema.testAnswers.sessionId, testSession.id));
      expect(testAnswers.length).toBe(5); // 5 questions
      testAnswers.forEach((ans) => {
        expect(ans.selectedValue).toMatch(/^[12]$/); // either '1' or '2'
      });

      // === 3. Tamagotchi (LOOP.exe) ===
      // Max opens console and creates a pet
      await maxPage.goto('http://localhost:3000/console');
      await maxPage.click('button:has-text("Choose Pet")');
      await maxPage.click('text="Chihuahua"');
      await maxPage.fill('input[name="petName"]', 'Бусинка');
      await maxPage.click('button:has-text("Confirm")');

      // Verify pet created
      const pets = await db.select().from(schema.couplePets).where(eq(schema.couplePets.coupleId, coupleId));
      expect(pets.length).toBe(1);
      const pet = pets[0];
      expect(pet.species).toBe('dog'); // Chihuahua maps to species 'dog'
      expect(pet.name).toBe('Бусинка');
      expect(pet.hunger).toBe(85); // default from schema
      expect(pet.joy).toBe(90); // default

      // Anna feeds and pets
      await annaPage.goto('http://localhost:3000/console');
      await annaPage.click('button:has-text("Feed")');
      await annaPage.click('button:has-text("Pet")');

      // Verify pet stats updated
      const updatedPets = await db.select().from(schema.couplePets).where(eq(schema.couplePets.id, pet.id));
      expect(updatedPets[0]?.hunger).toBeGreaterThan(pet.hunger);
      expect(updatedPets[0]?.joy).toBeGreaterThan(pet.joy);

      // Verify event logged
      const events = await db.select().from(schema.coupleEvents).where(eq(schema.coupleEvents.coupleId, coupleId));
      const feedEvent = events.find(e => e.eventType === 'feed');
      const petEvent = events.find(e => e.eventType === 'pet');
      expect(feedEvent).toBeTruthy();
      expect(petEvent).toBeTruthy();

      // === 4. Chat ===
      // Send a chat message
      await maxPage.goto('http://localhost:3000/chat');
      await maxPage.waitForLoadState('domcontentloaded');
      const chatInput = maxPage.locator('input[name="message"]');
      await chatInput.waitFor({ state: 'attached', timeout: 5000 });
      await chatInput.fill('Hello Anna!');
      await maxPage.click('button:has-text("Send")');

      // Verify message in DB
      const messages = await db.select().from(schema.chatMessages).where(eq(schema.chatMessages.coupleId, coupleId));
      expect(messages.length).toBeGreaterThan(0);
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.content).toBe('Hello Anna!');
      expect(lastMsg.senderLogin).toBe(maxLogin);

    } finally {
      await maxPage.close();
      await annaPage.close();
    }
  });
});
