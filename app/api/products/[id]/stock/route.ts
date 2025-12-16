import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { availableStock } = body;

    if (availableStock === undefined || availableStock < 0) {
      return NextResponse.json(
        { error: "Available stock must be a non-negative number" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        availableStock: parseInt(availableStock),
      },
      select: {
        id: true,
        name: true,
        availableStock: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update product stock" },
      { status: 500 }
    );
  }
}