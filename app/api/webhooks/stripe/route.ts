import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Disable body parsing for webhook - we need raw body
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = headers().get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "No signature provided" },
                { status: 400 }
            );
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error("STRIPE_WEBHOOK_SECRET is not configured");
            return NextResponse.json(
                { error: "Webhook secret not configured" },
                { status: 500 }
            );
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        console.log(`Received Stripe event: ${event.type}`);

        // Handle different event types
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionExpired(session);
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log("Payment intent succeeded:", paymentIntent.id);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log("Payment intent failed:", paymentIntent.id);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Webhook handler error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    try {
        const orderId = session.metadata?.orderId;

        if (!orderId) {
            console.error("No orderId in session metadata");
            return;
        }

        console.log(`Processing completed checkout for order: ${orderId}`);

        // Update checkout and order in a transaction
        await prisma.$transaction(async (tx) => {
            // Update checkout record
            await tx.checkout.updateMany({
                where: {
                    orderId,
                    sessionId: session.id,
                },
                data: {
                    paymentStatus: "COMPLETED",
                    paymentReference: session.payment_intent as string,
                    completedAt: new Date(),
                },
            });

            // Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "CONFIRMED",
                },
            });
        });

        console.log(`Successfully processed payment for order: ${orderId}`);

    } catch (error) {
        console.error("Error handling checkout session completed:", error);
        throw error;
    }
}

// Handle expired checkout session
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    try {
        const orderId = session.metadata?.orderId;

        if (!orderId) {
            console.error("No orderId in session metadata");
            return;
        }

        console.log(`Processing expired checkout for order: ${orderId}`);

        // Update checkout record to mark as failed
        await prisma.checkout.updateMany({
            where: {
                orderId,
                sessionId: session.id,
            },
            data: {
                paymentStatus: "FAILED",
                failedAt: new Date(),
                failureReason: "Checkout session expired",
            },
        });

        console.log(`Marked checkout as expired for order: ${orderId}`);

    } catch (error) {
        console.error("Error handling checkout session expired:", error);
        throw error;
    }
}
