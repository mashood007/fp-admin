import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateFriendlyId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get category filter from query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Build where clause for filtering
    const whereClause: any = {};
    if (category) {
      whereClause.category = category;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, category, isActive, images } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First create the product to get the ID
    const product = await prisma.product.create({
      data: {
        name,
        friendlyId: "temp", // Temporary value, will be updated
        description: description || null,
        price: parseFloat(price),
        category: category || null,
        isActive: isActive ?? true,
        images: {
          create: images?.map((img: any, index: number) => ({
            url: img.url,
            alt: img.alt || null,
            order: index,
          })) || [],
        },
      },
      include: {
        images: true,
      },
    });

    // Update with the actual friendlyId using the generated ID
    const friendlyId = generateFriendlyId(name, category || null, product.id);
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { friendlyId },
      include: {
        images: true,
      },
    });

    return NextResponse.json(updatedProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

