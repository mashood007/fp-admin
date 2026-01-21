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
        const isGuestCheckout = !tokenData;

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

        // Verify order belongs to this customer (authenticated) or is a guest order
        if (isGuestCheckout) {
            // For guest orders, verify the customer is inactive (guest)
            if (order.customer.isActive) {
                return NextResponse.json(
                    { error: "Unauthorized - guest order required" },
                    { status: 403, headers: corsHeaders() }
                );
            }
        } else {
            // For authenticated orders, verify ownership
            if (order.customerId !== tokenData.customerId) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403, headers: corsHeaders() }
                );
            }
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
        // Shipping is free for orders >= 250 AED (after discount), otherwise 15 AED
        // Validate shipping cost calculation
        const taxableAmount = order.subtotal - order.discountAmount;
        const expectedShippingCost = taxableAmount >= 200 ? 0 : 15;

        console.log(`Order ${order.orderNumber} shipping debug:`, {
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            taxableAmount,
            shippingCost: order.shippingCost,
            expectedShippingCost,
            taxAmount: order.taxAmount,
            totalAmount: order.totalAmount
        });

        if (Math.abs(order.shippingCost - expectedShippingCost) > 0.01) {
            console.warn(`Shipping cost mismatch for order ${order.orderNumber}: expected ${expectedShippingCost}, got ${order.shippingCost}`);
        }

        // Always add shipping as a line item to show on Stripe checkout
        lineItems.push({
            price_data: {
                currency: STRIPE_CONFIG.currency,
                product_data: {
                    name: order.shippingCost === 0 ? "Shipping (Free)" : "Shipping",
                    description: undefined,
                },
                unit_amount: Math.round(order.shippingCost * 100),
            },
            quantity: 1,
        });

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

        // Create a Stripe coupon if the order has a discount
        let stripeCouponId: string | undefined;
        if (order.couponDiscount && order.couponDiscount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: Math.round(order.couponDiscount * 100), // Convert to cents
                currency: STRIPE_CONFIG.currency,
                duration: 'once',
                name: order.couponCode ? `Coupon: ${order.couponCode}` : 'Discount',
            });
            stripeCouponId = coupon.id;
        }

        // Create success URL - include email for guest orders
        const successUrl = isGuestCheckout
            ? `${storeFrontUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}&email=${encodeURIComponent(order.customer.email)}`
            : `${storeFrontUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}`;

        // Find or create Stripe customer
        let stripeCustomerId: string | undefined;
        const customers = await stripe.customers.list({
            email: order.customer.email,
            limit: 1,
        });

        if (customers.data.length > 0) {
            stripeCustomerId = customers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({
                email: order.customer.email,
                name: billingAddress.name,
            });
            stripeCustomerId = newCustomer.id;
        }

        // Create Stripe Checkout Session
        const sessionParams: any = {
            payment_method_types: ['card' as any],
            line_items: lineItems,
            mode: "payment",
            success_url: successUrl,
            cancel_url: `${storeFrontUrl}/checkout?canceled=true`,
            customer: stripeCustomerId, // Associate customer with session
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
            },
            payment_intent_data: {
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                },
            },
        };

        // Apply discount if coupon was created
        if (stripeCouponId) {
            sessionParams.discounts = [{
                coupon: stripeCouponId,
            }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

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
                billingAddress2: billingAddress.address2 || null,
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
                billingAddress2: billingAddress.address2 || null,
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
