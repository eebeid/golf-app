require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const players = await prisma.player.findMany({
        where: {
            name: {
                contains: 'Neal',
                mode: 'insensitive'
            }
        },
        include: {
            tournament: true
        }
    });

    console.log("Found players matching 'Neal':", players.length);
    players.forEach(p => {
        console.log(`\nPlayer: "${p.name}"`);
        console.log(`ID: ${p.id}`);
        console.log(`Tournament: ${p.tournament?.name}`);
        console.log(`Email stored in DB: "${p.email}"`);
        console.log(`Email length: ${p.email ? p.email.length : 0}`);
    });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
