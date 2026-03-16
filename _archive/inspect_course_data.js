const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const tournament = await prisma.tournament.findFirst({
    where: { slug: 'williamsburg-golf-tournament-2026' },
    include: { courses: true, settings: true }
  });
  console.log("Settings Round Courses:", tournament.settings.roundCourses);
  console.log("Settings Round Dates:", tournament.settings.roundDates);
  console.log("Courses IDs:", tournament.courses.map(c => ({id: c.id, name: c.name})));
}
run().catch(console.error).finally(() => prisma.$disconnect());
