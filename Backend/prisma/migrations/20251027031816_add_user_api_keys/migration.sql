-- CreateTable
CREATE TABLE "public"."UserApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "allowedProjects" TEXT[],
    "permissions" JSONB NOT NULL,
    "rateLimit" INTEGER,
    "ipWhitelist" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserApiKey_userId_idx" ON "public"."UserApiKey"("userId");

-- CreateIndex
CREATE INDEX "UserApiKey_organizationId_idx" ON "public"."UserApiKey"("organizationId");

-- CreateIndex
CREATE INDEX "UserApiKey_keyHash_idx" ON "public"."UserApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "UserApiKey_keyHash_key" ON "public"."UserApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "public"."UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserApiKey" ADD CONSTRAINT "UserApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
