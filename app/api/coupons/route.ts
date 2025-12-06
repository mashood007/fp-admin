import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/coupons - List all coupons
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });

        // Add expired status to each coupon
        const couponsWithStatus = coupons.map((coupon) => ({
            ...coupon,
            isExpired: new Date(coupon.expiresAt) < new Date(),
        }));

        return NextResponse.json(couponsWithStatus);
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json(
            { error: "Failed to fetch coupons" },
            { status: 500 }
        );
    }
}

// POST /api/coupons - Create new coupon
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { code, description, discountPercent, expiresAt, isActive } = body;

        // Validation
        if (!code || !code.trim()) {
            return NextResponse.json(
                { error: "Coupon code is required" },
                { status: 400 }
            );
        }

        if (discountPercent === undefined || discountPercent < 0 || discountPercent > 100) {
            return NextResponse.json(
                { error: "Discount percent must be between 0 and 100" },
                { status: 400 }
            );
        }

        if (!expiresAt) {
            return NextResponse.json(
                { error: "Expiry date is required" },
                { status: 400 }
            );
        }

        const expiryDate = new Date(expiresAt);
        if (expiryDate <= new Date()) {
            return NextResponse.json(
                { error: "Expiry date must be in the future" },
                { status: 400 }
            );
        }

        // Convert code to uppercase
        const upperCode = code.trim().toUpperCase();

        // Check if code already exists
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: upperCode },
        });

        if (existingCoupon) {
            return NextResponse.json(
                { error: "Coupon code already exists" },
                { status: 400 }
            );
        }

        // Create coupon
        const coupon = await prisma.coupon.create({
            data: {
                code: upperCode,
                description,
                discountPercent: parseFloat(discountPercent.toString()),
                expiresAt: expiryDate,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({
            message: "Coupon created successfully",
            coupon,
        });
    } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json(
            { error: "Failed to create coupon" },
            { status: 500 }
        );
    }
}
