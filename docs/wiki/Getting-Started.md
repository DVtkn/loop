> Эта страница предназначена для разработчиков, которые клонировали проект и хотят развернуть локальное окружение или выполнить проверку кода Loop v3.0.0.

# Быстрый старт для разработчика (Getting Started)

Данное руководство позволит поднять проект **Loop** на локальной машине за 5 минут.

---

## 1. Системные требования

- **Node.js**: версия `18.x` или `20.x LTS` (рекомендуется).
- **Менеджер пакетов**: `npm` (версия 9+) или `bun`.
- **Git**: для клонирования и управления ветками.

---

## 2. Пошаговая установка

### Шаг 1. Клонирование репозитория

```bash
git clone https://github.com/DVtkn/loop.git
cd loop
```

### Шаг 2. Установка зависимостей

```bash
npm install
```

### Шаг 3. Настройка переменных окружения

Скопируйте пример файла конфигурации:

```bash
cp .env.example .env
```

Минимальный набор для локального запуска в `.env`:

```env
# Окружение (development / production)
NODE_ENV=development

# Порт локального сервера
PORT=3000

# Секрет подписи JWT токенов
JWT_SECRET=dev_jwt_secret_loop_local_development_only_123456

# Подключение к Neon PostgreSQL (опционально для dev, обязательно для prod)
# DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/loop?sslmode=require

# Ключ Groq API для реальных ответов ИИ-психолога Совы (опционально)
# GROQ_API_KEY=gsk_...
```

---

## 3. Запуск приложения

Запустите сервер в режиме разработки:

```bash
npm run dev
```

Приложение станет доступно по адресу: **`http://localhost:3000`** (Express API + Vite HMR).

---

## 4. Проверка качества и тестирование

Перед отправкой изменений в репозиторий обязательно запустите проверки:

```bash
# 1. Строгая проверка типов TypeScript
npm run test:tsc

# 2. Юнит-тесты Vitest (изоляция данных, скоринг тестов)
npm run test

# 3. Полная сборка клиента и сервера
npm run build
```

---

## 5. Полезные скрипты

| Скрипт | Описание |
| :--- | :--- |
| `node scripts/db/apply-migrations-http.mjs` | Применение Drizzle-миграций к Neon через HTTP-драйвер |
| `npx tsx scripts/e2e/e2e-prod-submit.mts` | Сквозной E2E-прогон сдачи 8 тестов на продакшене |
| `npx vercel deploy --prod --scope=vtkn1 --yes` | Деплой на production Vercel |

*Подробнее о структуре модулей читайте в [Архитектуре (Architecture)](Architecture).*
