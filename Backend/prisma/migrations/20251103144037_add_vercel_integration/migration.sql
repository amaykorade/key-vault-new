-- CreateTable
CREATE TABLE "public"."VercelIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vercelAccessToken" TEXT NOT NULL,
    "vercelTeamId" TEXT,
    "vercelTeamName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VercelIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FolderVercelSync" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "vercelProjectId" TEXT NOT NULL,
    "vercelProjectName" TEXT,
    "vercelEnvTarget" TEXT NOT NULL,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FolderVercelSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VercelIntegration_userId_idx" ON "public"."VercelIntegration"("userId");

-- CreateIndex
CREATE INDEX "VercelIntegration_organizationId_idx" ON "public"."VercelIntegration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "VercelIntegration_userId_organizationId_key" ON "public"."VercelIntegration"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "FolderVercelSync_projectId_idx" ON "public"."FolderVercelSync"("projectId");

-- CreateIndex
CREATE INDEX "FolderVercelSync_vercelProjectId_idx" ON "public"."FolderVercelSync"("vercelProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FolderVercelSync_projectId_environment_folder_key" ON "public"."FolderVercelSync"("projectId", "environment", "folder");

-- AddForeignKey
ALTER TABLE "public"."VercelIntegration" ADD CONSTRAINT "VercelIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VercelIntegration" ADD CONSTRAINT "VercelIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderVercelSync" ADD CONSTRAINT "FolderVercelSync_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
