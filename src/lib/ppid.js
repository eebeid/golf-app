import prisma from '@/lib/prisma';

// 29 unambiguous uppercase alphanumeric characters (omits 0, O, 1, I, L)
const PPID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a random, easy-to-read uppercase alphanumeric code.
 * Default length: 6 characters (e.g. "K7P9X2", "M3R8Q5").
 */
export function generateRandomPPID(length = 6) {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * PPID_ALPHABET.length);
        result += PPID_ALPHABET[randomIndex];
    }
    return result;
}

/**
 * Clean and standardize user-entered PPID:
 * - Trim whitespace
 * - Convert to uppercase
 * - Replace spaces with hyphens
 * - Strip any characters not in A-Z, 0-9, hyphens, or underscores
 */
export function normalizePPID(input) {
    if (!input || typeof input !== 'string') return '';
    return input
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, 16);
}

/**
 * Validates PPID format:
 * Must be 3 to 16 alphanumeric characters, hyphens, or underscores.
 */
export function isValidPPID(code) {
    if (!code || typeof code !== 'string') return false;
    const normalized = normalizePPID(code);
    return /^[A-Z0-9_-]{3,16}$/.test(normalized);
}

/**
 * Generates a collision-free random PPID by checking against the database.
 */
export async function generateUniquePPID(client = prisma) {
    let attempts = 0;
    while (attempts < 20) {
        const candidate = generateRandomPPID(6);
        const existing = await client.tournament.findUnique({
            where: { ppid: candidate },
            select: { id: true }
        });
        if (!existing) {
            return candidate;
        }
        attempts++;
    }
    // Fallback if very crowded
    return `${generateRandomPPID(4)}${Date.now().toString(36).toUpperCase().slice(-3)}`;
}

/**
 * Guarantees a tournament has a valid PPID.
 * If missing, generates a unique random one and persists it to the database.
 */
export async function ensureTournamentPPID(tournament, client = prisma) {
    if (!tournament) return null;
    if (tournament.ppid && tournament.ppid.trim()) {
        return tournament.ppid.trim().toUpperCase();
    }

    const uniquePPID = await generateUniquePPID(client);
    try {
        await client.tournament.update({
            where: { id: tournament.id },
            data: { ppid: uniquePPID }
        });
        tournament.ppid = uniquePPID;
        return uniquePPID;
    } catch (err) {
        console.error('Failed to auto-assign PPID to tournament:', err);
        return uniquePPID;
    }
}

