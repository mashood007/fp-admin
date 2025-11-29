import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collection = await prisma.collection.findUnique({
            where: { id: params.id },
            include: {
                products: {
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
                { status: 404 }
            );
        }

        return NextResponse.json(collection);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch collection" },
            { status: 500 }
        );
    }
}

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
        const { title, imageUrl, description } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const collection = await prisma.collection.update({
            where: { id: params.id },
            data: {
                title,
                imageUrl: imageUrl || null,
                description: description || null,
            },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json(collection);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update collection" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.collection.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete collection" },
            { status: 500 }
        );
    }
}
