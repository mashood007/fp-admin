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

// POST /api/store/checkout/[id]/complete - Complete checkout and payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      paymentReference,
      paymentGateway,
      sessionId,
    } = body;

    // Verify checkout belongs to customer
    const checkout = await prisma.checkout.findUnique({
      where: {
        id: params.id,
        customerId: tokenData.customerId,
      },
      include: {
        order: true,
      },
    });

    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    if (checkout.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Checkout is not in a valid state for completion" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Verify session ID if provided
    if (sessionId && checkout.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // In a real application, you would verify the payment with the payment processor here
    // For now, we'll simulate a successful payment
    
    const completedAt = new Date();
    
    // Complete the checkout and update order status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update checkout status
      const updatedCheckout = await tx.checkout.update({
        where: { id: params.id },
        data: {
          paymentStatus: "COMPLETED",
          paymentReference,
          paymentGateway,
          completedAt,
        },
      });

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: checkout.orderId },
        data: {
          status: "CONFIRMED",
        },
        include: {
          orderProducts: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      return { checkout: updatedCheckout, order: updatedOrder };
    });

    return NextResponse.json({
      message: "Payment completed successfully",
      checkout: result.checkout,
      order: result.order,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error completing checkout:", error);
    
    // Try to mark payment as failed
    try {
      await prisma.checkout.update({
        where: { id: params.id },
        data: {
          paymentStatus: "FAILED",
          failedAt: new Date(),
          failureReason: "Payment processing error",
        },
      });
    } catch (updateError) {
      console.error("Error updating failed payment status:", updateError);
    }

    return NextResponse.json(
      { error: "Failed to complete payment" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
