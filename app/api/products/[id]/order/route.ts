import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderNumber } = body;

    if (orderNumber === undefined || typeof orderNumber !== "number") {
      return NextResponse.json(
        { error: "orderNumber is required and must be a number" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        orderNumber,
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product order:", error);
    return NextResponse.json(
      { error: "Failed to update product order" },
      { status: 500 }
    );
  }
}