const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting logo URL update...');
    const result = await prisma.settings.updateMany({
        where: {
            OR: [
                { logoUrl: '/images/logo.png' },
                { logoUrl: null },
                { logoUrl: '' }
            ]
        },
        data: {
            logoUrl: '/images/pinplaced_primary_logo_transparent.png'
        }
    });
    console.log(`Updated ${result.count} settings records.`);
}

main()
    .catch(e => {
        console.error('Error updating logos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
