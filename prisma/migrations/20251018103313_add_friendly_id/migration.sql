/*
  Warnings:

  - A unique constraint covering the columns `[friendlyId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendlyId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "friendlyId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_friendlyId_key" ON "products"("friendlyId");
