// Stripe configuration - add these to your .env file:
// STRIPE_SECRET_KEY=your_stripe_secret_key_here
// STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
// STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
// NEXT_PUBLIC_BASE_URL=http://localhost:3000
// STORE_FRONT_URL=http://localhost:3001

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
});

export const STRIPE_CONFIG = {
    currency: 'aed',
    paymentMethodTypes: ['card'],
};
