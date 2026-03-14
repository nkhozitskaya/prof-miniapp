import { next } from '@vercel/functions'

const TELEGRAM_UA = /Telegram|TelegramBot/i

function fallbackHtml(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Профориентация</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; text-align: center; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 0.9375rem; margin-bottom: 1.5rem; }
    a { display: inline-block; background: #3b82f6; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; }
    a:active { opacity: 0.9; }
  </style>
</head>
<body>
  <h1>Не удалось открыть в Telegram</h1>
  <p>Откройте приложение в браузере — там всё будет работать.</p>
  <a href="${baseUrl}">Открыть в браузере</a>
</body>
</html>`
}

export const config = {
  matcher: ['/', '/auth', '/profile', '/diagnostic'],
}

export default function middleware(request: Request): Response {
  // Пробуем снова грузить полное приложение в Telegram (bootstrap + исправленный telegram-auth).
  // Чтобы вернуть заглушку «Открыть в браузере», раскомментируйте блок ниже.
  /*
  const url = new URL(request.url)
  if (url.searchParams.has('app')) return next()
  const ua = request.headers.get('user-agent') ?? ''
  if (!TELEGRAM_UA.test(ua)) return next()
  return new Response(fallbackHtml(url.origin), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  */
  return next()
}
