# Деплой на Vercel

## 1. База данных (Neon)

1. Зарегистрируйтесь на [neon.tech](https://neon.tech) (бесплатный план).
2. Создайте проект → регион выбирайте ближайший (Frankfurt).
3. Скопируйте **connection string** вида:
   `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

## 2. Vercel Blob (загрузка файлов)

1. В дашборде Vercel: Storage → Create Database → **Blob**.
2. Токен `BLOB_READ_WRITE_TOKEN` можно подключить к проекту автоматически
   (Storage → Connect to Project) или добавить переменную вручную.

Без токена загрузка аватарок/видео работает только локально (на диск).

## 3. Переменные окружения

В Vercel: Project Settings → Environment Variables:

| Переменная | Значение | Обязательна |
|---|---|---|
| `DATABASE_URL` | строка подключения из Neon | да |
| `AUTH_SECRET` | случайная длинная строка | да |
| `NEXT_PUBLIC_SITE_URL` | `https://ваш-проект.vercel.app` | да |
| `BLOB_READ_WRITE_TOKEN` | из Vercel Blob | для загрузок |

## 4. Первый деплой

```bash
# в репозитории проекта
npx vercel login
npx vercel link          # привязать папку к проекту
git push                 # или npx vercel --prod из этой папки
```

## 5. Инициализация базы (один раз)

Локально, подставив продовский DATABASE_URL из Neon:

```powershell
$env:DATABASE_URL = "postgresql://...neon..."; npx prisma db push
```

Затем создать админа и демо-зрителей той же командой с тем же URL:

```powershell
$env:DATABASE_URL = "postgresql://..."; npm run admin    # admin@kino.local / admin123
$env:DATABASE_URL = "postgresql://..."; npm run seed     # топ-50 демо-зрителей
```

## Локальная разработка

`.env` → тот же Neon-проект (или отдельная ветка `development` в нём):

```powershell
npm install        # postinstall сам выполнит prisma generate
npm run db:push    # применить схему
npm run admin      # пересоздать админа
npm run dev
```

## Ограничения облачной версии

- Каталог фильмов хранится статично (`data/movies.json`). Добавление/удаление
  фильмов через админку на Vercel вернёт 501 — каталог правится локально,
  затем новый деплой.
- Загруженные видео и аватарки живут в Blob, поэтому переживают деплои.
- Сессии подписаны cookie (`AUTH_SECRET`) — stateless, серверу ничего не нужно.
