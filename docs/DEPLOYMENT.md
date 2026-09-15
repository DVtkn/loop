# Инструкция для ИИ-агента развертывания Loop в Public Launch (12 часов)

## ⚡ АКТУАЛЬНОЕ РАБОЧЕЕ РАЗВЕРТЫВАНИЕ (Vercel + Neon, обновлено 2026-09-14)

### Короткая ссылка приложения
**https://loopza.vercel.app** — production-домен проекта Vercel (публичный, защита Deployment Protection его не блокирует).

Дополнительные URL того же деплоя:
- https://loop-coral-phi.vercel.app — автосгенерированный production URL проекта
- https://loop-vtkn1.vercel.app — alias

### Vercel
- Аккаунт/скоуп: `vtkn1` (CLI-логин `xwaggonx-6207`)
- Проект: **loop**, ID `prj_aq9YOP4THSJbDEinoI0Wk5QjFgdu` (команда `team_AxVJPua7WuXTLKlOKJBO0TnJ`)
- Локальный линк: `.vercel/project.json`
- Деплой в прод: `npx vercel deploy --prod --scope=vtkn1 --yes` (из корня репо)
- Deployment Protection: `all_except_custom_domains` — превью-деплои защищены SSO, production-домены (включая `loopza.vercel.app`) публичны. **Важно**: обычный `vercel alias set` на деплой НЕ обходит защиту — домен нужно добавлять как project domain через API: `POST /v10/projects/{id}/domains {"name":"loopza.vercel.app"}`

### Neon PostgreSQL
- Проект: **loop**, ID `sparkling-glade-90089889`, ветка production `br-bitter-river-b1iyief3`
- Эндпоинт: `ep-winter-moon-b1gv1vb3` (регион eu-central-1), пулер: `ep-winter-moon-b1gv1vb3-pooler.c-5.eu-central-1.aws.neon.tech`
- Свежий connection string можно получить через Neon API/MCP (`store_passwords: true`) — **пароли ротируются, старые перестают работать!**
- В базе 19 таблиц, 234 пользователя. Миграции drizzle: `drizzle/0000..0002`, книга миграций `drizzle.__drizzle_migrations`

