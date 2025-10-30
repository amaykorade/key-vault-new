/*
  Warnings:

  - You are about to drop the `UserApiKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ApiTokenScope" AS ENUM ('READ_SECRETS', 'WRITE_SECRETS', 'MANAGE_MEMBERS', 'ADMIN');

-- DropForeignKey
ALTER TABLE "public"."UserApiKey" DROP CONSTRAINT "UserApiKey_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserApiKey" DROP CONSTRAINT "UserApiKey_userId_fkey";

-- DropTable
DROP TABLE "public"."UserApiKey";

-- CreateTable
CREATE TABLE "public"."ApiToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT NOT NULL,
    "scopes" "public"."ApiTokenScope"[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "ipAllowlist" TEXT[],
    "userAgentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenPrefix_key" ON "public"."ApiToken"("tokenPrefix");

-- CreateIndex
CREATE INDEX "ApiToken_userId_idx" ON "public"."ApiToken"("userId");

-- CreateIndex
CREATE INDEX "ApiToken_organizationId_idx" ON "public"."ApiToken"("organizationId");

-- CreateIndex
CREATE INDEX "ApiToken_projectId_idx" ON "public"."ApiToken"("projectId");

-- CreateIndex
CREATE INDEX "ApiToken_expiresAt_idx" ON "public"."ApiToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiToken" ADD CONSTRAINT "ApiToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiToken" ADD CONSTRAINT "ApiToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
