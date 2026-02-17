
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting migration...");

    // 1. Check/Create Default Tournament
    let t = await prisma.tournament.findUnique({ where: { slug: 'williamsburg-2026' } });
    if (!t) {
        console.log("Creating Williamsburg 2026 tournament...");
        t = await prisma.tournament.create({
            data: {
                name: 'Williamsburg 2026',
                slug: 'williamsburg-2026',
            }
        });
    } else {
        console.log("Found existing Williamsburg 2026 tournament.");
    }

    // 2. Link Settings
    // The default settings row usually has ID 'tournament-settings'
    try {
        const s = await prisma.settings.findUnique({ where: { id: 'tournament-settings' } });
        if (s && !s.tournamentId) {
            await prisma.settings.update({
                where: { id: 'tournament-settings' },
                data: { tournamentId: t.id }
            });
            console.log('Linked Settings to Tournament.');
        }
    } catch (e) {
        console.log('Settings link error (may be benign):', e.message);
    }

    // 3. Link Players
    // We update all players that have NULL tournamentId
    const pUpdate = await prisma.player.updateMany({
        where: { tournamentId: null },
        data: { tournamentId: t.id }
    });
    console.log(`Linked ${pUpdate.count} orphaned players.`);

    // 4. Link Messages
    const mUpdate = await prisma.message.updateMany({
        where: { tournamentId: null },
        data: { tournamentId: t.id }
    });
    console.log(`Linked ${mUpdate.count} orphaned messages.`);

    // 5. Link Photos
    const phUpdate = await prisma.photo.updateMany({
        where: { tournamentId: null },
        data: { tournamentId: t.id }
    });
    console.log(`Linked ${phUpdate.count} orphaned photos.`);

    // 6. Link TeeTimes
    const ttUpdate = await prisma.teeTime.updateMany({
        where: { tournamentId: null },
        data: { tournamentId: t.id }
    });
    console.log(`Linked ${ttUpdate.count} orphaned tee times.`);

    console.log("Migration complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
