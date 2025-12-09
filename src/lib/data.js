import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export async function getData(filename) {
    const filePath = path.join(dataDir, `${filename}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty array/object based on request? 
        // For now, let's assume files exist or return null
        return [];
    }
}

export async function saveData(filename, data) {
    const filePath = path.join(dataDir, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function addPhoto(photoData) {
    const photos = await getData('photos');
    photos.push(photoData);
    await saveData('photos', photos);
}

export async function addPlayer(player) {
    const players = await getData('players');
    players.push(player);
    await saveData('players', players);
}

export async function deletePlayer(id) {
    const players = await getData('players');
    const filtered = players.filter(p => p.id != id); // loose equality for string/number safety
    await saveData('players', filtered);
}

// Helper to get nested data if needed, or structured access
