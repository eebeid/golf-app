import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePPID } from '@/lib/ppid';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { ppid } = await params;
    const clean = normalizePPID(ppid);

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'pinplaced.com';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXTAUTH_URL || `${proto}://${host}`;

    if (!clean) {
        return NextResponse.redirect(new URL('/join', origin));
    }

    let tournament = await prisma.tournament.findUnique({
        where: { ppid: clean },
        select: { id: true, slug: true, ppid: true }
    });

    if (!tournament) {
        tournament = await prisma.tournament.findUnique({
            where: { slug: clean.toLowerCase() },
            select: { id: true, slug: true, ppid: true }
        });
    }

    if (!tournament) {
        return NextResponse.redirect(new URL(`/join?error=not_found&code=${encodeURIComponent(clean)}`, origin));
    }

    const targetUrl = new URL(`/t/${tournament.slug}`, origin);
    const response = NextResponse.redirect(targetUrl);

    const isProduction = process.env.NODE_ENV === 'production';
    const thirtyDays = 30 * 24 * 60 * 60;

    response.cookies.set(`pinplaced_access_${tournament.slug}`, '1', {
        path: '/',
        maxAge: thirtyDays,
        sameSite: 'lax',
        secure: isProduction,
        httpOnly: false
    });

    response.cookies.set(`pinplaced_access_${tournament.id}`, '1', {
        path: '/',
        maxAge: thirtyDays,
        sameSite: 'lax',
        secure: isProduction,
        httpOnly: false
    });

    if (tournament.ppid) {
        response.cookies.set('pinplaced_recent_ppid', tournament.ppid, {
            path: '/',
            maxAge: thirtyDays,
            sameSite: 'lax',
            secure: isProduction,
            httpOnly: false
        });
    }

    return response;
}

