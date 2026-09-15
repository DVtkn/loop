# Loop 💞

PWA-приложение для пар: психологические тесты (привязанность, языки любви, ЭФТ-циклы, ценности, близость, образ жизни, Big Five), радар-матрица совместимости, couple-отчёт, ИИ-психолог «Сова», подарки-заметки, капсулы времени, push-уведомления.

## 🔴 Живое приложение

**https://loopza.vercel.app**

Продакшен: Vercel (проект `loop`, скоуп `vtkn1`) + Neon PostgreSQL (проект `sparkling-glade-90089889`).

## Быстрый старт

```bash
npm install
cp .env.example .env   # заполните DATABASE_URL и JWT_SECRET
npm run dev            # http://localhost:3000 (Express API + Vite)
```

### Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | локальный сервер (`tsx server.ts`) |
| `npm run build` | Vite-бандл клиента + esbuild-бандлы сервера (`dist/server.cjs`, `api/index.js` для Vercel) |
| `npm run test` | юнит-тесты Vitest (`tests/unit/`) |
| `npm run test:e2e` | Playwright (`e2e/`, нужен запущенный прод или `BASE_URL`) |
| `npm run test:tsc` | проверка типов (`tsc --noEmit`) |
| `npm run test:integration` | интеграционный прогон lifecycle-сценария (`scripts/integration/`) |
| `node scripts/db/apply-migrations-http.mjs` | применить drizzle-миграции к Neon через HTTP (TCP 5432 заблокирован локально) |
| `npx tsx scripts/e2e/e2e-prod-submit.mts` | E2E-прогон всех 8 тестов парой на проде |
| `npx vercel deploy --prod --scope=vtkn1 --yes` | прод-деплой |

## Карта проекта

```
api/index.js            ← сгенерированный Vercel API-бандл (npm run build), не править руками
server.ts               ← локальный dev-вход (импортирует src/server)
drizzle/                ← SQL-миграции (0000…0003), применяются scripts/db/

src/
  main.tsx, App.tsx     ← точка входа React-клиента
  components/           ← вьюхи верхнего уровня (AuthView, DashboardView, ChatView, ReportView, …)
                            + подпапки по доменам: tests/, radar/, photo/, dashboard/, ui/
  context/              ← CoupleContext + hooks/* (авторизация, XP, тачи, пэйринг)
  api/                  ← клиентские API-слои (auth, pair, couple, chat, photos)
  utils/                ← клиентская логика: psychologyEngine (пересчёт радара), pushManager, safeStorage
  data/                 ← questionBank.ts — банк вопросов всех 8 тестов (единственный источник)
  shared/tests.registry.ts ← реестр тестов: ID, категории, кол-во вопросов (должен совпадать с questionBank)
  types.ts              ← клиентские типы

  server/
    app.ts              ← Express-приложение: подключение всех модулей-роутеров (бандлится в api/index.js)
    index.ts            ← dev-обёртка (старт + статика)
    core/               ← config.ts (env), logger.ts, types.ts (DbUser/toSafeUser)
    db/                 ← schema.ts (Drizzle) + client.ts (Neon poolQueryViaFetch — не удалять)
    modules/            ← по одному на домен: routes.ts (HTTP) + service.ts (логика)
      auth/             ← регистрация/вход (bcrypt, JWT)
      pairing/          ← запросы пары, accept (схема: { fromLogin, toLogin })
      tests/            ← ★ ядро: tests.service.ts (atomicSubmitTestAnswers, генерация couple_reports),
                            psychometrics.calc.ts (24 шкалы → Big Five), report.matrix.ts
      analytics/        ← read-API couple-report / overview (только своя пара, иначе 403)
      chat/ couple-data/ photos/ realtime/  ← остальные домены
    services/           ← общие серверные сервисы: aiService (Groq), analytics (метрики), insights,
                            pairService, storageService
    shared/             ← middleware/ (auth, rate limiter, errorHandler, requirePairOwnership),
                            validators/ (zod-схемы), errors/, utils/

tests/unit/             ← Vitest (jsdom)
scripts/
  db/                   ← применение миграций
  e2e/                  ← прогон пайплайна тестов на проде
  integration/          ← ручные интеграционные проверки (DB, чат, Groq, lifecycle)
  verify/               ← smoke-скрипты
e2e/                    ← Playwright-спеки (мастер-джурни пары)
docs/                   ← DEPLOYMENT.md, PRD.md, SECURITY.md, AGENTS.md, wiki/
```

## Как устроен ключевой пайплайн (тесты → отчёт)

1. Оба партнёра сдают 8 тестов: `POST /api/tests/submit` → `atomicSubmitTestAnswers` (одна транзакция: ответы → сессия `completed` → пересчёт 24-шкального профиля).
2. `coupleId` сервера = **pairKey**: `[login, partnerLogin].sort().join('_')`, выводится из JWT + `users.partnerLogin` (таблица `couples` в этом контуре не участвует).
3. Когда у обоих сессия `completed`, триггер создаёт/обновляет строку `couple_reports` (PK `id` — явный `crypto.randomUUID()`, `couple_id` unique → upsert; радар 6 сфер + `personality_types` Big Five).
4. Чтение: `GET /api/analytics/couple-report/:pairKey` — только участникам пары (чужая пара → 403).

⚠️ Порядок «сначала `completed`, потом триггер» критичен — см. «Критические уроки» в `docs/DEPLOYMENT.md`.

## Переменные окружения

`DATABASE_URL` (Neon), `JWT_SECRET`, `PORT`, `NODE_ENV`, `VERCEL`, `ALLOWED_ORIGINS`, `GROQ_API_KEY`, `GEMINI_API_KEY`, VAPID-ключи для push. Референс — `.env.example`.

## Документация

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — деплой + **критические уроки релиза**
- [`docs/PRD.md`](docs/PRD.md) — продуктовые требования
- [`docs/SECURITY.md`](docs/SECURITY.md) — безопасность
- [`docs/AGENTS.md`](docs/AGENTS.md) — правила для ИИ-агентов (SSOT)
- [`docs/wiki/`](docs/wiki/) — расширенная вики

## Статус релиза (проверено 2026-09-15)

Продакшен-контур verified end-to-end: 16/16 сабмитов, генерация couple_reports, изоляция партнёров, Playwright мастер-джурни зелёный. Ограничения беты — в `docs/DEPLOYMENT.md`.
