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

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const collection = await prisma.collection.findUnique({
            where: { id: params.id },
            include: {
                products: {
                    where: {
                        product: {
                            isActive: true, // Only include active products
                        },
                    },
                    include: {
                        product: {
                            include: {
                                images: {
                                    orderBy: {
                                        order: "asc",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!collection) {
            return NextResponse.json(
                { error: "Collection not found" },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Transform to include only active products
        const transformedCollection = {
            id: collection.id,
            title: collection.title,
            imageUrl: collection.imageUrl,
            description: collection.description,
            products: collection.products.map((pc) => pc.product),
            productCount: collection.products.length,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
        };

        return NextResponse.json(transformedCollection, { headers: corsHeaders() });
    } catch (error) {
        console.error("Error fetching collection:", error);
        return NextResponse.json(
            { error: "Failed to fetch collection" },
            { status: 500, headers: corsHeaders() }
        );
    }
}
