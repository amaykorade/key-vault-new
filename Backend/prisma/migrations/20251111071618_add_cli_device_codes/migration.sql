-- CreateTable
CREATE TABLE "public"."CliDeviceCode" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "userId" TEXT,
    "cliTokenId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "CliDeviceCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CliDeviceCode_deviceCode_key" ON "public"."CliDeviceCode"("deviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "CliDeviceCode_userCode_key" ON "public"."CliDeviceCode"("userCode");

-- CreateIndex
CREATE INDEX "CliDeviceCode_deviceCode_idx" ON "public"."CliDeviceCode"("deviceCode");

-- CreateIndex
CREATE INDEX "CliDeviceCode_userCode_idx" ON "public"."CliDeviceCode"("userCode");

-- CreateIndex
CREATE INDEX "CliDeviceCode_userId_idx" ON "public"."CliDeviceCode"("userId");

-- AddForeignKey
ALTER TABLE "public"."CliDeviceCode" ADD CONSTRAINT "CliDeviceCode_cliTokenId_fkey" FOREIGN KEY ("cliTokenId") REFERENCES "public"."CliToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
