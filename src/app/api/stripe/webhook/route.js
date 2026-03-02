import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(req) {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`⚠️ Webhook signature verification failed:`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;

                // Retrieve the user id from client_reference_id
                const userId = session.client_reference_id;
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                if (userId) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            isPro: true,
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                        }
                    });
                    console.log(`✅ User ${userId} successfully upgraded to Pro!`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                // Check if the subscription is still active or past_due
                const status = subscription.status;

                await prisma.user.updateMany({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        isPro: status === 'active' || status === 'trialing',
                    }
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;

                await prisma.user.updateMany({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        isPro: false,
                        stripeSubscriptionId: null, // Clear the subscription ID so they can re-subscribe later
                    }
                });
                console.log(`❌ Subscription ${subscription.id} canceled. Downgraded user from Pro.`);
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error(`Error processing webhook:`, error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
