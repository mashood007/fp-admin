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
    const isGuestOrder = !tokenData;

    const body = await request.json();
    const {
      items, // Array of { productId, quantity }
      shippingAddress,
      notes,
      couponCode, // Optional coupon code
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

    let customer;

    if (isGuestOrder) {
      // Create a guest customer record
      customer = await prisma.customerUser.create({
        data: {
          email: shippingAddress.email || `guest-${Date.now()}@example.com`,
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          shippingAddress1: shippingAddress.address1,
          shippingAddress2: shippingAddress.address2,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingZip: shippingAddress.zip,
          shippingCountry: shippingAddress.country,
          isActive: false, // Mark as inactive guest customer
        },
      });
    } else {
      // Get authenticated customer details
      customer = await prisma.customerUser.findUnique({
        where: { id: tokenData.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404, headers: corsHeaders() }
        );
      }
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

    // Verify and apply coupon if provided
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let couponDiscount = 0;

    if (couponCode && couponCode.trim()) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "Invalid coupon code" },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!coupon.isActive) {
        return NextResponse.json(
          { error: "Coupon is no longer active" },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (new Date(coupon.expiresAt) <= new Date()) {
        return NextResponse.json(
          { error: "Coupon has expired" },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Apply discount
      couponId = coupon.id;
      appliedCouponCode = coupon.code;
      couponDiscount = (subtotal * coupon.discountPercent) / 100;
    }

    // Calculate taxable amount first (after coupon discount)
    const taxableAmount = Math.max(0, subtotal - couponDiscount);

    // Calculate shipping cost: Free for orders >= 250 AED, otherwise 15 AED
    // Shipping is calculated based on taxable amount (after discount)
    const shippingCost = taxableAmount >= 200 ? 0 : 15;

    const taxAmount = (taxableAmount) * 0.05; // 5% VAT on taxable amount + shipping
    const discountAmount = couponDiscount;
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
          couponId,
          couponCode: appliedCouponCode,
          couponDiscount,
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
      isGuestOrder,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
