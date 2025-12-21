import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Add CORS headers for store-front access
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// GET /api/store/orders/track - Track guest order by email and order number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderNumber = searchParams.get("orderNumber");

    if (!email || !orderNumber) {
      return NextResponse.json(
        { error: "Email and order number are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Find order by order number and email
    // Join with customer to verify email matches (case-insensitive)
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.toUpperCase(),
        customer: {
          email: {
            equals: email.toLowerCase(),
            mode: 'insensitive',
          },
          isActive: false, // Only allow tracking for guest orders (inactive customers)
        },
      },
      include: {
        orderProducts: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    order: "asc",
                  },
                  take: 1,
                },
              },
            },
          },
        },
        checkout: true,
        deliveryOrder: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check your email and order number." },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ order }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error tracking order:", error);
    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
