-- CreateEnum
CREATE TYPE "public"."SecretType" AS ENUM ('API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'OAUTH_CLIENT_SECRET', 'WEBHOOK_SECRET', 'SSH_KEY', 'CERTIFICATE', 'PASSWORD', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Secret" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."SecretType" NOT NULL DEFAULT 'API_KEY',
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Secret_projectId_idx" ON "public"."Secret"("projectId");

-- CreateIndex
CREATE INDEX "Secret_createdById_idx" ON "public"."Secret"("createdById");

-- CreateIndex
CREATE INDEX "Secret_type_idx" ON "public"."Secret"("type");

-- AddForeignKey
ALTER TABLE "public"."Secret" ADD CONSTRAINT "Secret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Secret" ADD CONSTRAINT "Secret_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
