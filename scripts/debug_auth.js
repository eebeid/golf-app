
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_KEY = '4912'; // The key
const BASE_URL = 'https://api.golfcourseapi.com/v1';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const courses = await prisma.course.findMany({ take: 3 }); // Just take 3 for test

    for (const course of courses) {
        let retryCount = 0;
        const maxRetries = 5;

        // FORCE TEST using 'pinehurst' to match working test script exactly
        const query = 'pinehurst';

        console.log(`Testing search for: ${query} (Original: ${course.name})`);

        while (retryCount < maxRetries) {
            try {
                const searchRes = await axios.get(`${BASE_URL}/search`, {
                    params: { search_query: query },
                    headers: {
                        'apikey': API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`  Status: ${searchRes.status}`);
                if (searchRes.data.courses && searchRes.data.courses.length > 0) {
                    console.log(`  Found: ${searchRes.data.courses[0].course_name}`);
                }
                break;

            } catch (error) {
                console.log(`  Error Status: ${error.response?.status}`);
                if (error.response?.status === 429) {
                    retryCount++;
                    const delay = 3000 * retryCount;
                    console.log(`  429 hit. Waiting ${delay}ms...`);
                    await wait(delay);
                } else if (error.response?.status === 401) {
                    console.log('  401 Auth Error. Stopping.');
                    return; // Stop everything
                } else {
                    console.log(`  Other error: ${error.message}`);
                    break;
                }
            }
        }
        await wait(1000);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
