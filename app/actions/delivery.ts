"use server";

import { prisma } from "@/lib/prisma";
import { createDeliveryForOrder, getTracking, getAirwayBillLabel } from "@/lib/delivery";
import { revalidatePath } from "next/cache";

export async function createDeliveryAction(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderProducts: true,
            },
        });

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        const result = await createDeliveryForOrder(order);

        await prisma.deliveryOrder.create({
            data: {
                orderId: orderId,
                airwayBillNumber: result.AirwayBillNumber,
                destinationCode: result.DestinationCode,
                apiResponse: JSON.stringify(result),
                status: "GENERATED"
            }
        });

        revalidatePath(`/orders/${orderId}`);
        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to create delivery:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create delivery"
        };
    }
}

export async function getTrackingAction(awb: string) {
    try {
        const result = await getTracking(awb);
        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to get tracking:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get tracking"
        };
    }
}


export async function getAirwayBillLabelAction(awb: string) {
    try {
        const result = await getAirwayBillLabel(awb);
        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to get airway bill label:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get airway bill label"
        };
    }
}

