import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Add CORS headers for store-front access
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${new Date().getFullYear()}-${timestamp}-${random}`;
}

// GET /api/store/orders - Get customer's orders
export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyCustomerToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders() }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {
      customerId: tokenData.customerId,
    };

    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.order.count({ where });

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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
                  take: 1, // Only get first image for listing
                },
              },
            },
          },
        },
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({
      orders,
      pagination: {
        total: totalCount,
        limit: limit ? parseInt(limit) : orders.length,
        offset: offset ? parseInt(offset) : 0,
      },
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// POST /api/store/orders - Create new order
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
      items, // Array of { productId, quantity }
      shippingAddress,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Get customer details
    const customer = await prisma.customerUser.findUnique({
      where: { id: tokenData.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Validate and get products
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Some products are not available" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const orderProducts = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error("Product not found");
      
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      
      return {
        productId: product.id,
        productName: product.name,
        productDescription: product.description,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    const shippingCost = 0; // TODO: Calculate based on location/weight
    const taxAmount = 0; // TODO: Calculate tax
    const discountAmount = 0; // TODO: Apply discounts
    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          status: "PENDING",
          subtotal,
          shippingCost,
          taxAmount,
          discountAmount,
          totalAmount,
          shippingName: shippingAddress.name,
          shippingEmail: shippingAddress.email || customer.email,
          shippingPhone: shippingAddress.phone,
          shippingAddress1: shippingAddress.address1,
          shippingAddress2: shippingAddress.address2,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingZip: shippingAddress.zip,
          shippingCountry: shippingAddress.country,
          notes,
        },
      });

      // Create order products
      await tx.orderProduct.createMany({
        data: orderProducts.map(op => ({
          ...op,
          orderId: newOrder.id,
        })),
      });

      return newOrder;
    });

    // Fetch complete order with products
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
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
      message: "Order created successfully",
      order: completeOrder,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
