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

export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyCustomerToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders() }
      );
    }

    const customer = await prisma.customerUser.findUnique({
      where: { id: tokenData.customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCity: true,
        shippingState: true,
        shippingZip: true,
        shippingCountry: true,
        billingAddress1: true,
        billingAddress2: true,
        billingCity: true,
        billingState: true,
        billingZip: true,
        billingCountry: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ customer }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      name,
      phone,
      shippingAddress1,
      shippingAddress2,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      billingAddress1,
      billingAddress2,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
    } = body;

    // Update customer profile
    const updatedCustomer = await prisma.customerUser.update({
      where: { id: tokenData.customerId },
      data: {
        name,
        phone,
        shippingAddress1,
        shippingAddress2,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        billingAddress1,
        billingAddress2,
        billingCity,
        billingState,
        billingZip,
        billingCountry,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCity: true,
        shippingState: true,
        shippingZip: true,
        shippingCountry: true,
        billingAddress1: true,
        billingAddress2: true,
        billingCity: true,
        billingState: true,
        billingZip: true,
        billingCountry: true,
        isActive: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      customer: updatedCustomer,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error updating customer profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
