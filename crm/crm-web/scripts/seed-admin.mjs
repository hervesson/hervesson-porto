// Cria/atualiza o usuário admin do painel a partir das envs ADMIN_EMAIL e
// ADMIN_PASSWORD_HASH. Roda no start do container (idempotente).
import { PrismaClient } from "@prisma/client";

const email = process.env.ADMIN_EMAIL;
const passHash = process.env.ADMIN_PASSWORD_HASH;

if (!email || !passHash) {
  console.log("  ADMIN_EMAIL/ADMIN_PASSWORD_HASH não definidos — pulando seed.");
  process.exit(0);
}

const prisma = new PrismaClient();

try {
  await prisma.user.upsert({
    where: { email },
    update: { passHash },
    create: { email, passHash },
  });
  console.log(`  Usuário admin garantido: ${email}`);
} catch (err) {
  console.error("  Falha ao criar admin:", err.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
