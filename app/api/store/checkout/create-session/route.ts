import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import jwt from "jsonwebtoken";

// Add CORS headers for store-front access
function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// Helper function to verify JWT token
function verifyCustomerToken(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
        if (decoded.type !== 'customer') {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

// POST /api/store/checkout/create-session - Create Stripe Checkout Session
export async function POST(request: NextRequest) {
    try {
        const tokenData = verifyCustomerToken(request);
        if (!tokenData) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: corsHeaders() }
            );
        }

        const body = await request.json();
        const { orderId, billingAddress } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!billingAddress) {
            return NextResponse.json(
                { error: "Billing address is required" },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Get order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderProducts: {
                    include: {
                        product: true,
                    },
                },
                customer: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Verify order belongs to this customer
        if (order.customerId !== tokenData.customerId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403, headers: corsHeaders() }
            );
        }

        // Create Stripe line items from order products
        const lineItems = order.orderProducts.map((item) => ({
            price_data: {
                currency: STRIPE_CONFIG.currency,
                product_data: {
                    name: item.productName,
                    description: item.productDescription || undefined,
                },
                unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        // Add shipping cost if any
        if (order.shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: STRIPE_CONFIG.currency,
                    product_data: {
                        name: "Shipping",
                        description: undefined,
                    },
                    unit_amount: Math.round(order.shippingCost * 100),
                },
                quantity: 1,
            });
        }

        // Add tax if any
        if (order.taxAmount > 0) {
            lineItems.push({
                price_data: {
                    currency: STRIPE_CONFIG.currency,
                    product_data: {
                        name: "Tax (VAT)",
                        description: undefined,
                    },
                    unit_amount: Math.round(order.taxAmount * 100),
                },
                quantity: 1,
            });
        }

        const storeFrontUrl = process.env.STORE_FRONT_URL || "http://localhost:3001";

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card' as any],
            line_items: lineItems,
            mode: "payment",
            success_url: `${storeFrontUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}`,
            cancel_url: `${storeFrontUrl}/checkout?canceled=true`,
            customer_email: order.customer.email,
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
            },
        });

        // Create or update checkout record
        const checkout = await prisma.checkout.upsert({
            where: { orderId: order.id },
            create: {
                orderId: order.id,
                customerId: order.customerId,
                paymentStatus: "PROCESSING",
                paymentMethod: "card",
                paymentGateway: "stripe",
                sessionId: session.id,
                billingName: billingAddress.name,
                billingEmail: billingAddress.email || order.customer.email,
                billingAddress1: billingAddress.address1,
                billingAddress2: billingAddress.address2,
                billingCity: billingAddress.city,
                billingState: billingAddress.state,
                billingZip: billingAddress.zip,
                billingCountry: billingAddress.country,
            },
            update: {
                paymentStatus: "PROCESSING",
                paymentMethod: "card",
                paymentGateway: "stripe",
                sessionId: session.id,
                billingName: billingAddress.name,
                billingEmail: billingAddress.email || order.customer.email,
                billingAddress1: billingAddress.address1,
                billingAddress2: billingAddress.address2,
                billingCity: billingAddress.city,
                billingState: billingAddress.state,
                billingZip: billingAddress.zip,
                billingCountry: billingAddress.country,
            },
        });

        return NextResponse.json({
            sessionId: session.id,
            sessionUrl: session.url,
            checkout,
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error("Error creating Stripe checkout session:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500, headers: corsHeaders() }
        );
    }
}
