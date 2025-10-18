import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

