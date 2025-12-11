import { getData } from '@/lib/data';
import CoursesList from './CoursesList';

export default async function CoursesPage() {
    // Server-side fetch
    const courses = await getData('courses');

    // Pass data to Client Component
    return <CoursesList courses={courses} />;
}
