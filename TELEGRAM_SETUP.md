# Запуск приложения в Telegram и сохранение в БД

## 1. Telegram Bot и Mini App

1. Открой [@BotFather](https://t.me/BotFather) в Telegram, создай бота командой `/newbot`, сохрани **токен бота** (например `123456:ABC-DEF...`).
2. В BotFather для своего бота: **Menu Bot** → **Bot Settings** → **Menu Button** (или **Configure**). Укажи URL своей Mini App (например `https://твой-сайт.vercel.app`). Либо задай команду `/start` с кнопкой, открывающей Web App.

## 2. Supabase

1. Зайди на [supabase.com](https://supabase.com), создай проект.
2. В проекте: **SQL Editor** → выполни содержимое файла `supabase/migrations/20250310000001_init.sql` (создаст таблицы `users` и `diagnostic_results`).
3. **Project Settings** → **API**: скопируй **Project URL** (это твой `VITE_API_URL`, например `https://xxxxx.supabase.co`).
4. **Edge Functions** → создай две функции: `telegram-auth` и `diagnostic`, скопировав код из папок `supabase/functions/telegram-auth` и `supabase/functions/diagnostic` (или задеплой через CLI).
5. Секреты для Edge Functions (в Supabase: **Project Settings** → **Edge Functions** → **Secrets**):
   - `TELEGRAM_BOT_TOKEN` — токен бота из BotFather.
   - `JWT_SECRET` — любая длинная случайная строка (один и тот же для обеих функций), например сгенерируй: `openssl rand -hex 32`.

## 3. Фронт (переменные окружения)

В корне проекта создай файл `.env` (не коммить в git):

```
VITE_API_URL=https://ТВОЙ_PROJECT_ID.supabase.co
```

После этого собери приложение: `npm run build`. При открытии Mini App из Telegram запросы пойдут на твои Edge Functions.

## 4. Деплой фронта

Выложи папку `dist` (после `npm run build`) на хостинг с HTTPS (Vercel, Netlify и т.д.). URL этого сайта укажи в настройках бота как URL Mini App.

## 5. Проверка

- Открой бота в Telegram и запусти Mini App.
- Должен произойти автоматический вход (по initData), затем ЛК и диагностика.
- Результаты диагностики сохраняются в Supabase в таблице `diagnostic_results` и привязаны к пользователю в `users`.

## Режим без Telegram (локально)

Без переменной `VITE_API_URL` или при открытии приложения не из Telegram используется локальный режим: форма входа (имя, возраст) и сохранение результатов в `localStorage`. Так можно разрабатывать и тестировать без бота и Supabase.
