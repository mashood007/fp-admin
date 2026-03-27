-- CreateTable
CREATE TABLE "delivery_settings" (
    "id" TEXT NOT NULL,
    "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "minimumPurchaseForFreeDelivery" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_settings_pkey" PRIMARY KEY ("id")
);
