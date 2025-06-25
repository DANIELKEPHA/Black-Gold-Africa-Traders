-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "privacyConsent" BOOLEAN NOT NULL,
    "userCognitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "User"("userCognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
