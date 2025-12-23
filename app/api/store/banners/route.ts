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
    // Fetch all banners ordered by creation date (newest first)
    const banners = await prisma.banner.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      banners,
      count: banners.length,
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
