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
        const limit = searchParams.get("limit");
        const offset = searchParams.get("offset");

        // Fetch collections with product counts
        const collections = await prisma.collection.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                products: {
                    where: {
                        product: {
                            isActive: true, // Only count active products
                        },
                    },
                    include: {
                        product: {
                            include: {
                                images: {
                                    orderBy: {
                                        order: "asc",
                                    },
                                    take: 1, // Only include first image for performance
                                },
                            },
                        },
                    },
                },
            },
            take: limit ? parseInt(limit) : undefined,
            skip: offset ? parseInt(offset) : undefined,
        });

        // Transform to include product count and filter out collections with no active products
        const collectionsWithCount = collections
            .map((collection: any) => ({
                id: collection.id,
                title: collection.title,
                imageUrl: collection.imageUrl,
                description: collection.description,
                productCount: collection.products.length,
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
            }))
            .filter((collection: any) => collection.productCount > 0); // Only return collections with active products

        // Get total count
        const totalCount = await prisma.collection.count();

        return NextResponse.json(
            {
                collections: collectionsWithCount,
                pagination: {
                    total: totalCount,
                    limit: limit ? parseInt(limit) : collectionsWithCount.length,
                    offset: offset ? parseInt(offset) : 0,
                },
            },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error("Error fetching collections:", error);
        return NextResponse.json(
            { error: "Failed to fetch collections" },
            { status: 500, headers: corsHeaders() }
        );
    }
}
