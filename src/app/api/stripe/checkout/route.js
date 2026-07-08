import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req) {
    try {
        const body = await req.json();
        const { tier, tournamentId } = body;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If event_pass, check if this tournament is already unlocked
        if (tier === 'event_pass') {
            const existing = Array.isArray(user.proTournamentIds) ? user.proTournamentIds : [];
            if (tournamentId && existing.includes(tournamentId)) {
                return NextResponse.json({ error: 'This tournament is already unlocked.' }, { status: 400 });
            }
        } else if (tier === 'pro_annual' && user.isPro) {
            return NextResponse.json({ error: 'User is already a Pro member.' }, { status: 400 });
        }

        let checkoutUrl = `${process.env.NEXTAUTH_URL}/?upgraded=true`;

        try {
            let priceId = '';
            let mode = 'subscription';
            let metadata = { userId: user.id };

            if (tier === 'pro_annual') {
                priceId = process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
                mode = 'subscription';
            } else if (tier === 'event_pass') {
                priceId = process.env.STRIPE_PRICE_ID_EVENT_PASS; // One-time price in Stripe dashboard
                mode = 'payment';
                if (tournamentId) metadata.tournamentId = tournamentId;
            } else {
                return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
            }

            const sessionData = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode,
                line_items: [{ price: priceId, quantity: 1 }],
                client_reference_id: user.id,
                metadata,
                success_url: `${process.env.NEXTAUTH_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
                cancel_url: `${process.env.NEXTAUTH_URL}/?canceled=true`,
                customer_email: user.email || undefined,
            });
            checkoutUrl = sessionData.url;
        } catch (stripeErr) {
            console.log("Stripe mock mode active:", stripeErr.message);
        }

        return NextResponse.json({ url: checkoutUrl });
    } catch (e) {
        console.error('Stripe Checkout Error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
