import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Add CORS headers for store-front access
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Allow all origins (or specify your store-front domain)
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find product by friendlyId first, then by regular id
    let product = await prisma.product.findFirst({
      where: {
        AND: [
          { isActive: true }, // Only return active products for store
          {
            OR: [
              { friendlyId: params.id },
              { id: params.id }
            ]
          }
        ]
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json(product, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { availableStock } = body;

    if (typeof availableStock !== 'number' || availableStock < 0) {
      return NextResponse.json(
        { error: "Invalid stock value. Must be a non-negative number." },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Try to find and update product by friendlyId first, then by regular id
    const updatedProduct = await prisma.product.updateMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { friendlyId: params.id },
              { id: params.id }
            ]
          }
        ]
      },
      data: {
        availableStock: availableStock
      }
    });

    if (updatedProduct.count === 0) {
      return NextResponse.json(
        { error: "Product not found or inactive" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Fetch the updated product to return it
    const product = await prisma.product.findFirst({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { friendlyId: params.id },
              { id: params.id }
            ]
          }
        ]
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(product, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error updating product stock:", error);
    return NextResponse.json(
      { error: "Failed to update product stock" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

