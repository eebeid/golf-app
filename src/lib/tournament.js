
import prisma from '@/lib/prisma';

export async function getTournament(slug) {
    if (!slug) return null;
    // Try finding by slug (which is unique)
    // If slug looks like UUID, it might be ID, but schema says slug is unique string.
    return await prisma.tournament.findUnique({
        where: { slug }
    });
}
