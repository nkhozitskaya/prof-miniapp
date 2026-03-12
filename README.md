# Профориентация — Telegram Mini App

Мини-приложение для профориентации подростков: диагностика (11 станций), личный кабинет, сохранение результатов в БД. Работает в Telegram и локально в браузере.

## Стек

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Supabase (PostgreSQL, Edge Functions)
- **Telegram:** Web App SDK (авторизация по initData)

## Быстрый старт (локально)

```bash
npm install
npm run dev
```

Открой http://localhost:5173 — форма входа и сохранение в `localStorage` (режим без Telegram).

## Подключение к Supabase и GitHub

### 1. Репозиторий на GitHub

- Создай репозиторий на GitHub (например `prof-miniapp`).
- В папке проекта выполни:

```bash
git init
git add .
git commit -m "Initial commit: prof miniapp + Supabase"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/prof-miniapp.git
git push -u origin main
```

### 2. Подключение Supabase через CLI (рекомендуется)

Если не получается подключить репозиторий к Supabase через веб-интерфейс, используй **CLI** — полная пошаговая инструкция в **[SUPABASE_CLI.md](./SUPABASE_CLI.md)**.

Кратко:

```bash
npm install supabase --save-dev
npx supabase login
npx supabase link --project-ref ТВОЙ_PROJECT_REF
npx supabase db push
npx supabase functions deploy
```

Секреты `TELEGRAM_BOT_TOKEN` и `JWT_SECRET` задай в Dashboard → Edge Functions → Secrets или через `npx supabase secrets set`.

### 3. Миграции и таблицы

- **Через CLI:** `npx supabase db push` (см. [SUPABASE_CLI.md](./SUPABASE_CLI.md)).
- **Вручную:** в Supabase → **SQL Editor** выполни содержимое `supabase/migrations/20250310000001_init.sql`.

### 4. Edge Functions и секреты

- Деплой через CLI: `npx supabase functions deploy` (подробнее в [SUPABASE_CLI.md](./SUPABASE_CLI.md)).
- Секреты: **Dashboard** → **Edge Functions** → **Secrets** — добавь `TELEGRAM_BOT_TOKEN` и `JWT_SECRET`.

### 5. Переменные окружения для сборки фронта

В GitHub при использовании Vercel/Netlify или в локальной сборке задай:

- `VITE_API_URL` = **Project URL** из Supabase (например `https://xxxxx.supabase.co`).

Файл `.env` в репозиторий **не коммитить** (уже в `.gitignore`). На Vercel/Netlify переменные задаются в настройках проекта.

## Структура репозитория

```
prof-miniapp/
├── src/
│   ├── routes/          # Страницы: Auth, Profile, Diagnostic
│   ├── hooks/            # useUser, useDiagnostic, useDiagnosticResults
│   ├── lib/              # telegram, api, storage
│   ├── data/             # 11 станций диагностики
│   └── utils/             # Подсчёт баллов и зон
├── supabase/
│   ├── migrations/       # SQL: users, diagnostic_results
│   └── functions/       # Edge Functions: telegram-auth, diagnostic
├── .env.example         # Пример переменных (без секретов)
├── TELEGRAM_SETUP.md    # Подробная настройка бота и Mini App
└── README.md
```

## Скрипты

| Команда        | Описание              |
|----------------|------------------------|
| `npm run dev`  | Запуск dev-сервера    |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Просмотр сборки     |

## Документация

- **TELEGRAM_SETUP.md** — настройка бота в Telegram, URL Mini App и проверка работы.
