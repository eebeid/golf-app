const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database from JSON files...');

    const dataDir = path.join(__dirname, '../data');

    // 1. Players
    const playersFile = path.join(dataDir, 'players.json');
    if (fs.existsSync(playersFile)) {
        const players = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
        for (const p of players) {
            await prisma.player.upsert({
                where: { id: String(p.id) },
                update: {},
                create: {
                    id: String(p.id),
                    name: p.name,
                    handicap: p.handicap || 0,
                    registeredAt: p.registeredAt ? new Date(p.registeredAt) : new Date(),
                },
            });
        }
        console.log(`Seeded ${players.length} players.`);
    }

    // 2. Scores
    const scoresFile = path.join(dataDir, 'scores.json');
    if (fs.existsSync(scoresFile)) {
        const scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
        for (const s of scores) {
            // Need UUID for Score ID, usually JSON doesn't have it for scores if it was array
            // But we can just create them anew or try to preserve if we had IDs.
            // The JSON schema was: { playerId, hole, score, courseId }
            // We'll just create them.

            // Prevent duplicates if running seed multiple times? 
            // Schema has @@unique([playerId, courseId, hole]).

            try {
                await prisma.score.create({
                    data: {
                        playerId: String(s.playerId),
                        courseId: s.courseId || 1, // Default to 1 if missing
                        hole: parseInt(s.hole),
                        score: parseInt(s.score)
                    }
                });
            } catch (e) {
                // Likely duplicate, ignore
            }
        }
        console.log(`Seeded scores.`);
    }

    // 3. Photos
    const photosFile = path.join(dataDir, 'photos.json');
    if (fs.existsSync(photosFile)) {
        const photos = JSON.parse(fs.readFileSync(photosFile, 'utf8'));
        for (const p of photos) {
            await prisma.photo.create({
                data: {
                    url: p.url,
                    caption: p.caption,
                    // id: p.id // if exists
                }
            });
        }
        console.log(`Seeded photos.`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
