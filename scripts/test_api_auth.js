
const axios = require('axios');

const BASE_URL = 'https://api.golfcourseapi.com/v1';
const API_KEY = '4912';

async function testAuth(headerName, headerValue, description) {
    try {
        console.log(`Testing ${description}...`);
        console.log(`  Header: ${headerName}: ${headerValue}`);
        const res = await axios.get(`${BASE_URL}/search`, {
            params: { search_query: 'pinehurst' },
            headers: {
                [headerName]: headerValue,
                'Content-Type': 'application/json'
            }
        });
        console.log(`  SUCCESS! Status: ${res.status}`);
        return true;
    } catch (e) {
        console.log(`  Failed. Status: ${e.response?.status} - ${e.response?.statusText}`);
        return false;
    }
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    await testAuth('Authorization', `Key ${API_KEY}`, 'Authorization: Key <key>');
    await wait(1000);

    await testAuth('Authorization', API_KEY, 'Authorization: <key>');
    await wait(1000);

    await testAuth('Authorization', `Bearer ${API_KEY}`, 'Authorization: Bearer <key>');
    await wait(1000);

    await testAuth('x-api-key', API_KEY, 'x-api-key: <key>');
    await wait(1000);

    await testAuth('apikey', API_KEY, 'apikey: <key>');
    await wait(1000);

    await testAuth('key', API_KEY, 'key: <key>');
}

main();
