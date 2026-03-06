const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.settings.findMany();
  console.log("SETTINGS:", JSON.stringify(settings, null, 2));
  const t = await prisma.tournament.findMany({ include: { courses: true, teeTimes: true } });
  console.log("TOURNAMENTS:", JSON.stringify(t, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
