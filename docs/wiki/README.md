# Инструкция по переносу материалов в GitHub Wiki

В этой директории подготовлен полный комплект страниц для базы знаний (GitHub Wiki) проекта **Loop**.

---

## Способ 1. Автоматический перенос через Git (Рекомендуемый)

GitHub предоставляет отдельный Git-репозиторий для Wiki каждого проекта:
`https://github.com/DVtkn/loop.wiki.git`

Для быстрой публикации всех страниц:

1. Склонируйте Wiki-репозиторий локально:
   ```bash
   git clone https://github.com/DVtkn/loop.wiki.git
   cd loop.wiki
   ```

2. Скопируйте все markdown-файлы из папки `docs/wiki/*.md` в корень репозитория `loop.wiki`:
   ```bash
   cp /path/to/loop/docs/wiki/*.md .
   ```
   *(Файл `README.md` из `docs/wiki/` копировать в wiki.git не нужно)*

3. Зафиксируйте и отправьте изменения:
   ```bash
   git add .
   git commit -m "docs: deploy full Loop knowledge base and architecture wiki v3.0.0"
   git push origin master
   ```

Все страницы мгновенно появятся во вкладке **Wiki** репозитория на GitHub с настроенным боковым меню `_Sidebar.md`.

---

## Способ 2. Ручной перенос через веб-интерфейс GitHub

1. Откройте репозиторий [DVtkn/loop](https://github.com/DVtkn/loop) на GitHub и перейдите во вкладку **Wiki**.
2. Если Wiki ещё не инициализирована, нажмите **Create the first page** и назовите её `Home`. Вставьте содержимое файла `Home.md`.
3. Для каждой следующей страницы нажмите **New Page** в правом верхнем углу:
   - В поле заголовка введите точное имя страницы (например, `Product-Overview`, `Architecture`, `Getting-Started`).
   - Вставьте содержимое соответствующего `.md` файла.
   - Сохраните страницу нажатием **Save Page**.
4. Создайте служебную страницу `_Sidebar` и вставьте содержимое `_Sidebar.md` — она автоматически закрепится как боковая панель навигации по всем страницам.

---

## Список подготовленных страниц

| Имя файла | Название в GitHub Wiki | Назначение |
| :--- | :--- | :--- |
| `Home.md` | `Home` | Главная витрина, аннотация продукта, оглавление и ссылки на деплой. |
| `_Sidebar.md` | `_Sidebar` | Боковая панель быстрой навигации между всеми страницами. |
| `Product-Overview.md` | `Product-Overview` | Миссия, 3 персоны пользователей, матрица приоритетов P0/P1/P2. |
| `Architecture.md` | `Architecture` | Схема компонентов (Mermaid), архитектура Тамагочи, Haptics/Web Audio, Fail-Fast. |
| `Getting-Started.md` | `Getting-Started` | Пошаговое руководство по установке, настройке .env и запуску тестов. |
| `API-Reference.md` | `API-Reference` | Таблица всех серверных эндпоинтов по доменным модулям (включая `/api/pet` и `/api/tests`). |
| `Design-System.md` | `Design-System` | Большая Красная Кнопка, ретро-консоль Тамагочи, 4 базовых блока, мобильная эргономика. |
| `Testing-and-QA.md` | `Testing-and-QA` | DoD, Vitest, Playwright E2E, мобильный юзабилити-аудит (iPhone 15 Pro). |
| `Security.md` | `Security` | Секреты, криптография, ротация JWT, IDOR Prevention и чек-лист деплоя. |
| `Roadmap.md` | `Roadmap` | Завершённые ворота v3.0.0 и будущие инициативы (виджеты, аудио-инсайты). |
