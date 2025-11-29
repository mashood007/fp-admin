# Stripe Payment Integration - Setup Guide

This guide will help you set up Stripe payment processing for your order checkout flow.

## Prerequisites

1. **Stripe Account**: Sign up at [https://stripe.com](https://stripe.com)
2. **Test Mode**: Use test mode for development (test keys start with `sk_test_` and `pk_test_`)
3. **Node.js packages**: Already installed (`stripe` in backend, `@stripe/stripe-js` in frontend)

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API keys**
3. Copy your:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

## Step 2: Configure Environment Variables

Add these variables to your `/fp-admin/.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Get this in Step 3

# Application URLs
STORE_FRONT_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Security Note**: Never commit your `.env` file to git. The `.env.stripe.example` file is provided as a template.

## Step 3: Set Up Stripe Webhooks

Webhooks are required to receive payment confirmation events from Stripe.

### For Local Development (using Stripe CLI):

1. **Install Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
   This command will output a webhook signing secret like `whsec_...` - copy this to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

4. **Keep this terminal running** while testing locally.

### For Production Deployment:

1. In your [Stripe Dashboard](https://dashboard.stripe.com), go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`) and add it to your production `.env` file

## Step 4: Test the Integration

1. **Start both applications**:
   ```bash
   # Terminal 1 - Backend (fp-admin)
   cd /Users/mashoodp/Desktop/Code/fp/fp-admin
   npm run dev
   
   # Terminal 2 - Frontend (fp-store-front)
   cd /Users/mashoodp/Desktop/Code/fp/fp-store-front
   npm run dev
   
   # Terminal 3 - Stripe Webhook Forwarding (for local testing)
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Navigate to the storefront**: [http://localhost:3001](http://localhost:3001)

3. **Add products to cart** and proceed to checkout

4. **Fill out checkout form** with shipping and billing information

5. **Click "Pay"** - you'll be redirected to Stripe Checkout

6. **Use a test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

7. **Complete payment** - you'll be redirected back to the success page

8. **Verify the order**:
   - Check order history at [http://localhost:3001/account/orders](http://localhost:3001/account/orders)
   - Order status should be updated to "CONFIRMED"
   - Payment status should be "COMPLETED"

## Stripe Test Cards

Use these test cards to simulate different scenarios:

| Card Number         | Scenario                    |
|---------------------|----------------------------|
| 4242 4242 4242 4242 | Successful payment         |
| 4000 0000 0000 0002 | Card declined              |
| 4000 0025 0000 3155 | Requires authentication    |
| 4000 0000 0000 9995 | Insufficient funds         |

More test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

## Payment Flow

1. **User fills checkout form** with shipping/billing address
2. **Order is created** in PENDING status
3. **Stripe Checkout Session is created** with order details
4. **User is redirected** to Stripe-hosted checkout page
5. **User completes payment** on Stripe's secure page
6. **Stripe webhook notifies** your backend of payment success
7. **Order status updated** to CONFIRMED, payment status to COMPLETED
8. **User redirected back** to success page

## Troubleshooting

### Webhook not receiving events:
- Ensure `stripe listen` is running for local development
- Check that webhook secret matches in `.env`
- Check the terminal running `stripe listen` for events

### Payment not completing:
- Check backend logs for errors
- Verify Stripe API keys are correct
- Ensure webhook events are being received

### Redirect loop after payment:
- Verify `STORE_FRONT_URL` in `.env` matches your frontend URL
- Check success page URL is correct

## Going to Production

1. **Switch to Live Mode** in Stripe Dashboard
2. Get your **live API keys** (start with `pk_live_` and `sk_live_`)
3. Update `.env` with live keys
4. Set up **production webhook endpoint** in Stripe Dashboard
5. Update `STORE_FRONT_URL` and `NEXT_PUBLIC_BASE_URL` to production URLs
6. Test thoroughly with real cards (in small amounts)

## Security Best Practices

- ✅ Never commit `.env` files to version control
- ✅ Use test mode for development
- ✅ Always verify webhook signatures
- ✅ Keep Stripe SDK updated
- ✅ Use HTTPS in production
- ✅ Monitor Stripe Dashboard for suspicious activity

## Support

- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Test your integration: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
