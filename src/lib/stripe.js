import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Typical recent version
    appInfo: {
        name: 'PinPlaced',
        version: '1.1.0'
    }
});
