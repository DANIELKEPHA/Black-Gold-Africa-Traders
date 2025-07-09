/*
  Warnings:

  - The values [UIBD] on the enum `Broker` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Broker_new" AS ENUM ('AMBR', 'ANJL', 'ATBL', 'ATLS', 'BICL', 'BTBL', 'CENT', 'COMK', 'CTBL', 'PRME', 'PTBL', 'TBEA', 'UNTB', 'VENS', 'TTBL', 'ABBL');
ALTER TABLE "Catalog" ALTER COLUMN "broker" TYPE "Broker_new" USING ("broker"::text::"Broker_new");
ALTER TABLE "SellingPrice" ALTER COLUMN "broker" TYPE "Broker_new" USING ("broker"::text::"Broker_new");
ALTER TABLE "OutLots" ALTER COLUMN "broker" TYPE "Broker_new" USING ("broker"::text::"Broker_new");
ALTER TABLE "Stocks" ALTER COLUMN "broker" TYPE "Broker_new" USING ("broker"::text::"Broker_new");
ALTER TYPE "Broker" RENAME TO "Broker_old";
ALTER TYPE "Broker_new" RENAME TO "Broker";
DROP TYPE "Broker_old";
COMMIT;
