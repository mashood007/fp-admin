import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DELIVERY_SETTINGS } from "@/lib/delivery-settings";

// GET /api/delivery-settings - Admin fetch current delivery settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.deliverySetting.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      settings ?? {
        id: null,
        ...DEFAULT_DELIVERY_SETTINGS,
        isActive: true,
      }
    );
  } catch (error) {
    console.error("Error fetching delivery settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery settings" },
      { status: 500 }
    );
  }
}

// PUT /api/delivery-settings - Admin create/update delivery settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deliveryCharge, minimumPurchaseForFreeDelivery } = body;

    const parsedDeliveryCharge = Number(deliveryCharge);
    const parsedMinimumPurchase = Number(minimumPurchaseForFreeDelivery);

    if (!Number.isFinite(parsedDeliveryCharge) || parsedDeliveryCharge < 0) {
      return NextResponse.json(
        { error: "Delivery charge must be a number greater than or equal to 0" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(parsedMinimumPurchase) || parsedMinimumPurchase < 0) {
      return NextResponse.json(
        {
          error:
            "Minimum purchase for free delivery must be a number greater than or equal to 0",
        },
        { status: 400 }
      );
    }

    const existingSettings = await prisma.deliverySetting.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const settings = existingSettings
      ? await prisma.deliverySetting.update({
          where: { id: existingSettings.id },
          data: {
            deliveryCharge: parsedDeliveryCharge,
            minimumPurchaseForFreeDelivery: parsedMinimumPurchase,
            isActive: true,
          },
        })
      : await prisma.deliverySetting.create({
          data: {
            deliveryCharge: parsedDeliveryCharge,
            minimumPurchaseForFreeDelivery: parsedMinimumPurchase,
            isActive: true,
          },
        });

    return NextResponse.json({
      message: "Delivery settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("Error saving delivery settings:", error);
    return NextResponse.json(
      { error: "Failed to save delivery settings" },
      { status: 500 }
    );
  }
}
