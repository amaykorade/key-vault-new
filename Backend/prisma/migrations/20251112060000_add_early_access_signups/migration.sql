-- CreateTable
CREATE TABLE "public"."EarlyAccessSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "developerType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarlyAccessSignup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EarlyAccessSignup_email_key" UNIQUE ("email")
);

-- CreateIndex
CREATE INDEX "EarlyAccessSignup_email_idx" ON "public"."EarlyAccessSignup" ("email");
