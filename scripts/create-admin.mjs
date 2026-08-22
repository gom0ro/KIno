import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(_scrypt);
const prisma = new PrismaClient();

const EMAIL = process.argv[2] ?? "admin@kino.local";
const PASSWORD = process.argv[3] ?? "admin123";
const NAME = process.argv[4] ?? "Администратор";

async function main() {
  const exists = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (exists) {
    await prisma.user.update({
      where: { email: EMAIL },
      data: { role: "admin" },
    });
    console.log(`OK ${EMAIL} уже существует — роль обновлена на admin`);
    return;
  }
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(PASSWORD, salt, 64);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: NAME,
      passwordHash: `${salt}:${key.toString("hex")}`,
      role: "admin",
    },
  });
  console.log(`OK админ создан: ${user.email} / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
