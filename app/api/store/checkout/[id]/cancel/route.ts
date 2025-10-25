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

// POST /api/store/checkout/[id]/cancel - Cancel checkout process
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
    const { reason } = body;

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

    if (!["PENDING", "PROCESSING"].includes(checkout.paymentStatus)) {
      return NextResponse.json(
        { error: "Checkout cannot be cancelled at this stage" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Cancel checkout in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update checkout status
      const updatedCheckout = await tx.checkout.update({
        where: { id: params.id },
        data: {
          paymentStatus: "CANCELLED",
          failedAt: new Date(),
          failureReason: reason || "Cancelled by customer",
        },
      });

      // Keep order in PENDING status so customer can try checkout again
      // Or optionally cancel the order if needed
      
      return { checkout: updatedCheckout };
    });

    return NextResponse.json({
      message: "Checkout cancelled successfully",
      checkout: result.checkout,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error cancelling checkout:", error);
    return NextResponse.json(
      { error: "Failed to cancel checkout" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
