# КИНО

Демо-онлайн-кинотеатр: Next.js 14, Prisma/PostgreSQL, HLS-плеер, рейтинги,
списки просмотра, комментарии, топ зрителей, админка, PWA.

## Локальный запуск

```
npm install
cp .env.example .env   # указать DATABASE_URL (Neon/PostgreSQL)
npm run db:push
npm run admin          # admin@kino.local / admin123
npm run seed           # демо-зрители для топа
npm run dev
```

Деплой: см. [DEPLOY.md](./DEPLOY.md).
