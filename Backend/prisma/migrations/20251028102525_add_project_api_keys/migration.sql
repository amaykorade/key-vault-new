/*
  Warnings:

  - You are about to drop the `ApiToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ApiToken" DROP CONSTRAINT "ApiToken_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ApiToken" DROP CONSTRAINT "ApiToken_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ApiToken" DROP CONSTRAINT "ApiToken_userId_fkey";

-- DropTable
DROP TABLE "public"."ApiToken";

-- DropEnum
DROP TYPE "public"."ApiTokenScope";

-- CreateTable
CREATE TABLE "public"."ProjectApiKey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" JSONB,
    "environments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "folders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectApiKey_tokenHash_key" ON "public"."ProjectApiKey"("tokenHash");

-- CreateIndex
CREATE INDEX "ProjectApiKey_projectId_idx" ON "public"."ProjectApiKey"("projectId");

-- AddForeignKey
ALTER TABLE "public"."ProjectApiKey" ADD CONSTRAINT "ProjectApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectApiKey" ADD CONSTRAINT "ProjectApiKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
