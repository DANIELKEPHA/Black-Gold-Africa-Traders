-- DropForeignKey
ALTER TABLE "Catalog" DROP CONSTRAINT "Catalog_adminCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "OutLots" DROP CONSTRAINT "OutLots_adminCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "SellingPrice" DROP CONSTRAINT "SellingPrice_adminCognitoId_fkey";

-- AlterTable
ALTER TABLE "Catalog" ALTER COLUMN "adminCognitoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OutLots" ADD COLUMN     "userCognitoId" TEXT,
ALTER COLUMN "adminCognitoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SellingPrice" ADD COLUMN     "userCognitoId" TEXT,
ALTER COLUMN "adminCognitoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellingPrice" ADD CONSTRAINT "SellingPrice_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutLots" ADD CONSTRAINT "OutLots_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
