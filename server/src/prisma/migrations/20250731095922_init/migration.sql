-- AlterTable
ALTER TABLE "OutLots" ADD COLUMN     "sold" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminCognitoId" TEXT NOT NULL,
    "userCognitoId" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_adminCognitoId_uploadedAt_idx" ON "Report"("adminCognitoId", "uploadedAt");

-- CreateIndex
CREATE INDEX "Report_userCognitoId_uploadedAt_idx" ON "Report"("userCognitoId", "uploadedAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "Admin"("adminCognitoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
