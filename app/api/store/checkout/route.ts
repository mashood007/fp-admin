import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

// POST /api/store/checkout - Initialize checkout process
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
    const {
      orderId,
      paymentMethod,
      billingAddress,
    } = body;

    if (!orderId || !paymentMethod || !billingAddress) {
      return NextResponse.json(
        { error: "Order ID, payment method, and billing address are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Verify order belongs to customer and is in correct status
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        customerId: tokenData.customerId,
      },
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order is not in a valid state for checkout" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Check if checkout already exists
    const existingCheckout = await prisma.checkout.findUnique({
      where: { orderId },
    });

    if (existingCheckout) {
      return NextResponse.json(
        { error: "Checkout already exists for this order" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Create checkout record
    const checkout = await prisma.checkout.create({
      data: {
        orderId,
        customerId: tokenData.customerId,
        paymentStatus: "PENDING",
        paymentMethod,
        billingName: billingAddress.name,
        billingEmail: billingAddress.email,
        billingAddress1: billingAddress.address1,
        billingAddress2: billingAddress.address2,
        billingCity: billingAddress.city,
        billingState: billingAddress.state,
        billingZip: billingAddress.zip,
        billingCountry: billingAddress.country,
      },
    });

    // Generate session ID for payment processing
    const sessionId = `checkout_${checkout.id}_${Date.now()}`;
    
    // Update checkout with session ID
    const updatedCheckout = await prisma.checkout.update({
      where: { id: checkout.id },
      data: { sessionId },
      include: {
        order: {
          include: {
            orderProducts: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { order: "asc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // In a real application, you would integrate with a payment processor here
    // For example, create a Stripe session, PayPal order, etc.
    
    return NextResponse.json({
      message: "Checkout initialized successfully",
      checkout: updatedCheckout,
      paymentUrl: `/checkout/payment?session=${sessionId}`, // Frontend payment page
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error initializing checkout:", error);
    return NextResponse.json(
      { error: "Failed to initialize checkout" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
