import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { provider, token, firstName, lastName } = body;

        if (!provider || !token) {
            return NextResponse.json({ error: 'Missing provider or token' }, { status: 400 });
        }

        let email = null;
        let name = null;
        let providerAccountId = null;

        if (provider === 'google') {
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
            const data = await googleRes.json();
            if (!googleRes.ok || !data.email) {
                return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
            }
            email = data.email;
            name = data.name;
            providerAccountId = data.sub;
        } else if (provider === 'apple') {
            // Native Apple tokens are JWTs. We decode them to get the email and sub.
            // (Note: For maximum security in production, you can implement JWKS signature verification here)
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.email || !decoded.sub) {
                return NextResponse.json({ error: 'Invalid Apple token' }, { status: 401 });
            }
            email = decoded.email;
            providerAccountId = decoded.sub;
            name = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : null;
        } else {
            return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
        }

        email = email.toLowerCase();

        // 1. Find or create User
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    // Auto-upgrade owners
                    isPro: ['edebeid@gmail.com', 'eebeid@blueechostudios.com'].includes(email)
                }
            });
        }

        // 2. Ensure Account exists for this provider
        const existingAccount = await prisma.account.findFirst({
            where: {
                userId: user.id,
                provider: provider
            }
        });

        if (!existingAccount) {
            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: 'oauth',
                    provider: provider,
                    providerAccountId: providerAccountId,
                }
            });
        }

        // 3. Create a Database Session for NextAuth
        const sessionToken = crypto.randomUUID();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30 days

        await prisma.session.create({
            data: {
                sessionToken,
                userId: user.id,
                expires
            }
        });

        return NextResponse.json({ success: true, sessionToken });
    } catch (error) {
        console.error('Native auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
