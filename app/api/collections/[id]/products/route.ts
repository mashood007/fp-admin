import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productIds } = body;

        if (!productIds || !Array.isArray(productIds)) {
            return NextResponse.json(
                { error: "productIds array is required" },
                { status: 400 }
            );
        }

        // Verify collection exists
        const collection = await prisma.collection.findUnique({
            where: { id: params.id },
        });

        if (!collection) {
            return NextResponse.json(
                { error: "Collection not found" },
                { status: 404 }
            );
        }

        // Add products to collection (skip if already exists)
        const productCollections = await Promise.all(
            productIds.map(async (productId: string) => {
                return prisma.productCollection.upsert({
                    where: {
                        productId_collectionId: {
                            productId,
                            collectionId: params.id,
                        },
                    },
                    create: {
                        productId,
                        collectionId: params.id,
                    },
                    update: {},
                });
            })
        );

        return NextResponse.json({
            success: true,
            added: productCollections.length,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to add products to collection" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; productId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Extract productId from URL path
        const urlParts = request.url.split("/");
        const productId = urlParts[urlParts.length - 1];

        await prisma.productCollection.delete({
            where: {
                productId_collectionId: {
                    productId,
                    collectionId: params.id,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to remove product from collection" },
            { status: 500 }
        );
    }
}
