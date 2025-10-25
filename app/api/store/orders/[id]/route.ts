import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Add CORS headers for store-front access
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
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

// GET /api/store/orders/[id] - Get single order details
export async function GET(
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

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
        customerId: tokenData.customerId, // Ensure customer can only access their own orders
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
                },
              },
            },
          },
        },
        checkout: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ order }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// PUT /api/store/orders/[id] - Update order (limited customer actions)
export async function PUT(
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
    const { action, cancelReason } = body;

    // Verify order belongs to customer
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: params.id,
        customerId: tokenData.customerId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Handle different customer actions
    if (action === "cancel") {
      // Only allow cancellation if order is in pending or confirmed status
      if (!["PENDING", "CONFIRMED"].includes(existingOrder.status)) {
        return NextResponse.json(
          { error: "Order cannot be cancelled at this stage" },
          { status: 400, headers: corsHeaders() }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: cancelReason || "Cancelled by customer",
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
                  },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        message: "Order cancelled successfully",
        order: updatedOrder,
      }, { headers: corsHeaders() });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400, headers: corsHeaders() }
    );

  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
