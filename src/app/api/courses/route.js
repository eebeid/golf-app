import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/data';

export async function GET() {
    try {
        const courses = await getData('courses');
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        // Body should be the full array of courses with updates
        await saveData('courses', body);
        return NextResponse.json({ success: true, message: 'Courses updated successfully' });
    } catch (error) {
        console.error('Error saving courses:', error);
        return NextResponse.json({ error: 'Failed to update courses' }, { status: 500 });
    }
}
