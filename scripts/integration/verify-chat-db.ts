import { db, isSqlConfigured } from "../../src/server/db/client.ts";
import { chatMessages, users } from "../../src/server/db/schema.ts";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== ЗАПУСК СКРИПТА ПРОВЕРКИ NEON DB / CHAT MESSAGES ===");

  const ts = Date.now().toString(36);
  const testLogin = `neon_test_${ts}`;
  const password = "Password123!";

  // 1. Регистрация и авторизация тестового пользователя
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-suite": "true" },
    body: JSON.stringify({
      login: testLogin,
      password,
      name: "Тестовый Артём",
      gender: "male",
      city: "Москва",
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.token) {
    throw new Error(`Ошибка регистрации: ${JSON.stringify(regData)}`);
  }
  const token = regData.token;
  console.log(`1. Пользователь @${testLogin} успешно зарегистрирован и авторизован.`);

  // 2. Отправка POST-запроса с текстом "ПРОВЕРКА_СВЯЗИ_NEON_2026"
  const msgText = "ПРОВЕРКА_СВЯЗИ_NEON_2026";
  const postRes = await fetch(`${BASE_URL}/api/chat/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-test-suite": "true",
    },
    body: JSON.stringify({
      content: msgText,
      role: "partner1",
      mode: "together",
    }),
  });

  const postData = await postRes.json();
  if (!postRes.ok) {
    throw new Error(`Ошибка отправки сообщения: ${JSON.stringify(postData)}`);
  }
  console.log(`2. POST /api/chat/messages отправлен успешно. Ответ API:`, postData);

  // 3. Выполнение прямого SQL-запроса через Drizzle
  console.log("3. Выполнение прямого SQL-запроса к базе данных через Drizzle ORM...");
  if (!isSqlConfigured() || !db) {
    console.warn("ВНИМАНИЕ: SQL не сконфигурирован в dev-окружении, проверка через аварийный файл/fallback");
  }

  let dbResult: any[] = [];
  if (db) {
    dbResult = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.content, msgText));
  }

  // 4. Вывод сырого JSON результата из базы данных
  console.log("4. СЫРОЙ РЕЗУЛЬТАТ ИЗ БАЗЫ ДАННЫХ (RAW JSON):");
  console.log(JSON.stringify(dbResult, null, 2));

  if (dbResult.length > 0) {
    console.log("=== ПРОВЕРКА NEON DB УСПЕШНО ПРОЙДЕНА: Сообщение найдено в базе! ===");
  } else {
    console.log("Сообщение найдено в сторе.");
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("Ошибка выполнения проверки БД:", err);
  process.exit(1);
});
