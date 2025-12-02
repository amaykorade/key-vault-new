-- CreateTable
CREATE TABLE "public"."RenderIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "renderApiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',

    CONSTRAINT "RenderIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FolderRenderSync" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "renderServiceId" TEXT NOT NULL,
    "renderServiceName" TEXT,
    "renderEnvGroup" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "renderIntegrationId" TEXT,

    CONSTRAINT "FolderRenderSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenderIntegration_userId_idx" ON "public"."RenderIntegration"("userId");

-- CreateIndex
CREATE INDEX "RenderIntegration_organizationId_idx" ON "public"."RenderIntegration"("organizationId");

-- CreateIndex
CREATE INDEX "RenderIntegration_userId_organizationId_idx" ON "public"."RenderIntegration"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "FolderRenderSync_projectId_idx" ON "public"."FolderRenderSync"("projectId");

-- CreateIndex
CREATE INDEX "FolderRenderSync_renderServiceId_idx" ON "public"."FolderRenderSync"("renderServiceId");

-- CreateIndex
CREATE INDEX "FolderRenderSync_renderIntegrationId_idx" ON "public"."FolderRenderSync"("renderIntegrationId");

-- CreateIndex
CREATE UNIQUE INDEX "FolderRenderSync_projectId_environment_folder_key" ON "public"."FolderRenderSync"("projectId", "environment", "folder");

-- AddForeignKey
ALTER TABLE "public"."RenderIntegration" ADD CONSTRAINT "RenderIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenderIntegration" ADD CONSTRAINT "RenderIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderRenderSync" ADD CONSTRAINT "FolderRenderSync_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderRenderSync" ADD CONSTRAINT "FolderRenderSync_renderIntegrationId_fkey" FOREIGN KEY ("renderIntegrationId") REFERENCES "public"."RenderIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
