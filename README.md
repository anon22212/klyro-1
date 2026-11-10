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

## Google sign-in

1. In Supabase, open Authentication → Providers → Google and enable it.
2. Create OAuth credentials in Google Cloud Console. Set the authorized redirect URI to the Supabase callback URL shown on the provider settings page (usually `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Add the Google Client ID and Client Secret in Supabase provider settings. Do not put the client secret in this repository.
4. In Supabase Authentication → URL Configuration, add the deployed site URL and local `http://localhost:3000` as allowed redirect URLs.
5. The sign-in modal includes “Continue with Google”.

## Admin access

Admin access should be granted to the requested account through a server-side role in Supabase, never by shipping a shared password or trusting a client-side email check. Tell the maintainer which email should receive admin access; then apply the role migration for that verified user. Set a personal password via Supabase sign-up or password reset—do not share it in chat.

The admin dashboard/role migration still needs the maintainer email before it can be safely configured.
