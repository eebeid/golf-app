import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.tournament.findFirst({
    where: { slug: 'williamsburg-golf-tournament-2026' },
    include: { lodging: { include: { players: true } } }
  });
  console.log(JSON.stringify(t?.lodging, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
