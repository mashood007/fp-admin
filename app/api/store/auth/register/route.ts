import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Add CORS headers for store-front access
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customerUser.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer already exists with this email" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create customer
    const customer = await prisma.customerUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Customer registered successfully",
      customer,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error registering customer:", error);
    return NextResponse.json(
      { error: "Failed to register customer" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
