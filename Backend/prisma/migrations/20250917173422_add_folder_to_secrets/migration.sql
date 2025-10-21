/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name,environment,folder]` on the table `Secret` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Secret" ADD COLUMN     "folder" TEXT DEFAULT 'default';

-- CreateIndex
CREATE INDEX "Secret_folder_idx" ON "public"."Secret"("folder");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_projectId_name_environment_folder_key" ON "public"."Secret"("projectId", "name", "environment", "folder");
