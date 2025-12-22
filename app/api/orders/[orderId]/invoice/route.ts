import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                orderProducts: true,
                checkout: true,
            },
        });
        console.log("order", order);

        if (!order) {
            console.error("Order not found");
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.invoiceUrl) {
            console.error("Invoice already exists");
            return NextResponse.json(
                { error: "Invoice already exists", invoiceUrl: order.invoiceUrl },
                { status: 400 }
            );
        }

        // 1. Get the Stripe customer from the payment intent
        if (!order.checkout?.paymentReference) {
            console.error("No payment reference found for this order");
            return NextResponse.json(
                { error: "No payment reference found for this order" },
                { status: 400 }
            );
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(order.checkout.paymentReference);
        console.log("paymentIntent", paymentIntent);
        console.log("paymentIntent.customer", paymentIntent?.customer);

        let stripeCustomerId: string;

        if (paymentIntent.customer) {
            stripeCustomerId = paymentIntent.customer as string;
        } else {
            // No customer associated with payment intent, try to find by checkout billingEmail
            if (!order.checkout?.billingEmail) {
                console.error("No customer associated with payment intent and no billing email found");
                return NextResponse.json(
                    { error: "No customer information found" },
                    { status: 400 }
                );
            }

            // Search for existing customer by email
            const customers = await stripe.customers.list({
                email: order.checkout.billingEmail,
                limit: 1,
            });

            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id;
                console.log(`Found existing customer: ${stripeCustomerId}`);
            } else {
                // Create new customer
                const newCustomer = await stripe.customers.create({
                    email: order.checkout.billingEmail,
                    name: order.checkout.billingName || undefined,
                });
                stripeCustomerId = newCustomer.id;
                console.log(`Created new customer: ${stripeCustomerId}`);
            }

        }

        // 2. Create Draft Invoice
        const invoice = await stripe.invoices.create({
            customer: stripeCustomerId,
            auto_advance: false, // Do not auto-finalize yet
            collection_method: 'send_invoice',
            days_until_due: 30,
        });

        console.log(`Created draft invoice: ${invoice.id}`);

        // 3. Create Invoice Items linked to the invoice

        // Products
        console.log(`Found ${order.orderProducts.length} products`);
        for (const item of order.orderProducts) {
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: invoice.id, // Link to specific invoice
                amount: Math.round(item.unitPrice * 100) * item.quantity,
                currency: 'aed',
                description: `${item.productName} (x${item.quantity})`,
            });
        }

        // Shipping
        if (order.shippingCost > 0) {
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: invoice.id,
                amount: Math.round(order.shippingCost * 100),
                currency: 'aed',
                description: "Shipping Cost",
            });
        }

        // Tax
        if (order.taxAmount > 0) {
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: invoice.id,
                amount: Math.round(order.taxAmount * 100),
                currency: 'aed',
                description: "Tax",
            });
        }

        // Discount (Coupon)
        if (order.discountAmount > 0) {
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: invoice.id,
                amount: -Math.round(order.discountAmount * 100),
                currency: 'aed',
                description: order.couponCode ? `Discount (${order.couponCode})` : "Discount",
            });
        }

        // 4. Finalize Invoice
        let finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            auto_advance: true, // Now we can auto-advance
        });


        // 
        // 
        if (order.checkout?.paymentReference) {
        // 6. Attach Payment to Invoice
            await stripe.invoices.attachPayment(invoice.id, {
                payment_intent: order.checkout?.paymentReference || ''
            });
        }

        // 5. Mark as Paid
        finalizedInvoice = await stripe.invoices.pay(invoice.id, {
            paid_out_of_band: true,
            // payment_intent: order.,
        });
        

        // 6. Update Order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                invoiceId: finalizedInvoice.id,
                invoiceUrl: finalizedInvoice.hosted_invoice_url,
            },
        });

        return NextResponse.json({
            success: true,
            invoiceUrl: finalizedInvoice.hosted_invoice_url,
        });

    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json(
            { error: "Failed to create invoice" },
            { status: 500 }
        );
    }
}
