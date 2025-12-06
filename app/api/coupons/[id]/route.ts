import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/coupons/[id] - Delete coupon
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        // Check if coupon exists
        const coupon = await prisma.coupon.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });

        if (!coupon) {
            return NextResponse.json(
                { error: "Coupon not found" },
                { status: 404 }
            );
        }

        // Check if coupon has been used in any orders
        if (coupon._count.orders > 0) {
            // Soft delete by deactivating instead of deleting
            await prisma.coupon.update({
                where: { id },
                data: { isActive: false },
            });

            return NextResponse.json({
                message: "Coupon has been deactivated (it has been used in orders)",
            });
        }

        // Hard delete if never used
        await prisma.coupon.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Coupon deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return NextResponse.json(
            { error: "Failed to delete coupon" },
            { status: 500 }
        );
    }
}
