const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const COLORS = [
  "#e50914", "#e11d48", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

const MOVIE_IDS = [
  "glubina", "hroniki-pustoty", "poslednij-rassvet", "ten-goroda",
  "mechty-na-volne", "krasnyy-rassvet", "severnyy-veter", "tigry-nizko",
  "zvezdopad", "vremya-nastalo", "belyy-shum", "okno-v-leto",
  "put-doma", "lunnaya-sonata",
];

const VIEWERS = [
  { name: "Дмитрий Волков", hours: 1420 },
  { name: "Марина Кузнецова", hours: 1180 },
  { name: "Киноман 2007", hours: 990 },
  { name: "Ольга Петрова", hours: 845 },
  { name: "Игорь Соколов", hours: 710 },
  { name: "Настя Ветрова", hours: 580 },
  { name: "Тимур Хайдаров", hours: 462 },
  { name: "Света Лапина", hours: 351 },
  { name: "Павел Гущин", hours: 244 },
  { name: "Виктория Р.", hours: 168 },
  { name: "Лена Ким", hours: 112 },
  { name: "Артём Морозов", hours: 64 },
];

function dayString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const exists = await p.user.findFirst({
    where: { email: { startsWith: "viewer" } },
    select: { id: true },
  });
  if (exists) {
    console.log("Демо-зрители уже созданы — пропуск");
    return;
  }

  let i = 0;
  for (const v of VIEWERS) {
    const email = `viewer${++i}@demo.local`;
    const user = await p.user.create({
      data: {
        email,
        name: v.name,
        passwordHash: "demo:no-login",
        avatarColor: COLORS[i % COLORS.length],
      },
    });

    const count = 4 + Math.floor(Math.random() * 11);
    const movies = [...MOVIE_IDS].sort(() => Math.random() - 0.5).slice(0, count);
    const totalSeconds = v.hours * 3600;
    const weights = movies.map(() => 0.3 + Math.random());
    const wSum = weights.reduce((a, b) => a + b, 0);

    await p.watchStat.createMany({
      data: movies.map((movieId, k) => {
        const recent = Math.random() < 0.3;
        return {
          userId: user.id,
          movieId,
          day: dayString(recent ? Math.floor(Math.random() * 6) : 7 + Math.floor(Math.random() * 53)),
          seconds: Math.round((weights[k] / wSum) * totalSeconds),
        };
      }),
    });
    console.log(`OK ${email} — ${v.name}, ${v.hours} ч`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
