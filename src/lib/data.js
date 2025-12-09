import fs from 'fs/promises';
import path from 'path';
import prisma from './prisma';

// Static data files (Courses, Food, Lodging, Prizes) continue to live in JSON for now
// Dynamic data (Players, Scores, Photos) moves to DB

export async function getData(type) {
    // 1. Dynamic Data (DB)
    if (type === 'players') {
        return await prisma.player.findMany({ orderBy: { registeredAt: 'desc' } });
    }
    if (type === 'scores') {
        return await prisma.score.findMany();
    }
    if (type === 'photos') {
        return await prisma.photo.findMany({ orderBy: { createdAt: 'desc' } });
    }

    // 2. Static Data (JSON)
    // lodging, courses, food, prizes
    const filePath = path.join(process.cwd(), 'data', `${type}.json`);
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

// Deprecated: Use individual API routes with Prisma create/update/delete instead.
// But we keep this for legacy calls or quick fixes, mapping 'saveData' to nothing or error.
export async function saveData(type, data) {
    console.warn(`saveData(${type}) is deprecated. Use Prisma in API routes directly.`);
    // For now, we only implement file saving for static data if needed (not really needed for this app)
    if (['lodging', 'courses', 'food', 'prizes'].includes(type)) {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
}

// Helpers for legacy support if needed
export async function deletePlayer(id) {
    await prisma.player.delete({ where: { id: String(id) } });
}

export async function addPlayer(player) {
    // If ID is provided (e.g. from seed/import), use it
    const data = {
        name: player.name,
        handicap: player.handicap,
    };
    if (player.id) data.id = String(player.id);
    if (player.registeredAt) data.registeredAt = new Date(player.registeredAt);

    await prisma.player.create({ data });
}
