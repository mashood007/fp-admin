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
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.invoiceUrl) {
            return NextResponse.json(
                { error: "Invoice already exists", invoiceUrl: order.invoiceUrl },
                { status: 400 }
            );
        }

        // 1. Find or create Stripe customer
        let stripeCustomerId: string;
        const existingCustomers = await stripe.customers.list({
            email: order.customer.email,
            limit: 1,
        });

        if (existingCustomers.data.length > 0) {
            stripeCustomerId = existingCustomers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({
                email: order.customer.email,
                name: order.customer.name,
                phone: order.customer.phone || undefined,
                metadata: {
                    userId: order.customerId,
                },
            });
            stripeCustomerId = newCustomer.id;
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

        // 5. Mark as Paid
        finalizedInvoice = await stripe.invoices.pay(invoice.id, {
            paid_out_of_band: true,
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