### Env-переменные Vercel (Production, все 8 заданы)
`DATABASE_URL` (Neon пулер URL БЕЗ `channel_binding`), `JWT_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

### Критические уроки (не наступать снова!)
1. **Stale password в DATABASE_URL** — если Neon ротировал пароль, приложение падает с DB_UNAVAILABLE/500. Свежий URL брать через Neon API, не из старых конфигов.
2. **Серверлесс + Neon**: в `src/server/db/client.ts` включены `neonConfig.poolQueryViaFetch = true` (одиночные запросы по HTTP — переживают freeze/thaw между инвокациями) и `webSocketConstructor = ws` (для транзакций). Не удалять.
3. **`channel_binding=require` в connection string** не поддерживается драйвером `@neondatabase/serverless` — вырезается в `getConnectionString()`.
4. **Пересоздание проекта Vercel стирает env-переменные и алиасы** — после пересоздания заново выставить все 8 env и перепривязать домен `loopza.vercel.app`.
5. **TCP 5432 заблокирован локально** — `drizzle-kit migrate` локально виснет. Применять миграции HTTP-драйвером: `node scripts/db/apply-migrations-http.mjs` (или через Neon MCP).
6. **Бандл API для Vercel**: `api/index.js` (корень), рерайты `/api/(.*)` → `/api/index.js` в `vercel.json`. Билд: `npm run build` (esbuild `src/server/app.ts`).
7. Проверка живости: `POST /api/auth/login` c существующим пользователем — должен вернуть 200 + JWT (не 401/500/DB_UNAVAILABLE).
8. **`couple_reports.id` без DEFAULT в проде** (text pk в схеме) — drizzle вставляет `values (default, ...)` → NOT NULL violation. В `_triggerCoupleReportIfReady` id задаётся явно: `crypto.randomUUID()`.
9. **Триггер отчёта — ПОСЛЕ `status='completed'` текущей сессии** в `atomicSubmitTestAnswers`, иначе последний сабмит партнёра не засчитывается и `couple_reports` не создаётся никогда.
10. **`coupleId` серверного контура тестов = pairKey** `[login, partnerLogin].sort().join('_')`, выводится из `users.partnerLogin` в `resolveTestCoupleId()`; таблица `couples` в пайплайне тестов не используется и не должна.
11. **`personality_types`** в отчёте заполняется Big Five из 24-шкального профиля: E←s23, A←s5, C←s21, St←s12, O←s24 (см. Module 7 в `psychometrics.calc.ts`).
12. **`POST /api/pair/accept`** требует оба поля `{ fromLogin, toLogin }` (`pairAcceptSchema`); при `gender`-валидации регистрации login ≤ 20 символов. E2E-проверка пайплайна: `npx tsx scripts/e2e/e2e-prod-submit.mts` (пары создаёт `/tmp`-скрипты регистрации; тестовых пользователей `e2*` затем вычищать из БД).

---

Это подробная спецификация для автоматического или полуавтоматического развертывания приложения **Loop** на любой сервер / хостинг (Vercel, Render, Railway, Cloud Run, VPS / Docker).

---

## 1. Структура проекта и стек

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide Icons + PWA
- **Backend**: Node.js + Express + Google GenAI SDK (`@google/genai`)
- **PWA & Web Push**: `manifest.json` (Standalone), `public/sw.js` (Service Worker с обработчиком `push` и `notificationclick`), Web Push API (iOS 16.4+ Safari PWA & Android Chrome)
- **Психологический движок**: `src/utils/psychologyEngine.ts` (Готтман, ЭФТ, Чепмен, Боулби ECR-R, Стернберг)

---

## 2. Переменные окружения (`.env`)

Создайте файл `.env` на основе `.env.example`:

```env
# 1. API ключ Gemini AI (для ИИ-психолога "Сова" и генерации глубоких отчётов)
# Получить бесплатно: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSy..."

# 2. VAPID ключи для Web Push уведомлений (iOS Safari & Android)
# Сгенерировать командой: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="BEl62iEWg..."
VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
VAPID_SUBJECT="mailto:support@loopapp.io"

# 3. URL развернутого приложения
APP_URL="https://your-loop-app.domain.com"
NODE_ENV="production"
PORT=3000
```

---

## 3. Команды для сборки и запуска

### Локальная разработка:
```bash
npm install
npm run dev
```

### Продакшн сборка:
```bash
npm run build
npm start
```
*Команда `npm run build` компилирует статические файлы в `/dist` и бандлит сервер в `dist/server.cjs` через esbuild.*

---

## 4. Как работают Web Push Уведомления на iPhone (iOS Safari)

1. **Требование Apple**: Начиная с iOS 16.4+, пуши работают для PWA, добавленных пользователем на экран «Домой».
2. **Шаги пользователя на iPhone**:
   - Открыть сайт в Safari
   - Нажать кнопку **«Поделиться»** (квадрат со стрелкой вверх)
   - Выбрать **«На экран „Домой“»**
   - Открыть Loop с экрана телефона
   - В разделе «Профиль» нажать **«Разрешить Push»**
3. В приложении уже встроен `IOSInstallPrompt.tsx` и `pushManager.ts`, автоматически подсказывающий пользователю эти шаги.

---

## 5. Эндпоинты Backend API

- `GET /api/health` — проверка статуса сервера и наличия API-ключа.
- `POST /api/ai/chat` — стриминг/ответ ИИ-психолога "Сова" с системным промптом семейной психотерапии.
- `POST /api/ai/generate-report` — генерация глубокого отчёта совместимости и синергии пары.
- `POST /api/ai/date-idea` — генерация персонализированных планов свиданий.
- `POST /api/push/subscribe` — сохранение Web Push подписки клиента.
- `POST /api/push/send-test` — отправка тестового уведомления на устройство.
