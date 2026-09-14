# Loop 💞

PWA-приложение для пар: психологические тесты (привязанность, языки любви, ЭФТ-циклы, ценности, близость, образ жизни), радар-матрица совместимости, ИИ-психолог «Сова», подарки-заметки, капсулы времени, push-уведомления.

## 🔴 Живое приложение

**https://loopza.vercel.app**

Продакшен: Vercel (проект `loop`, скоуп `vtkn1`) + Neon PostgreSQL (проект `sparkling-glade-90089889`).

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:3000
```

## Деплой в Vercel

```bash
npm run build
npx vercel deploy --prod --scope=vtkn1 --yes
```

Production URL всегда за `loopza.vercel.app` (project domain — привязан к проекту, переживает деплои).

## Стек

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide Icons (PWA, Service Worker)
- **Backend**: Node.js + Express + Drizzle ORM + Neon serverless (`poolQueryViaFetch`)
- **AI**: Google GenAI / Groq / OpenRouter
- **Push**: Web Push (VAPID)

## Документация

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — **актуальная инструкция деплоя + критические уроки** (stale пароли, серверлесс-драйвер, project domain vs alias)
- [`docs/PRD.md`](docs/PRD.md) — продуктовые требования
- [`docs/SECURITY.md`](docs/SECURITY.md) — безопасность
- [`docs/AGENTS.md`](docs/AGENTS.md) — правила для ИИ-агентов
- [`docs/wiki/`](docs/wiki/) — вики
