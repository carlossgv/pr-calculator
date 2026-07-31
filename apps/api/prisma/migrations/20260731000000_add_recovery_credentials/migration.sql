ALTER TABLE "Account"
ADD COLUMN "recoveryId" TEXT,
ADD COLUMN "recoveryPasswordSalt" TEXT,
ADD COLUMN "recoveryPasswordDerived" TEXT,
ADD COLUMN "recoveryPasswordVersion" INTEGER;

CREATE UNIQUE INDEX "Account_recoveryId_key" ON "Account"("recoveryId");
