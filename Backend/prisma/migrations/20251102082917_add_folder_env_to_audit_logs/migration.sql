-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "environment" TEXT,
ADD COLUMN     "folder" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "tokenId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_environment_idx" ON "public"."AuditLog"("environment");

-- CreateIndex
CREATE INDEX "AuditLog_folder_idx" ON "public"."AuditLog"("folder");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "public"."AuditLog"("resourceType");
