-- AlterTable
ALTER TABLE "products" ADD COLUMN     "availableStock" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "orderNumber" INTEGER NOT NULL DEFAULT 0;
