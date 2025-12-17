import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Add CORS headers for store-front access
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Allow all origins (or specify your store-front domain)
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const collectionId = searchParams.get("collection");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build where clause
    const where: any = {
      isActive: true, // Only return active products for store
    };

    if (category && category !== "unisex") {
      where.category = category;
    }

    if (collectionId) {
      where.collections = {
        some: {
          collectionId: collectionId,
        },
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where });

    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { orderNumber: "asc" },
        { name: "asc" },
      ],
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({
      products,
      pagination: {
        total: totalCount,
        limit: limit ? parseInt(limit) : products.length,
        offset: offset ? parseInt(offset) : 0,
      },
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

