import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collections = await prisma.collection.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // Transform to include product count
        const collectionsWithCount = collections.map((collection) => ({
            ...collection,
            productCount: collection.products.length,
        }));

        return NextResponse.json(collectionsWithCount);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch collections" },
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
        const { title, imageUrl, description, productIds } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const collection = await prisma.collection.create({
            data: {
                title,
                imageUrl: imageUrl || null,
                description: description || null,
                products: {
                    create: productIds?.map((productId: string) => ({
                        productId,
                    })) || [],
                },
            },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json(collection, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create collection" },
            { status: 500 }
        );
    }
}
