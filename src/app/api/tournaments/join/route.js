import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePPID, isValidPPID } from '@/lib/ppid';

export async function POST(request) {
    try {
        const body = await request.json();
        const rawCode = body?.ppid || body?.code;

        if (!rawCode) {
            return NextResponse.json({ error: 'Please enter a PPID code.' }, { status: 400 });
        }

        const normalized = normalizePPID(rawCode);
        if (!isValidPPID(normalized)) {
            return NextResponse.json({ error: 'Invalid PPID format. Codes are 3-16 characters.' }, { status: 400 });
        }

        // 1. Look up by exact PPID
        let tournament = await prisma.tournament.findUnique({
            where: { ppid: normalized },
            select: { id: true, slug: true, name: true, ppid: true }
        });

        // 2. Fallback: Check slug (case-insensitive) in case user entered tournament slug
        if (!tournament) {
            tournament = await prisma.tournament.findUnique({
                where: { slug: normalized.toLowerCase() },
                select: { id: true, slug: true, name: true, ppid: true }
            });
        }

        if (!tournament) {
            return NextResponse.json({
                error: `No tournament found with PPID "${normalized}". Check with your tournament leader.`
            }, { status: 404 });
        }

        const res = NextResponse.json({
            success: true,
            tournament
        });

        // Grant 30-day cookie for this tournament access
        res.cookies.set(`ppid_access_${tournament.id}`, 'true', {
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
            sameSite: 'lax',
            httpOnly: false
        });

        return res;
    } catch (err) {
        console.error('Error in /api/tournaments/join:', err);
        return NextResponse.json({ error: 'Failed to join tournament. Please try again.' }, { status: 500 });
    }
}

