# VibeTeam

Русско-английская платформа для поиска напарников и командной разработки. Next.js, TypeScript, Tailwind CSS, Supabase.

## Запуск локально

```bash
npm install
Copy-Item .env.example .env.local # PowerShell; на macOS/Linux: cp .env.example .env.local
npm run dev
```

Откройте http://localhost:3000. Без Supabase приложение запускается с демо-проектами; созданные проекты хранятся в localStorage этого браузера.

## Supabase

1. Создайте Supabase project.
2. Выполните `supabase/schema.sql` в SQL Editor.
3. Добавьте URL и публичный publishable/anon ключ в `.env.local` (имена переменных в `.env.example`).
4. Включите Email/Password в Authentication → Providers.

Секретный/service-role ключ нельзя помещать в клиентское приложение или GitHub.

## Деплой

Импортируйте репозиторий в Vercel и задайте те же две переменные окружения. Для рабочего Supabase-входа и базы нужен хостинг Next.js; GitHub Pages не запускает серверную часть Next.js.

## Возможности MVP

- RU/EN переключатель и адаптивный интерфейс.
- Лента демо-проектов, поиск, фильтры «напарник/команда».
- Создание проекта и отправка отклика.
- Email/password вход через Supabase; demo mode без ключей.
- Таблицы профилей, проектов и заявок с RLS: `supabase/schema.sql`.
