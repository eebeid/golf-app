const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const slug = 'williamsburg-2026';
    const courseName = 'Kingsmill Resort - River Course'; // Using specific name usually found in APIs or just 'Kingsmill River'

    const tournament = await prisma.tournament.findUnique({
        where: { slug: slug }
    });

    if (!tournament) {
        console.log(`Tournament '${slug}' not found.`);
        return;
    }

    // Check if it already exists
    const existing = await prisma.course.findFirst({
        where: {
            tournamentId: tournament.id,
            name: { contains: 'Kingsmill', mode: 'insensitive' }
        }
    });

    if (existing) {
        console.log(`Course similar to Kingsmill already exists: ${existing.name}`);
        return;
    }

    console.log(`Adding ${courseName} to ${tournament.name}...`);

    await prisma.course.create({
        data: {
            name: courseName,
            address: '1010 Kingsmill Rd, Williamsburg, VA 23185',
            par: 71, // River course is usually Par 71
            tournamentId: tournament.id,
            tees: [], // Will be enriched later potentially or manually edited
            holes: []
        }
    });

    console.log('Course added successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
