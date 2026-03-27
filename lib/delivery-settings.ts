import { prisma } from "@/lib/prisma";

export const DEFAULT_DELIVERY_SETTINGS = {
  deliveryCharge: 15,
  minimumPurchaseForFreeDelivery: 200,
};

export type DeliverySettingsConfig = {
  deliveryCharge: number;
  minimumPurchaseForFreeDelivery: number;
};

export async function getDeliverySettingsConfig(): Promise<DeliverySettingsConfig> {
  const settings = await prisma.deliverySetting.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    select: {
      deliveryCharge: true,
      minimumPurchaseForFreeDelivery: true,
    },
  });

  if (!settings) {
    return DEFAULT_DELIVERY_SETTINGS;
  }

  return {
    deliveryCharge: settings.deliveryCharge,
    minimumPurchaseForFreeDelivery: settings.minimumPurchaseForFreeDelivery,
  };
}

export function calculateShippingCost(
  taxableAmount: number,
  settings: DeliverySettingsConfig
): number {
  return taxableAmount >= settings.minimumPurchaseForFreeDelivery
    ? 0
    : settings.deliveryCharge;
}
