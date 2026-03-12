# Подключение проекта к Supabase через CLI

Пошаговая инструкция для Windows (PowerShell).

## 1. Установка Supabase CLI

**Вариант A — через npm (проще):**

```powershell
cd "c:\Users\user\Documents\prof-miniapp"
npm install supabase --save-dev
```

Дальше вызывай CLI через `npx`:

```powershell
npx supabase --version
```

**Вариант B — через Scoop (глобально):**

Если установлен [Scoop](https://scoop.sh):

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

После установки команда будет доступна как `supabase` (без `npx`). В инструкции ниже везде при использовании npm подставляй `npx supabase` вместо `supabase`.

---

## 2. Вход в аккаунт Supabase

```powershell
cd "c:\Users\user\Documents\prof-miniapp"
npx supabase login
```

Откроется браузер — войди в аккаунт Supabase и подтверди доступ. После этого CLI будет привязан к твоему аккаунту.

---

## 3. Узнать Project ID (reference) своего проекта

Зайди в [Supabase Dashboard](https://supabase.com/dashboard) → выбери проект.

**Project ID** — это часть URL проекта:

- URL вида: `https://abcdefghijklmn.supabase.co`
- **Project ref** = `abcdefghijklmn` (строка до `.supabase.co`)

Либо выведи список проектов в терминале:

```powershell
npx supabase projects list
```

В таблице будет колонка с **Project ID** — это и есть `project-ref`.

---

## 4. Привязать локальную папку к проекту (link)

Подставь свой **project-ref** вместо `ТВОЙ_PROJECT_REF`:

```powershell
cd "c:\Users\user\Documents\prof-miniapp"
npx supabase link --project-ref ТВОЙ_PROJECT_REF
```

Пример:

```powershell
npx supabase link --project-ref abcdefghijklmn
```

При запросе пароля БД можно нажать Enter (для деплоя миграций и функций пароль не обязателен, если не используешь `db push` с паролем). При необходимости пароль можно посмотреть в Dashboard → **Project Settings** → **Database** → **Database password**.

После успешного выполнения в папке появится служебная папка `.supabase` (она в `.gitignore`), проект считается привязанным.

---

## 5. Применить миграции (таблицы в БД)

Миграции из папки `supabase/migrations/` нужно применить к удалённой БД:

```powershell
npx supabase db push
```

Если CLI запросит пароль к БД, введи пароль из **Dashboard → Project Settings → Database**.

В результате в твоём проекте Supabase появятся таблицы `users` и `diagnostic_results` (согласно `20250310000001_init.sql`).

---

## 6. Задать секреты для Edge Functions

Секреты задаются в Supabase и используются при вызове функций (например, проверка Telegram, JWT).

**Через Dashboard (рекомендуется):**

1. **Project Settings** → **Edge Functions** → **Secrets** (или **Settings** → **Edge Functions**).
2. Добавь:
   - `TELEGRAM_BOT_TOKEN` — токен бота от BotFather.
   - `JWT_SECRET` — любая длинная случайная строка (одна и та же для обеих функций).

**Через CLI:**

```powershell
npx supabase secrets set TELEGRAM_BOT_TOKEN=твой_токен_бота
npx supabase secrets set JWT_SECRET=случайная_длинная_строка
```

Секреты привязаны к проекту и подставляются в функции при каждом вызове.

---

## 7. Задеплоить Edge Functions

Развернуть обе функции в облако Supabase:

```powershell
npx supabase functions deploy telegram-auth
npx supabase functions deploy diagnostic
```

Либо обе сразу:

```powershell
npx supabase functions deploy
```

После деплоя функции будут доступны по адресам:

- `https://ТВОЙ_PROJECT_REF.supabase.co/functions/v1/telegram-auth`
- `https://ТВОЙ_PROJECT_REF.supabase.co/functions/v1/diagnostic`

Их и нужно использовать как `VITE_API_URL` во фронте (без `/functions/...`), т.е.:

```env
VITE_API_URL=https://ТВОЙ_PROJECT_REF.supabase.co
```

---

## 8. Проверка

1. В корне фронта создай `.env` с `VITE_API_URL=https://ТВОЙ_PROJECT_REF.supabase.co`.
2. Собери проект: `npm run build`.
3. Открой Mini App из Telegram — должен проходить вход и сохранение результатов в Supabase.

---

## Краткая шпаргалка команд

| Действие              | Команда |
|-----------------------|--------|
| Вход                  | `npx supabase login` |
| Список проектов       | `npx supabase projects list` |
| Привязать проект      | `npx supabase link --project-ref ТВОЙ_REF` |
| Применить миграции    | `npx supabase db push` |
| Задеплоить функции    | `npx supabase functions deploy` |
| Задать секрет         | `npx supabase secrets set ИМЯ=значение` |

Если при какой-то команде появится ошибка — скопируй её сюда, разберём по шагам.
