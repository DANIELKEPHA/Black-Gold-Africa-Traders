-- AlterTable
ALTER TABLE "StockHistory" ADD COLUMN     "details" JSONB,
ADD COLUMN     "shipmentId" INTEGER;

-- AlterTable
ALTER TABLE "Stocks" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "lowStockThreshold" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "userCognitoId" TEXT NOT NULL,
    "stocksId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userCognitoId_stocksId_key" ON "Favorite"("userCognitoId", "stocksId");

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_stocksId_fkey" FOREIGN KEY ("stocksId") REFERENCES "Stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
