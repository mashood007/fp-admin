import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Find customer
    const customer = await prisma.customerUser.findUnique({
      where: { email },
    });

    if (!customer || !customer.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Check if account is active
    if (!customer.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer.id,
        email: customer.email,
        type: 'customer'
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    // Return customer info without password
    const customerData = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
    };

    return NextResponse.json({
      message: "Login successful",
      customer: customerData,
      token,
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error("Error logging in customer:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
