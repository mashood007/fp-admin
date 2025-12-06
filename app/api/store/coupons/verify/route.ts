import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Add CORS headers for store-front access
function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// POST /api/store/coupons/verify - Verify coupon code
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, orderAmount } = body;

        if (!code || !code.trim()) {
            return NextResponse.json(
                { valid: false, error: "Coupon code is required" },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Find coupon by code (case-insensitive)
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.trim().toUpperCase() },
        });

        if (!coupon) {
            return NextResponse.json(
                { valid: false, error: "Coupon not found" },
                { status: 404, headers: corsHeaders() }
            );
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return NextResponse.json(
                { valid: false, error: "Coupon is no longer active" },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Check if coupon has expired
        if (new Date(coupon.expiresAt) <= new Date()) {
            return NextResponse.json(
                { valid: false, error: "Coupon has expired" },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Calculate discount
        const discount = orderAmount ? (orderAmount * coupon.discountPercent) / 100 : 0;

        return NextResponse.json(
            {
                valid: true,
                code: coupon.code,
                description: coupon.description,
                discountPercent: coupon.discountPercent,
                discount: parseFloat(discount.toFixed(2)),
            },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error("Error verifying coupon:", error);
        return NextResponse.json(
            { valid: false, error: "Failed to verify coupon" },
            { status: 500, headers: corsHeaders() }
        );
    }
}
