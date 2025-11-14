-- DropIndex (only if exists)
DROP INDEX IF EXISTS "public"."EarlyAccessSignup_email_idx";

-- DropIndex (drop the unique constraint)
DROP INDEX IF EXISTS "public"."VercelIntegration_userId_organizationId_key";

-- AlterTable
ALTER TABLE "public"."FolderVercelSync" ADD COLUMN     "vercelIntegrationId" TEXT;

-- AlterTable
ALTER TABLE "public"."VercelIntegration" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Default';

-- CreateIndex
CREATE INDEX "FolderVercelSync_vercelIntegrationId_idx" ON "public"."FolderVercelSync"("vercelIntegrationId");

-- CreateIndex
CREATE INDEX "VercelIntegration_userId_organizationId_idx" ON "public"."VercelIntegration"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "public"."FolderVercelSync" ADD CONSTRAINT "FolderVercelSync_vercelIntegrationId_fkey" FOREIGN KEY ("vercelIntegrationId") REFERENCES "public"."VercelIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
