-- AlterTable
ALTER TABLE "public"."Secret" ADD COLUMN     "environment" TEXT NOT NULL DEFAULT 'development';

-- CreateIndex
CREATE INDEX "Secret_environment_idx" ON "public"."Secret"("environment");
