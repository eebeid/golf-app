const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const slug = 'williamsburg-2026';
    const tournament = await prisma.tournament.findUnique({
        where: { slug: slug },
        include: { courses: true }
    });

    if (!tournament) {
        console.log(`Tournament with slug '${slug}' not found.`);
        return;
    }

    console.log(`Found tournament: ${tournament.name} (ID: ${tournament.id})`);
    console.log(`Courses associated with this tournament: ${tournament.courses.length}`);

    if (tournament.courses.length > 0) {
        console.log('Sample courses:');
        tournament.courses.slice(0, 5).forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));
    } else {
        console.log('No courses found directly linked to this tournament.');

        // Check if there are ANY courses in the database
        const allCourses = await prisma.course.findMany();
        console.log(`Total courses in database: ${allCourses.length}`);
        if (allCourses.length > 0) {
            console.log('Sample from all courses:');
            allCourses.slice(0, 3).forEach(c => console.log(`- ${c.name} (TournamentID: ${c.tournamentId})`));
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
