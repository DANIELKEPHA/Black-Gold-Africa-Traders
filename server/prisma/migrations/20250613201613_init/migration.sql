-- CreateEnum
CREATE TYPE "TeaGrade" AS ENUM ('PD', 'PD2', 'DUST', 'DUST1', 'DUST2', 'PF', 'PF1', 'BP', 'BP1', 'FNGS1', 'BOP', 'BOPF', 'FNGS', 'FNGS2', 'BMF', 'BMFD', 'PF2', 'BMF1');

-- CreateEnum
CREATE TYPE "Broker" AS ENUM ('AMBR', 'ANJL', 'ATBL', 'ATLS', 'BICL', 'BTBL', 'CENT', 'COMK', 'CTBL', 'PRME', 'PTBL', 'TBEA', 'UNTB', 'VENS', 'TTBL');

-- CreateEnum
CREATE TYPE "TeaCategory" AS ENUM ('M1', 'M2', 'M3', 'S1');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled');

-- CreateEnum
CREATE TYPE "Vessel" AS ENUM ('first', 'second', 'third', 'fourth');

-- CreateEnum
CREATE TYPE "PackagingInstructions" AS ENUM ('oneJutetwoPolly', 'oneJuteOnePolly');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userCognitoId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" SERIAL NOT NULL,
    "broker" "Broker" NOT NULL,
    "lotNo" TEXT NOT NULL,
    "sellingMark" TEXT NOT NULL,
    "grade" "TeaGrade" NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "saleCode" TEXT NOT NULL,
    "category" "TeaCategory" NOT NULL,
    "reprint" INTEGER NOT NULL DEFAULT 0,
    "bags" INTEGER NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "askingPrice" DOUBLE PRECISION NOT NULL,
    "producerCountry" TEXT,
    "manufactureDate" TIMESTAMP(3) NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellingPrice" (
    "id" SERIAL NOT NULL,
    "broker" "Broker" NOT NULL,
    "lotNo" TEXT NOT NULL,
    "sellingMark" TEXT NOT NULL,
    "grade" "TeaGrade" NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "saleCode" TEXT NOT NULL,
    "category" "TeaCategory" NOT NULL,
    "reprint" INTEGER NOT NULL DEFAULT 0,
    "bags" INTEGER NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "askingPrice" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "producerCountry" TEXT,
    "manufactureDate" TIMESTAMP(3) NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellingPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutLots" (
    "id" SERIAL NOT NULL,
    "auction" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "broker" "Broker" NOT NULL,
    "sellingMark" TEXT NOT NULL,
    "grade" "TeaGrade" NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "bags" INTEGER NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "baselinePrice" DOUBLE PRECISION NOT NULL,
    "manufactureDate" TIMESTAMP(3) NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutLots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stocks" (
    "id" SERIAL NOT NULL,
    "saleCode" TEXT NOT NULL,
    "broker" "Broker" NOT NULL,
    "lotNo" TEXT NOT NULL,
    "mark" TEXT NOT NULL,
    "grade" "TeaGrade" NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "bags" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "purchaseValue" DOUBLE PRECISION NOT NULL,
    "totalPurchaseValue" DOUBLE PRECISION NOT NULL,
    "agingDays" INTEGER NOT NULL,
    "penalty" DOUBLE PRECISION NOT NULL,
    "bgtCommission" DOUBLE PRECISION NOT NULL,
    "maerskFee" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "netPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAssignment" (
    "id" SERIAL NOT NULL,
    "stocksId" INTEGER NOT NULL,
    "userCognitoId" TEXT NOT NULL,
    "assignedWeight" DOUBLE PRECISION NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "userCognitoId" TEXT NOT NULL,
    "adminCognitoId" TEXT,
    "consignee" TEXT NOT NULL,
    "vessel" "Vessel" NOT NULL,
    "shipmark" TEXT NOT NULL,
    "packagingInstructions" "PackagingInstructions" NOT NULL,
    "additionalInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "stocksId" INTEGER NOT NULL,
    "assignedWeight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockHistory" (
    "id" SERIAL NOT NULL,
    "stocksId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userCognitoId" TEXT,
    "adminCognitoId" TEXT,

    CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentHistory" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userCognitoId" TEXT,
    "adminCognitoId" TEXT,
    "details" JSONB,

    CONSTRAINT "ShipmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" SERIAL NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_adminCognitoId_key" ON "Admin"("adminCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_userCognitoId_key" ON "User"("userCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Catalog_lotNo_key" ON "Catalog"("lotNo");

-- CreateIndex
CREATE INDEX "Catalog_lotNo_saleCode_idx" ON "Catalog"("lotNo", "saleCode");

-- CreateIndex
CREATE UNIQUE INDEX "SellingPrice_lotNo_key" ON "SellingPrice"("lotNo");

-- CreateIndex
CREATE INDEX "SellingPrice_lotNo_saleCode_idx" ON "SellingPrice"("lotNo", "saleCode");

-- CreateIndex
CREATE UNIQUE INDEX "OutLots_lotNo_key" ON "OutLots"("lotNo");

-- CreateIndex
CREATE INDEX "OutLots_lotNo_auction_idx" ON "OutLots"("lotNo", "auction");

-- CreateIndex
CREATE UNIQUE INDEX "Stocks_lotNo_key" ON "Stocks"("lotNo");

-- CreateIndex
CREATE INDEX "Stocks_lotNo_saleCode_idx" ON "Stocks"("lotNo", "saleCode");

-- CreateIndex
CREATE INDEX "StockAssignment_userCognitoId_assignedAt_idx" ON "StockAssignment"("userCognitoId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockAssignment_stocksId_userCognitoId_key" ON "StockAssignment"("stocksId", "userCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmark_key" ON "Shipment"("shipmark");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_stocksId_key" ON "ShipmentItem"("shipmentId", "stocksId");

-- CreateIndex
CREATE INDEX "ShipmentHistory_shipmentId_timestamp_idx" ON "ShipmentHistory"("shipmentId", "timestamp");

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellingPrice" ADD CONSTRAINT "SellingPrice_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutLots" ADD CONSTRAINT "OutLots_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stocks" ADD CONSTRAINT "Stocks_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAssignment" ADD CONSTRAINT "StockAssignment_stocksId_fkey" FOREIGN KEY ("stocksId") REFERENCES "Stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAssignment" ADD CONSTRAINT "StockAssignment_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_stocksId_fkey" FOREIGN KEY ("stocksId") REFERENCES "Stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_stocksId_fkey" FOREIGN KEY ("stocksId") REFERENCES "Stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentHistory" ADD CONSTRAINT "ShipmentHistory_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentHistory" ADD CONSTRAINT "ShipmentHistory_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentHistory" ADD CONSTRAINT "ShipmentHistory_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;
