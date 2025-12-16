import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createDeliveryForOrder } from "@/lib/delivery";
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
                await handlePaymentIntentSucceeded(paymentIntent);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentPaymentFailed(paymentIntent);
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

        // Create Invoice
        let invoiceId: string | null = null;
        let invoiceUrl: any | null = null;

        if (session.customer) {
            try {
                const customerId = session.customer as string;

                // Create an invoice item for the order
                // We can use the total amount from the session
                if (session.amount_total) {
                    await stripe.invoiceItems.create({
                        customer: customerId,
                        amount: session.amount_total,
                        currency: session.currency || 'usd',
                        description: `Order #${orderId}`,
                    });

                    // Create the invoice
                    const invoice = await stripe.invoices.create({
                        customer: customerId,
                        auto_advance: true, // Auto-finalize
                        collection_method: 'charge_automatically',
                    });

                    // Finalize the invoice immediately to get the URL
                    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

                    invoiceId = finalizedInvoice.id;
                    invoiceUrl = finalizedInvoice.hosted_invoice_url;

                    console.log(`Created invoice: ${invoiceId}`);
                }
            } catch (invoiceError) {
                console.error("Error creating invoice:", invoiceError);
                // Continue processing order even if invoice fails
            }
        }

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
                    invoiceId,
                    invoiceUrl,
                } as any,
            });
        });

        // Initiate Delivery
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            if (order) {
                console.log(`Initiating delivery for order: ${orderId}`);
                const deliveryResult = await createDeliveryForOrder(order);

                await prisma.deliveryOrder.create({
                    data: {
                        orderId: orderId,
                        airwayBillNumber: deliveryResult.AirwayBillNumber,
                        destinationCode: deliveryResult.DestinationCode,
                        apiResponse: JSON.stringify(deliveryResult),
                        status: "GENERATED"
                    }
                });
                console.log(`Delivery initiated successfully. AWB: ${deliveryResult.AirwayBillNumber}`);
            }
        } catch (deliveryError) {
            console.error("Failed to initiate delivery:", deliveryError);
            // We don't throw here to avoid failing the webhook response for the payment
        }

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

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
        const orderId = paymentIntent.metadata?.orderId;

        if (!orderId) {
            console.error("No orderId in payment intent metadata");
            return;
        }

        console.log(`Processing payment intent success for order: ${orderId}`);

        // Update checkout and order in a transaction
        await prisma.$transaction(async (tx) => {
            // Update checkout record
            await tx.checkout.updateMany({
                where: {
                    orderId,
                },
                data: {
                    paymentStatus: "COMPLETED",
                    paymentReference: paymentIntent.id,
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

            // Update product stock based on order products
            const orderItems = await tx.orderProduct.findMany({
                where: {
                    orderId: orderId,
                },
                select: {
                    productId: true,
                    quantity: true,
                },
            });

            // Decrement stock for each product
            for (const orderItem of orderItems) {
                // Get current product to check stock
                const product = await tx.product.findUnique({
                    where: {
                        id: orderItem.productId,
                    },
                }) as any; // Type assertion to bypass TypeScript issues

                if (product && (product.availableStock || 0) >= orderItem.quantity) {
                    await tx.product.update({
                        where: {
                            id: orderItem.productId,
                        },
                        data: {
                            availableStock: (product.availableStock || 0) - orderItem.quantity,
                        } as any, // Type assertion to bypass TypeScript issues
                    });
                } else {
                    console.error(`Insufficient stock for product ${orderItem.productId}. Available: ${product?.availableStock}, Required: ${orderItem.quantity}`);
                    // In a real application, you might want to handle this case differently
                    // For now, we'll continue but log the error
                }
            }

            // Update product stock based on ordered quantities
            const orderProducts = await tx.orderProduct.findMany({
                where: { orderId },
                select: {
                    productId: true,
                    quantity: true,
                },
            });

            // Decrease stock for each product in the order
            for (const orderProduct of orderProducts) {
                // Use raw SQL to update stock to avoid TypeScript issues
                await tx.$executeRaw`
                    UPDATE products
                    SET "availableStock" = GREATEST(0, "availableStock" - ${orderProduct.quantity})
                    WHERE id = ${orderProduct.productId}
                `;
            }

            // HERE IS THE PLACE WHERE WE WILL INITIATE DELIVERY
            try {
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                });
                console.log(`order DATA: ${JSON.stringify(order)}`);

                if (order) {
                    console.log(`Initiating delivery for order: ${orderId}`);
                    const deliveryResult = await createDeliveryForOrder(order);

                    await prisma.deliveryOrder.create({
                        data: {
                            orderId: orderId,
                            airwayBillNumber: deliveryResult.AirwayBillNumber,
                            destinationCode: deliveryResult.DestinationCode,
                            apiResponse: JSON.stringify(deliveryResult),
                            status: "GENERATED"
                        }
                    });
                    console.log(`Delivery initiated successfully. AWB: ${deliveryResult.AirwayBillNumber}`);
                }
            } catch (deliveryError) {
                console.error("Failed to initiate delivery:", deliveryError);
                // We don't throw here to avoid failing the webhook response for the payment
            }
        });

        console.log(`Successfully processed payment intent for order: ${orderId}`);

    } catch (error) {
        console.error("Error handling payment intent succeeded:", error);
        throw error;
    }
}

// Handle failed payment intent
async function handlePaymentIntentPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
        const orderId = paymentIntent.metadata?.orderId;

        if (!orderId) {
            console.error("No orderId in payment intent metadata");
            return;
        }

        console.log(`Processing payment intent failure for order: ${orderId}`);

        // Update checkout record to mark as failed
        await prisma.checkout.updateMany({
            where: {
                orderId,
            },
            data: {
                paymentStatus: "FAILED",
                failedAt: new Date(),
                failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
            },
        });

        console.log(`Marked checkout as failed for order: ${orderId}`);

    } catch (error) {
        console.error("Error handling payment intent failed:", error);
        throw error;
    }
}
