-- CreateTable
CREATE TABLE "public"."UserApiToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "projects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "environments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "folders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserApiToken_tokenHash_key" ON "public"."UserApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UserApiToken_userId_idx" ON "public"."UserApiToken"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserApiToken" ADD CONSTRAINT "UserApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
