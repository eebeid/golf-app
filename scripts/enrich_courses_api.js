
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_KEY = 'UTHSQ5IPCJL46VN3XFFCHENZFE';
const BASE_URL = 'https://api.golfcourseapi.com/v1';

// Headers for API calls
const HEADERS = {
    'Authorization': `Key ${API_KEY}`,
    'Content-Type': 'application/json'
};

// Helper wait function to avoid rate limits
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    // 1. Get the target tournament (latest one)
    // 1. Get the target tournament (Williamsburg 2026)
    const tournament = await prisma.tournament.findUnique({
        where: { slug: 'williamsburg-2026' } // Hardcoded for reliability
    });

    if (!tournament) {
        console.log("Tournament 'williamsburg-2026' not found.");
        return;
    }

    // Removed array logic
    console.log(`Enriching courses for tournament: ${tournament.name} (${tournament.id})`);

    // 2. Get all courses
    const courses = await prisma.course.findMany({
        where: { tournamentId: tournament.id }
    });

    console.log(`Found ${courses.length} courses to potentially enrich.`);

    let updatedCount = 0;

    for (const course of courses) {
        const courseName = course.name;

        console.log(`Searching API for: ${courseName}...`);

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                // A. Search for the course
                const searchUrl = `${BASE_URL}/search`;

                const searchRes = await axios.get(searchUrl, {
                    params: { search_query: courseName },
                    headers: HEADERS
                });

                if (searchRes.status !== 200 || !searchRes.data || !searchRes.data.courses || searchRes.data.courses.length === 0) {
                    console.log(`  No results found for "${courseName}"`);
                    break;
                }

                // B. Pick the best match (first one)
                const match = searchRes.data.courses[0];
                const courseId = match.id;
                console.log(`  Match found: ${match.course_name} (ID: ${courseId})`);

                // C. Get detailed course info
                const detailsUrl = `${BASE_URL}/courses/${courseId}`;
                const detailsRes = await axios.get(detailsUrl, { headers: HEADERS });

                if (detailsRes.status === 200 && detailsRes.data) {
                    const apiData = detailsRes.data;

                    // Process Tees
                    const teeBoxData = [];
                    const rawTees = apiData.tees?.male || [];
                    if (rawTees.length > 0) {
                        rawTees.forEach(t => {
                            teeBoxData.push({
                                name: t.tee_name,
                                rating: t.course_rating,
                                slope: t.slope_rating,
                                yardage: t.total_yards,
                                par: t.par_total
                            });
                        });
                    }

                    // Process Holes
                    let holeData = [];
                    if (rawTees.length > 0) {
                        const bestTee = rawTees[0];
                        if (bestTee.holes) {
                            holeData = bestTee.holes.map((h, idx) => ({
                                number: idx + 1,
                                par: h.par,
                                handicapIndex: h.handicap,
                                yardage: h.yardage
                            }));
                        }
                    }

                    // Update Database
                    await prisma.course.update({
                        where: { id: course.id },
                        data: {
                            address: apiData.location?.address || course.address,
                            par: rawTees[0]?.par_total || 72,
                            tees: teeBoxData,
                            holes: holeData
                        }
                    });

                    console.log(`  Updated ${courseName} with API data.`);
                    updatedCount++;
                }
                break; // Success, break retry loop

            } catch (error) {
                if (error.response && error.response.status === 429) {
                    retryCount++;
                    const delay = 3000 * retryCount;
                    console.log(`  Rate limit (429) hit. Retrying in ${delay / 1000}s...`);
                    await wait(delay);
                } else if (error.response && error.response.status === 401) {
                    console.error(`  Auth Error (401). Check API Key.`);
                    break;
                } else {
                    console.error(`  Error processing ${courseName}:`, error.message);
                    break;
                }
            }
        }

        await wait(2000); // Politeness delay
    }

    console.log(`\nEnrichment complete. Updated ${updatedCount} courses.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
