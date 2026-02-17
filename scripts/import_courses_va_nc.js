
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();
const CSV_FILE = path.join(__dirname, '../va_nc_golf_courses.csv');

async function main() {
    // 1. Get the target tournament (Williamsburg 2026)
    const tournament = await prisma.tournament.findUnique({
        where: { slug: 'williamsburg-2026' }
    });

    if (!tournament) {
        console.log("Tournament 'williamsburg-2026' not found.");
        return;
    }

    // Removed redundant array check and redeclaration
    console.log(`Importing courses into tournament: ${tournament.name} (${tournament.id})`);

    // 2. Read and parse CSV
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`CSV file not found at ${CSV_FILE}`);
        return;
    }

    const fileContent = fs.readFileSync(CSV_FILE, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });

    console.log(`Found ${records.length} courses in CSV.`);

    // 3. Insert each course
    let count = 0;
    for (const record of records) {
        const name = record.name;
        const address = record.formatted_address;

        // Skip if name is empty
        if (!name) continue;

        // Check availability of par/tees? CSV doesn't have it. Default to 72.

        // Check if course already exists in this tournament to avoid dupes
        const existing = await prisma.course.findFirst({
            where: {
                tournamentId: tournament.id,
                name: name
            }
        });

        if (!existing) {
            await prisma.course.create({
                data: {
                    name: name,
                    address: address,
                    par: 72,
                    tournamentId: tournament.id,
                    // Store extra info in tees JSON as metadata for now if needed
                    tees: {
                        scorecard_url: record.scorecard_url,
                        google_maps: record.google_maps_url,
                        website: record.website,
                        phone: record.phone_number
                    }
                }
            });
            count++;
            process.stdout.write('.');
        }
    }

    console.log(`\nImported ${count} new courses.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
