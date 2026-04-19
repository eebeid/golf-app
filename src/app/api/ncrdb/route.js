import { NextResponse } from 'next/server';

const BASE_URL = 'https://ncrdb.usga.org';

async function getCsrfToken() {
    const res = await fetch(BASE_URL, { cache: 'no-store' });
    const html = await res.text();
    // Use regex to find the __RequestVerificationToken
    const tokenMatch = html.match(/name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/);
    if (!tokenMatch) return null;
    
    // Also extract cookies
    const cookies = res.headers.get('set-cookie');
    return { token: tokenMatch[1], cookies };
}

async function searchCourse(courseName, stateCode, token, cookies) {
    const params = new URLSearchParams();
    params.append('clubName', courseName);
    params.append('clubCity', '');
    params.append('clubState', stateCode || '(Select)');
    params.append('clubCountry', 'USA');

    const res = await fetch(`${BASE_URL}/NCRListing?handler=LoadCourses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'RequestVerificationToken': token,
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookies || ''
        },
        body: params.toString()
    });

    if (!res.ok) return [];
    try {
        return await res.json();
    } catch {
        return [];
    }
}

async function getTees(courseId, cookies) {
    const res = await fetch(`${BASE_URL}/courseTeeInfo?CourseID=${courseId}`, {
        headers: { 'Cookie': cookies || '' }
    });
    const html = await res.text();
    
    // Extract the exact table block that has <table ... id="gvTee" ... >
    const tableStart = html.indexOf('id="gvTee"');
    if (tableStart === -1) return [];
    
    const tableEnd = html.indexOf('</table>', tableStart);
    const tableHtml = html.substring(tableStart, tableEnd);

    // Grab all <tr> rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const rows = [...tableHtml.matchAll(rowRegex)].map(m => m[1]);
    
    const tees = [];
    
    // Skip index 0 (header row)
    for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        // Grab all <td> values
        const colRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const cols = [...rowData.matchAll(colRegex)].map(m => m[1].trim());
        
        if (cols.length < 16) continue;
        
        const name = cols[0];
        if (!name || name === '&nbsp;') continue;
        
        const rawGender = cols[1];
        let gender = 'M';
        if (rawGender.toUpperCase().includes('F') || rawGender.toLowerCase().includes('women')) {
            gender = 'F';
        }

        const par = parseInt(cols[2], 10);
        const course_rating = parseFloat(cols[3]);
        const slope_rating = parseInt(cols[5], 10);
        const yardage = parseInt(cols[15], 10);

        if (!isNaN(par) && !isNaN(course_rating)) {
            // Deduplicate same tee names (e.g. matching for male/female usually exists on same tees, but we'll include both if gender differs)
            tees.push({ name, gender, par, rating: course_rating, slope: slope_rating, yardage: isNaN(yardage) ? null : yardage });
        }
    }
    
    // Clean duplicates (front/back 9 tees sometimes get mapped weirdly on NCRDB)
    const uniqueTees = [];
    const seen = new Set();
    for (const t of tees) {
        const sig = `${t.name}-${t.gender}`;
        if (!seen.has(sig)) {
            seen.add(sig);
            uniqueTees.push(t);
        }
    }
    
    return uniqueTees;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        const state = searchParams.get('state') || ''; // e.g. "US-VA"

        if (!name) {
            return NextResponse.json({ error: 'Missing course name parameter (name)' }, { status: 400 });
        }

        const session = await getCsrfToken();
        if (!session) {
            return NextResponse.json({ error: 'Failed to initialize session with USGA NCRDB' }, { status: 500 });
        }

        const courses = await searchCourse(name, state, session.token, session.cookies);
        
        if (!courses || courses.length === 0) {
            return NextResponse.json({ tees: [], message: 'No courses matched in NCRDB.' });
        }

        // Extremely simple matcher: pick the first one, or pick one that perfectly matches name
        let bestCourse = courses[0];
        const exactMatch = courses.find(c => c.fullName.toLowerCase() === name.toLowerCase());
        if (exactMatch) bestCourse = exactMatch;

        const tees = await getTees(bestCourse.courseID, session.cookies);

        return NextResponse.json({ 
            course: bestCourse,
            tees 
        });

    } catch (error) {
        console.error('[NCRDB API Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
