const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const slug = 'williamsburg-2026';
    const courseName = 'Kingsmill Resort - River Course';

    const tournament = await prisma.tournament.findUnique({
        where: { slug: slug }
    });

    if (!tournament) return;

    // Force add even if "Kingsmill" exists (since Plantation course exists but User wants River course)
    // Check EXACT match to avoid duplicates of itself
    const existingRiver = await prisma.course.findFirst({
        where: {
            tournamentId: tournament.id,
            name: courseName
        }
    });

    if (existingRiver) {
        console.log(`Exact match for ${courseName} already exists.`);
        return;
    }

    console.log(`Adding ${courseName} to ${tournament.name}...`);

    await prisma.course.create({
        data: {
            name: courseName,
            address: '1010 Kingsmill Rd, Williamsburg, VA 23185',
            par: 71,
            tournamentId: tournament.id,
            tees: [],
            holes: []
        }
    });

    console.log('Course added successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
